CREATE TABLE public.end_of_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text NOT NULL UNIQUE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  emp_no text,
  national_id text,
  branch text,
  department text,
  main_department text DEFAULT 'الإدارة العامة',
  sector text DEFAULT 'القطاع الإداري',
  career_path text DEFAULT 'المسار الإداري',
  job_level text DEFAULT 'إداري',
  job_title text,
  nationality text,
  contract_type text DEFAULT 'عقد محدد المدة',
  hire_date date,
  contract_end_date date,
  service_end_date date NOT NULL,
  service_end_type text NOT NULL,
  stop_reason text NOT NULL,
  notes text,
  attachment_name text,
  attachment_path text,
  request_status text NOT NULL DEFAULT 'قيد المراجعة'
    CHECK (
      request_status IN (
        'قيد المراجعة',
        'بانتظار المدير',
        'بانتظار الموارد البشرية',
        'معتمد',
        'مرفوض',
        'ملغي'
      )
    ),
  approval_stage text NOT NULL DEFAULT 'المدير المباشر',
  requested_by text,
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,
  request_date timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX end_of_service_requests_employee_idx
  ON public.end_of_service_requests (employee_id, service_end_date DESC);
CREATE INDEX end_of_service_requests_filters_idx
  ON public.end_of_service_requests (
    branch,
    department,
    request_status,
    service_end_date DESC
  );

GRANT SELECT, INSERT, UPDATE ON public.end_of_service_requests TO authenticated;
GRANT ALL ON public.end_of_service_requests TO service_role;

ALTER TABLE public.end_of_service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY end_of_service_requests_select_scope
  ON public.end_of_service_requests
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
        AND emp_no = end_of_service_requests.emp_no
    )
  );

CREATE POLICY end_of_service_requests_insert_scope
  ON public.end_of_service_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager')
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND emp_no = end_of_service_requests.emp_no
      )
    )
  );

CREATE POLICY end_of_service_requests_update_scope
  ON public.end_of_service_requests
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

CREATE TRIGGER t_end_of_service_requests
  BEFORE UPDATE ON public.end_of_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'end-of-service-attachments',
  'end-of-service-attachments',
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

CREATE POLICY end_of_service_attachments_select_scope
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'end-of-service-attachments'
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

CREATE POLICY end_of_service_attachments_insert_own
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'end-of-service-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY end_of_service_attachments_delete_scope
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'end-of-service-attachments'
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
