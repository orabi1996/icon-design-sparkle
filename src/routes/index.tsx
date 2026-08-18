import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MaterialIcon } from "@/components/MaterialIcon";
import { AppShell } from "@/components/hr/AppShell";
import { ar, money, useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة معلومات الموارد البشرية | مؤشرات ورسومات مباشرة" },
      {
        name: "description",
        content:
          "لوحة تحكم الموارد البشرية: مؤشرات الموظفين والحضور والطلبات والأجازات والرواتب مع رسومات بيانية مباشرة من قاعدة البيانات.",
      },
      { property: "og:title", content: "لوحة معلومات الموارد البشرية" },
      {
        property: "og:description",
        content: "مؤشرات مباشرة للحضور، الطلبات، الأجازات، توزيع الأقسام ومسيرات الرواتب.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const palette = ["var(--sky)", "var(--cyan)", "var(--teal)", "var(--indigo)", "var(--gblue)", "var(--violet)"];

const tones: Record<string, string> = {
  sky: "bg-sky/12 text-sky",
  teal: "bg-teal/12 text-teal",
  cyan: "bg-cyan/12 text-cyan",
  indigo: "bg-indigo/12 text-indigo",
};
const bars: Record<string, string> = {
  sky: "bg-sky",
  teal: "bg-teal",
  cyan: "bg-cyan",
  indigo: "bg-indigo",
};

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
  to,
}: {
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: keyof typeof tones;
  to?: string;
}) {
  const body = (
    <article
      className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-lg"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${bars[tone]}`} />
      <span className={`grid size-11 place-items-center rounded-2xl ${tones[tone]}`}>
        <MaterialIcon name={icon} size={22} filled />
      </span>
      <p className="mt-4 text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{hint}</p>
    </article>
  );
  return to ? (
    <Link to={to as never} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

function Panel({
  title,
  icon,
  children,
  className = "",
  badge,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
  badge?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card p-5 ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <MaterialIcon name={icon} size={20} className="text-primary" filled />
          {title}
        </h3>
        {badge && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">{badge}</span>
        )}
      </div>
      {children}
    </section>
  );
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--card)",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 700,
    direction: "rtl" as const,
  },
};

function Dashboard() {
  const employees = useRows("employees", { orderBy: "emp_no", ascending: true }).data ?? [];
  const attendance = useRows("attendance_records", { orderBy: "work_date", ascending: true, limit: 1000 }).data ?? [];
  const requests = useRows("requests").data ?? [];
  const leaves = useRows("leave_requests").data ?? [];
  const loans = useRows("loans").data ?? [];
  const runs = useRows("payroll_runs", { orderBy: "month", ascending: true }).data ?? [];
  const announcements = useRows("announcements", { limit: 4 }).data ?? [];

  const active = employees.filter((e) => e["status"] === "نشط").length;
  const payroll = employees.reduce(
    (s, e) => s + Number(e["basic_salary"] ?? 0) + Number(e["allowances"] ?? 0),
    0,
  );
  const pendingRequests = requests.filter((r) => ["جديد", "قيد المعالجة"].includes(String(r["status"]))).length;
  const pendingLeaves = leaves.filter((l) => l["status"] === "بانتظار الموافقة").length;
  const openLoans = loans.filter((l) => l["status"] === "قيد السداد");
  const loansOutstanding = openLoans.reduce(
    (s, l) => s + (Number(l["amount"] ?? 0) - Number(l["paid_amount"] ?? 0)),
    0,
  );

  // Attendance trend for the last 12 recorded work days
  const byDay = new Map<string, { present: number; total: number; late: number }>();
  for (const a of attendance) {
    const d = String(a["work_date"]);
    const cur = byDay.get(d) ?? { present: 0, total: 0, late: 0 };
    cur.total += 1;
    if (a["status"] !== "غائب") cur.present += 1;
    if (a["status"] === "متأخر") cur.late += 1;
    byDay.set(d, cur);
  }
  const days = [...byDay.entries()].slice(-12).map(([d, v]) => ({
    day: d.slice(5).replace("-", "/"),
    نسبة_الحضور: Math.round((v.present / Math.max(v.total, 1)) * 100),
    متأخرون: v.late,
  }));
  const todayRate = days.length ? days[days.length - 1]!["نسبة_الحضور"] : 0;

  const deptMap = new Map<string, number>();
  for (const e of employees) deptMap.set(String(e["department"] ?? "غير محدد"), (deptMap.get(String(e["department"] ?? "غير محدد")) ?? 0) + 1);
  const depts = [...deptMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const reqMap = new Map<string, number>();
  for (const r of requests) reqMap.set(String(r["request_type"]), (reqMap.get(String(r["request_type"])) ?? 0) + 1);
  const reqTypes = [...reqMap.entries()].map(([name, عدد]) => ({ name, عدد })).sort((a, b) => b["عدد"] - a["عدد"]);

  const runTrend = runs.map((r) => ({
    name: `${r["month"]}/${r["year"]}`,
    الصافي: Number(r["total_net"] ?? 0),
    الاستقطاعات: Number(r["total_deductions"] ?? 0),
  }));

  const upcomingContracts = employees
    .filter((e) => e["contract_end"])
    .sort((a, b) => String(a["contract_end"]).localeCompare(String(b["contract_end"])))
    .slice(0, 5);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <MaterialIcon name="calendar_today" size={14} />
            {new Date().toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long" })} · بيانات مباشرة
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">لوحة معلومات الموارد البشرية</h2>
        </div>
        <div className="flex gap-2">
          <Link
            to="/staff/add"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <MaterialIcon name="person_add" size={18} />
            إضافة موظف
          </Link>
          <Link
            to="/surveys"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            <MaterialIcon name="campaign" size={18} />
            تعميم جديد
          </Link>
        </div>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي الموظفين"
          value={ar(employees.length)}
          hint={`${ar(active)} نشط · ${ar(employees.length - active)} غير نشط`}
          icon="groups"
          tone="sky"
          to="/staff"
        />
        <StatCard
          label="نسبة الحضور اليوم"
          value={`${ar(todayRate)}٪`}
          hint={`${ar(days.at(-1)?.["متأخرون"] ?? 0)} متأخر · ${ar(active)} على الدوام`}
          icon="how_to_reg"
          tone="teal"
        />
        <StatCard
          label="طلبات وأجازات معلّقة"
          value={ar(pendingRequests + pendingLeaves)}
          hint={`${ar(pendingRequests)} طلب · ${ar(pendingLeaves)} أجازة`}
          icon="pending_actions"
          tone="cyan"
          to="/request-notifications"
        />
        <StatCard
          label="تكلفة الرواتب الشهرية"
          value={money(payroll)}
          hint={`سلف قائمة: ${money(loansOutstanding)}`}
          icon="payments"
          tone="indigo"
          to="/payroll"
        />
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel title="اتجاه الحضور اليومي" icon="monitoring" className="xl:col-span-2" badge={`${ar(todayRate)}٪ اليوم`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--sky)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--sky)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 700 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 700 }} stroke="var(--muted-foreground)" />
                <Tooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="نسبة_الحضور"
                  stroke="var(--sky)"
                  strokeWidth={3}
                  fill="url(#att)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="توزيع الموظفين على الأقسام" icon="donut_large" badge={`${ar(depts.length)} أقسام`}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={depts} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                  {depts.map((d, i) => (
                    <Cell key={d.name} fill={palette[i % palette.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5">
            {depts.map((d, i) => (
              <li key={d.name} className="flex items-center gap-2 text-[12px] font-bold">
                <span className="size-2.5 rounded-full" style={{ background: palette[i % palette.length] }} />
                {d.name}
                <span className="ms-auto text-muted-foreground">{ar(d.value)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="الطلبات حسب النوع" icon="assignment" badge={`${ar(requests.length)} طلب`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reqTypes} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 11, fontWeight: 700, textAnchor: "end" }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="عدد" fill="var(--cyan)" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="مسيرات الرواتب" icon="account_balance_wallet" className="xl:col-span-2" badge={`${ar(runs.length)} مسير`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runTrend}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 10, fontWeight: 700 }} stroke="var(--muted-foreground)" />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="الصافي" stroke="var(--teal)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="الاستقطاعات" stroke="var(--indigo)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="أحدث الطلبات" icon="inbox" className="xl:col-span-2">
          <ul className="divide-y divide-border">
            {requests.slice(0, 6).map((r: Row) => (
              <li key={String(r["id"])} className="flex flex-wrap items-center gap-3 py-3">
                <span className="grid size-9 place-items-center rounded-full bg-secondary text-[12px] font-bold text-primary">
                  {String(r["employee_name"] ?? "؟").charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold">{String(r["employee_name"])}</span>
                  <span className="block text-[11px] font-semibold text-muted-foreground">
                    {String(r["request_type"])}
                  </span>
                </span>
                <span className="ms-auto rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                  {String(r["status"])}
                </span>
              </li>
            ))}
            {requests.length === 0 && (
              <li className="py-8 text-center text-sm font-semibold text-muted-foreground">لا توجد طلبات</li>
            )}
          </ul>
        </Panel>

        <div className="grid gap-4">
          <Panel title="عقود قريبة الانتهاء" icon="event_busy">
            <ul className="space-y-2.5">
              {upcomingContracts.map((e) => (
                <li key={String(e["id"])} className="flex items-center gap-2 text-[12px] font-bold">
                  <MaterialIcon name="description" size={16} className="text-cyan" />
                  {String(e["full_name"])}
                  <span className="ms-auto text-muted-foreground">{String(e["contract_end"])}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="أحدث التعميمات" icon="campaign">
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li key={String(a["id"])}>
                  <p className="text-[12px] font-extrabold">{String(a["title"])}</p>
                  <p className="line-clamp-2 text-[11px] font-semibold text-muted-foreground">{String(a["body"] ?? "")}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
