import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
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

export const Route = createFileRoute("/reports/late-minutes")({
  head: () => ({ meta: [{ title: "تقرير عدد الدقائق وساعات التأخير | تقارير البصمة" }] }),
  component: LateMinutesReport,
});

function minutesToHM(mins: number) {
  if (!mins) return "0 د";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} س ${m} د` : `${m} د`;
}

function LateMinutesReport() {
  const [f, setF] = useState<FilterState>({
    from: dateHelpers.firstOfMonth(),
    to: dateHelpers.todayISO(),
  });
  const [applied, setApplied] = useState<FilterState | null>(null);

  const { data: attendance = [], isLoading } = useRows("attendance_records", {
    orderBy: "work_date",
    rangeColumn: "work_date",
    ...(applied?.["from"] ? { from: String(applied["from"]) } : {}),
    ...(applied?.["to"] ? { to: String(applied["to"]) } : {}),
  });

  const { grouped, totalMinutes, totalEmployees } = useMemo(() => {
    if (!applied) return { grouped: [], totalMinutes: 0, totalEmployees: 0 };

    const empSearch = String(applied["employee"] ?? "").trim().toLowerCase();

    const byEmp = new Map<
      string,
      {
        employee_name: string;
        emp_no: string;
        branch: string;
        department: string;
        status: string;
        days: number;
        total_minutes: number;
      }
    >();

    for (const r of attendance) {
      const late = Number(r["late_minutes"] ?? 0);
      if (late <= 0) continue;
      if (applied["branch"] && r["branch"] !== applied["branch"]) continue;
      if (applied["department"] && r["department"] !== applied["department"]) continue;
      if (applied["status"] && r["status"] !== applied["status"]) continue;
      if (applied["sector"] && r["sector"] !== applied["sector"]) continue;
      if (applied["jobLevel"] && r["job_level"] !== applied["jobLevel"]) continue;
      if (applied["gender"] && r["gender"] !== applied["gender"]) continue;
      if (applied["sponsor"] && r["sponsor"] !== applied["sponsor"]) continue;
      if (applied["specialization"] && r["specialization"] !== applied["specialization"]) continue;
      if (applied["jobTitle"] && r["job_title"] !== applied["jobTitle"]) continue;

      const empName = String(r["employee_name"] ?? "");
      const empNo = String(r["emp_no"] ?? "");
      if (empSearch && !empName.toLowerCase().includes(empSearch) && !empNo.includes(empSearch)) continue;

      const key = empNo || empName;
      if (!key) continue;

      const cur = byEmp.get(key) ?? {
        employee_name: empName,
        emp_no: empNo,
        branch: String(r["branch"] ?? "شركة الحلول الخبيرة"),
        department: String(r["department"] ?? "—"),
        status: String(r["status"] ?? "نشط"),
        days: 0,
        total_minutes: 0,
      };
      cur.days += 1;
      cur.total_minutes += late;
      byEmp.set(key, cur);
    }

    const result = Array.from(byEmp.entries()).map(([id, v], i) => ({
      id,
      seq: i + 1,
      ...v,
    } as Row));

    const totalMins = result.reduce((s, r) => s + Number(r["total_minutes"] ?? 0), 0);
    return { grouped: result, totalMinutes: totalMins, totalEmployees: result.length };
  }, [attendance, applied]);

  const columns = [
    { label: "م", key: "seq", align: "center" as const },
    { label: "إسم الموظف", key: "employee_name" },
    { label: "عدد أيام التأخير", key: "days", align: "center" as const },
    { label: "الحالة", key: "status", align: "center" as const },
    {
      label: "مجموع دقائق التأخير",
      key: "total_minutes",
      align: "left" as const,
      render: (r: Record<string, any>) => (
        <span className="font-mono font-bold text-amber-700">
          {new Intl.NumberFormat("ar-SA").format(Number(r["total_minutes"] ?? 0))} د
        </span>
      ),
    },
    {
      label: "دقائق الاستقطاع / ساعة",
      key: "hours",
      align: "left" as const,
      render: (r: Record<string, any>) => (
        <span className="font-mono font-bold text-rose-700">
          {minutesToHM(Number(r["total_minutes"] ?? 0))}
        </span>
      ),
    },
  ];

  const exportData: ExportData = useMemo(() => ({
    filename: `late-minutes-report-${applied?.["from"] || ""}-to-${applied?.["to"] || ""}`,
    sheetName: "دقائق وساعات التأخير",
    headers: columns.map((c) => c.label),
    rows: grouped.map((r) => [
      r["seq"], r["employee_name"], r["days"], r["status"],
      `${r["total_minutes"]} د`, minutesToHM(Number(r["total_minutes"] ?? 0)),
    ]),
  }), [grouped, columns, applied]);

  return (
    <AppShell>
      <ReportPageHeader
        icon="schedule"
        title="تقرير عدد الدقائق وساعات التأخير"
        trail={["التقارير", "تقارير البصمة", "دقائق وساعات التأخير"]}
      />
      <FilterCard
        fields={[
          "showInFingerprint", "branch", "department", "status", "sponsor",
          "sector", "jobLevel", "jobCategory", "gender", "path", "employee",
          "from", "to", "specialization", "jobTitle",
        ]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); }}
      />
      {!applied ? (
        <EmptySearchState hint="حدد نطاق التاريخ ثم اضغط بحث لعرض إجمالي دقائق وساعات التأخير" />
      ) : isLoading ? (
        <div className="mt-8 text-center text-sm font-bold text-muted-foreground">جارٍ تحميل البيانات...</div>
      ) : (
        <ReportDocumentViewer
          title="تقرير عدد الدقائق وساعات التأخير"
          subtitle={`من تاريخ ${applied["from"] || "—"} إلى تاريخ ${applied["to"] || "—"}`}
          companyName="شركة الحلول الخبيرة"
          totalRecords={totalEmployees}
          exportData={exportData}
        >
          {/* Summary KPI Box */}
          <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#0070c0]/30 bg-blue-50/60 px-4 py-3 text-center">
              <div className="text-[11px] font-bold text-slate-500 mb-1">إجمالي الموظفين</div>
              <div className="text-lg font-extrabold text-[#0070c0]">{totalEmployees}</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-center">
              <div className="text-[11px] font-bold text-slate-500 mb-1">إجمالي دقائق التأخير</div>
              <div className="text-lg font-extrabold text-amber-700">
                {new Intl.NumberFormat("ar-SA").format(totalMinutes)} د
              </div>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50/60 px-4 py-3 text-center">
              <div className="text-[11px] font-bold text-slate-500 mb-1">الإجمالي بالساعات</div>
              <div className="text-lg font-extrabold text-rose-700">
                {minutesToHM(totalMinutes)}
              </div>
            </div>
          </div>

          <ReportStandardTable
            columns={columns}
            rows={grouped}
            summaryFooter={
              <div className="flex items-center justify-between">
                <span>إجمالي:</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-amber-700">
                    <MaterialIcon name="timer" size={14} />
                    {new Intl.NumberFormat("ar-SA").format(totalMinutes)} دقيقة
                  </span>
                  <span className="flex items-center gap-1 text-rose-700">
                    <MaterialIcon name="hourglass_empty" size={14} />
                    {minutesToHM(totalMinutes)}
                  </span>
                </div>
              </div>
            }
          />
        </ReportDocumentViewer>
      )}
    </AppShell>
  );
}
