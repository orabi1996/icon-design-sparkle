CREATE TABLE public.employee_correspondence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL DEFAULT 'internal'
    CHECK (channel IN ('internal', 'email')),
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  emp_no text,
  national_id text,
  phone text,
  employee_email text,
  recipient_email text,
  branch text,
  department text,
  priority text NOT NULL DEFAULT 'عادي',
  subject text,
  message text NOT NULL,
  message_html text,
  redirect_url text,
  status text NOT NULL DEFAULT 'تم التسجيل',
  delivery_status text NOT NULL DEFAULT 'غير مقروء',
  character_count integer NOT NULL DEFAULT 0,
  sender_name text,
  sender_email text,
  attachment_name text,
  attachment_path text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX employee_correspondence_employee_idx
  ON public.employee_correspondence (employee_id, sent_at DESC);
CREATE INDEX employee_correspondence_archive_idx
  ON public.employee_correspondence (channel, branch, department, sent_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_correspondence TO authenticated;
GRANT ALL ON public.employee_correspondence TO service_role;

ALTER TABLE public.employee_correspondence ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_correspondence_select_scope
  ON public.employee_correspondence
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
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND emp_no = employee_correspondence.emp_no
    )
  );

CREATE POLICY employee_correspondence_insert_scope
  ON public.employee_correspondence
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

CREATE POLICY employee_correspondence_update_scope
  ON public.employee_correspondence
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

CREATE POLICY employee_correspondence_delete_scope
  ON public.employee_correspondence
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

CREATE TRIGGER t_employee_correspondence
  BEFORE UPDATE ON public.employee_correspondence
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'correspondence-attachments',
  'correspondence-attachments',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY correspondence_attachments_select_scope
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'correspondence-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY correspondence_attachments_insert_own
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'correspondence-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY correspondence_attachments_delete_scope
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'correspondence-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager')
      )
    )
  );
