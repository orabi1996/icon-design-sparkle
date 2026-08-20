ALTER TABLE public.basic_lookups
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS insurance_company text,
  ADD COLUMN IF NOT EXISTS insurance_class text,
  ADD COLUMN IF NOT EXISTS age_from integer,
  ADD COLUMN IF NOT EXISTS age_to integer,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS relation text,
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS is_employee boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_married boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS job_role text,
  ADD COLUMN IF NOT EXISTS grade numeric;

INSERT INTO public.basic_lookups (category, name_ar, name_en, ref_number, start_date, end_date) VALUES
 ('شركه التامين','بوبا العربية','Bupa Arabia','1','2025-01-01','2025-12-31'),
 ('شركه التامين','ميدغلف','MedGulf','2','2025-03-31','2026-03-30'),
 ('شركه التامين','التعاونية','Tawuniya','3','2025-04-04','2026-04-03'),
 ('شركه التامين','ميت ليف','MET LIFE','4','2025-04-14','2026-04-14'),
 ('شركه التامين','جلوب ميد','GLOBMED','5','2025-10-31','2026-10-29');

INSERT INTO public.basic_lookups (category, name_ar, name_en, insurance_company) VALUES
 ('فئه التامين','فئة اولى','A','بوبا العربية'),
 ('فئه التامين','فئة ثانية','B','بوبا العربية'),
 ('فئه التامين','فئة جولد','GOLD','ميدغلف'),
 ('فئه التامين','فئة سيلفر','SILVER','ميدغلف'),
 ('فئه التامين','الاولي','a','التعاونية');

INSERT INTO public.basic_lookups (category, name_ar, name_en, insurance_company, insurance_class, age_from, age_to, gender, relation, amount, is_employee, is_married) VALUES
 ('اسم الفئة العمرية','محاسبين',NULL,'بوبا العربية','فئة اولى',23,48,'الكل',NULL,500,true,false),
 ('اسم الفئة العمرية','اداريين',NULL,'بوبا العربية','فئة اولى',25,55,'الكل',NULL,500,false,false),
 ('اسم الفئة العمرية','شباب','youth','ميدغلف','فئة جولد',22,35,'الكل','زوج / زوجة',11500,false,false),
 ('اسم الفئة العمرية','المعلمين',NULL,'جلوب ميد','فئة سيلفر',23,30,'الكل',NULL,10000,false,false),
 ('اسم الفئة العمرية','فئة اولي','First class','ميدغلف','فئة جولد',21,27,'الكل','زوج / زوجة',10000,true,false),
 ('اسم الفئة العمرية','الفئة المتوسطة','MID RANGE','التعاونية','الاولي',25,35,'الكل',NULL,3000,true,false);

UPDATE public.basic_lookups SET job_role='الكل', grade=90 WHERE category='التقيم' AND name_ar='ممتاز';
UPDATE public.basic_lookups SET job_role='الكل', grade=90 WHERE category='التقيم' AND name_ar='جيد جدا';
UPDATE public.basic_lookups SET job_role='أجير', grade=70 WHERE category='التقيم' AND name_ar='جيد';
