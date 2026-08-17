import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Breadcrumbs, Btn, Card, DateInput, Field, Input, PageBanner, Select } from "@/components/hr/ui";

export const Route = createFileRoute("/staff/transfer")({
  head: () => ({
    meta: [
      { title: "النقل والترقية | تحديث بيانات الموظف الوظيفية" },
      {
        name: "description",
        content: "مقارنة البيانات الحالية بالبيانات الجديدة لتنفيذ عمليات النقل بين الفروع والترقية الوظيفية.",
      },
      { property: "og:title", content: "النقل والترقية | تحديث بيانات الموظف الوظيفية" },
      { property: "og:description", content: "نقل الموظفين بين الأقسام والفروع وتنفيذ الترقيات مع سجل كامل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Transfer,
});

const current = [
  { label: "الفرع", value: "الفرع الرئيسي" },
  { label: "القسم", value: "التسويق" },
  { label: "المسمى الوظيفي", value: "أخصائية تسويق" },
  { label: "الفئة الوظيفية", value: "الفئة الثانية" },
  { label: "المدير المباشر", value: "خالد الزهراني" },
  { label: "الراتب الأساسي", value: "٨٫٥٠٠ ر.س" },
  { label: "مجموعة الدوام", value: "دوام إداري" },
  { label: "تاريخ آخر ترقية", value: "٢٠٢٤/٠٤/٠١" },
];

function Transfer() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["شؤون الموظفين", "النقل والترقية"]} />
      <PageBanner
        icon="swap_horiz"
        title="النقل والترقية"
        subtitle="تنفيذ عمليات النقل بين الفروع والأقسام والترقيات الوظيفية"
        actions={
          <Btn icon="history" variant="onDark">
            سجل العمليات
          </Btn>
        }
      />

      <div className="mt-4">
        <Card title="اختيار الموظف" icon="person_search">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="الفرع">
              <Select options={["الرئيسي", "جدة", "الدمام"]} />
            </Field>
            <Field label="الموظف" required>
              <Select options={["سارة العتيبي - ١٠٢٤", "محمد الحربي - ١٠٣١", "نورة القحطاني - ١٠٤٥"]} />
            </Field>
            <Field label="نوع العملية" required>
              <Select options={["نقل", "ترقية", "نقل وترقية"]} />
            </Field>
            <Field label="تاريخ التنفيذ" required>
              <DateInput />
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="البيانات الحالية" icon="lock_clock">
          <ul className="space-y-2.5">
            {current.map((c) => (
              <li
                key={c.label}
                className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-3 text-[13px]"
              >
                <span className="font-bold text-muted-foreground">{c.label}</span>
                <span className="font-extrabold">{c.value}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="البيانات الجديدة" icon="edit_note">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الفرع الجديد">
              <Select options={["الرئيسي", "جدة", "الدمام"]} />
            </Field>
            <Field label="القسم الجديد">
              <Select options={["التسويق", "تقنية المعلومات", "المالية", "الموارد البشرية", "العمليات"]} />
            </Field>
            <Field label="المسمى الوظيفي الجديد" />
            <Field label="الفئة الوظيفية">
              <Select options={["الفئة الأولى", "الفئة الثانية", "الفئة الثالثة"]} />
            </Field>
            <Field label="المدير المباشر">
              <Select options={["مدير النظام", "خالد الزهراني", "نورة القحطاني"]} />
            </Field>
            <Field label="الراتب الأساسي الجديد">
              <Input placeholder="٠٠٠٠" />
            </Field>
            <Field label="مجموعة الدوام">
              <Select options={["دوام إداري", "دوام متغير", "ورديات"]} />
            </Field>
            <Field label="تاريخ السريان">
              <DateInput />
            </Field>
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">سبب / ملاحظات القرار</span>
            <textarea
              rows={3}
              placeholder="اكتب سبب النقل أو الترقية..."
              className="w-full rounded-xl border border-input bg-background p-3 text-[13px] font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-ring/25"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn icon="check_circle" variant="teal">
              تنفيذ العملية
            </Btn>
            <Btn icon="print" variant="ghost">
              طباعة القرار
            </Btn>
            <Btn icon="close" variant="soft">
              إلغاء
            </Btn>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/8 p-4">
        <MaterialIcon name="info" size={20} className="mt-0.5 text-primary" filled />
        <p className="text-[13px] font-semibold text-foreground/80">
          سيتم إشعار الموظف ومديره المباشر بعد اعتماد القرار، ويُحدَّث ملف الموظف تلقائياً من تاريخ السريان.
        </p>
      </div>
    </div>
  );
}
