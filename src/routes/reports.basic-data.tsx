import { useState, useMemo, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/basic-data")({
  head: () => ({ meta: [{ title: "تقرير البيانات الأساسية | التقارير" }] }),
  component: BasicDataReport,
});

/* ─── All available columns definition ─── */
type ColumnMeta = {
  key: string;
  label: string;
  defaultVisible?: boolean;
  align?: "right" | "center" | "left";
  formatter?: (val: any, row: Row) => string;
};

const ALL_COLUMNS: ColumnMeta[] = [
  { key: "seq", label: "م", defaultVisible: true, align: "center" },
  { key: "full_name", label: "اسم الموظف", defaultVisible: true },
  { key: "manager_name", label: "المدير المباشر", defaultVisible: true },
  { key: "emp_no", label: "الرقم الوظيفي", defaultVisible: true, align: "center" },
  { key: "branch", label: "الفرع", defaultVisible: true },
  { key: "department", label: "القسم", defaultVisible: true },
  { key: "main_branch", label: "الفرع الرئيسي", defaultVisible: true },
  { key: "career_path", label: "المسار", defaultVisible: true },
  { key: "main_department", label: "القسم الرئيسي", defaultVisible: true },
  { key: "job_level", label: "المستوى الوظيفي", defaultVisible: true },
  { key: "job_level_type", label: "النوع المستوى الوظيفي", defaultVisible: true },
  { key: "job_category", label: "الفئة الوظيفية", defaultVisible: true },
  { key: "sector", label: "القطاع", defaultVisible: true },
  { key: "nationality", label: "الجنسية", defaultVisible: true },
  { key: "religion", label: "الديانة", defaultVisible: true },
  { key: "social_status", label: "الحالة الاجتماعية", defaultVisible: true },
  { key: "birth_place", label: "مكان الميلاد", defaultVisible: true },
  { key: "contract_end_date", label: "تاريخ نهاية العقد", defaultVisible: true },
  { key: "annual_leave_calc_hijri", label: "احتساب الإجازة السنوية هجري", defaultVisible: true },
  { key: "hire_date_hijri", label: "تاريخ التعيين هجري", defaultVisible: true },
  { key: "birth_date", label: "تاريخ الميلاد", defaultVisible: true },
  { key: "birth_date_hijri", label: "تاريخ الميلاد هجري", defaultVisible: true },
  {
    key: "fingerprint_deduction_exempt",
    label: "مستثنى من البصمة",
    defaultVisible: true,
    formatter: (v) => (v === true || v === "نعم" || v === "true" ? "نعم" : "لا"),
  },
  { key: "start_date_hijri", label: "تاريخ البداية هجري", defaultVisible: true },
  { key: "national_id", label: "رقم الهوية", defaultVisible: false },
  { key: "passport_no", label: "رقم جواز السفر", defaultVisible: false },
  { key: "job_title", label: "الوظيفة الحالية", defaultVisible: false },
  { key: "specialization", label: "التخصص", defaultVisible: false },
  { key: "status", label: "حالة الموظف", defaultVisible: false },
  { key: "gender", label: "الجنس", defaultVisible: false },
  { key: "hire_date", label: "تاريخ التعيين", defaultVisible: false },
  { key: "start_date", label: "تاريخ المباشرة", defaultVisible: false },
  { key: "phone", label: "رقم الجوال", defaultVisible: false },
  { key: "email", label: "البريد الإلكتروني", defaultVisible: false },
  { key: "basic_salary", label: "الراتب الأساسي", defaultVisible: false },
  { key: "total_salary", label: "الراتب الإجمالي", defaultVisible: false },
  { key: "sponsor", label: "الكفيل", defaultVisible: false },
  { key: "bank_name", label: "اسم البنك", defaultVisible: false },
  { key: "iban", label: "رقم الآيبان", defaultVisible: false },
];

function toHijri(isoDate?: string): string {
  if (!isoDate) return "—";
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function BasicDataReport() {
  const { data: employees = [], isLoading } = useRows("employees", {
    orderBy: "emp_no",
    ascending: true,
  });

  // Filters state
  const [filters, setFilters] = useState({
    branch: "",
    department: "",
    mainDepartment: "",
    sector: "",
    careerPath: "",
    jobTitle: "",
    specialization: "",
    employee: "",
    gender: "",
    nationality: "",
    status: "",
    hireFrom: "",
    hireTo: "",
    startFrom: "",
    startTo: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<typeof filters | null>(null);

  // Column visibility state (keyed by column key)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const c of ALL_COLUMNS) {
      initial[c.key] = c.defaultVisible ?? false;
    }
    return initial;
  });

  // Column Chooser Dropdown & Floating Panel state
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [columnSearchTerm, setColumnSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsColumnDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Table per-column search filters
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  // Global search & Pagination
  const [globalSearch, setGlobalSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting
  const [sortCol, setSortCol] = useState<string>("emp_no");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Filter options from data
  const options = useMemo(() => ({
    branches: uniq(employees.map((e) => String(e["branch"] ?? ""))),
    departments: uniq(employees.map((e) => String(e["department"] ?? ""))),
    mainDepartments: uniq(employees.map((e) => String(e["main_department"] ?? ""))),
    sectors: uniq(employees.map((e) => String(e["sector"] ?? ""))),
    careerPaths: uniq(employees.map((e) => String(e["career_path"] ?? ""))),
    jobTitles: uniq(employees.map((e) => String(e["job_title"] ?? ""))),
    specializations: uniq(employees.map((e) => String(e["specialization"] ?? ""))),
    genders: uniq(employees.map((e) => String(e["gender"] ?? ""))),
    nationalities: uniq(employees.map((e) => String(e["nationality"] ?? ""))),
    statuses: uniq(employees.map((e) => String(e["status"] ?? ""))),
  }), [employees]);

  // Enhanced employees rows with calculated hijri dates and defaults
  const normalizedRows = useMemo(() => {
    return employees.map((e, index): Record<string, unknown> => {
      const birth = String(e["birth_date"] ?? "");
      const hire = String(e["hire_date"] ?? "");
      const start = String(e["start_date"] ?? "");
      return {
        ...e,
        seq: index + 1,
        main_branch: e["main_branch"] || e["branch"] || "بني سويف",
        job_level_type: e["job_level_type"] || (e["job_level"] === "تعليمي" ? "معلم" : "إداري"),
        job_category: e["job_category"] || (e["nationality"] === "سعودي" ? "سعودي تأمينات" : "مقيم تأمينات"),
        religion: e["religion"] || "مسلم",
        social_status: e["social_status"] || "أعزب",
        birth_place: e["birth_place"] || (e["nationality"] === "سعودي" ? "السعودية" : "مصر"),
        birth_date_hijri: toHijri(birth),
        hire_date_hijri: toHijri(hire),
        start_date_hijri: toHijri(start),
        annual_leave_calc_hijri: toHijri(hire),
        contract_end_date: e["contract_end_date"] || "—",
      };
    });
  }, [employees]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const f = appliedFilters || filters;
    const gSearch = globalSearch.trim().toLowerCase();

    return normalizedRows.filter((r) => {
      // Top filters
      if (f.branch && r["branch"] !== f.branch) return false;
      if (f.department && r["department"] !== f.department) return false;
      if (f.mainDepartment && r["main_department"] !== f.mainDepartment) return false;
      if (f.sector && r["sector"] !== f.sector) return false;
      if (f.careerPath && r["career_path"] !== f.careerPath) return false;
      if (f.jobTitle && r["job_title"] !== f.jobTitle) return false;
      if (f.specialization && r["specialization"] !== f.specialization) return false;
      if (f.gender && r["gender"] !== f.gender) return false;
      if (f.nationality && r["nationality"] !== f.nationality) return false;
      if (f.status && r["status"] !== f.status) return false;

      if (f.employee) {
        const empQ = f.employee.trim().toLowerCase();
        const matchName = String(r["full_name"] ?? "").toLowerCase().includes(empQ);
        const matchNo = String(r["emp_no"] ?? "").includes(empQ);
        if (!matchName && !matchNo) return false;
      }

      if (f.hireFrom && String(r["hire_date"] ?? "") < f.hireFrom) return false;
      if (f.hireTo && String(r["hire_date"] ?? "") > f.hireTo) return false;
      if (f.startFrom && String(r["start_date"] ?? "") < f.startFrom) return false;
      if (f.startTo && String(r["start_date"] ?? "") > f.startTo) return false;

      // Global search
      if (gSearch) {
        const hasMatch = Object.values(r).some((v) =>
          String(v ?? "").toLowerCase().includes(gSearch)
        );
        if (!hasMatch) return false;
      }

      // Column-level filters
      for (const [colKey, query] of Object.entries(colFilters)) {
        if (!query.trim()) continue;
        const cellVal = String(r[colKey] ?? "").toLowerCase();
        if (!cellVal.includes(query.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [normalizedRows, appliedFilters, filters, globalSearch, colFilters]);

  // Sorted rows
  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    if (!sortCol) return list;
    return list.sort((a, b) => {
      const valA = a[sortCol] ?? "";
      const valB = b[sortCol] ?? "";
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA);
      const strB = String(valB);
      return sortAsc ? strA.localeCompare(strB, "ar") : strB.localeCompare(strA, "ar");
    });
  }, [filteredRows, sortCol, sortAsc]);

  // Paginated rows
  const totalItems = sortedRows.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // Active columns
  const activeColumns = useMemo(() => {
    return ALL_COLUMNS.filter((c) => visibleColumns[c.key]);
  }, [visibleColumns]);

  const selectedCount = Object.values(visibleColumns).filter(Boolean).length;

  // Toggle single column
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Select all / Deselect all
  const toggleAllColumns = (val: boolean) => {
    const next: Record<string, boolean> = {};
    for (const c of ALL_COLUMNS) next[c.key] = val;
    setVisibleColumns(next);
  };

  // Handle sort click
  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colKey);
      setSortAsc(true);
    }
  };

  /* ─── Export Functions ─── */
  const exportToExcel = (extension: "xlsx" | "xls") => {
    const headers = activeColumns.map((c) => c.label);
    const dataRows = sortedRows.map((r) =>
      activeColumns.map((c) => (c.formatter ? c.formatter(r[c.key], r) : r[c.key] ?? ""))
    );

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    // Set RTL direction for Excel sheet
    if (!worksheet["!views"]) worksheet["!views"] = [];
    worksheet["!views"].push({ rightToLeft: true });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "البيانات الأساسية");

    XLSX.writeFile(workbook, `تقرير-البيانات-الأساسية.${extension}`);
  };

  const exportToCsv = () => {
    const headers = activeColumns.map((c) => `"${c.label}"`).join(",");
    const rows = sortedRows
      .map((r) =>
        activeColumns
          .map((c) => {
            const val = c.formatter ? c.formatter(r[c.key], r) : r[c.key] ?? "";
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + headers + "\n" + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `تقرير-البيانات-الأساسية.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered column list for Chooser search
  const searchedColumns = useMemo(() => {
    const q = columnSearchTerm.trim().toLowerCase();
    if (!q) return ALL_COLUMNS;
    return ALL_COLUMNS.filter((c) => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q));
  }, [columnSearchTerm]);

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="manage_accounts" size={22} className="text-[#0070c0]" />
          تقرير البيانات الاساسية
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير بيانات الموظفين / البيانات الأساسية</div>
      </div>

      {/* Filter Card */}
      <div className="mb-4 rounded-xl border border-[#b4c7e7] bg-[#f0f6ff]/70 p-4 shadow-sm" dir="rtl">
        {/* Row 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">الفرع</span>
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
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
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
            <span className="text-[11px] font-bold text-slate-700 text-right">الوظيفة الحالية</span>
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
            <span className="text-[11px] font-bold text-slate-700 text-right">التخصص</span>
            <select
              value={filters.specialization}
              onChange={(e) => setFilters((p) => ({ ...p, specialization: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.specializations.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">الموظفين</span>
            <input
              type="text"
              placeholder="اختر أو ابحث..."
              value={filters.employee}
              onChange={(e) => setFilters((p) => ({ ...p, employee: e.target.value }))}
              className={inputCls}
            />
          </label>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">الجنس</span>
            <select
              value={filters.gender}
              onChange={(e) => setFilters((p) => ({ ...p, gender: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.genders.map((o) => (
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
            <span className="text-[11px] font-bold text-slate-700 text-right">حالة الموظف</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.statuses.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          {/* Column Chooser dropdown in Filter Card */}
          <div className="flex flex-col gap-0.5 relative" ref={dropdownRef}>
            <span className="text-[11px] font-bold text-slate-700 text-right">العمود</span>
            <div
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className={`${inputCls} flex items-center justify-between cursor-pointer select-none bg-white`}
            >
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-bold flex items-center gap-1">
                selected {selectedCount}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAllColumns(false);
                  }}
                  className="text-slate-400 hover:text-rose-500 font-extrabold ml-1"
                >
                  ✕
                </button>
              </span>
              <MaterialIcon name="arrow_drop_down" size={18} className="text-slate-600" />
            </div>

            {/* Dropdown Popup */}
            {isColumnDropdownOpen && (
              <div className="absolute top-full right-0 z-50 mt-1 w-64 max-h-72 overflow-y-auto rounded-lg border border-[#0070c0]/30 bg-white p-3 shadow-xl text-right">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCount === ALL_COLUMNS.length}
                      onChange={(e) => toggleAllColumns(e.target.checked)}
                      className="rounded text-[#0070c0]"
                    />
                    Select All
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">{selectedCount} / {ALL_COLUMNS.length}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {ALL_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-[11px] hover:bg-blue-50/60 cursor-pointer"
                    >
                      <span className="text-slate-700 font-medium">{col.label}</span>
                      <input
                        type="checkbox"
                        checked={!!visibleColumns[col.key]}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded text-[#0070c0]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 4 - Date ranges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">تاريخ التعيين من</span>
            <input
              type="date"
              value={filters.hireFrom}
              onChange={(e) => setFilters((p) => ({ ...p, hireFrom: e.target.value }))}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">تاريخ التعيين إلى</span>
            <input
              type="date"
              value={filters.hireTo}
              onChange={(e) => setFilters((p) => ({ ...p, hireTo: e.target.value }))}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">تاريخ المباشرة من</span>
            <input
              type="date"
              value={filters.startFrom}
              onChange={(e) => setFilters((p) => ({ ...p, startFrom: e.target.value }))}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">تاريخ المباشرة إلى</span>
            <input
              type="date"
              value={filters.startTo}
              onChange={(e) => setFilters((p) => ({ ...p, startTo: e.target.value }))}
              className={inputCls}
            />
          </label>
        </div>

        {/* Submit button */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              setAppliedFilters({ ...filters });
              setCurrentPage(1);
            }}
            className="flex items-center gap-1 rounded bg-[#0070c0] px-8 py-1.5 text-[13px] font-extrabold text-white shadow-sm hover:bg-[#005fa3] transition"
          >
            <MaterialIcon name="search" size={16} />
            بحث
          </button>
        </div>
      </div>

      {/* Toolbar above DataGrid */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200" dir="rtl">
        {/* Search input & Export buttons */}
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

          {/* Export Icons */}
          <div className="flex items-center gap-1.5 mr-2">
            {/* PDF */}
            <button
              onClick={handlePrint}
              title="تصدير PDF / طباعة"
              className="flex items-center justify-center h-8 w-8 rounded border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition shadow-xs"
            >
              <span className="text-[10px] font-extrabold uppercase">PDF</span>
            </button>

            {/* XLS */}
            <button
              onClick={() => exportToExcel("xls")}
              title="تصدير XLS"
              className="flex items-center justify-center h-8 w-8 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-xs"
            >
              <span className="text-[10px] font-extrabold uppercase">XLS</span>
            </button>

            {/* XLSX */}
            <button
              onClick={() => exportToExcel("xlsx")}
              title="تصدير XLSX"
              className="flex items-center justify-center h-8 px-2 rounded border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs gap-1 font-bold text-[11px]"
            >
              <MaterialIcon name="table_chart" size={14} />
              <span>XLSX</span>
            </button>

            {/* CSV */}
            <button
              onClick={exportToCsv}
              title="تصدير CSV"
              className="flex items-center justify-center h-8 px-2 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-xs font-bold text-[11px]"
            >
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Column Chooser Toggle Button */}
        <button
          onClick={() => setIsColumnPanelOpen(!isColumnPanelOpen)}
          className="flex items-center gap-1.5 rounded border border-[#0070c0] bg-blue-50 px-3 py-1 text-[11px] font-extrabold text-[#0070c0] hover:bg-blue-100 transition"
        >
          <MaterialIcon name="view_column" size={16} />
          <span>تخصيص الأعمدة ({selectedCount})</span>
        </button>
      </div>

      {/* Main Table Layout with optional Column Chooser floating panel */}
      <div className="relative">
        {/* Floating Column Chooser Panel (Matching Screenshot 2) */}
        {isColumnPanelOpen && (
          <div
            className="absolute top-0 left-4 z-40 w-64 rounded-lg border-2 border-slate-300 bg-white shadow-2xl overflow-hidden"
            dir="rtl"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between bg-[#004e82] text-white px-3 py-2">
              <span className="text-xs font-bold">Column Chooser</span>
              <button
                onClick={() => setIsColumnPanelOpen(false)}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-extrabold"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search 🔍"
                  value={columnSearchTerm}
                  onChange={(e) => setColumnSearchTerm(e.target.value)}
                  className="w-full h-7 text-xs border border-slate-300 rounded px-2 outline-none focus:border-[#0070c0]"
                />
              </div>
            </div>

            {/* Column items */}
            <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1 text-right">
              {searchedColumns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center justify-between px-2 py-1 hover:bg-blue-50 rounded text-[11px] font-medium text-slate-700 cursor-pointer"
                >
                  <span>{col.label}</span>
                  <input
                    type="checkbox"
                    checked={!!visibleColumns[col.key]}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded text-[#0070c0]"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* DataGrid Table Container */}
        <div className="overflow-x-auto rounded-lg border border-[#004e82]/30 shadow-xs" dir="rtl">
          <table className="w-full border-collapse text-[11px]">
            {/* Header Row (Dark Blue) */}
            <thead>
              <tr className="bg-[#004e82] text-white">
                {activeColumns.map((col) => (
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

              {/* Per-column search / filter row */}
              <tr className="bg-[#e8f1fb] border-b border-slate-300">
                {activeColumns.map((col) => (
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

            {/* Data Rows */}
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={activeColumns.length} className="text-center py-10 text-slate-500 font-bold">
                    جارٍ تحميل البيانات...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length} className="text-center py-12 text-slate-400 font-bold">
                    لا توجد سجلات تطابق البحث
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <tr
                    key={String(row["id"] ?? idx)}
                    className={`border-b border-slate-200 transition hover:bg-blue-50/70 ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#f8fafd]"
                    }`}
                  >
                    {activeColumns.map((col) => {
                      const val = col.formatter ? col.formatter(row[col.key], row) : String(row[col.key] ?? "—");
                      return (
                        <td
                          key={col.key}
                          className={`px-2.5 py-1.5 border-r border-slate-200 last:border-r-0 text-slate-800 font-medium whitespace-nowrap ${
                            col.align === "center"
                              ? "text-center"
                              : col.align === "left"
                              ? "text-left font-mono"
                              : "text-right"
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer & Pagination */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600" dir="rtl">
        {/* Pagination controls */}
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

        {/* Page size selector */}
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

      {/* Copyright footer */}
      <div className="mt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200 pt-4">
        جميع الحقوق محفوظة © الحلول الخبيرة
      </div>
    </AppShell>
  );
}
