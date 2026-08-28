CREATE SEQUENCE public.eos_provision_entry_number_seq START WITH 33001;

CREATE TABLE public.eos_provision_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number bigint NOT NULL UNIQUE DEFAULT nextval('public.eos_provision_entry_number_seq'),
  branch text,
  posted_by text NOT NULL,
  posted_at timestamptz NOT NULL DEFAULT now(),
  employees_count integer NOT NULL DEFAULT 0,
  total_amount numeric(18, 2) NOT NULL DEFAULT 0,
  administrative_unit text DEFAULT 'الإدارة العامة',
  status text NOT NULL DEFAULT 'نشط' CHECK (status IN ('نشط', 'تم فك الترحيل')),
  reversed_at timestamptz,
  reversed_by text,
  reverse_reason text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employee_eos_provisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  emp_no text,
  national_id text,
  branch text,
  department text,
  main_department text DEFAULT 'الإدارة العامة',
  sector text DEFAULT 'القطاع الإداري',
  career_path text DEFAULT 'المسار الإداري',
  sponsor_name text,
  job_title text,
  administrative_unit text DEFAULT 'الإدارة العامة',
  job_level text DEFAULT 'إداري',
  employment_status text DEFAULT 'نشط',
  basic_salary numeric(18, 2) NOT NULL DEFAULT 0,
  allowances numeric(18, 2) NOT NULL DEFAULT 0,
  wage_base numeric(18, 2) NOT NULL DEFAULT 0,
  hire_date date,
  calculation_date date NOT NULL,
  service_years numeric(10, 4) NOT NULL DEFAULT 0,
  previous_value numeric(18, 2) NOT NULL DEFAULT 0,
  provision_value numeric(18, 2) NOT NULL DEFAULT 0,
  difference_value numeric(18, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SAR',
  posting_status text NOT NULL DEFAULT 'غير مرحل'
    CHECK (posting_status IN ('غير مرحل', 'مرحل')),
  posting_id uuid REFERENCES public.eos_provision_postings(id) ON DELETE SET NULL,
  posted_at timestamptz,
  posted_by text,
  calculated_by text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, calculation_date)
);

CREATE INDEX employee_eos_provisions_filters_idx
  ON public.employee_eos_provisions (branch, department, calculation_date DESC);
CREATE INDEX employee_eos_provisions_posting_idx
  ON public.employee_eos_provisions (posting_status, posting_id);
CREATE INDEX eos_provision_postings_date_idx
  ON public.eos_provision_postings (posted_at DESC, status);

GRANT SELECT, INSERT, UPDATE ON public.employee_eos_provisions TO authenticated;
GRANT SELECT ON public.eos_provision_postings TO authenticated;
GRANT ALL ON public.employee_eos_provisions, public.eos_provision_postings TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.eos_provision_entry_number_seq TO authenticated, service_role;

ALTER TABLE public.employee_eos_provisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eos_provision_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_eos_provisions_manage_scope
  ON public.employee_eos_provisions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY eos_provision_postings_select_scope
  ON public.eos_provision_postings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE TRIGGER t_employee_eos_provisions
  BEFORE UPDATE ON public.employee_eos_provisions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER t_eos_provision_postings
  BEFORE UPDATE ON public.eos_provision_postings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.post_eos_provisions(
  p_provision_ids uuid[],
  p_user_name text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_posting_id uuid;
  v_count integer;
  v_total numeric(18, 2);
  v_branch text;
  v_unit text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بترحيل مخصص نهاية الخدمة';
  END IF;

  PERFORM 1
  FROM public.employee_eos_provisions
  WHERE id = ANY(p_provision_ids)
    AND posting_status = 'غير مرحل'
  FOR UPDATE;

  SELECT COUNT(*)::integer, COALESCE(SUM(difference_value), 0), MIN(branch), MIN(administrative_unit)
  INTO v_count, v_total, v_branch, v_unit
  FROM public.employee_eos_provisions
  WHERE id = ANY(p_provision_ids)
    AND posting_status = 'غير مرحل';

  IF v_count = 0 THEN
    RAISE EXCEPTION 'لا توجد سجلات صالحة للترحيل';
  END IF;

  INSERT INTO public.eos_provision_postings (
    branch, posted_by, employees_count, total_amount, administrative_unit, created_by
  ) VALUES (
    v_branch, COALESCE(NULLIF(p_user_name, ''), 'مدير النظام'), v_count, v_total,
    COALESCE(v_unit, 'الإدارة العامة'), auth.uid()
  ) RETURNING id INTO v_posting_id;

  UPDATE public.employee_eos_provisions
  SET posting_status = 'مرحل',
      posting_id = v_posting_id,
      posted_at = now(),
      posted_by = COALESCE(NULLIF(p_user_name, ''), 'مدير النظام')
  WHERE id = ANY(p_provision_ids)
    AND posting_status = 'غير مرحل';

  RETURN v_posting_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_eos_provision_posting(
  p_posting_id uuid,
  p_user_name text,
  p_reason text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بفك ترحيل مخصص نهاية الخدمة';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.eos_provision_postings
    WHERE id = p_posting_id AND status = 'نشط'
    FOR UPDATE
  ) THEN
    RAISE EXCEPTION 'القيد غير موجود أو تم فك ترحيله مسبقاً';
  END IF;

  UPDATE public.employee_eos_provisions
  SET posting_status = 'غير مرحل', posting_id = NULL, posted_at = NULL, posted_by = NULL
  WHERE posting_id = p_posting_id;

  UPDATE public.eos_provision_postings
  SET status = 'تم فك الترحيل',
      reversed_at = now(),
      reversed_by = COALESCE(NULLIF(p_user_name, ''), 'مدير النظام'),
      reverse_reason = p_reason
  WHERE id = p_posting_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.post_eos_provisions(uuid[], text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reverse_eos_provision_posting(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.post_eos_provisions(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_eos_provision_posting(uuid, text, text) TO authenticated;
