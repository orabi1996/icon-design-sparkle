-- ============================================================================
-- Approval Requests (طلبات الاعتماد)
-- Central inbox of employee requests (early leave, late arrival, permits,
-- vacations, loans, etc.) with approval chain tracking.
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.approval_request_number_seq START WITH 5001;

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number bigint NOT NULL UNIQUE DEFAULT nextval('public.approval_request_number_seq'),

  -- who
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name text NOT NULL,
  emp_no text,
  branch text,
  department text,
  category text, -- التصنيف الإداري (management / التطوير / Security / ...)

  -- what
  request_type text NOT NULL, -- أذن إنصراف مبكر / أذن تأخير / إجازة / سلفة / تعديل بصمة / ...
  request_subject text,       -- عنوان مختصر يظهر في العمود "بيانات الطلب"
  request_details text,       -- نص حر بتفاصيل الطلب

  -- dates
  request_date timestamptz NOT NULL DEFAULT now(),
  entered_at   timestamptz NOT NULL DEFAULT now(),
  effective_from date,
  effective_to   date,

  -- approval chain
  approval_chain text,                -- اسم سلسلة الموافقة (مثال: موارد بشرية)
  direct_manager_name text,           -- المدير المباشر
  awaiting_approver_name text,        -- في انتظار موافقة (الشخص الحالي)
  awaiting_stage text
    DEFAULT 'المدير المباشر',         -- المرحلة الحالية: المدير المباشر / موارد بشرية / ...
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','cancelled')),

  -- decision
  decision_at timestamptz,
  decision_by text,
  decision_reason text,

  -- audit
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS approval_requests_status_idx   ON public.approval_requests (status);
CREATE INDEX IF NOT EXISTS approval_requests_type_idx     ON public.approval_requests (request_type);
CREATE INDEX IF NOT EXISTS approval_requests_branch_idx   ON public.approval_requests (branch, department);
CREATE INDEX IF NOT EXISTS approval_requests_dates_idx    ON public.approval_requests (request_date DESC);
CREATE INDEX IF NOT EXISTS approval_requests_employee_idx ON public.approval_requests (employee_id);

-- Reuse the shared updated_at trigger function defined by the tasks migration
DROP TRIGGER IF EXISTS set_updated_at ON public.approval_requests;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_requests TO authenticated;
GRANT ALL ON public.approval_requests TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.approval_request_number_seq TO authenticated, service_role;

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS approval_requests_all ON public.approval_requests;
CREATE POLICY approval_requests_all ON public.approval_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
