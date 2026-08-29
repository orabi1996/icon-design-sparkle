CREATE TABLE public.account_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_type text NOT NULL DEFAULT 'ربط الاستحقاقات',
  item_name text,
  job_level text,
  job_title text,
  debit_account text,
  credit_account text,
  expense_account text,
  provision_account text,
  entitlement_account text,
  branch text,
  department text,
  main_department text,
  sector text,
  specialty text,
  path text,
  admin_unit text,
  current_job text,
  cost_center text,
  operation_type text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_links TO authenticated;
GRANT ALL ON public.account_links TO service_role;

ALTER TABLE public.account_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY demo_open_account_links ON public.account_links
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER t_account_links BEFORE UPDATE ON public.account_links
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();