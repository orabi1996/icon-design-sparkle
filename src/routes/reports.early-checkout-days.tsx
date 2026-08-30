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

export const Route = createFileRoute("/reports/early-checkout-days")({
  head: () => ({ meta: [{ title: "تقرير الانصراف المبكر بالأيام | تقارير البصمة" }] }),
  component: EarlyCheckoutDaysReport,
});

const DEFAULT_CHECKOUT = "16:00:00";

function fmtTime(v: unknown) {
  if (!v) return "—";
  const s = String(v);
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(11, 16);
  } catch { /* fall through */ }
  return s.length >= 5 ? s.slice(-8, -3) : s;
}

function earlyMinutes(checkoutIso: unknown, defaultOut = DEFAULT_CHECKOUT): number {
  if (!checkoutIso) return 0;
  try {
    const actual = new Date(String(checkoutIso));
    const [dh, dm, ds] = defaultOut.split(":").map(Number);
    const def = new Date(actual);
    def.setHours(dh || 0, dm || 0, ds || 0, 0);
    const diff = Math.round((def.getTime() - actual.getTime()) / 60000);
    return diff > 0 ? diff : 0;
  } catch {
    return 0;
  }
}

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}.${String(m).padStart(2, "0")}`;
  return `0.${String(minutes).padStart(2, "0")}`;
}

function EarlyCheckoutDaysReport() {
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
        earlyDays: Row[];
      }
    >();

    for (const r of attendance) {
      const early = earlyMinutes(r["check_out"]);
      if (early <= 0) continue;

      if (applied["branch"] && r["branch"] !== applied["branch"]) continue;
      if (applied["department"] && r["department"] !== applied["department"]) continue;
      if (applied["status"] && r["status"] !== applied["status"]) continue;
      if (applied["jobTitle"] && r["job_title"] !== applied["jobTitle"]) continue;
      if (applied["jobLevel"] && r["job_level"] !== applied["jobLevel"]) continue;
      if (applied["sector"] && r["sector"] !== applied["sector"]) continue;
      if (applied["sponsor"] && r["sponsor"] !== applied["sponsor"]) continue;
      if (applied["path"] && r["path"] !== applied["path"]) continue;
      if (applied["specialization"] && r["specialization"] !== applied["specialization"]) continue;
      if (applied["gender"] && r["gender"] !== applied["gender"]) continue;

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
          earlyDays: [],
        };
        map.set(key, group);
      }

      group.totalMinutes += early;
      group.earlyDays.push({
        id: r["id"],
        work_date: String(r["work_date"] ?? "—"),
        actual_checkout: fmtTime(r["check_out"]),
        default_checkout: "4:00",
        check_out_formatted: fmtTime(r["check_out"]),
        early_minutes: early,
        early_hours: minutesToHours(early),
      } as Row);
    }

    // Sort each group's days by date
    for (const g of map.values()) {
      g.earlyDays.sort((a, b) => String(a["work_date"]).localeCompare(String(b["work_date"])));
    }

    return Array.from(map.values());
  }, [attendance, applied]);

  const totalPages = Math.max(1, employeeGroups.length);
  const currentGroup = employeeGroups[Math.min(page - 1, totalPages - 1)];

  const exportData: ExportData = useMemo(() => {
    const headers = ["الرقم الوظيفي", "إسم الموظف", "الفرع", "القسم", "التاريخ", "وقت الخروج الفعلي", "وقت الخروج الافتراضي", "دقائق الانصراف المبكر", "ساعات الانصراف المبكر"];
    const rows: (string | number)[][] = [];
    for (const g of employeeGroups) {
      for (const d of g.earlyDays) {
        rows.push([g.emp_no, g.employee_name, g.branch, g.department, d["work_date"], d["actual_checkout"], DEFAULT_CHECKOUT.slice(0, 5), d["early_minutes"], d["early_hours"]]);
      }
    }
    return {
      filename: `early-checkout-${applied?.["from"] || ""}-to-${applied?.["to"] || ""}`,
      sheetName: "الانصراف المبكر بالأيام",
      headers,
      rows,
    };
  }, [employeeGroups, applied]);

  return (
    <AppShell>
      <ReportPageHeader
        icon="logout"
        title="تقرير الانصراف المبكر بالأيام"
        trail={["التقارير", "تقارير البصمة", "الانصراف المبكر بالأيام"]}
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
        <EmptySearchState hint="حدد نطاق التاريخ ثم اضغط بحث لعرض تقرير الانصراف المبكر مجمعاً حسب الموظف" />
      ) : isLoading ? (
        <div className="mt-8 text-center text-sm font-bold text-muted-foreground">جارٍ تحميل البيانات...</div>
      ) : employeeGroups.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center font-bold text-muted-foreground">
          لا توجد سجلات انصراف مبكر في الفترة المحددة
        </div>
      ) : (
        <ReportDocumentViewer
          title="تقرير الانصراف قبل الوقت"
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
              <div className="mb-4 flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50/50 px-4 py-2">
                <div>
                  <div className="text-sm font-extrabold text-rose-800">{currentGroup.employee_name}</div>
                  <div className="text-xs text-slate-500">
                    {currentGroup.branch} · {currentGroup.department}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-500 font-bold">الرقم الوظيفي</div>
                  <div className="font-mono font-bold text-rose-700">{currentGroup.emp_no}</div>
                </div>
              </div>

              <ReportSectionTable
                title="تقرير الانصراف قبل الوقت"
                count={currentGroup.earlyDays.length}
                columns={[
                  { label: "إسم الموظف", key: "employee_name" },
                  { label: "التاريخ", key: "work_date", align: "left" },
                  { label: "وقت الخروج الافتراضي", key: "default_checkout", align: "left" },
                  { label: "وقت الخروج", key: "check_out_formatted", align: "left" },
                  { label: "دقائق الانصراف المبكر", key: "early_minutes", align: "left" },
                  { label: "ساعات الانصراف المبكر", key: "early_hours", align: "left" },
                ]}
                rows={currentGroup.earlyDays.map((d) => ({
                  ...d,
                  employee_name: currentGroup.employee_name,
                  default_checkout: "4:00",
                }))}
              />

              {/* Subtotal row matching screenshot style */}
              <div className="mt-0 bg-[#0070c0]/90 text-white rounded-b-sm px-4 py-2 text-xs font-extrabold flex items-center justify-between">
                <span>إسم الموظف: {currentGroup.employee_name}</span>
                <span className="font-mono">
                  {currentGroup.earlyDays.length} يوم |{" "}
                  {new Intl.NumberFormat("ar-SA").format(currentGroup.totalMinutes)} د |{" "}
                  {minutesToHours(currentGroup.totalMinutes)} س
                </span>
              </div>
            </>
          )}
        </ReportDocumentViewer>
      )}
    </AppShell>
  );
}
