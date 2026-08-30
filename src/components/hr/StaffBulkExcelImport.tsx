import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  parseStaffBulkFile,
  STAFF_BULK_IMPORT_SPECS,
  type StaffBulkContext,
  type StaffBulkImportError,
  type StaffBulkImportResult,
  type StaffBulkReferences,
} from "@/lib/staff-bulk-excel";
import { downloadStaffBulkTemplate, type StaffBulkTemplateKey } from "@/lib/staff-bulk-templates";
import { type Row, useApplyStaffBulkImport, useRows } from "@/lib/hr-db";

const DOCUMENT_TYPES = [
  "الهوية الوطنية",
  "الإقامة",
  "جواز السفر",
  "رخصة العمل",
  "التأمين الطبي",
  "الشهادة",
];

const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function escapeCsv(value: unknown) {
  return `"${text(value).replaceAll('"', '""')}"`;
}

function downloadErrorReport(kind: StaffBulkTemplateKey, errors: StaffBulkImportError[]) {
  const rows = [
    ["الصف", "الخلية", "اسم العمود", "المفتاح التقني", "القيمة الخاطئة", "سبب الخطأ"],
    ...errors.map((error) => [
      error.row || "الإعدادات",
      error.cell,
      error.column,
      error.key,
      error.value,
      error.message,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${kind}-import-errors.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ActionButton({
  children,
  icon,
  onClick,
  disabled = false,
  tone = "primary",
}: {
  children: React.ReactNode;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "teal" | "ghost" | "danger";
}) {
  const tones = {
    primary: "bg-primary text-primary-foreground",
    teal: "bg-teal text-primary-foreground",
    ghost: "border border-border bg-card text-foreground",
    danger: "border border-destructive/25 bg-destructive/5 text-destructive",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-opacity ${tones[tone]} disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <MaterialIcon name={icon} size={18} />
      {children}
    </button>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-black ${tone}`}>
        {new Intl.NumberFormat("ar-SA").format(value)}
      </p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11.5px] font-bold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border border-border bg-card px-3 text-[12px] font-semibold outline-none focus:border-primary"
      >
        <option value="">اختر...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StaffBulkExcelImport({
  kind,
  title,
  icon,
}: {
  kind: StaffBulkTemplateKey;
  title: string;
  icon: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<StaffBulkImportResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [definitionId, setDefinitionId] = useState("");
  const [isDefault, setIsDefault] = useState(true);

  const employeesQuery = useRows("employees", { limit: 10000 });
  const entitlementsQuery = useRows("entitlements", { limit: 1000 });
  const deductionsQuery = useRows("deductions", { limit: 1000 });
  const applyImport = useApplyStaffBulkImport();

  const definitions = useMemo(() => {
    const rows = kind === "entitlement" ? entitlementsQuery.data : deductionsQuery.data;
    return (rows ?? [])
      .filter((row) => row["active"] !== false)
      .map((row) => ({ id: text(row["id"]), name: text(row["name"]) }))
      .filter((row) => row.id && row.name);
  }, [deductionsQuery.data, entitlementsQuery.data, kind]);

  const references = useMemo<StaffBulkReferences>(
    () => ({
      employees: (employeesQuery.data ?? [])
        .map((row) => ({
          id: text(row["id"]),
          empNo: text(row["emp_no"]),
          nationalId: text(row["national_id"]),
          name: text(row["full_name"]),
        }))
        .filter((row) => row.id && row.empNo),
      statuses: [
        ...new Set((employeesQuery.data ?? []).map((row) => text(row["status"])).filter(Boolean)),
      ],
      entitlements: (entitlementsQuery.data ?? []).map((row) => ({
        id: text(row["id"]),
        name: text(row["name"]),
      })),
      deductions: (deductionsQuery.data ?? []).map((row) => ({
        id: text(row["id"]),
        name: text(row["name"]),
      })),
    }),
    [deductionsQuery.data, employeesQuery.data, entitlementsQuery.data],
  );

  const context = useMemo<StaffBulkContext>(() => {
    const definition = definitions.find((item) => item.id === definitionId);
    return {
      documentType,
      ...(year ? { year: Number(year) } : {}),
      ...(month ? { month: Number(month) } : {}),
      ...(definition?.id ? { definitionId: definition.id } : {}),
      ...(definition?.name ? { definitionName: definition.name } : {}),
      isDefault,
    };
  }, [definitionId, definitions, documentType, isDefault, month, year]);

  const neededDefinitionsQuery = kind === "entitlement" ? entitlementsQuery : deductionsQuery;
  const referencesLoading =
    employeesQuery.isLoading ||
    (["entitlement", "deduction"].includes(kind) && neededDefinitionsQuery.isLoading);
  const referencesError =
    employeesQuery.error ||
    (["entitlement", "deduction"].includes(kind) ? neededDefinitionsQuery.error : null);

  const resetResult = () => {
    setResult(null);
    setParseError("");
    setSaveError("");
  };

  const reset = () => {
    setFile(null);
    resetResult();
    if (inputRef.current) inputRef.current.value = "";
  };

  const inspectFile = async () => {
    if (!file) return;
    if (referencesError) {
      setParseError("تعذر تحميل بيانات المطابقة من قاعدة البيانات. أعد المحاولة قبل فحص الملف.");
      return;
    }
    setParsing(true);
    resetResult();
    try {
      const next = await parseStaffBulkFile(kind, file, references, context);
      setResult(next);
      if (next.errors.length > 0) {
        toast.error(`تم العثور على ${next.errors.length} خطأ. لم يتم حفظ أي صف.`);
      } else {
        toast.success(`الملف سليم وجاهز لتنفيذ ${next.validRecords.length} صف.`);
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "تعذر قراءة ملف Excel");
    } finally {
      setParsing(false);
    }
  };

  const save = async () => {
    if (!result || result.errors.length > 0 || result.validRecords.length === 0) return;
    setSaveError("");
    try {
      const saved = await applyImport.mutateAsync({
        importType: kind,
        rows: result.validRecords.map((record) => record.payload as Row),
      });
      toast.success(`تم تنفيذ الملف كاملًا وحفظ ${saved.processed} صف بنجاح`);
      reset();
    } catch (error) {
      setSaveError(
        `رفضت قاعدة البيانات الملف: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }. تم إلغاء العملية ولم يُحفظ أي صف.`,
      );
    }
  };

  const spec = STAFF_BULK_IMPORT_SPECS[kind];
  const years = Array.from({ length: 7 }, (_, index) =>
    String(new Date().getFullYear() - 2 + index),
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <MaterialIcon name={icon} size={21} filled />
          </span>
          <div>
            <h3 className="text-sm font-extrabold">{title}</h3>
            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
              حمّل النموذج المعتمد، ولا تغيّر أسماء الأعمدة. يُفحص الملف كاملًا ولا يُحفظ أي صف عند
              وجود خطأ.
            </p>
          </div>
          <div className="ms-auto">
            <ActionButton
              icon="download"
              tone="ghost"
              onClick={() => downloadStaffBulkTemplate(kind)}
            >
              تحميل النموذج
            </ActionButton>
          </div>
        </div>

        {kind === "documents" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <SelectField
              label="اسم المستند"
              value={documentType}
              onChange={(value) => {
                setDocumentType(value);
                resetResult();
              }}
              options={DOCUMENT_TYPES.map((value) => ({ value, label: value }))}
            />
          </div>
        )}

        {(kind === "entitlement" || kind === "deduction") && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SelectField
              label="السنة"
              value={year}
              onChange={(value) => {
                setYear(value);
                resetResult();
              }}
              options={years.map((value) => ({ value, label: value }))}
            />
            <SelectField
              label="الشهر"
              value={month}
              onChange={(value) => {
                setMonth(value);
                resetResult();
              }}
              options={MONTHS.map((label, index) => ({ value: String(index + 1), label }))}
            />
            <SelectField
              label={kind === "entitlement" ? "الاستحقاق" : "الاستقطاع"}
              value={definitionId}
              onChange={(value) => {
                setDefinitionId(value);
                resetResult();
              }}
              options={definitions.map((item) => ({ value: item.id, label: item.name }))}
            />
            <label className="flex items-center gap-2 self-end pb-2.5">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(event) => {
                  setIsDefault(event.target.checked);
                  resetResult();
                }}
                className="size-4 accent-[var(--primary)]"
              />
              <span className="text-[12px] font-bold">افتراضي</span>
            </label>
          </div>
        )}

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-card/70 px-4 py-8 transition-colors hover:border-primary/60 hover:bg-card">
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <MaterialIcon name="cloud_upload" size={24} filled />
          </span>
          <span className="text-[13px] font-bold">
            {file ? file.name : "اسحب ملف النموذج هنا أو اضغط للاختيار"}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground">
            الصيغ المدعومة: XLS وXLSX — حتى ١٠ ميجابايت
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              resetResult();
            }}
          />
        </label>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <ActionButton
            icon="fact_check"
            onClick={inspectFile}
            disabled={!file || parsing || referencesLoading}
          >
            {parsing
              ? "جارٍ فحص الملف..."
              : referencesLoading
                ? "جارٍ تحميل بيانات المطابقة..."
                : "فحص الملف"}
          </ActionButton>
          <ActionButton
            icon="save"
            tone="teal"
            onClick={save}
            disabled={
              !result ||
              result.errors.length > 0 ||
              result.validRecords.length === 0 ||
              applyImport.isPending
            }
          >
            {applyImport.isPending ? "جارٍ تنفيذ الملف..." : "تنفيذ وحفظ الملف"}
          </ActionButton>
          {(file || result) && (
            <ActionButton icon="restart_alt" tone="ghost" onClick={reset}>
              إعادة تعيين
            </ActionButton>
          )}
        </div>
      </div>

      {parseError && (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-[12px] font-bold text-destructive">
          {parseError}
        </div>
      )}
      {saveError && (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-[12px] font-bold text-destructive">
          {saveError}
        </div>
      )}

      {result && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="صفوف البيانات" value={result.totalRows} tone="text-primary" />
            <Metric label="صفوف سليمة" value={result.validRecords.length} tone="text-emerald-600" />
            <Metric label="أخطاء محددة" value={result.errors.length} tone="text-destructive" />
          </div>

          {result.errors.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-destructive/25 bg-card">
              <div className="flex flex-wrap items-center gap-3 border-b border-border bg-destructive/5 px-4 py-3">
                <div className="flex items-center gap-2 text-destructive">
                  <MaterialIcon name="error" size={19} filled />
                  <h4 className="text-[13px] font-extrabold">
                    موقع الخطأ: الصف + الخلية + العمود + القيمة + السبب
                  </h4>
                </div>
                <div className="ms-auto">
                  <ActionButton
                    icon="download"
                    tone="danger"
                    onClick={() => downloadErrorReport(kind, result.errors)}
                  >
                    تنزيل تقرير الأخطاء CSV
                  </ActionButton>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-[11.5px]">
                  <thead className="bg-secondary/70 text-foreground">
                    <tr>
                      <th className="px-3 py-2 text-start">الصف</th>
                      <th className="px-3 py-2 text-start">الخلية</th>
                      <th className="px-3 py-2 text-start">العمود</th>
                      <th className="px-3 py-2 text-start">القيمة الخاطئة</th>
                      <th className="px-3 py-2 text-start">سبب الخطأ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((error, index) => (
                      <tr
                        key={`${error.cell}-${index}`}
                        className="border-t border-border align-top"
                      >
                        <td className="px-3 py-2 font-black text-destructive">
                          {error.row || "الإعدادات"}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold" dir="ltr">
                          {error.cell}
                        </td>
                        <td className="px-3 py-2 font-bold">{error.column}</td>
                        <td className="max-w-52 break-words px-3 py-2 font-mono" dir="auto">
                          {error.value || "فارغ"}
                        </td>
                        <td className="px-3 py-2 font-bold text-destructive">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-border bg-destructive/5 px-4 py-3 text-[11.5px] font-bold text-destructive">
                تم إيقاف زر الحفظ. صحّح الأخطاء في الملف ثم ارفعه من جديد؛ لم يتم حفظ أي صف.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-card">
              <div className="flex items-center gap-2 border-b border-border bg-emerald-500/5 px-4 py-3 text-emerald-700">
                <MaterialIcon name="verified" size={19} filled />
                <h4 className="text-[13px] font-extrabold">الملف سليم وجاهز للحفظ كعملية واحدة</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-[11.5px]">
                  <thead className="bg-secondary/70">
                    <tr>
                      <th className="px-3 py-2 text-start">الصف</th>
                      {spec.labels.map((label) => (
                        <th key={label} className="px-3 py-2 text-start">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.validRecords.slice(0, 10).map((record) => (
                      <tr key={record.row} className="border-t border-border">
                        <td className="px-3 py-2 font-black text-primary">{record.row}</td>
                        {record.values.map((value, index) => (
                          <td key={`${record.row}-${index}`} className="px-3 py-2" dir="auto">
                            {value || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.validRecords.length > 10 && (
                <p className="border-t border-border px-4 py-2 text-[11px] font-semibold text-muted-foreground">
                  المعروض أول 10 صفوف من أصل {result.validRecords.length} صفًا سليمًا.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
