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

export const Route = createFileRoute("/reports/absence-days-list")({
  head: () => ({ meta: [{ title: "تقرير الغياب بالأيام | تقارير البصمة" }] }),
  component: AbsenceDaysListReport,
});

const WEEKDAY_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
function weekdayAr(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : WEEKDAY_AR[d.getDay()];
}
function hijriIso(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

const columns: ColumnDef<Row>[] = [
  { key: "employee_name", label: "اسم الموظف" },
  { key: "work_date", label: "تاريخ الغياب", align: "left" },
  { key: "weekday", label: "اليوم", render: (r) => <span>{weekdayAr(String(r["work_date"] ?? ""))}</span> },
  { key: "hijri", label: "التاريخ هجري", align: "left", render: (r) => <span dir="ltr">{hijriIso(String(r["work_date"] ?? ""))}</span> },
  { key: "absence_type", label: "حالة الغياب", render: () => <Chip label="غياب بدون عذر" tone="muted" /> },
];

function AbsenceDaysListReport() {
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
      <ReportPageHeader icon="event_busy" title="تقرير الغياب بالأيام" trail={["التقارير", "تقارير البصمة", "الغياب بالأيام"]} />
      <FilterCard
        fields={["branch", "department", "status", "jobTitle", "sector", "gender", "employee", "from", "to"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); }}
      />
      {!applied ? <EmptySearchState /> : <ResultTable columns={columns} rows={rows} isLoading={query.isLoading} csvName="absence-days-list" />}
    </AppShell>
  );
}
