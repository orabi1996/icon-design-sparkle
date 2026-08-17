import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { AppShell } from "@/components/hr/AppShell";
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

export const Route = createFileRoute("/request-notifications")({
  head: () => ({
    meta: [
      { title: "اشعارات الطلبات | متابعة طلبات الموظفين" },
      {
        name: "description",
        content: "متابعة اشعارات وطلبات الموظفين حسب الفرع والقسم والنوع والحالة مع إمكانية الاعتماد والرفض.",
      },
      { property: "og:title", content: "اشعارات الطلبات | متابعة طلبات الموظفين" },
      { property: "og:description", content: "لوحة موحدة لمتابعة كل طلبات الموظفين وحالات اعتمادها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestNotifications,
});

const data = [
  { no: "٤٥٢١", name: "سارة العتيبي", dept: "التسويق", branch: "الرئيسي", type: "إجازة سنوية", date: "٢٠٢٦/٠٨/١٤", from: "٢٠٢٦/٠٩/٠١", to: "٢٠٢٦/٠٩/٠٥", state: "بانتظار الاعتماد" },
  { no: "٤٥٢٢", name: "محمد الحربي", dept: "تقنية المعلومات", branch: "الرئيسي", type: "سلفة راتب", date: "٢٠٢٦/٠٨/١٤", from: "-", to: "-", state: "معتمد" },
  { no: "٤٥٢٣", name: "نورة القحطاني", dept: "المالية", branch: "جدة", type: "خطاب تعريف", date: "٢٠٢٦/٠٨/١٣", from: "-", to: "-", state: "قيد المراجعة" },
  { no: "٤٥٢٤", name: "خالد الزهراني", dept: "العمليات", branch: "الدمام", type: "إجازة مرضية", date: "٢٠٢٦/٠٨/١٢", from: "٢٠٢٦/٠٨/١٣", to: "٢٠٢٦/٠٨/١٤", state: "معتمد" },
  { no: "٤٥٢٥", name: "ريم السالم", dept: "التسويق", branch: "الرئيسي", type: "إذن خروج", date: "٢٠٢٦/٠٨/١٢", from: "٢٠٢٦/٠٨/١٢", to: "٢٠٢٦/٠٨/١٢", state: "مرفوض" },
  { no: "٤٥٢٦", name: "عبدالله الشمري", dept: "الموارد البشرية", branch: "جدة", type: "تجديد عقد", date: "٢٠٢٦/٠٨/١١", from: "٢٠٢٦/٠٩/٢٠", to: "٢٠٢٧/٠٩/١٩", state: "بانتظار الاعتماد" },
];

const columns = ["رقم الطلب", "اسم الموظف", "القسم", "الفرع", "نوع الطلب", "تاريخ الطلب", "من تاريخ", "إلى تاريخ", "الحالة", "إجراءات"];

const tones: Record<string, "green" | "teal" | "blue" | "muted"> = {
  معتمد: "green",
  "بانتظار الاعتماد": "teal",
  "قيد المراجعة": "blue",
  مرفوض: "muted",
};

const counters = [
  { label: "إجمالي الطلبات", value: "١٤٨", icon: "inbox", cls: "bg-sky/12 text-sky" },
  { label: "بانتظار الاعتماد", value: "١٨", icon: "pending_actions", cls: "bg-cyan/12 text-cyan" },
  { label: "معتمدة هذا الشهر", value: "١٠٤", icon: "task_alt", cls: "bg-teal/12 text-teal" },
  { label: "مرفوضة", value: "٩", icon: "block", cls: "bg-indigo/12 text-indigo" },
];

function RequestNotifications() {
  const rows = data.map((d) => ({
    "رقم الطلب": <span className="font-extrabold text-primary">{d.no}</span>,
    "اسم الموظف": d.name,
    القسم: d.dept,
    الفرع: d.branch,
    "نوع الطلب": d.type,
    "تاريخ الطلب": d.date,
    "من تاريخ": d.from,
    "إلى تاريخ": d.to,
    الحالة: <Chip label={d.state} tone={tones[d.state]} />,
    إجراءات: (
      <span className="flex items-center gap-1">
        <button className="grid size-8 place-items-center rounded-lg bg-teal/12 text-teal transition-colors hover:bg-teal/20" title="اعتماد">
          <MaterialIcon name="check" size={17} />
        </button>
        <button className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent" title="رفض">
          <MaterialIcon name="close" size={17} />
        </button>
        <button className="grid size-8 place-items-center rounded-lg bg-secondary text-primary transition-colors hover:bg-accent" title="تفاصيل">
          <MaterialIcon name="visibility" size={17} />
        </button>
      </span>
    ),
  }));

  return (
    <AppShell>
      <Breadcrumbs trail={["عمليات شؤون الموظفين", "اشعارات الطلبات"]} />
      <PageBanner
        icon="notifications_active"
        title="اشعارات الطلبات"
        subtitle="متابعة واعتماد طلبات الموظفين"
        actions={
          <>
            <Btn icon="done_all" variant="onDark">
              اعتماد المحدد
            </Btn>
            <Btn icon="download" variant="onDark">
              تصدير
            </Btn>
          </>
        }
      />

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {counters.map((c) => (
          <article
            key={c.label}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <span className={`grid size-11 place-items-center rounded-2xl ${c.cls}`}>
              <MaterialIcon name={c.icon} size={22} filled />
            </span>
            <div>
              <p className="text-2xl font-extrabold leading-none">{c.value}</p>
              <p className="mt-1 text-[12px] font-bold text-muted-foreground">{c.label}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="mt-4">
        <Card title="بحث وتصفية" icon="filter_alt">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="الفرع">
              <Select options={["الكل", "الرئيسي", "جدة", "الدمام"]} />
            </Field>
            <Field label="القسم">
              <Select options={["الكل", "التسويق", "تقنية المعلومات", "المالية", "الموارد البشرية", "العمليات"]} />
            </Field>
            <Field label="نوع الطلب">
              <Select options={["الكل", "إجازة سنوية", "إجازة مرضية", "سلفة راتب", "خطاب تعريف", "إذن خروج", "تجديد عقد"]} />
            </Field>
            <Field label="حالة الطلب">
              <Select options={["الكل", "بانتظار الاعتماد", "قيد المراجعة", "معتمد", "مرفوض"]} />
            </Field>
            <Field label="من تاريخ">
              <DateInput />
            </Field>
            <Field label="إلى تاريخ">
              <DateInput />
            </Field>
            <Field label="اسم الموظف" />
            <Field label="رقم الطلب" />
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
        <TableToolbar title="قائمة الاشعارات" />
        <DataTable columns={columns} rows={rows} />
        <Pager page={1} pages={5} total={148} />
      </div>
    </AppShell>
  );
}
