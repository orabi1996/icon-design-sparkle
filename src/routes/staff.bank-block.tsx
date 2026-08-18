import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/staff/bank-block")({
  head: () => ({
    meta: [
      { title: "حظر تعديل البيانات البنكية | شؤون الموظفين" },
      {
        name: "description",
        content:
          "إدارة حظر وفك حظر تعديل البيانات البنكية للموظفين مع أرشيف كامل لعمليات الحظر وتواريخها والمستخدم المنفّذ.",
      },
      { property: "og:title", content: "حظر تعديل البيانات البنكية | شؤون الموظفين" },
      { property: "og:description", content: "حظر وفك حظر تعديل الحسابات البنكية للموظفين وأرشيف العمليات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BankBlock,
});

const branches = ["اختر ....", "شركة الحلول الخبيرة", "فرع جدة", "فرع الدمام"];
const depts = ["اختر ....", "management", "قسم الدعم", "التطوير"];
const names = ["اختر ....", "أشرف محمود عرابي", "خالد عبدالعزيز حسن", "عاصم خالد فتحي"];

const blocked = [
  { n: "أشرف محمود عرابي محمود", b: "شركة الحلول الخبيرة", d: "management", t: "٢٠٢٥/٠٥/٠٦" },
  { n: "علاء عبدالعظيم محمد محمود", b: "شركة الحلول الخبيرة", d: "قسم الدعم", t: "٢٠٢٥/٠٧/٢٣" },
  { n: "خالد عبدالعزيز حسن محمد", b: "شركة الحلول الخبيرة", d: "management", t: "٢٠٢٥/٠٢/٠٤" },
  { n: "محمد أحمد خالد حسن", b: "شركة الحلول الخبيرة", d: "management", t: "٢٠٢٥/٠٢/٠٤" },
  { n: "مراد أحمد متولي يونس", b: "شركة الحلول الخبيرة", d: "management", t: "٢٠٢٥/٠٢/٠٤" },
  { n: "عاصم خالد عاصم", b: "شركة الحلول الخبيرة", d: "management", t: "٢٠٢٦/٠٥/١٧" },
  { n: "عمر محمد صلاح محمد", b: "شركة الحلول الخبيرة", d: "management", t: "٢٠٢٥/٠٢/٠٤" },
  { n: "حمزة أحمد محمد محمد", b: "شركة الحلول الخبيرة", d: "قسم الدعم", t: "٢٠٢٥/٠٧/٣١" },
];

const archive = [
  { n: "عاصم خالد فتحي قرني", b: "شركة الحلول الخبيرة", d: "management", t: "٢٠٢٣/١٢/٢٨", op: "حظر" },
  { n: "عاصم خالد فتحي قرني", b: "شركة الحلول الخبيرة", d: "management", t: "٢٠٢٥/٠٢/٠٤", op: "حظر" },
  { n: "عاصم خالد فتحي قرني", b: "شركة الحلول الخبيرة", d: "management", t: "٢٠٢٥/٠٥/١٩", op: "فك حظر" },
  { n: "محمد شعبان عبدالحميد فرج", b: "شركة الحلول الخبيرة", d: "management", t: "٢٠٢٤/١١/٠٥", op: "حظر" },
  { n: "رضوى مصطفى عبدالعزيز القاضي", b: "شركة الحلول الخبيرة", d: "التطوير", t: "٢٠٢٤/٠٤/٣٠", op: "حظر" },
  { n: "رضوى مصطفى عبدالعزيز القاضي", b: "شركة الحلول الخبيرة", d: "التطوير", t: "٢٠٢٥/٠٥/٠١", op: "فك حظر" },
  { n: "جوليا حسين سيد القزاز", b: "شركة الحلول الخبيرة", d: "التطوير", t: "٢٠٢٤/٠١/١١", op: "حظر" },
];

const views = [
  { key: "block", label: "حظر تعديل البيانات البنكية", icon: "lock" },
  { key: "archive", label: "أرشيف البيانات البنكية", icon: "inventory_2" },
];

function BankBlock() {
  const [view, setView] = useState("block");

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["عمليات شؤون الموظفين", "شؤون الموظفين", "حظر تعديل البيانات البنكية"]} />
      <PageBanner
        icon="account_balance"
        title="حظر تعديل البيانات البنكية"
        subtitle="منع الموظفين من تعديل حساباتهم البنكية ومتابعة أرشيف العمليات"
        actions={
          <>
            <Btn icon="lock" variant="onDark">
              حظر جماعي
            </Btn>
            <Btn icon="download" variant="onDark">
              تصدير
            </Btn>
          </>
        }
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-4">
          {view === "block" ? (
            <>
              <Card title="حظر تعديل البيانات البنكية" icon="filter_alt">
                <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Field label="الفرع">
                    <Select options={branches} />
                  </Field>
                  <Field label="القسم">
                    <Select options={depts} />
                  </Field>
                  <Field label="اسم الموظف">
                    <Select options={names} />
                  </Field>
                  <Btn icon="lock" variant="teal">
                    حظر تعديل البيانات البنكية
                  </Btn>
                </div>
              </Card>

              <div
                className="overflow-hidden rounded-2xl border border-border bg-card"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <TableToolbar title="الموظفون المحظورون" />
                <DataTable
                  columns={["اسم الموظف", "الفرع", "القسم", "تاريخ الإدخال", "اسم المستخدم", "الإجراء"]}
                  rows={blocked.map((r) => ({
                    "اسم الموظف": r.n,
                    الفرع: r.b,
                    القسم: r.d,
                    "تاريخ الإدخال": r.t,
                    "اسم المستخدم": "System Admin",
                    الإجراء: (
                      <button className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90">
                        <MaterialIcon name="lock_open" size={16} />
                        فك الحظر
                      </button>
                    ),
                  }))}
                />
                <Pager page={1} pages={2} total={17} />
              </div>
            </>
          ) : (
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="أرشيف عمليات الحظر" />
              <DataTable
                columns={["اسم الموظف", "الفرع", "القسم", "تاريخ الإدخال", "اسم المستخدم", "نوع العملية", "المرفقات"]}
                rows={archive.map((r) => ({
                  "اسم الموظف": r.n,
                  الفرع: r.b,
                  القسم: r.d,
                  "تاريخ الإدخال": r.t,
                  "اسم المستخدم": "System Admin",
                  "نوع العملية": <Chip label={r.op} tone={r.op === "حظر" ? "amber" : "green"} />,
                  المرفقات: (
                    <button className="flex items-center gap-1 text-[12px] font-bold text-primary hover:underline">
                      <MaterialIcon name="attach_file" size={15} />
                      المرفقات
                    </button>
                  ),
                }))}
              />
              <Pager page={1} pages={7} total={69} />
            </div>
          )}
        </div>

        <aside
          className="h-fit overflow-hidden rounded-2xl border border-border bg-card lg:sticky lg:top-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="flex items-center gap-2 border-b border-border px-4 py-3.5 text-sm font-bold">
            <MaterialIcon name="account_balance" size={19} className="text-primary" filled />
            حظر تعديل البيانات البنكية
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
