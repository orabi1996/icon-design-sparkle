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

export const Route = createFileRoute("/regulations/deductions")({
  head: () => ({
    meta: [
      { title: "لائحة الإستقطاعات | اللوائح المالية" },
      {
        name: "description",
        content:
          "تهيئة لائحة الإستقطاعات: التأمينات الاجتماعية والخصومات الخاصة ونسب الاحتساب من الراتب والوظائف والجنسيات المشمولة.",
      },
      { property: "og:title", content: "لائحة الإستقطاعات | اللوائح المالية" },
      { property: "og:description", content: "إضافة وتعديل إستقطاعات الموظفين ونسب احتسابها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Deductions,
});

const months = "١,٢,٣,٤,٥,٦,٧,٨,٩,١٠,١١,١٢";

const rows = [
  { d: "خصم سلفة خاصة", e: "as", v: "٠", m: "—", nat: "سوري", job: "مقيم تأمينات", def: false, kind: "مقطوع", ent: "بدل سكن", hire: false, soc: false },
  { d: "التعطل عن العمل - ساند", e: "insurance", v: "٠.٧٥", m: "٣,٤,٥,٦,٧,٨,٩,١٠,١١,١٢", nat: "سعودي", job: "سعودي تأمينات", def: true, kind: "نسبة من الراتب", ent: "بدل سكن - بدل النقل", hire: true, soc: true },
  { d: "خصم خاص", e: "fgfg", v: "١", m: months, nat: "سعودي", job: "كل الوظائف", def: false, kind: "نسبة من الراتب", ent: "كل الوظائف", hire: true, soc: false },
  { d: "التأمينات الاجتماعية حصة الموظف", e: "Employee Share in Insurance", v: "١", m: months, nat: "سوري", job: "فئة١", def: true, kind: "نسبة من الراتب", ent: "الاجر التأميني", hire: true, soc: true },
  { d: "تأمينات اجتماعية بلس", e: "plus", v: "١", m: months, nat: "سعودي", job: "سعودي تأمينات بلس", def: true, kind: "نسبة من الراتب", ent: "بدل النقل - بدلات أخرى", hire: true, soc: true },
  { d: "التأمينات الاجتماعية حصة الشركة", e: "ww", v: "١", m: months, nat: "سوري", job: "العمل عن بعد", def: true, kind: "نسبة من الراتب", ent: "الاجر التأميني", hire: true, soc: true },
  { d: "التأمينات الاجتماعية بلس", e: "askgk", v: "١", m: months, nat: "سعودي", job: "سعودي تأمينات بلس", def: true, kind: "نسبة من الراتب", ent: "بدل سكن", hire: true, soc: true },
  { d: "خصم تأمينات اجتماعية جديد", e: "hghha", v: "١", m: months, nat: "سعودي", job: "سعودي تأمينات بلس", def: true, kind: "نسبة من الراتب", ent: "بدل سكن", hire: true, soc: true },
  { d: "تأمينات اجتماعية ١٠.٢٥ بلس", e: "a", v: "١", m: months, nat: "سعودي", job: "سعودي تأمينات بلس", def: true, kind: "نسبة من الراتب", ent: "بدل سكن", hire: true, soc: true },
  { d: "تأمينات اجتماعية اجازة بدون راتب", e: "u", v: "١", m: months, nat: "سعودي", job: "سعودي تأمينات اجازة بدون راتب", def: true, kind: "نسبة من الراتب", ent: "بدل سكن", hire: true, soc: true },
];

function Mark({ on }: { on: boolean }) {
  return on ? (
    <MaterialIcon name="check" size={18} className="text-teal" />
  ) : (
    <span className="inline-block size-3.5 rounded border border-border bg-secondary" />
  );
}

const columns = [
  "الإستقطاع",
  "الاسم بالإنجليزية",
  "القيمة",
  "الشهور",
  "الجنسية",
  "افتراضي",
  "الوظيفة",
  "نوع القيمة",
  "خصم الإستحقاقات الافتراضية",
  "الإستحقاقات",
  "إحتساب بتاريخ المباشرة",
  "التأمينات الاجتماعية",
  "تعديل",
];

function Deductions() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "التهيئة المالية", "لائحة الإستقطاعات"]} />
      <PageBanner
        icon="remove_circle"
        title="لائحة الإستقطاعات"
        subtitle="تهيئة الخصومات والتأمينات الاجتماعية ونسب احتسابها"
        actions={
          <Btn icon="download" variant="onDark">
            تصدير
          </Btn>
        }
      />

      <div className="mt-4 space-y-4">
        <Card title="إضافة إستقطاع" icon="tune">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="الإستقطاع" required>
              <Input placeholder="اسم الإستقطاع" />
            </Field>
            <Field label="الإستقطاع بالإنجليزية">
              <Input placeholder="Deduction name" />
            </Field>
            <Field label="نوع القيمة">
              <Select options={["اختر ....", "مقطوع", "نسبة من الراتب"]} />
            </Field>
            <Field label="القيمة">
              <Input type="number" defaultValue={0} />
            </Field>
            <Field label="الجنسية">
              <Select options={["اختر ....", "سعودي", "سوري", "مصري"]} />
            </Field>
            <Field label="الوظيفة">
              <Select options={["اختر ....", "كل الوظائف", "سعودي تأمينات", "العمل عن بعد"]} />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {["إحتساب بتاريخ المباشرة", "افتراضي", "التأمينات الاجتماعية", "الإستحقاقات الافتراضية"].map((l) => (
              <label
                key={l}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5"
              >
                <input type="checkbox" className="size-4 accent-[var(--primary)]" />
                <span className="text-[12.5px] font-bold">{l}</span>
              </label>
            ))}
            <Btn icon="add" variant="teal">
              إضافة إستقطاع
            </Btn>
          </div>
        </Card>

        <div
          className="overflow-hidden rounded-2xl border border-border bg-card"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <TableToolbar title="الإستقطاعات المسجلة" />
          <DataTable
            columns={columns}
            rows={rows.map((r) => ({
              "الإستقطاع": <span className="font-extrabold text-primary">{r.d}</span>,
              "الاسم بالإنجليزية": r.e,
              القيمة: r.v,
              الشهور: <span className="text-[12px] text-muted-foreground">{r.m}</span>,
              الجنسية: r.nat,
              افتراضي: <Mark on={r.def} />,
              الوظيفة: r.job,
              "نوع القيمة": r.kind,
              "خصم الإستحقاقات الافتراضية": <Mark on={r.soc} />,
              "الإستحقاقات": r.ent,
              "إحتساب بتاريخ المباشرة": <Mark on={r.hire} />,
              "التأمينات الاجتماعية": <Mark on={r.soc} />,
              تعديل: (
                <button className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20">
                  <MaterialIcon name="edit" size={17} />
                </button>
              ),
            }))}
          />
          <Pager page={1} pages={4} total={32} />
        </div>
      </div>
    </div>
  );
}
