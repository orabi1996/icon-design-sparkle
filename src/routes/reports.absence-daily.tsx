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

export const Route = createFileRoute("/reports/absence-daily")({
  head: () => ({
    meta: [{ title: "تقرير الغياب اليومي | تقارير البصمة" }],
  }),
  component: AbsenceDailyReport,
});

const columns: ColumnDef<Row>[] = [
  { key: "emp_no", label: "الرقم الوظيفي" },
  { key: "employee_name", label: "اسم الموظف" },
  { key: "branch", label: "الفرع" },
  { key: "department", label: "القسم" },
  { key: "work_date", label: "التاريخ", align: "left" },
  { key: "status", label: "حالة الغياب", render: (r) => <Chip label={String(r["status"] ?? "غائب")} tone="muted" /> },
];

function AbsenceDailyReport() {
  const [f, setF] = useState<FilterState>({ date: dateHelpers.todayISO() });
  const [applied, setApplied] = useState<FilterState | null>(null);

  const date = applied?.["date"] ? String(applied["date"]) : "";
  const query = useRows("attendance_records", {
    orderBy: "employee_name",
    ascending: true,
    rangeColumn: "work_date",
    ...(date ? { from: date, to: date } : {}),
  });

  const rows = useMemo(() => {
    if (!applied) return [];
    return (query.data ?? []).filter((r) => {
      if (r["check_in"]) return false;
      if (applied["branch"] && r["branch"] !== applied["branch"]) return false;
      if (applied["department"] && r["department"] !== applied["department"]) return false;
      const emp = String(applied["employee"] ?? "").trim();
      if (emp && !String(r["employee_name"] ?? "").includes(emp) && !String(r["emp_no"] ?? "").includes(emp)) return false;
      return true;
    });
  }, [query.data, applied]);

  return (
    <AppShell>
      <ReportPageHeader icon="today" title="تقرير الغياب اليومي" trail={["التقارير", "تقارير البصمة", "تقرير الغياب اليومي"]} />
      <FilterCard
        fields={["branch", "department", "status", "jobTitle", "jobLevel", "gender", "employee", "date", "excludedFromFingerprint"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ date: dateHelpers.todayISO() }); setApplied(null); }}
      />
      {!applied ? <EmptySearchState /> : <ResultTable columns={columns} rows={rows} isLoading={query.isLoading} csvName="absence-daily" />}
    </AppShell>
  );
}
