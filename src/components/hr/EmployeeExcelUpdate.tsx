import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  type EmployeeUpdateError,
  type EmployeeUpdateResult,
  parseEmployeeUpdateFile,
} from "@/lib/employee-update-excel";
import { downloadEmployeeUpdateTemplate } from "@/lib/employee-update-template";
import { type Row, useRows, useUpsertRows } from "@/lib/hr-db";

const LOOKUP_CATEGORIES = {
  nationality: ["الجنسيه", "الجنسية"],
  religion: ["الديانه", "الديانة"],
  socialStatus: ["الحاله الاجتماعيه", "الحالة الاجتماعية"],
  jobTitle: ["الوظيفه الحاليه", "الوظيفة الحالية"],
  contractType: ["نوع العقد"],
  sector: ["القطاع"],
  careerPath: ["المسار"],
  jobDesignation: ["المسمي الوظيفي", "المسمى الوظيفي"],
  mainDepartment: ["القسم الرئيسي"],
} as const;

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function escapeCsv(value: unknown) {
  return `"${text(value).replaceAll('"', '""')}"`;
}

function downloadErrorReport(errors: EmployeeUpdateError[]) {
  const rows = [
    ["الصف", "العمود والحقل", "المفتاح التقني", "القيمة الخاطئة", "سبب الخطأ"],
    ...errors.map((error) => [error.row, error.column, error.key, error.value, error.message]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "employee-update-errors.csv";
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

export function EmployeeExcelUpdate() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<EmployeeUpdateResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [saveError, setSaveError] = useState("");

  const employeesQuery = useRows("employees", { limit: 5000 });
  const lookupsQuery = useRows("basic_lookups", { limit: 5000 });
  const updateEmployees = useUpsertRows("employees", "emp_no");

  const references = useMemo(() => {
    const employees = employeesQuery.data ?? [];
    const lookups = (lookupsQuery.data ?? []).filter((row) => row["active"] !== false);
    const lookupNames = (categories: readonly string[]) =>
      lookups
        .filter((row) => categories.includes(text(row["category"])))
        .map((row) => text(row["name_ar"]));
    const values = (lookupKey: keyof typeof LOOKUP_CATEGORIES, employeeKey: string) =>
      unique([
        ...lookupNames(LOOKUP_CATEGORIES[lookupKey]),
        ...employees.map((row) => text(row[employeeKey])),
      ]);

    return {
      employees,
      nationality: values("nationality", "nationality"),
      religion: values("religion", "religion"),
      socialStatus: values("socialStatus", "social_status"),
      jobTitle: values("jobTitle", "job_title"),
      contractType: values("contractType", "contract_type"),
      sector: values("sector", "sector"),
      careerPath: values("careerPath", "career_path"),
      jobDesignation: values("jobDesignation", "job_designation"),
      mainDepartment: values("mainDepartment", "main_department"),
    };
  }, [employeesQuery.data, lookupsQuery.data]);

  const referencesLoading = employeesQuery.isLoading || lookupsQuery.isLoading;
  const referencesError = employeesQuery.error || lookupsQuery.error;

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
      setParseError("تعذر تحميل بيانات الموظفين وقوائم التهيئة. أعد المحاولة قبل فحص الملف.");
      return;
    }
    setParsing(true);
    setResult(null);
    setParseError("");
    setSaveError("");
    try {
      const next = await parseEmployeeUpdateFile(file, references);
      setResult(next);
      if (next.errors.length > 0) {
        toast.error(`تم العثور على ${next.errors.length} خطأ. لم يتم تحديث أي موظف.`);
      } else {
        toast.success(
          `الملف سليم: ${next.totalChanges} تغييرًا على ${next.validRecords.length} موظف.`,
        );
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
      await updateEmployees.mutateAsync(result.validRecords.map((record) => record.payload as Row));
      reset();
    } catch (error) {
      setSaveError(
        `رفضت قاعدة البيانات الملف: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }. لم تُرسل أي دفعة تحديث أخرى.`,
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
        <h3 className="text-center text-sm font-extrabold text-foreground">
          تحديث بيانات الموظفين من Excel
        </h3>
        <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">
          الرقم الوظيفي إلزامي لتحديد الموظف، وأي خلية فارغة تعني الإبقاء على القيمة الحالية.
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-card/70 px-4 py-8 transition-colors hover:border-primary/60 hover:bg-card">
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <MaterialIcon name="cloud_upload" size={24} filled />
          </span>
          <span className="text-[13px] font-bold">
            {file ? file.name : "اسحب ملف نموذج التحديث هنا أو اضغط للاختيار"}
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
              ? "تحميل بيانات الموظفين..."
              : parsing
                ? "جاري الفحص..."
                : "فحص ملف التحديث"}
          </ActionButton>
          <ActionButton icon="download" onClick={downloadEmployeeUpdateTemplate} tone="ghost">
            تحميل نموذج تحديث الموظفين
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
            <p className="text-[13px] font-extrabold">تعذر تحديث الملف</p>
            <p className="mt-1 text-[12px] font-semibold">{parseError || saveError}</p>
          </div>
        </div>
      )}

      {result && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="صفوف الموظفين" value={result.totalRows} tone="text-primary" />
            <Metric label="الموظفون الجاهزون" value={result.validRecords.length} tone="text-teal" />
            <Metric label="التغييرات" value={result.totalChanges} tone="text-primary" />
            <Metric label="الأخطاء المكتشفة" value={result.errors.length} tone="text-destructive" />
          </div>

          {result.errors.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-destructive/25 bg-card">
              <div className="flex flex-wrap items-center gap-3 border-b border-destructive/20 bg-destructive/5 px-4 py-3">
                <MaterialIcon name="report" size={20} className="text-destructive" filled />
                <div className="me-auto">
                  <h4 className="text-sm font-extrabold text-destructive">
                    تقرير أخطاء ملف التحديث
                  </h4>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    أصلح الصف والعمود الموضحين ثم ارفع الملف مجددًا. لم يتم تحديث أي موظف.
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
                  <h4 className="text-sm font-extrabold text-teal">الملف سليم وجاهز للتحديث</h4>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    راجع القيم السابقة والجديدة ثم أكد تحديث جميع الموظفين في دفعة واحدة.
                  </p>
                </div>
                <ActionButton
                  icon={updateEmployees.isPending ? "progress_activity" : "manage_accounts"}
                  onClick={save}
                  disabled={updateEmployees.isPending}
                  tone="teal"
                >
                  {updateEmployees.isPending
                    ? "جاري التحديث..."
                    : `تحديث ${result.validRecords.length} موظف`}
                </ActionButton>
              </div>
              <div className="max-h-[28rem] overflow-auto">
                <table className="w-full min-w-[900px] border-collapse text-right text-[12px]">
                  <thead className="sticky top-0 bg-secondary">
                    <tr>
                      {[
                        "صف Excel",
                        "الرقم الوظيفي",
                        "اسم الموظف",
                        "الحقل",
                        "القيمة الحالية",
                        "القيمة الجديدة",
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
                    {result.validRecords.flatMap((record) =>
                      record.changes.map((change) => (
                        <tr
                          key={`${record.rowNumber}-${change.field}`}
                          className="odd:bg-secondary/35"
                        >
                          <td className="border-b border-border px-4 py-3 font-bold">
                            {record.rowNumber}
                          </td>
                          <td className="border-b border-border px-4 py-3">
                            {record.employeeNumber}
                          </td>
                          <td className="border-b border-border px-4 py-3 font-bold">
                            {record.employeeName}
                          </td>
                          <td className="border-b border-border px-4 py-3">{change.label}</td>
                          <td className="border-b border-border px-4 py-3 text-muted-foreground">
                            {change.oldValue}
                          </td>
                          <td className="border-b border-border px-4 py-3 font-bold text-teal">
                            {change.newValue}
                          </td>
                        </tr>
                      )),
                    )}
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
