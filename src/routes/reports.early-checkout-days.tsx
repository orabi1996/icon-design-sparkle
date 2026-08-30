import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import {
  FilterCard,
  ResultTable,
  ReportPageHeader,
  EmptySearchState,
  dateHelpers,
  type FilterState,
  type ColumnDef,
} from "@/components/hr/AttendanceReportShell";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/early-checkout-days")({
  head: () => ({ meta: [{ title: "تقرير الانصراف المبكر بالأيام | تقارير البصمة" }] }),
  component: EarlyCheckoutDaysReport,
});

const DEFAULT_CHECKOUT = "16:00:00";

function fmtTime(v: unknown) {
  if (!v) return "—";
  const s = String(v);
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(11, 19);
  } catch {
    /* fall through */
  }
  return s.length >= 8 ? s.slice(-8) : s;
}

function earlyMinutes(checkoutIso: unknown, defaultOut = DEFAULT_CHECKOUT) {
  if (!checkoutIso) return 0;
  try {
    const actual = new Date(String(checkoutIso));
    const [dh, dm, ds] = defaultOut.split(":").map(Number);
    const def = new Date(actual);
    def.setHours(dh || 0, dm || 0, ds || 0, 0);
    const diff = Math.round((def.getTime() - actual.getTime()) / 60000);
    return diff > 0 ? diff : 0;
  } catch {
    return 0;
  }
}

function hoursLabel(minutes: number) {
  return `${(minutes / 60).toFixed(2)} س`;
}

const SUBTOTAL = "__subtotal";

const columns: ColumnDef<Row>[] = [
  {
    key: "employee_name",
    label: "إسم الموظف",
    render: (r) =>
      r[SUBTOTAL] ? (
        <span className="font-extrabold text-primary">إجمالي الموظف</span>
      ) : (
        String(r["employee_name"] ?? "—")
      ),
  },
  {
    key: "work_date",
    label: "التاريخ",
    align: "left",
    render: (r) =>
      r[SUBTOTAL] ? (
        <span className="font-mono font-extrabold text-primary">{String(r["days_count"] ?? 0)} يوم</span>
      ) : (
        <span className="font-mono">{String(r["work_date"] ?? "—")}</span>
      ),
  },
  {
    key: "default_out",
    label: "وقت الخروج الافتراضي",
    align: "left",
    render: (r) => (r[SUBTOTAL] ? "" : <span dir="ltr" className="font-mono">{DEFAULT_CHECKOUT}</span>),
  },
  {
    key: "check_out",
    label: "وقت الخروج",
    align: "left",
    render: (r) =>
      r[SUBTOTAL] ? "" : (
        <span dir="ltr" className="font-mono">
          {fmtTime(r["check_out"])}
        </span>
      ),
  },
  {
    key: "early_minutes",
    label: "دقائق الانصراف المبكر",
    align: "left",
    render: (r) => (
      <span className={`font-mono ${r[SUBTOTAL] ? "font-extrabold text-primary" : "font-bold text-rose-700"}`}>
        {String(r["early_minutes"] ?? 0)}
      </span>
    ),
  },
  {
    key: "total",
    label: "إجمالي الانصراف المبكر",
    align: "left",
    render: (r) => (
      <span className={`font-mono ${r[SUBTOTAL] ? "font-extrabold text-primary" : "font-bold text-rose-700"}`}>
        {hoursLabel(Number(r["early_minutes"] ?? 0))}
      </span>
    ),
  },
];

function EarlyCheckoutDaysReport() {
  const [f, setF] = useState<FilterState>({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() });
  const [applied, setApplied] = useState<FilterState | null>(null);

  const query = useRows("attendance_records", {
    orderBy: "work_date",
    rangeColumn: "work_date",
    ...(applied?.["from"] ? { from: String(applied["from"]) } : {}),
    ...(applied?.["to"] ? { to: String(applied["to"]) } : {}),
  });

  const rows = useMemo(() => {
    if (!applied) return [];
    const filtered = (query.data ?? [])
      .map((r) => ({ ...r, early_minutes: earlyMinutes(r["check_out"]) }) as Row)
      .filter((r) => {
        if (Number(r["early_minutes"] ?? 0) <= 0) return false;
        if (applied["branch"] && r["branch"] !== applied["branch"]) return false;
        if (applied["department"] && r["department"] !== applied["department"]) return false;
        if (applied["status"] && r["status"] !== applied["status"]) return false;
        if (applied["jobTitle"] && r["job_title"] !== applied["jobTitle"]) return false;
        if (applied["jobLevel"] && r["job_level"] !== applied["jobLevel"]) return false;
        if (applied["sector"] && r["sector"] !== applied["sector"]) return false;
        if (applied["path"] && r["path"] !== applied["path"]) return false;
        if (applied["specialization"] && r["specialization"] !== applied["specialization"]) return false;
        if (applied["gender"] && r["gender"] !== applied["gender"]) return false;
        const emp = String(applied["employee"] ?? "").trim();
        if (emp && !String(r["employee_name"] ?? "").includes(emp) && !String(r["emp_no"] ?? "").includes(emp)) return false;
        return true;
      });

    // Group by employee and inject a subtotal row after each employee block
    const groups = new Map<string, Row[]>();
    for (const r of filtered) {
      const key = String(r["emp_no"] ?? r["employee_name"] ?? "—");
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(r);
    }

    const out: Row[] = [];
    for (const [key, list] of groups) {
      list.sort((a, b) => String(a["work_date"] ?? "").localeCompare(String(b["work_date"] ?? "")));
      out.push(...list);
      const totalMinutes = list.reduce((s, r) => s + Number(r["early_minutes"] ?? 0), 0);
      out.push({
        id: `subtotal-${key}`,
        [SUBTOTAL]: true,
        days_count: list.length,
        early_minutes: totalMinutes,
      } as Row);
    }
    return out;
  }, [query.data, applied]);

  return (
    <AppShell>
      <ReportPageHeader icon="logout" title="تقرير الانصراف المبكر بالأيام" trail={["التقارير", "تقارير البصمة", "الانصراف المبكر بالأيام"]} />
      <FilterCard
        fields={["branch", "department", "status", "jobTitle", "specialization", "gender", "jobLevel", "sector", "path", "employee", "from", "to", "showInFingerprint"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); }}
      />
      {!applied ? (
        <EmptySearchState />
      ) : (
        <ResultTable columns={columns} rows={rows} isLoading={query.isLoading} csvName="early-checkout-days" />
      )}
    </AppShell>
  );
}
