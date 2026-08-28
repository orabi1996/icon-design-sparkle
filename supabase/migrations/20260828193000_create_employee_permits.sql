CREATE TABLE public.employee_permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  emp_no text,
  national_id text,
  branch text,
  department text,
  main_department text DEFAULT 'الإدارة العامة',
  sector text DEFAULT 'القطاع الإداري',
  career_path text DEFAULT 'المسار الإداري',
  kind text NOT NULL DEFAULT 'تأخير',
  permit_type text NOT NULL DEFAULT 'إذن تأخير',
  permission_date date NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'قيد التنفيذ',
  requested_by text DEFAULT 'مدير النظام',
  allowed_per_month integer NOT NULL DEFAULT 3,
  hours_per_month numeric NOT NULL DEFAULT 10,
  scheduled_morning time DEFAULT '08:00',
  actual_morning time,
  scheduled_evening time DEFAULT '17:00',
  actual_evening time,
  morning_minutes integer NOT NULL DEFAULT 0,
  evening_minutes integer NOT NULL DEFAULT 0,
  total_minutes integer NOT NULL DEFAULT 0,
  notes text,
  attachment_name text,
  attachment_path text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX employee_permits_employee_date_idx
  ON public.employee_permits (employee_id, permission_date DESC);
CREATE INDEX employee_permits_filters_idx
  ON public.employee_permits (branch, department, kind, permit_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_permits TO authenticated;
GRANT ALL ON public.employee_permits TO service_role;

ALTER TABLE public.employee_permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_permits_select_scope
  ON public.employee_permits
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY employee_permits_insert_scope
  ON public.employee_permits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY employee_permits_update_scope
  ON public.employee_permits
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY employee_permits_delete_scope
  ON public.employee_permits
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
  );

CREATE TRIGGER t_employee_permits
  BEFORE UPDATE ON public.employee_permits
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'permit-attachments',
  'permit-attachments',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY permit_attachments_select_own
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'permit-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY permit_attachments_insert_own
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'permit-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY permit_attachments_delete_own
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'permit-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
