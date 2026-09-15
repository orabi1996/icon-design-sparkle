-- Scope: protect request_types without changing unrelated legacy settings.
-- Additive/no data rewrite. Deploy this migration BEFORE the RPC-based UI.
BEGIN;
LOCK TABLE public.app_settings IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
REVOKE TRUNCATE ON public.app_settings FROM anon, authenticated;

-- A restrictive policy is ANDed with existing permissive/demo policies.
-- Protect both OLD and NEW rows: renaming into/out of the section is blocked.
CREATE POLICY request_types_rpc_only ON public.app_settings
AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (section <> 'request_types')
WITH CHECK (section <> 'request_types');

CREATE FUNCTION public.get_request_type_settings()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_value text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_permissions_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'إعدادات أنواع الطلبات متاحة لمدير النظام فقط';
  END IF;
  SELECT value INTO v_value FROM public.app_settings
  WHERE section = 'request_types' AND key = 'configs';
  RETURN jsonb_build_object('exists', FOUND, 'value', v_value);
END $$;

CREATE FUNCTION public.save_request_type_settings(p_configs jsonb, p_expected_value text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_current text;
  v_item jsonb;
  v_step jsonb;
  v_chain jsonb;
  v_normalized jsonb := '[]'::jsonb;
  v_ids text[] := ARRAY[]::text[];
  v_codes text[] := ARRAY[]::text[];
  v_field text;
  v_text text;
  v_sla numeric;
  v_keys text[] := ARRAY['id','code','name','category','approval_chain',
    'max_sla_hours','requires_attachment','allow_cancel','status'];
BEGIN
  -- Authority comes from user_roles, never signup metadata or the UI.
  IF auth.uid() IS NULL OR NOT public.is_permissions_admin() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'إعدادات أنواع الطلبات متاحة لمدير النظام فقط';
  END IF;
  IF p_configs IS NULL OR jsonb_typeof(p_configs) <> 'array' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'إعدادات أنواع الطلبات يجب أن تكون قائمة';
  END IF;
  IF jsonb_array_length(p_configs) NOT BETWEEN 1 AND 200 OR octet_length(p_configs::text) > 524288 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'عدد أنواع الطلبات يجب أن يكون من 1 إلى 200 ضمن الحد المسموح';
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_configs) LOOP
    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'نوع طلب غير صحيح';
    END IF;
    IF NOT (v_item ?& v_keys)
      OR EXISTS (SELECT 1 FROM jsonb_object_keys(v_item) AS k(key) WHERE NOT k.key = ANY(v_keys)) THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'حقول نوع الطلب غير مكتملة أو غير مسموح بها';
    END IF;
    FOREACH v_field IN ARRAY ARRAY['id','code','name','category','status'] LOOP
      IF jsonb_typeof(v_item->v_field) <> 'string' THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'نوع الحقل غير صحيح';
      END IF;
      v_text := btrim(v_item->>v_field);
      IF v_text ~ '[[:cntrl:]]' THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'محارف غير مسموح بها';
      END IF;
      v_item := jsonb_set(v_item, ARRAY[v_field], to_jsonb(v_text));
    END LOOP;
    v_item := jsonb_set(v_item, '{code}', to_jsonb(upper(v_item->>'code')));
    IF length(v_item->>'id') > 80 OR v_item->>'id' !~* '^req-[a-z0-9-]+$'
      OR v_item->>'code' !~ '^[A-Z0-9][A-Z0-9_-]{2,31}$'
      OR length(v_item->>'name') NOT BETWEEN 2 AND 160
      OR v_item->>'category' NOT IN ('شؤون موظفين','مالية','إدارية','عمليات')
      OR v_item->>'status' NOT IN ('نشط','معطل')
      OR jsonb_typeof(v_item->'requires_attachment') <> 'boolean'
      OR jsonb_typeof(v_item->'allow_cancel') <> 'boolean'
      OR jsonb_typeof(v_item->'max_sla_hours') <> 'number' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'قيم نوع الطلب غير صحيحة';
    END IF;
    v_sla := (v_item->>'max_sla_hours')::numeric;
    IF v_sla <> trunc(v_sla) OR v_sla NOT BETWEEN 1 AND 720 THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'زمن الاعتماد يجب أن يكون عدد ساعات صحيحًا من 1 إلى 720';
    END IF;
    IF jsonb_typeof(v_item->'approval_chain') <> 'array' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'مسار الاعتماد غير صحيح';
    END IF;
    IF jsonb_array_length(v_item->'approval_chain') NOT BETWEEN 1 AND 8 THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'أضف خطوة اعتماد واحدة إلى 8 خطوات';
    END IF;
    v_chain := '[]'::jsonb;
    FOR v_step IN SELECT value FROM jsonb_array_elements(v_item->'approval_chain') LOOP
      v_text := btrim(v_step #>> '{}');
      IF jsonb_typeof(v_step) <> 'string' OR length(v_text) NOT BETWEEN 2 AND 120
        OR v_text ~ '[[:cntrl:]]' OR v_chain @> jsonb_build_array(v_text) THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'خطوة اعتماد غير صحيحة أو مكررة';
      END IF;
      v_chain := v_chain || jsonb_build_array(v_text);
    END LOOP;
    v_item := jsonb_set(v_item, '{approval_chain}', v_chain);
    IF (v_item->>'id') = ANY(v_ids) OR (v_item->>'code') = ANY(v_codes) THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'معرّف أو كود الطلب مكرر';
    END IF;
    v_ids := array_append(v_ids, v_item->>'id');
    v_codes := array_append(v_codes, v_item->>'code');
    v_normalized := v_normalized || jsonb_build_array(v_item);
  END LOOP;

  -- Serialize first creation too; row locks alone cannot lock a missing row.
  PERFORM pg_advisory_xact_lock(20260915, 1);
  SELECT value INTO v_current FROM public.app_settings
  WHERE section = 'request_types' AND key = 'configs' FOR UPDATE;
  IF v_current IS DISTINCT FROM p_expected_value THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'تغيّرت الإعدادات؛ أعد تحميل آخر نسخة قبل الحفظ';
  END IF;
  INSERT INTO public.app_settings(section, key, value)
  VALUES ('request_types', 'configs', v_normalized::text)
  ON CONFLICT (section, key) DO UPDATE SET value = EXCLUDED.value;
  RETURN jsonb_build_object('exists', true, 'value', v_normalized::text);
END $$;

REVOKE ALL ON FUNCTION public.get_request_type_settings() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_request_type_settings(jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_request_type_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_request_type_settings(jsonb, text) TO authenticated;
COMMIT;
