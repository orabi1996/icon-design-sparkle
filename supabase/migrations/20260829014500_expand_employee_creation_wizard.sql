-- Expand employee records for the five-step employee creation wizard.
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employee_name_en text,
  ADD COLUMN IF NOT EXISTS social_status text,
  ADD COLUMN IF NOT EXISTS fingerprint_no text,
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS family_members integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS photo_path text,
  ADD COLUMN IF NOT EXISTS on_duty boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS fingerprint_deduction_exempt boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_fingerprint_reports boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS main_department text,
  ADD COLUMN IF NOT EXISTS career_path text,
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS job_level text,
  ADD COLUMN IF NOT EXISTS attendance_schedule text,
  ADD COLUMN IF NOT EXISTS specialization text,
  ADD COLUMN IF NOT EXISTS job_designation text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS annual_leave_calc_date date,
  ADD COLUMN IF NOT EXISTS experience_years integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS probation_days integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS kingdom_entry_date date,
  ADD COLUMN IF NOT EXISTS landline text,
  ADD COLUMN IF NOT EXISTS home_country_phone text,
  ADD COLUMN IF NOT EXISTS home_country_mobile text,
  ADD COLUMN IF NOT EXISTS home_country_address text,
  ADD COLUMN IF NOT EXISTS current_address text,
  ADD COLUMN IF NOT EXISTS building_no text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS additional_no text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS private_email text,
  ADD COLUMN IF NOT EXISTS birth_place text,
  ADD COLUMN IF NOT EXISTS short_address text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS address_region text,
  ADD COLUMN IF NOT EXISTS unit_no text,
  ADD COLUMN IF NOT EXISTS address_extra_no text,
  ADD COLUMN IF NOT EXISTS address_notes text,
  ADD COLUMN IF NOT EXISTS employment_category text,
  ADD COLUMN IF NOT EXISTS contract_category text,
  ADD COLUMN IF NOT EXISTS sponsor_name text,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'نقدي',
  ADD COLUMN IF NOT EXISTS bank_account_holder text,
  ADD COLUMN IF NOT EXISTS custody_account text,
  ADD COLUMN IF NOT EXISTS labor_office_no text,
  ADD COLUMN IF NOT EXISTS bank_data_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resource_restricted boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS add_entitlements_deductions boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_type text,
  ADD COLUMN IF NOT EXISTS annual_leave_policy text,
  ADD COLUMN IF NOT EXISTS work_type text,
  ADD COLUMN IF NOT EXISTS work_scope text,
  ADD COLUMN IF NOT EXISTS weekly_work_days integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS work_hours_standard text,
  ADD COLUMN IF NOT EXISTS daily_work_hours numeric NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS weekly_rest_days integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS contract_terms text,
  ADD COLUMN IF NOT EXISTS contract_attachment_path text;

CREATE UNIQUE INDEX IF NOT EXISTS employees_fingerprint_no_unique
  ON public.employees (fingerprint_no)
  WHERE fingerprint_no IS NOT NULL AND fingerprint_no <> '';

CREATE INDEX IF NOT EXISTS employees_org_search_idx
  ON public.employees (branch, department, main_department, sector);

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'employee-documents',
  'employee-documents',
  false,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Files are stored under <auth.uid()>/profiles or <auth.uid()>/contracts.
-- Each authenticated user can only access files in their own top-level folder.
DROP POLICY IF EXISTS "Users read their own employee documents" ON storage.objects;
CREATE POLICY "Users read their own employee documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users upload their own employee documents" ON storage.objects;
CREATE POLICY "Users upload their own employee documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users update their own employee documents" ON storage.objects;
CREATE POLICY "Users update their own employee documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users delete their own employee documents" ON storage.objects;
CREATE POLICY "Users delete their own employee documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMENT ON COLUMN public.employees.photo_path IS
  'Private employee-documents path scoped to the authenticated uploader.';
COMMENT ON COLUMN public.employees.contract_attachment_path IS
  'Private employee-documents path scoped to the authenticated uploader.';
