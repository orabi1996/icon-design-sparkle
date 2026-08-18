import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Card,
  DataTable,
  Field,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/regulations/bank-fees")({
  head: () => ({
    meta: [
      { title: "تهيئة العمولات البنكية | اللوائح المالية" },
      {
        name: "description",
        content: "تهيئة حالات البنوك والعمولات البنكية وأنواع القيم المرتبطة بها مع البحث والتصفية والتصدير.",
      },
      { property: "og:title", content: "تهيئة العمولات البنكية | اللوائح المالية" },
      { property: "og:description", content: "إدارة حالات البنوك والعمولات البنكية وأنواع القيم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BankFees,
});

function BankFees() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "التهيئة المالية", "تهيئة العمولات البنكية"]} />
      <PageBanner
        icon="account_balance"
        title="تهيئة العمولات البنكية"
        subtitle="إدارة حالات البنوك والعمولات المرتبطة بطرق القبض"
        actions={
          <Btn icon="add" variant="onDark">
            اضافة حالة البنك
          </Btn>
        }
      />

      <div className="mt-4 space-y-4">
        <Card title="بحث" icon="filter_alt">
          <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="حالة البنك">
              <Select options={["اختر ....", "مفعل", "موقوف"]} />
            </Field>
            <Field label="بنك">
              <Select options={["اختر ....", "الراجحي", "الأهلي", "الرياض", "البلاد"]} />
            </Field>
            <Field label="نوع القيمة">
              <Select options={["اختر ....", "مقطوع", "نسبة"]} />
            </Field>
            <Btn icon="search">بحث</Btn>
          </div>
        </Card>

        <div
          className="overflow-hidden rounded-2xl border border-border bg-card"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <TableToolbar title="حالات البنوك" />
          <DataTable
            columns={["حالة البنك", "الاسم بالإنجليزية", "تعديل", "اضافة تفاصيل", "حذف"]}
            rows={[]}
            empty="لا توجد بيانات"
          />
          <Pager page={1} pages={1} total={0} />
        </div>

        <Card title="تلميح" icon="info">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
            <MaterialIcon name="lightbulb" size={18} className="text-primary" filled />
            ابدأ بإضافة حالة بنك ثم أضف تفاصيل العمولات الخاصة بها لكل طريقة قبض.
          </p>
        </Card>
      </div>
    </div>
  );
}
