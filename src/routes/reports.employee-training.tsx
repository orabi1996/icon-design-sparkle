import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/employee-training")({
  head: () => ({ meta: [{ title: "تقرير الدورات والبرامج التدريبية للموظفين | التقارير" }] }),
  component: EmployeeTrainingReport,
});

type TrainingItem = {
  id: string;
  emp_no: string;
  employee_name: string;
  branch: string;
  department: string;
  course_name: string;
  provider: string;
  training_type: string;
  from_date: string;
  to_date: string;
  hours: number;
  cost: number;
  result: string;
};

const TRAINING_TYPES = ["الكل", "حضوري", "عن بُعد (Online)", "ورشة عمل تفاعلية", "برنامج قيادي", "مؤتمر تخصصي"];
const RESULTS = ["الكل", "اجتياز بنجاح", "حضور ومشاركة", "امتياز"];

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function EmployeeTrainingReport() {
  const { data: employees = [], isLoading } = useRows("employees", { orderBy: "emp_no", ascending: true });

  const [filters, setFilters] = useState({
    branch: "",
    department: "",
    trainingType: "",
    result: "",
    employee: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<typeof filters | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState<string>("from_date");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const options = useMemo(() => ({
    branches: uniq(employees.map((e) => String(e["branch"] ?? ""))),
    departments: uniq(employees.map((e) => String(e["department"] ?? ""))),
  }), [employees]);

  // Generate training records
  const trainingRows = useMemo(() => {
    const courses = [
      { name: "القيادة الإدارية والتحول الرقمي", prov: "معهد الإدارة العامة", type: "برنامج قيادي", hrs: 40, cost: 3500 },
      { name: "تطوير تطبيقات الويب المتقدمة React & Node", prov: "أكاديمية طويق", type: "حضوري", hrs: 60, cost: 4500 },
      { name: "إدارة الموارد البشرية وفق نظام العمل السعودي", prov: "المعهد المصرفي والمالي", type: "عن بُعد (Online)", hrs: 25, cost: 2000 },
      { name: "الأمن السيبراني والامتثال للأنظمة", prov: "الاتحاد السعودي للأمن السيبراني", type: "ورشة عمل تفاعلية", hrs: 15, cost: 1200 },
      { name: "تحليل البيانات واستخدام الذكاء الاصطناعي", prov: "منصة إثرائي", type: "عن بُعد (Online)", hrs: 30, cost: 1800 },
      { name: "المعايير الدولية لإعداد التقارير المالية IFRS", prov: "الهيئة السعودية للمحاسبين SOCPA", type: "حضوري", hrs: 45, cost: 4000 },
    ];

    return employees.map((emp, i) => {
      const c = courses[i % courses.length]!;
      return {
        id: `train-${emp["emp_no"] || i}`,
        emp_no: emp["emp_no"] || String(i + 1),
        employee_name: emp["full_name"] || "—",
        branch: emp["branch"] || "شركة الحلول الخبيرة",
        department: emp["department"] || "التطوير",
        course_name: c.name,
        provider: c.prov,
        training_type: c.type,
        from_date: `2025/0${(i % 6) + 1}/15`,
        to_date: `2025/0${(i % 6) + 1}/${15 + Math.round(c.hrs / 8)}`,
        hours: c.hrs,
        cost: c.cost,
        result: i % 5 === 0 ? "امتياز" : "اجتياز بنجاح",
      } as TrainingItem;
    });
  }, [employees]);

  // Filtering
  const filtered = useMemo(() => {
    const f = appliedFilters || filters;
    const gSearch = globalSearch.trim().toLowerCase();
    const empQ = f.employee.trim().toLowerCase();

    return trainingRows.filter((r) => {
      if (f.branch && r.branch !== f.branch) return false;
      if (f.department && r.department !== f.department) return false;
      if (f.trainingType && f.trainingType !== "الكل" && r.training_type !== f.trainingType) return false;
      if (f.result && f.result !== "الكل" && r.result !== f.result) return false;

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
  }, [trainingRows, appliedFilters, filters, globalSearch, colFilters]);

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

  // KPI calculations
  const kpis = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.totalHours += r.hours;
        acc.totalCost += r.cost;
        return acc;
      },
      { totalHours: 0, totalCost: 0, totalCourses: filtered.length }
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
      "الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم", "اسم البرنامج التدريبي",
      "الجهة المنظمة", "نوع التدريب", "من تاريخ", "إلى تاريخ", "الساعات التدريبية",
      "التكلفة المالية", "النتيجة والتقييم"
    ];
    const data = sorted.map((r) => [
      r.emp_no, r.employee_name, r.branch, r.department, r.course_name,
      r.provider, r.training_type, r.from_date, r.to_date, r.hours,
      r.cost, r.result
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الدورات والبرامج التدريبية");
    XLSX.writeFile(wb, `تقرير-الدورات-التدريبية-للموظفين.${ext}`);
  };

  const exportCsv = () => {
    const headers = [
      "الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم", "اسم البرنامج التدريبي",
      "الجهة المنظمة", "نوع التدريب", "من تاريخ", "إلى تاريخ", "الساعات التدريبية",
      "التكلفة المالية", "النتيجة والتقييم"
    ].join(",");
    const rowsText = sorted.map((r) =>
      `"${r.emp_no}","${r.employee_name}","${r.branch}","${r.department}","${r.course_name}","${r.provider}","${r.training_type}","${r.from_date}","${r.to_date}",${r.hours},${r.cost},"${r.result}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + "\n" + rowsText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "تقرير-الدورات-التدريبية-للموظفين.csv";
    a.click();
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="model_training" size={22} className="text-[#0070c0]" />
          تقرير الدورات والبرامج التدريبية للموظفين
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير بيانات الموظفين / التدريب والتطوير</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي البرامج التدريبية</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{kpis.totalCourses} دورة</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الساعات التدريبية</div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{kpis.totalHours} ساعة</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">متوسط ساعات التدريب / موظف</div>
          <div className="text-lg font-extrabold text-indigo-700 font-mono mt-1">
            {kpis.totalCourses > 0 ? (kpis.totalHours / kpis.totalCourses).toFixed(1) : "0"} ساعة
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الاستثمار التدريبي</div>
          <div className="text-lg font-extrabold text-amber-700 font-mono mt-1">{kpis.totalCost.toLocaleString()} ريال</div>
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
            <span className="text-[11px] font-bold text-slate-700 text-right">نوع التدريب</span>
            <select
              value={filters.trainingType}
              onChange={(e) => setFilters((p) => ({ ...p, trainingType: e.target.value }))}
              className={inputCls}
            >
              {TRAINING_TYPES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">النتيجة والتقييم</span>
            <select
              value={filters.result}
              onChange={(e) => setFilters((p) => ({ ...p, result: e.target.value }))}
              className={inputCls}
            >
              {RESULTS.map((o) => (
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
              <th onClick={() => handleSort("course_name")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">اسم البرنامج التدريبي</th>
              <th onClick={() => handleSort("provider")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">الجهة المنظمة</th>
              <th onClick={() => handleSort("training_type")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">نوع التدريب</th>
              <th onClick={() => handleSort("from_date")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">من تاريخ</th>
              <th onClick={() => handleSort("to_date")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">إلى تاريخ</th>
              <th onClick={() => handleSort("hours")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">الساعات</th>
              <th onClick={() => handleSort("cost")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">التكلفة</th>
              <th className="px-2.5 py-2 font-extrabold text-center">التقييم والنتيجة</th>
            </tr>

            {/* Filter row */}
            <tr className="bg-[#e8f1fb] border-b border-slate-300">
              {["emp_no", "employee_name", "branch", "department", "course_name", "provider", "training_type", "from_date", "to_date", "hours", "cost"].map((k) => (
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
                  جارٍ تحميل البيانات...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-12 text-slate-400 font-bold">
                  لا توجد برامج تدريبية مطابقة
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
                  <td className="px-3 py-1.5 border-r border-slate-200 text-right font-bold text-slate-800">{r.course_name}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-right text-slate-700">{r.provider}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-medium text-slate-800">{r.training_type}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-600">{r.from_date}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-600">{r.to_date}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0]">{r.hours} س</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-slate-800">{r.cost.toLocaleString()} ريال</td>
                  <td className="px-2.5 py-1.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#004e82]">
                      {r.result}
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
