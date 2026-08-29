import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  type EmployeeImportError,
  type EmployeeImportResult,
  parseEmployeeImportFile,
} from "@/lib/employee-excel";
import { downloadEmployeeImportTemplate } from "@/lib/employee-import-template";
import { type Row, useInsertRows, useRows } from "@/lib/hr-db";

const LOOKUP_CATEGORIES = {
  jobCategories: ["الفئة الوظيفية"],
  jobTitles: ["الوظيفه الحاليه", "الوظيفة الحالية"],
  jobLevels: ["المستويات الوظيفية"],
  nationalities: ["الجنسيه", "الجنسية"],
  religions: ["الديانه", "الديانة"],
  socialStatuses: ["الحاله الاجتماعيه", "الحالة الاجتماعية"],
} as const;

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function escapeCsv(value: unknown) {
  const raw = text(value).replaceAll('"', '""');
  return `"${raw}"`;
}

function downloadErrorReport(errors: EmployeeImportError[]) {
  const rows = [
    ["الصف", "العمود", "المفتاح التقني", "القيمة الخاطئة", "سبب الخطأ"],
    ...errors.map((error) => [error.row, error.column, error.key, error.value, error.message]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "employee-import-errors.csv";
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

export function EmployeeExcelImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<EmployeeImportResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [saveError, setSaveError] = useState("");

  const employeesQuery = useRows("employees", { limit: 5000 });
  const departmentsQuery = useRows("departments", { limit: 1000 });
  const lookupsQuery = useRows("basic_lookups", { limit: 5000 });
  const insertEmployees = useInsertRows("employees");

  const references = useMemo(() => {
    const employees = employeesQuery.data ?? [];
    const departments = departmentsQuery.data ?? [];
    const lookups = (lookupsQuery.data ?? []).filter((row) => row["active"] !== false);
    const lookupNames = (categories: readonly string[]) =>
      lookups
        .filter((row) => categories.includes(text(row["category"])))
        .map((row) => text(row["name_ar"]));

    return {
      departments: unique([
        ...departments.map((row) => text(row["name"])),
        ...employees.map((row) => text(row["department"])),
      ]),
      branches: unique([
        ...departments.map((row) => text(row["branch"])),
        ...employees.map((row) => text(row["branch"])),
      ]),
      jobCategories: unique([
        ...lookupNames(LOOKUP_CATEGORIES.jobCategories),
        ...employees.map((row) => text(row["employment_category"])),
      ]),
      jobTitles: unique([
        ...lookupNames(LOOKUP_CATEGORIES.jobTitles),
        ...employees.map((row) => text(row["job_title"])),
      ]),
      jobLevels: unique([
        ...lookupNames(LOOKUP_CATEGORIES.jobLevels),
        ...employees.map((row) => text(row["job_level"])),
      ]),
      nationalities: unique([
        ...lookupNames(LOOKUP_CATEGORIES.nationalities),
        ...employees.map((row) => text(row["nationality"])),
      ]),
      religions: unique([
        ...lookupNames(LOOKUP_CATEGORIES.religions),
        ...employees.map((row) => text(row["religion"])),
      ]),
      socialStatuses: unique([
        ...lookupNames(LOOKUP_CATEGORIES.socialStatuses),
        ...employees.map((row) => text(row["social_status"])),
      ]),
      existingEmployeeNumbers: employees.map((row) => text(row["emp_no"])),
      existingNationalIds: employees.map((row) => text(row["national_id"])),
      existingFingerprintIds: employees.map((row) => text(row["fingerprint_no"])),
    };
  }, [departmentsQuery.data, employeesQuery.data, lookupsQuery.data]);

  const referencesLoading =
    employeesQuery.isLoading || departmentsQuery.isLoading || lookupsQuery.isLoading;
  const referencesError = employeesQuery.error || departmentsQuery.error || lookupsQuery.error;

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
      setParseError("تعذر تحميل قوائم التهيئة من النظام. أعد المحاولة قبل فحص الملف.");
      return;
    }
    setParsing(true);
    setResult(null);
    setParseError("");
    setSaveError("");
    try {
      const next = await parseEmployeeImportFile(file, references);
      setResult(next);
      if (next.errors.length > 0) {
        toast.error(`تم العثور على ${next.errors.length} خطأ. لم تتم إضافة أي موظف.`);
      } else {
        toast.success(`الملف سليم وجاهز لإضافة ${next.totalRows} موظف.`);
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
      await insertEmployees.mutateAsync(result.validRecords.map((record) => record.payload as Row));
      reset();
    } catch (error) {
      setSaveError(
        `رفضت قاعدة البيانات الملف ولم تتم إضافة أي موظف: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
        <h3 className="text-center text-sm font-extrabold text-foreground">
          إضافة بيانات الموظفين من Excel
        </h3>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-card/70 px-4 py-8 transition-colors hover:border-primary/60 hover:bg-card">
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <MaterialIcon name="cloud_upload" size={24} filled />
          </span>
          <span className="text-[13px] font-bold">
            {file ? file.name : "اسحب ملف النموذج هنا أو اضغط للاختيار"}
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
          <ActionButton icon="download" onClick={downloadEmployeeImportTemplate} tone="ghost">
            تحميل نموذج إضافة الموظفين
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
            <Metric label="إجمالي صفوف الموظفين" value={result.totalRows} tone="text-primary" />
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
                    أصلح الصف والعمود الموضحين ثم ارفع الملف مرة أخرى. لم تتم إضافة أي موظف.
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
                <table className="w-full min-w-[850px] border-collapse text-right text-[12px]">
                  <thead className="sticky top-0 bg-secondary">
                    <tr>
                      {[
                        "الصف",
                        "العمود والحقل",
                        "المفتاح التقني",
                        "القيمة الخاطئة",
                        "سبب الخطأ",
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
                    {result.errors.map((error, index) => (
                      <tr
                        key={`${error.row}-${error.column}-${index}`}
                        className="odd:bg-destructive/[0.025]"
                      >
                        <td className="border-b border-border px-4 py-3 font-black text-destructive">
                          {error.row}
                        </td>
                        <td className="border-b border-border px-4 py-3 font-bold">
                          {error.column}
                        </td>
                        <td
                          className="border-b border-border px-4 py-3 font-mono text-[11px]"
                          dir="ltr"
                        >
                          {error.key || "—"}
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
                  <h4 className="text-sm font-extrabold text-teal">الملف سليم وجاهز للإضافة</h4>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    راجع المعاينة ثم أكد إضافة جميع الموظفين دفعة واحدة.
                  </p>
                </div>
                <ActionButton
                  icon={insertEmployees.isPending ? "progress_activity" : "person_add"}
                  onClick={save}
                  disabled={insertEmployees.isPending}
                  tone="teal"
                >
                  {insertEmployees.isPending
                    ? "جاري الإضافة..."
                    : `إضافة ${result.validRecords.length} موظف`}
                </ActionButton>
              </div>
              <div className="max-h-[24rem] overflow-auto">
                <table className="w-full min-w-[900px] border-collapse text-right text-[12px]">
                  <thead className="sticky top-0 bg-secondary">
                    <tr>
                      {[
                        "صف Excel",
                        "الرقم الوظيفي",
                        "اسم الموظف",
                        "الفرع",
                        "القسم",
                        "الوظيفة",
                        "الحالة",
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
                        <td className="border-b border-border px-4 py-3">
                          {record.raw.empFileNum}
                        </td>
                        <td className="border-b border-border px-4 py-3 font-bold">
                          {record.raw.EmployeeName}
                        </td>
                        <td className="border-b border-border px-4 py-3">
                          {record.raw.BranchName}
                        </td>
                        <td className="border-b border-border px-4 py-3">
                          {record.raw.SectionName}
                        </td>
                        <td className="border-b border-border px-4 py-3">
                          {record.raw.SpecializationName}
                        </td>
                        <td className="border-b border-border px-4 py-3">
                          {text(record.payload.status)}
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
