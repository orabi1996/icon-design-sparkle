import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Card,
  Chip,
  DataTable,
  DateInput,
  Field,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/staff/contracts")({
  head: () => ({
    meta: [
      { title: "تجديد العقود | متابعة عقود الموظفين" },
      {
        name: "description",
        content: "متابعة تواريخ انتهاء عقود الموظفين وتجديدها بشكل فردي أو جماعي مع تنبيهات المدة المتبقية.",
      },
      { property: "og:title", content: "تجديد العقود | متابعة عقود الموظفين" },
      { property: "og:description", content: "قائمة العقود المنتهية والقريبة من الانتهاء وإجراءات التجديد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contracts,
});

const data = [
  { id: "١٠٢٤", name: "سارة العتيبي", job: "أخصائية تسويق", dept: "التسويق", start: "٢٠٢١/٠٣/١٤", end: "٢٠٢٦/٠٣/١٣", left: "٢١٠ يوم", state: "ساري" },
  { id: "١٠٣١", name: "محمد الحربي", job: "مطور برمجيات", dept: "تقنية المعلومات", start: "٢٠٢٠/٠٩/٠١", end: "٢٠٢٥/٠٩/٠١", left: "٢٥ يوم", state: "قريب الانتهاء" },
  { id: "١٠٤٥", name: "نورة القحطاني", job: "محاسبة", dept: "المالية", start: "٢٠٢٢/٠١/١٠", end: "٢٠٢٥/٠٨/١٠", left: "منتهي", state: "منتهي" },
  { id: "١٠٥٢", name: "خالد الزهراني", job: "مشرف عمليات", dept: "العمليات", start: "٢٠١٩/٠٦/٢٣", end: "٢٠٢٦/٠٦/٢٢", left: "٣١١ يوم", state: "ساري" },
  { id: "١٠٧٣", name: "عبدالله الشمري", job: "أخصائي موارد بشرية", dept: "الموارد البشرية", start: "٢٠٢٢/١١/١٨", end: "٢٠٢٥/٠٩/٢٠", left: "٤٤ يوم", state: "قريب الانتهاء" },
];

const columns = ["", "الرقم الوظيفي", "اسم الموظف", "الوظيفة الحالية", "القسم", "بداية العقد", "نهاية العقد", "المتبقي", "الحالة", "تجديد"];

const tones: Record<string, "green" | "teal" | "muted"> = {
  ساري: "green",
  "قريب الانتهاء": "teal",
  منتهي: "muted",
};

const summary = [
  { label: "عقود سارية", value: "٢٨١", icon: "verified", cls: "bg-teal/12 text-teal" },
  { label: "قريبة الانتهاء", value: "٢٦", icon: "hourglass_top", cls: "bg-cyan/12 text-cyan" },
  { label: "منتهية", value: "١٧", icon: "event_busy", cls: "bg-indigo/12 text-indigo" },
  { label: "بانتظار الاعتماد", value: "٩", icon: "pending_actions", cls: "bg-sky/12 text-sky" },
];

function Contracts() {
  const rows = data.map((d) => ({
    "": <input type="checkbox" className="size-4 accent-[var(--primary)]" />,
    "الرقم الوظيفي": d.id,
    "اسم الموظف": d.name,
    "الوظيفة الحالية": d.job,
    القسم: d.dept,
    "بداية العقد": d.start,
    "نهاية العقد": d.end,
    المتبقي: <span className="font-extrabold">{d.left}</span>,
    الحالة: <Chip label={d.state} tone={tones[d.state] ?? "muted"} />,
    تجديد: (
      <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90">
        <MaterialIcon name="autorenew" size={16} />
        تجديد
      </button>
    ),
  }));

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["شؤون الموظفين", "تجديد العقود"]} />
      <PageBanner
        icon="description"
        title="تجديد العقود"
        subtitle="متابعة العقود المنتهية والقريبة من الانتهاء"
        actions={
          <>
            <Btn icon="done_all" variant="onDark">
              تجديد جماعي
            </Btn>
            <Btn icon="download" variant="onDark">
              تصدير
            </Btn>
          </>
        }
      />

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((s) => (
          <article
            key={s.label}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <span className={`grid size-11 place-items-center rounded-2xl ${s.cls}`}>
              <MaterialIcon name={s.icon} size={22} filled />
            </span>
            <div>
              <p className="text-2xl font-extrabold leading-none">{s.value}</p>
              <p className="mt-1 text-[12px] font-bold text-muted-foreground">{s.label}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="mt-4">
        <Card title="تصفية العقود" icon="filter_alt">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="الفرع">
              <Select options={["الكل", "الرئيسي", "جدة", "الدمام"]} />
            </Field>
            <Field label="القسم">
              <Select options={["الكل", "التسويق", "تقنية المعلومات", "المالية", "الموارد البشرية"]} />
            </Field>
            <Field label="حالة العقد">
              <Select options={["الكل", "ساري", "قريب الانتهاء", "منتهي"]} />
            </Field>
            <Field label="نوع العقد">
              <Select options={["الكل", "محدد المدة", "غير محدد المدة"]} />
            </Field>
            <Field label="من تاريخ">
              <DateInput />
            </Field>
            <Field label="إلى تاريخ">
              <DateInput />
            </Field>
            <Field label="اسم الموظف" />
            <Field label="الرقم الوظيفي" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn icon="search">بحث</Btn>
            <Btn icon="restart_alt" variant="ghost">
              إعادة تعيين
            </Btn>
          </div>
        </Card>
      </div>

      <div
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <TableToolbar title="عقود الموظفين" />
        <DataTable columns={columns} rows={rows} />
        <Pager page={1} pages={3} total={324} />
      </div>
    </div>
  );
}
