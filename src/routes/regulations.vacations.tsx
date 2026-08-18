import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Card,
  DataTable,
  DateInput,
  Field,
  Input,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/regulations/vacations")({
  head: () => ({
    meta: [
      { title: "تهيئة الاجازات | اللوائح" },
      {
        name: "description",
        content:
          "تهيئة مراحل اعتماد الاجازات والاجازات الرسمية ولائحة الاجازات براتب وبدون راتب والاجازة السنوية مع الحدود والقواعد.",
      },
      { property: "og:title", content: "تهيئة الاجازات | اللوائح" },
      { property: "og:description", content: "مراحل الاعتماد، الاجازات الرسمية، ولائحة الاجازات بأنواعها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Vacations,
});

const tabs = [
  { key: "stages", label: "مراحل اعتماد الاجازات", icon: "checklist" },
  { key: "official", label: "الاجازات الرسمية", icon: "event" },
  { key: "list", label: "لائحة الاجازات", icon: "beach_access" },
];

const stages = [
  { i: 1, n: "الموارد البشرية", e: "" },
  { i: 2, n: "المدير المباشر", e: "null" },
  { i: 3, n: "مدير الشركة", e: "" },
  { i: 4, n: "team lader", e: "" },
  { i: 5, n: "الشئون الادارية", e: "ADMIN" },
  { i: 6, n: "الاداره", e: "" },
  { i: 7, n: "مالك المدرسة", e: "the owner" },
  { i: 8, n: "ال hr", e: "" },
  { i: 9, n: "تيست اجازة", e: "test vecation" },
  { i: 10, n: "المرحلة ١٠", e: "" },
];

const official = [
  { n: "اجازة عبد الفطر المبارك", m: "٦", f: "٢٠٢٥/٠٣/٣٠", t: "٢٠٢٥/٠٤/٠٣", d: "٥" },
  { n: "شم النسيم", m: "٤", f: "٢٠٢٥/٠٤/٢٠", t: "٢٠٢٥/٠٤/٢١", d: "٢" },
  { n: "٦ اكتوبر", m: "١٠", f: "٢٠٢٥/١٠/٠٦", t: "٢٠٢٥/١٠/٠٦", d: "١" },
  { n: "اجازه العيد الكبير", m: "٥", f: "٢٠٢٥/٠٥/٠٧", t: "٢٠٢٥/٠٥/١٠", d: "٤" },
  { n: "اجازة عيد الاضحى", m: "٦", f: "٢٠٢٥/٠٦/٠٤", t: "٢٠٢٥/٠٦/١٥", d: "١٢" },
  { n: "اجازة المولد النبوي الشريف", m: "٦", f: "٢٠٢٥/٠٦/٢٥", t: "٢٠٢٥/٠٦/٢٥", d: "١" },
  { n: "اجازة عيد الفطر", m: "٩", f: "٢٠٢٥/٠٩/١٠", t: "٢٠٢٥/٠٩/١٧", d: "٨" },
  { n: "اليوم الوطني", m: "٩", f: "٢٠٢٥/٠٩/٢٣", t: "٢٠٢٥/٠٩/٢٣", d: "١" },
];

const kinds = [
  { key: "paid", label: "اجازة براتب", icon: "payments" },
  { key: "unpaid", label: "اجازة بدون راتب", icon: "money_off" },
  { key: "annual", label: "الاجازة السنوية", icon: "calendar_month" },
];

const listRows: Record<string, { n: string; y: string; max: string; times: string; per: string; min: string; type: string; from: string }[]> = {
  paid: [
    { n: "أجازة مرضية ٤٠", y: "٥٥", max: "٥٥", times: "٣", per: "١٠", min: "٠", type: "سنة عقدية", from: "بداية التعيين" },
    { n: "أجازة وفاة", y: "٣٠", max: "٣٠", times: "١", per: "٣٠", min: "١", type: "سنة عادية", from: "تاريخ بداية الاجازة" },
    { n: "أجازة زواج", y: "١٠", max: "٢٠", times: "٥", per: "٥", min: "١", type: "سنة عادية", from: "بداية التعيين" },
    { n: "أجازة حج", y: "١٤", max: "١٤", times: "١", per: "١٤", min: "١", type: "سنة مالية", from: "بداية التعيين" },
    { n: "أجازة براتب طويلة", y: "١٠٠", max: "١٠٠", times: "١٠٠", per: "١٠٠", min: "١", type: "سنة عقدية", from: "بداية التعيين" },
    { n: "مرضية م", y: "١٥", max: "١٥", times: "١٥", per: "١٥", min: "١٥", type: "سنة عادية", from: "بداية التعيين" },
  ],
  unpaid: [
    { n: "أجازة مرضية ٣٥ بدون راتب", y: "٣٥", max: "٣٥", times: "٣٠", per: "٣٠", min: "١", type: "سنة عقدية", from: "بداية التعيين" },
    { n: "أجازة بدون راتب", y: "١٠٠", max: "١٠٠", times: "١٠٠", per: "١٠٠", min: "١", type: "سنة عادية", from: "بداية التعيين" },
    { n: "أجازة بدون راتب طويلة", y: "٣٠٠", max: "٣٠٠", times: "٣٠٠", per: "٣٠٠", min: "١", type: "سنة عادية", from: "بداية التعيين" },
    { n: "اجازه استثناء", y: "١٤", max: "١٤", times: "٣", per: "٥", min: "٣٠", type: "سنة عادية", from: "بداية التعيين" },
    { n: "سفر", y: "٢١", max: "٢١", times: "٤", per: "٧", min: "١٢٠", type: "سنة عادية", from: "بداية التعيين" },
  ],
  annual: [
    { n: "أجازة سنوية ٣٥ يوم", y: "٣٥", max: "٣٥", times: "٥", per: "٣٥", min: "١", type: "سنة عقدية", from: "تاريخ بداية الاجازة" },
    { n: "اعتيادية فئة الموظفين (دوام كامل)", y: "٣٦", max: "٣٦", times: "١٠", per: "٣٦", min: "١", type: "سنة عادية", from: "تاريخ بداية الاجازة" },
    { n: "أجازة سنوية ٢١ يوم", y: "٢١", max: "٢١", times: "٢١", per: "٢١", min: "٧", type: "سنة عقدية", from: "تاريخ بداية الاجازة" },
    { n: "سنوية", y: "٣٦٥", max: "٣٦٥", times: "١", per: "٣٦٥", min: "٦٠٠", type: "سنة عادية", from: "بداية التعيين" },
    { n: "سنوية ٢٧ يوم", y: "٢٧", max: "٣٠", times: "١", per: "٢٧", min: "١٥٠", type: "سنة عادية", from: "بداية التعيين" },
  ],
};

const listColumns = [
  "مسمى الاجازة",
  "عدد أيام الاجازة السنوى",
  "الحد الاقصى لايام الاجازة سنوياً",
  "عدد مرات طلب الاجازة سنوياً",
  "عدد الايام المسموح بها لكل اجازة",
  "الحد الادنى من ايام العمل",
  "نوع السنة",
  "احتساب الاجازة من",
  "تعديل",
];

const flags = [
  "إضافة الرصيد السابق للرصيد الحالي",
  "خصم من رصيد الاجازة السنوية",
  "السماح بعمل طلب اجازة بتاريخ سابق",
  "اعتماد في حالة تداخل اجازات اخرى",
  "خصم الاجازات الرسمية",
  "ضرورة ارفاق وثيقة",
  "اعتماد رصيد الاجازة حسب تاريخ طلبها",
  "عطلات الدوام",
  "ضرورة ذكر سبب طلب الاجازة",
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

function Vacations() {
  const [tab, setTab] = useState("stages");
  const [kind, setKind] = useState("paid");

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "إعدادات متنوعة", "تهيئة الاجازات"]} />
      <PageBanner
        icon="beach_access"
        title="تهيئة الاجازات"
        subtitle="مراحل الاعتماد والاجازات الرسمية ولوائح الاجازات بأنواعها"
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
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors ${
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
            <Card title="اضافة مرحلة جديدة" icon="add_task">
              <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="ترتيب المرحلة">
                  <Input type="number" defaultValue={13} />
                </Field>
                <Field label="اسم المرحلة" required>
                  <Input placeholder="اسم المرحلة" />
                </Field>
                <Field label="اسم المرحلة بالإنجليزية">
                  <Input placeholder="Stage name" />
                </Field>
                <Btn icon="add" variant="teal">
                  اضافة مرحلة جديدة
                </Btn>
              </div>
            </Card>

            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="مراحل الاعتماد" />
              <DataTable
                columns={["ترتيب المرحلة", "اسم المرحلة", "الاسم بالإنجليزية", "تعديل", "اضافة المستخدمين", "تفعيل وايقاف"]}
                rows={stages.map((s) => ({
                  "ترتيب المرحلة": s.i,
                  "اسم المرحلة": <span className="font-extrabold text-primary">{s.n}</span>,
                  "الاسم بالإنجليزية": s.e || "—",
                  تعديل: <IconBtn icon="edit" />,
                  "اضافة المستخدمين": (
                    <button className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90">
                      <MaterialIcon name="person_add" size={16} />
                      اضافة مستخدمين للمرحلة
                    </button>
                  ),
                  "تفعيل وايقاف": (
                    <span className="inline-flex items-center gap-2 rounded-full bg-teal/12 px-2.5 py-1 text-[11px] font-bold text-teal">
                      <span className="size-2 rounded-full bg-teal" />
                      مفعل
                    </span>
                  ),
                }))}
              />
              <Pager page={1} pages={2} total={12} />
            </div>
          </>
        )}

        {tab === "official" && (
          <>
            <Card title="اضافة اجازة رسمية" icon="event_available">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="اسم الاجازة" required>
                  <Input placeholder="اسم الاجازة" />
                </Field>
                <Field label="السنة">
                  <Input type="number" defaultValue={2026} />
                </Field>
                <Field label="الشهر">
                  <Select options={["اختر ....", "يناير", "فبراير", "مارس", "أبريل"]} />
                </Field>
                <Field label="تاريخ بداية الاجازة ميلادي">
                  <DateInput />
                </Field>
                <Field label="تاريخ نهاية الاجازة ميلادي">
                  <DateInput />
                </Field>
                <Field label="عدد ايام الاجازة">
                  <Input type="number" defaultValue={0} />
                </Field>
              </div>
              <div className="mt-5">
                <Btn icon="save" variant="teal">
                  حفظ
                </Btn>
              </div>
            </Card>

            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="الاجازات الرسمية" />
              <DataTable
                columns={["اسم الاجازة", "الشهور", "التاريخ من", "التاريخ الى", "المدة", "تعديل", "الغاء"]}
                rows={official.map((o) => ({
                  "اسم الاجازة": <span className="font-extrabold text-primary">{o.n}</span>,
                  الشهور: o.m,
                  "التاريخ من": o.f,
                  "التاريخ الى": o.t,
                  المدة: o.d,
                  تعديل: <IconBtn icon="edit" />,
                  الغاء: <IconBtn icon="delete" tone="destructive" />,
                }))}
              />
              <Pager page={1} pages={2} total={16} />
            </div>
          </>
        )}

        {tab === "list" && (
          <>
            <div className="flex flex-wrap gap-2">
              {kinds.map((k) => {
                const on = k.key === kind;
                return (
                  <button
                    key={k.key}
                    onClick={() => setKind(k.key)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-bold transition-colors ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <MaterialIcon name={k.icon} size={18} filled={on} />
                    {k.label}
                  </button>
                );
              })}
            </div>

            <Card title={`تهيئة ${kinds.find((k) => k.key === kind)!.label}`} icon="tune">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="مسمى الاجازة" required>
                  <Input placeholder="مسمى الاجازة" />
                </Field>
                <Field label="مسمى الاجازة بالإنجليزية">
                  <Input placeholder="Vacation name" />
                </Field>
                <Field label="الجنس">
                  <Select options={["اختر ....", "ذكر", "أنثى"]} />
                </Field>
                <Field label="الديانة">
                  <Select options={["اختر ....", "مسلم", "غير ذلك"]} />
                </Field>
                <Field label="المستويات الوظيفية" required>
                  <Select options={["اختر ....", "المستوى الأول", "المستوى الثاني"]} />
                </Field>
                <Field label="الفئة الوظيفية" required>
                  <Select options={["اختر ....", "فئة ١", "فئة ٢"]} />
                </Field>
                <Field label="عدد أيام الاجازة السنوى" required>
                  <Input type="number" defaultValue={0} />
                </Field>
                <Field label="عدد مرات طلب الاجازة سنوياً" required>
                  <Input type="number" defaultValue={0} />
                </Field>
                <Field label="الحد الادنى من ايام العمل للحصول على اجازة">
                  <Input type="number" defaultValue={0} />
                </Field>
                <Field label="عدد الايام المسموح بها لكل اجازة" required>
                  <Input type="number" defaultValue={0} />
                </Field>
                <Field label="الحد الاقصى لايام الاجازة سنوياً" required>
                  <Input type="number" defaultValue={0} />
                </Field>
                <Field label={kind === "annual" ? "عدد أيام العمل السنوية" : "نسبة احتساب خصم اليوم"} required>
                  <Input type="number" defaultValue={0} />
                </Field>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-[12.5px] font-extrabold">
                    <MaterialIcon name="calendar_today" size={17} className="text-primary" filled />
                    احتساب الاجازة ابتداء من تاريخ
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {["بداية التعيين", "تاريخ مباشرة الاجازة", "سنة عادية", "سنة مالية", "سنة عقدية"].map((o, i) => (
                      <button
                        key={o}
                        className={`rounded-xl px-3.5 py-2 text-[12px] font-bold transition-colors ${
                          i === 0 || i === 2
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-[12.5px] font-extrabold">
                    <MaterialIcon name="block" size={17} className="text-primary" filled />
                    عدم التجاوز
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {["عدم تجاوز الحد الاقصى لايام الاجازة", "عدم تجاوز عدد ايام الاجازة السنوى"].map((o, i) => (
                      <button
                        key={o}
                        className={`rounded-xl px-3.5 py-2 text-[12px] font-bold transition-colors ${
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {flags.map((f) => (
                  <label
                    key={f}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 transition-colors hover:border-primary/40"
                  >
                    <input type="checkbox" className="size-4 accent-[var(--primary)]" />
                    <span className="text-[12px] font-bold">{f}</span>
                  </label>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Btn icon="save" variant="teal">
                  حفظ
                </Btn>
                <Btn icon="close" variant="ghost">
                  الغاء
                </Btn>
              </div>
            </Card>

            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title={kinds.find((k) => k.key === kind)!.label} />
              <DataTable
                columns={listColumns}
                rows={listRows[kind]!.map((r) => ({
                  "مسمى الاجازة": <span className="font-extrabold text-primary">{r.n}</span>,
                  "عدد أيام الاجازة السنوى": r.y,
                  "الحد الاقصى لايام الاجازة سنوياً": r.max,
                  "عدد مرات طلب الاجازة سنوياً": r.times,
                  "عدد الايام المسموح بها لكل اجازة": r.per,
                  "الحد الادنى من ايام العمل": r.min,
                  "نوع السنة": r.type,
                  "احتساب الاجازة من": r.from,
                  تعديل: (
                    <span className="flex gap-1.5">
                      <IconBtn icon="edit" />
                      <IconBtn icon="delete" tone="destructive" />
                    </span>
                  ),
                }))}
              />
              <Pager page={1} pages={1} total={listRows[kind]!.length} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
