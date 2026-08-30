import { useState, useRef, type ReactNode } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export interface ExportData {
  filename: string;
  sheetName?: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

interface ReportDocumentViewerProps {
  title: string;
  subtitle?: string;
  companyName?: string;
  printDate?: string;
  totalRecords?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  exportData?: ExportData;
  children: ReactNode;
  actions?: ReactNode;
  hideToolbar?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export function ReportDocumentViewer({
  title,
  subtitle,
  companyName = "شركة الحلول الخبيرة",
  printDate,
  totalRecords,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  exportData,
  children,
  actions,
  hideToolbar = false,
}: ReportDocumentViewerProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const formattedDate =
    printDate ||
    new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

  /* -------------------------------- Exports -------------------------------- */

  const handleExportXLSX = () => {
    if (!exportData) {
      toast.error("لا توجد بيانات جاهزة للتصدير");
      return;
    }
    try {
      const wb = XLSX.utils.book_new();
      const wsData = [exportData.headers, ...exportData.rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set Right-to-Left in sheet views
      ws["!views"] = [{ RTL: true }];

      // Auto width
      const colWidths = exportData.headers.map((h, i) => {
        let maxLen = h.length;
        for (const r of exportData.rows) {
          const val = r[i] != null ? String(r[i]) : "";
          if (val.length > maxLen) maxLen = val.length;
        }
        return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
      });
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, exportData.sheetName || "التقرير");
      XLSX.writeFile(wb, `${exportData.filename || "report"}.xlsx`);
      toast.success("تم تصدير ملف Excel بنجاح");
      setExportMenuOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ أثناء تصدير Excel");
    }
  };

  const handleExportCSV = () => {
    if (!exportData) {
      toast.error("لا توجد بيانات جاهزة للتصدير");
      return;
    }
    try {
      const escape = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
      const csvContent =
        "\uFEFF" +
        [exportData.headers.map(escape).join(","), ...exportData.rows.map((r) => r.map(escape).join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportData.filename || "report"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تصدير ملف CSV بنجاح");
      setExportMenuOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ أثناء تصدير CSV");
    }
  };

  const handleExportText = () => {
    if (!exportData) {
      toast.error("لا توجد بيانات جاهزة للتصدير");
      return;
    }
    try {
      const lines = [
        exportData.headers.join("\t|\t"),
        "-".repeat(80),
        ...exportData.rows.map((r) => r.map((c) => String(c ?? "")).join("\t|\t")),
      ];
      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportData.filename || "report"}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تصدير الملف النصي بنجاح");
      setExportMenuOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ أثناء التصدير النصي");
    }
  };

  const handlePrint = () => {
    setExportMenuOpen(false);
    window.print();
  };

  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={viewerContainerRef}
      className={`report-document-viewer mt-4 flex flex-col rounded-2xl border border-border bg-slate-100/90 dark:bg-slate-900/90 shadow-sm ${
        isFullscreen ? "p-4 fixed inset-0 z-50 overflow-y-auto bg-slate-200 dark:bg-slate-950" : ""
      }`}
    >
      {/* --------------------------- Top Toolbar --------------------------- */}
      {!hideToolbar && (
        <div className="report-viewer-toolbar flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/90 px-4 py-2 backdrop-blur-sm print:hidden">
          {/* Right Tools (Pagination & Views) */}
          <div className="flex items-center gap-1.5 text-xs text-foreground">
            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "تصغير الشاشة" : "شاشة كاملة"}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <MaterialIcon name={isFullscreen ? "fullscreen_exit" : "fullscreen"} size={19} />
            </button>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Export dropdown menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportMenuOpen((prev) => !prev)}
                title="تصدير"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 font-bold text-[12px] text-foreground hover:bg-secondary transition-colors"
              >
                <MaterialIcon name="file_download" size={17} className="text-primary" />
                <span>تصدير</span>
                <MaterialIcon name="arrow_drop_down" size={16} />
              </button>

              {exportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setExportMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-border bg-popover p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-right text-[12px] font-bold text-foreground hover:bg-secondary"
                    >
                      <MaterialIcon name="picture_as_pdf" size={16} className="text-rose-500" />
                      <span>PDF (طباعة)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportXLSX}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-right text-[12px] font-bold text-foreground hover:bg-secondary"
                    >
                      <MaterialIcon name="table_view" size={16} className="text-emerald-600" />
                      <span>Excel (XLSX)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-right text-[12px] font-bold text-foreground hover:bg-secondary"
                    >
                      <MaterialIcon name="receipt_long" size={16} className="text-blue-500" />
                      <span>CSV (قيم مفصولة)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportText}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-right text-[12px] font-bold text-foreground hover:bg-secondary"
                    >
                      <MaterialIcon name="description" size={16} className="text-slate-500" />
                      <span>Text (نصي)</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              title="طباعة"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <MaterialIcon name="print" size={18} />
            </button>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                title="تصغير"
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <MaterialIcon name="remove" size={16} />
              </button>
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-7 rounded-lg border border-border bg-background px-2 text-[11px] font-bold outline-none"
              >
                <option value={75}>75%</option>
                <option value={90}>90%</option>
                <option value={100}>Whole Page (100%)</option>
                <option value={110}>110%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
              </select>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(175, z + 10))}
                title="تكبير"
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <MaterialIcon name="add" size={16} />
              </button>
            </div>
          </div>

          {/* Left Tools (Pagination & Custom Actions) */}
          <div className="flex items-center gap-2">
            {actions}

            {totalPages > 1 && (
              <div className="flex items-center gap-1 font-mono text-[12px]">
                <button
                  type="button"
                  onClick={() => onPageChange?.(1)}
                  disabled={currentPage <= 1}
                  title="الصفحة الأولى"
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <MaterialIcon name="first_page" size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  title="الصفحة السابقة"
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <MaterialIcon name="chevron_right" size={18} />
                </button>

                <span className="px-2 py-1 text-xs font-bold text-foreground">
                  {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  title="الصفحة التالية"
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <MaterialIcon name="chevron_left" size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange?.(totalPages)}
                  disabled={currentPage >= totalPages}
                  title="الصفحة الأخيرة"
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <MaterialIcon name="last_page" size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------ Document Paper Preview ------------------------ */}
      <div className="report-paper-container overflow-x-auto p-4 sm:p-8 flex justify-center items-start">
        <div
          className="report-sheet bg-white text-slate-900 shadow-xl border border-slate-200 rounded-sm w-full max-w-[920px] min-h-[1150px] p-8 sm:p-10 flex flex-col justify-between transition-all duration-150 origin-top"
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
            transformOrigin: "top center",
          }}
        >
          <div>
            {/* Top Company Banner / Logo */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3 mb-4 text-xs font-semibold text-slate-600">
              <div>
                <div className="text-base font-extrabold text-[#004e82] flex items-center gap-2">
                  <span className="size-3.5 rounded-full bg-[#0070c0]" />
                  {companyName}
                </div>
                <div className="text-[11px] text-slate-500 font-bold">ساماكو - نظام الموارد البشرية المتكامل</div>
              </div>
              <div className="text-left font-mono text-[11px]">
                <div>تاريخ الطباعة: {formattedDate}</div>
                {totalRecords !== undefined && <div>إجمالي السجلات: {totalRecords}</div>}
              </div>
            </div>

            {/* Document Header Title (Blue Banner) */}
            <div className="mb-4">
              <div className="bg-[#0070c0] text-white text-center font-extrabold py-2 px-4 rounded text-sm sm:text-base tracking-wide shadow-sm">
                {title}
              </div>
              {subtitle && (
                <div className="mt-1.5 text-center text-xs font-bold text-slate-700">
                  {subtitle}
                </div>
              )}
            </div>

            {/* Paper Body / Injected Report Content */}
            <div className="report-body text-slate-800 text-[13px]">{children}</div>
          </div>

          {/* Document Footer */}
          <div className="mt-12 border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <div>جميع الحقوق محفوظة © {companyName}</div>
            <div className="font-mono text-[10px]">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Sub-components for Reports                         */
/* -------------------------------------------------------------------------- */

/** Employee Info Grid for Employee-specific Reports */
export function EmployeeReportCard({
  name,
  empNo,
  branch,
  department,
  mainDept,
  sector,
  jobLevel,
  hireDate,
  startDate,
  nationalId,
}: {
  name: string;
  empNo: string | number;
  branch?: string;
  department?: string;
  mainDept?: string;
  sector?: string;
  jobLevel?: string;
  hireDate?: string;
  startDate?: string;
  nationalId?: string;
}) {
  return (
    <div className="mb-5 overflow-hidden rounded border border-[#0070c0]/40 bg-slate-50/50">
      {/* Employee Name Banner */}
      <div className="bg-[#0070c0]/15 text-[#004e82] px-4 py-1.5 font-extrabold text-sm border-b border-[#0070c0]/30 flex items-center justify-between">
        <span>{name || "—"}</span>
        <span className="font-mono text-xs font-bold text-slate-600">الرقم الوظيفي: {empNo || "—"}</span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 p-3 text-xs">
        <div>
          <span className="text-slate-500 font-bold">الفرع: </span>
          <span className="font-semibold text-slate-800">{branch || "شركة الحلول الخبيرة"}</span>
        </div>
        <div>
          <span className="text-slate-500 font-bold">القسم: </span>
          <span className="font-semibold text-slate-800">{department || "—"}</span>
        </div>
        <div>
          <span className="text-slate-500 font-bold">القسم الرئيسي: </span>
          <span className="font-semibold text-slate-800">{mainDept || "القسم الرئيسي"}</span>
        </div>
        <div>
          <span className="text-slate-500 font-bold">القطاع: </span>
          <span className="font-semibold text-slate-800">{sector || "قطاع الإدارة"}</span>
        </div>
        <div>
          <span className="text-slate-500 font-bold">المستوى الوظيفي: </span>
          <span className="font-semibold text-slate-800">{jobLevel || "إداري"}</span>
        </div>
        <div>
          <span className="text-slate-500 font-bold">تاريخ التعيين: </span>
          <span className="font-semibold text-slate-800 font-mono">{hireDate || "—"}</span>
        </div>
        <div>
          <span className="text-slate-500 font-bold">تاريخ المباشرة: </span>
          <span className="font-semibold text-slate-800 font-mono">{startDate || "—"}</span>
        </div>
        <div>
          <span className="text-slate-500 font-bold">رقم الهوية: </span>
          <span className="font-semibold text-slate-800 font-mono">{nationalId || "—"}</span>
        </div>
      </div>
    </div>
  );
}

/** Section Table Banner (e.g. أيام إجازة رسمية / غياب أيام) */
export function ReportSectionTable({
  title,
  count,
  columns,
  rows,
}: {
  title: string;
  count: number;
  columns: { label: string; key: string; align?: "left" | "right" | "center"; className?: string }[];
  rows: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  return (
    <div className="mb-5 overflow-hidden rounded border border-slate-200">
      <div className="bg-[#0070c0]/90 text-white px-4 py-1.5 font-bold text-xs flex items-center justify-between">
        <span>{title}</span>
        <span className="bg-white/20 px-2 py-0.5 rounded text-[11px]">{count} يوم</span>
      </div>
      <table className="w-full text-right text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 ${c.align === "left" ? "text-left" : c.align === "center" ? "text-center" : "text-right"} ${c.className || ""}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-4 text-center text-slate-400 font-semibold">
                لا توجد أيام مسجلة
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/50 hover:bg-blue-50/40">
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-1.5 ${c.align === "left" ? "text-left font-mono" : c.align === "center" ? "text-center" : "text-right"}`}>
                    {String(r[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Standard Full Report Table (Daily Absence, Exceptions, Absence Values) */
export function ReportStandardTable({
  columns,
  rows,
  summaryFooter,
}: {
  columns: {
    label: string;
    key: string;
    align?: "left" | "right" | "center";
    className?: string;
    render?: (row: Record<string, any>, idx: number) => ReactNode; // eslint-disable-line @typescript-eslint/no-explicit-any
  }[];
  rows: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  summaryFooter?: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded border border-slate-200">
      <table className="w-full text-right text-xs border-collapse">
        <thead>
          <tr className="bg-[#0070c0] text-white font-extrabold border-b border-slate-200">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2.5 whitespace-nowrap ${
                  c.align === "left" ? "text-left" : c.align === "center" ? "text-center" : "text-right"
                } ${c.className || ""}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-400 font-bold">
                لا توجد بيانات مطابقة لمعايير البحث
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={i}
                className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/50 transition-colors"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-2 whitespace-nowrap text-slate-800 ${
                      c.align === "left" ? "text-left font-mono" : c.align === "center" ? "text-center" : "text-right"
                    }`}
                  >
                    {c.render ? c.render(r, i) : String(r[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {summaryFooter && (
          <tfoot>
            <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
              <td colSpan={columns.length} className="px-4 py-2 text-xs">
                {summaryFooter}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
