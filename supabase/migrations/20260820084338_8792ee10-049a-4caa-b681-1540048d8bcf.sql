CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  key text NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY demo_open_app_settings ON public.app_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER t_app_settings BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.app_settings (section, key, value) VALUES
  ('email','host','smtp.gmail.com'),
  ('email','port','587'),
  ('email','email','hr1@altofola.com'),
  ('email','password',''),
  ('email_create','email',''),
  ('email_create','mail_server',''),
  ('other','link_general_accounts','true'),
  ('other','max_deduction','0'),
  ('other','min_days_salary_cut','0'),
  ('other','resources_entitlement_value','0'),
  ('other','bank_commission_deduction','استقطاع عمولات بنكية'),
  ('other','nationality','سعودي'),
  ('other','resources_entitlement','راتب اساسى'),
  ('other','insurance_deduction','خصم خاص'),
  ('other','annual_visa_leave_days','90'),
  ('other','annual_visa_fine_days','30'),
  ('other','fingerprint_late_calc','شهرى'),
  ('other','fingerprint_early_calc','شهرى'),
  ('notifications','enabled','true'),
  ('notifications','task_delay_time','16:30'),
  ('notifications','alert_days','500'),
  ('notifications','contract_end_notice_months','4'),
  ('paths','accounts',''),
  ('paths','sso',''),
  ('paths','support_services',''),
  ('paths','students_accounts',''),
  ('paths','warehouses',''),
  ('paths','platform',''),
  ('bank','id_number_len','12'),
  ('bank','exchange_account_len','8'),
  ('bank','bank_account_len','24'),
  ('bank','sponsor_account_len','9'),
  ('bank','client_number_len','8'),
  ('bank','bank_type','سعودي');