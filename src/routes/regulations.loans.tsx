import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Card,
  Check,
  DataTable,
  DateInput,
  Field,
  Input,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/regulations/loans")({
  head: () => ({
    meta: [
      { title: "تهيئة السلف | اللوائح" },
      {
        name: "description",
        content:
          "إدارة مراحل اعتماد السلف، لائحة السلف حسب الفئة الوظيفية، اعتمادات السلف للفروع، وأنواع السلف مع الإضافة والتعديل.",
      },
      { property: "og:title", content: "تهيئة السلف | اللوائح" },
      { property: "og:description", content: "مراحل الاعتماد، لائحة السلف، اعتمادات الفروع، وأنواع السلف." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Loans,
});

const tabs = [
  { key: "stages", label: "مراحل اعتماد السلف", icon: "checklist" },
  { key: "list", label: "لائحة السلف", icon: "request_quote" },
  { key: "branches", label: "تهيئة اعتمادات السلف للفروع", icon: "account_balance" },
  { key: "types", label: "تهيئة أنواع السلف", icon: "category" },
];

const stages = [
  { i: "١", n: "الموارد البشرية", e: "Stage2", fin: false, ins: false, pay: false, hrs: "٣" },
  { i: "٢", n: "الاعتماد المالى", e: "accounting", fin: true, ins: false, pay: false, hrs: "٣" },
  { i: "٣", n: "جدولة الاقساط", e: "—", fin: false, ins: true, pay: false, hrs: "٣" },
  { i: "٤", n: "الصرف", e: "Exchange", fin: false, ins: false, pay: true, hrs: "٣" },
];

const listRows = [
  "الفئة الوظيفية",
  "مقيم تأمينات",
  "مقيم خارج التأمينات",
  "سعودي خارج تأمينات",
  "مقيم بدون تأمينات",
  "فئه وظيفية تست ٢٠٢٤",
  "فئة١",
  "تجريبي تأمينات",
  "مقيم كفالة",
  "مقيم تأمينات ٢",
];

const branchRows = [
  { b: "شركة الحلول الخبيرة", y: "٢٠٢٦", amount: "٨٠٠٠٠٠", used: "٠", left: "٨٠٠٠٠٠", f: "٢٠٢٦/٠١/٠١", t: "٢٠٢٦/١٢/٣١" },
  { b: "شركةالحلول٢", y: "٢٠٢٦", amount: "٨٠٠٠٠٠", used: "٠", left: "٨٠٠٠٠٠", f: "٢٠٢٦/٠١/٠١", t: "٢٠٢٦/١٢/٣١" },
];

const typeRows = [
  { n: "سلفة شخصية", e: "Personal Advance", st: false },
  { n: "سلفة حسابات طلاب", e: "—", st: true },
  { n: "سلفة تجديد اقامات", e: "—", st: false },
  { n: "سلفة", e: "—", st: false },
  { n: "سلفة ١١", e: "—", st: false },
  { n: "سلفه لرمضان", e: "—", st: false },
  { n: "رمضان حانا", e: "—", st: true },
  { n: "رمضان رمضان", e: "—", st: true },
  { n: "العيد", e: "—", st: true },
  { n: "جزء من مستحقات نهاية الخدمة", e: "salf", st: false },
];

function IconBtn({ icon, tone = "primary" }: { icon: string; tone?: "primary" | "destructive" | "teal" }) {
  const tones = {
    primary: "bg-primary/10 text-primary hover:bg-primary/20",
    destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    teal: "bg-teal/12 text-teal hover:bg-teal/20",
  } as const;
  return (
    <button className={`grid size-8 place-items-center rounded-lg transition-colors ${tones[tone]}`}>
      <MaterialIcon name={icon} size={17} />
    </button>
  );
}

function Mark({ on }: { on: boolean }) {
  return on ? (
    <MaterialIcon name="check_circle" size={18} className="text-teal" filled />
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}

function Toggle({ on = true }: { on?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        on ? "bg-teal/12 text-teal" : "bg-secondary text-muted-foreground"
      }`}
    >
      <span className={`size-2 rounded-full ${on ? "bg-teal" : "bg-muted-foreground"}`} />
      {on ? "مفعل" : "موقوف"}
    </span>
  );
}

function Loans() {
  const [tab, setTab] = useState("stages");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "إعدادات متنوعة", "تهيئة السلف"]} />
      <PageBanner
        icon="request_quote"
        title="تهيئة السلف"
        subtitle="مراحل الاعتماد، لائحة السلف، اعتمادات الفروع وأنواع السلف"
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
        {tab === "stages" && (
          <>
            <div className="flex flex-wrap gap-2">
              <Btn icon="add" variant="teal">
                اضافة مرحلة جديدة
              </Btn>
              <Btn icon="autorenew">تجديد الاعتمادات السنوية</Btn>
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="مراحل اعتماد السلف" />
              <DataTable
                columns={[
                  "ترتيب مرحلة",
                  "اسم المرحلة",
                  "الاسم بالإنجليزيه",
                  "الاعتماد المالى",
                  "جدولة الأقساط",
                  "مرحلة الصرف",
                  "اقصى مدة للاعتماد (ساعة)",
                  "تعديل",
                  "اضافة مستخدمين",
                  "تفعيل وايقاف",
                ]}
                rows={stages.map((s) => ({
                  "ترتيب مرحلة": s.i,
                  "اسم المرحلة": <span className="font-extrabold text-primary">{s.n}</span>,
                  "الاسم بالإنجليزيه": s.e,
                  "الاعتماد المالى": <Mark on={s.fin} />,
                  "جدولة الأقساط": <Mark on={s.ins} />,
                  "مرحلة الصرف": <Mark on={s.pay} />,
                  "اقصى مدة للاعتماد (ساعة)": s.hrs,
                  تعديل: <IconBtn icon="edit" />,
                  "اضافة مستخدمين": (
                    <button className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90">
                      <MaterialIcon name="person_add" size={16} />
                      اضافة مستخدمين للمرحلة
                    </button>
                  ),
                  "تفعيل وايقاف": <Toggle />,
                }))}
              />
              <Pager page={1} pages={1} total={4} />
            </div>
          </>
        )}

        {tab === "list" && (
          <>
            <Card title="اضافة لائحة سلفة" icon="playlist_add">
              <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Field label="الفئة الوظيفية" required>
                  <Select options={["اختر ....", "مقيم تأمينات", "سعودي خارج تأمينات"]} />
                </Field>
                <Field label="عدد اشهر الخصم">
                  <Input type="number" defaultValue={6} />
                </Field>
                <Field label="نسبة الخصم للقسط من الراتب الشهري">
                  <Input type="number" defaultValue={25} />
                </Field>
                <Field label="نسبة السلفة الى الراتب الشهري">
                  <Input type="number" defaultValue={50} />
                </Field>
                <Btn icon="save" variant="teal">
                  حفظ
                </Btn>
              </div>
            </Card>

            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="لائحة السلف" />
              <DataTable
                columns={[
                  "الفئة الوظيفية",
                  "الحد الاعلى لعدد اشهر الخصم",
                  "نسبة السلفة الى الراتب الشهرى",
                  "الحد الاعلى لخصم السلفة من الراتب",
                  "الغاء",
                ]}
                rows={listRows.map((n) => ({
                  "الفئة الوظيفية": <span className="font-extrabold text-primary">{n}</span>,
                  "الحد الاعلى لعدد اشهر الخصم": "٦",
                  "نسبة السلفة الى الراتب الشهرى": "٥٠",
                  "الحد الاعلى لخصم السلفة من الراتب": "٢٥",
                  الغاء: <IconBtn icon="delete" tone="destructive" />,
                }))}
              />
              <Pager page={1} pages={2} total={17} />
            </div>
          </>
        )}

        {tab === "branches" && (
          <>
            <Card title="تهيئة اعتمادات السلف للفروع" icon="account_balance">
              <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="السنه">
                  <Select options={["٢٠٢٦", "٢٠٢٥", "٢٠٢٤"]} />
                </Field>
                <Field label="الفرع">
                  <Select options={["اختر ....", "شركة الحلول الخبيرة", "شركةالحلول٢"]} />
                </Field>
                <Field label="مبلغ الاعتماد السنوى">
                  <Input type="number" defaultValue={800000} />
                </Field>
                <Btn icon="add" variant="teal">
                  تهيئة فرع جديد للسلف
                </Btn>
              </div>
            </Card>
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="اعتمادات الفروع" />
              <DataTable
                columns={[
                  "الفرع",
                  "السنة الحالية",
                  "مبلغ الاعتماد السنوى",
                  "القيمة المعتمدة",
                  "رصيد الاعتماد المتاح",
                  "من تاريخ",
                  "الى تاريخ",
                  "تعديل",
                  "الغاء",
                  "تفعيل",
                ]}
                rows={branchRows.map((r) => ({
                  الفرع: <span className="font-extrabold text-primary">{r.b}</span>,
                  "السنة الحالية": r.y,
                  "مبلغ الاعتماد السنوى": r.amount,
                  "القيمة المعتمدة": r.used,
                  "رصيد الاعتماد المتاح": r.left,
                  "من تاريخ": r.f,
                  "الى تاريخ": r.t,
                  تعديل: <IconBtn icon="edit" />,
                  الغاء: <IconBtn icon="delete" tone="destructive" />,
                  تفعيل: <Toggle />,
                }))}
              />
              <Pager page={1} pages={1} total={2} />
            </div>
          </>
        )}

        {tab === "types" && (
          <>
            <div className="flex flex-wrap gap-2">
              <Btn icon="add" variant="teal" onClick={() => setAddOpen(true)}>
                اضافة نوع سلفة
              </Btn>
            </div>

            {addOpen && (
              <Card title="اضافة" icon="add_circle">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="الاسم (نوع السلفة)" required>
                    <Input placeholder="نوع السلفة" />
                  </Field>
                  <Field label="اسم الحقل بالانجليزية (نوع السلفة)">
                    <Input placeholder="Advance type" />
                  </Field>
                </div>
                <div className="mt-4">
                  <Check label="سلفة حسابات طلاب" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Btn icon="add" variant="teal">
                    اضافة
                  </Btn>
                  <Btn icon="close" variant="ghost" onClick={() => setAddOpen(false)}>
                    الغاء
                  </Btn>
                </div>
              </Card>
            )}

            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="أنواع السلف" />
              <DataTable
                columns={[
                  "اسم الحقل بالعربية (نوع السلفة)",
                  "اسم الحقل بالانجليزية (نوع السلفة)",
                  "سلفة حسابات طلاب",
                  "تعديل",
                  "حذف",
                ]}
                rows={typeRows.map((r) => ({
                  "اسم الحقل بالعربية (نوع السلفة)": <span className="font-extrabold text-primary">{r.n}</span>,
                  "اسم الحقل بالانجليزية (نوع السلفة)": r.e,
                  "سلفة حسابات طلاب": <Mark on={r.st} />,
                  تعديل: <IconBtn icon="edit" />,
                  حذف: <IconBtn icon="delete" tone="destructive" />,
                }))}
              />
              <Pager page={1} pages={2} total={16} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
