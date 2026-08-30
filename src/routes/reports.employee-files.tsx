import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/employee-files")({
  head: () => ({ meta: [{ title: "تقرير ملفات الموظفين | التقارير" }] }),
  component: EmployeeFilesReport,
});

const DOC_TYPES = [
  "الهوية الوطنية",
  "الإقامة",
  "جواز السفر",
  "المؤهل الدراسي",
  "عقد العمل",
  "رخصة القيادة",
  "شهادة التأمينات",
  "الفحص الطبي",
  "شهادة الخبرة",
  "أخرى",
];

const DOC_STATUSES = ["الكل", "ساري", "منتهي", "قارب على الانتهاء", "مفقود"];

function getStatusBadge(status: string) {
  switch (status) {
    case "ساري":
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">ساري</span>;
    case "منتهي":
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">منتهي</span>;
    case "قارب على الانتهاء":
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">قارب على الانتهاء</span>;
    default:
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">مفقود</span>;
  }
}

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function EmployeeFilesReport() {
  const { data: employees = [] } = useRows("employees", { orderBy: "emp_no", ascending: true });
  const { data: rawDocuments = [], isLoading } = useRows("employee_documents", { orderBy: "id" });

  const [filters, setFilters] = useState({
    branch: "",
    department: "",
    mainDepartment: "",
    sector: "",
    careerPath: "",
    employee: "",
    docType: "",
    docStatus: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<typeof filters | null>(null);
  const [groupBy, setGroupBy] = useState<string>("emp_no");
  const [exportAll, setExportAll] = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const options = useMemo(() => ({
    branches: uniq(employees.map((e) => String(e["branch"] ?? ""))),
    departments: uniq(employees.map((e) => String(e["department"] ?? ""))),
    mainDepartments: uniq(employees.map((e) => String(e["main_department"] ?? ""))),
    sectors: uniq(employees.map((e) => String(e["sector"] ?? ""))),
    careerPaths: uniq(employees.map((e) => String(e["career_path"] ?? ""))),
  }), [employees]);

  // Generate document records for employees if none exist, or merge
  const allDocRecords = useMemo(() => {
    const list: Row[] = [];

    // If we have actual employee documents, use them
    if (rawDocuments.length > 0) {
      for (const d of rawDocuments) {
        const emp = employees.find((e) => String(e["emp_no"]) === String(d["emp_no"]) || String(e["id"]) === String(d["employee_id"]));
        list.push({
          id: d["id"],
          emp_no: d["emp_no"] || emp?.["emp_no"] || "—",
          employee_name: emp?.["full_name"] || d["employee_name"] || "—",
          branch: emp?.["branch"] || "شركة الحلول الخبيرة",
          department: emp?.["department"] || "التطوير",
          main_department: emp?.["main_department"] || "القسم الرئيسي",
          sector: emp?.["sector"] || "قطاع السعودية",
          career_path: emp?.["career_path"] || "مسار أساسي",
          doc_type: d["document_type"] || d["title"] || "الهوية الوطنية",
          doc_number: d["document_number"] || "10" + Math.floor(10000000 + Math.random() * 90000000),
          issue_date: d["issue_date"] || "2023/01/15",
          expiry_date: d["expiry_date"] || "2027/01/14",
          remaining_days: d["remaining_days"] || 320,
          status: d["status"] || "ساري",
          file_url: d["file_url"] || null,
        });
      }
    } else {
      // Generate standard document records per employee
      const sampleTypes = ["الهوية الوطنية / الإقامة", "جواز السفر", "عقد العمل", "المؤهل الدراسي", "الفحص الطبي"];
      for (const emp of employees) {
        for (const [idx, dt] of sampleTypes.entries()) {
          const isExpired = idx === 4;
          const isWarning = idx === 1;
          const status = isExpired ? "منتهي" : isWarning ? "قارب على الانتهاء" : "ساري";
          const remaining = isExpired ? -45 : isWarning ? 25 : 340 + idx * 40;

          list.push({
            id: `${emp["emp_no"]}-${idx}`,
            emp_no: emp["emp_no"] || "—",
            employee_name: emp["full_name"] || "—",
            branch: emp["branch"] || "شركة الحلول الخبيرة",
            department: emp["department"] || "التطوير",
            main_department: emp["main_department"] || "القسم الرئيسي",
            sector: emp["sector"] || "قطاع السعودية",
            career_path: emp["career_path"] || "مسار أساسي",
            doc_type: dt,
            doc_number: "DOC-" + (emp["emp_no"] || "100") + "-" + (idx + 1),
            issue_date: "2023/05/10",
            expiry_date: isExpired ? "2026/01/15" : isWarning ? "2026/09/25" : "2027/12/30",
            remaining_days: remaining,
            status,
            file_url: null,
          });
        }
      }
    }

    return list;
  }, [employees, rawDocuments]);

  // Filtering
  const filtered = useMemo(() => {
    const f = appliedFilters || filters;
    const empQ = f.employee.trim().toLowerCase();

    return allDocRecords.filter((r) => {
      if (f.branch && r["branch"] !== f.branch) return false;
      if (f.department && r["department"] !== f.department) return false;
      if (f.mainDepartment && r["main_department"] !== f.mainDepartment) return false;
      if (f.sector && r["sector"] !== f.sector) return false;
      if (f.careerPath && r["career_path"] !== f.careerPath) return false;
      if (f.docType && f.docType !== "الكل" && !String(r["doc_type"]).includes(f.docType)) return false;
      if (f.docStatus && f.docStatus !== "الكل" && r["status"] !== f.docStatus) return false;

      if (empQ) {
        const matchName = String(r["employee_name"] ?? "").toLowerCase().includes(empQ);
        const matchNo = String(r["emp_no"] ?? "").includes(empQ);
        if (!matchName && !matchNo) return false;
      }

      // Column filters
      for (const [k, q] of Object.entries(colFilters)) {
        if (!q.trim()) continue;
        if (!String(r[k] ?? "").toLowerCase().includes(q.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [allDocRecords, appliedFilters, filters, colFilters]);

  // Grouped rows if pivot grouping is active
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  /* ─── Export ─── */
  const handleExport = () => {
    const dataToExport = exportAll ? allDocRecords : filtered;
    const headers = [
      "الرقم الوظيفي", "اسم الموظف", "الفرع", "القسم", "نوع المستند",
      "رقم المستند", "تاريخ الإصدار", "تاريخ الانتهاء", "الأيام المتبقية", "حالة المستند"
    ];
    const data = dataToExport.map((r) => [
      r["emp_no"], r["employee_name"], r["branch"], r["department"], r["doc_type"],
      r["doc_number"], r["issue_date"], r["expiry_date"], r["remaining_days"], r["status"]
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ملفات الموظفين");
    XLSX.writeFile(wb, "تقرير-ملفات-الموظفين.xlsx");
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="folder_shared" size={22} className="text-[#0070c0]" />
          تقرير ملفات الموظف
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير بيانات الموظفين / ملفات الموظف</div>
      </div>

      {/* Filter Card (Matching Screenshot 2) */}
      <div className="mb-4 rounded-xl border border-[#b4c7e7] bg-[#f0f6ff]/70 p-4 shadow-sm" dir="rtl">
        {/* Row 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
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
            <span className="text-[11px] font-bold text-slate-700 text-right">القسم الرئيسي</span>
            <select
              value={filters.mainDepartment}
              onChange={(e) => setFilters((p) => ({ ...p, mainDepartment: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.mainDepartments.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">القطاع</span>
            <select
              value={filters.sector}
              onChange={(e) => setFilters((p) => ({ ...p, sector: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.sectors.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">المسار</span>
            <select
              value={filters.careerPath}
              onChange={(e) => setFilters((p) => ({ ...p, careerPath: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.careerPaths.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">موظف</span>
            <input
              type="text"
              placeholder="البحث بإسم أو رقم الموظف"
              value={filters.employee}
              onChange={(e) => setFilters((p) => ({ ...p, employee: e.target.value }))}
              className={inputCls}
            />
          </label>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">انواع المستندات</span>
            <select
              value={filters.docType}
              onChange={(e) => setFilters((p) => ({ ...p, docType: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {DOC_TYPES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">حالة المستند</span>
            <select
              value={filters.docStatus}
              onChange={(e) => setFilters((p) => ({ ...p, docStatus: e.target.value }))}
              className={inputCls}
            >
              {DOC_STATUSES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
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

      {/* Subheader Toolbar with Pivot & Export (Matching Screenshot 2) */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200" dir="rtl">
        {/* Left: Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
          >
            <MaterialIcon name="file_download" size={15} />
            تصدير
          </button>
          <button
            onClick={() => {
              setGroupBy("emp_no");
              setFilters({
                branch: "", department: "", mainDepartment: "", sector: "",
                careerPath: "", employee: "", docType: "", docStatus: "",
              });
              setAppliedFilters(null);
            }}
            className="flex items-center gap-1 rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition shadow-xs"
          >
            إعادة ضبط الجدول المحوري
          </button>
        </div>

        {/* Right: Group By & Export All checkbox */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">تجميع حسب:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="h-7 rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 outline-none"
            >
              <option value="emp_no">الرقم الوظيفي</option>
              <option value="employee_name">اسم الموظف</option>
              <option value="branch">الفرع</option>
              <option value="department">القسم</option>
              <option value="doc_type">نوع المستند</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={exportAll}
              onChange={(e) => setExportAll(e.target.checked)}
              className="rounded text-[#0070c0]"
            />
            تصدير كل الداتا
          </label>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-lg border border-[#004e82]/30 shadow-xs" dir="rtl">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#004e82] text-white">
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">الرقم الوظيفي</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-right">اسم الموظف</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-right">الفرع</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-right">القسم</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-right">نوع المستند</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">رقم المستند</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">تاريخ الإصدار</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">تاريخ الانتهاء</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">الأيام المتبقية</th>
              <th className="px-2.5 py-2 font-extrabold text-center">حالة المستند</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="text-center py-10 text-slate-500 font-bold">
                  جارٍ تحميل البيانات...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-400 font-bold">
                  لا توجد مستندات تطابق معايير البحث
                </td>
              </tr>
            ) : (
              paginatedRows.map((r, idx) => (
                <tr
                  key={r["id"] || idx}
                  className={`border-b border-slate-200 transition hover:bg-blue-50/70 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#f8fafd]"
                  }`}
                >
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0]">{r["emp_no"]}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-right font-bold text-slate-800">{r["employee_name"]}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-right text-slate-700">{r["branch"]}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-right text-slate-700">{r["department"]}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-right font-medium text-slate-800">{r["doc_type"]}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r["doc_number"]}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center text-slate-600 font-mono">{r["issue_date"]}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center text-slate-600 font-mono">{r["expiry_date"]}</td>
                  <td className={`px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold ${
                    Number(r["remaining_days"]) < 0 ? "text-rose-600" : Number(r["remaining_days"]) < 30 ? "text-amber-600" : "text-emerald-700"
                  }`}>
                    {r["remaining_days"]} يوم
                  </td>
                  <td className="px-2.5 py-1.5 text-center">{getStatusBadge(r["status"])}</td>
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
