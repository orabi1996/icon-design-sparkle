-- ============================================================================
-- Fingerprint (attendance-punch) raw records — تقرير بصمة الموظف
-- One row per fingerprint scan (check-in / check-out / break) reported by
-- an attendance device. Feeds the fingerprint reports.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fingerprint_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  emp_no text,
  employee_name text NOT NULL,
  branch text,
  department text,

  punch_date date NOT NULL,
  punch_time time NOT NULL,
  punch_at timestamptz GENERATED ALWAYS AS ((punch_date + punch_time) AT TIME ZONE 'Asia/Riyadh') STORED,

  -- بصمة حضور صباحي / بصمة إنصراف صباحي / بصمة حضور مسائي / بصمة إنصراف مسائي / بصمة راحة
  punch_status text NOT NULL DEFAULT 'بصمة حضور صباحي',

  device_name text,        -- الجهاز AF4C231260616
  device_serial text,
  location_name text,      -- اسم الموقع (فارغ في المُدخل الحالي)

  source text NOT NULL DEFAULT 'device' CHECK (source IN ('device','manual','import')),
  raw_payload jsonb,       -- payload خام من الجهاز (لو محتاج)

  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (employee_id, punch_date, punch_time, punch_status)
);

CREATE INDEX IF NOT EXISTS fingerprint_records_date_idx
  ON public.fingerprint_records (punch_date DESC, punch_time DESC);
CREATE INDEX IF NOT EXISTS fingerprint_records_employee_idx
  ON public.fingerprint_records (employee_id, punch_date DESC);
CREATE INDEX IF NOT EXISTS fingerprint_records_branch_idx
  ON public.fingerprint_records (branch, department);
CREATE INDEX IF NOT EXISTS fingerprint_records_status_idx
  ON public.fingerprint_records (punch_status);

-- Reuse shared updated_at trigger function (created in earlier migration)
DROP TRIGGER IF EXISTS set_updated_at ON public.fingerprint_records;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.fingerprint_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fingerprint_records TO authenticated;
GRANT ALL ON public.fingerprint_records TO service_role;

ALTER TABLE public.fingerprint_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fingerprint_records_all ON public.fingerprint_records;
CREATE POLICY fingerprint_records_all ON public.fingerprint_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
