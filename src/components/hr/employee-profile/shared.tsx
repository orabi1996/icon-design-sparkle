import { useState, type ReactNode } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";

export const fieldInputClass =
  "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#1d6fa5] focus:ring-2 focus:ring-[#1d6fa5]/15 disabled:bg-slate-100 disabled:text-slate-500";

export const fieldSelectClass = fieldInputClass + " cursor-pointer";

export function toHijriDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const clean = String(dateStr).slice(0, 10);
  const d = new Date(clean + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

export function formatNumber(val: number | string | null | undefined): string {
  const num = Number(val ?? 0);
  if (Number.isNaN(num)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(num);
}

export function ProfileField({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block text-right", className)}>
      <span className="mb-1.5 block text-[11px] font-bold text-slate-600">
        {label}
        {required && <span className="mr-1 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export function ClearableSelect({
  value,
  onChange,
  options,
  placeholder = "اختر ...",
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="relative flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldSelectClass}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          title="مسح"
          className="absolute left-7 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <MaterialIcon name="cancel" size={15} />
        </button>
      )}
    </div>
  );
}

export function FileUploadBox({
  fileName,
  onFileSelect,
  label = "ارفق ملف او اسحبه هنا",
}: {
  fileName?: string | undefined;
  onFileSelect: (fileName: string) => void;
  label?: string | undefined;
}) {
  return (
    <label className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-sky-300 bg-sky-50/30 px-3 text-xs font-bold text-[#1d6fa5] transition hover:bg-sky-50">
      <MaterialIcon name="cloud_upload" size={20} className="text-[#1d6fa5]" />
      <span className="truncate">{fileName || label}</span>
      <input
        type="file"
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files?.[0]?.name ?? "")}
      />
    </label>
  );
}

export function SubTableToolbar({
  search,
  onSearchChange,
  onRefresh,
  onExportCsv,
  onPrint,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh?: () => void;
  onExportCsv?: () => void;
  onPrint?: () => void;
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2" dir="rtl">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onRefresh}
          title="تحديث"
          className="grid size-7 place-items-center rounded bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
        >
          <MaterialIcon name="refresh" size={15} />
        </button>
        <button
          type="button"
          onClick={onPrint}
          title="طباعة"
          className="grid size-7 place-items-center rounded bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
        >
          <MaterialIcon name="print" size={15} />
        </button>
        <button
          type="button"
          onClick={onExportCsv}
          title="تصدير Excel"
          className="grid size-7 place-items-center rounded bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
        >
          <MaterialIcon name="table_view" size={15} />
        </button>
        <button
          type="button"
          onClick={onPrint}
          title="تصدير PDF"
          className="grid size-7 place-items-center rounded bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
        >
          <MaterialIcon name="picture_as_pdf" size={15} />
        </button>
      </div>

      <div className="relative w-56">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ابحث..."
          className="h-8 w-full rounded-md border border-slate-200 bg-white pe-3 ps-8 text-[11px] outline-none focus:border-[#1d6fa5]"
        />
        <MaterialIcon
          name="search"
          size={15}
          className="pointer-events-none absolute inset-y-0 left-2.5 my-auto h-fit text-slate-400"
        />
      </div>
    </div>
  );
}

export function ProfileGridTable({
  columns,
  rows,
  emptyText = "No data",
  title = "بيانات الموظف",
}: {
  columns: {
    key: string;
    label: string;
    type?: "text" | "date" | "action";
    render?: (row: any, idx: number) => ReactNode;
  }[];
  rows: any[];
  emptyText?: string;
  title?: string;
}) {
  const [search, setSearch] = useState("");
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filteredRows = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (
      q &&
      !columns.some((c) =>
        String(r[c.key] ?? "")
          .toLowerCase()
          .includes(q),
      )
    ) {
      return false;
    }
    return columns.every((c) => {
      const cf = (colFilters[c.key] ?? "").trim().toLowerCase();
      if (!cf) return true;
      return String(r[c.key] ?? "")
        .toLowerCase()
        .includes(cf);
    });
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCsv = () => {
    const dataCols = columns.filter((c) => c.type !== "action");
    const quote = (v: string) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const csv = [
      dataCols.map((c) => quote(c.label)).join(","),
      ...filteredRows.map((r) => dataCols.map((c) => quote(String(r[c.key] ?? ""))).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printTable = () => {
    const dataCols = columns.filter((c) => c.type !== "action");
    const win = window.open("", "_blank", "width=1000,height=700");
    if (!win) return;
    const ths = dataCols.map((c) => `<th>${c.label}</th>`).join("");
    const trs = filteredRows
      .map(
        (r) =>
          `<tr>${dataCols.map((c) => `<td>${String(r[c.key] ?? "—")}</td>`).join("")}</tr>`,
      )
      .join("");
    win.document.write(
      `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:20px}h2{text-align:center}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0b4f7c;color:#fff;padding:8px;border:1px solid #ccc}td{padding:6px;border:1px solid #ccc;text-align:center}</style></head><body><h2>${title}</h2><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="mt-4">
      <SubTableToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onRefresh={() => {
          setSearch("");
          setColFilters({});
          setPage(1);
        }}
        onExportCsv={exportCsv}
        onPrint={printTable}
      />

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full border-collapse text-center text-[11px]">
          <thead>
            <tr className="bg-[#0b4f7c] text-white">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="h-9 whitespace-nowrap border-l border-white/15 px-2.5 font-bold"
                >
                  <span className="flex items-center justify-center gap-1">
                    {col.type !== "action" && (
                      <MaterialIcon name="filter_alt" size={13} className="text-white/80" />
                    )}
                    {col.label}
                  </span>
                </th>
              ))}
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              {columns.map((col) => (
                <th key={col.key} className="h-8 border-l border-slate-200/80 p-1">
                  {col.type !== "action" && (
                    <div className="relative flex items-center">
                      <input
                        type={col.type === "date" ? "date" : "text"}
                        value={colFilters[col.key] ?? ""}
                        onChange={(e) => {
                          setColFilters((prev) => ({ ...prev, [col.key]: e.target.value }));
                          setPage(1);
                        }}
                        className="h-6 w-full rounded border border-slate-200 bg-white px-1.5 pe-5 text-[10px] font-normal text-slate-700 outline-none focus:border-[#1d6fa5]"
                      />
                      <MaterialIcon
                        name={col.type === "date" ? "calendar_today" : "search"}
                        size={12}
                        className="pointer-events-none absolute left-1.5 text-slate-400"
                      />
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-20 text-xs text-slate-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => (
                <tr
                  key={String(row["id"] ?? idx)}
                  className="border-b border-slate-200/70 odd:bg-white even:bg-slate-50/60 hover:bg-sky-50/40"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="h-9 whitespace-nowrap border-l border-slate-200/60 px-2.5 font-medium text-slate-700"
                    >
                      {col.render ? col.render(row, idx) : String(row[col.key] ?? "—") || "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
          {[5, 10, 20].map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => {
                setPageSize(sz);
                setPage(1);
              }}
              className={cn(
                "grid size-6 place-items-center rounded text-[11px] font-bold cursor-pointer",
                pageSize === sz
                  ? "bg-slate-200 text-slate-800"
                  : "text-slate-500 hover:bg-slate-100",
              )}
            >
              {sz}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="grid size-6 place-items-center rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer"
          >
            <MaterialIcon name="chevron_right" size={15} />
          </button>
          <span className="grid size-6 place-items-center rounded bg-slate-200 font-bold text-slate-800">
            {currentPage}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="grid size-6 place-items-center rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer"
          >
            <MaterialIcon name="chevron_left" size={15} />
          </button>
          <span className="ms-1">
            صفحة {currentPage} من {totalPages} ({filteredRows.length} عنصر)
          </span>
        </div>
      </div>
    </div>
  );
}
