import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Check,
  DataTable,
  Field,
  Input,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/regulations/eos")({
  head: () => ({
    meta: [
      { title: "لائحة نهاية الخدمة | اللوائح" },
      {
        name: "description",
        content:
          "تهيئة لائحة نهاية الخدمة: أسباب الإيقاف، معادلات المكافأة حسب أيام العمل، نطاقات الجنسية والفئة الوظيفية، ومراحل اعتماد نهاية الخدمة.",
      },
      { property: "og:title", content: "لائحة نهاية الخدمة | اللوائح" },
      {
        property: "og:description",
        content: "أسباب الإيقاف ومعادلات مكافأة نهاية الخدمة ومراحل الاعتماد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EndOfServicePage,
});

type TabKey = "rule" | "stages";

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: "rule", label: "لائحة مكافأة نهاية الخدمة", icon: "workspace_premium" },
  { key: "stages", label: "مراحل اعتماد نهاية الخدمة", icon: "account_tree" },
];

const stopReasons = [
  "اختر ....",
  "استقالة بموجب المادة (٧٧) من نظام العمل",
  "إنهاء العقد او عدم التجديد بإتفاق الطرفين",
  "إنهاء العقد او عدم التجديد برغبة الموظف",
  "إنتهاء عقد",
  "فصل بموجب المادة (٧٧) من نظام العمل",
  "فسخ العقد بموجب فترة التجربة او التدريب",
];

const contractTypes = ["اختر ....", "محدد المدة تيست", "غير محدد المدة"];

const equations = [
  { from: "١", to: "٧٢٩", eq: "0" },
  { from: "٧٣٠", to: "١٨٢٥", eq: "((TotalSalary/365)*2)/3 * WorkingDays" },
  {
    from: "١٨٢٦",
    to: "٣٦٥٠",
    eq: "(((TotalSalary/365)*2)/3*1825) + ((TotalSalary/365)*(WorkingDays-1825))",
  },
];

const scopes: { title: string; items: string[] }[] = [
  {
    title: "الجنسيه",
    items: ["مصري", "سوري", "فلسطيني", "سعودي", "مصر", "مغربي", "سعودي ٢", "سعوديني"],
  },
  {
    title: "المستويات الوظيفية",
    items: ["إدارى", "تعليمي", "أكاديمي", "اداره اكاديميه", "إدارة عامة", "مستوى وظيفي تست ٢٠٢٤", "مستوى١", "تعليمي عليا"],
  },
  {
    title: "الفئة الوظيفية",
    items: [
      "سعودي تأمينات",
      "مقيم تأمينات",
      "مقيم خارج التأمينات",
      "سعودي خارج تأمينات",
      "أجير",
      "H.M",
      "مقيم بدون تأمينات",
      "فئه وظيفيه تست ٢٠٢٤",
    ],
  },
  {
    title: "الاستحقاقات",
    items: ["بدل سكن", "بدل النقل", "بدلات أخرى", "بدل اتصالات", "بدل انتقال", "تكليف", "بدل تجربة", "مكافأت"],
  },
];

const rules = [
  { reason: "استقالة بموجب المادة (٧٧) من نظام العمل", contract: "محدد المدة تيست", notes: "", def: false },
  { reason: "no", contract: "محدد المدة تيست", notes: "", def: true },
  { reason: "no", contract: "غير محدد المدة", notes: "", def: false },
  { reason: "إنهاء العقد او عدم التجديد بإتفاق الطرفين", contract: "محدد المدة تيست", notes: "", def: false },
  { reason: "إنهاء العقد او عدم التجديد بإتفاق الطرفين", contract: "غير محدد المدة", notes: "", def: true },
  { reason: "إنهاء العقد او عدم التجديد برغبة الموظف", contract: "محدد المدة تيست", notes: "", def: false },
  { reason: "إنهاء العقد او عدم التجديد برغبة الموظف", contract: "غير محدد المدة", notes: "", def: false },
  { reason: "إنتهاء عقد", contract: "غير محدد المدة", notes: "", def: false },
  { reason: "فصل بموجب المادة (٧٧) من نظام العمل", contract: "محدد المدة تيست", notes: "", def: false },
  { reason: "فسخ العقد بموجب فترة التجربة او التدريب", contract: "محدد المدة تيست", notes: "", def: false },
];

const stages = [
  { order: "١", name: "مرحلة ايقاف الموظف", stop: true, filter: false, final: false, on: false },
  { order: "٢", name: "مرحلة التصفيه", stop: false, filter: true, final: false, on: false },
  { order: "٣", name: "الاعتماد النهائى", stop: false, filter: false, final: false, on: true },
  { order: "٤", name: "الابلاغ", stop: false, filter: false, final: true, on: false },
];

const stageUsers = ["Admin", "admin 2", "System Admin", "systm", "محمد شعبان", "A.Faraj", "A.Rajab"];

function IconBtn({ icon, tone = "primary" }: { icon: string; tone?: "primary" | "danger" }) {
  return (
    <button
      className={`grid size-8 place-items-center rounded-lg transition-colors ${
        tone === "danger"
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      <MaterialIcon name={icon} size={17} />
    </button>
  );
}

function Tick({ on }: { on: boolean }) {
  return on ? (
    <MaterialIcon name="check" size={18} className="text-teal" />
  ) : (
    <span className="inline-block size-3.5 rounded border border-border bg-secondary" />
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold ${
        on ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
      }`}
    >
      <span className={`grid h-4 w-7 items-center rounded-full px-0.5 ${on ? "bg-primary" : "bg-muted-foreground/40"}`}>
        <span className={`size-3 rounded-full bg-card ${on ? "translate-x-0" : "translate-x-3"}`} />
      </span>
      {on ? "مفعل" : "ايقاف"}
    </span>
  );
}

function ScopeList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3" style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="mb-2 text-[12.5px] font-extrabold text-primary">{title}</h3>
      <div className="relative mb-2">
        <Input placeholder="بحث..." className="h-9 pe-9" />
        <MaterialIcon
          name="search"
          size={16}
          className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
        />
      </div>
      <label className="flex items-center justify-between rounded-lg bg-secondary/60 px-2.5 py-2 text-[12px] font-extrabold">
        تحديد الكل
        <input type="checkbox" className="size-4 accent-[var(--primary)]" />
      </label>
      <div className="mt-1 max-h-56 space-y-0.5 overflow-y-auto pe-1">
        {items.map((it) => (
          <label
            key={it}
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-secondary"
          >
            {it}
            <input type="checkbox" className="size-4 accent-[var(--primary)]" />
          </label>
        ))}
      </div>
    </div>
  );
}

function Modal({
  title,
  submit,
  onClose,
  children,
}: {
  title: string;
  submit: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-raised)" }}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-extrabold text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="ms-auto grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <MaterialIcon name="close" size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto bg-secondary/40 p-5">{children}</div>
        <div className="flex justify-center gap-2 border-t border-border px-5 py-4">
          <Btn icon="add" variant="teal" onClick={onClose}>
            {submit}
          </Btn>
          <Btn variant="ghost" onClick={onClose}>
            إلغاء
          </Btn>
        </div>
      </div>
    </div>
  );
}

function EndOfServicePage() {
  const [tab, setTab] = useState<TabKey>("rule");
  const [open, setOpen] = useState<"stage" | "users" | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "لائحة نهاية الخدمة"]} />
      <PageBanner
        icon="assignment_turned_in"
        title="لائحة نهاية الخدمة"
        subtitle="أسباب الإيقاف · معادلات المكافأة · نطاقات التطبيق · مراحل الاعتماد"
        actions={
          <Btn icon="download" variant="onDark">
            تصدير
          </Btn>
        }
      />

      <div
        className="mt-4 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-2"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {tabs.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-bold transition-colors ${
                on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <MaterialIcon name={t.icon} size={18} filled={on} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "rule" && (
        <div className="mt-4 space-y-4">
          <div
            className="rounded-2xl border border-border bg-card p-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary">
              <MaterialIcon name="rule" size={18} />
              بيانات اللائحة
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="سبب الايقاف" required>
                <Select options={stopReasons} />
              </Field>
              <Field label="نوع العقد" required>
                <Select options={contractTypes} />
              </Field>
              <Field label="ملاحظات">
                <Input placeholder="ملاحظات..." />
              </Field>
              <div className="flex items-end">
                <Check label="افتراضى" hint="تطبيق هذه اللائحة تلقائياً" />
              </div>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-2xl border border-border bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <TableToolbar title="المعادلة" />
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="من عدد ايام عمل" required>
                    <Input type="number" defaultValue={1} />
                  </Field>
                  <Field label="الى عدد ايام عمل" required>
                    <Input type="number" defaultValue={2} />
                  </Field>
                </div>
                <Field label="معادلة الراتب">
                  <Input placeholder="ادخل المعادلة مع استخدام المتغيرات المتاحة فقط" />
                </Field>
                <div className="flex flex-wrap gap-1.5">
                  {["TotalSalary", "WorkingDays", "BasicSalary", "365"].map((v) => (
                    <span
                      key={v}
                      className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-[11.5px] font-bold text-primary"
                    >
                      {v}
                    </span>
                  ))}
                </div>
                <Btn icon="add" variant="teal">
                  اضافة معادلة
                </Btn>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <DataTable
                  columns={["من", "الى", "المعادلة", "حذف"]}
                  rows={equations.map((e) => ({
                    من: <span className="font-extrabold text-primary">{e.from}</span>,
                    الى: e.to,
                    المعادلة: <span className="font-mono text-[11.5px] font-bold">{e.eq}</span>,
                    حذف: <IconBtn icon="delete" tone="danger" />,
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {scopes.map((s) => (
              <ScopeList key={s.title} title={s.title} items={s.items} />
            ))}
          </div>

          <div className="flex justify-end">
            <Btn icon="save" variant="teal">
              حفظ
            </Btn>
          </div>

          <div
            className="overflow-hidden rounded-2xl border border-border bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <TableToolbar title="لوائح نهاية الخدمة المسجلة" />
            <DataTable
              columns={["سبب الايقاف", "نوع العقد", "ملاحظات", "افتراضى", "تعديل", "حذف"]}
              rows={rules.map((r, i) => ({
                "سبب الايقاف": (
                  <button
                    onClick={() => setExpanded(expanded === `${i}` ? null : `${i}`)}
                    className="flex items-center gap-1.5 font-extrabold text-primary"
                  >
                    <MaterialIcon name={expanded === `${i}` ? "expand_more" : "chevron_left"} size={16} />
                    {r.reason}
                  </button>
                ),
                "نوع العقد": r.contract,
                ملاحظات: r.notes || "—",
                افتراضى: <Tick on={r.def} />,
                تعديل: <IconBtn icon="edit" />,
                حذف: <IconBtn icon="delete" tone="danger" />,
              }))}
            />
            <Pager page={1} pages={2} total={15} />
          </div>

          {expanded && (
            <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
              <div
                className="overflow-hidden rounded-2xl border border-border bg-card"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <TableToolbar title="تفاصيل المعادلة" />
                <DataTable
                  columns={["من", "الى", "المعادلة"]}
                  rows={equations.map((e) => ({
                    من: <span className="font-extrabold text-primary">{e.from}</span>,
                    الى: e.to,
                    المعادلة: <span className="font-mono text-[11.5px] font-bold">{e.eq}</span>,
                  }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {scopes.map((s) => (
                  <div
                    key={s.title}
                    className="rounded-2xl border border-border bg-card p-3"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <h3 className="mb-1.5 text-[12px] font-extrabold text-primary">{s.title}</h3>
                    <ul className="space-y-1 text-[12px] font-semibold text-muted-foreground">
                      {s.items.slice(0, 6).map((it) => (
                        <li key={it} className="rounded-md bg-secondary/60 px-2 py-1">
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "stages" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Btn icon="add" variant="teal" onClick={() => setOpen("stage")}>
              اضافة مرحلة جديدة
            </Btn>
          </div>
          <div
            className="overflow-hidden rounded-2xl border border-border bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <TableToolbar title="مراحل اعتماد نهاية الخدمة" />
            <DataTable
              columns={[
                "ترتيب مرحلة",
                "اسم المرحلة",
                "ايقاف الموظف",
                "تصفية",
                "اعتماد نهائى",
                "اضافة مستخدمين للمرحلة",
                "تعديل",
                "حذف",
                "تفعيل - ايقاف",
              ]}
              rows={stages.map((s) => ({
                "ترتيب مرحلة": <span className="font-extrabold text-primary">{s.order}</span>,
                "اسم المرحلة": (
                  <button
                    onClick={() => setExpandedStage(expandedStage === s.name ? null : s.name)}
                    className="flex items-center gap-1.5 font-extrabold text-primary"
                  >
                    <MaterialIcon name={expandedStage === s.name ? "expand_more" : "chevron_left"} size={16} />
                    {s.name}
                  </button>
                ),
                "ايقاف الموظف": <Tick on={s.stop} />,
                تصفية: <Tick on={s.filter} />,
                "اعتماد نهائى": <Tick on={s.final} />,
                "اضافة مستخدمين للمرحلة": (
                  <button
                    onClick={() => setOpen("users")}
                    className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <MaterialIcon name="person_add" size={16} />
                    اضافة مستخدمين
                  </button>
                ),
                تعديل: <IconBtn icon="edit" />,
                حذف: <IconBtn icon="delete" tone="danger" />,
                "تفعيل - ايقاف": <Toggle on={s.on} />,
              }))}
            />
            <Pager page={1} pages={1} total={4} />
          </div>

          {expandedStage && (
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card lg:max-w-md"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title={`مستخدمو المرحلة: ${expandedStage}`} />
              <DataTable
                columns={["اسم المستخدم", "حذف"]}
                rows={stageUsers.map((u) => ({
                  "اسم المستخدم": <span className="font-extrabold text-primary">{u}</span>,
                  حذف: <IconBtn icon="delete" tone="danger" />,
                }))}
              />
            </div>
          )}
        </div>
      )}

      {open === "stage" && (
        <Modal title="اضافة مرحلة جديدة" submit="اضافة مرحلة جديدة" onClose={() => setOpen(null)}>
          <Field label="ترتيب مرحلة" required>
            <Input type="number" defaultValue={5} />
          </Field>
          <Field label="اسم المرحلة" required />
          <Field label="اسم المرحلة بالانجليزيه" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Check label="ايقاف الموظف" />
            <Check label="تصفية" />
            <Check label="اعتماد نهائى" />
          </div>
        </Modal>
      )}

      {open === "users" && (
        <Modal title="اضافة مستخدمين للمرحلة" submit="اضافة" onClose={() => setOpen(null)}>
          <Field label="المستخدم">
            <Select options={["اختر ....", ...stageUsers]} />
          </Field>
          <div className="rounded-xl border border-border bg-card p-3">
            <h3 className="mb-2 text-[12px] font-extrabold text-primary">المستخدمون الحاليون</h3>
            <ul className="space-y-1 text-[12.5px] font-semibold">
              {stageUsers.map((u) => (
                <li key={u} className="flex items-center justify-between rounded-lg bg-secondary/60 px-2.5 py-1.5">
                  {u}
                  <IconBtn icon="delete" tone="danger" />
                </li>
              ))}
            </ul>
          </div>
        </Modal>
      )}
    </div>
  );
}