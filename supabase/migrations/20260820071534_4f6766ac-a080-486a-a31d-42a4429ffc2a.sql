CREATE TABLE public.work_shift_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  branch text NOT NULL DEFAULT 'الفرع الرئيسي',
  work_days integer NOT NULL DEFAULT 5,
  start_time time NOT NULL DEFAULT '08:00',
  end_time time NOT NULL DEFAULT '17:00',
  break_minutes integer NOT NULL DEFAULT 60,
  grace_minutes integer NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_shift_groups TO anon, authenticated;
GRANT ALL ON public.work_shift_groups TO service_role;
ALTER TABLE public.work_shift_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_open_work_shift_groups ON public.work_shift_groups FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_work_shift_groups BEFORE UPDATE ON public.work_shift_groups FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.regulation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  value_type text NOT NULL DEFAULT 'مبلغ ثابت',
  amount numeric NOT NULL DEFAULT 0,
  days integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regulation_rules TO anon, authenticated;
GRANT ALL ON public.regulation_rules TO service_role;
ALTER TABLE public.regulation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_open_regulation_rules ON public.regulation_rules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_regulation_rules BEFORE UPDATE ON public.regulation_rules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.work_shift_groups (name, branch, work_days, start_time, end_time, break_minutes, grace_minutes, notes) VALUES
 ('الدوام الإداري', 'الفرع الرئيسي', 5, '08:00', '17:00', 60, 10, 'الأحد - الخميس'),
 ('دوام الورديات الصباحية', 'فرع جدة', 6, '07:00', '15:00', 45, 15, 'وردية أولى'),
 ('دوام الورديات المسائية', 'فرع جدة', 6, '15:00', '23:00', 45, 15, 'وردية ثانية'),
 ('دوام جزئي', 'فرع الدمام', 5, '09:00', '13:00', 0, 5, 'أربع ساعات');

INSERT INTO public.regulation_rules (category, name, value_type, amount, days, notes) VALUES
 ('لائحة الأذونات', 'إذن تأخير صباحي', 'ساعة', 2, 0, 'حد أقصى مرتين شهرياً'),
 ('لائحة الأذونات', 'إذن مغادرة مبكرة', 'ساعة', 2, 0, 'بموافقة المدير المباشر'),
 ('لائحة الأذونات', 'إذن مهمة عمل', 'ساعة', 4, 0, 'لا يخصم من الرصيد'),
 ('خصومات البصمة', 'عدم البصمة صباحاً', 'مبلغ ثابت', 50, 0, 'أول مرة'),
 ('خصومات البصمة', 'عدم البصمة مساءً', 'مبلغ ثابت', 50, 0, 'أول مرة'),
 ('خصومات البصمة', 'تأخير أكثر من ٣٠ دقيقة', 'نسبة من الأساسي', 1, 0, 'يوم واحد'),
 ('العمولات البنكية', 'الراجحي - تحويل داخلي', 'مبلغ ثابت', 1, 0, 'لكل عملية'),
 ('العمولات البنكية', 'الأهلي - تحويل داخلي', 'مبلغ ثابت', 1.5, 0, 'لكل عملية'),
 ('العمولات البنكية', 'تحويل خارجي', 'مبلغ ثابت', 25, 0, 'سويفت'),
 ('سلاسل الموافقات', 'سلسلة موافقات الأجازات', 'مراحل', 3, 0, 'المدير المباشر ثم الموارد البشرية ثم المالية'),
 ('سلاسل الموافقات', 'سلسلة موافقات السلف', 'مراحل', 2, 0, 'المدير المباشر ثم المالية'),
 ('لائحة نهاية الخدمة', 'استقالة قبل ٥ سنوات', 'نسبة من الأساسي', 33.33, 15, 'نصف شهر لكل سنة'),
 ('لائحة نهاية الخدمة', 'استقالة بعد ٥ سنوات', 'نسبة من الأساسي', 66.66, 30, 'شهر لكل سنة'),
 ('لائحة نهاية الخدمة', 'إنهاء من صاحب العمل', 'نسبة من الأساسي', 100, 30, 'مكافأة كاملة'),
 ('لوائح أخرى', 'جزاء الغياب بدون عذر', 'يوم عمل', 1, 1, 'حسب نظام العمل'),
 ('لوائح أخرى', 'رسوم تجديد الإقامة', 'مبلغ ثابت', 650, 0, 'سنوياً'),
 ('لوائح أخرى', 'رسوم تأشيرة خروج وعودة', 'مبلغ ثابت', 200, 0, 'لكل شهر');