DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['announcements','app_settings','attendance_records','basic_lookups','deductions','departments','employees','entitlements','leave_requests','loans','payroll_runs','regulation_rules','requests','work_shift_groups']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'demo_open_' || CASE t
      WHEN 'attendance_records' THEN 'attendance'
      WHEN 'leave_requests' THEN 'leave_requests'
      ELSE t END, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'demo_open_' || t, t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', 'auth_only_' || t, t);
  END LOOP;
END $$;