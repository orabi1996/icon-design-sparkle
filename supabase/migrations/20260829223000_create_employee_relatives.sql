CREATE TABLE public.employee_relatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_national_id text NOT NULL,
  employee_emp_no text,
  employee_name text,
  name text NOT NULL,
  name_en text,
  relationship text NOT NULL,
  id_number text NOT NULL,
  nationality text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('ذكر', 'أنثى')),
  job text,
  passport_expiry_date date,
  passport_number text,
  date_of_birth date NOT NULL,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_relatives_employee_id_number_key UNIQUE (employee_id, id_number),
  CONSTRAINT employee_relatives_passport_pair_check CHECK (
    (passport_number IS NULL AND passport_expiry_date IS NULL)
    OR (passport_number IS NOT NULL AND passport_expiry_date IS NOT NULL)
  )
);

CREATE INDEX employee_relatives_employee_idx
  ON public.employee_relatives (employee_id, created_at DESC);
CREATE INDEX employee_relatives_national_id_idx
  ON public.employee_relatives (employee_national_id);
CREATE UNIQUE INDEX employee_relatives_id_number_unique_idx
  ON public.employee_relatives (id_number);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_relatives TO anon, authenticated;
GRANT ALL ON public.employee_relatives TO service_role;

ALTER TABLE public.employee_relatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_open_employee_relatives"
  ON public.employee_relatives
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER t_employee_relatives
  BEFORE UPDATE ON public.employee_relatives
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();
