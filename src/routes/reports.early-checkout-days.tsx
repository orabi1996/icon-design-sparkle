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

const DEFAULT_CHECKOUT = "17:00:00";

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

const columns: ColumnDef<Row>[] = [
  { key: "employee_name", label: "إسم الموظف" },
  { key: "work_date", label: "التاريخ", align: "left" },
  { key: "default_out", label: "وقت الخروج الافتراضي", align: "left", render: () => <span dir="ltr" className="font-mono">{DEFAULT_CHECKOUT}</span> },
  { key: "check_out", label: "وقت الخروج", align: "left", render: (r) => <span dir="ltr" className="font-mono">{fmtTime(r["check_out"])}</span> },
  {
    key: "early_minutes",
    label: "دقائق الانصراف المبكر",
    align: "left",
    render: (r) => (
      <span className="font-mono font-bold text-rose-700">
        {String(r["early_minutes"] ?? 0)}
      </span>
    ),
  },
  {
    key: "total",
    label: "إجمالي الانصراف المبكر",
    align: "left",
    render: (r) => (
      <span className="font-mono font-bold text-rose-700">
        {(Number(r["early_minutes"] ?? 0) / 60).toFixed(2)} س
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
    return (query.data ?? [])
      .map((r) => ({ ...r, early_minutes: earlyMinutes(r["check_out"]) } as Row))
      .filter((r) => {
        if (Number(r["early_minutes"] ?? 0) <= 0) return false;
        if (applied["branch"] && r["branch"] !== applied["branch"]) return false;
        if (applied["department"] && r["department"] !== applied["department"]) return false;
        const emp = String(applied["employee"] ?? "").trim();
        if (emp && !String(r["employee_name"] ?? "").includes(emp) && !String(r["emp_no"] ?? "").includes(emp)) return false;
        return true;
      });
  }, [query.data, applied]);

  return (
    <AppShell>
      <ReportPageHeader icon="logout" title="تقرير الانصراف المبكر بالأيام" trail={["التقارير", "تقارير البصمة", "الانصراف المبكر بالأيام"]} />
      <FilterCard
        fields={["branch", "department", "status", "jobTitle", "specialization", "gender", "employee", "from", "to"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); }}
      />
      {!applied ? <EmptySearchState /> : <ResultTable columns={columns} rows={rows} isLoading={query.isLoading} csvName="early-checkout-days" />}
    </AppShell>
  );
}
