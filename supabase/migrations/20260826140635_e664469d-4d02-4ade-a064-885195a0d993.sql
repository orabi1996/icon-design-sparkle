CREATE TABLE public.inquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_name text,
  emp_no text,
  national_id text,
  branch text DEFAULT 'شركة الحلول الخبيرة',
  department text,
  main_department text,
  sector text,
  path text,
  inquiry_name text NOT NULL DEFAULT 'مسائلة غياب',
  inquiry_type text NOT NULL DEFAULT 'غياب',
  status text NOT NULL DEFAULT 'قيد التنفيذ',
  source text NOT NULL DEFAULT 'تلقائي',
  user_name text DEFAULT 'System Admin',
  approved_by text,
  employee_reply text,
  email_sent boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  inquiry_date date NOT NULL DEFAULT now(),
  entry_date date NOT NULL DEFAULT now(),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY demo_open_inquiries ON public.inquiries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER t_inquiries BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();