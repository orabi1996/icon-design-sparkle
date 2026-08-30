import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Btn, Breadcrumbs } from "@/components/hr/ui";
import { useRows, type Row } from "@/lib/hr-db";

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

const STATUS_OPTIONS = ["نشط", "موقوف", "منتهي الخدمة", "إجازة"];
const GENDER_OPTIONS = ["ذكر", "أنثى"];
const ABSENCE_TYPES = ["بدون عذر", "بعذر مقبول", "بعذر مرضي", "بدون إذن"];

export type FilterKey =
  | "branch"
  | "department"
  | "status"
  | "jobTitle"
  | "mainDept"
  | "specialization"
  | "sponsor"
  | "sector"
  | "jobCategory"
  | "jobLevel"
  | "path"
  | "gender"
  | "employee"
  | "from"
  | "to"
  | "date"
  | "year"
  | "month"
  | "absenceType"
  | "showInFingerprint"
  | "excludedFromFingerprint"
  | "groupBy";

export type FilterState = Partial<Record<FilterKey, string | boolean>>;

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => String(currentYear - i));
const MONTHS = [
  { v: "01", label: "يناير" },
  { v: "02", label: "فبراير" },
  { v: "03", label: "مارس" },
  { v: "04", label: "أبريل" },
  { v: "05", label: "مايو" },
  { v: "06", label: "يونيو" },
  { v: "07", label: "يوليو" },
  { v: "08", label: "أغسطس" },
  { v: "09", label: "سبتمبر" },
  { v: "10", label: "أكتوبر" },
  { v: "11", label: "نوفمبر" },
  { v: "12", label: "ديسمبر" },
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function escapeCsv(v: unknown) {
  const raw = String(v ?? "").replaceAll('"', '""');
  return `"${raw}"`;
}
export function exportCsv(name: string, header: string[], body: unknown[][]) {
  const csv = `\uFEFF${[header, ...body].map((r) => r.map(escapeCsv).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("تم تصدير التقرير");
}

/* ============================ shared hooks ============================ */

export function useLookups() {
  const { data: lookups = [] } = useRows("basic_lookups", { orderBy: "name_ar", ascending: true });
  const { data: departments = [] } = useRows("departments", { orderBy: "name" });

  const byCat = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const l of lookups) {
      const cat = String(l["category"] ?? "");
      const name = String(l["name_ar"] ?? "");
      if (!cat || !name) continue;
      (map[cat] ??= []).push(name);
    }
    return map;
  }, [lookups]);

  const branchOptions = useMemo(
    () =>
      byCat["الفروع"] && byCat["الفروع"].length > 0
        ? byCat["الفروع"]
        : Array.from(new Set(departments.map((d) => String(d["branch"] ?? "")).filter(Boolean))),
    [byCat, departments],
  );

  const departmentOptions = useMemo(
    () => Array.from(new Set(departments.map((d) => String(d["name"] ?? "")).filter(Boolean))),
    [departments],
  );

  return {
    branchOptions,
    departmentOptions,
    opt: (key: string) => byCat[key] ?? [],
  };
}

/* ============================ filter row =============================== */

type FilterCardProps = {
  fields: FilterKey[];
  values: FilterState;
  onChange: (patch: FilterState) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function FilterCard({ fields, values, onChange, onSearch, onReset }: FilterCardProps) {
  const { branchOptions, departmentOptions, opt } = useLookups();

  const isActive = (k: FilterKey) => fields.includes(k);

  const from = String(values["from"] ?? "");
  const to = String(values["to"] ?? "");
  const dateInvalid = isActive("from") && isActive("to") && from && to && from > to;

  return (
    <div className="mt-3 rounded-2xl border border-border bg-secondary/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {isActive("branch") && (
          <SelectField
            label="الفروع"
            value={String(values["branch"] ?? "")}
            options={branchOptions}
            placeholder={branchOptions.length ? "اختر ..." : "جار التحميل"}
            onChange={(v) => onChange({ branch: v })}
          />
        )}
        {isActive("department") && (
          <SelectField
            label="القسم"
            value={String(values["department"] ?? "")}
            options={departmentOptions}
            placeholder={departmentOptions.length ? "اختر ..." : "جار التحميل"}
            onChange={(v) => onChange({ department: v })}
          />
        )}
        {isActive("status") && (
          <SelectField
            label="الحالة"
            value={String(values["status"] ?? "")}
            options={STATUS_OPTIONS}
            onChange={(v) => onChange({ status: v })}
          />
        )}
        {isActive("jobTitle") && (
          <SelectField
            label="الوظيفة الحالية"
            value={String(values["jobTitle"] ?? "")}
            options={[...(opt("الوظيفه الحاليه") || []), ...(opt("المسمي الوظيفي") || [])]}
            placeholder="جار التحميل"
            onChange={(v) => onChange({ jobTitle: v })}
          />
        )}
        {isActive("mainDept") && (
          <SelectField
            label="القسم الرئيسي"
            value={String(values["mainDept"] ?? "")}
            options={opt("القسم الرئيسي")}
            placeholder="جار التحميل"
            onChange={(v) => onChange({ mainDept: v })}
          />
        )}
        {isActive("specialization") && (
          <SelectField
            label="التخصص"
            value={String(values["specialization"] ?? "")}
            options={opt("التخصص")}
            placeholder="جار التحميل"
            onChange={(v) => onChange({ specialization: v })}
          />
        )}
        {isActive("sponsor") && (
          <SelectField
            label="الكفالة"
            value={String(values["sponsor"] ?? "")}
            options={opt("الكفلاء")}
            placeholder="جار التحميل"
            onChange={(v) => onChange({ sponsor: v })}
            icon="calendar_month"
          />
        )}
        {isActive("sector") && (
          <SelectField
            label="القطاع"
            value={String(values["sector"] ?? "")}
            options={opt("القطاع")}
            placeholder="جار التحميل"
            onChange={(v) => onChange({ sector: v })}
          />
        )}
        {isActive("jobCategory") && (
          <SelectField
            label="الفئة الوظيفية"
            value={String(values["jobCategory"] ?? "")}
            options={opt("الفئة الوظيفية")}
            placeholder="جار التحميل"
            onChange={(v) => onChange({ jobCategory: v })}
          />
        )}
        {isActive("jobLevel") && (
          <SelectField
            label="المستوى الوظيفي"
            value={String(values["jobLevel"] ?? "")}
            options={opt("المستويات الوظيفية")}
            placeholder="جار التحميل"
            onChange={(v) => onChange({ jobLevel: v })}
          />
        )}
        {isActive("path") && (
          <SelectField
            label="المسار"
            value={String(values["path"] ?? "")}
            options={opt("المسار")}
            placeholder="جار التحميل"
            onChange={(v) => onChange({ path: v })}
          />
        )}
        {isActive("gender") && (
          <SelectField
            label="الجنس"
            value={String(values["gender"] ?? "")}
            options={GENDER_OPTIONS}
            onChange={(v) => onChange({ gender: v })}
          />
        )}
        {isActive("absenceType") && (
          <SelectField
            label="نوع الغياب"
            value={String(values["absenceType"] ?? "")}
            options={ABSENCE_TYPES}
            onChange={(v) => onChange({ absenceType: v })}
          />
        )}
        {isActive("year") && (
          <SelectField
            label="السنة"
            value={String(values["year"] ?? "")}
            options={YEARS}
            onChange={(v) => onChange({ year: v })}
          />
        )}
        {isActive("month") && (
          <SelectField
            label="الشهر"
            value={String(values["month"] ?? "")}
            options={MONTHS.map((m) => m.v)}
            renderOption={(v) => MONTHS.find((m) => m.v === v)?.label ?? v}
            onChange={(v) => onChange({ month: v })}
          />
        )}
        {isActive("groupBy") && (
          <SelectField
            label="تجميع حسب"
            value={String(values["groupBy"] ?? "branch")}
            options={["branch", "department"]}
            renderOption={(v) => (v === "branch" ? "الفرع" : "القسم")}
            onChange={(v) => onChange({ groupBy: v })}
          />
        )}
        {isActive("employee") && (
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">موظف</span>
            <input
              className={control}
              placeholder="البحث بإسم أو رقم الموظف"
              value={String(values["employee"] ?? "")}
              onChange={(e) => onChange({ employee: e.target.value })}
            />
          </label>
        )}
        {isActive("date") && (
          <DateField
            label="التاريخ"
            value={String(values["date"] ?? todayISO())}
            onChange={(v) => onChange({ date: v })}
          />
        )}
        {isActive("from") && (
          <DateField
            label="التاريخ من"
            value={String(values["from"] ?? firstOfMonth())}
            onChange={(v) => onChange({ from: v })}
          />
        )}
        {isActive("to") && (
          <DateField
            label="التاريخ إلى"
            value={String(values["to"] ?? todayISO())}
            onChange={(v) => onChange({ to: v })}
            invalid={Boolean(dateInvalid)}
          />
        )}
        {isActive("showInFingerprint") && (
          <CheckField
            label="عرض في تقارير البصمة"
            checked={Boolean(values["showInFingerprint"])}
            onChange={(v) => onChange({ showInFingerprint: v })}
          />
        )}
        {isActive("excludedFromFingerprint") && (
          <CheckField
            label="مستثنى من البصمة"
            checked={Boolean(values["excludedFromFingerprint"])}
            onChange={(v) => onChange({ excludedFromFingerprint: v })}
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Btn icon="search" onClick={onSearch}>
          بحث
        </Btn>
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] font-bold text-foreground hover:bg-secondary"
        >
          <MaterialIcon name="restart_alt" size={17} />
          إعادة تعيين
        </button>
      </div>
    </div>
  );
}

/* ============================ table shell ============================ */

export type ColumnDef<T> = {
  key: string;
  label: string;
  render?: (row: T, idx: number) => ReactNode;
  align?: "left" | "right";
  className?: string;
};

type ResultTableProps<T extends Row> = {
  columns: ColumnDef<T>[];
  rows: T[];
  isLoading?: boolean;
  csvName?: string;
  onExportCsv?: () => void;
  title?: string;
};

export function ResultTable<T extends Row>({
  columns,
  rows,
  isLoading,
  csvName = "report",
  onExportCsv,
  title = "نتائج التقرير",
}: ResultTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportRow = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    const header = columns.map((c) => c.label);
    const body = rows.map((r, i) =>
      columns.map((c) => {
        if (c.render) {
          const v = c.render(r, i);
          return typeof v === "string" || typeof v === "number" ? v : String(r[c.key] ?? "");
        }
        return r[c.key] ?? "";
      }),
    );
    exportCsv(csvName, header, body);
  };

  return (
    <div
      className="mt-3 overflow-hidden rounded-2xl border border-border bg-card"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
          <MaterialIcon name="table_rows" size={19} className="text-primary" filled />
          {title}
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
            {rows.length}
          </span>
        </h2>
        <button
          onClick={exportRow}
          title="Excel/CSV"
          className="grid size-9 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
        >
          <MaterialIcon name="table_view" size={17} />
        </button>
        <button
          onClick={() => window.print()}
          title="طباعة"
          className="grid size-9 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
        >
          <MaterialIcon name="print" size={17} />
        </button>
        <button
          onClick={() => window.print()}
          title="PDF"
          className="grid size-9 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
        >
          <MaterialIcon name="picture_as_pdf" size={17} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-right">
          <thead>
            <tr className="bg-topbar text-topbar-foreground">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`whitespace-nowrap px-4 py-3 text-[12.5px] font-extrabold ${c.className ?? ""}`}
                >
                  <span className="flex items-center gap-1.5">
                    {c.label}
                    <MaterialIcon name="expand_more" size={16} className="text-white/85" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(isLoading || pageRows.length === 0) && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-14 text-center text-sm font-semibold text-muted-foreground"
                >
                  {isLoading ? "جارٍ التحميل..." : "لا توجد بيانات مطابقة"}
                </td>
              </tr>
            )}
            {pageRows.map((r, i) => (
              <tr
                key={String(r["id"] ?? i)}
                className="border-b border-border last:border-0 odd:bg-secondary/30 hover:bg-accent/40"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`whitespace-nowrap px-4 py-2.5 text-[13px] ${
                      c.align === "left" ? "text-left font-mono" : ""
                    } ${c.className ?? ""}`}
                  >
                    {c.render ? c.render(r, (currentPage - 1) * pageSize + i) : String(r[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 text-[12px] font-bold">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-40"
          >
            <MaterialIcon name="chevron_right" size={18} />
          </button>
          {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
            const base = Math.max(1, Math.min(currentPage - 2, pages - 4));
            const n = base + i;
            return n <= pages ? (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`grid size-8 place-items-center rounded-lg transition-colors ${
                  n === currentPage
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {n}
              </button>
            ) : null;
          })}
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={currentPage >= pages}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-40"
          >
            <MaterialIcon name="chevron_left" size={18} />
          </button>
          <span dir="ltr" className="ms-2 font-mono text-[12px] text-muted-foreground">
            Page {currentPage} of {pages}
          </span>
          <span className="ms-2 text-muted-foreground">({rows.length} عنصر)</span>
        </div>

        <div className="ms-auto flex items-center gap-1">
          {[20, 10, 5].map((n) => (
            <button
              key={n}
              onClick={() => {
                setPageSize(n);
                setPage(1);
              }}
              className={`grid size-8 place-items-center rounded-lg transition-colors ${
                n === pageSize
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================ shell ============================== */

export function ReportPageHeader({
  icon,
  title,
  trail,
}: {
  icon: string;
  title: string;
  trail: string[];
}) {
  return (
    <>
      <div className="mt-3">
        <Breadcrumbs trail={trail} />
      </div>
      <h1 className="mt-3 flex items-center gap-2 text-lg font-extrabold text-foreground">
        <MaterialIcon name={icon} size={22} className="text-primary" filled />
        {title}
      </h1>
    </>
  );
}

export function EmptySearchState({ hint }: { hint?: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.03] p-10 text-center">
      <MaterialIcon name="filter_alt" size={40} className="mx-auto text-primary/60" />
      <p className="mt-3 text-sm font-bold text-foreground/80">
        حدد الفلاتر ثم اضغط <span className="text-primary">"بحث"</span> لعرض التقرير
      </p>
      {hint && (
        <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/* ============================ small fields ============================ */

function SelectField({
  label,
  value,
  options,
  placeholder,
  onChange,
  icon,
  renderOption,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
  icon?: string;
  renderOption?: (v: string) => string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${control} appearance-none pe-9`}
        >
          <option value="">{placeholder ?? "اختر ..."}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {renderOption ? renderOption(o) : o}
            </option>
          ))}
        </select>
        <MaterialIcon
          name={icon ?? "expand_more"}
          size={17}
          className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
        />
      </div>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 self-end rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--primary)]"
      />
      <span className="text-[12px] font-bold text-foreground/80">{label}</span>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-foreground/80">
        {label}
        {invalid && (
          <MaterialIcon name="warning_amber" size={13} className="text-rose-600" />
        )}
      </span>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${control} ${
            invalid ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200" : ""
          }`}
        />
        <MaterialIcon
          name="calendar_month"
          size={17}
          className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
        />
      </div>
    </label>
  );
}

/* ============================ utilities ============================ */

export const dateHelpers = { todayISO, firstOfMonth };
export const constants = { STATUS_OPTIONS, GENDER_OPTIONS, ABSENCE_TYPES, YEARS, MONTHS };
