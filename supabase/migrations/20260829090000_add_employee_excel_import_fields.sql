-- Fields used by the employee Excel import template.
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS is_human_resources boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.employees.is_human_resources IS
  'Whether the employee is allowed to work as a human-resources user.';
