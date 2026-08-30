import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import {
  FilterCard,
  ResultTable,
  ReportPageHeader,
  EmptySearchState,
  type FilterState,
  type ColumnDef,
} from "@/components/hr/AttendanceReportShell";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/absence-monthly")({
  head: () => ({ meta: [{ title: "تقرير حصر الغياب بالأشهر | تقارير البصمة" }] }),
  component: AbsenceMonthlyReport,
});

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function AbsenceMonthlyReport() {
  const [f, setF] = useState<FilterState>({ year: String(new Date().getFullYear()) });
  const [applied, setApplied] = useState<FilterState | null>(null);

  const { data: attendance = [], isLoading } = useRows("attendance_records", { orderBy: "work_date" });
  const { data: employees = [] } = useRows("employees", { orderBy: "full_name" });

  const rows = useMemo(() => {
    if (!applied) return [];
    const year = String(applied["year"] ?? "");
    // Count absences per employee per month
    const byEmp = new Map<string, Row>();
    for (const emp of employees) {
      if (applied["branch"] && emp["branch"] !== applied["branch"]) continue;
      if (applied["department"] && emp["department"] !== applied["department"]) continue;
      const gender = emp["gender"] ?? "";
      const row: Row = {
        id: emp["id"],
        employee_name: emp["full_name"],
        branch: emp["branch"] ?? "",
        department: emp["department"] ?? "",
        emp_no: emp["emp_no"],
        nationality: emp["nationality"] ?? "",
        job_title: emp["job_title"] ?? "",
        hire_date: emp["hire_date"] ?? "",
        gender,
      };
      for (let m = 1; m <= 12; m++) row[`m${m}`] = 0;
      byEmp.set(String(emp["id"]), row);
    }
    for (const r of attendance) {
      if (r["check_in"]) continue;
      const wd = String(r["work_date"] ?? "");
      if (year && !wd.startsWith(year)) continue;
      const monthIdx = Number(wd.slice(5, 7));
      if (!monthIdx) continue;
      const key = String(r["employee_id"] ?? "");
      const emp = byEmp.get(key);
      if (emp) emp[`m${monthIdx}`] = (emp[`m${monthIdx}`] as number) + 1;
    }
    return Array.from(byEmp.values()).filter((r) => {
      for (let m = 1; m <= 12; m++) if ((r[`m${m}`] as number) > 0) return true;
      return false;
    });
  }, [attendance, employees, applied]);

  const columns: ColumnDef<Row>[] = [
    { key: "employee_name", label: "اسم الموظف" },
    { key: "branch", label: "الفروع" },
    { key: "department", label: "القسم" },
    { key: "emp_no", label: "الرقم الوظيفي" },
    { key: "nationality", label: "الجنسية" },
    { key: "job_title", label: "الفئة الوظيفية" },
    { key: "hire_date", label: "تاريخ التعيين", align: "left" },
    { key: "gender", label: "الجنس" },
    ...MONTHS_AR.map((mLabel, i) => ({
      key: `m${i + 1}`,
      label: mLabel,
      align: "left" as const,
      render: (r: Row) => {
        const v = Number(r[`m${i + 1}`] ?? 0);
        return v > 0 ? (
          <span className="rounded-md bg-rose-100 px-2 py-0.5 font-mono text-[11.5px] font-bold text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">
            {v}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    })),
  ];

  return (
    <AppShell>
      <ReportPageHeader icon="calendar_month" title="تقرير حصر الغياب بالأشهر" trail={["التقارير", "تقارير البصمة", "حصر الغياب بالأشهر"]} />
      <FilterCard
        fields={["branch", "department", "sector", "jobCategory", "path", "gender", "year"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ year: String(new Date().getFullYear()) }); setApplied(null); }}
      />
      {!applied ? <EmptySearchState hint="عدد أيام الغياب لكل شهر خلال السنة المختارة" /> : <ResultTable columns={columns} rows={rows} isLoading={isLoading} csvName="absence-monthly" title="حصر الغياب الشهري" />}
    </AppShell>
  );
}
