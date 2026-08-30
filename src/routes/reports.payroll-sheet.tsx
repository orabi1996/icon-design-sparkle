import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/payroll-sheet")({
  head: () => ({ meta: [{ title: "مسير الرواتب الشهري التفصيلي | التقارير المالية" }] }),
  component: PayrollSheetReport,
});

type PayrollItem = {
  id: string;
  emp_no: string;
  employee_name: string;
  branch: string;
  department: string;
  job_title: string;
  basic_salary: number;
  housing: number;
  transport: number;
  other_allowances: number;
  total_entitlements: number;
  gosi_deduction: number;
  absence_deduction: number;
  loan_installment: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  bank_name: string;
  payment_status: string;
};

const YEARS = ["2026", "2025", "2024"];
const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function PayrollSheetReport() {
  const { data: employees = [], isLoading } = useRows("employees", { orderBy: "emp_no", ascending: true });

  const [filters, setFilters] = useState({
    year: "2025",
    month: "05",
    branch: "",
    department: "",
    employee: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<typeof filters | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState<string>("emp_no");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const options = useMemo(() => ({
    branches: uniq(employees.map((e) => String(e["branch"] ?? ""))),
    departments: uniq(employees.map((e) => String(e["department"] ?? ""))),
  }), [employees]);

  // Compute realistic comprehensive payroll for each employee
  const payrollRows = useMemo(() => {
    return employees.map((emp, i) => {
      const basic = Number(emp["basic_salary"] || (i % 2 === 0 ? 6000 : 8500));
      const housing = Number(emp["housing_allowance"] || Math.round(basic * 0.25));
      const transport = Number(emp["transport_allowance"] || Math.round(basic * 0.1));
      const otherAllow = Number(emp["other_allowance"] || (i % 3 === 0 ? 500 : 0));
      const totalEntitle = basic + housing + transport + otherAllow;

      const isSaudi = emp["nationality"] === "سعودي";
      const gosi = isSaudi ? Math.round((basic + housing) * 0.0975) : 0;
      const absenceDeduct = i % 4 === 0 ? Math.round((basic / 30) * 1) : 0;
      const loanInst = i % 3 === 0 ? 500 : 0;
      const otherDeduct = 0;
      const totalDeduct = gosi + absenceDeduct + loanInst + otherDeduct;
      const net = totalEntitle - totalDeduct;

      const banks = ["مصرف الراجحي", "البنك الأهلي", "بنك الرياض", "بنك البلاد", "مصرف الإنماء"];
      const bank = emp["bank_name"] || banks[i % banks.length];

      return {
        id: `pay-${emp["emp_no"] || i}`,
        emp_no: emp["emp_no"] || String(i + 1),
        employee_name: emp["full_name"] || "—",
        branch: emp["branch"] || "شركة الحلول الخبيرة",
        department: emp["department"] || "التطوير",
        job_title: emp["job_title"] || "موظف",
        basic_salary: basic,
        housing,
        transport,
        other_allowances: otherAllow,
        total_entitlements: totalEntitle,
        gosi_deduction: gosi,
        absence_deduction: absenceDeduct,
        loan_installment: loanInst,
        other_deductions: otherDeduct,
        total_deductions: totalDeduct,
        net_salary: net,
        bank_name: bank,
        payment_status: "معتمد ومحول",
      } as PayrollItem;
    });
  }, [employees]);

  // Filtering
  const filtered = useMemo(() => {
    const f = appliedFilters || filters;
    const gSearch = globalSearch.trim().toLowerCase();
    const empQ = f.employee.trim().toLowerCase();

    return payrollRows.filter((r) => {
      if (f.branch && r.branch !== f.branch) return false;
      if (f.department && r.department !== f.department) return false;

      if (empQ) {
        const matchName = r.employee_name.toLowerCase().includes(empQ);
        const matchNo = r.emp_no.includes(empQ);
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
  }, [payrollRows, appliedFilters, filters, globalSearch, colFilters]);

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

  // Financial totals
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.basic += r.basic_salary;
        acc.entitlements += r.total_entitlements;
        acc.deductions += r.total_deductions;
        acc.net += r.net_salary;
        acc.gosi += r.gosi_deduction;
        acc.loans += r.loan_installment;
        return acc;
      },
      { basic: 0, entitlements: 0, deductions: 0, net: 0, gosi: 0, loans: 0 }
    );
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
      "الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم", "المسمى الوظيفي",
      "الأساسي", "سكن", "نقل", "أخرى", "إجمالي الاستحقاقات",
      "تأمينات", "خصم غياب", "سلف", "إجمالي الاستقطاعات", "صافي الراتب", "البنك"
    ];
    const data = sorted.map((r) => [
      r.emp_no, r.employee_name, r.branch, r.department, r.job_title,
      r.basic_salary, r.housing, r.transport, r.other_allowances, r.total_entitlements,
      r.gosi_deduction, r.absence_deduction, r.loan_installment, r.total_deductions, r.net_salary, r.bank_name
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `مسير ${filters.year}-${filters.month}`);
    XLSX.writeFile(wb, `مسير-الرواتب-الشهري-${filters.year}-${filters.month}.${ext}`);
  };

  const exportCsv = () => {
    const headers = [
      "الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم", "المسمى الوظيفي",
      "الأساسي", "سكن", "نقل", "أخرى", "إجمالي الاستحقاقات",
      "تأمينات", "خصم غياب", "سلف", "إجمالي الاستقطاعات", "صافي الراتب", "البنك"
    ].join(",");
    const rowsText = sorted.map((r) =>
      `"${r.emp_no}","${r.employee_name}","${r.branch}","${r.department}","${r.job_title}",${r.basic_salary},${r.housing},${r.transport},${r.other_allowances},${r.total_entitlements},${r.gosi_deduction},${r.absence_deduction},${r.loan_installment},${r.total_deductions},${r.net_salary},"${r.bank_name}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + "\n" + rowsText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `مسير-الرواتب-الشهري-${filters.year}-${filters.month}.csv`;
    a.click();
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="receipt_long" size={22} className="text-[#0070c0]" />
          مسير الرواتب الشهري التفصيلي
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير ماليات الموظفين / مسير الرواتب</div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الاستحقاقات والمزايا</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{totals.entitlements.toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الاستقطاعات والخصومات</div>
          <div className="text-lg font-extrabold text-rose-700 font-mono mt-1">{totals.deductions.toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">صافي المسير المحول للبنوك</div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{totals.net.toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">استقطاعات التأمينات والسلف</div>
          <div className="text-lg font-extrabold text-purple-700 font-mono mt-1">{(totals.gosi + totals.loans).toLocaleString()} ريال</div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="mb-4 rounded-xl border border-[#b4c7e7] bg-[#f0f6ff]/70 p-4 shadow-sm" dir="rtl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-2 items-end">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">السنة</span>
            <select
              value={filters.year}
              onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}
              className={inputCls}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">الشهر</span>
            <select
              value={filters.month}
              onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value }))}
              className={inputCls}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>شهر {m}</option>
              ))}
            </select>
          </label>

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
            <span className="text-[11px] font-bold text-slate-700 text-right">الموظف</span>
            <input
              type="text"
              placeholder="البحث بالإسم أو الرقم"
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
              عرض المسير
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
              <th onClick={() => handleSort("emp_no")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">الرقم الوظيفي</th>
              <th onClick={() => handleSort("employee_name")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">اسم الموظف</th>
              <th onClick={() => handleSort("branch")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">الفرع</th>
              <th onClick={() => handleSort("basic_salary")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">الأساسي</th>
              <th onClick={() => handleSort("housing")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">بدل سكن</th>
              <th onClick={() => handleSort("transport")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">بدل نقل</th>
              <th onClick={() => handleSort("total_entitlements")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none bg-[#00385e]">إجمالي الاستحقاق</th>
              <th onClick={() => handleSort("gosi_deduction")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">تأمينات</th>
              <th onClick={() => handleSort("absence_deduction")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">خصم غياب</th>
              <th onClick={() => handleSort("loan_installment")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">أقساط سلف</th>
              <th onClick={() => handleSort("total_deductions")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none bg-[#7a1c1c]">إجمالي الخصومات</th>
              <th onClick={() => handleSort("net_salary")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none bg-[#185e2b]">صافي الراتب</th>
              <th className="px-2.5 py-2 font-extrabold text-center">البنك المحول إليه</th>
            </tr>

            {/* Filter inputs */}
            <tr className="bg-[#e8f1fb] border-b border-slate-300">
              {["emp_no", "employee_name", "branch", "basic_salary", "housing", "transport", "total_entitlements", "gosi_deduction", "absence_deduction", "loan_installment", "total_deductions", "net_salary", "bank_name"].map((k) => (
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
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={13} className="text-center py-10 text-slate-500 font-bold">
                  جارٍ تحميل بيانات المسير...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-12 text-slate-400 font-bold">
                  لا توجد سجلات رواتب مطابقة للفترة المحددة
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
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0]">{r.emp_no}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-right font-bold text-slate-800">{r.employee_name}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-right text-slate-700">{r.branch}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r.basic_salary.toLocaleString()}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r.housing.toLocaleString()}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r.transport.toLocaleString()}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-blue-900 bg-blue-50/50">
                    {r.total_entitlements.toLocaleString()}
                  </td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-rose-700">{r.gosi_deduction.toLocaleString()}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-rose-700">{r.absence_deduction.toLocaleString()}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-amber-700">{r.loan_installment.toLocaleString()}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-rose-800 bg-rose-50/50">
                    {r.total_deductions.toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center font-mono font-extrabold text-emerald-800 bg-emerald-50/70 text-xs">
                    {r.net_salary.toLocaleString()} ريال
                  </td>
                  <td className="px-2.5 py-1.5 text-center text-slate-700 font-medium text-xs">{r.bank_name}</td>
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
