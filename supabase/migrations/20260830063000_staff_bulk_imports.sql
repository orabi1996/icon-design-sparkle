-- Atomic spreadsheet imports for the staff data-update screen.
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS bank_code text,
  ADD COLUMN IF NOT EXISTS bank_account_no text,
  ADD COLUMN IF NOT EXISTS bank_account_status text;

CREATE TABLE IF NOT EXISTS public.employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_number text NOT NULL,
  document_date date NOT NULL,
  renewal_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_documents_employee_type_key UNIQUE (employee_id, document_type),
  CONSTRAINT employee_documents_dates_check CHECK (renewal_date >= document_date)
);

CREATE TABLE IF NOT EXISTS public.employee_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  entitlement_id uuid NOT NULL REFERENCES public.entitlements(id) ON DELETE RESTRICT,
  year integer NOT NULL CHECK (year BETWEEN 2000 AND 2200),
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount numeric NOT NULL CHECK (amount > 0),
  is_default boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_entitlements_period_key UNIQUE (employee_id, entitlement_id, year, month)
);

CREATE TABLE IF NOT EXISTS public.employee_deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  deduction_id uuid NOT NULL REFERENCES public.deductions(id) ON DELETE RESTRICT,
  year integer NOT NULL CHECK (year BETWEEN 2000 AND 2200),
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount numeric NOT NULL CHECK (amount > 0),
  is_default boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_deductions_period_key UNIQUE (employee_id, deduction_id, year, month)
);

CREATE INDEX IF NOT EXISTS employee_documents_employee_idx
  ON public.employee_documents (employee_id, renewal_date);
CREATE INDEX IF NOT EXISTS employee_entitlements_employee_period_idx
  ON public.employee_entitlements (employee_id, year, month);
CREATE INDEX IF NOT EXISTS employee_deductions_employee_period_idx
  ON public.employee_deductions (employee_id, year, month);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.employee_documents, public.employee_entitlements, public.employee_deductions
  TO anon, authenticated;
GRANT ALL
  ON public.employee_documents, public.employee_entitlements, public.employee_deductions
  TO service_role;

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_deductions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_open_employee_documents" ON public.employee_documents;
CREATE POLICY "demo_open_employee_documents"
  ON public.employee_documents FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "demo_open_employee_entitlements" ON public.employee_entitlements;
CREATE POLICY "demo_open_employee_entitlements"
  ON public.employee_entitlements FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "demo_open_employee_deductions" ON public.employee_deductions;
CREATE POLICY "demo_open_employee_deductions"
  ON public.employee_deductions FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS t_employee_documents ON public.employee_documents;
CREATE TRIGGER t_employee_documents
  BEFORE UPDATE ON public.employee_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS t_employee_entitlements ON public.employee_entitlements;
CREATE TRIGGER t_employee_entitlements
  BEFORE UPDATE ON public.employee_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS t_employee_deductions ON public.employee_deductions;
CREATE TRIGGER t_employee_deductions
  BEFORE UPDATE ON public.employee_deductions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.apply_staff_bulk_import(
  p_import_type text,
  p_rows jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  item jsonb;
  employee_uuid uuid;
  definition_uuid uuid;
  source_row integer;
  affected_rows integer;
  processed_rows integer := 0;
BEGIN
  IF p_import_type NOT IN ('facility', 'salaries', 'documents', 'entitlement', 'deduction', 'bank') THEN
    RAISE EXCEPTION 'نوع الاستيراد غير مدعوم: %', p_import_type;
  END IF;
  IF jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN
    RAISE EXCEPTION 'لا توجد صفوف صالحة للتنفيذ';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    source_row := COALESCE((item->>'source_row')::integer, processed_rows + 2);
    BEGIN
      employee_uuid := (item->>'employee_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'الصف %: معرّف الموظف غير صالح', source_row;
    END;

    IF NOT EXISTS (SELECT 1 FROM public.employees WHERE id = employee_uuid) THEN
      RAISE EXCEPTION 'الصف %: الموظف غير موجود؛ تم إلغاء الملف بالكامل', source_row;
    END IF;

    IF p_import_type = 'facility' THEN
      UPDATE public.employees
      SET labor_office_no = item->>'work_number'
      WHERE id = employee_uuid;

    ELSIF p_import_type = 'salaries' THEN
      UPDATE public.employees
      SET basic_salary = (item->>'basic_salary')::numeric,
          status = COALESCE(NULLIF(item->>'status', ''), status),
          labor_office_no = COALESCE(NULLIF(item->>'work_number', ''), labor_office_no)
      WHERE id = employee_uuid;

    ELSIF p_import_type = 'documents' THEN
      INSERT INTO public.employee_documents (
        employee_id, document_type, document_number, document_date, renewal_date
      ) VALUES (
        employee_uuid,
        item->>'document_type',
        item->>'document_number',
        (item->>'document_date')::date,
        (item->>'renewal_date')::date
      )
      ON CONFLICT (employee_id, document_type) DO UPDATE SET
        document_number = EXCLUDED.document_number,
        document_date = EXCLUDED.document_date,
        renewal_date = EXCLUDED.renewal_date;

    ELSIF p_import_type IN ('entitlement', 'deduction') THEN
      BEGIN
        definition_uuid := (item->>'definition_id')::uuid;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'الصف %: معرّف الاستحقاق/الاستقطاع غير صالح', source_row;
      END;

      IF p_import_type = 'entitlement' THEN
        IF NOT EXISTS (SELECT 1 FROM public.entitlements WHERE id = definition_uuid) THEN
          RAISE EXCEPTION 'الصف %: الاستحقاق المحدد غير موجود', source_row;
        END IF;
        INSERT INTO public.employee_entitlements (
          employee_id, entitlement_id, year, month, amount, is_default, notes
        ) VALUES (
          employee_uuid,
          definition_uuid,
          (item->>'year')::integer,
          (item->>'month')::integer,
          (item->>'amount')::numeric,
          COALESCE((item->>'is_default')::boolean, false),
          NULLIF(item->>'notes', '')
        )
        ON CONFLICT (employee_id, entitlement_id, year, month) DO UPDATE SET
          amount = EXCLUDED.amount,
          is_default = EXCLUDED.is_default,
          notes = EXCLUDED.notes;
      ELSE
        IF NOT EXISTS (SELECT 1 FROM public.deductions WHERE id = definition_uuid) THEN
          RAISE EXCEPTION 'الصف %: الاستقطاع المحدد غير موجود', source_row;
        END IF;
        INSERT INTO public.employee_deductions (
          employee_id, deduction_id, year, month, amount, is_default, notes
        ) VALUES (
          employee_uuid,
          definition_uuid,
          (item->>'year')::integer,
          (item->>'month')::integer,
          (item->>'amount')::numeric,
          COALESCE((item->>'is_default')::boolean, false),
          NULLIF(item->>'notes', '')
        )
        ON CONFLICT (employee_id, deduction_id, year, month) DO UPDATE SET
          amount = EXCLUDED.amount,
          is_default = EXCLUDED.is_default,
          notes = EXCLUDED.notes;
      END IF;

    ELSIF p_import_type = 'bank' THEN
      UPDATE public.employees
      SET bank_code = item->>'bank_code',
          bank_account_no = item->>'bank_account_no',
          iban = item->>'bank_account_no',
          bank_account_status = item->>'bank_account_status',
          payment_method = item->>'payment_method'
      WHERE id = employee_uuid;
    END IF;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    IF affected_rows = 0 AND p_import_type IN ('facility', 'salaries', 'bank') THEN
      RAISE EXCEPTION 'الصف %: لم يتم تحديث الموظف؛ تم إلغاء الملف بالكامل', source_row;
    END IF;
    processed_rows := processed_rows + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', processed_rows,
    'import_type', p_import_type
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_staff_bulk_import(text, jsonb)
  TO anon, authenticated, service_role;
