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
  EmployeeReportCard,
  ReportSectionTable,
  type ExportData,
} from "@/components/hr/ReportDocumentViewer";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/absence-employee")({
  head: () => ({
    meta: [
      { title: "تقرير غياب الموظف | تقارير البصمة" },
      { name: "description", content: "تقرير غياب الموظف التفصيلي مع ورقة تقرير A4 وجداول الإجازات والغياب." },
    ],
  }),
  component: AbsenceEmployeeReport,
});

const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getDayName(dateStr: string) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return DAY_NAMES[d.getDay()] || "—";
  } catch {
    return "—";
  }
}

function AbsenceEmployeeReport() {
  const [f, setF] = useState<FilterState>({
    from: dateHelpers.firstOfMonth(),
    to: dateHelpers.todayISO(),
  });
  const [applied, setApplied] = useState<FilterState | null>(null);
  const [page, setPage] = useState<number>(1);

  const { data: attendance = [], isLoading: loadingAtt } = useRows("attendance_records", {
    orderBy: "work_date",
    rangeColumn: "work_date",
    ...(applied?.["from"] ? { from: String(applied["from"]) } : {}),
    ...(applied?.["to"] ? { to: String(applied["to"]) } : {}),
  });

  const { data: employees = [], isLoading: loadingEmp } = useRows("employees", {
    orderBy: "full_name",
  });

  // Group absences by employee
  const employeeAbsenceGroups = useMemo(() => {
    if (!applied) return [];

    const fromDate = String(applied["from"] || "");
    const toDate = String(applied["to"] || "");
    const empSearch = String(applied["employee"] || "").trim().toLowerCase();

    // Group records by employee
    const map = new Map<
      string,
      {
        employee: Row;
        officialLeaves: { day_name: string; work_date: string }[];
        absenceDays: { day_name: string; work_date: string }[];
      }
    >();

    for (const r of attendance) {
      const workDate = String(r["work_date"] || "");
      if (fromDate && workDate < fromDate) continue;
      if (toDate && workDate > toDate) continue;

      // Filter by absence (no check_in or marked as absent/leave)
      const isAbsent = !r["check_in"] || r["status"] === "غائب" || r["status"] === "إجازة";
      if (!isAbsent) continue;

      if (applied["branch"] && r["branch"] !== applied["branch"]) continue;
      if (applied["department"] && r["department"] !== applied["department"]) continue;

      const empName = String(r["employee_name"] || "");
      const empNo = String(r["emp_no"] || "");

      if (empSearch && !empName.toLowerCase().includes(empSearch) && !empNo.includes(empSearch)) {
        continue;
      }

      const key = empNo || empName;
      if (!key) continue;

      let entry = map.get(key);
      if (!entry) {
        const emp = employees.find((e) => String(e["emp_no"]) === empNo || String(e["full_name"]) === empName) || {
          full_name: empName,
          emp_no: empNo,
          branch: r["branch"],
          department: r["department"],
        };
        entry = { employee: emp, officialLeaves: [], absenceDays: [] };
        map.set(key, entry);
      }

      const dayItem = {
        day_name: getDayName(workDate),
        work_date: workDate,
      };

      if (r["status"] === "إجازة" || r["status"] === "إجازة رسمية") {
        entry.officialLeaves.push(dayItem);
      } else {
        entry.absenceDays.push(dayItem);
      }
    }

    return Array.from(map.values());
  }, [attendance, employees, applied]);

  const totalPages = Math.max(1, employeeAbsenceGroups.length);
  const currentGroup = employeeAbsenceGroups[Math.min(page - 1, totalPages - 1)];

  // Prepare export data
  const exportData: ExportData = useMemo(() => {
    const headers = ["الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم", "نوع الغياب", "اليوم", "التاريخ"];
    const rows: (string | number)[][] = [];

    for (const g of employeeAbsenceGroups) {
      const emp = g.employee;
      for (const off of g.officialLeaves) {
        rows.push([
          String(emp["emp_no"] || "—"),
          String(emp["full_name"] || emp["employee_name"] || "—"),
          String(emp["branch"] || "—"),
          String(emp["department"] || "—"),
          "إجازة رسمية",
          off.day_name,
          off.work_date,
        ]);
      }
      for (const abs of g.absenceDays) {
        rows.push([
          String(emp["emp_no"] || "—"),
          String(emp["full_name"] || emp["employee_name"] || "—"),
          String(emp["branch"] || "—"),
          String(emp["department"] || "—"),
          "غياب أيام",
          abs.day_name,
          abs.work_date,
        ]);
      }
    }

    return {
      filename: `absence-employee-report-${applied?.["from"] || ""}-to-${applied?.["to"] || ""}`,
      sheetName: "تقرير غياب الموظف",
      headers,
      rows,
    };
  }, [employeeAbsenceGroups, applied]);

  return (
    <AppShell>
      <ReportPageHeader
        icon="person_off"
        title="تقرير غياب الموظف"
        trail={["التقارير", "تقارير البصمة", "تقرير غياب الموظف"]}
      />

      <FilterCard
        fields={[
          "branch",
          "department",
          "status",
          "jobTitle",
          "jobLevel",
          "showInFingerprint",
          "gender",
          "employee",
          "from",
          "to",
          "absenceType",
        ]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => {
          setApplied(f);
          setPage(1);
        }}
        onReset={() => {
          setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() });
          setApplied(null);
          setPage(1);
        }}
      />

      {!applied ? (
        <EmptySearchState hint="حدد الموظف أو الفترة المطلوبة ثم اضغط بحث لعرض وثيقة تقرير الغياب" />
      ) : loadingAtt || loadingEmp ? (
        <div className="mt-8 text-center text-sm font-bold text-muted-foreground">جارٍ تحميل بيانات التقرير...</div>
      ) : employeeAbsenceGroups.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center font-bold text-muted-foreground">
          لا توجد بيانات غياب مطابقة لشروط البحث
        </div>
      ) : (
        <ReportDocumentViewer
          title="تقرير غياب الموظف"
          subtitle={`من تاريخ ${applied["from"] || "—"} إلى تاريخ ${applied["to"] || "—"}`}
          companyName="شركة الحلول الخبيرة"
          totalRecords={employeeAbsenceGroups.length}
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

              {currentGroup.officialLeaves.length > 0 && (
                <ReportSectionTable
                  title="أيام إجازة رسمية"
                  count={currentGroup.officialLeaves.length}
                  columns={[
                    { label: "اليوم", key: "day_name" },
                    { label: "التاريخ", key: "work_date", align: "left" },
                  ]}
                  rows={currentGroup.officialLeaves}
                />
              )}

              <ReportSectionTable
                title="غياب أيام"
                count={currentGroup.absenceDays.length}
                columns={[
                  { label: "اليوم", key: "day_name" },
                  { label: "التاريخ", key: "work_date", align: "left" },
                ]}
                rows={currentGroup.absenceDays}
              />
            </>
          )}
        </ReportDocumentViewer>
      )}
    </AppShell>
  );
}
