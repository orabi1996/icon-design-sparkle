import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { AppShell } from "@/components/hr/AppShell";
import {
  Breadcrumbs,
  Btn,
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

export const Route = createFileRoute("/vacations")({
  head: () => ({
    meta: [
      { title: "الأجازات | شؤون الموظفين" },
      {
        name: "description",
        content:
          "إدارة الأجازات: بحث الأجازات، مباشرة وتعديل الطلبات، الأجازة السنوية واحتساب قيمتها، رصيد الأجازة بدون راتب، وترحيل الأجازات.",
      },
      { property: "og:title", content: "الأجازات | شؤون الموظفين" },
      {
        property: "og:description",
        content: "بحث الأجازات وطلباتها والأجازة السنوية وترحيل الأرصدة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VacationsPage,
});

type TabKey = "search" | "requests" | "annual" | "unpaid" | "carry";

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: "search", label: "بحث الإجازات", icon: "manage_search" },
  { key: "requests", label: "مباشرة و تعديل طلبات الاجازات", icon: "edit_calendar" },
  { key: "annual", label: "الاجازة السنوية", icon: "event_available" },
  { key: "unpaid", label: "رصيد الأجازة بدون راتب المستهلك", icon: "money_off" },
  { key: "carry", label: "استعراض ترحيل الاجازات", icon: "swap_vert" },
];

const opt = ["اختر ...."];
const branches = ["اختر ....", "شركة الحلول الخبيرة", "شركةالحلول٢"];
const depts = ["اختر ....", "management", "التطوير", "قسم الدعم"];
const states = ["اختر ....", "معتمدة", "معلقة", "مرفوضة"];
const leaveTypes = ["اختر ....", "أجازة سنوية ٣٥ يوم", "اجازة بدون راتب", "أجازة زواج", "أجازة وفاة", "أجازة حج"];

const requestRows = [
  { emp: "محمد شعبان عبدالحميد فرج", branch: "شركة الحلول الخبيرة", dept: "management", type: "اجازة بدون اجر طويلة", id: "٣٢٠١٥٢٣٤٤٤", state: "معتمدة", from: "٢٠٢٤/٠١/٢١", to: "٢٠٢٤/٠٣/٠١", days: "١" },
  { emp: "عاصم خالد فتحي قرني", branch: "شركة الحلول الخبيرة", dept: "management", type: "أجازة مرضية ٤٠", id: "٢٥٢٤٢٦٥٩٨٧٥٥", state: "معتمدة", from: "٢٠٢٤/٠٣/١٤", to: "٢٠٢٤/٠٣/٢٠", days: "٧" },
  { emp: "محمد محمد محمد محمود", branch: "شركة الحلول الخبيرة", dept: "قسم الدعم", type: "اجازة بدون راتب", id: "٣٠٠٠٤٠٦٢٢٠", state: "معتمدة", from: "٢٠٢٤/٠٣/٠٨", to: "٢٠٢٤/٠٣/٠٩", days: "٢" },
  { emp: "عبد العزيز محمد يحي هزاز محمد", branch: "شركة الحلول الخبيرة", dept: "management", type: "اجازة بدون راتب", id: "١١١٠٢٠٠٠٣٠", state: "معتمدة", from: "٢٠٢٤/٠١/١٠", to: "٢٠٢٤/٠١/٢١", days: "٨" },
  { emp: "اشرف رجب السيد نصر", branch: "شركة الحلول الخبيرة", dept: "التطوير", type: "أجازة زواج", id: "١٠٣٨٤٩٣٨٤٨", state: "معتمدة", from: "٢٠٢٤/٠٥/٠٥", to: "٢٠٢٤/٠٥/٠٨", days: "٤" },
  { emp: "معاذ احمد محمد احمد", branch: "شركة الحلول الخبيرة", dept: "management", type: "أجازة وفاة", id: "٣٦٩٨٧٤١٢٣٦", state: "معتمدة", from: "٢٠٢٤/٠٥/٠٧", to: "٢٠٢٤/٠٥/٠٨", days: "٢" },
  { emp: "عمر محمد محمد صلاح محمد", branch: "شركة الحلول الخبيرة", dept: "management", type: "اجازة تست٩٦", id: "٩٨٧٨٩٨٥٦٩٦", state: "معتمدة", from: "٢٠٢٤/٠٧/٠١", to: "٢٠٢٤/٠٧/٠٥", days: "٤" },
  { emp: "اصلاح طلعت صالح محمود", branch: "شركةالحلول٢", dept: "management", type: "أجازة حج", id: "١٠٣٨٤٩٣٨٤٩", state: "معتمدة", from: "٢٠٢٤/٠٥/١٣", to: "٢٠٢٤/٠٥/٣٠", days: "١٤" },
];

const annualRows = [
  { emp: "احمد ابراهيم احمد على", branch: "شركة الحلول الخبيرة", dept: "التطوير", nat: "مصري", no: "١٠٢", level: "سعودي تأمينات", type: "أجازة سنوية ٣٥ يوم", from: "٢٠٢٢/٠٢/٢٦", to: "٢٠٢٤/٠١/٠٤", work: "٦٧٨", dur: "٥٦", val: "٥٦٠٠" },
  { emp: "جوانا معزي رغبان الوحيشي البلوي", branch: "شركة الحلول الخبيرة", dept: "التطوير", nat: "سعودي", no: "١٠", level: "سعودي تأمينات", type: "أجازة سنوية ٣٥ يوم", from: "٢٠٢٤/٠١/١٧", to: "٢٠٢٤/٠٧/٣١", work: "١٩٧", dur: "١٦", val: "٥٣٣٣" },
  { emp: "اشرف محمود عرابي محمود", branch: "شركة الحلول الخبيرة", dept: "management", nat: "مصري", no: "١٣", level: "مقيم تأمينات", type: "أجازة سنوية ٣٥ يوم", from: "٢٠٢٢/١٠/٠١", to: "٢٠٢٤/٠١/٠٣", work: "٤٦٠", dur: "٣٥", val: "٣٥٠٠" },
  { emp: "عاصم خالد فتحي قرني", branch: "شركة الحلول الخبيرة", dept: "management", nat: "مصري", no: "١", level: "سعودي تأمينات", type: "أجازة سنوية ٣٥ يوم", from: "٢٠٢٤/٠٣/٠١", to: "٢٠٢٤/٠٦/٣٠", work: "١٢٢", dur: "١٠", val: "٣٥٠٠" },
  { emp: "رامي مصعب عبدالرحمن غالي", branch: "شركة الحلول الخبيرة", dept: "التطوير", nat: "سعودي", no: "١٠٨", level: "سعودي تأمينات", type: "أجازة سنوية ٣٥ يوم", from: "٢٠٢٤/٠١/٠١", to: "٢٠٢٤/٠٧/٣١", work: "٢١٣", dur: "١٨", val: "٣٠٠٠" },
  { emp: "جوليا حسين سيد القزاز", branch: "شركة الحلول الخبيرة", dept: "التطوير", nat: "سعودي", no: "٦", level: "سعودي تأمينات", type: "أجازة سنوية ٣٥ يوم", from: "٢٠٢٣/٠٩/٠١", to: "٢٠٢٤/٠١/١١", work: "١٣٣", dur: "١١", val: "١٨٣٣" },
  { emp: "دلال عبدالتواب محمد أحمد", branch: "شركة الحلول الخبيرة", dept: "التطوير", nat: "مصري", no: "١١٩", level: "مقيم تأمينات", type: "أجازة سنوية ٣٥ يوم", from: "٢٠٢٤/٠٣/٢٩", to: "٢٠٢٥/٠٣/٢٩", work: "٣٦٦", dur: "٣٠", val: "١٠٠٠" },
  { emp: "رضوى مصطفى عبدالعزيز القاضي", branch: "شركة الحلول الخبيرة", dept: "التطوير", nat: "سعودي", no: "٢", level: "سعودي تأمينات", type: "أجازة سنوية ٣٥ يوم", from: "٢٠٢٤/٠١/١٠", to: "٢٠٢٤/٠٣/٠٧", work: "٥٨", dur: "٥", val: "١٦٦٧" },
];

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

function StateChip({ label }: { label: string }) {
  const tone =
    label === "معتمدة"
      ? "bg-teal/12 text-teal"
      : label === "مرفوضة"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary/10 text-primary";
  return <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-extrabold ${tone}`}>{label}</span>;
}

function FilterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">{children}</div>
      <div className="mt-4 flex justify-center">
        <Btn icon="search">بحث</Btn>
      </div>
    </div>
  );
}

function Modal({
  title,
  submit,
  onClose,
  wide,
  children,
}: {
  title: string;
  submit: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div
        className={`w-full overflow-hidden rounded-2xl border border-border bg-card ${wide ? "max-w-4xl" : "max-w-2xl"}`}
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
        <div className="max-h-[70vh] overflow-y-auto bg-secondary/40 p-5">{children}</div>
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

function VacationsPage() {
  const [tab, setTab] = useState<TabKey>("search");
  const [annualSub, setAnnualSub] = useState<"notices" | "calc">("notices");
  const [open, setOpen] = useState<"request" | "group" | "notice" | "calc" | null>(null);

  return (
    <AppShell>
      <div>
        <Breadcrumbs trail={["شؤون الموظفين", "الأجازات"]} />
        <PageBanner
          icon="beach_access"
          title="الأجازات"
          subtitle="بحث الأجازات · الطلبات · الأجازة السنوية · الأرصدة والترحيل"
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

        {tab === "search" && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Btn icon="add" variant="teal" onClick={() => setOpen("request")}>
                اضافة طلب
              </Btn>
              <Btn icon="group_add" variant="soft" onClick={() => setOpen("group")}>
                اضافة اجازة لمجموعة موظفين
              </Btn>
            </div>

            <FilterCard>
              <Field label="الفروع">
                <Select options={branches} />
              </Field>
              <Field label="القسم">
                <Select options={depts} />
              </Field>
              <Field label="الحاله">
                <Select options={states} />
              </Field>
              <Field label="الوظيفه الحاليه">
                <Select options={opt} />
              </Field>
              <Field label="القسم الرئيسي">
                <Select options={opt} />
              </Field>
              <Field label="التخصص">
                <Select options={opt} />
              </Field>
              <Field label="القطاع">
                <Select options={opt} />
              </Field>
              <Field label="المستوى الوظيفي">
                <Select options={opt} />
              </Field>
              <Field label="المسار">
                <Select options={opt} />
              </Field>
              <Field label="موظف">
                <Input placeholder="البحث بإسم او رقم الموظف" />
              </Field>
              <Field label="اجازه">
                <Select options={leaveTypes} />
              </Field>
              <Field label="تاريخ بداية الاجازة الفعلى من">
                <DateInput />
              </Field>
              <Field label="تاريخ بداية الاجازة الفعلى الى">
                <DateInput />
              </Field>
              <Field label="تاريخ نهاية الاجازة الفعلى من">
                <DateInput />
              </Field>
              <Field label="تاريخ نهاية الاجازة الفعلى الي">
                <DateInput />
              </Field>
              <Field label="تاريخ طلب الاجازة من">
                <DateInput />
              </Field>
            </FilterCard>

            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="نتائج البحث" />
              <DataTable
                columns={[
                  "اسم الموظف",
                  "اسم الاجازه",
                  "تاريخ الطلب",
                  "رقم الهويه",
                  "الجنسيه",
                  "الفرع",
                  "القسم",
                  "الوظيفه",
                  "المدة",
                  "تاريخ بداية الاجازة",
                  "تاريخ نهاية الاجازة",
                  "الحاله",
                  "المرفقات",
                ]}
                rows={[]}
                empty="لا توجد بيانات"
              />
              <Pager page={1} pages={1} total={0} />
            </div>
          </div>
        )}

        {tab === "requests" && (
          <div className="mt-4 space-y-4">
            <FilterCard>
              <Field label="الأجازات">
                <Select options={leaveTypes} />
              </Field>
              <Field label="الرقم الوظيفى">
                <Input placeholder="الرقم الوظيفى" />
              </Field>
              <Field label="تاريخ بداية الاجازة">
                <DateInput />
              </Field>
              <Field label="تاريخ نهاية الاجازة">
                <DateInput />
              </Field>
              <Field label="اسم الموظف">
                <Input placeholder="البحث بإسم او رقم الموظف" />
              </Field>
            </FilterCard>

            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="طلبات الأجازات" />
              <DataTable
                columns={[
                  "اسم الموظف",
                  "الفرع",
                  "القسم",
                  "اسم الاجازه",
                  "رقم الهويه",
                  "الحاله",
                  "تاريخ بداية الاجازة",
                  "تاريخ نهاية الاجازة",
                  "المدة",
                  "تعديل",
                  "حذف",
                ]}
                rows={requestRows.map((r) => ({
                  "اسم الموظف": <span className="font-extrabold text-primary">{r.emp}</span>,
                  الفرع: r.branch,
                  القسم: r.dept,
                  "اسم الاجازه": r.type,
                  "رقم الهويه": r.id,
                  الحاله: <StateChip label={r.state} />,
                  "تاريخ بداية الاجازة": r.from,
                  "تاريخ نهاية الاجازة": r.to,
                  المدة: r.days,
                  تعديل: <IconBtn icon="edit" />,
                  حذف: <IconBtn icon="delete" tone="danger" />,
                }))}
              />
              <Pager page={1} pages={69} total={688} />
            </div>
          </div>
        )}

        {tab === "annual" && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
            <div
              className="h-fit rounded-2xl border border-border bg-card p-3"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h2 className="mb-2 px-1 text-[12.5px] font-extrabold text-primary">الاجازة السنوية</h2>
              {(
                [
                  { key: "notices", label: "اشعارات الاجازة السنوية", icon: "campaign" },
                  { key: "calc", label: "احتساب قيمة الاجازة السنوية", icon: "calculate" },
                ] as const
              ).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setAnnualSub(s.key)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[12.5px] font-bold transition-colors ${
                    annualSub === s.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <MaterialIcon name={s.icon} size={18} filled={annualSub === s.key} />
                  {s.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {annualSub === "notices" ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Btn icon="add" variant="teal" onClick={() => setOpen("notice")}>
                      اضافة
                    </Btn>
                  </div>
                  <FilterCard>
                    <Field label="الفرع">
                      <Select options={branches} />
                    </Field>
                    <Field label="القسم">
                      <Select options={depts} />
                    </Field>
                    <Field label="الوظيفه الحاليه">
                      <Select options={opt} />
                    </Field>
                    <Field label="المسار">
                      <Select options={opt} />
                    </Field>
                    <Field label="التخصص">
                      <Select options={opt} />
                    </Field>
                    <Field label="القطاع">
                      <Select options={opt} />
                    </Field>
                    <Field label="القسم الرئيسي">
                      <Select options={opt} />
                    </Field>
                    <Field label="اسم الموظف">
                      <Input placeholder="البحث بإسم او رقم الموظف" />
                    </Field>
                  </FilterCard>
                  <div
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <TableToolbar title="اشعارات الاجازة السنوية" />
                    <DataTable
                      columns={[
                        "اسم الموظف",
                        "الفرع",
                        "القسم",
                        "تاريخ الادخال",
                        "تاريخ اخر اشعار",
                        "التاريخ السابق",
                        "اسم المستخدم",
                        "الحاله",
                        "تعديل",
                      ]}
                      rows={[]}
                    />
                    <Pager page={1} pages={1} total={0} />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Btn icon="calculate" variant="teal" onClick={() => setOpen("calc")}>
                      احتساب قيمة الاجازة
                    </Btn>
                  </div>
                  <FilterCard>
                    <Field label="الفرع">
                      <Select options={branches} />
                    </Field>
                    <Field label="القسم">
                      <Select options={depts} />
                    </Field>
                    <Field label="اسم الموظف">
                      <Input placeholder="البحث بإسم او رقم الموظف" />
                    </Field>
                    <Field label="تاريخ بداية الاجازة">
                      <DateInput />
                    </Field>
                    <Field label="تاريخ نهاية الاجازة">
                      <DateInput />
                    </Field>
                  </FilterCard>
                  <div
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <TableToolbar title="احتساب قيمة الاجازة السنوية" />
                    <DataTable
                      columns={[
                        "اسم الموظف",
                        "الفرع",
                        "القسم",
                        "الجنسيه",
                        "الرقم الوظيفى",
                        "المستوى الوظيفى",
                        "اسم الاجازه",
                        "تاريخ بداية الاحتساب",
                        "تاريخ نهاية الاحتساب",
                        "اجمالى ايام العمل",
                        "المدة",
                        "القيمة",
                      ]}
                      rows={annualRows.map((r) => ({
                        "اسم الموظف": <span className="font-extrabold text-primary">{r.emp}</span>,
                        الفرع: r.branch,
                        القسم: r.dept,
                        الجنسيه: r.nat,
                        "الرقم الوظيفى": r.no,
                        "المستوى الوظيفى": r.level,
                        "اسم الاجازه": r.type,
                        "تاريخ بداية الاحتساب": r.from,
                        "تاريخ نهاية الاحتساب": r.to,
                        "اجمالى ايام العمل": r.work,
                        المدة: r.dur,
                        القيمة: <span className="font-extrabold text-teal">{r.val}</span>,
                      }))}
                    />
                    <Pager page={1} pages={10} total={94} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "unpaid" && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Btn icon="add" variant="teal" onClick={() => setOpen("unpaidAdd")}>
                اضافة رصيد اجازة بدون راتب
              </Btn>
            </div>
            <FilterCard>
              <Field label="الفرع">
                <Select options={branches} />
              </Field>
              <Field label="القسم">
                <Select options={depts} />
              </Field>
              <Field label="اسم الموظف">
                <Select options={opt} />
              </Field>
            </FilterCard>
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="رصيد الأجازة بدون راتب المستهلك" />
              <DataTable
                columns={[
                  "اسم الموظف",
                  "اسم الاجازه",
                  "رصيد الأجازة بدون راتب المستهلك",
                  "تاريخ الادخال",
                  "التاريخ من",
                  "التاريخ الى",
                  "اسم المستخدم",
                  "نوع السنة",
                ]}
                rows={unpaidRows.map((r) => ({
                  "اسم الموظف": <span className="font-extrabold text-primary">{r.emp}</span>,
                  "اسم الاجازه": r.type,
                  "رصيد الأجازة بدون راتب المستهلك": <span className="font-extrabold text-teal">{r.bal}</span>,
                  "تاريخ الادخال": r.entry,
                  "التاريخ من": r.from || "—",
                  "التاريخ الى": r.to || "—",
                  "اسم المستخدم": r.user,
                  "نوع السنة": <StateChip label={r.calc} />,
                }))}
              />
              <Pager page={1} pages={2} total={15} />
            </div>
          </div>
        )}

        {tab === "carry" && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Btn icon="playlist_add" variant="teal" onClick={() => setOpen("carryFirst")}>
                رصيد اول المدة للأجازات
              </Btn>
              <Btn icon="swap_vert" variant="soft" onClick={() => setOpen("carryManual")}>
                الترحيل اليدوي
              </Btn>
            </div>
            <FilterCard>
              <Field label="الفرع">
                <Select options={branches} />
              </Field>
              <Field label="القسم">
                <Select options={depts} />
              </Field>
              <Field label="اسم الموظف">
                <Select options={opt} />
              </Field>
            </FilterCard>
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="استعراض ترحيل الاجازات" />
              <DataTable
                columns={[
                  "اسم الموظف",
                  "رقم العقد",
                  "اسم الاجازه",
                  "طريقة الترحيل",
                  "المدة",
                  "تاريخ الترحيل",
                  "تاريخ الادخال",
                  "التاريخ من",
                  "التاريخ الى",
                  "اسم المستخدم",
                  "نوع السنة",
                ]}
                rows={carryRows.map((r) => ({
                  "اسم الموظف": <span className="font-extrabold text-primary">{r.emp}</span>,
                  "رقم العقد": r.contract,
                  "اسم الاجازه": r.type,
                  "طريقة الترحيل": <StateChip label={r.method} />,
                  المدة: r.days,
                  "تاريخ الترحيل": r.carryDate,
                  "تاريخ الادخال": r.entry,
                  "التاريخ من": r.from,
                  "التاريخ الى": r.to,
                  "اسم المستخدم": r.user,
                  "نوع السنة": r.yearType,
                }))}
              />
              <Pager page={1} pages={4} total={37} />
            </div>
          </div>
        )}

        {open === "unpaidAdd" && (
          <Modal title="اضافة رصيد اجازة بدون راتب" submit="اضافة رصيد الأجازة" onClose={() => setOpen(null)} wide>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="حالة الموظف">
                <Select options={["اختر ....", "على رأس العمل", "موقوف"]} />
              </Field>
              <Field label="اسم الاجازه" required>
                <Select options={["اختر ....", "اجازة بدون راتب"]} />
              </Field>
              <Field label="اسم الموظف" required>
                <Select options={opt} />
              </Field>
              <Field label="رصيد الأجازة بدون راتب المستهلك" required>
                <Input type="number" defaultValue={0} />
              </Field>
              <Field label="التاريخ من" required>
                <DateInput />
              </Field>
              <Field label="التاريخ الى" required>
                <DateInput />
              </Field>
            </div>
          </Modal>
        )}

        {open === "carryFirst" && (
          <Modal title="رصيد اول المدة للأجازات" submit="اضافة" onClose={() => setOpen(null)}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="اسم الاجازه" required>
                <Select options={leaveTypes} />
              </Field>
              <Field label="اسم الموظف" required>
                <Select options={opt} />
              </Field>
              <Field label="رصيد الاجازة المتبقي" required>
                <Input type="number" defaultValue={0} />
              </Field>
              <Field label="تاريخ الترحيل" required>
                <DateInput />
              </Field>
              <Field label="تاريخ بداية احتساب رصيد الاجازة">
                <DateInput />
              </Field>
            </div>
          </Modal>
        )}

        {open === "carryManual" && (
          <Modal title="ترحيل رصيد الاجازات السنوية يدوياً" submit="اضافة" onClose={() => setOpen(null)}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="نوع الأجازة" required>
                <Select options={["اختر ....", "سنوية"]} />
              </Field>
              <Field label="الفرع">
                <Select options={branches} />
              </Field>
              <Field label="الأقسام">
                <Select options={depts} />
              </Field>
              <Field label="القسم الرئيسي">
                <Select options={opt} />
              </Field>
              <Field label="المسار">
                <Select options={opt} />
              </Field>
              <Field label="القطاع">
                <Select options={opt} />
              </Field>
              <Field label="الموظفين">
                <Select options={opt} />
              </Field>
            </div>
          </Modal>
        )}

        {open === "request" && (
          <Modal title="إضافة طلب إجازة" submit="اضافة" onClose={() => setOpen(null)} wide>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="موظف" required>
                <Select options={opt} />
              </Field>
              <Field label="نوع الأجازة" required>
                <Select options={["اختر ....", "سنوية", "مرضية", "بدون راتب"]} />
              </Field>
              <Field label="اسم الاجازه" required>
                <Select options={leaveTypes} />
              </Field>
              <Field label="الرصيد السنوي المستحق">
                <Input type="number" defaultValue={0} readOnly />
              </Field>
              <Field label="الرصيد السابق">
                <Input type="number" defaultValue={0} readOnly />
              </Field>
              <Field label="رصيد الفترة">
                <Input type="number" defaultValue={0} readOnly />
              </Field>
              <Field label="الرصيد حتي تاريخه">
                <Input type="number" defaultValue={0} readOnly />
              </Field>
              <Field label="المنصرف حتي تاريخه">
                <Input type="number" defaultValue={0} readOnly />
              </Field>
              <Field label="مصروف نقدا">
                <Input type="number" defaultValue={0} />
              </Field>
              <Field label="الرصيد الحالى">
                <Input type="number" defaultValue={0} readOnly />
              </Field>
              <Field label="تاريخ بداية الاجازة" required>
                <DateInput />
              </Field>
              <Field label="تاريخ نهاية الاجازة" required>
                <DateInput />
              </Field>
              <Field label="المدة">
                <Input type="number" defaultValue={0} readOnly />
              </Field>
              <Field label="ملاحظات">
                <Input placeholder="ملاحظات..." />
              </Field>
              <Field label="المرفقات">
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-[12px] font-bold text-primary">
                  <MaterialIcon name="cloud_upload" size={18} />
                  ارفاق ملف
                  <input type="file" className="hidden" />
                </label>
              </Field>
            </div>
          </Modal>
        )}

        {open === "group" && (
          <Modal title="طلب اجازة لمجموعة" submit="اضافة" onClose={() => setOpen(null)} wide>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="نوع الأجازة" required>
                <Select options={["اختر ....", "سنوية", "مرضية", "بدون راتب"]} />
              </Field>
              <Field label="اجازه" required>
                <Select options={leaveTypes} />
              </Field>
              <Field label="الفروع">
                <Select options={branches} />
              </Field>
              <Field label="القسم">
                <Select options={depts} />
              </Field>
              <Field label="الوظيفه الحاليه">
                <Select options={opt} />
              </Field>
              <Field label="القسم الرئيسي">
                <Select options={opt} />
              </Field>
              <Field label="التخصص">
                <Select options={opt} />
              </Field>
              <Field label="القطاع">
                <Select options={opt} />
              </Field>
              <Field label="الفئة الوظيفية">
                <Select options={opt} />
              </Field>
              <Field label="المستوى الوظيفي">
                <Select options={opt} />
              </Field>
              <Field label="المسار">
                <Select options={opt} />
              </Field>
              <Field label="موظف">
                <Input placeholder="البحث بإسم او رقم الموظف" />
              </Field>
              <Field label="التاريخ من" required>
                <DateInput />
              </Field>
              <Field label="التاريخ الى" required>
                <DateInput />
              </Field>
            </div>
          </Modal>
        )}

        {open === "notice" && (
          <Modal title="إضافة اشعار اجازة سنوية" submit="اضافة" onClose={() => setOpen(null)}>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="الفرع">
                <Select options={branches} />
              </Field>
              <Field label="القسم">
                <Select options={depts} />
              </Field>
              <Field label="الوظيفه الحاليه">
                <Select options={opt} />
              </Field>
              <Field label="المسار">
                <Select options={opt} />
              </Field>
              <Field label="التخصص">
                <Select options={opt} />
              </Field>
              <Field label="القطاع">
                <Select options={opt} />
              </Field>
              <Field label="القسم الرئيسي">
                <Select options={opt} />
              </Field>
              <Field label="الجنسيه">
                <Select options={opt} />
              </Field>
              <Field label="تاريخ المباشرة">
                <DateInput />
              </Field>
              <div className="md:col-span-3">
                <Field label="اسم الموظف">
                  <Select options={opt} />
                </Field>
              </div>
            </div>
          </Modal>
        )}

        {open === "calc" && (
          <Modal title="احتساب قيمة الاجازة السنوية" submit="اضافة" onClose={() => setOpen(null)}>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="الأجازات">
                <Select options={leaveTypes} />
              </Field>
              <Field label="الفروع">
                <Select options={branches} />
              </Field>
              <Field label="الأقسام">
                <Select options={depts} />
              </Field>
              <Field label="الوظيفه الحاليه">
                <Select options={opt} />
              </Field>
              <Field label="المسار">
                <Select options={opt} />
              </Field>
              <Field label="التخصص">
                <Select options={opt} />
              </Field>
              <Field label="القطاع">
                <Select options={opt} />
              </Field>
              <Field label="القسم الرئيسي">
                <Select options={opt} />
              </Field>
              <Field label="الموظفين">
                <Select options={opt} />
              </Field>
              <div className="md:col-span-2">
                <Field label="تاريخ احتساب الاجازة السنويه" required>
                  <DateInput />
                </Field>
              </div>
              <div className="flex items-end">
                <Check label="اضافه الرصيد السابق الى رصيد الفتره" />
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}