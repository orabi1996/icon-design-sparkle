ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS country_code text;

COMMENT ON COLUMN public.employees.country_code IS
  'International dialing prefix imported from the employee update workbook, for example +966.';
