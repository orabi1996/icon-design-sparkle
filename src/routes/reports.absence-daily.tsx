import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import {
  FilterCard,
  ReportPageHeader,
  EmptySearchState,
  dateHelpers,
  type FilterState,
} from "@/components/hr/AttendanceReportShell";
import {
  ReportDocumentViewer,
  ReportStandardTable,
  type ExportData,
} from "@/components/hr/ReportDocumentViewer";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/absence-daily")({
  head: () => ({
    meta: [
      { title: "تقرير الغياب اليومي | تقارير البصمة" },
      { name: "description", content: "تقرير الغياب اليومي للموظفين مع تفاصيل الأقسام والقطاعات وإجمالي الغائبين." },
    ],
  }),
  component: AbsenceDailyReport,
});

function AbsenceDailyReport() {
  const [f, setF] = useState<FilterState>({ date: dateHelpers.todayISO() });
  const [applied, setApplied] = useState<FilterState | null>(null);

  const date = applied?.["date"] ? String(applied["date"]) : "";

  const { data: attendance = [], isLoading: loadingAtt } = useRows("attendance_records", {
    orderBy: "employee_name",
    ascending: true,
    rangeColumn: "work_date",
    ...(date ? { from: date, to: date } : {}),
  });

  const { data: employees = [], isLoading: loadingEmp } = useRows("employees", {
    orderBy: "full_name",
  });

  const rows = useMemo(() => {
    if (!applied) return [];

    const empSearch = String(applied["employee"] || "").trim().toLowerCase();

    return attendance
      .filter((r) => {
        // Absence condition
        const isAbsent = !r["check_in"] || r["status"] === "غائب";
        if (!isAbsent) return false;

        if (applied["branch"] && r["branch"] !== applied["branch"]) return false;
        if (applied["department"] && r["department"] !== applied["department"]) return false;
        if (applied["status"] && r["status"] !== applied["status"]) return false;

        const empName = String(r["employee_name"] || "");
        const empNo = String(r["emp_no"] || "");
        if (empSearch && !empName.toLowerCase().includes(empSearch) && !empNo.includes(empSearch)) {
          return false;
        }

        return true;
      })
      .map((r, idx) => {
        const emp = employees.find((e) => String(e["emp_no"]) === String(r["emp_no"])) || {};
        return {
          id: r["id"] || idx,
          seq: idx + 1,
          employee_name: r["employee_name"] || emp["full_name"] || "—",
          emp_no: r["emp_no"] || emp["emp_no"] || "—",
          branch: r["branch"] || emp["branch"] || "شركة الحلول الخبيرة",
          department: r["department"] || emp["department"] || "—",
          main_department: emp["main_department"] || "القسم الرئيسي",
          sector: emp["sector"] || "قطاع الإدارة",
          gender: emp["gender"] || "ذكر",
          status: r["status"] || "غياب",
        } as Row;
      });
  }, [attendance, employees, applied]);

  const columns = [
    { label: "المسلسل", key: "seq", align: "center" as const },
    { label: "إسم الموظف", key: "employee_name" },
    { label: "الرقم الوظيفي", key: "emp_no", align: "center" as const },
    { label: "الفرع", key: "branch" },
    { label: "القسم", key: "department" },
    { label: "القسم الرئيسي", key: "main_department" },
    { label: "القطاع", key: "sector" },
    { label: "النوع", key: "gender", align: "center" as const },
    { label: "الحالة", key: "status", align: "center" as const },
  ];

  const exportData: ExportData = useMemo(() => {
    return {
      filename: `daily-absence-report-${date || dateHelpers.todayISO()}`,
      sheetName: "الغياب اليومي",
      headers: columns.map((c) => c.label),
      rows: rows.map((r) => columns.map((c) => r[c.key])),
    };
  }, [rows, columns, date]);

  return (
    <AppShell>
      <ReportPageHeader
        icon="today"
        title="تقرير الغياب اليومي"
        trail={["التقارير", "تقارير البصمة", "تقرير الغياب اليومي"]}
      />

      <FilterCard
        fields={[
          "branch",
          "department",
          "status",
          "jobTitle",
          "jobLevel",
          "excludedFromFingerprint",
          "gender",
          "employee",
          "date",
        ]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => {
          setF({ date: dateHelpers.todayISO() });
          setApplied(null);
        }}
      />

      {!applied ? (
        <EmptySearchState hint="حدد تاريخ اليوم والفلاتر ثم اضغط بحث لعرض وثيقة الغياب اليومي" />
      ) : loadingAtt || loadingEmp ? (
        <div className="mt-8 text-center text-sm font-bold text-muted-foreground">جارٍ تحميل بيانات التقرير...</div>
      ) : (
        <ReportDocumentViewer
          title="تقرير الغياب اليومي"
          subtitle={`ليوم: ${date || "—"}`}
          companyName="شركة الحلول الخبيرة"
          totalRecords={rows.length}
          exportData={exportData}
        >
          <ReportStandardTable
            columns={columns}
            rows={rows}
            summaryFooter={
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>إجمالي الغائبين المسجلين:</span>
                <span className="font-mono text-sm text-[#0070c0] bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
                  {rows.length} موظف
                </span>
              </div>
            }
          />
        </ReportDocumentViewer>
      )}
    </AppShell>
  );
}
