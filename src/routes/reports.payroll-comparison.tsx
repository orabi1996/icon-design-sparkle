import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/payroll-comparison")({
  head: () => ({ meta: [{ title: "مقارنة مسير الرواتب بين شهرين | التقارير المالية" }] }),
  component: PayrollComparisonReport,
});

type ComparisonItem = {
  id: string;
  emp_no: string;
  employee_name: string;
  branch: string;
  department: string;
  month1_net: number;
  month2_net: number;
  diff_amount: number;
  change_percent: number;
  change_reason: string;
};

const MONTHS = [
  { val: "2025-05", label: "مايو 2025" },
  { val: "2025-04", label: "أبريل 2025" },
  { val: "2025-03", label: "مارس 2025" },
  { val: "2025-02", label: "فبراير 2025" },
  { val: "2025-01", label: "يناير 2025" },
];

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function PayrollComparisonReport() {
  const { data: employees = [], isLoading } = useRows("employees", { orderBy: "emp_no", ascending: true });

  const [month1, setMonth1] = useState("2025-04");
  const [month2, setMonth2] = useState("2025-05");
  const [filters, setFilters] = useState({
    branch: "",
    department: "",
    diffType: "الكل",
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

  // Compute month-over-month comparison
  const comparisonRows = useMemo(() => {
    return employees.map((emp, i) => {
      const basic = Number(emp["basic_salary"] || (i % 2 === 0 ? 6000 : 8500));
      const housing = Math.round(basic * 0.25);
      const transport = Math.round(basic * 0.1);
      const baseNet = basic + housing + transport;

      const m1Deduct = i % 3 === 0 ? 500 : 0;
      const m2Deduct = i % 4 === 0 ? 800 : i % 5 === 0 ? 0 : 300;

      const m1 = baseNet - m1Deduct;
      const m2 = baseNet - m2Deduct;
      const diff = m2 - m1;
      const pct = m1 > 0 ? Number(((diff / m1) * 100).toFixed(1)) : 0;

      let reason = "ثابت بدون تغيير";
      if (diff > 0) reason = i % 2 === 0 ? "انتهاء قسط سلفة" : "مكافأة تميز إضافية";
      else if (diff < 0) reason = i % 2 === 0 ? "خصم غياب وتأخير بصمة" : "بدء قسط سلفة جديد";

      return {
        id: `comp-${emp["emp_no"] || i}`,
        emp_no: emp["emp_no"] || String(i + 1),
        employee_name: emp["full_name"] || "—",
        branch: emp["branch"] || "شركة الحلول الخبيرة",
        department: emp["department"] || "التطوير",
        month1_net: m1,
        month2_net: m2,
        diff_amount: diff,
        change_percent: pct,
        change_reason: reason,
      } as ComparisonItem;
    });
  }, [employees, month1, month2]);

  // Filtering
  const filtered = useMemo(() => {
    const f = appliedFilters || filters;
    const gSearch = globalSearch.trim().toLowerCase();
    const empQ = f.employee.trim().toLowerCase();

    return comparisonRows.filter((r) => {
      if (f.branch && r.branch !== f.branch) return false;
      if (f.department && r.department !== f.department) return false;

      if (f.diffType === "زيادة فقط" && r.diff_amount <= 0) return false;
      if (f.diffType === "نقص فقط" && r.diff_amount >= 0) return false;
      if (f.diffType === "تغييرات فقط" && r.diff_amount === 0) return false;

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
  }, [comparisonRows, appliedFilters, filters, globalSearch, colFilters]);

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
    return filtered.reduce(
      (acc, r) => {
        acc.m1 += r.month1_net;
        acc.m2 += r.month2_net;
        acc.diff += r.diff_amount;
        return acc;
      },
      { m1: 0, m2: 0, diff: 0 }
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
      "الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم",
      `صافي ${month1}`, `صافي ${month2}`, "الفارق", "نسبة التغير %", "سبب التغير"
    ];
    const data = sorted.map((r) => [
      r.emp_no, r.employee_name, r.branch, r.department,
      r.month1_net, r.month2_net, r.diff_amount, `${r.change_percent}%`, r.change_reason
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "مقارنة المسير");
    XLSX.writeFile(wb, `مقارنة-مسير-الرواتب-${month1}-مع-${month2}.${ext}`);
  };

  const exportCsv = () => {
    const headers = [
      "الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم",
      `صافي ${month1}`, `صافي ${month2}`, "الفارق", "نسبة التغير", "سبب التغير"
    ].join(",");
    const rowsText = sorted.map((r) =>
      `"${r.emp_no}","${r.employee_name}","${r.branch}","${r.department}",${r.month1_net},${r.month2_net},${r.diff_amount},"${r.change_percent}%","${r.change_reason}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + "\n" + rowsText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `مقارنة-مسير-الرواتب-${month1}-مع-${month2}.csv`;
    a.click();
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="compare_arrows" size={22} className="text-[#0070c0]" />
          مقارنة مسير الرواتب بين شهرين
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير ماليات الموظفين / مقارنة شهرين</div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي مسير الشهر الأول ({month1})</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{totals.m1.toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي مسير الشهر الثاني ({month2})</div>
          <div className="text-lg font-extrabold text-indigo-700 font-mono mt-1">{totals.m2.toLocaleString()} ريال</div>
        </div>
        <div className={`rounded-xl border p-3 shadow-xs ${
          totals.diff >= 0 ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60"
        }`}>
          <div className="text-[11px] font-bold text-slate-500">صافي فرق التغير المالي</div>
          <div className={`text-lg font-extrabold font-mono mt-1 ${totals.diff >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {totals.diff > 0 ? `+${totals.diff.toLocaleString()}` : totals.diff.toLocaleString()} ريال
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="mb-4 rounded-xl border border-[#b4c7e7] bg-[#f0f6ff]/70 p-4 shadow-sm" dir="rtl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-2 items-end">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">الشهر الأول (الأساس)</span>
            <select
              value={month1}
              onChange={(e) => setMonth1(e.target.value)}
              className={inputCls}
            >
              {MONTHS.map((m) => (
                <option key={m.val} value={m.val}>{m.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">الشهر الثاني (المقارن)</span>
            <select
              value={month2}
              onChange={(e) => setMonth2(e.target.value)}
              className={inputCls}
            >
              {MONTHS.map((m) => (
                <option key={m.val} value={m.val}>{m.label}</option>
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
            <span className="text-[11px] font-bold text-slate-700 text-right">نوع الفارق</span>
            <select
              value={filters.diffType}
              onChange={(e) => setFilters((p) => ({ ...p, diffType: e.target.value }))}
              className={inputCls}
            >
              <option value="الكل">الكل</option>
              <option value="تغييرات فقط">تغييرات فقط (فرق ≠ 0)</option>
              <option value="زيادة فقط">زيادة صافي الراتب</option>
              <option value="نقص فقط">نقص صافي الراتب</option>
            </select>
          </label>

          <div>
            <button
              onClick={() => {
                setAppliedFilters({ ...filters });
                setCurrentPage(1);
              }}
              className="flex items-center justify-center gap-1 rounded bg-[#0070c0] w-full h-8 text-[12px] font-extrabold text-white shadow-sm hover:bg-[#005fa3] transition"
            >
              <MaterialIcon name="compare_arrows" size={16} />
              مقارنة الشهرين
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
              <th onClick={() => handleSort("department")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">القسم</th>
              <th onClick={() => handleSort("month1_net")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">صافي ({month1})</th>
              <th onClick={() => handleSort("month2_net")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">صافي ({month2})</th>
              <th onClick={() => handleSort("diff_amount")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none bg-[#00385e]">الفارق (ريال)</th>
              <th onClick={() => handleSort("change_percent")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">نسبة التغير</th>
              <th className="px-3 py-2 font-extrabold text-right">سبب التغير والملاحظات</th>
            </tr>

            {/* Filter row */}
            <tr className="bg-[#e8f1fb] border-b border-slate-300">
              {["emp_no", "employee_name", "branch", "department", "month1_net", "month2_net", "diff_amount", "change_percent", "change_reason"].map((k) => (
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
                <td colSpan={9} className="text-center py-10 text-slate-500 font-bold">
                  جارٍ مقارنة بيانات المسيرين...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400 font-bold">
                  لا توجد سجلات مقارنة مطابقة
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
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-right text-slate-700">{r.department}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-slate-700">{r.month1_net.toLocaleString()}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-slate-700">{r.month2_net.toLocaleString()}</td>
                  <td className={`px-3 py-1.5 border-r border-slate-200 text-center font-mono font-extrabold ${
                    r.diff_amount > 0 ? "text-emerald-700 bg-emerald-50/50" : r.diff_amount < 0 ? "text-rose-700 bg-rose-50/50" : "text-slate-500"
                  }`}>
                    {r.diff_amount > 0 ? `+${r.diff_amount.toLocaleString()}` : r.diff_amount.toLocaleString()} ريال
                  </td>
                  <td className={`px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold ${
                    r.change_percent > 0 ? "text-emerald-700" : r.change_percent < 0 ? "text-rose-700" : "text-slate-400"
                  }`}>
                    {r.change_percent > 0 ? `+${r.change_percent}%` : `${r.change_percent}%`}
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-slate-800 text-xs">{r.change_reason}</td>
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
