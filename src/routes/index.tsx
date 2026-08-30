import { useMemo, useState } from "react";
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

const palette = [
  "#0b57d0",
  "#00639b",
  "#137333",
  "#b06000",
  "#6750a4",
  "#ba1a1a",
];

const tones: Record<string, { bg: string; text: string; bar: string }> = {
  sky: { bg: "bg-[#e8f0fe]", text: "text-[#0b57d0]", bar: "bg-[#0b57d0]" },
  teal: { bg: "bg-[#e6f4ea]", text: "text-[#137333]", bar: "bg-[#137333]" },
  cyan: { bg: "bg-[#fef7e0]", text: "text-[#b06000]", bar: "bg-[#b06000]" },
  indigo: { bg: "bg-[#f3e8fd]", text: "text-[#6750a4]", bar: "bg-[#6750a4]" },
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
  const currentTone = tones[tone] ?? tones.sky;
  const body = (
    <article
      className="group relative h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(60,64,67,0.08),0_4px_12px_0_rgba(60,64,67,0.06)] transition-all hover:shadow-[0_4px_16px_0_rgba(60,64,67,0.12)] hover:-translate-y-0.5"
    >
      <span className={`absolute inset-x-0 top-0 h-1.5 ${currentTone.bar}`} />
      <span className={`grid size-12 place-items-center rounded-2xl ${currentTone.bg} ${currentTone.text} shadow-2xs`}>
        <MaterialIcon name={icon} size={24} filled />
      </span>
      <p className="mt-4 text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-900 font-mono">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium text-slate-400">{hint}</p>
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
      className={`rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_0_rgba(60,64,67,0.08),0_4px_12px_0_rgba(60,64,67,0.06)] ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <h3 className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
          <span className="grid size-8 place-items-center rounded-full bg-[#e8f0fe] text-[#0b57d0]">
            <MaterialIcon name={icon} size={18} filled />
          </span>
          {title}
        </h3>
        {badge && (
          <span className="rounded-full bg-[#e8f0fe] px-3 py-1 text-[11px] font-bold text-[#0b57d0]">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: 16,
    border: "1px solid #c4c7c5",
    background: "#ffffff",
    boxShadow: "0 4px 16px 0 rgba(0,0,0,0.12)",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 700,
    direction: "rtl" as const,
  },
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const shift = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return iso(d);
};

const presets = [
  { key: "7", label: "٧ أيام", days: 7 },
  { key: "30", label: "٣٠ يوم", days: 30 },
  { key: "90", label: "٩٠ يوم", days: 90 },
  { key: "365", label: "سنة", days: 365 },
];

function RangeFilter({
  preset,
  from,
  to,
  onPreset,
  onFrom,
  onTo,
}: {
  preset: string;
  from: string;
  to: string;
  onPreset: (k: string) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  const input =
    "h-8.5 rounded-full border border-slate-300 bg-white px-3 text-[11px] font-bold text-slate-700 outline-none focus:border-[#0b57d0]";
  return (
    <section
      className="mt-4 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_3px_0_rgba(60,64,67,0.08)]"
    >
      <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
        <MaterialIcon name="date_range" size={18} className="text-[#0b57d0]" filled />
        نطاق الفترة
      </span>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => onPreset(p.key)}
            className={`rounded-full px-3.5 py-1 text-[11px] font-bold transition-all ${
              preset === p.key
                ? "bg-[#0b57d0] text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-[#e8f0fe] hover:text-[#0b57d0]"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => onPreset("custom")}
          className={`rounded-full px-3.5 py-1 text-[11px] font-bold transition-all ${
            preset === "custom"
              ? "bg-[#0b57d0] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-[#e8f0fe] hover:text-[#0b57d0]"
          }`}
        >
          مخصص
        </button>
      </div>
      <div className="ms-auto flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
          من
          <input
            type="date"
            className={input}
            value={from}
            onChange={(e) => onFrom(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
          إلى
          <input type="date" className={input} value={to} onChange={(e) => onTo(e.target.value)} />
        </label>
      </div>
    </section>
  );
}

function Dashboard() {
  const [preset, setPreset] = useState("30");
  const [from, setFrom] = useState(() => shift(30));
  const [to, setTo] = useState(() => iso(new Date()));

  const applyPreset = (k: string) => {
    setPreset(k);
    const p = presets.find((x) => x.key === k);
    if (p) {
      setFrom(shift(p.days));
      setTo(iso(new Date()));
    }
  };
  const setFromCustom = (v: string) => {
    setPreset("custom");
    setFrom(v);
  };
  const setToCustom = (v: string) => {
    setPreset("custom");
    setTo(v);
  };

  const rangeLabel = `${from} — ${to}`;

  const employees = useRows("employees", { orderBy: "emp_no", ascending: true }).data ?? [];
  const attendance =
    useRows("attendance_records", {
      orderBy: "work_date",
      ascending: true,
      limit: 5000,
      rangeColumn: "work_date",
      from,
      to,
    }).data ?? [];
  const requests = useRows("requests", { from, to }).data ?? [];
  const leaves = useRows("leave_requests", { rangeColumn: "from_date", from, to }).data ?? [];
  const loans = useRows("loans").data ?? [];
  const runs = useRows("payroll_runs", { orderBy: "month", ascending: true, from, to }).data ?? [];
  const announcements = useRows("announcements", { limit: 4, from, to }).data ?? [];

  const active = employees.filter((e) => e["status"] === "نشط").length;
  const payroll = employees.reduce(
    (s, e) => s + Number(e["basic_salary"] ?? 0) + Number(e["allowances"] ?? 0),
    0,
  );
  const pendingRequests = requests.filter((r) =>
    ["جديد", "قيد المعالجة"].includes(String(r["status"])),
  ).length;
  const pendingLeaves = leaves.filter((l) => l["status"] === "بانتظار الموافقة").length;
  const openLoans = loans.filter((l) => l["status"] === "قيد السداد");
  const loansOutstanding = openLoans.reduce(
    (s, l) => s + (Number(l["amount"] ?? 0) - Number(l["paid_amount"] ?? 0)),
    0,
  );

  // Attendance trend across the selected range
  const { days, avgRate, lateTotal, absentTotal } = useMemo(() => {
    const byDay = new Map<
      string,
      { present: number; total: number; late: number; absent: number }
    >();
    for (const a of attendance) {
      const d = String(a["work_date"]);
      const cur = byDay.get(d) ?? { present: 0, total: 0, late: 0, absent: 0 };
      cur.total += 1;
      if (a["status"] !== "غائب") cur.present += 1;
      if (a["status"] === "متأخر") cur.late += 1;
      if (a["status"] === "غائب") cur.absent += 1;
      byDay.set(d, cur);
    }
    const entries = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const list = entries.map(([d, v]) => ({
      day: d.slice(5).replace("-", "/"),
      نسبة_الحضور: Math.round((v.present / Math.max(v.total, 1)) * 100),
      متأخرون: v.late,
      غائبون: v.absent,
    }));
    const rate = list.length
      ? Math.round(list.reduce((s, x) => s + x["نسبة_الحضور"], 0) / list.length)
      : 0;
    return {
      days: list,
      avgRate: rate,
      lateTotal: entries.reduce((s, [, v]) => s + v.late, 0),
      absentTotal: entries.reduce((s, [, v]) => s + v.absent, 0),
    };
  }, [attendance]);

  const deptMap = new Map<string, number>();
  for (const e of employees)
    deptMap.set(
      String(e["department"] ?? "غير محدد"),
      (deptMap.get(String(e["department"] ?? "غير محدد")) ?? 0) + 1,
    );
  const depts = [...deptMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const reqMap = new Map<string, number>();
  for (const r of requests)
    reqMap.set(String(r["request_type"]), (reqMap.get(String(r["request_type"])) ?? 0) + 1);
  const reqTypes = [...reqMap.entries()]
    .map(([name, عدد]) => ({ name, عدد }))
    .sort((a, b) => b["عدد"] - a["عدد"]);

  const runTrend = runs.map((r) => ({
    name: `${r["month"]}/${r["year"]}`,
    الصافي: Number(r["total_net"] ?? 0),
    الاستقطاعات: Number(r["total_deductions"] ?? 0),
  }));

  const upcomingContracts = employees
    .filter((e) => e["contract_end"])
    .sort((a, b) => String(a["contract_end"]).localeCompare(String(b["contract_end"])))
    .slice(0, 5);

  const leaveDays = leaves.reduce((s, l) => s + Number(l["days"] ?? 0), 0);
  const runsNet = runs.reduce((s, r) => s + Number(r["total_net"] ?? 0), 0);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <MaterialIcon name="calendar_today" size={14} />
            {new Date().toLocaleDateString("ar-SA", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            · بيانات مباشرة
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
            لوحة معلومات الموارد البشرية
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/staff/add"
            className="flex items-center gap-2 rounded-full bg-[#0b57d0] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0842a0] hover:shadow-md active:scale-95"
          >
            <MaterialIcon name="person_add" size={18} />
            <span>إضافة موظف جديد</span>
          </Link>
          <Link
            to="/surveys"
            className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-[#0b57d0] active:scale-95"
          >
            <MaterialIcon name="campaign" size={18} />
            <span>إنشاء تعميم إداري</span>
          </Link>
        </div>
      </div>

      <RangeFilter
        preset={preset}
        from={from}
        to={to}
        onPreset={applyPreset}
        onFrom={setFromCustom}
        onTo={setToCustom}
      />

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي الموظفين"
          value={ar(employees.length)}
          hint={`${ar(active)} نشط · ${ar(employees.length - active)} غير نشط`}
          icon="groups"
          tone="sky"
          to="/staff"
        />
        <StatCard
          label="متوسط نسبة الحضور"
          value={`${ar(avgRate)}٪`}
          hint={`${ar(lateTotal)} تأخير · ${ar(absentTotal)} غياب خلال الفترة`}
          icon="how_to_reg"
          tone="teal"
        />
        <StatCard
          label="طلبات وأجازات معلّقة"
          value={ar(pendingRequests + pendingLeaves)}
          hint={`${ar(pendingRequests)} طلب · ${ar(pendingLeaves)} أجازة · ${ar(leaveDays)} يوم`}
          icon="pending_actions"
          tone="cyan"
          to="/request-notifications"
        />
        <StatCard
          label="تكلفة الرواتب الشهرية"
          value={money(payroll)}
          hint={`صافي مسيرات الفترة: ${money(runsNet)} · سلف قائمة: ${money(loansOutstanding)}`}
          icon="payments"
          tone="indigo"
          to="/payroll"
        />
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel
          title="اتجاه الحضور اليومي"
          icon="monitoring"
          className="xl:col-span-2"
          badge={rangeLabel}
        >
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
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="نسبة_الحضور"
                  stroke="var(--sky)"
                  strokeWidth={3}
                  fill="url(#att)"
                />
                <Line
                  type="monotone"
                  dataKey="متأخرون"
                  stroke="var(--indigo)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {days.length === 0 && (
            <p className="mt-2 text-center text-sm font-semibold text-muted-foreground">
              لا توجد بيانات حضور في هذه الفترة
            </p>
          )}
        </Panel>

        <Panel
          title="توزيع الموظفين على الأقسام"
          icon="donut_large"
          badge={`${ar(depts.length)} أقسام`}
        >
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={depts}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                >
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
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: palette[i % palette.length] }}
                />
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
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fontWeight: 700 }}
                />
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

        <Panel
          title="مسيرات الرواتب"
          icon="account_balance_wallet"
          className="xl:col-span-2"
          badge={`${ar(runs.length)} مسير`}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runTrend}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  stroke="var(--muted-foreground)"
                />
                <YAxis tick={{ fontSize: 10, fontWeight: 700 }} stroke="var(--muted-foreground)" />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="الصافي"
                  stroke="var(--teal)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="الاستقطاعات"
                  stroke="var(--indigo)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
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
              <li className="py-8 text-center text-sm font-semibold text-muted-foreground">
                لا توجد طلبات
              </li>
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
                  <p className="line-clamp-2 text-[11px] font-semibold text-muted-foreground">
                    {String(a["body"] ?? "")}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
