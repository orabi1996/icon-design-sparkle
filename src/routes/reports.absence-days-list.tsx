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

export const Route = createFileRoute("/reports/absence-days-list")({
  head: () => ({ meta: [{ title: "تقرير الغياب بالأيام | تقارير البصمة" }] }),
  component: AbsenceDaysListReport,
});

const WEEKDAY_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function weekdayAr(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : WEEKDAY_AR[d.getDay()];
}

function fmtTime(v: unknown) {
  if (!v) return "—";
  const s = String(v);
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(11, 16);
  } catch { /* fall through */ }
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function AbsenceDaysListReport() {
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

  // Group by employee - each employee becomes a "page"
  const employeeGroups = useMemo(() => {
    if (!applied) return [];

    const empSearch = String(applied["employee"] ?? "").trim().toLowerCase();

    const map = new Map<string, { employee_name: string; emp_no: string; branch: string; department: string; absences: Row[] }>();

    for (const r of attendance) {
      if (r["check_in"]) continue; // only absent records
      if (applied["branch"] && r["branch"] !== applied["branch"]) continue;
      if (applied["department"] && r["department"] !== applied["department"]) continue;
      if (applied["status"] && r["status"] !== applied["status"]) continue;
      if (applied["sector"] && r["sector"] !== applied["sector"]) continue;
      if (applied["jobLevel"] && r["job_level"] !== applied["jobLevel"]) continue;
      if (applied["gender"] && r["gender"] !== applied["gender"]) continue;
      if (applied["path"] && r["path"] !== applied["path"]) continue;
      if (applied["jobTitle"] && r["job_title"] !== applied["jobTitle"]) continue;
      if (applied["jobCategory"] && r["job_category"] !== applied["jobCategory"]) continue;

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
          absences: [],
        };
        map.set(key, group);
      }

      group.absences.push({
        id: r["id"],
        work_date: String(r["work_date"] ?? "—"),
        weekday: weekdayAr(String(r["work_date"] ?? "")),
        check_in_time: fmtTime(r["check_in"]),
        check_out_time: fmtTime(r["check_out"]),
        status: String(r["status"] ?? "غياب"),
      } as Row);
    }

    return Array.from(map.values());
  }, [attendance, applied]);

  const totalPages = Math.max(1, employeeGroups.length);
  const currentGroup = employeeGroups[Math.min(page - 1, totalPages - 1)];

  // Flat export data
  const exportData: ExportData = useMemo(() => {
    const headers = ["الرقم الوظيفي", "إسم الموظف", "الفرع", "القسم", "التاريخ", "اليوم", "وقت الحضور", "وقت الانصراف", "الحالة"];
    const rows: (string | number)[][] = [];
    for (const g of employeeGroups) {
      for (const a of g.absences) {
        rows.push([g.emp_no, g.employee_name, g.branch, g.department, a["work_date"], a["weekday"], a["check_in_time"], a["check_out_time"], a["status"]]);
      }
    }
    return {
      filename: `absence-days-list-${applied?.["from"] || ""}-to-${applied?.["to"] || ""}`,
      sheetName: "الغياب بالأيام",
      headers,
      rows,
    };
  }, [employeeGroups, applied]);

  return (
    <AppShell>
      <ReportPageHeader
        icon="calendar_today"
        title="تقرير الغياب بالأيام"
        trail={["التقارير", "تقارير البصمة", "الغياب بالأيام"]}
      />
      <FilterCard
        fields={[
          "excludedFromFingerprint", "branch", "department", "status", "sector",
          "jobTitle", "jobLevel", "path", "jobCategory", "gender", "employee", "from", "to",
        ]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => { setApplied(f); setPage(1); }}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); setPage(1); }}
      />
      {!applied ? (
        <EmptySearchState hint="حدد نطاق التاريخ ثم اضغط بحث لعرض تقرير الغياب بالأيام مجمعاً حسب الموظف" />
      ) : isLoading ? (
        <div className="mt-8 text-center text-sm font-bold text-muted-foreground">جارٍ تحميل البيانات...</div>
      ) : employeeGroups.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center font-bold text-muted-foreground">
          لا توجد سجلات غياب في الفترة المحددة
        </div>
      ) : (
        <ReportDocumentViewer
          title="تقرير الغياب حسب الأيام"
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
              <div className="mb-4 flex items-center justify-between rounded-lg border border-[#0070c0]/30 bg-blue-50/50 px-4 py-2">
                <div>
                  <div className="text-sm font-extrabold text-[#004e82]">{currentGroup.employee_name}</div>
                  <div className="text-xs text-slate-500">
                    {currentGroup.branch} · {currentGroup.department}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-500 font-bold">الرقم الوظيفي</div>
                  <div className="font-mono font-bold text-[#0070c0]">{currentGroup.emp_no}</div>
                </div>
              </div>

              <ReportSectionTable
                title="تقرير الغياب حسب الأيام"
                count={currentGroup.absences.length}
                columns={[
                  { label: "إسم الموظف", key: "employee_name" },
                  { label: "يوم", key: "weekday" },
                  { label: "تاريخ الغياب", key: "work_date", align: "left" },
                  { label: "وقت الخروج", key: "check_out_time", align: "left" },
                  { label: "وقت الحضور", key: "check_in_time", align: "left" },
                  { label: "الحالة", key: "status", align: "center" },
                ]}
                rows={currentGroup.absences.map((a) => ({
                  ...a,
                  employee_name: currentGroup.employee_name,
                }))}
              />

              <div className="mt-3 rounded border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>مجموع: </span>
                <span className="font-mono text-[#0070c0]">
                  {currentGroup.absences.length} يوم غياب
                </span>
              </div>
            </>
          )}
        </ReportDocumentViewer>
      )}
    </AppShell>
  );
}
