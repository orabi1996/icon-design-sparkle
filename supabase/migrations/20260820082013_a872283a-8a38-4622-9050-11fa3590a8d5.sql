CREATE TABLE public.basic_lookups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name_ar text NOT NULL,
  name_en text,
  kind text,
  penalty text,
  linked_leaves text,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.basic_lookups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.basic_lookups TO anon;
GRANT ALL ON public.basic_lookups TO service_role;

ALTER TABLE public.basic_lookups ENABLE ROW LEVEL SECURITY;

CREATE POLICY demo_open_basic_lookups ON public.basic_lookups FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER t_basic_lookups BEFORE UPDATE ON public.basic_lookups FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.basic_lookups (category, name_ar, name_en) VALUES
('المسار','مسار السعودية تيست','saudi test'),
('المسار','مسار مصر','egypt'),
('المسار','مسار التقنية','tech'),
('المسار','مسار تجريبي','trial'),
('القسم الرئيسي','القسم الرئيسي','Main section'),
('القسم الرئيسي','شركة الحلول الخبيرة','expert solutions'),
('القسم الرئيسي','قسم ثانوي','Secondary Department'),
('القسم الرئيسي','الادارة','managment'),
('الأقسام','الإدارة','Management'),
('الأقسام','النقل والحركة','Transportation and Movement'),
('الأقسام','النظافة','Cleaning'),
('الأقسام','الأمن','Security'),
('الأقسام','الموارد البشرية','Human Resources'),
('الأقسام','المالية','Finance'),
('التخصص','موارد بشرية','Human Resources'),
('التخصص','محاسبة ومراجعة','Accounting & Audit'),
('التخصص','مبيعات','Sales'),
('التخصص','مشتريات','Procurement'),
('التخصص','تقنية معلومات','Information Technology'),
('القطاع','قطاع اداري','ADMIN Sector'),
('القطاع','قطاع أكاديمي','Academic Sector'),
('القطاع','قطاع تشغيلي','Operations Sector'),
('الوظيفه الحاليه','مسؤول موارد بشرية','HR Officer'),
('الوظيفه الحاليه','دعم فني','Technical Support'),
('الوظيفه الحاليه','مدير الدعم الفني','Support Manager'),
('الوظيفه الحاليه','الرئيس التنفيذي','CEO'),
('الوظيفه الحاليه','محاسب قانوني','Certified Accountant'),
('الوظيفه الحاليه','مدير التسويق','Marketing Manager'),
('المسمي الوظيفي','محاسب','Accountant'),
('المسمي الوظيفي','مندوب مبيعات','Sales Representative'),
('المسمي الوظيفي','عامل','Worker'),
('المسمي الوظيفي','مدخل بيانات','Data Entry'),
('المسمي الوظيفي','إداري','Administrator'),
('الحاله الاجتماعيه','أعزب','Single'),
('الحاله الاجتماعيه','متزوج','Married'),
('الحاله الاجتماعيه','مطلق','Divorced'),
('الحاله الاجتماعيه','أرمل','Widowed'),
('الجنسيه','سعودي','Saudi'),
('الجنسيه','مصري','Egyptian'),
('الجنسيه','أردني','Jordanian'),
('الجنسيه','سوداني','Sudanese'),
('الجنسيه','هندي','Indian'),
('الديانه','مسلم','Muslim'),
('الديانه','غير مسلم','Non-Muslim'),
('الدولة','المملكة العربية السعودية','Saudi Arabia'),
('الدولة','مصر','Egypt'),
('الدولة','الأردن','Jordan'),
('الدولة','الإمارات','UAE'),
('بنك','مصرف الراجحي','Al Rajhi Bank'),
('بنك','البنك الأهلي السعودي','Saudi National Bank'),
('بنك','بنك الرياض','Riyad Bank'),
('بنك','البنك السعودي الفرنسي','Banque Saudi Fransi'),
('بنك','بنك البلاد','Bank Albilad');

INSERT INTO public.basic_lookups (category, name_ar, name_en, kind, linked_leaves) VALUES
('المستويات الوظيفية','إداري','Administrative','ادارة اكاديمية','أجازة سنوية, مرضية, اجازة زواج'),
('المستويات الوظيفية','تعليمي','Educational','معلم','اعتيادية فئة الموظفين (دوام كامل)'),
('المستويات الوظيفية','أكاديمي','Academic','ادارة اكاديمية','اعتيادية فئة الموظفين (دوام كامل)'),
('المستويات الوظيفية','إدارة عامة','General Management','افتراضي','اجازة براتب, اجازة وضع, اجازة مرضي'),
('الفئة الوظيفية','سعودي تأمينات','Saudi Insured',NULL,'أجازة زواج, أجازة سنوية 35 يوم, أجازة مرضية 40'),
('الفئة الوظيفية','مقيم تأمينات','Resident Insured',NULL,'أجازة سنوية 30 يوم, اجازه مرضية 35'),
('الفئة الوظيفية','مقيم خارج التأمينات','Resident Uninsured',NULL,'أجازة مرضية 40, أجازة بدون راتب'),
('الفئة الوظيفية','أجير','Contractor',NULL,'أجازة مرضية 40, أجازة زواج');

INSERT INTO public.basic_lookups (category, name_ar, name_en, penalty, active) VALUES
('التصنيف المسائلات','غياب آلي من البصمة','Absence of fingerprint','غياب آلي من البصمة', true),
('التصنيف المسائلات','تأخير صباحي آلي من البصمة','Automatic Morning Delay Of Fingerprint','تأخير صباحي آلي من البصمة', true),
('التصنيف المسائلات','تأخير مسائي آلي من البصمة','Automatic Evening Delay Of Fingerprint','تأخير مسائي آلي من البصمة', true),
('التصنيف المسائلات','مسائلة غياب','Absent','مسائلة غياب', false),
('التصنيف المسائلات','مسائلة انصراف مبكر','Early Departure','مسائلة انصراف مبكر', true),
('التصنيف المسائلات','مسائلة تأخير','Delay','مسائلة تأخير', true),
('التصنيف المسائلات','مسائلة تقصير في العمل','Negligence','مسائلة تقصير في العمل', true);
