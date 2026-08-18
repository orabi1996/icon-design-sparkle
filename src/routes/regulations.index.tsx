import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Card,
  DataTable,
  Field,
  Input,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/regulations/")({
  head: () => ({
    meta: [
      { title: "لائحة الإستحقاقات | اللوائح المالية" },
      {
        name: "description",
        content:
          "إدارة لائحة الإستحقاقات: بدل السكن والنقل والبدلات الأخرى مع خصائص التكرار والراتب التأميني والاحتساب طبقاً لتاريخ المباشرة.",
      },
      { property: "og:title", content: "لائحة الإستحقاقات | اللوائح المالية" },
      { property: "og:description", content: "إضافة وتعديل إستحقاقات الموظفين وخصائصها المالية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entitlements,
});

const rows = [
  { a: "بدل سكن", e: "tesstt", t: "بدل سكن", rep: true, ins: true, hire: true, details: "edit" },
  { a: "بدل النقل", e: "Transportation allowance", t: "بدل نقل", rep: true, ins: true, hire: true, details: "add" },
  { a: "بدلات أخرى", e: "", t: "بدلات اخرى", rep: true, ins: false, hire: true, details: "edit" },
  { a: "بدل اتصالات", e: "", t: "بدلات اخرى", rep: false, ins: false, hire: true, details: "edit" },
  { a: "بدل انتقال", e: "", t: "بدلات اخرى", rep: false, ins: false, hire: true, details: "edit" },
  { a: "تكليف", e: "", t: "بدلات اخرى", rep: true, ins: false, hire: false, details: "add" },
  { a: "بدل تجربة", e: "", t: "بدلات اخرى", rep: false, ins: false, hire: true, details: "add" },
  { a: "مكافأة", e: "", t: "بدلات اخرى", rep: false, ins: false, hire: true, details: "add" },
  { a: "إستحقاق", e: "", t: "بدلات اخرى", rep: false, ins: false, hire: false, details: "edit" },
];

function Mark({ on }: { on: boolean }) {
  return on ? (
    <MaterialIcon name="check" size={18} className="text-teal" />
  ) : (
    <span className="inline-block size-3.5 rounded border border-border bg-secondary" />
  );
}

const columns = [
  "الإستحقاق",
  "الاسم بالإنجليزية",
  "يحسب طبقاً للمباشرة",
  "راتب تأميني",
  "قابل للتكرار",
  "نوع الإستحقاق",
  "تعديل",
  "التفاصيل",
];

function Entitlements() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "التهيئة المالية", "لائحة الإستحقاقات"]} />
      <PageBanner
        icon="add_circle"
        title="لائحة الإستحقاقات"
        subtitle="تهيئة بدلات وإستحقاقات الموظفين وخصائصها المالية"
        actions={
          <Btn icon="download" variant="onDark">
            تصدير
          </Btn>
        }
      />

      <div className="mt-4 space-y-4">
        <Card title="إضافة / تعديل إستحقاق" icon="tune">
          <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="الإستحقاق" required>
              <Input placeholder="اسم الإستحقاق" />
            </Field>
            <Field label="الإستحقاق بالإنجليزية">
              <Input placeholder="Allowance name" />
            </Field>
            <Field label="نوع الإستحقاق">
              <Select options={["اختر ....", "بدل سكن", "بدل نقل", "بدلات اخرى"]} />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {["راتب تأميني", "قابل للتكرار", "يحسب طبقاً لتاريخ المباشرة"].map((l) => (
              <label
                key={l}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5"
              >
                <input type="checkbox" className="size-4 accent-[var(--primary)]" />
                <span className="text-[12.5px] font-bold">{l}</span>
              </label>
            ))}
            <Btn icon="save" variant="teal">
              تعديل الإستحقاق
            </Btn>
          </div>
        </Card>

        <div
          className="overflow-hidden rounded-2xl border border-border bg-card"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <TableToolbar title="الإستحقاقات المسجلة" />
          <DataTable
            columns={columns}
            rows={rows.map((r) => ({
              "الإستحقاق": <span className="font-extrabold text-primary">{r.a}</span>,
              "الاسم بالإنجليزية": r.e || "—",
              "يحسب طبقاً للمباشرة": <Mark on={r.hire} />,
              "راتب تأميني": <Mark on={r.ins} />,
              "قابل للتكرار": <Mark on={r.rep} />,
              "نوع الإستحقاق": r.t,
              تعديل: (
                <button className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20">
                  <MaterialIcon name="edit" size={17} />
                </button>
              ),
              التفاصيل:
                r.details === "add" ? (
                  <button className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90">
                    <MaterialIcon name="add" size={16} />
                    اضافة تفاصيل
                  </button>
                ) : (
                  <button className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90">
                    <MaterialIcon name="edit_note" size={16} />
                    تعديل التفاصيل
                  </button>
                ),
            }))}
          />
          <Pager page={1} pages={6} total={51} />
        </div>
      </div>
    </div>
  );
}
