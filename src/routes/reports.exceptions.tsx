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

export const Route = createFileRoute("/reports/exceptions")({
  head: () => ({
    meta: [
      { title: "تقرير استثناءات الحضور والإنصراف | تقارير البصمة" },
      { name: "description", content: "تقرير تفصيلي باستثناءات الحضور والانصراف (الغياب، عدم تسجيل البصمة، التأخير، والانصراف المبكر)." },
    ],
  }),
  component: ExceptionsReport,
});

function fmtTime(v: unknown) {
  if (!v) return "—";
  const s = String(v);
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(11, 19);
  } catch {
    /* fall through */
  }
  return s.length >= 8 ? s.slice(-8) : s;
}

function ExceptionsReport() {
  const [f, setF] = useState<FilterState>({
    from: dateHelpers.firstOfMonth(),
    to: dateHelpers.todayISO(),
  });
  const [applied, setApplied] = useState<FilterState | null>(null);

  const { data: attendance = [], isLoading: loadingAtt } = useRows("attendance_records", {
    orderBy: "work_date",
    rangeColumn: "work_date",
    ...(applied?.["from"] ? { from: String(applied["from"]) } : {}),
    ...(applied?.["to"] ? { to: String(applied["to"]) } : {}),
  });

  const { data: employees = [], isLoading: loadingEmp } = useRows("employees", {
    orderBy: "full_name",
  });

  const rows = useMemo(() => {
    if (!applied) return [];

    const empSearch = String(applied["employee"] || "").trim().toLowerCase();
    const exceptionFilter = String(applied["exceptionType"] || "الكل");

    return attendance
      .map((r, idx) => {
        const noIn = !r["check_in"];
        const noOut = !r["check_out"] && r["check_in"];
        const late = Number(r["late_minutes"] ?? 0) > 0;
        const isAbnormal = noIn || noOut || late || r["status"] === "استثناء";

        if (!isAbnormal) return null;

        let exceptionType = "استثناء";
        if (noIn) exceptionType = "غياب";
        else if (noOut) exceptionType = "بدون انصراف";
        else if (late) exceptionType = "تأخير";

        if (exceptionFilter && exceptionFilter !== "الكل" && exceptionType !== exceptionFilter) {
          return null;
        }

        if (applied["branch"] && r["branch"] !== applied["branch"]) return null;
        if (applied["department"] && r["department"] !== applied["department"]) return null;

        const empName = String(r["employee_name"] || "");
        const empNo = String(r["emp_no"] || "");
        if (empSearch && !empName.toLowerCase().includes(empSearch) && !empNo.includes(empSearch)) {
          return null;
        }

        const emp = employees.find((e) => String(e["emp_no"]) === empNo) || {};

        return {
          id: r["id"] || idx,
          seq: idx + 1,
          employee_name: empName || emp["full_name"] || "—",
          emp_no: empNo || emp["emp_no"] || "—",
          branch: r["branch"] || emp["branch"] || "شركة الحلول الخبيرة",
          department: r["department"] || emp["department"] || "—",
          work_date: String(r["work_date"] || "—"),
          exception_type: exceptionType,
          fingerprint_time: r["check_in"] ? fmtTime(r["check_in"]) : r["check_out"] ? fmtTime(r["check_out"]) : "—",
          approval_status: r["approval_status"] || (noIn ? "غير مبرر" : "قيد المراجعة"),
          notes: r["notes"] || (noIn ? "غياب بدون إذن" : noOut ? "لم تسجل بصمة الخروج" : `تأخير ${r["late_minutes"]} دقيقة`),
        } as Row;
      })
      .filter(Boolean)
      .map((r, i) => ({ ...r, seq: i + 1 }));
  }, [attendance, employees, applied]);

  const columns = [
    { label: "المسلسل", key: "seq", align: "center" as const },
    { label: "إسم الموظف", key: "employee_name" },
    { label: "الرقم الوظيفي", key: "emp_no", align: "center" as const },
    { label: "الفرع", key: "branch" },
    { label: "القسم", key: "department" },
    { label: "التاريخ", key: "work_date", align: "left" as const },
    {
      label: "نوع الاستثناء",
      key: "exception_type",
      align: "center" as const,
      render: (r: Record<string, any>) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            r["exception_type"] === "غياب"
              ? "bg-rose-100 text-rose-700 border border-rose-200"
              : r["exception_type"] === "بدون انصراف"
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-blue-100 text-blue-700 border border-blue-200"
          }`}
        >
          {r["exception_type"]}
        </span>
      ),
    },
    { label: "وقت البصمة", key: "fingerprint_time", align: "left" as const },
    { label: "الحالة", key: "approval_status", align: "center" as const },
    { label: "ملاحظات", key: "notes" },
  ];

  const exportData: ExportData = useMemo(() => {
    return {
      filename: `exceptions-report-${applied?.["from"] || ""}-to-${applied?.["to"] || ""}`,
      sheetName: "استثناءات الحضور",
      headers: columns.map((c) => c.label),
      rows: rows.map((r) => columns.map((c) => r[c.key])),
    };
  }, [rows, columns, applied]);

  return (
    <AppShell>
      <ReportPageHeader
        icon="report"
        title="تقرير استثناءات الحضور والإنصراف"
        trail={["التقارير", "تقارير البصمة", "استثناءات الحضور والانصراف"]}
      />

      <FilterCard
        fields={[
          "branch",
          "department",
          "jobTitle",
          "mainDept",
          "sector",
          "showInFingerprint",
          "jobLevel",
          "path",
          "employee",
          "from",
          "to",
          "exceptionType",
        ]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => {
          setF({ from: dateHelpers.firstOfMonth(), to: dateHelpers.todayISO() });
          setApplied(null);
        }}
      />

      {!applied ? (
        <EmptySearchState hint="حدد الفترة ونوع الاستثناء ثم اضغط بحث لعرض وثيقة الاستثناءات" />
      ) : loadingAtt || loadingEmp ? (
        <div className="mt-8 text-center text-sm font-bold text-muted-foreground">جارٍ تحميل بيانات الاستثناءات...</div>
      ) : (
        <ReportDocumentViewer
          title="استثناءات الحضور والانصراف"
          subtitle={`من تاريخ ${applied["from"] || "—"} إلى تاريخ ${applied["to"] || "—"}`}
          companyName="شركة الحلول الخبيرة"
          totalRecords={rows.length}
          exportData={exportData}
        >
          <ReportStandardTable
            columns={columns}
            rows={rows}
            summaryFooter={
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>إجمالي حالات الاستثناء المرصودة:</span>
                <span className="font-mono text-sm text-[#0070c0] bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
                  {rows.length} حالة استثناء
                </span>
              </div>
            }
          />
        </ReportDocumentViewer>
      )}
    </AppShell>
  );
}
