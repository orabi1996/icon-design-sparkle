import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  type RelativeImportError,
  type RelativeImportResult,
  parseRelativeImportFile,
} from "@/lib/relative-excel";
import { downloadRelativeImportTemplate } from "@/lib/relative-import-template";
import { type Row, useRows, useUpsertRows } from "@/lib/hr-db";

const NATIONALITY_CATEGORIES = ["الجنسيه", "الجنسية"];
const RELATIONSHIP_CATEGORIES = ["صلة القرابة", "صله القرابه", "درجات القرابة"];

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function escapeCsv(value: unknown) {
  return `"${text(value).replaceAll('"', '""')}"`;
}

function downloadErrorReport(errors: RelativeImportError[]) {
  const rows = [
    ["الصف", "الخلية", "العمود والحقل", "المفتاح التقني", "القيمة الخاطئة", "سبب الخطأ"],
    ...errors.map((error) => [
      error.row,
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
  anchor.download = "relative-import-errors.csv";
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
      <p className={`mt-1 text-xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

export function RelativeExcelImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<RelativeImportResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [saveError, setSaveError] = useState("");

  const employeesQuery = useRows("employees", { limit: 5000 });
  const relativesQuery = useRows("employee_relatives", { limit: 10000 });
  const lookupsQuery = useRows("basic_lookups", { limit: 5000 });
  const saveRelatives = useUpsertRows("employee_relatives", "employee_id,id_number", {
    empty: "لا توجد بيانات أقارب صالحة للحفظ",
    success: (count) => `تم حفظ بيانات ${count} قريب بنجاح`,
    error: (message) => `تعذر حفظ بيانات الأقارب: ${message}`,
  });

  const references = useMemo(() => {
    const employees = employeesQuery.data ?? [];
    const relatives = relativesQuery.data ?? [];
    const lookups = (lookupsQuery.data ?? []).filter((row) => row["active"] !== false);
    const lookupNames = (categories: string[]) =>
      lookups
        .filter((row) => categories.includes(text(row["category"])))
        .map((row) => text(row["name_ar"]));

    return {
      employees: employees
        .filter((row) => text(row["id"]) && text(row["national_id"]))
        .map((row) => ({
          id: text(row["id"]),
          nationalId: text(row["national_id"]),
          employeeNumber: text(row["emp_no"]),
          name: text(row["full_name"]),
        })),
      existingRelatives: relatives.map((row) => ({
        idNumber: text(row["id_number"]),
        employeeNationalId: text(row["employee_national_id"]),
      })),
      nationalities: unique([
        ...lookupNames(NATIONALITY_CATEGORIES),
        ...employees.map((row) => text(row["nationality"])),
        ...relatives.map((row) => text(row["nationality"])),
      ]),
      relationships: unique([
        ...lookupNames(RELATIONSHIP_CATEGORIES),
        ...relatives.map((row) => text(row["relationship"])),
      ]),
    };
  }, [employeesQuery.data, lookupsQuery.data, relativesQuery.data]);

  const referencesLoading =
    employeesQuery.isLoading || relativesQuery.isLoading || lookupsQuery.isLoading;
  const referencesError = employeesQuery.error || relativesQuery.error || lookupsQuery.error;

  const reset = () => {
    setFile(null);
    setResult(null);
    setParseError("");
    setSaveError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const inspectFile = async () => {
    if (!file) return;
    if (referencesError) {
      setParseError("تعذر تحميل بيانات الموظفين أو قوائم التهيئة. أعد المحاولة قبل فحص الملف.");
      return;
    }
    setParsing(true);
    setResult(null);
    setParseError("");
    setSaveError("");
    try {
      const next = await parseRelativeImportFile(file, references);
      setResult(next);
      if (next.errors.length > 0) {
        toast.error(`تم العثور على ${next.errors.length} خطأ. لم يتم حفظ أي قريب.`);
      } else {
        toast.success(`الملف سليم وجاهز لحفظ ${next.validRecords.length} قريب.`);
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
      await saveRelatives.mutateAsync(result.validRecords.map((record) => record.payload as Row));
      reset();
    } catch (error) {
      setSaveError(
        `رفضت قاعدة البيانات الملف: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }. لم يتم حفظ أي سجل من الملف.`,
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
        <h3 className="text-center text-sm font-extrabold text-foreground">
          رفع ملفات الأقارب من Excel
        </h3>
        <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">
          رقم هوية الموظف يربط القريب بالموظف المسجل، ويُفحص الملف كاملًا قبل حفظ أي سجل.
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-card/70 px-4 py-8 transition-colors hover:border-primary/60 hover:bg-card">
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <MaterialIcon name="cloud_upload" size={24} filled />
          </span>
          <span className="text-[13px] font-bold">
            {file ? file.name : "اسحب ملف بيانات المرافقين هنا أو اضغط للاختيار"}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground">
            النموذج المعتمد بصيغة XLSX فقط — حتى ١٠ ميجابايت
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setResult(null);
              setParseError("");
              setSaveError("");
            }}
          />
        </label>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <ActionButton
            icon={parsing ? "progress_activity" : "fact_check"}
            onClick={inspectFile}
            disabled={!file || parsing || referencesLoading}
            tone="teal"
          >
            {referencesLoading
              ? "تحميل بيانات التهيئة..."
              : parsing
                ? "جاري الفحص..."
                : "فحص الملف"}
          </ActionButton>
          <ActionButton icon="download" onClick={downloadRelativeImportTemplate} tone="ghost">
            تحميل نموذج بيانات المرافقين
          </ActionButton>
          {(file || result) && (
            <ActionButton icon="restart_alt" onClick={reset} tone="ghost">
              اختيار ملف آخر
            </ActionButton>
          )}
        </div>
      </div>

      {(parseError || saveError) && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          <MaterialIcon name="error" size={22} filled />
          <div>
            <p className="text-[13px] font-extrabold">تعذر استيراد الملف</p>
            <p className="mt-1 text-[12px] font-semibold">{parseError || saveError}</p>
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="إجمالي صفوف الأقارب" value={result.totalRows} tone="text-primary" />
            <Metric label="الصفوف السليمة" value={result.validRecords.length} tone="text-teal" />
            <Metric label="الأخطاء المكتشفة" value={result.errors.length} tone="text-destructive" />
          </div>

          {result.errors.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-destructive/25 bg-card">
              <div className="flex flex-wrap items-center gap-3 border-b border-destructive/20 bg-destructive/5 px-4 py-3">
                <MaterialIcon name="report" size={20} className="text-destructive" filled />
                <div className="me-auto">
                  <h4 className="text-sm font-extrabold text-destructive">تقرير أخطاء الملف</h4>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    أصلح الصف والخلية الموضحين ثم ارفع الملف مرة أخرى. لم يتم حفظ أي قريب.
                  </p>
                </div>
                <ActionButton
                  icon="download"
                  onClick={() => downloadErrorReport(result.errors)}
                  tone="danger"
                >
                  تحميل تقرير الأخطاء CSV
                </ActionButton>
              </div>
              <div className="max-h-[28rem] overflow-auto">
                <table className="w-full min-w-[980px] border-collapse text-right text-[12px]">
                  <thead className="sticky top-0 bg-secondary">
                    <tr>
                      {["الصف", "الخلية", "العمود والحقل", "القيمة الخاطئة", "سبب الخطأ"].map(
                        (heading) => (
                          <th
                            key={heading}
                            className="border-b border-border px-4 py-3 font-extrabold"
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((error, index) => (
                      <tr key={`${error.cell}-${index}`} className="odd:bg-destructive/[0.025]">
                        <td className="border-b border-border px-4 py-3 font-black text-destructive">
                          {error.row}
                        </td>
                        <td
                          className="border-b border-border px-4 py-3 font-mono font-black text-destructive"
                          dir="ltr"
                        >
                          {error.cell}
                        </td>
                        <td className="border-b border-border px-4 py-3 font-bold">
                          {error.column}
                        </td>
                        <td className="max-w-64 break-words border-b border-border px-4 py-3">
                          {error.value || <span className="text-muted-foreground">فارغ</span>}
                        </td>
                        <td className="border-b border-border px-4 py-3 font-semibold text-destructive">
                          {error.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-teal/25 bg-card">
              <div className="flex flex-wrap items-center gap-3 border-b border-border bg-teal/5 px-4 py-3">
                <MaterialIcon name="verified" size={20} className="text-teal" filled />
                <div className="me-auto">
                  <h4 className="text-sm font-extrabold text-teal">الملف سليم وجاهز للحفظ</h4>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    راجع المعاينة ثم احفظ كل الأقارب دفعة واحدة.
                  </p>
                </div>
                <ActionButton
                  icon={saveRelatives.isPending ? "progress_activity" : "groups"}
                  onClick={save}
                  disabled={saveRelatives.isPending}
                  tone="teal"
                >
                  {saveRelatives.isPending
                    ? "جاري الحفظ..."
                    : `حفظ ${result.validRecords.length} قريب`}
                </ActionButton>
              </div>
              <div className="max-h-[24rem] overflow-auto">
                <table className="w-full min-w-[980px] border-collapse text-right text-[12px]">
                  <thead className="sticky top-0 bg-secondary">
                    <tr>
                      {[
                        "صف Excel",
                        "الموظف",
                        "رقم هوية الموظف",
                        "اسم القريب",
                        "صلة القرابة",
                        "رقم هوية القريب",
                        "الجنسية",
                        "تاريخ الميلاد",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="border-b border-border px-4 py-3 font-extrabold"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.validRecords.map((record) => (
                      <tr key={record.rowNumber} className="odd:bg-secondary/35">
                        <td className="border-b border-border px-4 py-3 font-bold">
                          {record.rowNumber}
                        </td>
                        <td className="border-b border-border px-4 py-3 font-bold">
                          {text(record.payload["employee_name"])}
                        </td>
                        <td className="border-b border-border px-4 py-3">
                          {record.raw.EmpIDNumber}
                        </td>
                        <td className="border-b border-border px-4 py-3 font-bold">
                          {record.raw.Name}
                        </td>
                        <td className="border-b border-border px-4 py-3">
                          {record.raw.Relationship}
                        </td>
                        <td className="border-b border-border px-4 py-3">{record.raw.IDNumber}</td>
                        <td className="border-b border-border px-4 py-3">
                          {record.raw.Nationality}
                        </td>
                        <td className="border-b border-border px-4 py-3">
                          {text(record.payload["date_of_birth"])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
