import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { Chip } from "@/components/hr/ui";
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

export const Route = createFileRoute("/reports/absence-days-count")({
  head: () => ({ meta: [{ title: "تقرير عدد أيام الغياب | تقارير البصمة" }] }),
  component: AbsenceDaysCountReport,
});

const columns: ColumnDef<Row>[] = [
  { key: "seq", label: "المسلسل", render: (_r, i) => <span className="font-bold text-muted-foreground">{i + 1}</span> },
  { key: "employee_name", label: "إسم الموظف" },
  { key: "absence_type", label: "حالة الغياب", render: (r) => <Chip label={String(r["absence_type"] ?? "غياب")} tone="muted" /> },
  { key: "count", label: "عدد الغياب", render: (r) => <span className="font-bold text-primary">{String(r["count"] ?? 0)} يوم</span> },
  { key: "status", label: "الحالة" },
];

function AbsenceDaysCountReport() {
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
    const byEmp = new Map<string, { employee_name: string; status: string; branch: string; department: string; count: number }>();
    for (const r of query.data ?? []) {
      if (r["check_in"]) continue;
      if (applied["branch"] && r["branch"] !== applied["branch"]) continue;
      if (applied["department"] && r["department"] !== applied["department"]) continue;
      const key = String(r["employee_id"] ?? r["employee_name"] ?? "");
      const cur = byEmp.get(key) ?? {
        employee_name: String(r["employee_name"] ?? ""),
        status: String(r["status"] ?? "نشط"),
        branch: String(r["branch"] ?? ""),
        department: String(r["department"] ?? ""),
        count: 0,
      };
      cur.count += 1;
      byEmp.set(key, cur);
    }
    return Array.from(byEmp.entries()).map(([id, v]) => ({
      id,
      employee_name: v.employee_name,
      absence_type: "غياب بدون عذر",
      count: v.count,
      status: v.status,
    } as Row));
  }, [query.data, applied]);

  return (
    <AppShell>
      <ReportPageHeader icon="event_busy" title="تقرير عدد أيام الغياب" trail={["التقارير", "تقارير البصمة", "عدد أيام الغياب"]} />
      <FilterCard
        fields={["branch", "department", "gender", "employee", "from", "to"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); }}
      />
      {!applied ? <EmptySearchState /> : <ResultTable columns={columns} rows={rows} isLoading={query.isLoading} csvName="absence-days-count" />}
    </AppShell>
  );
}
