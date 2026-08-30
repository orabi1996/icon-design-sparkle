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

export const Route = createFileRoute("/reports/exceptions")({
  head: () => ({ meta: [{ title: "تقرير استثناءات الحضور والانصراف | تقارير البصمة" }] }),
  component: ExceptionsReport,
});

const columns: ColumnDef<Row>[] = [
  { key: "emp_no", label: "الرقم الوظيفي" },
  { key: "employee_name", label: "اسم الموظف" },
  { key: "branch", label: "الفرع" },
  { key: "department", label: "القسم" },
  { key: "work_date", label: "التاريخ", align: "left" },
  {
    key: "exception",
    label: "نوع الاستثناء",
    render: (r) => {
      const noIn = !r["check_in"];
      const noOut = !r["check_out"] && r["check_in"];
      const late = Number(r["late_minutes"] ?? 0) > 0;
      const tag = noIn ? "غياب" : noOut ? "بدون انصراف" : late ? "متأخر" : "استثناء";
      const tone = noIn ? "muted" : noOut ? "amber" : "amber";
      return <Chip label={tag} tone={tone as "muted" | "amber"} />;
    },
  },
];

function ExceptionsReport() {
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
      // Exceptions: absent, missing check_out, late
      const abnormal = !r["check_in"] || !r["check_out"] || Number(r["late_minutes"] ?? 0) > 0;
      if (!abnormal) return false;
      if (applied["branch"] && r["branch"] !== applied["branch"]) return false;
      if (applied["department"] && r["department"] !== applied["department"]) return false;
      return true;
    });
  }, [query.data, applied]);

  return (
    <AppShell>
      <ReportPageHeader icon="report" title="تقرير استثناءات الحضور والانصراف" trail={["التقارير", "تقارير البصمة", "استثناءات الحضور والانصراف"]} />
      <FilterCard
        fields={["sector", "mainDept", "jobTitle", "department", "branch", "status", "employee", "from", "to"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); }}
      />
      {!applied ? <EmptySearchState /> : <ResultTable columns={columns} rows={rows} isLoading={query.isLoading} csvName="exceptions" />}
    </AppShell>
  );
}
