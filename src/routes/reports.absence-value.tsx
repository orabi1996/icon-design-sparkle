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

export const Route = createFileRoute("/reports/absence-value")({
  head: () => ({ meta: [{ title: "تفاصيل قيمة الغياب للموظف | تقارير البصمة" }] }),
  component: AbsenceValueReport,
});

const columns: ColumnDef<Row>[] = [
  { key: "emp_no", label: "الرقم الوظيفي" },
  { key: "employee_name", label: "اسم الموظف" },
  { key: "absent_days", label: "أيام الغياب" },
  { key: "daily_salary", label: "قيمة اليوم (ر.س)", align: "left" },
  { key: "value", label: "قيمة الاستقطاع (ر.س)", align: "left", render: (r) => <span className="font-bold text-rose-700">{new Intl.NumberFormat("ar-SA").format(Number(r["value"] ?? 0))}</span> },
];

function AbsenceValueReport() {
  const [f, setF] = useState<FilterState>({ year: String(new Date().getFullYear()), month: String(new Date().getMonth() + 1).padStart(2, "0") });
  const [applied, setApplied] = useState<FilterState | null>(null);

  const { data: attendance = [], isLoading } = useRows("attendance_records", { orderBy: "work_date" });
  const { data: employees = [] } = useRows("employees", { orderBy: "full_name" });

  const rows = useMemo(() => {
    if (!applied) return [];
    const y = String(applied["year"] ?? "");
    const m = String(applied["month"] ?? "");
    const prefix = y && m ? `${y}-${m}` : "";
    // Group absences per employee
    const byEmp = new Map<string, { emp_no: string; employee_name: string; branch: string; department: string; count: number }>();
    for (const r of attendance) {
      if (r["check_in"]) continue;
      const wd = String(r["work_date"] ?? "");
      if (prefix && !wd.startsWith(prefix)) continue;
      const key = String(r["employee_id"] ?? r["employee_name"] ?? "");
      const cur = byEmp.get(key) ?? {
        emp_no: String(r["emp_no"] ?? ""),
        employee_name: String(r["employee_name"] ?? ""),
        branch: String(r["branch"] ?? ""),
        department: String(r["department"] ?? ""),
        count: 0,
      };
      cur.count += 1;
      byEmp.set(key, cur);
    }
    return Array.from(byEmp.values()).map((g) => {
      const emp = employees.find((e) => e["emp_no"] === g.emp_no);
      const basic = Number(emp?.["basic_salary"] ?? 0);
      const allowances = Number(emp?.["allowances"] ?? 0);
      const daily = ((basic + allowances) / 30) || 0;
      return {
        id: g.emp_no,
        emp_no: g.emp_no,
        employee_name: g.employee_name,
        branch: g.branch,
        department: g.department,
        absent_days: g.count,
        daily_salary: daily.toFixed(2),
        value: (daily * g.count).toFixed(2),
      } as Row;
    }).filter((r) => {
      if (applied["branch"] && r["branch"] !== applied["branch"]) return false;
      if (applied["department"] && r["department"] !== applied["department"]) return false;
      const emp = String(applied["employee"] ?? "").trim();
      if (emp && !String(r["employee_name"] ?? "").includes(emp) && !String(r["emp_no"] ?? "").includes(emp)) return false;
      return true;
    });
  }, [attendance, employees, applied]);

  return (
    <AppShell>
      <ReportPageHeader icon="request_quote" title="تفاصيل قيمة الغياب للموظف" trail={["التقارير", "تقارير البصمة", "تفاصيل قيمة الغياب للموظف"]} />
      <FilterCard
        fields={["branch", "department", "status", "jobTitle", "specialization", "sponsor", "jobLevel", "gender", "employee", "year", "month", "showInFingerprint"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({}); setApplied(null); }}
      />
      {!applied ? <EmptySearchState /> : <ResultTable columns={columns} rows={rows} isLoading={isLoading} csvName="absence-value" />}
    </AppShell>
  );
}
