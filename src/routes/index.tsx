import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { AppShell } from "@/components/hr/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الموارد البشرية | لوحة تحكم إدارة شؤون الموظفين" },
      {
        name: "description",
        content:
          "نظام الموارد البشرية: لوحة تحكم لإدارة المهام، الطلبات، تقييم الأداء، اللوائح وشؤون الموظفين.",
      },
      { property: "og:title", content: "الموارد البشرية | لوحة تحكم إدارة شؤون الموظفين" },
      {
        property: "og:description",
        content: "متابعة الطلبات، الاعتمادات، الحضور وتقييم الأداء من مكان واحد.",
      },
    ],
  }),
  component: Index,
});

type Stat = {
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: "blue" | "red" | "yellow" | "green";
  trend: { dir: "up" | "down"; text: string };
};

const toneStyles: Record<Stat["tone"], { icon: string; bar: string; text: string }> = {
  blue: { icon: "bg-sky/12 text-sky", bar: "bg-sky", text: "text-sky" },
  red: { icon: "bg-indigo/12 text-indigo", bar: "bg-indigo", text: "text-indigo" },
  yellow: { icon: "bg-cyan/12 text-cyan", bar: "bg-cyan", text: "text-cyan" },
  green: { icon: "bg-teal/12 text-teal", bar: "bg-teal", text: "text-teal" },
};

const stats: Stat[] = [
  {
    label: "إجمالي الموظفين",
    value: "٣٢٤",
    hint: "٢٨١ نشط · ٤٣ إجازة",
    icon: "groups",
    tone: "blue",
    trend: { dir: "up", text: "٤٪ عن الشهر الماضي" },
  },
  {
    label: "الحضور اليوم",
    value: "٩٤٪",
    hint: "٣٠٥ حاضر · ١٩ غائب",
    icon: "how_to_reg",
    tone: "green",
    trend: { dir: "up", text: "٢٪ عن الأمس" },
  },
  {
    label: "طلبات معلّقة",
    value: "١٨",
    hint: "٤ عاجلة · ٧ للمراجعة",
    icon: "pending_actions",
    tone: "yellow",
    trend: { dir: "down", text: "٦ طلبات أُغلقت اليوم" },
  },
  {
    label: "إجازات هذا الشهر",
    value: "٤٢",
    hint: "٧ جارية · ٣٥ مقبولة",
    icon: "beach_access",
    tone: "red",
    trend: { dir: "up", text: "٩ طلبات جديدة" },
  },
];

const attendanceWeek = [
  { day: "الأحد", value: 96 },
  { day: "الإثنين", value: 94 },
  { day: "الثلاثاء", value: 98 },
  { day: "الأربعاء", value: 92 },
  { day: "الخميس", value: 95 },
];

const departments = [
  { name: "المبيعات", count: 72, color: "var(--sky)" },
  { name: "الإدارة", count: 64, color: "var(--indigo)" },
  { name: "تقنية المعلومات", count: 52, color: "var(--cyan)" },
  { name: "الموارد البشرية", count: 50, color: "var(--teal)" },
  { name: "التسويق", count: 48, color: "var(--gblue)" },
  { name: "المالية", count: 38, color: "var(--violet)" },
];

const requests = [
  { name: "سارة العتيبي", role: "أخصائية تسويق", type: "إجازة سنوية", days: "٥ أيام", state: "بانتظار الاعتماد", time: "قبل ٢ ساعة" },
  { name: "محمد الحربي", role: "مطور برمجيات", type: "سلفة راتب", days: "٣٠٠٠ ر.س", state: "مكتمل", time: "قبل ٥ ساعات" },
  { name: "نورة القحطاني", role: "محاسبة", type: "خطاب تعريف", days: "بنك", state: "قيد المراجعة", time: "أمس" },
  { name: "خالد الزهراني", role: "مشرف عمليات", type: "إجازة مرضية", days: "٢ أيام", state: "مكتمل", time: "قبل يومين" },
  { name: "ريم السالم", role: "مصممة", type: "إذن خروج", days: "ساعتان", state: "بانتظار الاعتماد", time: "قبل ٣ ساعات" },
];

const stateStyle: Record<string, string> = {
  "بانتظار الاعتماد": "bg-gyellow/18 text-gold border-gyellow/40",
  مكتمل: "bg-ggreen/12 text-ggreen border-ggreen/35",
  "قيد المراجعة": "bg-gblue/10 text-gblue border-gblue/30",
};

const announcements = [
  { title: "تحديث سياسة العمل عن بُعد", body: "تم اعتماد ثلاثة أيام أسبوعياً عن بُعد لجميع الأقسام بدءاً من سبتمبر.", time: "قبل يومين", icon: "work_history" },
  { title: "إطلاق نظام التقييم الجديد", body: "تقييم الأداء ربع السنوي ينتقل للنموذج الرقمي الجديد.", time: "قبل ٤ أيام", icon: "star_half" },
  { title: "تذكير: تقديم طلبات الإجازة", body: "يرجى تقديم طلبات إجازات عيد الفطر قبل نهاية الأسبوع.", time: "قبل ٦ أيام", icon: "event_available" },
];

const birthdays = [
  { name: "سارة العتيبي", role: "تسويق", date: "١٢ أغسطس" },
  { name: "محمد الحربي", role: "تقنية", date: "١٨ أغسطس" },
  { name: "نورة القحطاني", role: "مالية", date: "٢٤ أغسطس" },
];

function Index() {
  const totalDept = departments.reduce((sum, d) => sum + d.count, 0);
  let acc = 0;
  const donutStops = departments
    .map((d) => {
      const start = (acc / totalDept) * 360;
      acc += d.count;
      const end = (acc / totalDept) * 360;
      return `${d.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <AppShell>
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <MaterialIcon name="calendar_today" size={14} />
        الأحد ١٦ أغسطس · نظرة عامة
      </p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
        لوحة معلومات الموارد البشرية
      </h2>
    </div>
    <div className="flex gap-2">
      <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary">
        <MaterialIcon name="download" size={18} />
        تصدير
      </button>
      <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
        <MaterialIcon name="add" size={18} />
        إضافة لوحة
      </button>
    </div>
  </div>

  {/* Stats */}
  <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {stats.map((s) => (
      <article
        key={s.label}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-lg"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <span className={`absolute inset-x-0 top-0 h-1 ${toneStyles[s.tone].bar}`} />
        <div className="flex items-start justify-between">
          <span
            className={`grid size-11 place-items-center rounded-2xl ${toneStyles[s.tone].icon}`}
          >
            <MaterialIcon name={s.icon} size={22} filled />
          </span>
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-bold ${
              s.trend.dir === "up"
                ? "bg-ggreen/12 text-ggreen"
                : "bg-gred/10 text-gred"
            }`}
          >
            <MaterialIcon name={s.trend.dir === "up" ? "trending_up" : "trending_down"} size={14} filled />
          </span>
        </div>
        <p className="mt-4 text-sm font-semibold text-muted-foreground">{s.label}</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{s.value}</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">{s.hint}</p>
        <p
          className={`mt-3 flex items-center gap-1 text-[11px] font-bold ${
            s.trend.dir === "up" ? "text-ggreen" : "text-gred"
          }`}
        >
          <MaterialIcon name={s.trend.dir === "up" ? "arrow_upward" : "arrow_downward"} size={13} />
          {s.trend.text}
        </p>
      </article>
    ))}
  </section>

  {/* Attendance trend + departments */}
  <div className="mt-6 grid gap-4 xl:grid-cols-3">
    <section
      className="rounded-2xl border border-border bg-card p-5 xl:col-span-2"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <MaterialIcon name="monitoring" size={20} className="text-gblue" filled />
          اتجاه الحضور الأسبوعي
        </h3>
        <span className="rounded-full bg-gblue/10 px-3 py-1 text-[11px] font-bold text-gblue">
          متوسط ٩٥٪
        </span>
      </div>
      <div className="relative mt-6 h-60">
        <div className="absolute inset-0 bottom-12 flex flex-col justify-between">
          {[100, 75, 50, 25, 0].map((g) => (
            <div key={g} className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-[10px] font-bold text-muted-foreground">{g}٪</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-stretch gap-3 ps-10">
          {attendanceWeek.map((d, i) => (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-1.5 text-xs font-extrabold text-foreground">{d.value}٪</span>
              <div
                className="w-full max-w-14 rounded-t-xl transition-all hover:opacity-85"
                style={{
                  height: `calc(${d.value}% - 3.5rem)`,
                  background: `linear-gradient(180deg, var(--chart-${(i % 5) + 1}) 0%, color-mix(in oklab, var(--chart-${(i % 5) + 1}) 70%, white) 100%)`,
                }}
                title={`${d.value}٪`}
              />
              <span className="mt-2 h-10 pt-1 text-[11px] font-bold text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section
      className="rounded-2xl border border-border bg-card p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h3 className="flex items-center gap-2 text-base font-bold">
        <MaterialIcon name="donut_large" size={20} className="text-gblue" filled />
        توزيع الأقسام
      </h3>
      <div className="mt-4 grid place-items-center">
        <div
          className="relative grid size-40 place-items-center rounded-full"
          style={{ background: `conic-gradient(${donutStops})` }}
        >
          <div className="grid size-24 place-items-center rounded-full bg-card">
            <span className="text-xl font-extrabold">{totalDept}</span>
            <span className="text-[10px] font-bold text-muted-foreground">موظف</span>
          </div>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {departments.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs font-semibold">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 text-foreground">{d.name}</span>
            <span className="text-muted-foreground">{d.count}</span>
            <span className="w-10 text-end font-bold text-foreground">
              {Math.round((d.count / totalDept) * 100)}٪
            </span>
          </li>
        ))}
      </ul>
    </section>
  </div>

  {/* Requests + quick actions */}
  <div className="mt-6 grid gap-4 xl:grid-cols-3">
    <section
      className="rounded-2xl border border-border bg-card xl:col-span-2"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <MaterialIcon name="inbox" size={20} className="text-primary" filled />
          أحدث الطلبات
        </h3>
        <button className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          عرض الكل
          <MaterialIcon name="chevron_left" size={18} />
        </button>
      </div>
      <ul className="divide-y divide-border">
        {requests.map((r) => (
          <li
            key={r.name}
            className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/60"
          >
            <span className="grid size-10 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {r.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{r.name}</p>
              <p className="truncate text-xs text-muted-foreground">{r.role}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{r.type}</p>
              <p className="text-xs text-muted-foreground">{r.days} · {r.time}</p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-bold ${stateStyle[r.state]}`}
            >
              {r.state}
            </span>
          </li>
        ))}
      </ul>
    </section>

    <section
      className="rounded-2xl border border-border bg-card p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h3 className="flex items-center gap-2 text-base font-bold">
        <MaterialIcon name="bolt" size={20} className="text-gold" filled />
        إجراءات سريعة
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { label: "طلب إجازة", icon: "event_available" },
          { label: "إضافة موظف", icon: "person_add" },
          { label: "مسير الرواتب", icon: "receipt_long" },
          { label: "تقييم أداء", icon: "star_half" },
          { label: "خطاب تعريف", icon: "mail" },
          { label: "تقرير حضور", icon: "insert_chart" },
        ].map((a) => (
          <button
            key={a.label}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-4 text-xs font-bold transition-colors hover:border-gblue/40 hover:bg-gblue/8"
          >
            <MaterialIcon name={a.icon} size={24} className="text-primary" />
            {a.label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-teal/25 bg-teal/8 p-4">
        <p className="flex items-center gap-2 text-sm font-bold">
          <MaterialIcon name="verified" size={18} className="text-teal" filled />
          اكتمال بيانات الموظفين
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-card">
          <div className="h-full w-[78%] rounded-full" style={{ background: "linear-gradient(90deg, var(--teal), var(--cyan))" }} />
        </div>
        <p className="mt-2 text-xs font-semibold text-muted-foreground">٧٨٪ مكتملة · ٧١ ملفاً ناقصاً</p>
      </div>
    </section>
  </div>

  {/* Announcements + birthdays */}
  <div className="mt-6 grid gap-4 xl:grid-cols-3">
    <section
      className="rounded-2xl border border-border bg-card xl:col-span-2"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <MaterialIcon name="campaign" size={20} className="text-primary" filled />
          التعميمات والإعلانات
        </h3>
        <button className="text-sm font-semibold text-primary hover:underline">كل الإعلانات</button>
      </div>
      <ul className="divide-y divide-border">
        {announcements.map((a) => (
          <li key={a.title} className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-secondary/60">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <MaterialIcon name={a.icon} size={20} filled />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold">{a.title}</p>
                <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{a.time}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>

    <section
      className="rounded-2xl border border-border bg-card p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h3 className="flex items-center gap-2 text-base font-bold">
        <MaterialIcon name="cake" size={20} className="text-gold" filled />
        مناسبات الشهر
      </h3>
      <ul className="mt-4 space-y-3">
        {birthdays.map((b) => (
          <li key={b.name} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
            <span className="grid size-10 place-items-center rounded-full bg-gold/20 text-gold">
              <MaterialIcon name="celebration" size={20} filled />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold">{b.name}</p>
              <p className="text-xs text-muted-foreground">{b.role}</p>
            </div>
            <span className="rounded-full bg-card px-3 py-1 text-[11px] font-bold text-foreground ring-1 ring-border">
              {b.date}
            </span>
          </li>
        ))}
      </ul>
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 py-2.5 text-sm font-bold transition-colors hover:bg-accent">
        <MaterialIcon name="calendar_month" size={18} className="text-primary" />
        تقويم المناسبات
      </button>
    </section>
  </div>
    </AppShell>
  );
}
