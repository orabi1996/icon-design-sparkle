import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import {
  FilterCard,
  ReportPageHeader,
  EmptySearchState,
  type FilterState,
} from "@/components/hr/AttendanceReportShell";
import {
  ReportDocumentViewer,
  EmployeeReportCard,
  ReportStandardTable,
  type ExportData,
} from "@/components/hr/ReportDocumentViewer";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/absence-value")({
  head: () => ({
    meta: [
      { title: "تفاصيل قيمة الغياب للموظف | تقارير البصمة" },
      { name: "description", content: "تقرير احتساب مبالغ واستقطاعات الغياب للموظفين مع تفاصيل الأيام والقيمة المالية." },
    ],
  }),
  component: AbsenceValueReport,
});

function AbsenceValueReport() {
  const [f, setF] = useState<FilterState>({
    year: String(new Date().getFullYear()),
    month: String(new Date().getMonth() + 1).padStart(2, "0"),
  });
  const [applied, setApplied] = useState<FilterState | null>(null);
  const [page, setPage] = useState<number>(1);

  const { data: attendance = [], isLoading: loadingAtt } = useRows("attendance_records", {
    orderBy: "work_date",
  });
  const { data: employees = [], isLoading: loadingEmp } = useRows("employees", {
    orderBy: "full_name",
  });

  // Group absences by employee with value calculation
  const employeeValueGroups = useMemo(() => {
    if (!applied) return [];

    const y = String(applied["year"] ?? "");
    const m = String(applied["month"] ?? "");
    const prefix = y && m ? `${y}-${m}` : y;
    const empSearch = String(applied["employee"] ?? "").trim().toLowerCase();

    // Map of employee key -> list of absence entries
    const byEmp = new Map<
      string,
      {
        employee: Row;
        dailySalary: number;
        absences: {
          work_date: string;
          count: number;
          amount: number;
          reason: string;
          notes: string;
          is_requested: boolean;
          is_final: boolean;
        }[];
      }
    >();

    for (const r of attendance) {
      if (r["check_in"]) continue; // Only absent
      const wd = String(r["work_date"] ?? "");
      if (prefix && !wd.startsWith(prefix)) continue;

      if (applied["branch"] && r["branch"] !== applied["branch"]) continue;
      if (applied["department"] && r["department"] !== applied["department"]) continue;

      const empName = String(r["employee_name"] ?? "");
      const empNo = String(r["emp_no"] ?? "");

      if (empSearch && !empName.toLowerCase().includes(empSearch) && !empNo.includes(empSearch)) {
        continue;
      }

      const key = empNo || empName;
      if (!key) continue;

      let group = byEmp.get(key);
      if (!group) {
        const emp = employees.find((e) => String(e["emp_no"]) === empNo || String(e["full_name"]) === empName) || {
          full_name: empName,
          emp_no: empNo,
          branch: r["branch"],
          department: r["department"],
          basic_salary: 3000,
          allowances: 0,
        };
        const basic = Number(emp["basic_salary"] ?? 3000);
        const allowances = Number(emp["allowances"] ?? 0);
        const daily = (basic + allowances) / 30 || 100;
        group = {
          employee: emp,
          dailySalary: Number(daily.toFixed(2)),
          absences: [],
        };
        byEmp.set(key, group);
      }

      group.absences.push({
        work_date: wd,
        count: 1,
        amount: group.dailySalary,
        reason: String(r["reason"] ?? "غياب بدون عذر"),
        notes: String(r["notes"] ?? "حسم غياب يوم"),
        is_requested: true,
        is_final: true,
      });
    }

    return Array.from(byEmp.values());
  }, [attendance, employees, applied]);

  const totalPages = Math.max(1, employeeValueGroups.length);
  const currentGroup = employeeValueGroups[Math.min(page - 1, totalPages - 1)];

  // Columns for the absence value table
  const columns = [
    { label: "تاريخ الغياب", key: "work_date", align: "left" as const },
    { label: "عدد الغياب", key: "count", align: "center" as const },
    {
      label: "قيمة المبلغ (ر.س)",
      key: "amount",
      align: "left" as const,
      render: (r: Record<string, any>) => (
        <span className="font-mono font-bold text-rose-700">
          {new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2 }).format(Number(r["amount"] ?? 0))}
        </span>
      ),
    },
    { label: "السبب", key: "reason" },
    { label: "ملاحظات", key: "notes" },
    {
      label: "تم الطلب",
      key: "is_requested",
      align: "center" as const,
      render: (r: Record<string, any>) => (r["is_requested"] ? <span className="text-emerald-600 font-bold">✓</span> : "—"),
    },
    {
      label: "نهائية",
      key: "is_final",
      align: "center" as const,
      render: (r: Record<string, any>) => (r["is_final"] ? <span className="text-blue-600 font-bold">✓</span> : "—"),
    },
  ];

  // Prepare export data
  const exportData: ExportData = useMemo(() => {
    const headers = ["الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم", "تاريخ الغياب", "الأيام", "المبلغ", "السبب", "ملاحظات"];
    const rows: (string | number)[][] = [];

    for (const g of employeeValueGroups) {
      const emp = g.employee;
      for (const abs of g.absences) {
        rows.push([
          String(emp["emp_no"] || "—"),
          String(emp["full_name"] || emp["employee_name"] || "—"),
          String(emp["branch"] || "—"),
          String(emp["department"] || "—"),
          abs.work_date,
          abs.count,
          abs.amount,
          abs.reason,
          abs.notes,
        ]);
      }
    }

    return {
      filename: `absence-value-report-${applied?.["year"] || ""}-${applied?.["month"] || ""}`,
      sheetName: "قيمة الغياب",
      headers,
      rows,
    };
  }, [employeeValueGroups, applied]);

  const totalAbsenceDays = currentGroup ? currentGroup.absences.reduce((s, a) => s + a.count, 0) : 0;
  const totalAbsenceAmount = currentGroup ? currentGroup.absences.reduce((s, a) => s + a.amount, 0) : 0;

  return (
    <AppShell>
      <ReportPageHeader
        icon="request_quote"
        title="تفاصيل قيمة الغياب للموظف"
        trail={["التقارير", "تقارير البصمة", "تفاصيل قيمة الغياب للموظف"]}
      />

      <FilterCard
        fields={[
          "branch",
          "department",
          "status",
          "jobTitle",
          "specialization",
          "showInFingerprint",
          "sponsor",
          "jobLevel",
          "gender",
          "employee",
          "year",
          "month",
        ]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => {
          setApplied(f);
          setPage(1);
        }}
        onReset={() => {
          setF({
            year: String(new Date().getFullYear()),
            month: String(new Date().getMonth() + 1).padStart(2, "0"),
          });
          setApplied(null);
          setPage(1);
        }}
      />

      {!applied ? (
        <EmptySearchState hint="حدد السنة والشهر أو الموظف ثم اضغط بحث لاحتساب قيمة الغياب" />
      ) : loadingAtt || loadingEmp ? (
        <div className="mt-8 text-center text-sm font-bold text-muted-foreground">جارٍ احتساب بيانات التقرير...</div>
      ) : employeeValueGroups.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center font-bold text-muted-foreground">
          لا توجد سجلات غياب مستحقة للاستقطاع في الفترة المحددة
        </div>
      ) : (
        <ReportDocumentViewer
          title="تفاصيل قيمة الغياب للموظف"
          subtitle={`لشهر ${applied["month"] || "—"} من سنة ${applied["year"] || "—"}`}
          companyName="شركة الحلول الخبيرة"
          totalRecords={employeeValueGroups.length}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          exportData={exportData}
        >
          {currentGroup && (
            <>
              <EmployeeReportCard
                name={String(currentGroup.employee["full_name"] || currentGroup.employee["employee_name"] || "—")}
                empNo={String(currentGroup.employee["emp_no"] || "—")}
                branch={String(currentGroup.employee["branch"] || "شركة الحلول الخبيرة")}
                department={String(currentGroup.employee["department"] || "—")}
                mainDept={String(currentGroup.employee["main_department"] || "القسم الرئيسي")}
                sector={String(currentGroup.employee["sector"] || "قطاع الإدارة")}
                jobLevel={String(currentGroup.employee["job_level"] || "إداري")}
                hireDate={String(currentGroup.employee["hire_date"] || "—")}
                startDate={String(currentGroup.employee["start_date"] || currentGroup.employee["hire_date"] || "—")}
                nationalId={String(currentGroup.employee["national_id"] || "—")}
              />

              <ReportStandardTable
                columns={columns}
                rows={currentGroup.absences}
                summaryFooter={
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-extrabold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span>إجمالي أيام الغياب:</span>
                      <span className="font-mono text-sm text-[#0070c0] bg-white px-2.5 py-0.5 rounded border border-slate-300">
                        {totalAbsenceDays} يوم
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>إجمالي قيمة الاستقطاع:</span>
                      <span className="font-mono text-sm text-rose-700 bg-rose-50 px-3 py-1 rounded border border-rose-200">
                        {new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2 }).format(totalAbsenceAmount)} ر.س
                      </span>
                    </div>
                  </div>
                }
              />
            </>
          )}
        </ReportDocumentViewer>
      )}
    </AppShell>
  );
}
