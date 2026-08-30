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

export const Route = createFileRoute("/reports/late-minutes")({
  head: () => ({ meta: [{ title: "تقرير عدد الدقائق وساعات التأخير | تقارير البصمة" }] }),
  component: LateMinutesReport,
});

const columns: ColumnDef<Row>[] = [
  { key: "seq", label: "م", render: (_r, i) => <span className="text-muted-foreground">{i + 1}</span> },
  { key: "employee_name", label: "إسم الموظف" },
  { key: "days", label: "عدد الأيام" },
  { key: "status", label: "الحالة" },
  {
    key: "total_minutes",
    label: "مجموع دقائق التأخير",
    align: "left",
    render: (r) => <span className="font-mono font-bold text-amber-700">{new Intl.NumberFormat("ar-SA").format(Number(r["total_minutes"] ?? 0))}</span>,
  },
  {
    key: "hours",
    label: "ساعات التأخير",
    align: "left",
    render: (r) => {
      const m = Number(r["total_minutes"] ?? 0);
      return <span className="font-mono font-bold text-amber-700">{(m / 60).toFixed(2)}</span>;
    },
  },
];

function LateMinutesReport() {
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
    const byEmp = new Map<string, { employee_name: string; status: string; branch: string; department: string; days: number; total_minutes: number }>();
    for (const r of query.data ?? []) {
      const late = Number(r["late_minutes"] ?? 0);
      if (late <= 0) continue;
      if (applied["branch"] && r["branch"] !== applied["branch"]) continue;
      if (applied["department"] && r["department"] !== applied["department"]) continue;
      const key = String(r["employee_id"] ?? r["employee_name"] ?? "");
      const cur = byEmp.get(key) ?? {
        employee_name: String(r["employee_name"] ?? ""),
        status: String(r["status"] ?? "نشط"),
        branch: String(r["branch"] ?? ""),
        department: String(r["department"] ?? ""),
        days: 0,
        total_minutes: 0,
      };
      cur.days += 1;
      cur.total_minutes += late;
      byEmp.set(key, cur);
    }
    return Array.from(byEmp.entries()).map(([id, v]) => ({ id, ...v } as Row));
  }, [query.data, applied]);

  return (
    <AppShell>
      <ReportPageHeader icon="schedule" title="تقرير عدد الدقائق وساعات التأخير" trail={["التقارير", "تقارير البصمة", "دقائق وساعات التأخير"]} />
      <FilterCard
        fields={["branch", "department", "status", "jobTitle", "specialization", "gender", "employee", "from", "to"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); }}
      />
      {!applied ? <EmptySearchState /> : <ResultTable columns={columns} rows={rows} isLoading={query.isLoading} csvName="late-minutes" />}
    </AppShell>
  );
}
