import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Card,
  Check,
  DataTable,
  Field,
  Input,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/regulations/fingerprint")({
  head: () => ({
    meta: [
      { title: "لائحة خصومات البصمة | اللوائح" },
      {
        name: "description",
        content:
          "تهيئة لائحة خصومات البصمة: خصومات التأخير والانصراف المبكر والغياب وعدم البصمة حسب الفئة الوظيفية وشرائح الدقائق.",
      },
      { property: "og:title", content: "لائحة خصومات البصمة | اللوائح" },
      { property: "og:description", content: "شرائح خصومات التأخير والغياب وعدم البصمة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fingerprint,
});

const tabs = [
  { key: "late", label: "خصومات التأخير", icon: "schedule" },
  { key: "absence", label: "خصومات الغياب", icon: "event_busy" },
  { key: "missing", label: "عدم البصمة", icon: "fingerprint" },
  { key: "settings", label: "إعدادات عامة", icon: "settings" },
];

const late = [
  { c: "١", from: "١", to: "١٥", kind: "خصم دقائق", val: "دقائق التأخير", rep: "٣", note: "سماح ٣ مرات شهرياً" },
  { c: "٢", from: "١٦", to: "٣٠", kind: "نسبة من اليوم", val: "٢٥٪", rep: "٢", note: "—" },
  { c: "٣", from: "٣١", to: "٦٠", kind: "نسبة من اليوم", val: "٥٠٪", rep: "١", note: "—" },
  { c: "٤", from: "٦١", to: "١٢٠", kind: "خصم يوم", val: "يوم كامل", rep: "٠", note: "يعتبر غياب جزئي" },
];

const absence = [
  { c: "١", name: "غياب بعذر", days: "١", val: "٠٪", eff: "لا يؤثر على الرصيد" },
  { c: "٢", name: "غياب بدون عذر", days: "١", val: "١٠٠٪", eff: "خصم يوم من الراتب" },
  { c: "٣", name: "غياب متكرر", days: "٣", val: "١٥٠٪", eff: "إنذار + خصم" },
];

const missing = [
  { c: "١", name: "عدم بصمة الحضور", val: "٢٥٪ من اليوم", allow: "٢" },
  { c: "٢", name: "عدم بصمة الانصراف", val: "٢٥٪ من اليوم", allow: "٢" },
  { c: "٣", name: "عدم بصمة اليوم كامل", val: "١٠٠٪ من اليوم", allow: "٠" },
];

function IconBtn({ icon }: { icon: string }) {
  return (
    <button className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20">
      <MaterialIcon name={icon} size={17} />
    </button>
  );
}

function Fingerprint() {
  const [tab, setTab] = useState("late");

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "لائحة خصومات البصمة"]} />
      <PageBanner
        icon="fingerprint"
        title="لائحة خصومات البصمة"
        subtitle="شرائح خصومات التأخير والغياب وعدم البصمة"
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

      <div className="mt-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="الفرع">
            <Select options={["شركة الحلول الخبيرة", "شركةالحلول٢"]} />
          </Field>
          <Field label="الفئة الوظيفية">
            <Select options={["الكل", "مقيم تأمينات", "سعودي خارج تأمينات", "مقيم كفالة"]} />
          </Field>
          <Field label="السنة">
            <Select options={["٢٠٢٦", "٢٠٢٥"]} />
          </Field>
        </div>

        {tab === "late" && (
          <>
            <div className="flex flex-wrap gap-2">
              <Btn icon="add" variant="teal">
                اضافة شريحة تأخير
              </Btn>
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="شرائح خصومات التأخير" />
              <DataTable
                columns={[
                  "الكود",
                  "من (دقيقة)",
                  "إلى (دقيقة)",
                  "نوع الخصم",
                  "قيمة الخصم",
                  "مرات السماح",
                  "ملاحظات",
                  "تعديل",
                ]}
                rows={late.map((r) => ({
                  الكود: r.c,
                  "من (دقيقة)": r.from,
                  "إلى (دقيقة)": r.to,
                  "نوع الخصم": <span className="font-extrabold text-primary">{r.kind}</span>,
                  "قيمة الخصم": r.val,
                  "مرات السماح": r.rep,
                  ملاحظات: r.note,
                  تعديل: <IconBtn icon="edit" />,
                }))}
              />
              <Pager page={1} pages={1} total={late.length} />
            </div>
          </>
        )}

        {tab === "absence" && (
          <>
            <div className="flex flex-wrap gap-2">
              <Btn icon="add" variant="teal">
                اضافة نوع غياب
              </Btn>
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="خصومات الغياب" />
              <DataTable
                columns={["الكود", "نوع الغياب", "عدد الأيام", "نسبة الخصم", "الأثر", "تعديل"]}
                rows={absence.map((r) => ({
                  الكود: r.c,
                  "نوع الغياب": <span className="font-extrabold text-primary">{r.name}</span>,
                  "عدد الأيام": r.days,
                  "نسبة الخصم": r.val,
                  الأثر: r.eff,
                  تعديل: <IconBtn icon="edit" />,
                }))}
              />
              <Pager page={1} pages={1} total={absence.length} />
            </div>
          </>
        )}

        {tab === "missing" && (
          <div
            className="overflow-hidden rounded-2xl border border-border bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <TableToolbar title="خصومات عدم البصمة" />
            <DataTable
              columns={["الكود", "الحالة", "قيمة الخصم", "مرات السماح شهرياً", "تعديل"]}
              rows={missing.map((r) => ({
                الكود: r.c,
                الحالة: <span className="font-extrabold text-primary">{r.name}</span>,
                "قيمة الخصم": r.val,
                "مرات السماح شهرياً": r.allow,
                تعديل: <IconBtn icon="edit" />,
              }))}
            />
            <Pager page={1} pages={1} total={missing.length} />
          </div>
        )}

        {tab === "settings" && (
          <Card title="إعدادات عامة للخصومات" icon="settings">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="فترة السماح للتأخير (دقيقة)">
                <Input type="number" defaultValue={5} />
              </Field>
              <Field label="أساس احتساب الخصم">
                <Select options={["الراتب الأساسي", "الراتب الإجمالي"]} />
              </Field>
              <Check label="تطبيق الخصومات تلقائياً على الرواتب" defaultChecked />
              <Check label="استثناء الموظفين المعفيين من البصمة" />
              <Check label="اعتبار التأخير المتكرر مخالفة إدارية" />
              <Check label="إشعار الموظف عند تسجيل خصم" defaultChecked />
            </div>
            <div className="mt-5 flex gap-2">
              <Btn icon="save" variant="teal">
                حفظ الإعدادات
              </Btn>
              <Btn variant="ghost">إلغاء</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
