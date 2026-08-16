import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { MegaMenu, type NavItem } from "@/components/MegaMenu";

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

const nav: NavItem[] = [
  { label: "إدارة المهام", icon: "dashboard_customize" },
  { label: "الصلاحيات", icon: "shield_person" },
  { label: "تقييم الأداء", icon: "trending_up" },
  { label: "طلبات الاعتماد", icon: "task_alt" },
  {
    label: "التقارير",
    icon: "lab_profile",
    columns: [
      {
        title: "تقارير البصمة",
        items: [
          "تقرير البصمة",
          "تقرير حضور وإنصراف البصمة",
          "التقرير الاحصائي للحضور والإنصراف",
          "تقرير الحضور والإنصراف التفصيلي",
          "تقرير الحضور والإنصراف الشامل",
          "التأخير اليومي",
          "غياب الموظف",
          "تفاصيل قيمة غياب الموظف",
          "مقارنة الغياب والتأخير للفروع والأقسام",
          "تقرير استثناءات الحضور والإنصراف",
          "تقرير عدد أيام الغياب",
          "تقرير الغياب بالأيام",
          "تقرير التأخير بالأيام",
          "تقرير حصر الغياب بالأشهر",
        ],
      },
      {
        title: "تقارير بيانات الموظفين",
        items: [
          "تقارير بيانات الموظفين",
          "تقرير البيانات الاساسية",
          "تقرير التعيينات وإنهاء الخدمة",
          "تقرير ملفات الموظفين",
          "تقرير التقييم",
          "طباعة النماذج الإدارية",
          "تقرير التأمين الطبي للموظفين",
          "تقرير البيانات المالية",
          "تقرير اجازات الموظفين",
          "تقرير المرافقين",
          "تقرير الشهادات",
          "تقرير الدورات التدريبية",
        ],
      },
      {
        title: "تقارير ماليات الموظفين",
        items: [
          "مسير الرواتب",
          "مقارنة بين شهرين للمسير",
          "تقرير الاستحقاقات والاستقطاعات",
          "تقرير كشف الحساب البنكي",
          "تقرير تعديل المسير",
          "تقرير بيانات السلف",
          "تقرير رصيد السلف",
          "تقرير العهد النقدية",
          "كشف حساب الموظف للعام",
        ],
      },
      {
        title: "تقارير إحصائية",
        items: [
          "تقرير الموازنة التقديرية للقوى العاملة",
          "تقرير اعداد الموظفين",
          "تقرير عقود الموظفين",
          "تقرير الطلبات المتنوعة",
          "تقرير التعميمات والاستبيانات",
        ],
      },
      { title: "تقارير تاريخية", items: ["تقرير الملف التاريخي لاجازات الموظفين", "الأرشيف"] },
    ],
  },
  {
    label: "الطلبات",
    icon: "campaign",
    columns: [
      { title: "الموافقة على الطلبات", items: ["الطلبات", "ميزانية الشراء", "تهيئة الطلبات"] },
    ],
  },
  {
    label: "اللوائح",
    icon: "format_list_bulleted",
    columns: [
      {
        title: "التهيئة المالية",
        items: ["لائحة الإستحقاقات", "لائحة الإستقطاعات", "تهيئة العمولات البنكية"],
      },
      {
        title: "إعدادات متنوعة",
        items: [
          "تهيئة الاجازات",
          "تهيئة مجموعات الدوام",
          "تهيئة السلف",
          "تهيئة سلاسل الموافقات",
          "تهيئة لائحة الأذونات",
        ],
      },
      { title: "لائحة خصومات البصمة", items: ["لائحة خصومات البصمة"] },
      { title: "لوائح أخرى", items: ["لوائح أخرى", "لائحة نهاية الخدمة"] },
    ],
  },
  {
    label: "عمليات شؤون الموظفين",
    icon: "manage_accounts",
    columns: [
      { title: "متابعة المستندات", items: ["اشعارات الطلبات"] },
      { title: "بيانات الموظفين", items: ["شؤون الموظفين"] },
      {
        title: "عمليات الموظفين",
        items: [
          "الأجازات",
          "الاستبيانات و التعميم",
          "المسائلات",
          "الاذونات",
          "المراسلات",
          "مخصص نهاية الخدمة",
          "طلبات نهاية الخدمة",
        ],
      },
      { title: "ماليات الموظفين", items: ["السلف"] },
      { title: "رواتب الموظفين", items: ["تجهيز مسودة المسير", "ملف البنك"] },
    ],
  },
  {
    label: "إعدادات النظام",
    icon: "settings",
    columns: [
      {
        title: "تهيئة البيانات الأساسية",
        items: ["التهيئة العامة للبرنامج", "تهيئة البيانات الاساسية", "تهيئة ربط الحسابات"],
      },
      {
        title: "تهيئة بيانات الشركات والفروع",
        items: ["تهيئة بيانات الشركة", "تهيئة بيانات الفروع", "مستندات الشركة والافرع"],
      },
      {
        title: "إعدادات أخرى",
        items: [
          "تهيئة السنوات والشهور",
          "تهيئة الكفلاء",
          "تهيئة أسباب الايقاف",
          "تحديد اعداد الموظفين في الفروع",
        ],
      },
    ],
  },
];

const sidebar = [
  { label: "اللوحة الرئيسية", icon: "space_dashboard", active: true },
  { label: "الموظفون", icon: "groups", badge: "٣٢٤" },
  { label: "الحضور والانصراف", icon: "schedule" },
  { label: "الإجازات", icon: "beach_access", badge: "٧" },
  { label: "الرواتب", icon: "payments" },
  { label: "التوظيف", icon: "person_add" },
  { label: "التدريب", icon: "school" },
];

type Stat = {
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: "blue" | "red" | "yellow" | "green";
  trend: { dir: "up" | "down"; text: string };
};

const toneStyles: Record<Stat["tone"], { icon: string; bar: string; text: string }> = {
  blue: { icon: "bg-gblue/12 text-gblue", bar: "bg-gblue", text: "text-gblue" },
  red: { icon: "bg-gred/12 text-gred", bar: "bg-gred", text: "text-gred" },
  yellow: { icon: "bg-gyellow/20 text-gold", bar: "bg-gyellow", text: "text-gold" },
  green: { icon: "bg-ggreen/12 text-ggreen", bar: "bg-ggreen", text: "text-ggreen" },
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
  { name: "المبيعات", count: 72, color: "var(--gblue)" },
  { name: "الإدارة", count: 64, color: "var(--gred)" },
  { name: "تقنية المعلومات", count: 52, color: "var(--gyellow)" },
  { name: "الموارد البشرية", count: 50, color: "var(--ggreen)" },
  { name: "التسويق", count: 48, color: "oklch(0.55 0.19 300)" },
  { name: "المالية", count: 38, color: "oklch(0.65 0.14 200)" },
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
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30">
        <div className="flex h-16 items-center gap-4 border-b border-topbar-border bg-topbar px-4 text-topbar-foreground md:px-6">
          <div className="flex items-center gap-3">
            <div
              className="grid size-10 place-items-center rounded-xl bg-white/10 text-topbar-foreground ring-1 ring-white/15"
            >
              <MaterialIcon name="diversity_3" size={22} filled />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-extrabold">الموارد البشرية</h1>
              <p className="text-[11px] font-semibold text-topbar-muted">الحلول الخبيرة · V1.0.3</p>
            </div>
          </div>

          <div className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-xl bg-white/8 px-3 py-2 ring-1 ring-white/15 focus-within:ring-topbar-accent lg:flex">
            <MaterialIcon name="search" size={20} className="text-topbar-muted" />
            <input
              placeholder="ابحث بالاسم، الهوية، أو الرقم الوظيفي"
              className="w-full bg-transparent text-sm text-topbar-foreground placeholder:text-topbar-muted focus:outline-none"
            />
            <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-topbar-muted ring-1 ring-white/15">⌘K</kbd>
          </div>

          <div className="ms-auto flex items-center gap-1">
            <TopAction icon="notifications" count="٦" />
            <TopAction icon="content_paste" count="٠" />
            <TopAction icon="language" />
            <div className="mx-2 hidden h-8 w-px bg-white/15 sm:block" />
            <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-topbar-hover">
              <span
                className="grid size-9 place-items-center rounded-full bg-topbar-accent text-sm font-bold text-topbar"
              >
                SY
              </span>
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-xs font-bold">مرحباً، مدير النظام</span>
                <span className="block text-[11px] font-semibold text-topbar-muted">system@system.com</span>
              </span>
              <MaterialIcon name="expand_more" size={18} className="text-topbar-muted" />
            </button>
          </div>
        </div>

        {/* Nav with mega menus */}
        <MegaMenu items={nav} />
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-[7.5rem] hidden h-[calc(100vh-7.5rem)] w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar lg:flex">
          <p className="px-5 pb-2 pt-5 text-[11px] font-bold tracking-widest text-muted-foreground">
            لوحات المعلومات
          </p>
          <ul className="space-y-1 px-3">
            {sidebar.map((item) => (
              <li key={item.label}>
                <button
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    item.active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                  }`}
                >
                  <MaterialIcon name={item.icon} size={20} filled={item.active} />
                  <span className="flex-1 text-right">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        item.active ? "bg-primary-foreground/20" : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-auto p-3">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white"
              style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-raised)" }}
            >
              <MaterialIcon name="design_services" size={20} filled />
              تعديل في المُصمم
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
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

              <div className="mt-5 rounded-xl border border-ggreen/25 bg-ggreen/8 p-4">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <MaterialIcon name="verified" size={18} className="text-ggreen" filled />
                  اكتمال بيانات الموظفين
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-card">
                  <div className="h-full w-[78%] rounded-full" style={{ background: "linear-gradient(90deg, var(--ggreen), oklch(0.72 0.15 165))" }} />
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

          <footer className="mt-8 flex flex-wrap items-center justify-center gap-1 border-t border-border pt-5 text-xs font-semibold text-muted-foreground">
            جميع الحقوق محفوظة © <span className="text-primary">الحلول الخبيرة</span>
          </footer>
        </main>
      </div>

      <button
        className="fixed bottom-6 left-6 grid size-14 place-items-center rounded-full text-primary-foreground"
        style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-raised)" }}
        aria-label="التنبيهات"
      >
        <MaterialIcon name="notifications_active" size={24} filled />
      </button>
    </div>
  );
}

function TopAction({ icon, count }: { icon: string; count?: string }) {
  return (
    <button className="relative grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
      <MaterialIcon name={icon} size={22} />
      {count && (
        <span className="absolute -top-0.5 left-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {count}
        </span>
      )}
    </button>
  );
}
