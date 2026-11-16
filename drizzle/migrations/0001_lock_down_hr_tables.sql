DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['announcements','app_settings','attendance_records','basic_lookups','deductions','departments','employees','entitlements','leave_requests','loans','payroll_runs','regulation_rules','requests','work_shift_groups','inquiries','account_links'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'demo_open_'||t, t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''manager'') OR public.has_role(auth.uid(),''employee''))', 'staff_read_'||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''manager'')) WITH CHECK (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''manager''))', 'staff_write_'||t, t);
  END LOOP;
END $$;