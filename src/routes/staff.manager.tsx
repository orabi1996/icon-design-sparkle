import { useState } from "react";
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

export const Route = createFileRoute("/staff/manager")({
  head: () => ({
    meta: [
      { title: "تغيير المدير المباشر | شؤون الموظفين" },
      {
        name: "description",
        content:
          "إضافة أو تغيير أو إزالة المدير المباشر للموظفين، مع الرفع الجماعي عبر ملف إكسل وأرشيف تغييرات المدير المباشر.",
      },
      { property: "og:title", content: "تغيير المدير المباشر | شؤون الموظفين" },
      { property: "og:description", content: "إدارة المدير المباشر للموظفين والرفع الجماعي وأرشيف التغييرات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerPage,
});

const opts = {
  branch: ["اختر ....", "شركة الحلول الخبيرة", "فرع جدة", "فرع الدمام"],
  dept: ["اختر ....", "management", "قسم الدعم", "التطوير"],
  main: ["اختر ....", "الإدارة العامة", "العمليات", "التقنية"],
  path: ["اختر ....", "المسار الإداري", "المسار التقني"],
  sector: ["اختر ....", "قطاع الأعمال", "قطاع الخدمات"],
  emp: ["اختر ....", "أشرف محمود عرابي", "خالد عبدالعزيز حسن", "عاصم خالد عاصم"],
  mgr: ["اختر ....", "محمد شعبان عبدالحميد", "رضوى مصطفى عبدالعزيز", "جوليا حسين سيد"],
};

const archive = [
  { n: "أشرف محمود عرابي", o: "—", m: "محمد شعبان عبدالحميد", t: "٢٠٢٥/٠٥/٠٦" },
  { n: "خالد عبدالعزيز حسن", o: "محمد شعبان عبدالحميد", m: "رضوى مصطفى عبدالعزيز", t: "٢٠٢٥/٠٧/٢٣" },
  { n: "عاصم خالد عاصم", o: "رضوى مصطفى عبدالعزيز", m: "جوليا حسين سيد", t: "٢٠٢٦/٠٥/١٧" },
];

const views = [
  { key: "add", label: "إضافة مدير مباشر للموظف", icon: "person_add" },
  { key: "change", label: "تغيير المدير المباشر", icon: "edit_square" },
];

function Panel({ title, children, open = true }: { title: string; children?: React.ReactNode; open?: boolean }) {
  const [on, setOn] = useState(open);
  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-card"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <button
        onClick={() => setOn(!on)}
        className="flex w-full items-center gap-3 bg-primary px-5 py-3.5 text-primary-foreground"
      >
        <span className="text-sm font-extrabold">{title}</span>
        <MaterialIcon name={on ? "expand_less" : "expand_more"} size={20} className="ms-auto" />
      </button>
      {on && <div className="p-5">{children}</div>}
    </section>
  );
}

function ManagerPage() {
  const [view, setView] = useState("add");

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["عمليات شؤون الموظفين", "شؤون الموظفين", "تغيير المدير المباشر"]} />
      <PageBanner
        icon="supervisor_account"
        title="تغيير المدير المباشر"
        subtitle="ربط الموظفين بمديريهم المباشرين وتحديث الهيكل التنظيمي"
        actions={
          <Btn icon="account_tree" variant="onDark">
            الهيكل التنظيمي
          </Btn>
        }
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-4">
          <Panel title={view === "add" ? "إضافة مدير مباشر من النظام" : "تغيير المدير المباشر"}>
            <div className="rounded-2xl border border-border bg-secondary/40 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-[13px] font-extrabold">
                <MaterialIcon name="badge" size={18} className="text-primary" filled />
                بيانات الموظف التنظيمية
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {view === "change" && (
                  <Field label="المدير المباشر الحالي">
                    <Select options={opts.mgr} />
                  </Field>
                )}
                <Field label="الفرع">
                  <Select options={opts.branch} />
                </Field>
                <Field label="القسم">
                  <Select options={opts.dept} />
                </Field>
                <Field label="القسم الرئيسي">
                  <Select options={opts.main} />
                </Field>
                <Field label="المسار">
                  <Select options={opts.path} />
                </Field>
                <Field label="القطاع">
                  <Select options={opts.sector} />
                </Field>
                <Field label="اسم الموظف" required>
                  <Select options={opts.emp} />
                </Field>
                {view === "add" && (
                  <Field label="المدير المباشر" required>
                    <Select options={opts.mgr} />
                  </Field>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Btn icon={view === "add" ? "person_add" : "sync"} variant="teal">
                  {view === "add" ? "إضافة مدير مباشر للموظف" : "تغيير المدير المباشر"}
                </Btn>
                {view === "change" && (
                  <button className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-2.5 text-[13px] font-bold text-destructive transition-colors hover:bg-destructive/15">
                    <MaterialIcon name="close" size={18} />
                    إزالة المدير المباشر
                  </button>
                )}
              </div>
            </div>
          </Panel>

          {view === "add" ? (
            <Panel title="إضافة مدير مباشر عن طريق ملف إكسل" open={false}>
              <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-card/70 px-4 py-8 transition-colors hover:border-primary/60 hover:bg-card">
                  <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                    <MaterialIcon name="cloud_upload" size={24} filled />
                  </span>
                  <span className="text-[13px] font-bold">اسحب ملف الإكسل هنا أو اضغط للاختيار</span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    الصيغ المدعومة: XLSX · XLS · CSV — حتى ١٠ ميجابايت
                  </span>
                  <input type="file" className="hidden" />
                </label>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Btn icon="upload" variant="teal">
                    رفع
                  </Btn>
                  <Btn icon="download" variant="ghost">
                    تحميل نموذج
                  </Btn>
                </div>
              </div>
            </Panel>
          ) : (
            <Panel title="أرشيف المدير المباشر" open={false}>
              <div className="overflow-hidden rounded-2xl border border-border">
                <TableToolbar title="سجل التغييرات" />
                <DataTable
                  columns={["اسم الموظف", "المدير السابق", "المدير الجديد", "تاريخ التغيير", "اسم المستخدم"]}
                  rows={archive.map((r) => ({
                    "اسم الموظف": r.n,
                    "المدير السابق": r.o,
                    "المدير الجديد": r.m,
                    "تاريخ التغيير": r.t,
                    "اسم المستخدم": "System Admin",
                  }))}
                />
                <Pager page={1} pages={1} total={archive.length} />
              </div>
            </Panel>
          )}
        </div>

        <aside
          className="h-fit overflow-hidden rounded-2xl border border-border bg-card lg:sticky lg:top-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="flex items-center gap-2 border-b border-border px-4 py-3.5 text-sm font-bold">
            <MaterialIcon name="supervisor_account" size={19} className="text-primary" filled />
            تغيير المدير المباشر
          </h2>
          <nav className="space-y-1 p-2">
            {views.map((v) => {
              const on = v.key === view;
              return (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-bold transition-colors ${
                    on ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  <MaterialIcon name={v.icon} size={18} filled={on} className={on ? "" : "text-primary"} />
                  <span className="text-start">{v.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}
