import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  ReportDocumentViewer,
  type ExportData,
} from "@/components/hr/ReportDocumentViewer";
import { useRows } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/employee-data")({
  head: () => ({ meta: [{ title: "تقرير بيانات الموظفين | التقارير" }] }),
  component: EmployeeDataReport,
});

/* ─── helpers ─── */
const today = () => new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" });

type Filters = {
  branch: string;
  department: string;
  status: string;
  jobTitle: string;
  mainDepartment: string;
  sector: string;
  jobLevel: string;
  path: string;
  employee: string;
};

const emptyFilters: Filters = {
  branch: "", department: "", status: "", jobTitle: "",
  mainDepartment: "", sector: "", jobLevel: "", path: "", employee: "",
};

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

/* ─── section dividers ─── */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="col-span-full rounded py-1 text-center text-[11px] font-extrabold text-white bg-[#0070c0] mt-3 mb-1 print:bg-[#0070c0]">
      {title}
    </div>
  );
}

function InfoRow({ label, value, labelClass = "" }: { label: string; value?: string | null; labelClass?: string }) {
  return (
    <div className="flex border-b border-slate-100">
      <div className={`w-2/5 bg-[#dce6f1] px-2 py-1 text-[11px] font-bold text-slate-700 text-right ${labelClass}`}>
        {label}
      </div>
      <div className="w-3/5 px-2 py-1 text-[11px] font-medium text-slate-800 text-right">
        {value || "—"}
      </div>
    </div>
  );
}

function MiniTable({
  headers,
  rows,
  footerRow,
}: {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  footerRow?: (string | number | null | undefined)[];
}) {
  return (
    <table className="w-full text-[11px] border-collapse mb-2" dir="rtl">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="bg-[#9dc3e6] text-[#174472] px-2 py-1 font-extrabold text-right border border-[#b4c7e7]">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-[#f0f6ff]"}>
            {row.map((cell, ci) => (
              <td key={ci} className="px-2 py-0.5 border border-[#dce6f1] text-right text-slate-700">
                {cell ?? "—"}
              </td>
            ))}
          </tr>
        ))}
        {footerRow && (
          <tr className="bg-[#0070c0] text-white font-extrabold">
            {footerRow.map((cell, ci) => (
              <td key={ci} className="px-2 py-1 text-right border border-[#004e82]">
                {cell ?? ""}
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
}

/* ─── single employee card ─── */
function EmployeeCard({
  emp,
  entitlements,
  deductions,
  leaveRequests,
  seq,
  total,
}: {
  emp: Record<string, any>;
  entitlements: Record<string, any>[];
  deductions: Record<string, any>[];
  leaveRequests: Record<string, any>[];
  seq: number;
  total: number;
}) {
  // employee-specific entitlements (استحقاقات)
  const empEntitlements = entitlements.filter(
    (e) => String(e["emp_no"] ?? "") === String(emp["emp_no"] ?? "") ||
            String(e["employee_id"] ?? "") === String(emp["id"] ?? "")
  );

  const empDeductions = deductions.filter(
    (d) => String(d["emp_no"] ?? "") === String(emp["emp_no"] ?? "") ||
            String(d["employee_id"] ?? "") === String(emp["id"] ?? "")
  );

  // Leave requests grouped by type – show rصيد (balance)
  const leaveByType = new Map<string, { total: number; used: number }>();
  for (const r of leaveRequests) {
    if (
      String(r["emp_no"] ?? "") !== String(emp["emp_no"] ?? "") &&
      String(r["employee_id"] ?? "") !== String(emp["id"] ?? "")
    ) continue;
    const type = String(r["leave_type"] ?? "إجازة سنوية");
    const cur = leaveByType.get(type) ?? { total: 0, used: 0 };
    if (r["status"] === "موافق عليه" || r["status"] === "مقبول") {
      cur.used += Number(r["days"] ?? r["leave_days"] ?? 0);
    }
    cur.total += Number(r["entitled_days"] ?? r["days"] ?? 0);
    leaveByType.set(type, cur);
  }
  const leaveRows = Array.from(leaveByType.entries()).map(([type, v]) => [
    type,
    v.total,
    0,
    v.total,
    v.total - v.used,
  ]);
  const leaveTotals = leaveRows.reduce(
    (acc, r) => [
      "الإجمالي",
      Number(acc[1]) + Number(r[1]),
      0,
      Number(acc[3]) + Number(r[3]),
      Number(acc[4]) + Number(r[4]),
    ],
    ["الإجمالي", 0, 0, 0, 0]
  );

  const totalEntitlement = empEntitlements.reduce((s, e) => s + Number(e["amount"] ?? e["value"] ?? 0), 0);
  const totalDeduction = empDeductions.reduce((s, d) => s + Number(d["amount"] ?? d["value"] ?? 0), 0);

  return (
    <div className="report-sheet mb-0" dir="rtl">
      {/* Report Header */}
      <div className="flex items-center justify-between border-b-2 border-[#0070c0] pb-2 mb-4">
        <div className="text-[10px] text-slate-400">{today()}</div>
        <div className="text-center">
          <div className="text-[13px] font-extrabold text-[#004e82]">تقرير بيانات الموظفين</div>
          <div className="text-[10px] text-slate-500">صر · ساماهورو</div>
        </div>
        <div className="text-[10px] text-slate-400">صفحة {seq} من {total}</div>
      </div>

      {/* Employee Name Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="rounded bg-[#0070c0] text-white text-[11px] font-extrabold px-3 py-1">موظف</span>
        <span className="font-extrabold text-[13px] text-slate-800">{emp["full_name"] || emp["employee_name"] || "—"}</span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-x-4">
        {/* RIGHT COLUMN */}
        <div>
          <SectionHeader title="البيانات الأساسية" />
          <InfoRow label="رقم الموظف" value={emp["emp_no"]} />
          <InfoRow label="البريد الوظيفي" value={emp["work_email"] ?? emp["email"]} />
          <InfoRow label="تاريخ الميلاد" value={emp["birth_date"] ?? emp["date_of_birth"]} />
          <InfoRow label="الحالة الاجتماعية" value={emp["marital_status"]} />
          <InfoRow label="الكفالة الوظيفية" value={emp["sponsor"]} />
          <InfoRow label="الجنس" value={emp["gender"]} />
          <InfoRow label="الجنسية" value={emp["nationality"]} />
          <InfoRow label="القسم" value={emp["department"]} />
          <InfoRow label="القسم الرئيسي" value={emp["main_department"]} />
        </div>
        {/* LEFT COLUMN */}
        <div>
          <SectionHeader title="" />
          <InfoRow label="الرقم الوظيفي" value={emp["emp_no"]} />
          <InfoRow label="رقم الهوية" value={emp["national_id"]} />
          <InfoRow label="تاريخ التعيين (ميلادي)" value={emp["hire_date"]} />
          <InfoRow label="الحالة" value={emp["status"]} />
          <InfoRow label="الفرع" value={emp["branch"]} />
          <InfoRow label="الفئة الوظيفية" value={emp["job_level"] ?? emp["employment_category"]} />
          <InfoRow label="المسمى الوظيفي" value={emp["job_title"]} />
          <InfoRow label="القطاع" value={emp["sector"]} />
          <InfoRow label="المسار" value={emp["career_path"]} />
        </div>
      </div>

      {/* Contact info */}
      <SectionHeader title="بيانات التواصل" />
      <div className="grid grid-cols-3 gap-x-4">
        <InfoRow label="رقم جواز السفر" value={emp["passport_no"]} />
        <InfoRow label="التاريخ الوظيفي للأمر" value={emp["contract_date"] ?? emp["start_date"]} />
        <InfoRow label="فاكس" value={emp["fax"]} />
        <InfoRow label="الإيميل" value={emp["email"] ?? emp["work_email"]} />
        <InfoRow label="الجوال" value={emp["phone"] ?? emp["mobile"]} />
      </div>

      {/* Financial info */}
      <SectionHeader title="البيانات المالية" />
      <div className="grid grid-cols-2 gap-x-4">
        <InfoRow label="الراتب الأساسي" value={emp["basic_salary"] ? String(emp["basic_salary"]) : undefined} />
        <InfoRow label="الراتب الإجمالي" value={emp["total_salary"] ? String(emp["total_salary"]) : undefined} />
      </div>

      {/* Entitlements */}
      {empEntitlements.length > 0 && (
        <>
          <SectionHeader title="الاستحقاقات" />
          <MiniTable
            headers={["القسم", "الاسم", "القيمة"]}
            rows={empEntitlements.map((e) => [
              e["category"] ?? e["department"] ?? "—",
              e["entitlement_name"] ?? e["name"] ?? "—",
              e["amount"] ?? e["value"] ?? "—",
            ])}
            footerRow={["الإجمالي", "", totalEntitlement]}
          />
        </>
      )}

      {/* Deductions */}
      {empDeductions.length > 0 && (
        <>
          <SectionHeader title="الإضافات" />
          <MiniTable
            headers={["القسم", "الاسم", "القيمة"]}
            rows={empDeductions.map((d) => [
              d["category"] ?? d["department"] ?? "—",
              d["deduction_name"] ?? d["name"] ?? "—",
              d["amount"] ?? d["value"] ?? "—",
            ])}
            footerRow={["الإجمالي", "", totalDeduction]}
          />
        </>
      )}

      {/* Leave Balances */}
      {leaveRows.length > 0 && (
        <>
          <SectionHeader title="الإجازات" />
          <MiniTable
            headers={["اسم الإجازة", "الرصيد الحالي", "وصف صرف", "المستحق حتى تاريخه", "أرصدة البلد"]}
            rows={leaveRows}
            footerRow={leaveTotals}
          />
        </>
      )}
    </div>
  );
}

/* ─── Filter Bar ─── */
const inputCls = "h-8 w-full border border-[#c0cfe0] bg-white px-2 text-[12px] font-medium text-slate-800 outline-none focus:border-[#1179bc] focus:ring-1 focus:ring-[#1179bc]/20";

function SelectFilter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[11px] font-bold text-slate-700 text-right">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls + " appearance-none"}>
        <option value="">اختر ...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function TextFilter({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[11px] font-bold text-slate-700 text-right">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </label>
  );
}

/* ─── Main Component ─── */
function EmployeeDataReport() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters | null>(null);
  const [page, setPage] = useState(1);

  const { data: employees = [], isLoading: empLoading } = useRows("employees", { orderBy: "emp_no", ascending: true });
  const { data: entitlements = [] } = useRows("employee_entitlements", { orderBy: "id" });
  const { data: deductions = [] } = useRows("employee_deductions", { orderBy: "id" });
  const { data: leaveRequests = [] } = useRows("leave_requests", { orderBy: "id" });

  const opts = useMemo(() => ({
    branches: uniq(employees.map((e) => String(e["branch"] ?? ""))),
    departments: uniq(employees.map((e) => String(e["department"] ?? ""))),
    mainDepartments: uniq(employees.map((e) => String(e["main_department"] ?? ""))),
    sectors: uniq(employees.map((e) => String(e["sector"] ?? ""))),
    statuses: uniq(employees.map((e) => String(e["status"] ?? ""))),
    jobTitles: uniq(employees.map((e) => String(e["job_title"] ?? ""))),
    jobLevels: uniq(employees.map((e) => String(e["job_level"] ?? ""))),
    paths: uniq(employees.map((e) => String(e["career_path"] ?? ""))),
  }), [employees]);

  const filtered = useMemo(() => {
    if (!applied) return [];
    const emp = String(applied.employee ?? "").trim().toLowerCase();
    return employees.filter((e) => {
      if (applied.branch && e["branch"] !== applied.branch) return false;
      if (applied.department && e["department"] !== applied.department) return false;
      if (applied.mainDepartment && e["main_department"] !== applied.mainDepartment) return false;
      if (applied.sector && e["sector"] !== applied.sector) return false;
      if (applied.status && e["status"] !== applied.status) return false;
      if (applied.jobTitle && e["job_title"] !== applied.jobTitle) return false;
      if (applied.jobLevel && e["job_level"] !== applied.jobLevel) return false;
      if (applied.path && e["career_path"] !== applied.path) return false;
      if (emp && !String(e["full_name"] ?? "").toLowerCase().includes(emp) && !String(e["emp_no"] ?? "").includes(emp)) return false;
      return true;
    });
  }, [employees, applied]);

  const totalPages = Math.max(1, filtered.length);
  const currentEmp = filtered[Math.min(page - 1, totalPages - 1)];

  const exportData: ExportData = useMemo(() => ({
    filename: `employee-data-report`,
    sheetName: "بيانات الموظفين",
    headers: ["الرقم الوظيفي", "الاسم", "الفرع", "القسم", "القسم الرئيسي", "القطاع", "المسمى الوظيفي", "الوظيفة", "الحالة", "تاريخ التعيين", "الراتب الأساسي"],
    rows: filtered.map((e) => [
      e["emp_no"], e["full_name"], e["branch"], e["department"],
      e["main_department"], e["sector"], e["job_title"], e["job_level"],
      e["status"], e["hire_date"], e["basic_salary"],
    ]),
  }), [filtered]);

  return (
    <AppShell>
      {/* Page Header */}
      <div className="mb-3 flex items-center justify-between border-b border-[#0070c0]/30 pb-2">
        <div className="flex items-center gap-2">
          <MaterialIcon name="badge" size={20} className="text-[#0070c0]" />
          <h1 className="text-[15px] font-extrabold text-slate-800">تقرير بيانات الموظفين</h1>
        </div>
        <div className="text-[11px] text-slate-400">التقارير / بيانات الموظفين</div>
      </div>

      {/* Filter Bar */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-[#f8fafd] p-4" dir="rtl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
          <SelectFilter label="الفروع" value={filters.branch} options={opts.branches} onChange={(v) => setFilters((p) => ({ ...p, branch: v }))} />
          <SelectFilter label="القسم" value={filters.department} options={opts.departments} onChange={(v) => setFilters((p) => ({ ...p, department: v }))} />
          <SelectFilter label="الحالة" value={filters.status} options={opts.statuses} onChange={(v) => setFilters((p) => ({ ...p, status: v }))} />
          <SelectFilter label="الوظيفة الحالية" value={filters.jobTitle} options={opts.jobTitles} onChange={(v) => setFilters((p) => ({ ...p, jobTitle: v }))} />
          <SelectFilter label="القسم الرئيسي" value={filters.mainDepartment} options={opts.mainDepartments} onChange={(v) => setFilters((p) => ({ ...p, mainDepartment: v }))} />
          <SelectFilter label="القطاع" value={filters.sector} options={opts.sectors} onChange={(v) => setFilters((p) => ({ ...p, sector: v }))} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SelectFilter label="المستوى الوظيفي" value={filters.jobLevel} options={opts.jobLevels} onChange={(v) => setFilters((p) => ({ ...p, jobLevel: v }))} />
          <SelectFilter label="المسار" value={filters.path} options={opts.paths} onChange={(v) => setFilters((p) => ({ ...p, path: v }))} />
          <div className="col-span-2">
            <TextFilter label="موظف" value={filters.employee} placeholder="البحث بالإسم أو رقم الموظف" onChange={(v) => setFilters((p) => ({ ...p, employee: v }))} />
          </div>
        </div>
        <div className="mt-3 flex justify-center gap-2">
          <button
            onClick={() => { setApplied({ ...filters }); setPage(1); }}
            className="flex items-center gap-1 rounded bg-[#0070c0] px-6 py-1.5 text-[12px] font-bold text-white hover:bg-[#005fa3] transition"
          >
            <MaterialIcon name="search" size={15} />
            بحث
          </button>
          <button
            onClick={() => { setFilters(emptyFilters); setApplied(null); setPage(1); }}
            className="rounded border border-slate-200 bg-white px-4 py-1.5 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            مسح
          </button>
        </div>
      </div>

      {/* Report */}
      {!applied ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-slate-400" dir="rtl">
          <MaterialIcon name="badge" size={38} className="text-slate-300" />
          <div className="text-[13px] font-bold">حدد الفلاتر ثم اضغط بحث لعرض تقرير بيانات الموظفين</div>
        </div>
      ) : empLoading ? (
        <div className="mt-8 text-center text-sm font-bold text-muted-foreground">جارٍ تحميل البيانات...</div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center font-bold text-slate-400" dir="rtl">
          لا يوجد موظفون يطابقون معايير البحث
        </div>
      ) : (
        <ReportDocumentViewer
          title="تقرير بيانات الموظفين"
          subtitle={`${filtered.length} موظف`}
          companyName="شركة الحلول الخبيرة"
          totalRecords={filtered.length}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          exportData={exportData}
        >
          {currentEmp && (
            <EmployeeCard
              emp={currentEmp as Record<string, any>}
              entitlements={entitlements as Record<string, any>[]}
              deductions={deductions as Record<string, any>[]}
              leaveRequests={leaveRequests as Record<string, any>[]}
              seq={page}
              total={totalPages}
            />
          )}
        </ReportDocumentViewer>
      )}
    </AppShell>
  );
}
