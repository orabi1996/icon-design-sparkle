
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  branch text NOT NULL DEFAULT 'الفرع الرئيسي',
  manager_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_no text NOT NULL UNIQUE,
  full_name text NOT NULL,
  national_id text,
  job_title text,
  department text,
  branch text DEFAULT 'الفرع الرئيسي',
  nationality text DEFAULT 'سعودي',
  gender text DEFAULT 'ذكر',
  basic_salary numeric NOT NULL DEFAULT 0,
  allowances numeric NOT NULL DEFAULT 0,
  hire_date date,
  contract_end date,
  status text NOT NULL DEFAULT 'نشط',
  phone text,
  email text,
  bank_name text,
  iban text,
  manager_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calc_type text NOT NULL DEFAULT 'مبلغ ثابت',
  amount numeric NOT NULL DEFAULT 0,
  gosi_subject boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calc_type text NOT NULL DEFAULT 'مبلغ ثابت',
  amount numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name text,
  amount numeric NOT NULL DEFAULT 0,
  installments integer NOT NULL DEFAULT 1,
  monthly_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  start_date date DEFAULT now(),
  status text NOT NULL DEFAULT 'قيد السداد',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name text,
  leave_type text NOT NULL DEFAULT 'أجازة سنوية',
  from_date date NOT NULL DEFAULT now(),
  to_date date NOT NULL DEFAULT now(),
  days integer NOT NULL DEFAULT 1,
  balance_before numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'بانتظار الموافقة',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name text,
  request_type text NOT NULL DEFAULT 'طلب عام',
  status text NOT NULL DEFAULT 'جديد',
  amount numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'تعميم',
  target text DEFAULT 'كل الموظفين',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name text,
  work_date date NOT NULL DEFAULT now(),
  check_in time,
  check_out time,
  status text NOT NULL DEFAULT 'حاضر',
  late_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  month integer NOT NULL DEFAULT 1,
  year integer NOT NULL DEFAULT 2026,
  status text NOT NULL DEFAULT 'مسودة',
  employees_count integer NOT NULL DEFAULT 0,
  total_gross numeric NOT NULL DEFAULT 0,
  total_deductions numeric NOT NULL DEFAULT 0,
  total_net numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments, public.employees, public.entitlements, public.deductions, public.loans, public.leave_requests, public.requests, public.announcements, public.attendance_records, public.payroll_runs TO anon, authenticated;
GRANT ALL ON public.departments, public.employees, public.entitlements, public.deductions, public.loans, public.leave_requests, public.requests, public.announcements, public.attendance_records, public.payroll_runs TO service_role;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_open_departments" ON public.departments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_open_employees" ON public.employees FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_open_entitlements" ON public.entitlements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_open_deductions" ON public.deductions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_open_loans" ON public.loans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_open_leave_requests" ON public.leave_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_open_requests" ON public.requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_open_announcements" ON public.announcements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_open_attendance" ON public.attendance_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo_open_payroll_runs" ON public.payroll_runs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER t_departments BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_employees BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_entitlements BEFORE UPDATE ON public.entitlements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_deductions BEFORE UPDATE ON public.deductions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_loans BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_leaves BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_requests BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_announcements BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_attendance BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_payroll BEFORE UPDATE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.departments (name, branch, manager_name) VALUES
 ('الموارد البشرية','الفرع الرئيسي','سعد العتيبي'),
 ('المالية','الفرع الرئيسي','هند الدوسري'),
 ('تقنية المعلومات','الفرع الرئيسي','خالد الشهري'),
 ('المبيعات','فرع جدة','ماجد الحربي'),
 ('التشغيل','فرع الدمام','فهد القحطاني'),
 ('المشتريات','الفرع الرئيسي','ريم السالم');

INSERT INTO public.employees (emp_no, full_name, national_id, job_title, department, branch, nationality, gender, basic_salary, allowances, hire_date, contract_end, status, phone, email, bank_name, iban, manager_name) VALUES
 ('1001','سعد العتيبي','1045871236','مدير الموارد البشرية','الموارد البشرية','الفرع الرئيسي','سعودي','ذكر',18000,4500,'2019-03-01','2027-03-01','نشط','0551234567','saad@hr.sa','الراجحي','SA0380000000608010167519','المدير العام'),
 ('1002','هند الدوسري','1045871237','مديرة مالية','المالية','الفرع الرئيسي','سعودي','أنثى',17000,4000,'2020-01-15','2026-12-31','نشط','0551234568','hind@hr.sa','الأهلي','SA1180000000608010167520','المدير العام'),
 ('1003','خالد الشهري','1045871238','مدير تقنية المعلومات','تقنية المعلومات','الفرع الرئيسي','سعودي','ذكر',16500,3800,'2018-06-01','2026-09-30','نشط','0551234569','khaled@hr.sa','الرياض','SA2280000000608010167521','المدير العام'),
 ('1004','ماجد الحربي','1045871239','مدير مبيعات','المبيعات','فرع جدة','سعودي','ذكر',15000,3500,'2021-02-01','2027-02-01','نشط','0551234570','majed@hr.sa','الراجحي','SA3380000000608010167522','المدير العام'),
 ('1005','فهد القحطاني','1045871240','مدير تشغيل','التشغيل','فرع الدمام','سعودي','ذكر',14500,3200,'2020-09-01','2026-10-15','نشط','0551234571','fahad@hr.sa','ساب','SA4480000000608010167523','المدير العام'),
 ('1006','ريم السالم','1045871241','مسؤولة مشتريات','المشتريات','الفرع الرئيسي','سعودي','أنثى',11000,2500,'2022-04-10','2026-11-30','نشط','0551234572','reem@hr.sa','الأهلي','SA5580000000608010167524','سعد العتيبي'),
 ('1007','محمد الزهراني','1045871242','محاسب','المالية','الفرع الرئيسي','سعودي','ذكر',9500,2100,'2022-07-01','2027-07-01','نشط','0551234573','mohammed@hr.sa','الراجحي','SA6680000000608010167525','هند الدوسري'),
 ('1008','نورة العمري','1045871243','أخصائية موارد بشرية','الموارد البشرية','الفرع الرئيسي','سعودي','أنثى',9000,2000,'2023-01-05','2027-01-05','نشط','0551234574','noura@hr.sa','الرياض','SA7780000000608010167526','سعد العتيبي'),
 ('1009','أحمد سيد','2045871244','مطور برمجيات','تقنية المعلومات','الفرع الرئيسي','مصري','ذكر',12000,2800,'2021-11-01','2026-08-31','نشط','0551234575','ahmed@hr.sa','ساب','SA8880000000608010167527','خالد الشهري'),
 ('1010','راجيش كومار','3045871245','مهندس شبكات','تقنية المعلومات','الفرع الرئيسي','هندي','ذكر',11500,2600,'2022-03-15','2026-09-15','نشط','0551234576','rajesh@hr.sa','الأهلي','SA9980000000608010167528','خالد الشهري'),
 ('1011','عبدالله المطيري','1045871246','مندوب مبيعات','المبيعات','فرع جدة','سعودي','ذكر',7500,1800,'2023-05-01','2027-05-01','نشط','0551234577','abdullah@hr.sa','الراجحي','SA1080000000608010167529','ماجد الحربي'),
 ('1012','سارة الغامدي','1045871247','مندوبة مبيعات','المبيعات','فرع جدة','سعودي','أنثى',7500,1800,'2023-06-01','2027-06-01','نشط','0551234578','sara@hr.sa','الرياض','SA1180000000608010167530','ماجد الحربي'),
 ('1013','ياسر الأحمدي','1045871248','فني تشغيل','التشغيل','فرع الدمام','سعودي','ذكر',6500,1500,'2023-08-01','2026-08-25','نشط','0551234579','yaser@hr.sa','ساب','SA1280000000608010167531','فهد القحطاني'),
 ('1014','منى الشمري','1045871249','سكرتيرة تنفيذية','الموارد البشرية','الفرع الرئيسي','سعودي','أنثى',7000,1600,'2022-10-01','2026-10-01','نشط','0551234580','mona@hr.sa','الأهلي','SA1380000000608010167532','سعد العتيبي'),
 ('1015','بلال حسن','2045871250','محاسب تكاليف','المالية','الفرع الرئيسي','مصري','ذكر',8500,1900,'2021-09-01','2026-09-01','نشط','0551234581','bilal@hr.sa','الراجحي','SA1480000000608010167533','هند الدوسري'),
 ('1016','عمر باوزير','4045871251','أخصائي مشتريات','المشتريات','الفرع الرئيسي','يمني','ذكر',7800,1700,'2023-02-01','2027-02-01','نشط','0551234582','omar@hr.sa','الرياض','SA1580000000608010167534','ريم السالم'),
 ('1017','لمياء العسيري','1045871252','مسؤولة تدريب','الموارد البشرية','الفرع الرئيسي','سعودي','أنثى',8800,1950,'2022-12-01','2026-12-01','نشط','0551234583','lamia@hr.sa','ساب','SA1680000000608010167535','سعد العتيبي'),
 ('1018','طلال الرشيد','1045871253','فني صيانة','التشغيل','فرع الدمام','سعودي','ذكر',6200,1400,'2024-01-15','2027-01-15','نشط','0551234584','talal@hr.sa','الأهلي','SA1780000000608010167536','فهد القحطاني'),
 ('1019','دانة الفهد','1045871254','محللة بيانات','تقنية المعلومات','الفرع الرئيسي','سعودي','أنثى',10500,2400,'2023-03-01','2027-03-01','نشط','0551234585','dana@hr.sa','الراجحي','SA1880000000608010167537','خالد الشهري'),
 ('1020','سامي النجار','2045871255','مشرف مستودع','التشغيل','فرع الدمام','مصري','ذكر',6800,1500,'2022-05-01','2026-09-05','موقوف','0551234586','sami@hr.sa','الرياض','SA1980000000608010167538','فهد القحطاني'),
 ('1021','هيا القصبي','1045871256','مسؤولة علاقات حكومية','الموارد البشرية','الفرع الرئيسي','سعودي','أنثى',9200,2100,'2021-04-01','2026-08-30','نشط','0551234587','haya@hr.sa','ساب','SA2080000000608010167539','سعد العتيبي'),
 ('1022','مروان الخالدي','1045871257','مندوب مبيعات','المبيعات','فرع جدة','سعودي','ذكر',7200,1700,'2024-02-01','2027-02-01','نشط','0551234588','marwan@hr.sa','الأهلي','SA2180000000608010167540','ماجد الحربي'),
 ('1023','جواهر الحمد','1045871258','أمينة صندوق','المالية','الفرع الرئيسي','سعودي','أنثى',6900,1600,'2023-09-01','2027-09-01','نشط','0551234589','jawaher@hr.sa','الراجحي','SA2280000000608010167541','هند الدوسري'),
 ('1024','إبراهيم الدايل','1045871259','مدير مشاريع','التشغيل','الفرع الرئيسي','سعودي','ذكر',15500,3600,'2019-10-01','2026-10-01','منتهي الخدمة','0551234590','ibrahim@hr.sa','الرياض','SA2380000000608010167542','المدير العام');

INSERT INTO public.entitlements (name, calc_type, amount, gosi_subject, active, notes) VALUES
 ('بدل سكن','نسبة من الأساسي',25,true,true,'يصرف شهرياً'),
 ('بدل نقل','مبلغ ثابت',800,false,true,'لجميع الموظفين'),
 ('بدل هاتف','مبلغ ثابت',200,false,true,'للمشرفين وما فوق'),
 ('بدل طبيعة عمل','نسبة من الأساسي',10,false,true,'لموظفي التشغيل'),
 ('مكافأة أداء','مبلغ ثابت',1500,false,true,'ربع سنوية'),
 ('بدل انتداب','مبلغ ثابت',350,false,false,'يومي عند السفر'),
 ('بدل عمل إضافي','ساعة عمل',1.5,false,true,'حسب ساعات الإضافي');

INSERT INTO public.deductions (name, calc_type, amount, active, notes) VALUES
 ('التأمينات الاجتماعية','نسبة من الأساسي',9.75,true,'حصة الموظف'),
 ('خصم غياب','يوم عمل',1,true,'يوم كامل عن كل غياب'),
 ('خصم تأخير','مبلغ ثابت',25,true,'لكل ١٥ دقيقة تأخير'),
 ('قسط سلفة','مبلغ ثابت',0,true,'يحتسب من جدول السلف'),
 ('خصم عدم بصمة','مبلغ ثابت',50,true,'حسب لائحة البصمة'),
 ('جزاء إداري','مبلغ ثابت',100,false,'حسب قرار اللجنة');

INSERT INTO public.loans (employee_id, employee_name, amount, installments, monthly_amount, paid_amount, start_date, status, notes)
SELECT e.id, e.full_name, v.amount, v.inst, v.amount / v.inst, v.paid, v.sd::date, v.st, v.nt
FROM (VALUES
 ('1007', 12000, 12, 4000, '2026-01-01', 'قيد السداد', 'سلفة زواج'),
 ('1009', 20000, 20, 6000, '2025-11-01', 'قيد السداد', 'سلفة سكن'),
 ('1013', 6000, 6, 6000, '2026-01-01', 'مسددة', 'سلفة طارئة'),
 ('1016', 9000, 9, 2000, '2026-03-01', 'قيد السداد', 'سلفة تعليم'),
 ('1019', 15000, 10, 3000, '2026-02-01', 'قيد السداد', 'سلفة سيارة'),
 ('1022', 5000, 5, 0, '2026-08-01', 'بانتظار الموافقة', 'سلفة شخصية')
) AS v(emp, amount, inst, paid, sd, st, nt)
JOIN public.employees e ON e.emp_no = v.emp;

INSERT INTO public.leave_requests (employee_id, employee_name, leave_type, from_date, to_date, days, balance_before, status, notes)
SELECT e.id, e.full_name, v.lt, v.fd::date, v.td::date, v.d, v.bb, v.st, v.nt
FROM (VALUES
 ('1002','أجازة سنوية','2026-08-20','2026-08-30',10,24,'بانتظار الموافقة','سفر خارجي'),
 ('1007','أجازة مرضية','2026-08-10','2026-08-12',3,18,'معتمدة','تقرير طبي مرفق'),
 ('1009','أجازة سنوية','2026-09-01','2026-09-15',15,30,'بانتظار الموافقة',NULL),
 ('1011','أجازة بدون راتب','2026-07-01','2026-07-20',20,0,'معتمدة','ظروف خاصة'),
 ('1014','أجازة وضع','2026-08-01','2026-10-30',90,0,'معتمدة',NULL),
 ('1017','أجازة سنوية','2026-08-25','2026-08-29',5,12,'مرفوضة','ضغط عمل'),
 ('1019','أجازة اضطرارية','2026-08-17','2026-08-18',2,21,'معتمدة',NULL),
 ('1023','أجازة سنوية','2026-09-10','2026-09-20',11,15,'بانتظار الموافقة',NULL)
) AS v(emp, lt, fd, td, d, bb, st, nt)
JOIN public.employees e ON e.emp_no = v.emp;

INSERT INTO public.requests (employee_id, employee_name, request_type, status, amount, notes)
SELECT e.id, e.full_name, v.rt, v.st, v.am, v.nt
FROM (VALUES
 ('1006','طلب سلفة','جديد',5000,'سلفة شخصية'),
 ('1008','طلب تعريف بالراتب','معتمد',NULL,'لجهة تمويلية'),
 ('1010','طلب تجديد إقامة','قيد المعالجة',NULL,'ينتهي بعد شهر'),
 ('1011','طلب إذن','جديد',NULL,'إذن ساعتين'),
 ('1012','طلب أجازة','جديد',NULL,'أجازة سنوية'),
 ('1015','طلب نقل','قيد المعالجة',NULL,'إلى فرع جدة'),
 ('1018','طلب عمل إضافي','معتمد',NULL,'١٢ ساعة'),
 ('1021','طلب استقالة','مرفوض',NULL,'تم الاحتفاظ بالموظف'),
 ('1022','طلب بدل انتداب','جديد',350,'مهمة عمل الرياض')
) AS v(emp, rt, st, am, nt)
JOIN public.employees e ON e.emp_no = v.emp;

INSERT INTO public.announcements (title, body, kind, target) VALUES
 ('تعميم مواعيد العمل الصيفية','يبدأ العمل بالتوقيت الصيفي من الأحد القادم الساعة ٨:٠٠ صباحاً حتى ٤:٠٠ عصراً.','تعميم','كل الموظفين'),
 ('استبيان رضا الموظفين 2026','نرجو تعبئة الاستبيان قبل نهاية الشهر لتحسين بيئة العمل.','استبيان','كل الموظفين'),
 ('تحديث نظام البصمة','تم تحديث أجهزة البصمة، يرجى إعادة تسجيل البصمة لدى الموارد البشرية.','تعميم','الفرع الرئيسي'),
 ('دورة تدريبية: مهارات القيادة','الدورة يومي الثلاثاء والأربعاء بقاعة التدريب الرئيسية.','تعميم','المشرفون'),
 ('صرف الرواتب','تم إيداع رواتب شهر يوليو في الحسابات البنكية.','تعميم','كل الموظفين');

INSERT INTO public.attendance_records (employee_id, employee_name, work_date, check_in, check_out, status, late_minutes)
SELECT e.id, e.full_name, d::date,
  CASE WHEN random() < 0.12 THEN NULL ELSE (time '08:00' + (floor(random()*40)::text || ' minutes')::interval) END,
  CASE WHEN random() < 0.12 THEN NULL ELSE (time '17:00' + (floor(random()*30)::text || ' minutes')::interval) END,
  CASE WHEN random() < 0.07 THEN 'غائب' WHEN random() < 0.25 THEN 'متأخر' ELSE 'حاضر' END,
  CASE WHEN random() < 0.25 THEN floor(random()*35)::int ELSE 0 END
FROM public.employees e
CROSS JOIN generate_series(current_date - 29, current_date, interval '1 day') AS d
WHERE e.status = 'نشط' AND extract(dow from d) NOT IN (5,6);

INSERT INTO public.payroll_runs (title, month, year, status, employees_count, total_gross, total_deductions, total_net) VALUES
 ('مسير رواتب مارس 2026',3,2026,'مقفل',23,289500,31200,258300),
 ('مسير رواتب أبريل 2026',4,2026,'مقفل',23,291000,30800,260200),
 ('مسير رواتب مايو 2026',5,2026,'مقفل',23,292500,32100,260400),
 ('مسير رواتب يونيو 2026',6,2026,'مقفل',23,294000,33400,260600),
 ('مسير رواتب يوليو 2026',7,2026,'مقفل',23,296500,31900,264600),
 ('مسير رواتب أغسطس 2026',8,2026,'مسودة',23,298000,32500,265500);
