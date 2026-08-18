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

export const Route = createFileRoute("/regulations/shifts")({
  head: () => ({
    meta: [
      { title: "تهيئة مجموعات الدوام | اللوائح" },
      {
        name: "description",
        content:
          "إضافة وتعديل مجموعات الدوام، تهيئة أيام الدوام وأوقات الحضور والانصراف، إسناد الموظفين للمجموعات والمواقع، وإعادة الاحتساب واعتماد تغيير أجهزة البصمة.",
      },
      { property: "og:title", content: "تهيئة مجموعات الدوام | اللوائح" },
      { property: "og:description", content: "إدارة كاملة لمجموعات الدوام والإسناد والاحتساب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shifts,
});

const tabs = [
  { key: "new", label: "إضافة جدول دوام جديد", icon: "add_circle" },
  { key: "view", label: "استعراض بيانات جدول الدوام", icon: "visibility" },
  { key: "emp-view", label: "استعراض الموظفين لجدول الدوام", icon: "groups" },
  { key: "emp-assign", label: "اسناد الموظفين لجدول الدوام", icon: "assignment_ind" },
  { key: "recalc", label: "تطبيق جداول الدوام على فترة زمنية", icon: "restart_alt" },
  { key: "device", label: "اعتماد تغير اجهزة جوال البصمة", icon: "fingerprint" },
  { key: "site-assign", label: "اسناد الموظفين للموقع", icon: "add_location_alt" },
  { key: "site-view", label: "استعراض الموظفين للموقع", icon: "location_on" },
];

const steps = [
  { label: "إضافة جدول دوام جديد", icon: "settings" },
  { label: "تهيئة ايام جدول الدوام", icon: "group_add" },
  { label: "تهيئة اوقات الحضور والانصراف", icon: "playlist_add" },
  { label: "استعراض بيانات جدول الدوام", icon: "visibility" },
];

const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

const dayRows = days.map(() => ({ in1: "٠١:٠٠", out1: "٠٥:٠٠", in2: "٠٠:٠٠", out2: "٠٠:٠٠", mins: "٢٤٠", type: "صباحى" }));

const empRows = [
  { g: "H.M", no: "٥٠٢٧", br: "شركة الحلول الخبيرة", d: "management", md: "القسم الرئيسي", s: "قطاع مصر", p: "مسار السعودية تيست", f: "٢٠٢٤/٠٢/٠١", t: "٢٠٢٥/٠١/٠١" },
  { g: "جدول دوام افتراضي", no: "٥٠٨٨", br: "شركة الحلول الخبيرة", d: "as", md: "تجريبى م", s: "قطاع مصر", p: "مسار تجريبى م", f: "—", t: "—" },
  { g: "جدول دوام افتراضي", no: "٥١٢٨", br: "شركة الحلول الخبيرة", d: "بنين - متوسط", md: "القسم الرئيسي", s: "قطاع مصر", p: "مسار مصر", f: "—", t: "—" },
  { g: "جدول دوام افتراضي", no: "٥١٠٤", br: "شركة الحلول الخبيرة", d: "بنين - ثانوي", md: "القسم الرئيسي", s: "قطاع مصر", p: "مسار مصر", f: "—", t: "—" },
];

const deviceRows = [
  { n: "عاصم خالد فتحي قرني", no: "١", fp: "١", newD: "17997AF8-87DA-4C5D", oldD: "5C127BD5-33A0-439C", d: "٢٠٢٤/١٠/٠١ ٩:١٣", site: "تجريبي تست", st: "جهاز معتمد" },
  { n: "عبدالله بيومي رمضان", no: "١١", fp: "١١", newD: "e41d6fe3135dc8d1", oldD: "e41d6fe3135dc8d1", d: "٢٠٢٤/٠٥/٢٨ ١٠:١٧", site: "mansoura", st: "جهاز معتمد" },
  { n: "محمد شعبان عبدالحميد", no: "١٢٧", fp: "١٢٧", newD: "4f2dd0633e36957e", oldD: "EB9F4860-BE2E-4FFE", d: "٢٠٢٥/٠٦/١٧ ١٣:٠٧", site: "تجريبي تست", st: "جهاز مرفوض" },
  { n: "عبدالله ابراهيم حمود الحربي", no: "٥٠٣٣", fp: "٥٠٢٢٣", newD: "994c1166b4fa94a5", oldD: "994c1166b4fa94a5", d: "٢٠٢٥/٠٦/١٨ ٨:٤١", site: "تجريبي ٢٠٢٥", st: "جهاز مرفوض" },
];

const siteRows = [
  { site: "نبراس (تجريبى)", en: "—", no: "٥٠٢٧", br: "شركة الحلول الخبيرة", d: "management", md: "القسم الرئيسي", s: "قطاع مصر", p: "مسار السعودية تيست" },
  { site: "الموقع ا", en: "—", no: "٥٠٨٨", br: "شركة الحلول الخبيرة", d: "as", md: "تجريبى م", s: "قطاع مصر", p: "مسار تجريبى م" },
  { site: "الموقع الاول", en: "—", no: "٥٠٨٨", br: "شركة الحلول الخبيرة", d: "as", md: "تجريبى م", s: "قطاع مصر", p: "مسار تجريبى م" },
  { site: "موقع جديد واحد", en: "—", no: "٥٠٨٨", br: "شركة الحلول الخبيرة", d: "as", md: "تجريبى م", s: "قطاع مصر", p: "مسار تجريبى م" },
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

function Steps({ active }: { active: number }) {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row-reverse sm:items-center">
        {steps.map((s, i) => {
          const on = i <= active;
          return (
            <div key={s.label} className="flex flex-1 items-center gap-3">
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-full ${
                  on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                <MaterialIcon name={s.icon} size={20} filled={on} />
              </div>
              <span className={`text-[12px] font-extrabold ${on ? "text-primary" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span className={`hidden h-1 flex-1 rounded-full sm:block ${on ? "bg-primary/40" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeBlock({ title, tone, rows }: { title: string; tone: "sky" | "cyan" | "indigo"; rows: [string, string][] }) {
  const tones = {
    sky: "bg-primary/10 border-primary/25",
    cyan: "bg-cyan/12 border-cyan/25",
    indigo: "bg-indigo/12 border-indigo/25",
  } as const;
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <h3 className="mb-3 text-center text-[12.5px] font-extrabold">{title}</h3>
      <div className="space-y-2.5">
        {rows.map(([label, v]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-8 text-[11.5px] font-bold text-muted-foreground">{label}</span>
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <MaterialIcon name="schedule" size={16} className="text-primary" />
              <input defaultValue={v} className="w-full bg-transparent text-[12.5px] font-bold outline-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Filters({ fields, dates = true }: { fields: string[]; dates?: boolean }) {
  return (
    <Card title="بحث وتصفية" icon="filter_alt">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {fields.map((f) => (
          <Field key={f} label={f}>
            <Select options={["اختر ....", "شركة الحلول الخبيرة", "القسم الرئيسي", "قطاع مصر"]} />
          </Field>
        ))}
        {dates && (
          <>
            <Field label="التاريخ من">
              <DateInput />
            </Field>
            <Field label="التاريخ الى">
              <DateInput />
            </Field>
          </>
        )}
      </div>
      <div className="mt-5">
        <Btn icon="search">بحث</Btn>
      </div>
    </Card>
  );
}

function Shifts() {
  const [tab, setTab] = useState("new");

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "إعدادات متنوعة", "تهيئة مجموعات الدوام"]} />
      <PageBanner
        icon="schedule"
        title="تهيئة مجموعات الدوام"
        subtitle="جداول الدوام، أيام وأوقات الحضور والانصراف، إسناد الموظفين والمواقع"
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
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12.5px] font-bold transition-colors ${
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
        {tab === "new" && (
          <>
            <Steps active={2} />
            <Card title="بيانات جدول الدوام" icon="tune">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="اسم المجموعة" required>
                  <Input placeholder="اسم المجموعة" />
                </Field>
                <Field label="اسم المجموعة بالإنجليزية">
                  <Input placeholder="Group name" />
                </Field>
                <Field label="الفرع">
                  <Select options={["اختر ....", "شركة الحلول الخبيرة", "شركة الحلول ٢"]} />
                </Field>
                <Field label="التاريخ من">
                  <DateInput />
                </Field>
                <Field label="التاريخ الى">
                  <DateInput />
                </Field>
                <div className="flex items-end">
                  <Check label="مرن" hint="السماح بدوام مرن دون التزام بأوقات ثابتة" />
                </div>
              </div>
            </Card>

            <Card title="تهيئة ايام جدول الدوام" icon="group_add">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-indigo/25 bg-indigo/10 p-4">
                  <h3 className="mb-3 text-center text-[12.5px] font-extrabold">الدوام</h3>
                  <div className="space-y-3">
                    <Field label="يوم">
                      <Select options={["اختر ....", ...days]} />
                    </Field>
                    <Field label="نوع الدوام">
                      <Select options={["صباحى", "مسائى"]} />
                    </Field>
                    <Field label="الحضور بالدقائق">
                      <Input type="number" defaultValue={240} />
                    </Field>
                  </div>
                </div>
                <TimeBlock
                  title="الدوام الصباحي"
                  tone="cyan"
                  rows={[
                    ["حضور", "٠١:٠٠"],
                    ["انصراف", "٠٥:٠٠"],
                  ]}
                />
                <TimeBlock
                  title="الدوام المسائي"
                  tone="indigo"
                  rows={[
                    ["حضور", "٠٠:٠٠"],
                    ["انصراف", "٠٠:٠٠"],
                  ]}
                />
              </div>
              <div className="mt-5">
                <Btn icon="add" variant="teal">
                  اضافة يوم
                </Btn>
              </div>
            </Card>

            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="ايام جدول الدوام" />
              <DataTable
                columns={[
                  "يوم",
                  "حضور رسمى فترة ١",
                  "انصراف رسمى فترة ١",
                  "حضور رسمى فترة ٢",
                  "انصراف رسمى فترة ٢",
                  "الحضور بالدقائق",
                  "نوع الدوام",
                  "حذف",
                ]}
                rows={dayRows.map((r, i) => ({
                  يوم: <span className="font-extrabold text-primary">{days[i]}</span>,
                  "حضور رسمى فترة ١": r.in1,
                  "انصراف رسمى فترة ١": r.out1,
                  "حضور رسمى فترة ٢": r.in2,
                  "انصراف رسمى فترة ٢": r.out2,
                  "الحضور بالدقائق": r.mins,
                  "نوع الدوام": r.type,
                  حذف: <IconBtn icon="delete" tone="destructive" />,
                }))}
              />
              <Pager page={1} pages={1} total={6} />
            </div>

            <Card title="تهيئة اوقات الحضور والانصراف لجدول الدوام" icon="playlist_add">
              <div className="grid gap-4 lg:grid-cols-4">
                <TimeBlock title="الحضور الصباحى" tone="cyan" rows={[["من", "٠٧:٠٠"], ["الى", "٠٨:٠٠"]]} />
                <TimeBlock title="الانصراف الصباحى" tone="cyan" rows={[["من", "٢٠:٠٠"], ["الى", "٢٢:٠٠"]]} />
                <TimeBlock title="الحضور المسائى" tone="indigo" rows={[["من", "٠٠:٠٠"], ["الى", "٠٠:٠٠"]]} />
                <TimeBlock title="الانصراف المسائى" tone="indigo" rows={[["من", "٠٠:٠٠"], ["الى", "٠٠:٠٠"]]} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Btn icon="add" variant="teal">
                  اضافة فترة
                </Btn>
                <Btn icon="save">حفظ</Btn>
              </div>
            </Card>
          </>
        )}

        {tab === "view" && (
          <>
            <Card title="اختيار جدول الدوام" icon="visibility">
              <div className="grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="جدول الدوام">
                  <Select options={["اختر ....", "الحلول الخبيره", "جدول دوام مكة"]} />
                </Field>
                <Btn icon="edit" variant="teal">
                  تعديل جداول الدوام
                </Btn>
              </div>
            </Card>
            <Steps active={3} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="استعراض بيانات جدول الدوام" icon="settings">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="جدول الدوام">
                    <Input defaultValue="الحلول الخبيره" />
                  </Field>
                  <Field label="الفرع">
                    <Input defaultValue="شركة الحلول الخبيرة" />
                  </Field>
                  <Field label="جدول الدوام بالإنجليزية">
                    <Input placeholder="Schedule name" />
                  </Field>
                  <Field label="التاريخ من">
                    <DateInput />
                  </Field>
                  <Field label="التاريخ الى">
                    <DateInput />
                  </Field>
                  <div className="flex items-end">
                    <Check label="مرن" />
                  </div>
                </div>
              </Card>
              <div
                className="overflow-hidden rounded-2xl border border-border bg-card"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <TableToolbar title="ايام جدول الدوام" />
                <DataTable
                  columns={["يوم", "حضور رسمى فترة ١", "انصراف رسمى فترة ١", "الحضور بالدقائق", "حذف"]}
                  rows={days.map((d) => ({
                    يوم: <span className="font-extrabold text-primary">{d}</span>,
                    "حضور رسمى فترة ١": "٠٧:٠٠",
                    "انصراف رسمى فترة ١": "٢٢:٠٠",
                    "الحضور بالدقائق": "٩٠٠",
                    حذف: <IconBtn icon="delete" tone="destructive" />,
                  }))}
                />
                <Pager page={1} pages={1} total={6} />
              </div>
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="اوقات الحضور والانصراف لجدول الدوام" />
              <DataTable
                columns={[
                  "الحضور الصباحى من",
                  "الحضور الصباحى الى",
                  "الانصراف الصباحى من",
                  "الانصراف الصباحى الى",
                  "الحضور المسائى من",
                  "الحضور المسائى الى",
                  "الانصراف المسائى من",
                  "الانصراف المسائى الى",
                  "حذف",
                ]}
                rows={[
                  {
                    "الحضور الصباحى من": "٠٧:٠٠",
                    "الحضور الصباحى الى": "٠٨:٠٠",
                    "الانصراف الصباحى من": "٢٠:٠٠",
                    "الانصراف الصباحى الى": "٢٢:٠٠",
                    "الحضور المسائى من": "٠٠:٠٠",
                    "الحضور المسائى الى": "٠٠:٠٠",
                    "الانصراف المسائى من": "٠٠:٠٠",
                    "الانصراف المسائى الى": "٠٠:٠٠",
                    حذف: <IconBtn icon="delete" tone="destructive" />,
                  },
                ]}
              />
            </div>
          </>
        )}

        {tab === "emp-view" && (
          <>
            <Filters
              fields={["الفروع", "القسم", "الحاله", "الوظيفه الحاليه", "القسم الرئيسي", "القطاع", "الفئة الوظيفية", "المستوى الوظيفي", "المسار", "اسم المجموعة"]}
            />
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="الموظفين لجدول الدوام" />
              <DataTable
                columns={["اسم المجموعة", "الرقم الوظيفي", "الفرع", "القسم", "القسم الرئيسى", "القطاع", "المسار", "التاريخ من", "التاريخ الى"]}
                rows={empRows.map((r) => ({
                  "اسم المجموعة": <span className="font-extrabold text-primary">{r.g}</span>,
                  "الرقم الوظيفي": r.no,
                  الفرع: r.br,
                  القسم: r.d,
                  "القسم الرئيسى": r.md,
                  القطاع: r.s,
                  المسار: r.p,
                  "التاريخ من": r.f,
                  "التاريخ الى": r.t,
                }))}
              />
              <Pager page={1} pages={61} total={357} />
            </div>
          </>
        )}

        {tab === "emp-assign" && (
          <Card title="اسناد الموظفين لجدول الدوام" icon="assignment_ind">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field label="اسم المجموعة" required>
                <Select options={["اختر ....", "جدول دوام مكة", "الحلول الخبيره"]} />
              </Field>
              <Field label="التاريخ من">
                <DateInput />
              </Field>
              <Field label="التاريخ الى">
                <DateInput />
              </Field>
              <Field label="المستويات الوظيفية">
                <Select />
              </Field>
              <Field label="الفرع">
                <Select />
              </Field>
              <Field label="الأقسام">
                <Select />
              </Field>
              <Field label="القسم الرئيسى">
                <Select />
              </Field>
              <Field label="القطاع">
                <Select />
              </Field>
              <Field label="المسار">
                <Select />
              </Field>
              <Field label="الوظيفه الحاليه">
                <Select />
              </Field>
              <Field label="الفئة الوظيفية">
                <Select />
              </Field>
              <Field label="اسم الموظف">
                <Select />
              </Field>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <Check label="موظفين ليس لهم جدول دوام افتراضى" />
              <Check label="كل الموظفين" />
            </div>
            <div className="mt-5">
              <Btn icon="save" variant="teal">
                حفظ
              </Btn>
            </div>
          </Card>
        )}

        {tab === "recalc" && (
          <Card title="تطبيق جداول الدوام على فترة زمنية" icon="restart_alt">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="اسم المجموعة" required>
                <Select options={["اختر ....", "مجموعة دوام محمد شعبان", "H.M"]} />
              </Field>
              <Field label="التاريخ من">
                <DateInput />
              </Field>
              <Field label="التاريخ الى">
                <DateInput />
              </Field>
            </div>
            <div className="mt-5">
              <Btn icon="autorenew" variant="teal">
                اعادة احتساب الكل
              </Btn>
            </div>
          </Card>
        )}

        {tab === "device" && (
          <>
            <Card title="بحث" icon="filter_alt">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="الرقم الوظيفي">
                  <Input placeholder="الرقم الوظيفي" />
                </Field>
                <Field label="اسم الموظف">
                  <Select />
                </Field>
                <Field label="التاريخ من">
                  <DateInput />
                </Field>
                <Field label="التاريخ الى">
                  <DateInput />
                </Field>
              </div>
              <div className="mt-5">
                <Btn icon="search">بحث</Btn>
              </div>
            </Card>
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="طلبات تغير اجهزة جوال البصمة" />
              <DataTable
                columns={[
                  "اسم الموظف",
                  "الرقم الوظيفي",
                  "رقم البصمه",
                  "جهاز الموبيل الجديد",
                  "جهاز الموبيل القديم",
                  "تاريخ اخر بصمة جديدة",
                  "اسم الموقع",
                  "حالة الطلب",
                  "الاجراء",
                ]}
                rows={deviceRows.map((r) => ({
                  "اسم الموظف": <span className="font-extrabold text-primary">{r.n}</span>,
                  "الرقم الوظيفي": r.no,
                  "رقم البصمه": r.fp,
                  "جهاز الموبيل الجديد": <span className="font-mono text-[11px]">{r.newD}</span>,
                  "جهاز الموبيل القديم": <span className="font-mono text-[11px]">{r.oldD}</span>,
                  "تاريخ اخر بصمة جديدة": r.d,
                  "اسم الموقع": r.site,
                  "حالة الطلب": (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        r.st === "جهاز معتمد" ? "bg-teal/12 text-teal" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      <span className={`size-2 rounded-full ${r.st === "جهاز معتمد" ? "bg-teal" : "bg-destructive"}`} />
                      {r.st}
                    </span>
                  ),
                  الاجراء: (
                    <span className="flex gap-1.5">
                      <IconBtn icon="check" tone="teal" />
                      <IconBtn icon="close" tone="destructive" />
                    </span>
                  ),
                }))}
              />
              <Pager page={1} pages={2} total={11} />
            </div>
          </>
        )}

        {tab === "site-assign" && (
          <Card title="اسناد الموظفين للموقع" icon="add_location_alt">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field label="الموقع" required>
                <Select options={["اختر ....", "الموقع الاول", "تجريبي تست"]} />
              </Field>
              <Field label="اسم المجموعة" required>
                <Select options={["اختر ....", "جدول دوام مكة", "H.M"]} />
              </Field>
              <Field label="المستوى الوظيفي">
                <Select />
              </Field>
              <Field label="التاريخ من">
                <DateInput />
              </Field>
              <Field label="التاريخ الى">
                <DateInput />
              </Field>
              <Field label="الفرع">
                <Select />
              </Field>
              <Field label="الأقسام">
                <Select />
              </Field>
              <Field label="القسم الرئيسى">
                <Select />
              </Field>
              <Field label="القطاع">
                <Select />
              </Field>
              <Field label="المسار">
                <Select />
              </Field>
              <Field label="اسم الموظف">
                <Select />
              </Field>
            </div>
            <div className="mt-5">
              <Btn icon="save" variant="teal">
                حفظ
              </Btn>
            </div>
          </Card>
        )}

        {tab === "site-view" && (
          <>
            <Filters fields={["الموقع", "اسم المجموعة", "اسم الموظف", "الفرع", "القسم الرئيسى", "الأقسام", "المسار", "القطاع"]} />
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="الموظفين للموقع" />
              <DataTable
                columns={["الموقع", "الموقع بالإنجليزية", "الرقم الوظيفي", "الفرع", "الأقسام", "القسم الرئيسى", "القطاع", "المسار"]}
                rows={siteRows.map((r) => ({
                  الموقع: <span className="font-extrabold text-primary">{r.site}</span>,
                  "الموقع بالإنجليزية": r.en,
                  "الرقم الوظيفي": r.no,
                  الفرع: r.br,
                  الأقسام: r.d,
                  "القسم الرئيسى": r.md,
                  القطاع: r.s,
                  المسار: r.p,
                }))}
              />
              <Pager page={1} pages={10} total={128} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
