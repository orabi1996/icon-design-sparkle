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

const attachmentMemoryStore = new Map<string, string>();

export function saveAttachmentData(fileName: string, dataUrl: string): void {
  if (!fileName || !dataUrl) return;
  attachmentMemoryStore.set(fileName, dataUrl);
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem("hr_attachments_store");
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[fileName] = dataUrl;
    window.localStorage.setItem("hr_attachments_store", JSON.stringify(map));
  } catch {
    // If localStorage quota is exceeded, memory store still holds it for the session
  }
}

export function getAttachmentData(value: string): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (str.startsWith("data:") || str.startsWith("blob:") || str.startsWith("http")) {
    return str;
  }
  const mem = attachmentMemoryStore.get(str);
  if (mem) return mem;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("hr_attachments_store");
      if (raw) {
        const map: Record<string, string> = JSON.parse(raw);
        if (map[str]) return map[str];
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export function isImageAttachment(nameOrUrl: string): boolean {
  if (!nameOrUrl) return false;
  const lower = String(nameOrUrl).toLowerCase();
  return (
    lower.startsWith("data:image/") ||
    /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(lower)
  );
}

export function AttachmentPreviewModal({
  isOpen,
  fileName,
  fileUrl,
  onClose,
}: {
  isOpen: boolean;
  fileName: string;
  fileUrl: string | null;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  const isImg = isImageAttachment(fileUrl || fileName);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-blue-100 text-[#0b57d0]">
              <MaterialIcon name={isImg ? "image" : "description"} size={20} />
            </div>
            <div className="text-right">
              <h3 className="text-sm font-bold text-slate-800 truncate max-w-md">{fileName || "عرض المرفق"}</h3>
              <p className="text-[11px] text-slate-500">{isImg ? "ملف صورة معتمد" : "مستند رسمي"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {fileUrl ? (
              <a
                href={fileUrl}
                download={fileName || "attachment"}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100"
              >
                <MaterialIcon name="download" size={16} />
                <span>تحميل</span>
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
            >
              <MaterialIcon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-h-[320px] max-h-[75vh] items-center justify-center overflow-auto bg-slate-100/60 p-6">
          {fileUrl && isImg ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-h-[68vh] max-w-full rounded-xl object-contain shadow-md"
            />
          ) : fileUrl && !isImg ? (
            <iframe
              src={fileUrl}
              title={fileName}
              className="h-[65vh] w-full rounded-xl border border-slate-200 bg-white shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
              <div className="grid size-16 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <MaterialIcon name={isImg ? "image" : "insert_drive_file"} size={36} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">{fileName}</p>
                <p className="text-xs text-slate-500">تم تسجيل هذا المرفق مسبقاً في النظام</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-2.5 text-xs text-slate-500">
          <span>الحالة: مرفق معتمد</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

export function AttachmentPreviewCell({
  value,
  label = "عرض المرفق",
}: {
  value?: string | null | undefined;
  label?: string | undefined;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const trimmed = String(value ?? "").trim();

  if (
    !trimmed ||
    trimmed === "—" ||
    trimmed === "-" ||
    trimmed === "لا يوجد" ||
    trimmed === "null" ||
    trimmed === "undefined"
  ) {
    return <span className="text-slate-400 text-[11px]">لا يوجد مرفق</span>;
  }

  const dataUrl = getAttachmentData(trimmed);
  const isImg = isImageAttachment(dataUrl || trimmed);

  return (
    <>
      <div className="inline-flex items-center justify-center gap-2 py-0.5">
        {/* Visual Thumbnail */}
        {isImg ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            title="اضغط لتكبير ومعاينة الصورة"
            className="group relative size-8 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-2xs transition hover:border-[#1d6fa5] hover:scale-105 cursor-pointer"
          >
            {dataUrl ? (
              <img
                src={dataUrl}
                alt={trimmed}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center bg-blue-50 text-[#1d6fa5]">
                <MaterialIcon name="image" size={16} />
              </div>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            title="معاينة المستند"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-amber-50 text-amber-700 shadow-2xs hover:border-amber-400 hover:scale-105 transition cursor-pointer"
          >
            <MaterialIcon name="description" size={16} />
          </button>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-[#1d6fa5] transition hover:bg-sky-100 hover:border-sky-300 cursor-pointer shadow-2xs"
        >
          <MaterialIcon name={isImg ? "visibility" : "file_open"} size={13} />
          <span>{label}</span>
        </button>

        {/* Download Button (if fileUrl available) */}
        {dataUrl && (
          <a
            href={dataUrl}
            download={trimmed}
            title="تحميل المرفق"
            className="grid size-6 place-items-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-300"
          >
            <MaterialIcon name="download" size={13} />
          </a>
        )}
      </div>

      {modalOpen && (
        <AttachmentPreviewModal
          isOpen={modalOpen}
          fileName={trimmed}
          fileUrl={dataUrl}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
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
  const previewUrl = fileName ? getAttachmentData(fileName) : null;
  const isImg = fileName ? isImageAttachment(previewUrl || fileName) : false;
  const [modalOpen, setModalOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      onFileSelect("");
      return;
    }
    const objUrl = URL.createObjectURL(file);
    saveAttachmentData(file.name, objUrl);
    onFileSelect(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        saveAttachmentData(file.name, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative">
      {fileName ? (
        <div className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-sky-300 bg-sky-50/60 px-3 text-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {isImg && previewUrl ? (
              <img
                src={previewUrl}
                alt={fileName}
                onClick={() => setModalOpen(true)}
                className="size-8 cursor-pointer rounded-lg border border-sky-200 object-cover shadow-2xs transition hover:scale-105"
                title="اضغط لمعاينة الصورة"
              />
            ) : (
              <div className="grid size-8 place-items-center rounded-lg bg-sky-100 text-[#1d6fa5]">
                <MaterialIcon name={isImg ? "image" : "description"} size={18} />
              </div>
            )}
            <div className="flex flex-col overflow-hidden text-right">
              <span className="truncate font-bold text-slate-800 text-[11px]" title={fileName}>
                {fileName}
              </span>
              <span className="text-[10px] text-sky-700">تم اختيار المرفق بنجاح</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-bold text-[#1d6fa5] hover:bg-sky-100 transition cursor-pointer"
            >
              <MaterialIcon name="visibility" size={13} />
              <span>معاينة</span>
            </button>
            <label className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer">
              <MaterialIcon name="sync" size={13} />
              <span>تغيير</span>
              <input type="file" className="hidden" onChange={handleChange} />
            </label>
            <button
              type="button"
              onClick={() => onFileSelect("")}
              title="إزالة المرفق"
              className="grid size-7 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
            >
              <MaterialIcon name="close" size={16} />
            </button>
          </div>
        </div>
      ) : (
        <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-dashed border-sky-300 bg-sky-50/30 px-3 text-xs font-bold text-[#1d6fa5] transition hover:bg-sky-50 hover:border-sky-400">
          <MaterialIcon name="cloud_upload" size={20} className="text-[#1d6fa5]" />
          <span className="truncate">{label}</span>
          <input type="file" className="hidden" onChange={handleChange} />
        </label>
      )}

      {modalOpen && (
        <AttachmentPreviewModal
          isOpen={modalOpen}
          fileName={fileName || ""}
          fileUrl={previewUrl}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
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
    type?: "text" | "date" | "action" | "attachment";
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
                  {columns.map((col) => {
                    const isAttachment =
                      col.type === "attachment" ||
                      col.key === "attachment" ||
                      col.key === "file" ||
                      col.label.includes("المرفق") ||
                      col.label.includes("المرفقات") ||
                      col.label.includes("جواز السفر") ||
                      (col.key === "notes" &&
                        (col.label.includes("مرفق") || col.label.includes("المرفقات")));

                    let content: ReactNode;
                    if (col.render) {
                      content = col.render(row, idx);
                    } else if (isAttachment) {
                      content = <AttachmentPreviewCell value={row[col.key]} />;
                    } else {
                      content = String(row[col.key] ?? "—") || "—";
                    }

                    return (
                      <td
                        key={col.key}
                        className="h-9 whitespace-nowrap border-l border-slate-200/60 px-2.5 font-medium text-slate-700"
                      >
                        {content}
                      </td>
                    );
                  })}
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
