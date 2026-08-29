-- ============================================================================
-- Additional Tasks Management Module (إدارة المهام الإضافية)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) task_categories : تصنيفات المهام
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name_ar)
);

-- ---------------------------------------------------------------------------
-- 2) task_priorities : أولويات المهام
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  color text DEFAULT '#3b82f6',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name_ar)
);

-- ---------------------------------------------------------------------------
-- 3) task_statuses : حالات المهام (fixed lifecycle, only editable names)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text,
  color text DEFAULT '#64748b',
  sort_order integer NOT NULL DEFAULT 0,
  is_system boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the 5 system statuses
INSERT INTO public.task_statuses (code, name_ar, name_en, color, sort_order, is_system) VALUES
  ('pending',     'تم الإنشاء',   'Pending',     '#3b82f6', 1, true),
  ('in_progress', 'جاري التنفيذ', 'In Progress', '#f59e0b', 2, true),
  ('postponed',   'تم التأجيل',   'Postponed',   '#ef4444', 3, true),
  ('finished',    'تم التنفيذ',   'Finished',    '#10b981', 4, true),
  ('closed',      'مغلق',        'Closed',      '#6b7280', 5, true)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4) task_creator_permissions : صلاحيات منشئي المهام
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_creator_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  emp_no text,
  branch text,
  department text,
  can_create boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_view_reports boolean NOT NULL DEFAULT true,
  branch_scope text NOT NULL DEFAULT 'own'
    CHECK (branch_scope IN ('own', 'all', 'selected')),
  department_scope text NOT NULL DEFAULT 'own'
    CHECK (department_scope IN ('own', 'all', 'selected')),
  reports_scope text NOT NULL DEFAULT 'own_only'
    CHECK (reports_scope IN ('own_only', 'department', 'branch', 'all')),
  scoped_branches text[] DEFAULT '{}',
  scoped_departments text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_creator_permissions_employee_idx
  ON public.task_creator_permissions (employee_id);

-- ---------------------------------------------------------------------------
-- 5) task_receiver_permissions : صلاحيات مستلمي المهام
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_receiver_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  emp_no text,
  branch text,
  department text,
  branch_scope text NOT NULL DEFAULT 'own'
    CHECK (branch_scope IN ('own', 'all', 'selected')),
  department_scope text NOT NULL DEFAULT 'own'
    CHECK (department_scope IN ('own', 'all', 'selected')),
  scoped_branches text[] DEFAULT '{}',
  scoped_departments text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_receiver_permissions_employee_idx
  ON public.task_receiver_permissions (employee_id);

-- ---------------------------------------------------------------------------
-- 6) tasks : المهام
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.task_number_seq START WITH 1001;

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number bigint NOT NULL UNIQUE DEFAULT nextval('public.task_number_seq'),
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES public.task_categories(id) ON DELETE SET NULL,
  category_name text,
  priority_id uuid REFERENCES public.task_priorities(id) ON DELETE SET NULL,
  priority_name text,
  status_code text NOT NULL DEFAULT 'pending'
    REFERENCES public.task_statuses(code) ON DELETE RESTRICT,
  branch text,
  department text,
  assignee_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  assignee_name text,
  creator_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  creator_name text,
  start_date date,
  end_date date,
  duration_days integer,
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_status_idx    ON public.tasks (status_code);
CREATE INDEX IF NOT EXISTS tasks_branch_idx    ON public.tasks (branch, department);
CREATE INDEX IF NOT EXISTS tasks_priority_idx  ON public.tasks (priority_id);
CREATE INDEX IF NOT EXISTS tasks_dates_idx     ON public.tasks (start_date, end_date);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx  ON public.tasks (assignee_employee_id);

-- ---------------------------------------------------------------------------
-- Trigger : keep updated_at fresh
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'task_categories','task_priorities','task_statuses',
    'task_creator_permissions','task_receiver_permissions','tasks'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; '
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Auto-compute duration_days on insert / update
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_task_duration()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
    NEW.duration_days := (NEW.end_date - NEW.start_date) + 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS compute_task_duration ON public.tasks;
CREATE TRIGGER compute_task_duration
  BEFORE INSERT OR UPDATE OF start_date, end_date ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.compute_task_duration();

-- ---------------------------------------------------------------------------
-- Grants + RLS
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.task_categories,
  public.task_priorities,
  public.task_statuses,
  public.task_creator_permissions,
  public.task_receiver_permissions,
  public.tasks
TO authenticated;

GRANT ALL ON
  public.task_categories,
  public.task_priorities,
  public.task_statuses,
  public.task_creator_permissions,
  public.task_receiver_permissions,
  public.tasks
TO service_role;

GRANT USAGE, SELECT ON SEQUENCE public.task_number_seq TO authenticated, service_role;

ALTER TABLE public.task_categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_priorities             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_statuses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_creator_permissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_receiver_permissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks                       ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read/manage the config tables (mirrors existing app tables)
DROP POLICY IF EXISTS task_categories_all ON public.task_categories;
CREATE POLICY task_categories_all ON public.task_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS task_priorities_all ON public.task_priorities;
CREATE POLICY task_priorities_all ON public.task_priorities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS task_statuses_read ON public.task_statuses;
CREATE POLICY task_statuses_read ON public.task_statuses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS task_statuses_update ON public.task_statuses;
CREATE POLICY task_statuses_update ON public.task_statuses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS task_creator_permissions_all ON public.task_creator_permissions;
CREATE POLICY task_creator_permissions_all ON public.task_creator_permissions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS task_receiver_permissions_all ON public.task_receiver_permissions;
CREATE POLICY task_receiver_permissions_all ON public.task_receiver_permissions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS tasks_all ON public.tasks;
CREATE POLICY tasks_all ON public.tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Seed a few default categories & priorities so the reports UI is not empty
-- ---------------------------------------------------------------------------
INSERT INTO public.task_categories (name_ar, name_en) VALUES
  ('عام',       'General'),
  ('صيانة',     'Maintenance'),
  ('مشتريات',   'Procurement'),
  ('متابعة',    'Follow-up'),
  ('تدريب',     'Training')
ON CONFLICT (name_ar) DO NOTHING;

INSERT INTO public.task_priorities (name_ar, name_en, color, sort_order) VALUES
  ('عاجل',   'Urgent', '#ef4444', 1),
  ('عالي',   'High',   '#f59e0b', 2),
  ('متوسط',  'Medium', '#3b82f6', 3),
  ('منخفض',  'Low',    '#10b981', 4)
ON CONFLICT (name_ar) DO NOTHING;
