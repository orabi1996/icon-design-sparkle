import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/archive")({
  head: () => ({ meta: [{ title: "الأرشيف الإلكتروني للمستندات والوثائق | التقارير التاريخية" }] }),
  component: ArchiveReport,
});

type ArchiveDocument = {
  id: string;
  doc_no: string;
  doc_title: string;
  emp_no: string;
  employee_name: string;
  branch: string;
  category: string;
  file_type: string;
  file_size: string;
  upload_date: string;
  archived_by: string;
  status: string;
};

const DOC_CATEGORIES = [
  "الكل",
  "عقود العمل والملاحق",
  "الهويات الوطنية والإقامات",
  "جوازات السفر والتأشيرات",
  "القرارات والتعاميم الإدارية",
  "الشهادات والمؤهلات الأكاديمية",
  "التقارير الطبية والتأمين",
  "تسويات العهد وفواتير المصروفات",
];

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function ArchiveReport() {
  const { data: employees = [], isLoading } = useRows("employees", { orderBy: "emp_no", ascending: true });

  const [filters, setFilters] = useState({
    branch: "",
    category: "",
    search: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<typeof filters | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState<string>("upload_date");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const options = useMemo(() => ({
    branches: uniq(employees.map((e) => String(e["branch"] ?? ""))),
  }), [employees]);

  // Generate archive documents
  const documentRows = useMemo(() => {
    const categories = [
      { c: "عقود العمل والملاحق", ext: "PDF", sz: "1.4 MB", t: "عقد عمل رسمي موثق منصة قوى" },
      { c: "الهويات الوطنية والإقامات", ext: "JPG", sz: "850 KB", t: "صورة بطاقة الهوية الوطنية / الإقامة" },
      { c: "جوازات السفر والتأشيرات", ext: "PDF", sz: "2.1 MB", t: "صورة جواز السفر ساري الصلاحية" },
      { c: "الشهادات والمؤهلات الأكاديمية", ext: "PDF", sz: "3.5 MB", t: "وثيقة التخرج والشهادة الجامعية المعتمدة" },
      { c: "التقارير الطبية والتأمين", ext: "PDF", sz: "920 KB", t: "كشف فحص طبي وبطاقة التأمين الصحي" },
      { c: "القرارات والتعاميم الإدارية", ext: "PDF", sz: "600 KB", t: "قرار ترقية وتعديل مسمى وظيفي" },
    ];

    const list: ArchiveDocument[] = [];
    employees.forEach((emp, i) => {
      categories.forEach((cat, cIdx) => {
        list.push({
          id: `doc-${emp["emp_no"]}-${cIdx}`,
          doc_no: `DOC-2025-${(i * 10 + cIdx + 1).toString().padStart(4, "0")}`,
          doc_title: `${cat.t} - ${emp["full_name"]}`,
          emp_no: emp["emp_no"] || String(i + 1),
          employee_name: emp["full_name"] || "—",
          branch: emp["branch"] || "شركة الحلول الخبيرة",
          category: cat.c,
          file_type: cat.ext,
          file_size: cat.sz,
          upload_date: `2025/0${(cIdx % 5) + 1}/15`,
          archived_by: "مدير الموارد البشرية",
          status: "مؤرشف ومحمي",
        });
      });
    });

    return list;
  }, [employees]);

  // Filtering
  const filtered = useMemo(() => {
    const f = appliedFilters || filters;
    const gSearch = globalSearch.trim().toLowerCase();
    const q = f.search.trim().toLowerCase();

    return documentRows.filter((r) => {
      if (f.branch && r.branch !== f.branch) return false;
      if (f.category && f.category !== "الكل" && r.category !== f.category) return false;

      if (q) {
        const match =
          r.doc_title.toLowerCase().includes(q) ||
          r.employee_name.toLowerCase().includes(q) ||
          r.emp_no.includes(q) ||
          r.doc_no.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (gSearch) {
        const match = Object.values(r).some((v) =>
          String(v ?? "").toLowerCase().includes(gSearch)
        );
        if (!match) return false;
      }

      for (const [k, valQ] of Object.entries(colFilters)) {
        if (!valQ.trim()) continue;
        const cell = String((r as any)[k] ?? "").toLowerCase();
        if (!cell.includes(valQ.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [documentRows, appliedFilters, filters, globalSearch, colFilters]);

  // Sorting
  const sorted = useMemo(() => {
    const list = [...filtered];
    if (!sortCol) return list;
    return list.sort((a, b) => {
      const valA = (a as any)[sortCol] ?? "";
      const valB = (b as any)[sortCol] ?? "";
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
      "رقم الوثيقة", "عنوان الوثيقة والمستند", "الرقم الوظيفي", "اسم الموظف",
      "الفرع", "التصنيف", "النوع", "الحجم", "تاريخ الأرشفة", "القائم بالأرشفة", "الحالة"
    ];
    const data = sorted.map((r) => [
      r.doc_no, r.doc_title, r.emp_no, r.employee_name,
      r.branch, r.category, r.file_type, r.file_size, r.upload_date, r.archived_by, r.status
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الأرشيف الإلكتروني");
    XLSX.writeFile(wb, `سجل-الأرشيف-الإلكتروني.${ext}`);
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="folder_zip" size={22} className="text-[#0070c0]" />
          الأرشيف الإلكتروني للمستندات والملفات
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير تاريخية / الأرشيف</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الوثائق المؤرشفة</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{filtered.length} وثيقة</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">حالة التشفير والحماية</div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">مشفر (AES-256)</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي السعة التخزينية للملفات</div>
          <div className="text-lg font-extrabold text-indigo-700 font-mono mt-1">2.4 GB</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">النسخ الاحتياطي السحابي</div>
          <div className="text-lg font-extrabold text-purple-700 font-mono mt-1">متزامن ويومي</div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="mb-4 rounded-xl border border-[#b4c7e7] bg-[#f0f6ff]/70 p-4 shadow-sm" dir="rtl">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
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
            <span className="text-[11px] font-bold text-slate-700 text-right">تصنيف الوثيقة</span>
            <select
              value={filters.category}
              onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
              className={inputCls}
            >
              {DOC_CATEGORIES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">البحث في الأرشيف</span>
            <input
              type="text"
              placeholder="اسم الوثيقة، الموظف، الرقم"
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className={inputCls}
            />
          </label>

          <div className="flex items-center gap-2">
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
            <button
              onClick={() => exportExcel("xlsx")}
              className="flex items-center justify-center gap-1 rounded bg-emerald-600 h-8 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              <MaterialIcon name="table_chart" size={15} />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-lg border border-[#004e82]/30 shadow-xs" dir="rtl">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#004e82] text-white">
              <th onClick={() => handleSort("doc_no")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">رقم الوثيقة</th>
              <th onClick={() => handleSort("doc_title")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">عنوان ومحتوى المستند</th>
              <th onClick={() => handleSort("emp_no")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">الرقم الوظيفي</th>
              <th onClick={() => handleSort("employee_name")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">اسم الموظف</th>
              <th onClick={() => handleSort("category")} className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right cursor-pointer select-none">التصنيف</th>
              <th onClick={() => handleSort("file_type")} className="px-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">النوع</th>
              <th onClick={() => handleSort("file_size")} className="px-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">الحجم</th>
              <th onClick={() => handleSort("upload_date")} className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center cursor-pointer select-none">تاريخ الأرشفة</th>
              <th className="px-2.5 py-2 font-extrabold text-center">إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-slate-500 font-bold">
                  جارٍ تحميل الأرشيف...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400 font-bold">
                  لا توجد وثائق مطابقة
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
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0]">{r.doc_no}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-right font-bold text-slate-800 flex items-center gap-1.5">
                    <MaterialIcon name={r.file_type === "PDF" ? "picture_as_pdf" : "image"} size={16} className={r.file_type === "PDF" ? "text-rose-600" : "text-blue-600"} />
                    {r.doc_title}
                  </td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r.emp_no}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-right font-medium text-slate-800">{r.employee_name}</td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-right text-slate-700">{r.category}</td>
                  <td className="px-2 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-slate-600">{r.file_type}</td>
                  <td className="px-2 py-1.5 border-r border-slate-200 text-center font-mono text-slate-500">{r.file_size}</td>
                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-600">{r.upload_date}</td>
                  <td className="px-2.5 py-1.5 text-center">
                    <button
                      onClick={() => alert(`معاينة وتحميل المستند: ${r.doc_title}`)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0070c0] text-white hover:bg-[#005fa3] transition flex items-center justify-center gap-1 mx-auto"
                    >
                      <MaterialIcon name="visibility" size={12} />
                      معاينة
                    </button>
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
      </div>

      <div className="mt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200 pt-4">
        جميع الحقوق محفوظة © الحلول الخبيرة
      </div>
    </AppShell>
  );
}
