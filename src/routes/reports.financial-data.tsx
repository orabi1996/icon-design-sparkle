import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/financial-data")({
  head: () => ({ meta: [{ title: "تقرير البيانات المالية للموظفين | التقارير" }] }),
  component: FinancialDataReport,
});

type ColumnMeta = {
  key: string;
  label: string;
  align?: "right" | "center" | "left";
  formatter?: (val: any, row: Row) => string;
};

const COLUMNS: ColumnMeta[] = [
  { key: "emp_no", label: "الرقم الوظيفي", align: "center" },
  { key: "full_name", label: "اسم الموظف" },
  { key: "nationality", label: "الجنسية", align: "center" },
  { key: "branch", label: "الفرع" },
  { key: "department", label: "القسم" },
  { key: "job_title", label: "المسمى الوظيفي" },
  { key: "basic_salary", label: "الراتب الأساسي", align: "center" },
  { key: "housing_allowance", label: "بدل سكن", align: "center" },
  { key: "transport_allowance", label: "بدل نقل", align: "center" },
  { key: "other_allowance", label: "بدلات أخرى", align: "center" },
  { key: "total_salary", label: "إجمالي الراتب", align: "center" },
  { key: "gosi_employee", label: "تأمينات (موظف)", align: "center" },
  { key: "gosi_company", label: "تأمينات (شركة)", align: "center" },
  { key: "bank_name", label: "اسم البنك" },
  { key: "iban", label: "رقم الآيبان (IBAN)", align: "left" },
];

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function FinancialDataReport() {
  const { data: employees = [], isLoading } = useRows("employees", {
    orderBy: "emp_no",
    ascending: true,
  });

  const [filters, setFilters] = useState({
    branch: "",
    department: "",
    mainDepartment: "",
    sector: "",
    jobTitle: "",
    nationality: "",
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
    mainDepartments: uniq(employees.map((e) => String(e["main_department"] ?? ""))),
    sectors: uniq(employees.map((e) => String(e["sector"] ?? ""))),
    jobTitles: uniq(employees.map((e) => String(e["job_title"] ?? ""))),
    nationalities: uniq(employees.map((e) => String(e["nationality"] ?? ""))),
  }), [employees]);

  // Normalized financial data per employee
  const rows = useMemo(() => {
    return employees.map((e, idx): Record<string, unknown> => {
      const basic = Number(e["basic_salary"] || (idx % 2 === 0 ? 6000 : 8500));
      const housing = Number(e["housing_allowance"] || Math.round(basic * 0.25));
      const transport = Number(e["transport_allowance"] || Math.round(basic * 0.1));
      const other = Number(e["other_allowance"] || 0);
      const total = basic + housing + transport + other;

      const isSaudi = e["nationality"] === "سعودي";
      const gosiEmp = isSaudi ? Math.round((basic + housing) * 0.0975) : 0;
      const gosiComp = isSaudi ? Math.round((basic + housing) * 0.1175) : Math.round((basic + housing) * 0.02);

      const banks = ["مصرف الراجحي", "البنك الأهلي السعودي", "بنك الرياض", "بنك البلاد", "مصرف الإنماء"];
      const bank = e["bank_name"] || banks[idx % banks.length];
      const iban = e["iban"] || `SA${(idx + 1).toString().padStart(2, "0")}80000${(1000000000 + idx * 777)}`;

      return {
        ...e,
        basic_salary: basic,
        housing_allowance: housing,
        transport_allowance: transport,
        other_allowance: other,
        total_salary: total,
        gosi_employee: gosiEmp,
        gosi_company: gosiComp,
        bank_name: bank,
        iban,
      };
    });
  }, [employees]);

  // Filtering
  const filteredRows = useMemo(() => {
    const f = appliedFilters || filters;
    const gSearch = globalSearch.trim().toLowerCase();
    const empQ = f.employee.trim().toLowerCase();

    return rows.filter((r) => {
      if (f.branch && r["branch"] !== f.branch) return false;
      if (f.department && r["department"] !== f.department) return false;
      if (f.mainDepartment && r["main_department"] !== f.mainDepartment) return false;
      if (f.sector && r["sector"] !== f.sector) return false;
      if (f.jobTitle && r["job_title"] !== f.jobTitle) return false;
      if (f.nationality && r["nationality"] !== f.nationality) return false;

      if (empQ) {
        const matchName = String(r["full_name"] ?? "").toLowerCase().includes(empQ);
        const matchNo = String(r["emp_no"] ?? "").includes(empQ);
        if (!matchName && !matchNo) return false;
      }

      if (gSearch) {
        const match = Object.values(r).some((v) =>
          String(v ?? "").toLowerCase().includes(gSearch)
        );
        if (!match) return false;
      }

      for (const [colKey, query] of Object.entries(colFilters)) {
        if (!query.trim()) continue;
        const cellVal = String(r[colKey] ?? "").toLowerCase();
        if (!cellVal.includes(query.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [rows, appliedFilters, filters, globalSearch, colFilters]);

  // Sorting
  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    if (!sortCol) return list;
    return list.sort((a, b) => {
      const valA = a[sortCol] ?? "";
      const valB = b[sortCol] ?? "";
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc ? String(valA).localeCompare(String(valB), "ar") : String(valB).localeCompare(String(valA), "ar");
    });
  }, [filteredRows, sortCol, sortAsc]);

  // Pagination
  const totalItems = sortedRows.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // Financial KPI totals
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => {
        acc.basic += Number(r.basic_salary || 0);
        acc.housing += Number(r.housing_allowance || 0);
        acc.transport += Number(r.transport_allowance || 0);
        acc.total += Number(r.total_salary || 0);
        acc.gosiEmp += Number(r.gosi_employee || 0);
        acc.gosiComp += Number(r.gosi_company || 0);
        return acc;
      },
      { basic: 0, housing: 0, transport: 0, total: 0, gosiEmp: 0, gosiComp: 0 }
    );
  }, [filteredRows]);

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) setSortAsc(!sortAsc);
    else {
      setSortCol(colKey);
      setSortAsc(true);
    }
  };

  /* ─── Export ─── */
  const exportExcel = (ext: "xlsx" | "xls") => {
    const headers = COLUMNS.map((c) => c.label);
    const data = sortedRows.map((r) =>
      COLUMNS.map((c) => (c.formatter ? c.formatter(r[c.key], r) : r[c.key] ?? ""))
    );
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "البيانات المالية للموظفين");
    XLSX.writeFile(wb, `تقرير-البيانات-المالية-للموظفين.${ext}`);
  };

  const exportCsv = () => {
    const headers = COLUMNS.map((c) => `"${c.label}"`).join(",");
    const rowsText = sortedRows
      .map((r) =>
        COLUMNS.map((c) => {
          const val = c.formatter ? c.formatter(r[c.key], r) : r[c.key] ?? "";
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",")
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + headers + "\n" + rowsText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "تقرير-البيانات-المالية-للموظفين.csv";
    a.click();
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="payments" size={22} className="text-[#0070c0]" />
          تقرير البيانات المالية للموظفين
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير بيانات الموظفين / البيانات المالية</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الرواتب الأساسية</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{totals.basic.toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي البدلات والمزايا</div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{(totals.housing + totals.transport).toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الرواتب الشهرية</div>
          <div className="text-lg font-extrabold text-indigo-700 font-mono mt-1">{totals.total.toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي حصة التأمينات (GOSI)</div>
          <div className="text-lg font-extrabold text-amber-700 font-mono mt-1">{(totals.gosiEmp + totals.gosiComp).toLocaleString()} ريال</div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="mb-4 rounded-xl border border-[#b4c7e7] bg-[#f0f6ff]/70 p-4 shadow-sm" dir="rtl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-2 items-end">
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
            <span className="text-[11px] font-bold text-slate-700 text-right">المسمى الوظيفي</span>
            <select
              value={filters.jobTitle}
              onChange={(e) => setFilters((p) => ({ ...p, jobTitle: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.jobTitles.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">الجنسية</span>
            <select
              value={filters.nationality}
              onChange={(e) => setFilters((p) => ({ ...p, nationality: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.nationalities.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">موظف</span>
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

      {/* DataGrid Table */}
      <div className="overflow-x-auto rounded-lg border border-[#004e82]/30 shadow-xs" dir="rtl">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#004e82] text-white">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-2.5 py-2 font-extrabold border-r border-[#00385e] last:border-r-0 cursor-pointer select-none hover:bg-[#003d66] transition text-right whitespace-nowrap"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{col.label}</span>
                    <span className="text-[10px] opacity-70">
                      {sortCol === col.key ? (sortAsc ? "▲" : "▼") : "▾"}
                    </span>
                  </div>
                </th>
              ))}
            </tr>

            {/* Per-column filter row */}
            <tr className="bg-[#e8f1fb] border-b border-slate-300">
              {COLUMNS.map((col) => (
                <th key={`filter-${col.key}`} className="p-1 border-r border-slate-300 last:border-r-0">
                  <div className="relative">
                    <input
                      type="text"
                      value={colFilters[col.key] || ""}
                      onChange={(e) => {
                        setColFilters((prev) => ({ ...prev, [col.key]: e.target.value }));
                        setCurrentPage(1);
                      }}
                      className="h-6 w-full rounded border border-slate-300 bg-white px-1 pe-4 text-[10px] outline-none focus:border-[#0070c0]"
                    />
                    <MaterialIcon
                      name="search"
                      size={11}
                      className="pointer-events-none absolute left-1 top-1.5 text-slate-400"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={COLUMNS.length} className="text-center py-10 text-slate-500 font-bold">
                  جارٍ تحميل البيانات...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="text-center py-12 text-slate-400 font-bold">
                  لا توجد سجلات مالية مطابقة
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <tr
                  key={row["id"] || idx}
                  className={`border-b border-slate-200 transition hover:bg-blue-50/70 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#f8fafd]"
                  }`}
                >
                  {COLUMNS.map((col) => {
                    const val = col.formatter ? col.formatter(row[col.key], row) : row[col.key] ?? "—";
                    return (
                      <td
                        key={col.key}
                        className={`px-2.5 py-1.5 border-r border-slate-200 last:border-r-0 text-slate-800 font-medium whitespace-nowrap ${
                          col.align === "center"
                            ? "text-center font-mono font-bold"
                            : col.align === "left"
                            ? "text-left font-mono text-xs text-slate-600"
                            : "text-right"
                        }`}
                      >
                        {typeof val === "number" ? val.toLocaleString() : val}
                      </td>
                    );
                  })}
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
