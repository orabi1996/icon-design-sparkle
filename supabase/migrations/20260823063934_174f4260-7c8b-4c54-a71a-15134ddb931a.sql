DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'announcements','app_settings','attendance_records','basic_lookups','deductions',
    'departments','employees','entitlements','leave_requests','loans','payroll_runs',
    'regulation_rules','requests','work_shift_groups'
  ]
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'demo_open_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'auth_only_' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      'demo_open_' || t, t);
  END LOOP;
END $$;