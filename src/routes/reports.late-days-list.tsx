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

export const Route = createFileRoute("/reports/late-days-list")({
  head: () => ({ meta: [{ title: "تقرير التأخير بالأيام | تقارير البصمة" }] }),
  component: LateDaysListReport,
});

const WEEKDAY_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const columns: ColumnDef<Row>[] = [
  { key: "employee_name", label: "موظف" },
  { key: "work_date", label: "التاريخ", align: "left" },
  {
    key: "weekday",
    label: "يوم",
    render: (r) => {
      const d = new Date(String(r["work_date"] ?? ""));
      return <span>{Number.isNaN(d.getTime()) ? "—" : WEEKDAY_AR[d.getDay()]}</span>;
    },
  },
  { key: "department", label: "القسم" },
  {
    key: "late_minutes",
    label: "دقائق التأخير",
    align: "left",
    render: (r) => (
      <span className="font-mono font-bold text-amber-700">
        {String(r["late_minutes"] ?? 0)}
      </span>
    ),
  },
];

function LateDaysListReport() {
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
    return (query.data ?? []).filter((r) => {
      if (Number(r["late_minutes"] ?? 0) <= 0) return false;
      if (applied["branch"] && r["branch"] !== applied["branch"]) return false;
      if (applied["department"] && r["department"] !== applied["department"]) return false;
      const emp = String(applied["employee"] ?? "").trim();
      if (emp && !String(r["employee_name"] ?? "").includes(emp) && !String(r["emp_no"] ?? "").includes(emp)) return false;
      return true;
    });
  }, [query.data, applied]);

  return (
    <AppShell>
      <ReportPageHeader icon="watch_later" title="تقرير التأخير بالأيام" trail={["التقارير", "تقارير البصمة", "التأخير بالأيام"]} />
      <FilterCard
        fields={["branch", "department", "status", "jobTitle", "specialization", "gender", "employee", "from", "to"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); }}
      />
      {!applied ? <EmptySearchState /> : <ResultTable columns={columns} rows={rows} isLoading={query.isLoading} csvName="late-days-list" />}
    </AppShell>
  );
}
