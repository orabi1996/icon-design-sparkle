import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  DataTable,
  Field,
  Input,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/regulations/other")({
  head: () => ({
    meta: [
      { title: "لوائح أخرى | اللوائح" },
      {
        name: "description",
        content:
          "لوائح أخرى: لائحة الجزاءات وتفاصيلها، مراحل اعتماد التأشيرات وإسناد المستخدمين، ولائحة المصاريف الحكومية.",
      },
      { property: "og:title", content: "لوائح أخرى | اللوائح" },
      { property: "og:description", content: "الجزاءات ومراحل اعتماد التأشيرات والمصاريف الحكومية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OtherRegulations,
});

type TabKey = "penalties" | "visas" | "govExpenses";

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: "penalties", label: "لائحة الجزاءات", icon: "gavel" },
  { key: "visas", label: "مراحل اعتماد التأشيرات", icon: "account_tree" },
  { key: "govExpenses", label: "لائحة المصاريف الحكومية", icon: "account_balance" },
];

const penalties = [
  { name: "جزاء تاخير ٦٠", en: "", job: "أجير", type: "شهري", deduct: false, on: true },
  { name: "٥٠٠", en: "", job: "H.M", type: "شهري", deduct: true, on: true },
  { name: "تقصير في العمل", en: "", job: "كل الوظائف", type: "سنوي", deduct: true, on: true },
  { name: "تست", en: "", job: "كل الوظائف", type: "شهري", deduct: false, on: false },
  { name: "جزاء تست المساءلات", en: "", job: "كل الوظائف", type: "شهري", deduct: true, on: false },
  { name: "تأخير بدون إذن مسبق", en: "", job: "كل الوظائف", type: "شهري", deduct: false, on: true },
  { name: "الأكل الجماعي", en: "", job: "كل الوظائف", type: "شهري", deduct: true, on: true },
  { name: "جزاء جديد تست", en: "", job: "كل الوظائف", type: "شهري", deduct: false, on: true },
  { name: "جزاء خصم يوم غياب", en: "abc", job: "كل الوظائف", type: "شهري", deduct: true, on: true },
  { name: "جزاء مساعله غياب للموظف", en: "", job: "كل الوظائف", type: "شهري", deduct: true, on: true },
];

const penaltyDetails = [
  { from: "١", to: "١", val: "٢٥", kind: "نسبة من اليوم" },
  { from: "٢", to: "٢", val: "٥٠", kind: "نسبة من اليوم" },
  { from: "٣", to: "٣", val: "١", kind: "يوم" },
  { from: "٤", to: "٤", val: "٢", kind: "يوم" },
  { from: "٥", to: "٦", val: "٤", kind: "يوم" },
  { from: "٧", to: "٧", val: "٤", kind: "نسبة من الراتب" },
  { from: "٨", to: "٨", val: "٠", kind: "مقطوع" },
  { from: "٩", to: "٩", val: "١٠٠", kind: "مقطوع" },
];

const stages = [
  { order: "١", name: "الموارد البشرية", fin: true },
  { order: "٢", name: "المدير", fin: false },
];

const stageUsers = ["System Admin", "احمد ابراهيم احمد على", "ابراهيم احمد محمد دويب", "systm", "حكيم"];

const govExpenses = [
  { name: "مصروف تأمينات حصه الشركة - الاخطار المهنية ٢٪", kind: "نسبة", val: "٢", byDate: "نعم", on: true },
  { name: "حصه صاحب العمل - التعطل عن العمل - ساند", kind: "نسبة", val: "٠.٧٥", byDate: "نعم", on: true },
  { name: "حصة صاحب العمل - المعاشات", kind: "نسبة", val: "٩", byDate: "نعم", on: true },
  { name: "مصروف معاشات تحمل الشركة بلس", kind: "نسبة", val: "١٠.٢٥", byDate: "نعم", on: true },
  { name: "مصروف", kind: "نسبة", val: "٥٠٠٠", byDate: "نعم", on: true },
  { name: "حصه صاحب العمل معاشات", kind: "مقطوع", val: "١", byDate: "نعم", on: false },
  { name: "مصاريف حكومية", kind: "مقطوع", val: "١٠", byDate: "نعم", on: false },
];

const jobs = ["اختر ....", "كل الوظائف", "أجير", "مقيم تأمينات", "مقيم خارج التأمينات"];

const govScopes: { title: string; items: string[] }[] = [
  { title: "الاستحقاقات", items: ["راتب اساسى", "بدل سكن"] },
  {
    title: "الكفالة",
    items: [
      "كفالة افتراضية تيست",
      "شركة الحلول الخبيرة لتقنية المعلومات",
      "الحلول الخبيره",
      "شركة الحلول الخبيرة",
    ],
  },
  { title: "الفرع", items: ["شركة الحلول الخبيرة"] },
  { title: "الفئة الوظيفية", items: ["سعودي تأمينات", "مقيم تأمينات"] },
  { title: "الجنسيه", items: ["مصري", "سعودي"] },
];
const valueTypes = ["اختر ....", "مقطوع", "نسبة", "يوم", "نسبة من اليوم", "نسبة من الراتب"];

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

function GreenBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
    >
      <MaterialIcon name="add" size={16} />
      {label}
    </button>
  );
}

function Modal({
  title,
  onClose,
  submit,
  children,
}: {
  title: string;
  onClose: () => void;
  submit: string;
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

function OtherRegulations() {
  const [tab, setTab] = useState<TabKey>("penalties");
  const [open, setOpen] = useState<"penalty" | "stage" | "stageUsers" | "gov" | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedGov, setExpandedGov] = useState<string | null>(null);

  const addBtn: Record<TabKey, { label: string; modal: "penalty" | "stage" | "gov" }> = {
    penalties: { label: "اضافة جزاء", modal: "penalty" },
    visas: { label: "اضافة مرحلة جديدة", modal: "stage" },
    govExpenses: { label: "اضافة مصروف حكومى", modal: "gov" },
  };

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "لوائح أخرى"]} />
      <PageBanner
        icon="rule_folder"
        title="لوائح أخرى"
        subtitle="لائحة الجزاءات · مراحل اعتماد التأشيرات · المصاريف الحكومية"
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

      <div className="mt-4 flex flex-wrap gap-2">
        <Btn icon="add" variant="teal" onClick={() => setOpen(addBtn[tab].modal)}>
          {addBtn[tab].label}
        </Btn>
      </div>

      {tab === "penalties" && (
        <div className="mt-4 space-y-4">
          <div
            className="overflow-hidden rounded-2xl border border-border bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <TableToolbar title="لائحة الجزاءات" />
            <DataTable
              columns={[
                "الجزاء",
                "الاسم بالانجليزيه",
                "الوظيفه",
                "خصم استحقاقات افتراضية",
                "نوع الجزاء",
                "تعديل",
                "اضافة تفاصيل",
                "تفعيل - ايقاف",
              ]}
              rows={penalties.map((r) => ({
                الجزاء: (
                  <button
                    onClick={() => setExpanded(expanded === r.name ? null : r.name)}
                    className="flex items-center gap-1.5 font-extrabold text-primary"
                  >
                    <MaterialIcon name={expanded === r.name ? "expand_more" : "chevron_left"} size={16} />
                    {r.name}
                  </button>
                ),
                "الاسم بالانجليزيه": r.en || "—",
                الوظيفه: r.job,
                "خصم استحقاقات افتراضية": <Tick on={r.deduct} />,
                "نوع الجزاء": r.type,
                تعديل: <IconBtn icon="edit" />,
                "اضافة تفاصيل": <GreenBtn label="اضافة تفاصيل" />,
                "تفعيل - ايقاف": <Toggle on={r.on} />,
              }))}
            />
            <Pager page={1} pages={9} total={83} />
          </div>

          {expanded && (
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div
                className="overflow-hidden rounded-2xl border border-border bg-card"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <TableToolbar title={`تفاصيل: ${expanded}`} />
                <DataTable
                  columns={["من", "الى", "القيمة", "نوع القيمه", "حذف"]}
                  rows={penaltyDetails.map((d) => ({
                    من: <span className="font-extrabold text-primary">{d.from}</span>,
                    الى: d.to,
                    القيمة: d.val,
                    "نوع القيمه": d.kind,
                    حذف: <IconBtn icon="delete" tone="danger" />,
                  }))}
                />
              </div>
              <div
                className="rounded-2xl border border-border bg-card p-4"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <h3 className="text-sm font-extrabold text-primary">الاستحقاقات</h3>
                <p className="mt-8 text-center text-xs font-bold text-muted-foreground">لا توجد بيانات</p>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "visas" && (
        <div className="mt-4 space-y-4">
          <div
            className="overflow-hidden rounded-2xl border border-border bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <TableToolbar title="مراحل اعتماد التأشيرات" />
            <DataTable
              columns={["ترتيب مرحلة", "اسم المرحلة", "الاعتماد المالى", "تعديل", "اضافة المستخدمين"]}
              rows={stages.map((s) => ({
                "ترتيب مرحلة": (
                  <button
                    onClick={() => setExpandedStage(expandedStage === s.name ? null : s.name)}
                    className="flex items-center gap-1.5 font-extrabold text-primary"
                  >
                    <MaterialIcon name={expandedStage === s.name ? "expand_more" : "chevron_left"} size={16} />
                    {s.order}
                  </button>
                ),
                "اسم المرحلة": s.name,
                "الاعتماد المالى": <Tick on={s.fin} />,
                تعديل: <IconBtn icon="edit" />,
                "اضافة المستخدمين": (
                  <GreenBtn label="اضافة مستخدمين للمرحلة" onClick={() => setOpen("stageUsers")} />
                ),
              }))}
            />
            <Pager page={1} pages={1} total={stages.length} />
          </div>

          {expandedStage && (
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title={`مستخدمو مرحلة: ${expandedStage}`} />
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

      {tab === "govExpenses" && (
        <div className="mt-4 space-y-4">
        <div
          className="overflow-hidden rounded-2xl border border-border bg-card"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <TableToolbar title="لائحة المصاريف الحكومية" />
          <DataTable
            columns={[
              "اسم المصروف الحكومى",
              "نوع القيمه",
              "قيمة المصروف",
              "يحسب طبقا لتاريخ المباشرة",
              "تعديل",
              "تفعيل - ايقاف",
            ]}
            rows={govExpenses.map((r) => ({
              "اسم المصروف الحكومى": (
                <button
                  onClick={() => setExpandedGov(expandedGov === r.name ? null : r.name)}
                  className="flex items-center gap-1.5 text-right font-extrabold text-primary"
                >
                  <MaterialIcon name={expandedGov === r.name ? "expand_more" : "chevron_left"} size={16} />
                  {r.name}
                </button>
              ),
              "نوع القيمه": r.kind,
              "قيمة المصروف": r.val,
              "يحسب طبقا لتاريخ المباشرة": r.byDate,
              تعديل: <IconBtn icon="edit" />,
              "تفعيل - ايقاف": <Toggle on={r.on} />,
            }))}
          />
          <Pager page={1} pages={1} total={govExpenses.length} />
        </div>

          {expandedGov && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {govScopes.map((s) => (
                <div
                  key={s.title}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="bg-primary px-4 py-2.5 text-center text-[12.5px] font-extrabold text-primary-foreground">
                    {s.title}
                  </div>
                  <ul className="divide-y divide-border">
                    {s.items.map((it) => (
                      <li key={it} className="px-4 py-2.5 text-center text-[12.5px] font-bold text-foreground">
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {open === "penalty" && (
        <Modal title="اضافة جزاء" submit="اضافة جزاء" onClose={() => setOpen(null)}>
          <Field label="الجزاء" required>
            <Input placeholder="اسم الجزاء" />
          </Field>
          <Field label="الجزاء الاسم بالانجليزيه">
            <Input placeholder="Penalty name" />
          </Field>
          <Field label="الوظيفه" required>
            <Select options={jobs} />
          </Field>
          <Field label="نوع الجزاء" required>
            <Select options={["اختر ....", "شهري", "سنوي"]} />
          </Field>
          <Field label="استحقاق افتراضي">
            <Select options={["اختر ....", "بدل انتقال", "بدل سكن"]} />
          </Field>
        </Modal>
      )}

      {open === "stage" && (
        <Modal title="اضافة مرحلة جديدة" submit="اضافة مرحلة" onClose={() => setOpen(null)}>
          <Field label="ترتيب مرحلة" required>
            <Input type="number" defaultValue={3} />
          </Field>
          <Field label="اسم المرحلة" required>
            <Input placeholder="اسم المرحلة" />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[12.5px] font-bold">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" />
            الاعتماد المالى
          </label>
        </Modal>
      )}

      {open === "stageUsers" && (
        <Modal title="اسناد الموظفين لمراحل التاشيرات" submit="حفظ" onClose={() => setOpen(null)}>
          <Field label="اسم المرحلة">
            <Input defaultValue="الموارد البشرية" readOnly />
          </Field>
          <Field label="اسم المستخدم" required>
            <Select options={["اختر ....", ...stageUsers]} />
          </Field>
        </Modal>
      )}

      {open === "gov" && (
        <Modal title="اضافة مصروف حكومى" submit="اضافة مصروف حكومى" onClose={() => setOpen(null)}>
          <Field label="اضافة مصروف حكومى" required>
            <Input placeholder="اسم المصروف" />
          </Field>
          <Field label="اضافة مصروف حكومى الاسم بالانجليزيه">
            <Input placeholder="Expense name" />
          </Field>
          <Field label="الجنسيه">
            <Select options={["اختر ....", "سعودي", "مصري", "هندي"]} />
          </Field>
          <Field label="الفرع">
            <Select options={["اختر ....", "شركة الحلول الخبيرة", "شركةالحلول٢"]} />
          </Field>
          <Field label="الفئة الوظيفية">
            <Select options={jobs} />
          </Field>
          <Field label="الكفالة">
            <Select options={["اختر ....", "كفالة الشركة", "كفالة خارجية"]} />
          </Field>
          <Field label="القيمة">
            <Input type="number" defaultValue={0} />
          </Field>
          <Field label="نوع الخصم" required>
            <Select options={valueTypes} />
          </Field>
          <Field label="استحقاق افتراضي">
            <Select options={["اختر ....", "بدل انتقال", "بدل سكن"]} />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[12.5px] font-bold">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" />
            يحسب طبقا لتاريخ المباشرة
          </label>
        </Modal>
      )}
    </div>
  );
}
