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
  ReportSectionTable,
  type ExportData,
} from "@/components/hr/ReportDocumentViewer";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/late-days-list")({
  head: () => ({ meta: [{ title: "تقرير التأخير بالأيام | تقارير البصمة" }] }),
  component: LateDaysListReport,
});

const WEEKDAY_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function weekdayAr(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : WEEKDAY_AR[d.getDay()];
}

function LateDaysListReport() {
  const [f, setF] = useState<FilterState>({
    from: dateHelpers.firstOfMonth(),
    to: dateHelpers.todayISO(),
  });
  const [applied, setApplied] = useState<FilterState | null>(null);
  const [page, setPage] = useState(1);

  const { data: attendance = [], isLoading } = useRows("attendance_records", {
    orderBy: "work_date",
    rangeColumn: "work_date",
    ...(applied?.["from"] ? { from: String(applied["from"]) } : {}),
    ...(applied?.["to"] ? { to: String(applied["to"]) } : {}),
  });

  // Group by employee
  const employeeGroups = useMemo(() => {
    if (!applied) return [];

    const empSearch = String(applied["employee"] ?? "").trim().toLowerCase();

    const map = new Map<
      string,
      {
        employee_name: string;
        emp_no: string;
        branch: string;
        department: string;
        totalMinutes: number;
        lateDays: Row[];
      }
    >();

    for (const r of attendance) {
      const late = Number(r["late_minutes"] ?? 0);
      if (late <= 0) continue;
      if (applied["branch"] && r["branch"] !== applied["branch"]) continue;
      if (applied["department"] && r["department"] !== applied["department"]) continue;
      if (applied["status"] && r["status"] !== applied["status"]) continue;
      if (applied["sector"] && r["sector"] !== applied["sector"]) continue;
      if (applied["sponsor"] && r["sponsor"] !== applied["sponsor"]) continue;
      if (applied["jobLevel"] && r["job_level"] !== applied["jobLevel"]) continue;
      if (applied["path"] && r["path"] !== applied["path"]) continue;
      if (applied["gender"] && r["gender"] !== applied["gender"]) continue;
      if (applied["specialization"] && r["specialization"] !== applied["specialization"]) continue;
      if (applied["jobTitle"] && r["job_title"] !== applied["jobTitle"]) continue;

      const empName = String(r["employee_name"] ?? "");
      const empNo = String(r["emp_no"] ?? "");
      if (empSearch && !empName.toLowerCase().includes(empSearch) && !empNo.includes(empSearch)) continue;

      const key = empNo || empName;
      if (!key) continue;

      let group = map.get(key);
      if (!group) {
        group = {
          employee_name: empName,
          emp_no: empNo,
          branch: String(r["branch"] ?? "شركة الحلول الخبيرة"),
          department: String(r["department"] ?? "—"),
          totalMinutes: 0,
          lateDays: [],
        };
        map.set(key, group);
      }

      group.totalMinutes += late;
      group.lateDays.push({
        id: r["id"],
        branch: String(r["branch"] ?? "—"),
        work_date: String(r["work_date"] ?? "—"),
        weekday: weekdayAr(String(r["work_date"] ?? "")),
        emp_no: empNo,
        late_minutes: late,
      } as Row);
    }

    return Array.from(map.values());
  }, [attendance, applied]);

  const totalPages = Math.max(1, employeeGroups.length);
  const currentGroup = employeeGroups[Math.min(page - 1, totalPages - 1)];

  const exportData: ExportData = useMemo(() => {
    const headers = ["الرقم الوظيفي", "إسم الموظف", "الفرع", "القسم", "التاريخ", "اليوم", "دقائق التأخير"];
    const rows: (string | number)[][] = [];
    for (const g of employeeGroups) {
      for (const d of g.lateDays) {
        rows.push([g.emp_no, g.employee_name, g.branch, g.department, d["work_date"], d["weekday"], d["late_minutes"]]);
      }
    }
    return {
      filename: `late-days-list-${applied?.["from"] || ""}-to-${applied?.["to"] || ""}`,
      sheetName: "التأخير بالأيام",
      headers,
      rows,
    };
  }, [employeeGroups, applied]);

  return (
    <AppShell>
      <ReportPageHeader
        icon="watch_later"
        title="تقرير التأخير بالأيام"
        trail={["التقارير", "تقارير البصمة", "التأخير بالأيام"]}
      />
      <FilterCard
        fields={[
          "showInFingerprint", "branch", "department", "status", "sector",
          "sponsor", "jobLevel", "path", "jobCategory", "gender", "employee",
          "from", "to", "specialization", "jobTitle",
        ]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => { setApplied(f); setPage(1); }}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); setPage(1); }}
      />
      {!applied ? (
        <EmptySearchState hint="حدد نطاق التاريخ ثم اضغط بحث لعرض التأخير بالأيام مجمعاً حسب الموظف" />
      ) : isLoading ? (
        <div className="mt-8 text-center text-sm font-bold text-muted-foreground">جارٍ تحميل البيانات...</div>
      ) : employeeGroups.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center font-bold text-muted-foreground">
          لا توجد سجلات تأخير في الفترة المحددة
        </div>
      ) : (
        <ReportDocumentViewer
          title="تقرير التأخير بالأيام"
          subtitle={`من تاريخ ${applied["from"] || "—"} إلى تاريخ ${applied["to"] || "—"}`}
          companyName="شركة الحلول الخبيرة"
          totalRecords={employeeGroups.length}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          exportData={exportData}
        >
          {currentGroup && (
            <>
              {/* Employee Header */}
              <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-2">
                <div>
                  <div className="text-sm font-extrabold text-amber-800">{currentGroup.employee_name}</div>
                  <div className="text-xs text-slate-500">
                    {currentGroup.branch} · {currentGroup.department}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-500 font-bold">الرقم الوظيفي</div>
                  <div className="font-mono font-bold text-amber-700">{currentGroup.emp_no}</div>
                </div>
              </div>

              <ReportSectionTable
                title="تقرير التأخير بالأيام"
                count={currentGroup.lateDays.length}
                columns={[
                  { label: "الفرع", key: "branch" },
                  { label: "التاريخ", key: "work_date", align: "left" },
                  { label: "اليوم", key: "weekday" },
                  { label: "الرقم", key: "emp_no", align: "center" },
                  {
                    label: "دقائق التأخير",
                    key: "late_minutes",
                    align: "left",
                  },
                ]}
                rows={currentGroup.lateDays}
              />

              <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 flex items-center justify-between">
                <span>الإجمالي:</span>
                <span className="font-mono">
                  {currentGroup.lateDays.length} يوم |{" "}
                  {new Intl.NumberFormat("ar-SA").format(currentGroup.totalMinutes)} دقيقة تأخير
                </span>
              </div>
            </>
          )}
        </ReportDocumentViewer>
      )}
    </AppShell>
  );
}
