import { createFileRoute, Link } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Card,
  Chip,
  DataTable,
  Field,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [
      { title: "شؤون الموظفين | إدارة بيانات الموظفين" },
      {
        name: "description",
        content: "استعراض وتصفية بيانات الموظفين حسب الفرع والقسم والحالة الوظيفية مع إمكانية التعديل والتصدير.",
      },
      { property: "og:title", content: "شؤون الموظفين | إدارة بيانات الموظفين" },
      { property: "og:description", content: "قائمة الموظفين مع فلاتر متقدمة وإجراءات سريعة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffList,
});

const employees = [
  { id: "١٠٢٤", name: "سارة العتيبي", job: "أخصائية تسويق", dept: "التسويق", branch: "الرئيسي", hire: "٢٠٢١/٠٣/١٤", state: "نشط" },
  { id: "١٠٣١", name: "محمد الحربي", job: "مطور برمجيات", dept: "تقنية المعلومات", branch: "الرئيسي", hire: "٢٠٢٠/٠٩/٠١", state: "نشط" },
  { id: "١٠٤٥", name: "نورة القحطاني", job: "محاسبة", dept: "المالية", branch: "جدة", hire: "٢٠٢٢/٠١/١٠", state: "إجازة" },
  { id: "١٠٥٢", name: "خالد الزهراني", job: "مشرف عمليات", dept: "العمليات", branch: "الدمام", hire: "٢٠١٩/٠٦/٢٣", state: "نشط" },
  { id: "١٠٦٠", name: "ريم السالم", job: "مصممة جرافيك", dept: "التسويق", branch: "الرئيسي", hire: "٢٠٢٣/٠٢/٠٥", state: "موقوف" },
  { id: "١٠٧٣", name: "عبدالله الشمري", job: "أخصائي موارد بشرية", dept: "الموارد البشرية", branch: "جدة", hire: "٢٠٢٢/١١/١٨", state: "نشط" },
];

const columns = ["الرقم الوظيفي", "اسم الموظف", "المسمى الوظيفي", "القسم", "الفرع", "تاريخ التعيين", "الحالة", "إجراءات"];

const tone: Record<string, "green" | "teal" | "muted"> = { نشط: "green", إجازة: "teal", موقوف: "muted" };

function StaffList() {
  const rows = employees.map((e) => ({
    "الرقم الوظيفي": e.id,
    "اسم الموظف": (
      <span className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-accent text-[12px] font-bold text-accent-foreground">
          {e.name.charAt(0)}
        </span>
        {e.name}
      </span>
    ),
    "المسمى الوظيفي": e.job,
    القسم: e.dept,
    الفرع: e.branch,
    "تاريخ التعيين": e.hire,
    الحالة: <Chip label={e.state} tone={tone[e.state] ?? "muted"} />,
    إجراءات: (
      <span className="flex items-center gap-1">
        {["visibility", "edit", "print"].map((ic) => (
          <button
            key={ic}
            className="grid size-8 place-items-center rounded-lg bg-secondary text-primary transition-colors hover:bg-accent"
          >
            <MaterialIcon name={ic} size={17} />
          </button>
        ))}
      </span>
    ),
  }));

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["عمليات شؤون الموظفين", "شؤون الموظفين"]} />
      <PageBanner
        icon="badge"
        title="شؤون الموظفين"
        subtitle="إدارة بيانات الموظفين والبحث والتصفية"
        actions={
          <>
            <Link to="/staff/add">
              <Btn icon="person_add" variant="onDark">
                إضافة موظف
              </Btn>
            </Link>
            <Btn icon="upload_file" variant="onDark">
              استيراد
            </Btn>
          </>
        }
      />

      <div className="mt-4">
        <Card title="بحث وتصفية" icon="filter_alt">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="الفرع">
              <Select options={["الكل", "الرئيسي", "جدة", "الدمام"]} />
            </Field>
            <Field label="القسم">
              <Select options={["الكل", "التسويق", "تقنية المعلومات", "المالية", "الموارد البشرية", "العمليات"]} />
            </Field>
            <Field label="المسمى الوظيفي">
              <Select options={["الكل", "مطور برمجيات", "محاسبة", "مشرف عمليات"]} />
            </Field>
            <Field label="الحالة الوظيفية">
              <Select options={["الكل", "نشط", "إجازة", "موقوف"]} />
            </Field>
            <Field label="الرقم الوظيفي" />
            <Field label="اسم الموظف" />
            <Field label="رقم الهوية" />
            <Field label="الجنسية">
              <Select options={["الكل", "سعودي", "مصري", "سوداني", "هندي"]} />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn icon="search">بحث</Btn>
            <Btn icon="restart_alt" variant="ghost">
              إعادة تعيين
            </Btn>
          </div>
        </Card>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
        <TableToolbar title="قائمة الموظفين" />
        <DataTable columns={columns} rows={rows} />
        <Pager page={1} pages={4} total={324} />
      </div>
    </div>
  );
}
