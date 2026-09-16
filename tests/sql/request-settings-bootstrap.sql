-- DISPOSABLE CI DATABASE ONLY. Never run this fixture against staging/production.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE TABLE public.profiles(id uuid PRIMARY KEY REFERENCES auth.users(id), emp_no text);
CREATE TABLE public.user_roles(
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL,
  PRIMARY KEY(user_id, role)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.user_roles TO authenticated;
CREATE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
CREATE TABLE public.app_settings(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  key text NOT NULL,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(section, key)
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- Reproduce the existing permissive policy to verify it cannot override the fix.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon, authenticated;
CREATE POLICY demo_open_app_settings ON public.app_settings
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_app_settings BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
INSERT INTO auth.users VALUES
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003');
INSERT INTO public.user_roles VALUES
  ('00000000-0000-0000-0000-000000000001','admin'),
  ('00000000-0000-0000-0000-000000000002','employee'),
  ('00000000-0000-0000-0000-000000000003','admin');
INSERT INTO public.app_settings(section, key, value) VALUES
  ('unrelated_test','keep','unchanged'),
  ('request_types','configs','[{"id":"req-seeded","code":"REQ-SEED","name":"طلب اختبار","category":"إدارية","approval_chain":["مدير النظام"],"max_sla_hours":24,"requires_attachment":false,"allow_cancel":true,"status":"نشط"}]');
