import { useRef, useState } from "react";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  parseFacilityImportFile,
  type FacilityImportError,
  type FacilityImportResult,
} from "@/lib/facility-data-excel";

const TEMPLATE_URL = "/templates/UpdateFacilityData.xlsx";

function escapeCsv(value: unknown) {
  const raw = String(value ?? "").replaceAll('"', '""');
  return `"${raw}"`;
}

function downloadErrorReport(errors: FacilityImportError[]) {
  const rows = [
    ["الصف", "العمود", "المفتاح التقني", "القيمة الخاطئة", "سبب الخطأ"],
    ...errors.map((e) => [e.row, e.column, e.key, e.value, e.message]),
  ];
  const csv = `\uFEFF${rows.map((r) => r.map(escapeCsv).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "facility-import-errors.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function Metric({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "primary" | "emerald" | "rose";
  icon: string;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}>
          <MaterialIcon name={icon} size={20} filled />
        </span>
        <span className="text-2xl font-black">
          {new Intl.NumberFormat("ar-SA").format(value)}
        </span>
      </div>
      <p className="mt-2 text-[12px] font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

export function FacilityDataImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FacilityImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    setFile(f);
    setResult(null);
    setErrorMsg(null);
  };

  const validate = async () => {
    if (!file) {
      toast.error("يرجى اختيار ملف Excel أولاً");
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      const r = await parseFacilityImportFile(file);
      setResult(r);
      if (r.errors.length === 0) {
        toast.success(`تم التحقق من ${r.validRows.length} صف بنجاح بدون أخطاء`);
      } else {
        toast.error(`تم رصد ${r.errors.length} خطأ في ${r.totalRows} صف`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "تعذر قراءة الملف";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const upload = async () => {
    if (!result) {
      await validate();
      return;
    }
    if (result.errors.length > 0) {
      toast.error("لا يمكن الرفع قبل معالجة كافة الأخطاء");
      return;
    }
    // Placeholder: hook this up to Supabase once the target table is agreed on.
    toast.success(
      `جاهز لرفع ${result.validRows.length} صف — سيتم ربطه بالجدول المخصص في الخطوة التالية`,
    );
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const hasErrors = (result?.errors.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <MaterialIcon name="apartment" size={22} className="text-primary" filled />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold">تحديث بيانات المنشأة</h3>
            <p className="text-[11.5px] font-semibold text-muted-foreground">
              نموذج بعمودين فقط: <code className="font-mono text-primary">IdNumber</code> (رقم
              الهوية) و <code className="font-mono text-primary">workNumber</code> (رقم مكتب
              العمل).
            </p>
          </div>
          <a
            href={TEMPLATE_URL}
            download
            className="ms-auto flex items-center gap-2 rounded-xl border border-primary/25 bg-card px-4 py-2 text-[13px] font-bold text-primary transition-colors hover:bg-primary/10"
          >
            <MaterialIcon name="download" size={18} />
            تحميل النموذج
          </a>
        </div>

        {/* Dropzone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
            dragOver
              ? "border-primary bg-primary/8"
              : "border-primary/30 bg-card/70 hover:border-primary/60 hover:bg-card"
          }`}
        >
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <MaterialIcon name="cloud_upload" size={24} filled />
          </span>
          {file ? (
            <>
              <span className="flex items-center gap-1.5 text-[13px] font-bold">
                <MaterialIcon name="description" size={17} className="text-primary" />
                {file.name}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {(file.size / 1024).toFixed(1)} ك.ب — اضغط للاستبدال
              </span>
            </>
          ) : (
            <>
              <span className="text-[13px] font-bold">اسحب الملف هنا أو اضغط للاختيار</span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                الصيغة المدعومة: XLSX — حتى ١٠ ميجابايت
              </span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            onClick={validate}
            disabled={!file || busy}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <MaterialIcon name="task_alt" size={18} />
            {busy ? "جارٍ التحقق..." : "تحقق من الملف"}
          </button>
          <button
            onClick={upload}
            disabled={!file || busy || hasErrors}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
            title={hasErrors ? "يجب معالجة الأخطاء قبل الرفع" : "رفع الملف"}
          >
            <MaterialIcon name="upload" size={18} />
            رفع الملف
          </button>
          <button
            onClick={reset}
            disabled={!file || busy}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] font-bold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
          >
            <MaterialIcon name="restart_alt" size={18} />
            إعادة تعيين
          </button>
        </div>
      </div>

      {/* File-level error (bad format / bad zip / missing sheet) */}
      {errorMsg && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-[13px] font-bold text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <MaterialIcon name="error" size={19} />
            {errorMsg}
          </div>
        </div>
      )}

      {/* Result metrics */}
      {result && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="إجمالي الصفوف" value={result.totalRows} icon="dataset" tone="primary" />
          <Metric
            label="صفوف صحيحة"
            value={result.validRows.length}
            icon="check_circle"
            tone="emerald"
          />
          <Metric label="عدد الأخطاء" value={result.errors.length} icon="error" tone="rose" />
        </div>
      )}

      {/* Errors table */}
      {result && result.errors.length > 0 && (
        <div
          className="overflow-hidden rounded-2xl border border-rose-200 bg-card dark:border-rose-500/30"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10">
            <h4 className="me-auto flex items-center gap-2 text-sm font-extrabold text-rose-800 dark:text-rose-200">
              <MaterialIcon name="report_gmailerrorred" size={19} filled />
              تفاصيل الأخطاء المرصودة
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                {result.errors.length}
              </span>
            </h4>
            <button
              onClick={() => downloadErrorReport(result.errors)}
              className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-[12px] font-bold text-rose-700 shadow-sm transition-colors hover:bg-rose-50 dark:bg-rose-500/20 dark:text-rose-100"
            >
              <MaterialIcon name="download" size={15} />
              تصدير الأخطاء CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-right">
              <thead>
                <tr className="bg-secondary">
                  {["رقم الصف", "العمود", "القيمة", "سبب الخطأ"].map((c) => (
                    <th
                      key={c}
                      className="whitespace-nowrap border-b border-border px-4 py-3 text-[12px] font-extrabold text-secondary-foreground"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.errors.map((e, i) => (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0 odd:bg-rose-50/40 dark:odd:bg-rose-500/[.04]"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 text-[13px] font-bold text-primary">
                      #{e.row}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] font-semibold">
                      {e.column}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {e.value ? (
                        <code className="rounded-md bg-rose-100 px-1.5 py-0.5 font-mono text-[11.5px] text-rose-800 dark:bg-rose-500/20 dark:text-rose-100">
                          {e.value}
                        </code>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">(فارغ)</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[12.5px] font-semibold text-rose-800 dark:text-rose-200">
                      {e.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success preview */}
      {result && result.errors.length === 0 && result.validRows.length > 0 && (
        <div
          className="overflow-hidden rounded-2xl border border-emerald-200 bg-card dark:border-emerald-500/30"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <h4 className="me-auto flex items-center gap-2 text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
              <MaterialIcon name="verified" size={19} filled />
              تم التحقق من كل الصفوف بنجاح
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                {result.validRows.length}
              </span>
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-right">
              <thead>
                <tr className="bg-secondary">
                  {["#", "IdNumber (رقم الهوية)", "workNumber (رقم مكتب العمل)"].map((c) => (
                    <th
                      key={c}
                      className="whitespace-nowrap border-b border-border px-4 py-3 text-[12px] font-extrabold text-secondary-foreground"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.validRows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0 odd:bg-secondary/30">
                    <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px] font-bold text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[12.5px]">
                      {r.IdNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[12.5px]">
                      {r.workNumber}
                    </td>
                  </tr>
                ))}
                {result.validRows.length > 50 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground"
                    >
                      … و {result.validRows.length - 50} صف إضافي
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
