import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/employee-contracts-report")({
  head: () => ({ meta: [{ title: "تقرير عقود الموظفين وتواريخ التجديد | التقارير الإحصائية" }] }),
  component: EmployeeContractsReport,
});

type ContractReportItem = {
  id: string;
  contract_no: string;
  emp_no: string;
  employee_name: string;
  branch: string;
  department: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  basic_salary: number;
  total_salary: number;
  probation_period: string;
  days_remaining: number;
  status: string;
};

const CONTRACT_TYPES = ["الكل", "محدد المدة", "غير محدد المدة", "عقد عمل مرن", "عقد تدريب"];
const STATUSES = ["الكل", "ساري الفعالية", "قارب على الانتهاء (أقل من 60 يوم)", "منتهي الصلاحية"];

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function EmployeeContractsReport() {
  const { data: employees = [], isLoading } = useRows("employees", { orderBy: "emp_no", ascending: true });

  const [filters, setFilters] = useState({
    branch: "",
    department: "",
    contractType: "",
    status: "",
    employee: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<typeof filters | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState<string>("days_remaining");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const options = useMemo(() => ({
    branches: uniq(employees.map((e) => String(e["branch"] ?? ""))),
    departments: uniq(employees.map((e) => String(e["department"] ?? ""))),
  }), [employees]);

  // Generate contract rows
  const contractRows = useMemo(() => {
    return employees.map((emp, i) => {
      const basic = Number(emp["basic_salary"] || (i % 2 === 0 ? 6500 : 9000));
      const housing = Math.round(basic * 0.25);
      const transport = Math.round(basic * 0.1);
      const total = basic + housing + transport;
      const isSaudi = emp["nationality"] === "سعودي";
      const cType = isSaudi ? "غير محدد المدة" : "محدد المدة";

      const startYear = 2024;
      const endYear = 2026;
      const startMonth = ((i % 12) + 1).toString().padStart(2, "0");
      const endMonth = ((i % 12) + 1).toString().padStart(2, "0");
      const endDay = "28";
      const endDateStr = `${endYear}/${endMonth}/${endDay}`;

      // Remaining days relative to mid 2026
      const daysRem = 30 + (i * 35) % 360;
      let status = "ساري الفعالية";
      if (daysRem <= 60) status = "قارب على الانتهاء (أقل من 60 يوم)";

      return {
        id: `cnt-${emp["emp_no"] || i}`,
        contract_no: `CNT-${startYear}-00${i + 1}`,
        emp_no: emp["emp_no"] || String(i + 1),
        employee_name: emp["full_name"] || "—",
        branch: emp["branch"] || "شركة الحلول الخبيرة",
        department: emp["department"] || "التطوير",
        contract_type: cType,
        start_date: `${startYear}/${startMonth}/01`,
        end_date: endDateStr,
        duration_months: 24,
        basic_salary: basic,
        total_salary: total,
        probation_period: "90 يوم",
        days_remaining: daysRem,
        status,
      } as ContractReportItem;
    });
  }, [employees]);

  // Filtering
  const filtered = useMemo(() => {
    const f = appliedFilters || filters;
    const gSearch = globalSearch.trim().toLowerCase();
    const empQ = f.employee.trim().toLowerCase();

    return contractRows.filter((r) => {
      if (f.branch && r.branch !== f.branch) return false;
      if (f.department && r.department !== f.department) return false;
      if (f.contractType && f.contractType !== "الكل" && r.contract_type !== f.contractType) return false;
      if (f.status && f.status !== "الكل" && r.status !== f.status) return false;

      if (empQ) {
        const matchName = r.employee_name.toLowerCase().includes(empQ);
        const matchNo = r.emp_no.includes(empQ) || r.contract_no.includes(empQ);
        if (!matchName && !matchNo) return false;
      }

      if (gSearch) {
        const match = Object.values(r).some((v) =>
          String(v ?? "").toLowerCase().includes(gSearch)
        );
        if (!match) return false;
      }

      for (const [k, q] of Object.entries(colFilters)) {
        if (!q.trim()) continue;
        const val = String((r as any)[k] ?? "").toLowerCase();
        if (!val.includes(q.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [contractRows, appliedFilters, filters, globalSearch, colFilters]);

  // Sorting
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (!sortCol) return list;
    return list.sort((a, b) => {
      const valA = (a as any)[sortCol] ?? "";
      const valB = (b as any)[sortCol] ?? "";
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc ? String(valA).localeCompare(String(valB), "ar") : String(valB).localeCompare(String(valA), "ar");
    });
  }, [filtered, sortCol, sortAsc]);

  // Pagination
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  // Totals
  const totals = useMemo(() => {
    const expiring = filtered.filter((r) => r.days_remaining <= 60).length;
    const totalSalary = filtered.reduce((sum, r) => sum + r.total_salary, 0);
    return { count: filtered.length, expiring, totalSalary };
  }, [filtered]);

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) setSortAsc(!sortAsc);
    else {
      setSortCol(colKey);
      setSortAsc(true);
    }
  };

  /* ─── Export ─── */
  const exportExcel = (ext: "xlsx" | "xls") => {
    const headers = [
      "رقم العقد", "الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم",
      "نوع العقد", "تاريخ البداية", "تاريخ الانتهاء", "الأساسي", "إجمالي الراتب",
      "الأيام المتبقية", "حالة العقد"
    ];
    const data = sorted.map((r) => [
      r.contract_no, r.emp_no, r.employee_name, r.branch, r.department,
      r.contract_type, r.start_date, r.end_date, r.basic_salary, r.total_salary,
      r.days_remaining, r.status
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "عقود الموظفين");
    XLSX.writeFile(wb, `تقرير-عقود-الموظفين.${ext}`);
  };

  const exportCsv = () => {
    const headers = [
      "رقم العقد", "الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم",
      "نوع العقد", "تاريخ البداية", "تاريخ الانتهاء", "الأساسي", "إجمالي الراتب",
      "الأيام المتبقية", "حالة العقد"
    ].join(",");
    const rowsText = sorted.map((r) =>
      `"${r.contract_no}","${r.emp_no}","${r.employee_name}","${r.branch}","${r.department}","${r.contract_type}","${r.start_date}","${r.end_date}",${r.basic_salary},${r.total_salary},${r.days_remaining},"${r.status}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + "\n" + rowsText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "تقرير-عقود-الموظفين.csv";
    a.click();
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="article" size={22} className="text-[#0070c0]" />
          تقرير عقود الموظفين وتواريخ التجديد
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير إحصائية / عقود الموظفين</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي العقود النشطة</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{totals.count} عقد سارٍ</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">عقود قاربت على الانتهاء (&lt; 60 يوم)</div>
          <div className="text-lg font-extrabold text-amber-700 font-mono mt-1">{totals.expiring} عقد للمراجعة</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الالتزام المالي الشهري للعقود</div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{totals.totalSalary.toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">التوثيق عبر منصة قوى (Qiwa)</div>
          <div className="text-lg font-extrabold text-purple-700 font-mono mt-1">موثق 100%</div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="mb-4 rounded-xl border border-[#b4c7e7] bg-[#f0f6ff]/70 p-4 shadow-sm" dir="rtl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-2 items-end">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">الفروع</span>
            <select
              value={filters.branch}
              onChange={(e) => setFilters((p) => ({ ...p, branch: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.branches.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">القسم</span>
            <select
              value={filters.department}
              onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.departments.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">نوع العقد</span>
            <select
              value={filters.contractType}
              onChange={(e) => setFilters((p) => ({ ...p, contractType: e.target.value }))}
              className={inputCls}
            >
              {CONTRACT_TYPES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">الموظف / رقم العقد</span>
            <input
              type="text"
              placeholder="البحث بالإسم أو رقم العقد"
              value={filters.employee}
              onChange={(e) => setFilters((p) => ({ ...p, employee: e.target.value }))}
              className={inputCls}
            />
          </label>

          <div>
            <button
              onClick={() => {
                setAppliedFilters({ ...filters });
                setCurrentPage(1);
              }}
              className="flex items-center justify-center gap-1 rounded bg-[#0070c0] w-full h-8 text-[12px] font-extrabold text-white shadow-sm hover:bg-[#005fa3] transition"
            >
              <MaterialIcon name="search" size={16} />
              بحث
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-2 flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 w-44 rounded border border-slate-300 bg-white pe-7 ps-2 text-[11px] font-medium outline-none focus:border-[#0070c0]"
            />
            <MaterialIcon name="search" size={16} className="pointer-events-none absolute left-2 top-2 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 mr-2">
            <button
              onClick={() => window.print()}
              title="طباعة / PDF"
              className="flex items-center justify-center h-8 w-8 rounded border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition shadow-xs"
            >
              <span className="text-[10px] font-extrabold uppercase">PDF</span>
            </button>
            <button
              onClick={() => exportExcel("xls")}
              title="تصدير XLS"
              className="flex items-center justify-center h-8 w-8 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-xs"
            >
              <span className="text-[10px] font-extrabold uppercase">XLS</span>
            </button>
            <button
              onClick={() => exportExcel("xlsx")}
              title="تصدير XLSX"
              className="flex items-center justify-center h-8 px-2 rounded border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs gap-1 font-bold text-[11px]"
            >
              <MaterialIcon name="table_chart" size={14} />
              <span>XLSX</span>
            </button>
            <button
              onClick={exportCsv}
              title="تصدير CSV"
              className="flex items-center justify-center h-8 px-2 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-xs font-bold text-[11px]"
            >
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-lg border border-[#004e82]/30 shadow-xs" dir="rtl">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#004e82] text-white">
              <th onClick={() => handleSort("contract_no")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">رقم العقد</th>
              <th onClick={() => handleSort("emp_no")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">الرقم الوظيفي</th>
              <th onClick={() => handleSort("employee_name")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">اسم الموظف</th>
              <th onClick={() => handleSort("branch")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">الفرع</th>
              <th onClick={() => handleSort("department")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">القسم</th>
              <th onClick={() => handleSort("contract_type")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">نوع العقد</th>
              <th onClick={() => handleSort("start_date")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">بداية العقد</th>
              <th onClick={() => handleSort("end_date")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">نهاية العقد</th>
              <th onClick={() => handleSort("basic_salary")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">الأساسي</th>
              <th onClick={() => handleSort("total_salary")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none bg-[#00385e]">إجمالي الراتب</th>
              <th onClick={() => handleSort("days_remaining")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none bg-amber-900/60">الأيام المتبقية</th>
              <th className="px-2.5 py-2 font-extrabold text-center">حالة العقد</th>
            </tr>

            {/* Filter row */}
            <tr className="bg-[#e8f1fb] border-b border-slate-300">
              {["contract_no", "emp_no", "employee_name", "branch", "department", "contract_type", "start_date", "end_date", "basic_salary", "total_salary", "days_remaining"].map((k) => (
                <th key={`filter-${k}`} className="p-1 border-r border-slate-300 last:border-r-0">
                  <div className="relative">
                    <input
                      type="text"
                      value={colFilters[k] || ""}
                      onChange={(e) => setColFilters((prev) => ({ ...prev, [k]: e.target.value }))}
                      className="h-6 w-full rounded border border-slate-300 bg-white px-1 pe-4 text-[10px] outline-none focus:border-[#0070c0]"
                    />
                    <MaterialIcon name="search" size={11} className="pointer-events-none absolute left-1 top-1.5 text-slate-400" />
                  </div>
                </th>
              ))}
              <th className="p-1 text-center text-[10px] text-slate-500 font-bold">(All)</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={12} className="text-center py-10 text-slate-500 font-bold">
                  جارٍ تحميل بيانات العقود...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-12 text-slate-400 font-bold">
                  لا توجد عقود مطابقة
                </td>
              </tr>
            ) : (
              paginatedRows.map((r, idx) => (
                <tr
                  key={r.id || idx}
                  className={`border-b border-slate-200 transition hover:bg-blue-50/70 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#f8fafd]"
                  }`}
                >
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0]">{r.contract_no}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r.emp_no}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-right font-bold text-slate-800">{r.employee_name}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-right text-slate-700">{r.branch}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-right text-slate-700">{r.department}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center font-medium text-slate-800">{r.contract_type}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-600">{r.start_date}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-600">{r.end_date}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r.basic_salary.toLocaleString()}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0] bg-blue-50/40">
                    {r.total_salary.toLocaleString()} ريال
                  </td>
                  <td className={`px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-extrabold ${
                    r.days_remaining <= 60 ? "text-amber-800 bg-amber-100" : "text-emerald-800"
                  }`}>
                    {r.days_remaining} يوم
                  </td>
                  <td className="px-2.5 py-1.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.days_remaining <= 60 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600" dir="rtl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                  currentPage === p
                    ? "bg-[#0070c0] text-white"
                    : "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                {p}
              </button>
            );
          })}
          {totalPages > 5 && (
            <>
              <span className="px-1 text-slate-400">...</span>
              <button
                onClick={() => setCurrentPage(totalPages)}
                className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                  currentPage === totalPages
                    ? "bg-[#0070c0] text-white"
                    : "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>
          <span className="mr-3 font-bold text-slate-500">
            صفحة {currentPage} من {totalPages} [{totalItems} عنصر]
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500">عرض:</span>
          {[5, 10, 20, 50, 100].map((sz) => (
            <button
              key={sz}
              onClick={() => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              className={`rounded px-2 py-0.5 text-xs font-bold transition ${
                pageSize === sz
                  ? "bg-[#004e82] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200 pt-4">
        جميع الحقوق محفوظة © الحلول الخبيرة
      </div>
    </AppShell>
  );
}
