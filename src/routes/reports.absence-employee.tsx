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

export const Route = createFileRoute("/reports/absence-employee")({
  head: () => ({
    meta: [
      { title: "تقرير غياب الموظف | تقارير البصمة" },
      { name: "description", content: "قائمة أيام الغياب للموظفين مع فلاتر متعددة." },
    ],
  }),
  component: AbsenceEmployeeReport,
});

const columns: ColumnDef<Row>[] = [
  { key: "emp_no", label: "الرقم الوظيفي", render: (r) => <span className="font-bold text-primary">{String(r["emp_no"] ?? "—")}</span> },
  { key: "employee_name", label: "اسم الموظف" },
  { key: "branch", label: "الفرع" },
  { key: "department", label: "القسم" },
  { key: "work_date", label: "التاريخ", align: "left" },
  { key: "status", label: "حالة الغياب", render: (r) => <Chip label={String(r["status"] ?? "غائب")} tone="muted" /> },
];

function AbsenceEmployeeReport() {
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
      // Only rows without check-in count as absent
      if (r["check_in"]) return false;
      if (applied["branch"] && r["branch"] !== applied["branch"]) return false;
      if (applied["department"] && r["department"] !== applied["department"]) return false;
      if (applied["status"] && r["status"] !== applied["status"]) return false;
      const emp = String(applied["employee"] ?? "").trim();
      if (emp && !String(r["employee_name"] ?? "").includes(emp) && !String(r["emp_no"] ?? "").includes(emp)) return false;
      return true;
    });
  }, [query.data, applied]);

  return (
    <AppShell>
      <ReportPageHeader icon="person_off" title="تقرير غياب الموظف" trail={["التقارير", "تقارير البصمة", "تقرير غياب الموظف"]} />
      <FilterCard
        fields={["branch", "department", "status", "jobTitle", "jobLevel", "gender", "employee", "from", "to", "absenceType", "showInFingerprint"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); }}
      />
      {!applied ? <EmptySearchState /> : <ResultTable columns={columns} rows={rows} isLoading={query.isLoading} csvName="absence-employee" />}
    </AppShell>
  );
}
