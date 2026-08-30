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

export const Route = createFileRoute("/reports/absence-days-count")({
  head: () => ({ meta: [{ title: "تقرير عدد أيام الغياب | تقارير البصمة" }] }),
  component: AbsenceDaysCountReport,
});

const ABSENCE_TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  "غياب بدون عذر": { bg: "bg-rose-100 border-rose-200", text: "text-rose-700" },
  "بعذر مقبول": { bg: "bg-amber-100 border-amber-200", text: "text-amber-800" },
  "بعذر مرضي": { bg: "bg-blue-100 border-blue-200", text: "text-blue-700" },
  إجازة: { bg: "bg-emerald-100 border-emerald-200", text: "text-emerald-700" },
};

function AbsenceDaysCountReport() {
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

  const rows = useMemo(() => {
    if (!applied) return [];
    const empSearch = String(applied["employee"] ?? "").trim().toLowerCase();

    const byEmp = new Map<
      string,
      {
        employee_name: string;
        emp_no: string;
        branch: string;
        department: string;
        status: string;
        count: number;
        absence_type: string;
      }
    >();

    for (const r of attendance) {
      if (r["check_in"]) continue;
      if (applied["branch"] && r["branch"] !== applied["branch"]) continue;
      if (applied["department"] && r["department"] !== applied["department"]) continue;
      if (applied["gender"] && r["gender"] !== applied["gender"]) continue;

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
        count: 0,
        absence_type: "غياب بدون عذر",
      };
      cur.count += 1;
      byEmp.set(key, cur);
    }

    return Array.from(byEmp.entries()).map(([id, v], i) => ({
      id,
      seq: i + 1,
      ...v,
    } as Row));
  }, [attendance, applied]);

  const columns = [
    { label: "المسلسل", key: "seq", align: "center" as const },
    { label: "إسم الموظف", key: "employee_name" },
    {
      label: "حالة الغياب",
      key: "absence_type",
      align: "center" as const,
      render: (r: Record<string, any>) => {
        const style = ABSENCE_TYPE_BADGE[String(r["absence_type"])] || ABSENCE_TYPE_BADGE["غياب بدون عذر"];
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${style.bg} ${style.text}`}>
            {String(r["absence_type"] ?? "غياب بدون عذر")}
          </span>
        );
      },
    },
    {
      label: "عدد الغياب",
      key: "count",
      align: "center" as const,
      render: (r: Record<string, any>) => (
        <span className="font-mono font-extrabold text-[#0070c0]">
          {String(r["count"] ?? 0)} يوم
        </span>
      ),
    },
    { label: "الحالة", key: "status", align: "center" as const },
  ];

  const exportData: ExportData = useMemo(() => ({
    filename: `absence-days-count-${applied?.["from"] || ""}-to-${applied?.["to"] || ""}`,
    sheetName: "عدد أيام الغياب",
    headers: columns.map((c) => c.label),
    rows: rows.map((r) => columns.map((c) => r[c.key])),
  }), [rows, columns, applied]);

  return (
    <AppShell>
      <ReportPageHeader
        icon="event_busy"
        title="تقرير عدد أيام الغياب"
        trail={["التقارير", "تقارير البصمة", "عدد أيام الغياب"]}
      />
      <FilterCard
        fields={["showInFingerprint", "branch", "department", "gender", "employee", "from", "to"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() }); setApplied(null); }}
      />
      {!applied ? (
        <EmptySearchState hint="حدد نطاق التاريخ ثم اضغط بحث لعرض عدد أيام الغياب لكل موظف" />
      ) : isLoading ? (
        <div className="mt-8 text-center text-sm font-bold text-muted-foreground">جارٍ تحميل البيانات...</div>
      ) : (
        <ReportDocumentViewer
          title="تقرير عدد أيام الغياب"
          subtitle={`من تاريخ ${applied["from"] || "—"} إلى تاريخ ${applied["to"] || "—"}`}
          companyName="شركة الحلول الخبيرة"
          totalRecords={rows.length}
          exportData={exportData}
        >
          <ReportStandardTable
            columns={columns}
            rows={rows}
            summaryFooter={
              <div className="flex items-center justify-between">
                <span>إجمالي الموظفين الغائبين:</span>
                <span className="font-mono text-sm text-[#0070c0] bg-blue-50 px-3 py-1 rounded border border-blue-200">
                  {rows.length} موظف | إجمالي {rows.reduce((s, r) => s + Number(r["count"] ?? 0), 0)} يوم
                </span>
              </div>
            }
          />
        </ReportDocumentViewer>
      )}
    </AppShell>
  );
}
