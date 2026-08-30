-- Central authorization model for the HR application.
-- Authentication users remain in auth.users; this migration stores their HR profile,
-- group memberships, screen rules, organisational scope, and feature permissions.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_emp_no_idx ON public.profiles (emp_no);
CREATE INDEX IF NOT EXISTS profiles_national_id_idx ON public.profiles (national_id);

CREATE OR REPLACE FUNCTION public.is_permissions_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

REVOKE ALL ON FUNCTION public.is_permissions_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_permissions_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
CREATE POLICY profiles_select_admin
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_permissions_admin());

DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_admin
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_permissions_admin())
  WITH CHECK (public.is_permissions_admin());

DROP POLICY IF EXISTS user_roles_select_admin ON public.user_roles;
CREATE POLICY user_roles_select_admin
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_permissions_admin());

DROP POLICY IF EXISTS user_roles_insert_admin ON public.user_roles;
CREATE POLICY user_roles_insert_admin
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_permissions_admin());

DROP POLICY IF EXISTS user_roles_update_admin ON public.user_roles;
CREATE POLICY user_roles_update_admin
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_permissions_admin())
  WITH CHECK (public.is_permissions_admin());

DROP POLICY IF EXISTS user_roles_delete_admin ON public.user_roles;
CREATE POLICY user_roles_delete_admin
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_permissions_admin());

CREATE TABLE IF NOT EXISTS public.permission_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (length(btrim(name)) > 0),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permission_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.permission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  resource_key text NOT NULL,
  resource_name text NOT NULL,
  resource_section text NOT NULL DEFAULT 'عام',
  is_enabled boolean NOT NULL DEFAULT true,
  can_read boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_update boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, resource_key)
);

CREATE TABLE IF NOT EXISTS public.permission_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  scope_type text NOT NULL CHECK (scope_type IN ('branch', 'department')),
  scope_value text NOT NULL CHECK (length(btrim(scope_value)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, scope_type, scope_value)
);

CREATE TABLE IF NOT EXISTS public.permission_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  feature_category text NOT NULL CHECK (
    feature_category IN ('data_update', 'admin_forms', 'dashboard')
  ),
  feature_key text NOT NULL,
  feature_name text NOT NULL,
  is_allowed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, feature_key)
);

CREATE INDEX IF NOT EXISTS permission_group_members_user_idx
  ON public.permission_group_members (user_id);
CREATE INDEX IF NOT EXISTS permission_rules_group_idx
  ON public.permission_rules (group_id);
CREATE INDEX IF NOT EXISTS permission_scopes_group_idx
  ON public.permission_scopes (group_id);
CREATE INDEX IF NOT EXISTS permission_features_group_idx
  ON public.permission_features (group_id);

CREATE OR REPLACE FUNCTION public.protect_system_permission_group()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_system THEN
    RAISE EXCEPTION 'System permission groups cannot be deleted';
  END IF;
  RETURN OLD;
END
$$;

DROP TRIGGER IF EXISTS protect_system_permission_group_delete ON public.permission_groups;
CREATE TRIGGER protect_system_permission_group_delete
  BEFORE DELETE ON public.permission_groups
  FOR EACH ROW EXECUTE FUNCTION public.protect_system_permission_group();

DROP TRIGGER IF EXISTS t_permission_groups ON public.permission_groups;
CREATE TRIGGER t_permission_groups
  BEFORE UPDATE ON public.permission_groups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS t_permission_rules ON public.permission_rules;
CREATE TRIGGER t_permission_rules
  BEFORE UPDATE ON public.permission_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS t_permission_features ON public.permission_features;
CREATE TRIGGER t_permission_features
  BEFORE UPDATE ON public.permission_features
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY permission_groups_admin_all
  ON public.permission_groups FOR ALL TO authenticated
  USING (public.is_permissions_admin())
  WITH CHECK (public.is_permissions_admin());

CREATE POLICY permission_groups_member_read
  ON public.permission_groups FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.permission_group_members m
      WHERE m.group_id = permission_groups.id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY permission_group_members_admin_all
  ON public.permission_group_members FOR ALL TO authenticated
  USING (public.is_permissions_admin())
  WITH CHECK (public.is_permissions_admin());

CREATE POLICY permission_group_members_own_read
  ON public.permission_group_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY permission_rules_admin_all
  ON public.permission_rules FOR ALL TO authenticated
  USING (public.is_permissions_admin())
  WITH CHECK (public.is_permissions_admin());

CREATE POLICY permission_rules_member_read
  ON public.permission_rules FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.permission_group_members m
      WHERE m.group_id = permission_rules.group_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY permission_scopes_admin_all
  ON public.permission_scopes FOR ALL TO authenticated
  USING (public.is_permissions_admin())
  WITH CHECK (public.is_permissions_admin());

CREATE POLICY permission_scopes_member_read
  ON public.permission_scopes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.permission_group_members m
      WHERE m.group_id = permission_scopes.group_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY permission_features_admin_all
  ON public.permission_features FOR ALL TO authenticated
  USING (public.is_permissions_admin())
  WITH CHECK (public.is_permissions_admin());

CREATE POLICY permission_features_member_read
  ON public.permission_features FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.permission_group_members m
      WHERE m.group_id = permission_features.group_id AND m.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.permission_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permission_group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permission_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permission_scopes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permission_features TO authenticated;
GRANT ALL ON public.permission_groups TO service_role;
GRANT ALL ON public.permission_group_members TO service_role;
GRANT ALL ON public.permission_rules TO service_role;
GRANT ALL ON public.permission_scopes TO service_role;
GRANT ALL ON public.permission_features TO service_role;

INSERT INTO public.permission_groups (name, description, is_system)
VALUES
  ('Admin', 'مديرو النظام بكامل الصلاحيات', true),
  ('Manager', 'مديرو الفروع والأقسام', true),
  ('User', 'مستخدمو النظام', true)
ON CONFLICT (name) DO UPDATE
SET is_system = true, description = EXCLUDED.description;

INSERT INTO public.permission_group_members (group_id, user_id)
SELECT g.id, r.user_id
FROM public.user_roles r
JOIN public.permission_groups g
  ON g.name = CASE r.role::text
    WHEN 'admin' THEN 'Admin'
    WHEN 'manager' THEN 'Manager'
    ELSE 'User'
  END
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Lightweight checks used by application screens outside the management centre.
CREATE OR REPLACE FUNCTION public.can_access_resource(
  p_resource_key text,
  p_action text DEFAULT 'read'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_permissions_admin() OR EXISTS (
    SELECT 1
    FROM public.permission_group_members m
    JOIN public.permission_groups g ON g.id = m.group_id AND g.is_active
    JOIN public.permission_rules r ON r.group_id = g.id AND r.is_enabled
    WHERE m.user_id = auth.uid()
      AND r.resource_key = p_resource_key
      AND CASE p_action
        WHEN 'create' THEN r.can_create
        WHEN 'update' THEN r.can_update
        WHEN 'delete' THEN r.can_delete
        ELSE r.can_read
      END
  )
$$;

REVOKE ALL ON FUNCTION public.can_access_resource(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_resource(text, text) TO authenticated, service_role;
