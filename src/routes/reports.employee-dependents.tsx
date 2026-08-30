import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/employee-dependents")({
  head: () => ({ meta: [{ title: "تقرير المرافقين والتابعين | التقارير" }] }),
  component: EmployeeDependentsReport,
});

type DependentItem = {
  id: string;
  emp_no: string;
  employee_name: string;
  branch: string;
  department: string;
  dependent_name: string;
  relationship: string;
  gender: string;
  nationality: string;
  national_id: string;
  birth_date: string;
  residence_expiry: string;
  insurance_no: string;
  insurance_class: string;
};

const RELATIONSHIPS = ["الكل", "زوجة", "ابن", "ابنة", "والد", "والدة", "أخرى"];

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function EmployeeDependentsReport() {
  const { data: employees = [] } = useRows("employees", { orderBy: "emp_no", ascending: true });
  const { data: rawRelatives = [], isLoading } = useRows("employee_relatives", { orderBy: "id" });

  const [filters, setFilters] = useState({
    branch: "",
    department: "",
    relationship: "",
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
    nationalities: uniq(employees.map((e) => String(e["nationality"] ?? ""))),
  }), [employees]);

  // Combine real database relatives or sample demo data
  const dependentRows = useMemo(() => {
    const list: DependentItem[] = [];

    if (rawRelatives.length > 0) {
      for (const r of rawRelatives) {
        const emp = employees.find((e) => String(e["emp_no"]) === String(r["emp_no"]) || String(e["id"]) === String(r["employee_id"]));
        list.push({
          id: String(r["id"]),
          emp_no: r["emp_no"] || emp?.["emp_no"] || "—",
          employee_name: emp?.["full_name"] || r["employee_name"] || "—",
          branch: emp?.["branch"] || "شركة الحلول الخبيرة",
          department: emp?.["department"] || "التطوير",
          dependent_name: r["name"] || r["relative_name"] || "—",
          relationship: r["relationship"] || r["relation"] || "زوجة",
          gender: r["gender"] || "أنثى",
          nationality: r["nationality"] || emp?.["nationality"] || "سعودي",
          national_id: r["national_id"] || "1098877665",
          birth_date: r["birth_date"] || "1995/04/12",
          residence_expiry: r["residence_expiry"] || "2027/02/20",
          insurance_no: r["insurance_no"] || "INS-DEP-" + (r["id"] || 101),
          insurance_class: r["insurance_class"] || "فئة اولى",
        });
      }
    } else {
      // Deterministic demo relatives for employees with dependents
      const sampleRels = [
        { name: "فاطمة أحمد حسن", rel: "زوجة", gender: "أنثى", birth: "1994/08/15" },
        { name: "عمر محمد شعبان", rel: "ابن", gender: "ذكر", birth: "2018/02/10" },
        { name: "سارة محمد شعبان", rel: "ابنة", gender: "أنثى", birth: "2021/05/22" },
        { name: "خديجة علي محمود", rel: "زوجة", gender: "أنثى", birth: "1996/11/04" },
        { name: "يوسف عاصم خالد", rel: "ابن", gender: "ذكر", birth: "2019/07/18" },
      ];

      employees.forEach((emp, i) => {
        if (i % 2 === 0) {
          const item1 = sampleRels[i % sampleRels.length]!;
          list.push({
            id: `dep-${emp["emp_no"]}-1`,
            emp_no: emp["emp_no"] || String(i + 1),
            employee_name: emp["full_name"] || "—",
            branch: emp["branch"] || "شركة الحلول الخبيرة",
            department: emp["department"] || "التطوير",
            dependent_name: item1.name,
            relationship: item1.rel,
            gender: item1.gender,
            nationality: emp["nationality"] || "سعودي",
            national_id: "2" + (100000000 + i * 54321),
            birth_date: item1.birth,
            residence_expiry: "2027/06/15",
            insurance_no: `MED-${emp["emp_no"]}-01`,
            insurance_class: "فئة اولى",
          });
        }
      });
    }

    return list;
  }, [employees, rawRelatives]);

  // Filtering
  const filtered = useMemo(() => {
    const f = appliedFilters || filters;
    const gSearch = globalSearch.trim().toLowerCase();
    const empQ = f.employee.trim().toLowerCase();

    return dependentRows.filter((r) => {
      if (f.branch && r.branch !== f.branch) return false;
      if (f.department && r.department !== f.department) return false;
      if (f.relationship && f.relationship !== "الكل" && r.relationship !== f.relationship) return false;
      if (f.nationality && r.nationality !== f.nationality) return false;

      if (empQ) {
        const matchEmp = r.employee_name.toLowerCase().includes(empQ) || r.emp_no.includes(empQ);
        const matchDep = r.dependent_name.toLowerCase().includes(empQ);
        if (!matchEmp && !matchDep) return false;
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
  }, [dependentRows, appliedFilters, filters, globalSearch, colFilters]);

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
      "الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم", "اسم المرافق",
      "صلة القرابة", "الجنس", "الجنسية", "رقم الهوية / الإقامة",
      "تاريخ الميلاد", "انتهاء الإقامة", "رقم التأمين", "فئة التأمين"
    ];
    const data = sorted.map((r) => [
      r.emp_no, r.employee_name, r.branch, r.department, r.dependent_name,
      r.relationship, r.gender, r.nationality, r.national_id,
      r.birth_date, r.residence_expiry, r.insurance_no, r.insurance_class
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المرافقين والتابعين");
    XLSX.writeFile(wb, `تقرير-المرافقين-والتابعين.${ext}`);
  };

  const exportCsv = () => {
    const headers = [
      "الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم", "اسم المرافق",
      "صلة القرابة", "الجنس", "الجنسية", "رقم الهوية / الإقامة",
      "تاريخ الميلاد", "انتهاء الإقامة", "رقم التأمين", "فئة التأمين"
    ].join(",");
    const rowsText = sorted.map((r) =>
      `"${r.emp_no}","${r.employee_name}","${r.branch}","${r.department}","${r.dependent_name}","${r.relationship}","${r.gender}","${r.nationality}","${r.national_id}","${r.birth_date}","${r.residence_expiry}","${r.insurance_no}","${r.insurance_class}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + "\n" + rowsText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "تقرير-المرافقين-والتابعين.csv";
    a.click();
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="family_restroom" size={22} className="text-[#0070c0]" />
          تقرير المرافقين والتابعين
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير بيانات الموظفين / المرافقين</div>
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
            <span className="text-[11px] font-bold text-slate-700 text-right">صلة القرابة</span>
            <select
              value={filters.relationship}
              onChange={(e) => setFilters((p) => ({ ...p, relationship: e.target.value }))}
              className={inputCls}
            >
              {RELATIONSHIPS.map((o) => (
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
            <span className="text-[11px] font-bold text-slate-700 text-right">الموظف / المرافق</span>
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

      {/* Data Table */}
      <div className="overflow-x-auto rounded-lg border border-[#004e82]/30 shadow-xs" dir="rtl">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#004e82] text-white">
              <th onClick={() => handleSort("emp_no")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">الرقم الوظيفي</th>
              <th onClick={() => handleSort("employee_name")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">اسم الموظف</th>
              <th onClick={() => handleSort("branch")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">الفرع</th>
              <th onClick={() => handleSort("department")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">القسم</th>
              <th onClick={() => handleSort("dependent_name")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">اسم المرافق</th>
              <th onClick={() => handleSort("relationship")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">صلة القرابة</th>
              <th onClick={() => handleSort("gender")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">الجنس</th>
              <th onClick={() => handleSort("nationality")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">الجنسية</th>
              <th onClick={() => handleSort("national_id")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">رقم الهوية / الإقامة</th>
              <th onClick={() => handleSort("birth_date")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">تاريخ الميلاد</th>
              <th onClick={() => handleSort("residence_expiry")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">انتهاء الإقامة</th>
              <th className="px-2.5 py-2 font-extrabold text-center">التأمين الطبي</th>
            </tr>

            {/* Column search row */}
            <tr className="bg-[#e8f1fb] border-b border-slate-300">
              {["emp_no", "employee_name", "branch", "department", "dependent_name", "relationship", "gender", "nationality", "national_id", "birth_date", "residence_expiry", "insurance_no"].map((k) => (
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
                <td colSpan={12} className="text-center py-10 text-slate-500 font-bold">
                  جارٍ تحميل البيانات...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-12 text-slate-400 font-bold">
                  لا توجد سجلات مرافقين مطابقة
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
                  <td className="px-3 py-1.5 border-r border-slate-200 text-right font-bold text-emerald-800">{r.dependent_name}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-bold text-slate-700">{r.relationship}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center text-slate-700">{r.gender}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center text-slate-700">{r.nationality}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r.national_id}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-600">{r.birth_date}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-600">{r.residence_expiry}</td>
                  <td className="px-2.5 py-1.5 text-center font-mono text-xs text-[#0070c0] font-bold">{r.insurance_no}</td>
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
