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

const stats = [
  { label: "إجمالي الموظفين", value: "٣٢٤", delta: "+١٢ هذا الشهر", icon: "groups", tone: "teal" },
  { label: "طلبات بانتظار الاعتماد", value: "١٨", delta: "٤ عاجلة", icon: "pending_actions", tone: "gold" },
  { label: "نسبة الحضور اليوم", value: "٩٤٪", delta: "+٢٪ عن الأمس", icon: "how_to_reg", tone: "teal" },
  { label: "متوسط تقييم الأداء", value: "٤.٦", delta: "من ٥", icon: "workspace_premium", tone: "brand" },
];

const requests = [
  { name: "سارة العتيبي", role: "أخصائية تسويق", type: "إجازة سنوية", days: "٥ أيام", state: "بانتظار الاعتماد" },
  { name: "محمد الحربي", role: "مطور برمجيات", type: "سلفة راتب", days: "٣٠٠٠ ر.س", state: "مكتمل" },
  { name: "نورة القحطاني", role: "محاسبة", type: "خطاب تعريف", days: "بنك", state: "قيد المراجعة" },
  { name: "خالد الزهراني", role: "مشرف عمليات", type: "إجازة مرضية", days: "٢ أيام", state: "مكتمل" },
];

const stateStyle: Record<string, string> = {
  "بانتظار الاعتماد": "bg-gold/15 text-gold-foreground border-gold/40",
  مكتمل: "bg-teal/15 text-teal-foreground border-teal/40",
  "قيد المراجعة": "bg-secondary text-muted-foreground border-border",
};

function Index() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30">
        <div
          className="flex h-16 items-center gap-4 px-4 text-brand-foreground md:px-6"
          style={{ background: "var(--gradient-brand)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid size-10 place-items-center rounded-xl text-teal-foreground"
              style={{ background: "var(--gradient-teal)" }}
            >
              <MaterialIcon name="diversity_3" size={22} filled />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-bold">الموارد البشرية</h1>
              <p className="text-[11px] text-brand-foreground/60">الحلول الخبيرة · V1.0.3</p>
            </div>
          </div>

          <div className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-xl bg-brand-foreground/10 px-3 py-2 ring-1 ring-brand-foreground/15 focus-within:ring-teal/60 lg:flex">
            <MaterialIcon name="search" size={20} className="text-brand-foreground/70" />
            <input
              placeholder="ابحث بالاسم، الهوية، أو الرقم الوظيفي"
              className="w-full bg-transparent text-sm placeholder:text-brand-foreground/50 focus:outline-none"
            />
            <kbd className="rounded-md bg-brand-foreground/15 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </div>

          <div className="ms-auto flex items-center gap-1">
            <TopAction icon="notifications" count="٦" />
            <TopAction icon="content_paste" count="٠" />
            <TopAction icon="language" />
            <div className="mx-2 hidden h-8 w-px bg-brand-foreground/20 sm:block" />
            <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-brand-foreground/10">
              <span className="grid size-9 place-items-center rounded-full bg-brand-foreground/15 text-sm font-bold">
                SY
              </span>
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-xs font-semibold">مرحباً، مدير النظام</span>
                <span className="block text-[11px] text-brand-foreground/60">system@system.com</span>
              </span>
              <MaterialIcon name="expand_more" size={18} className="text-brand-foreground/70" />
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
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-teal-foreground"
              style={{ background: "var(--gradient-teal)", boxShadow: "var(--shadow-raised)" }}
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
              <p className="text-xs font-semibold text-muted-foreground">
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
              <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                <MaterialIcon name="add" size={18} />
                إضافة لوحة
              </button>
            </div>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <article
                key={s.label}
                className="rounded-2xl border border-border bg-card p-5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`grid size-11 place-items-center rounded-xl ${
                      s.tone === "teal"
                        ? "bg-teal/15 text-teal-foreground"
                        : s.tone === "gold"
                          ? "bg-gold/20 text-gold"
                          : "bg-primary/10 text-primary"
                    }`}
                  >
                    <MaterialIcon name={s.icon} size={22} filled />
                  </span>
                  <MaterialIcon name="more_horiz" size={20} className="text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm font-semibold text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">{s.value}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{s.delta}</p>
              </article>
            ))}
          </section>

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
                      <p className="text-xs text-muted-foreground">{r.days}</p>
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
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-4 text-xs font-bold transition-colors hover:border-teal/50 hover:bg-accent"
                  >
                    <MaterialIcon name={a.icon} size={24} className="text-primary" />
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-teal/30 bg-teal/10 p-4">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <MaterialIcon name="verified" size={18} className="text-teal-foreground" filled />
                  اكتمال بيانات الموظفين
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-card">
                  <div className="h-full w-[78%] rounded-full" style={{ background: "var(--gradient-teal)" }} />
                </div>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">٧٨٪ مكتملة · ٧١ ملفاً ناقصاً</p>
              </div>
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
    <button className="relative grid size-10 place-items-center rounded-xl transition-colors hover:bg-brand-foreground/10">
      <MaterialIcon name={icon} size={22} className="text-brand-foreground/85" />
      {count && (
        <span className="absolute -top-0.5 left-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {count}
        </span>
      )}
    </button>
  );
}
