ALTER TABLE public.basic_lookups
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS sabb_code text,
  ADD COLUMN IF NOT EXISTS details text,
  ADD COLUMN IF NOT EXISTS ref_number text,
  ADD COLUMN IF NOT EXISTS notify_days integer,
  ADD COLUMN IF NOT EXISTS flag boolean NOT NULL DEFAULT false;

INSERT INTO public.basic_lookups (category, name_ar, name_en, flag) VALUES
 ('نوع العقد','محدد المدة',NULL,false),
 ('نوع العقد','غير محدد المدة',NULL,false),
 ('نوع العقد','عقد عمل أجير',NULL,true),
 ('نوع العقد','عقد خدمات استشارات','service contract',false),
 ('نوع العقد','عقد عمل','Contract',false),
 ('نوع العقد','استشارات',NULL,false);

INSERT INTO public.basic_lookups (category, name_ar, name_en) VALUES
 ('الجامعة','جامعة القاهرة',NULL),
 ('الجامعة','جامعة بنى سويف',NULL),
 ('الجامعة','جامعة عين شمس',NULL),
 ('الجامعة','جامعه الملك عبدالعزيز',NULL),
 ('الجامعة','جامعة حلوان',NULL),
 ('المؤهلات الدراسيه','بكالوريوس هندسة قسم كهرباء',NULL),
 ('المؤهلات الدراسيه','بكالوريوس تربية قسم لغة إنجليزية','BAC'),
 ('المؤهلات الدراسيه','بكالوريوس تجارة شعبة محاسبة','BAC T'),
 ('المؤهلات الدراسيه','لسانس حقوق قسم لغة عربية',NULL),
 ('المؤهلات الدراسيه','بكالوريوس تربية قسم علوم',NULL),
 ('التقيم','ممتاز','Excellent'),
 ('التقيم','جيد جدا','Very Good'),
 ('التقيم','جيد','Good'),
 ('التقدير','ممتاز مع مرتبة الشرف',NULL),
 ('التقدير','ممتاز',NULL),
 ('التقدير','جيد جدا',NULL),
 ('نوع التدريب','تدريب داخلي',NULL),
 ('نوع التدريب','تدريب خارجي',NULL),
 ('نوع التدريب','تدريب الكتروني',NULL);

INSERT INTO public.basic_lookups (category, name_ar, name_en, details, active) VALUES
 ('بنود العقد','تجديد العقد تلقائى','auto renew','يتم تجديد العقد تلقائيا',true),
 ('بنود العقد','فتره الاختبار لمده ثلاثه اشهر',NULL,NULL,true),
 ('بنود العقد','التدريب لمدة ثلاثه اشهر',NULL,'تدريب',true),
 ('بنود العقد','عدم التجديد تلقائيا','never be renewed','عدم تجديد العقد من تلقاء نفسه',true),
 ('بنود العقد','عدم التجديد','non renewable','هذا العقد لا يجدد من تلقاء نفسه ويحتاج الي اعادة صياغه وتوقيع الطرفين مرة اخري',true);

INSERT INTO public.basic_lookups (category, name_ar, name_en, kind, ref_number, notify_days) VALUES
 ('المستندات','دورة تدريبية','test','شهاده','1',3),
 ('المستندات','بطاقه شخصيه','national ID','الهوية','2',30),
 ('المستندات','قسيمه جواز',NULL,'وثيقه جواز','3',3),
 ('المستندات','جواز سفر','Passport','اخرى','4',30),
 ('المستندات','بطاقة هوية','ID','الهوية','503',30),
 ('المستندات','عقد عمل','employee contract','العقد','3',30),
 ('المستندات','الفيش الجنائي','Crime Record','شهاده','4',15);

UPDATE public.basic_lookups SET code='RIBL', flag=true WHERE category='بنك' AND name_ar LIKE '%الرياض%';
UPDATE public.basic_lookups SET code='RJHI', flag=true WHERE category='بنك' AND name_ar LIKE '%الراجحي%';
UPDATE public.basic_lookups SET code='ALBI', flag=true WHERE category='بنك' AND name_ar LIKE '%البلاد%';
UPDATE public.basic_lookups SET code='NCBK', flag=true WHERE category='بنك' AND name_ar LIKE '%الأهلي%';
UPDATE public.basic_lookups SET code='INMA', flag=true WHERE category='بنك' AND name_ar LIKE '%الإنماء%';
UPDATE public.basic_lookups SET code='BJAZ', flag=true WHERE category='بنك' AND name_ar LIKE '%الجزيرة%';
UPDATE public.basic_lookups SET code='ARNB', flag=true WHERE category='بنك' AND name_ar LIKE '%العربي%';

INSERT INTO public.basic_lookups (category, name_ar, name_en, code, flag) VALUES
 ('بنك','السعودي للاستثمار',NULL,'SIBC',false),
 ('بنك','السي أي بي',NULL,'CIB',false),
 ('بنك','بنك الدوحة','Doha Bank','DBQ',true);
