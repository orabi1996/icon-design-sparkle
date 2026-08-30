import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, Btn, Chip, PageBanner } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export type AttendanceReportVariant = "statistics" | "detailed" | "comprehensive" | "daily-late";

type FilterState = {
  branch: string;
  department: string;
  employeeStatus: string;
  jobTitle: string;
  specialization: string;
  sponsorName: string;
  sector: string;
  employmentCategory: string;
  jobLevel: string;
  careerPath: string;
  gender: string;
  nationality: string;
  employee: string;
  date: string;
  from: string;
  to: string;
  showInFingerprintReports: boolean;
  fingerprintExempt: boolean;
};

type SelectKey = Exclude<
  keyof FilterState,
  "employee" | "date" | "from" | "to" | "showInFingerprintReports" | "fingerprintExempt"
>;

type Column = {
  key: string;
  label: string;
  format?: "date" | "time" | "status" | "minutes" | "duration" | "rate" | "boolean";
};

const REPORTS: Record<
  AttendanceReportVariant,
  { title: string; subtitle: string; icon: string; tableTitle: string }
> = {
  statistics: {
    title: "تقرير إحصائي عن الحضور والانصراف",
    subtitle: "ملخص الحضور والغياب والتأخير وفق البعد الإحصائي المختار",
    icon: "query_stats",
    tableTitle: "الإحصائيات المجمعة",
  },
  detailed: {
    title: "تقرير الحضور والانصراف التفصيلي",
    subtitle: "التوقيتات اليومية التفصيلية لكل موظف مع حالة الدوام والتأخير",
    icon: "fact_check",
    tableTitle: "تفاصيل الحضور والانصراف",
  },
  comprehensive: {
    title: "تقرير الحضور والإنصراف الشامل",
    subtitle: "تقرير شامل يجمع بيانات الموظف والوظيفة والبصمة وحالة الدوام",
    icon: "analytics",
    tableTitle: "بيانات الحضور والانصراف الشاملة",
  },
  "daily-late": {
    title: "تقرير التأخير اليومي",
    subtitle: "حصر حالات التأخير اليومية ودقائق التأخير حسب الموظف والجهة التنظيمية",
    icon: "schedule",
    tableTitle: "حالات التأخير اليومية",
  },
};

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/25";

const EMPLOYEE_KEYS: { key: SelectKey; label: string; source: string }[] = [
  { key: "branch", label: "الفروع", source: "branch" },
  { key: "department", label: "القسم", source: "department" },
  { key: "employeeStatus", label: "الحالة", source: "status" },
  { key: "jobTitle", label: "الوظيفة الحالية", source: "job_title" },
  { key: "specialization", label: "التخصص", source: "specialization" },
  { key: "sponsorName", label: "الكفالة", source: "sponsor_name" },
  { key: "sector", label: "القطاع", source: "sector" },
  { key: "employmentCategory", label: "الفئة الوظيفية", source: "employment_category" },
  { key: "jobLevel", label: "المستوى الوظيفي", source: "job_level" },
  { key: "careerPath", label: "المسار", source: "career_path" },
  { key: "gender", label: "الجنس", source: "gender" },
  { key: "nationality", label: "الجنسية", source: "nationality" },
];

const KEY_META = Object.fromEntries(EMPLOYEE_KEYS.map((item) => [item.key, item])) as Record<
  SelectKey,
  (typeof EMPLOYEE_KEYS)[number]
>;

const FILTER_ROW_KEYS: Record<SelectKey, string> = {
  branch: "branch",
  department: "department",
  employeeStatus: "employee_status",
  jobTitle: "job_title",
  specialization: "specialization",
  sponsorName: "sponsor_name",
  sector: "sector",
  employmentCategory: "employment_category",
  jobLevel: "job_level",
  careerPath: "career_path",
  gender: "gender",
  nationality: "nationality",
};

const DETAILED_COLUMNS: Column[] = [
  { key: "emp_no", label: "الرقم الوظيفي" },
  { key: "employee_name", label: "اسم الموظف" },
  { key: "branch", label: "الفرع" },
  { key: "department", label: "القسم" },
  { key: "job_title", label: "الوظيفة" },
  { key: "work_date", label: "التاريخ", format: "date" },
  { key: "weekday", label: "اليوم" },
  { key: "check_in", label: "وقت الحضور", format: "time" },
  { key: "check_out", label: "وقت الانصراف", format: "time" },
  { key: "status", label: "الحالة", format: "status" },
  { key: "late_minutes", label: "دقائق التأخير", format: "minutes" },
  { key: "work_duration", label: "مدة العمل", format: "duration" },
];

const COMPREHENSIVE_COLUMNS: Column[] = [
  { key: "emp_no", label: "الرقم الوظيفي" },
  { key: "employee_name", label: "اسم الموظف" },
  { key: "fingerprint_no", label: "رقم البصمة" },
  { key: "branch", label: "الفرع" },
  { key: "department", label: "القسم" },
  { key: "main_department", label: "القسم الرئيسي" },
  { key: "sector", label: "القطاع" },
  { key: "career_path", label: "المسار" },
  { key: "job_title", label: "الوظيفة الحالية" },
  { key: "job_level", label: "المستوى الوظيفي" },
  { key: "work_date", label: "التاريخ", format: "date" },
  { key: "check_in", label: "وقت الحضور", format: "time" },
  { key: "check_out", label: "وقت الانصراف", format: "time" },
  { key: "status", label: "حالة الحضور", format: "status" },
  { key: "late_minutes", label: "التأخير", format: "minutes" },
  { key: "work_duration", label: "مدة العمل", format: "duration" },
  { key: "show_in_fingerprint_reports", label: "يظهر في تقارير البصمة", format: "boolean" },
];

const DAILY_LATE_COLUMNS: Column[] = [
  { key: "emp_no", label: "الرقم الوظيفي" },
  { key: "employee_name", label: "اسم الموظف" },
  { key: "branch", label: "الفرع" },
  { key: "department", label: "القسم" },
  { key: "job_title", label: "الوظيفة الحالية" },
  { key: "job_level", label: "المستوى الوظيفي" },
  { key: "work_date", label: "التاريخ", format: "date" },
  { key: "weekday", label: "اليوم" },
  { key: "check_in", label: "وقت الحضور", format: "time" },
  { key: "late_minutes", label: "دقائق التأخير", format: "minutes" },
  { key: "status", label: "الحالة", format: "status" },
];

const STATISTICS_COLUMNS: Column[] = [
  { key: "dimension", label: "البعد الإحصائي" },
  { key: "total_days", label: "إجمالي السجلات" },
  { key: "present_days", label: "حضور" },
  { key: "late_days", label: "تأخير" },
  { key: "absent_days", label: "غياب" },
  { key: "leave_days", label: "إجازة" },
  { key: "permit_days", label: "إذن" },
  { key: "late_minutes", label: "إجمالي دقائق التأخير", format: "minutes" },
  { key: "attendance_rate", label: "نسبة الحضور", format: "rate" },
];

const PIVOT_OPTIONS = [
  { value: "emp_no", label: "الرقم الوظيفي" },
  { value: "employee_name", label: "اسم الموظف" },
  { value: "branch", label: "الفرع" },
  { value: "department", label: "القسم" },
  { value: "gender", label: "الجنس" },
];

function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function firstOfMonth() {
  return `${todayISO().slice(0, 8)}01`;
}

function initialFilters(): FilterState {
  return {
    branch: "",
    department: "",
    employeeStatus: "",
    jobTitle: "",
    specialization: "",
    sponsorName: "",
    sector: "",
    employmentCategory: "",
    jobLevel: "",
    careerPath: "",
    gender: "",
    nationality: "",
    employee: "",
    date: todayISO(),
    from: firstOfMonth(),
    to: todayISO(),
    showInFingerprintReports: false,
    fingerprintExempt: false,
  };
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function fmtDate(value: unknown) {
  const valueText = text(value);
  return /^\d{4}-\d{2}-\d{2}/.test(valueText) ? valueText.slice(0, 10) : valueText || "—";
}

function fmtTime(value: unknown) {
  const valueText = text(value);
  if (!valueText) return "—";
  const match = valueText.match(/(\d{1,2}:\d{2})(?::\d{2})?/);
  return match?.[1] ?? valueText;
}

function weekday(value: unknown) {
  const valueText = text(value);
  if (!valueText) return "—";
  const date = new Date(`${valueText.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("ar-EG", { weekday: "long" }).format(date);
}

function timeToMinutes(value: unknown) {
  const match = text(value).match(/^(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function workDuration(checkIn: unknown, checkOut: unknown) {
  const start = timeToMinutes(checkIn);
  const end = timeToMinutes(checkOut);
  if (start == null || end == null) return null;
  return end >= start ? end - start : end + 24 * 60 - start;
}

function durationLabel(value: unknown) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 0) return "—";
  return `${Math.floor(minutes / 60)} س ${minutes % 60} د`;
}

function escapeCsv(value: unknown) {
  return `"${text(value).replaceAll('"', '""')}"`;
}

function exportCsv(filename: string, columns: Column[], rows: Row[]) {
  const matrix = [
    columns.map((column) => column.label),
    ...rows.map((row) =>
      columns.map((column) => {
        const value = row[column.key];
        if (column.format === "date") return fmtDate(value);
        if (column.format === "time") return fmtTime(value);
        if (column.format === "duration") return durationLabel(value);
        if (column.format === "rate") return `${Number(value || 0)}%`;
        if (column.format === "boolean") return value ? "نعم" : "لا";
        return value ?? "";
      }),
    ),
  ];
  const csv = `\uFEFF${matrix.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}-${todayISO()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  toast.success("تم تصدير التقرير بنجاح");
}

function statusTone(status: string): "green" | "amber" | "muted" | "blue" | "teal" {
  if (status.includes("حاضر")) return "green";
  if (status.includes("متأخر")) return "amber";
  if (status.includes("غائب")) return "muted";
  if (status.includes("إجاز") || status.includes("أجاز")) return "blue";
  return "teal";
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${control} appearance-none pe-9`}
        >
          <option value="">اختر ....</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <MaterialIcon
          name="expand_more"
          size={18}
          className="pointer-events-none absolute inset-y-0 left-2.5 my-auto h-fit text-muted-foreground"
        />
      </div>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={control}
      />
    </label>
  );
}

function EmployeeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">موظف</span>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="البحث باسم أو رقم الموظف"
          className={`${control} pe-9`}
        />
        <MaterialIcon
          name="person_search"
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
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex h-[66px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-input bg-background px-4 text-[12px] font-bold text-foreground/80 transition-colors hover:bg-secondary/60">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-primary"
      />
    </label>
  );
}

function FilterGrid({
  variant,
  filters,
  setFilters,
  optionsFor,
  onSearch,
}: {
  variant: AttendanceReportVariant;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  optionsFor: (key: SelectKey) => string[];
  onSearch: () => void;
}) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const select = (key: SelectKey) => (
    <SelectField
      key={key}
      label={KEY_META[key].label}
      value={filters[key]}
      options={optionsFor(key)}
      onChange={(value) => set(key, value)}
    />
  );

  if (variant === "statistics") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {select("branch")}
        {select("department")}
        {select("gender")}
        <DateField label="التاريخ" value={filters.date} onChange={(value) => set("date", value)} />
        <div className="self-end">
          <Btn icon="search" onClick={onSearch}>
            بحث
          </Btn>
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <CheckField
          label="عرض في تقارير البصمة"
          checked={filters.showInFingerprintReports}
          onChange={(value) => set("showInFingerprintReports", value)}
        />
        {select("branch")}
        {select("department")}
        {select("employeeStatus")}
        {select("jobLevel")}
        {select("gender")}
        <EmployeeField value={filters.employee} onChange={(value) => set("employee", value)} />
        <DateField
          label="التاريخ من"
          value={filters.from}
          onChange={(value) => set("from", value)}
        />
        <DateField label="التاريخ إلى" value={filters.to} onChange={(value) => set("to", value)} />
      </div>
    );
  }

  if (variant === "daily-late") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <CheckField
          label="عرض في تقارير البصمة"
          checked={filters.showInFingerprintReports}
          onChange={(value) => set("showInFingerprintReports", value)}
        />
        {select("branch")}
        {select("department")}
        {select("employeeStatus")}
        {select("jobTitle")}
        {select("specialization")}
        {select("sponsorName")}
        {select("jobLevel")}
        {select("gender")}
        <EmployeeField value={filters.employee} onChange={(value) => set("employee", value)} />
        <DateField label="التاريخ" value={filters.date} onChange={(value) => set("date", value)} />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <CheckField
        label="مستثنى من البصمة"
        checked={filters.fingerprintExempt}
        onChange={(value) => set("fingerprintExempt", value)}
      />
      <CheckField
        label="عرض في تقارير البصمة"
        checked={filters.showInFingerprintReports}
        onChange={(value) => set("showInFingerprintReports", value)}
      />
      {select("branch")}
      {select("department")}
      {select("employeeStatus")}
      {select("jobTitle")}
      {select("specialization")}
      {select("sponsorName")}
      {select("sector")}
      {select("employmentCategory")}
      {select("jobLevel")}
      {select("careerPath")}
      {select("gender")}
      {select("nationality")}
      <EmployeeField value={filters.employee} onChange={(value) => set("employee", value)} />
      <DateField label="التاريخ من" value={filters.from} onChange={(value) => set("from", value)} />
      <DateField label="التاريخ إلى" value={filters.to} onChange={(value) => set("to", value)} />
    </div>
  );
}

export function AttendanceReportPage({ variant }: { variant: AttendanceReportVariant }) {
  const report = REPORTS[variant];
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [applied, setApplied] = useState<FilterState>(initialFilters);
  const [pivot, setPivot] = useState("emp_no");
  const [term, setTerm] = useState("");
  const [exportAll, setExportAll] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const dateFrom =
    variant === "statistics" || variant === "daily-late" ? applied.date : applied.from;
  const dateTo = variant === "statistics" || variant === "daily-late" ? applied.date : applied.to;
  const { data: attendance = [], isLoading: attendanceLoading } = useRows("attendance_records", {
    orderBy: "work_date",
    from: dateFrom,
    to: dateTo,
    rangeColumn: "work_date",
  });
  const { data: employees = [], isLoading: employeesLoading } = useRows("employees", {
    orderBy: "emp_no",
    ascending: true,
  });

  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [text(employee["id"]), employee])),
    [employees],
  );
  const employeeByName = useMemo(
    () => new Map(employees.map((employee) => [text(employee["full_name"]), employee])),
    [employees],
  );

  const enriched = useMemo(
    () =>
      attendance.map((record) => {
        const employee =
          employeeById.get(text(record["employee_id"])) ??
          employeeByName.get(text(record["employee_name"]));
        const workDate = record["work_date"];
        return {
          ...record,
          emp_no: employee?.["emp_no"] ?? record["emp_no"] ?? "",
          employee_name: employee?.["full_name"] ?? record["employee_name"] ?? "",
          branch: employee?.["branch"] ?? record["branch"] ?? "",
          department: employee?.["department"] ?? record["department"] ?? "",
          employee_status: employee?.["status"] ?? "",
          job_title: employee?.["job_title"] ?? "",
          specialization: employee?.["specialization"] ?? "",
          sponsor_name: employee?.["sponsor_name"] ?? "",
          sector: employee?.["sector"] ?? "",
          employment_category: employee?.["employment_category"] ?? "",
          job_level: employee?.["job_level"] ?? "",
          career_path: employee?.["career_path"] ?? "",
          gender: employee?.["gender"] ?? "",
          nationality: employee?.["nationality"] ?? "",
          main_department: employee?.["main_department"] ?? "",
          fingerprint_no: employee?.["fingerprint_no"] ?? "",
          show_in_fingerprint_reports: employee?.["show_in_fingerprint_reports"] !== false,
          fingerprint_deduction_exempt: employee?.["fingerprint_deduction_exempt"] === true,
          weekday: weekday(workDate),
          work_duration: workDuration(record["check_in"], record["check_out"]),
        } as Row;
      }),
    [attendance, employeeById, employeeByName],
  );

  const optionsFor = (key: SelectKey) => {
    const source = KEY_META[key].source;
    return Array.from(
      new Set(employees.map((employee) => text(employee[source])).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "ar"));
  };

  const filtered = useMemo(() => {
    const employeeTerm = applied.employee.toLocaleLowerCase("ar").trim();
    return enriched.filter((row) => {
      for (const key of Object.keys(FILTER_ROW_KEYS) as SelectKey[]) {
        const expected = applied[key];
        if (expected && text(row[FILTER_ROW_KEYS[key]]) !== expected) return false;
      }
      if (
        employeeTerm &&
        !`${text(row["employee_name"])} ${text(row["emp_no"])}`
          .toLocaleLowerCase("ar")
          .includes(employeeTerm)
      ) {
        return false;
      }
      if (applied.showInFingerprintReports && !row["show_in_fingerprint_reports"]) return false;
      if (applied.fingerprintExempt && !row["fingerprint_deduction_exempt"]) return false;
      if (
        variant === "daily-late" &&
        Number(row["late_minutes"] ?? 0) <= 0 &&
        !text(row["status"]).includes("متأخر")
      ) {
        return false;
      }
      return true;
    });
  }, [applied, enriched, variant]);

  const statistics = useMemo(() => {
    if (variant !== "statistics") return [];
    const groups = new Map<string, Row>();
    for (const row of filtered) {
      const dimension = text(row[pivot]) || "غير محدد";
      const current = groups.get(dimension) ?? {
        id: dimension,
        dimension,
        total_days: 0,
        present_days: 0,
        late_days: 0,
        absent_days: 0,
        leave_days: 0,
        permit_days: 0,
        late_minutes: 0,
        attendance_rate: 0,
      };
      const status = text(row["status"]);
      current["total_days"] += 1;
      current["late_minutes"] += Number(row["late_minutes"] ?? 0);
      if (status.includes("غائب")) current["absent_days"] += 1;
      else if (status.includes("إجاز") || status.includes("أجاز")) current["leave_days"] += 1;
      else if (status.includes("إذن")) current["permit_days"] += 1;
      else current["present_days"] += 1;
      if (status.includes("متأخر") || Number(row["late_minutes"] ?? 0) > 0) {
        current["late_days"] += 1;
      }
      groups.set(dimension, current);
    }
    return Array.from(groups.values()).map((row) => ({
      ...row,
      attendance_rate: Math.round(
        (Number(row["present_days"]) / Math.max(1, Number(row["total_days"]))) * 100,
      ),
    }));
  }, [filtered, pivot, variant]);

  const columns =
    variant === "statistics"
      ? STATISTICS_COLUMNS
      : variant === "detailed"
        ? DETAILED_COLUMNS
        : variant === "daily-late"
          ? DAILY_LATE_COLUMNS
          : COMPREHENSIVE_COLUMNS;
  const reportRows = variant === "statistics" ? statistics : filtered;
  const searchedRows = useMemo(() => {
    const query = term.toLocaleLowerCase("ar").trim();
    if (!query) return reportRows;
    return reportRows.filter((row) =>
      columns.some((column) => text(row[column.key]).toLocaleLowerCase("ar").includes(query)),
    );
  }, [columns, reportRows, term]);

  const pages = Math.max(1, Math.ceil(searchedRows.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pageRows = searchedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const isLoading = attendanceLoading || employeesLoading;

  const applySearch = () => {
    const from = variant === "statistics" || variant === "daily-late" ? filters.date : filters.from;
    const to = variant === "statistics" || variant === "daily-late" ? filters.date : filters.to;
    if (!from || !to) {
      toast.error("يرجى تحديد التاريخ");
      return;
    }
    if (from > to) {
      toast.error("تاريخ البداية يجب ألا يكون بعد تاريخ النهاية");
      return;
    }
    setApplied(filters);
    setPage(1);
  };

  const reset = () => {
    const next = initialFilters();
    setFilters(next);
    setApplied(next);
    setPivot("emp_no");
    setTerm("");
    setPage(1);
    toast.success("تمت إعادة ضبط التقرير");
  };

  const renderCell = (row: Row, column: Column) => {
    const value = row[column.key];
    if (column.format === "date") return <span dir="ltr">{fmtDate(value)}</span>;
    if (column.format === "time") return <span dir="ltr">{fmtTime(value)}</span>;
    if (column.format === "duration") return durationLabel(value);
    if (column.format === "minutes") {
      return (
        <span
          className={Number(value) > 0 ? "font-extrabold text-amber-600" : "text-muted-foreground"}
        >
          {Number(value || 0)}
        </span>
      );
    }
    if (column.format === "status") {
      const label = text(value) || "غير محدد";
      return <Chip label={label} tone={statusTone(label)} />;
    }
    if (column.format === "rate") {
      const rate = Number(value || 0);
      return (
        <div className="flex min-w-28 items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, rate)}%` }}
            />
          </div>
          <span dir="ltr" className="font-bold">
            {rate}%
          </span>
        </div>
      );
    }
    if (column.format === "boolean") return value ? "نعم" : "لا";
    return text(value) || "—";
  };

  return (
    <AppShell>
      <div className="mt-3">
        <Breadcrumbs trail={["التقارير", "تقارير البصمة", report.title]} />
      </div>
      <PageBanner title={report.title} subtitle={report.subtitle} icon={report.icon} />

      <section
        className="mt-4 rounded-2xl border border-border bg-secondary/55 p-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <FilterGrid
          variant={variant}
          filters={filters}
          setFilters={setFilters}
          optionsFor={optionsFor}
          onSearch={applySearch}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {variant !== "statistics" && (
            <Btn icon="search" onClick={applySearch}>
              بحث
            </Btn>
          )}
          <Btn icon="restart_alt" variant="ghost" onClick={reset}>
            إعادة تعيين
          </Btn>
          {variant === "comprehensive" && (
            <Btn icon="print" variant="teal" onClick={() => window.print()}>
              طباعة
            </Btn>
          )}
        </div>
      </section>

      <section
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
            <MaterialIcon name="table_rows" size={19} className="text-primary" filled />
            {report.tableTitle}
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
              {searchedRows.length}
            </span>
          </h2>
          <label className="flex items-center gap-2 text-[12px] font-bold">
            <input
              type="checkbox"
              checked={exportAll}
              onChange={(event) => setExportAll(event.target.checked)}
              className="size-4 accent-primary"
            />
            تصدير كل الداتا
          </label>
          {variant === "statistics" && (
            <>
              <select
                value={pivot}
                onChange={(event) => {
                  setPivot(event.target.value);
                  setPage(1);
                }}
                className={`${control} h-9 w-44 appearance-none`}
              >
                {PIVOT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setPivot("emp_no")}
                className="flex h-9 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-[12px] font-bold text-white hover:bg-emerald-700"
              >
                <MaterialIcon name="pivot_table_chart" size={17} />
                إعادة ضبط الجدول المحوري
              </button>
            </>
          )}
          <div className="relative">
            <input
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setPage(1);
              }}
              placeholder="ابحث..."
              className={`${control} h-9 w-48 pe-9`}
            />
            <MaterialIcon
              name="search"
              size={17}
              className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
            />
          </div>
          <button
            type="button"
            title="تصدير Excel/CSV"
            onClick={() =>
              exportCsv(`attendance-${variant}`, columns, exportAll ? searchedRows : pageRows)
            }
            className="grid size-9 place-items-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <MaterialIcon name="table_view" size={18} />
          </button>
          <button
            type="button"
            title="طباعة / PDF"
            onClick={() => window.print()}
            className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            <MaterialIcon name="print" size={18} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-right">
            <thead>
              <tr className="bg-topbar text-topbar-foreground">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap px-4 py-3 text-[12px] font-extrabold"
                  >
                    <span className="flex items-center gap-1.5">
                      {column.label}
                      <MaterialIcon name="filter_alt" size={14} className="text-white/75" />
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
                    className="px-4 py-16 text-center text-sm font-semibold text-muted-foreground"
                  >
                    <MaterialIcon
                      name={isLoading ? "progress_activity" : "inbox"}
                      size={28}
                      className="mx-auto mb-2 text-primary/50"
                    />
                    {isLoading ? "جارٍ تحميل بيانات التقرير..." : "لا توجد بيانات مطابقة للفلاتر"}
                  </td>
                </tr>
              )}
              {!isLoading &&
                pageRows.map((row, index) => (
                  <tr
                    key={text(row["id"]) || `${currentPage}-${index}`}
                    className="border-b border-border odd:bg-secondary/30 hover:bg-accent/40"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="whitespace-nowrap px-4 py-2.5 text-[12.5px] font-semibold"
                      >
                        {renderCell(row, column)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 text-[12px] font-bold">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage === 1}
            className="grid size-8 place-items-center rounded-lg hover:bg-secondary disabled:opacity-40"
          >
            <MaterialIcon name="chevron_right" size={18} />
          </button>
          <span>
            صفحة {currentPage} من {pages} · {searchedRows.length} عنصر
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(pages, value + 1))}
            disabled={currentPage === pages}
            className="grid size-8 place-items-center rounded-lg hover:bg-secondary disabled:opacity-40"
          >
            <MaterialIcon name="chevron_left" size={18} />
          </button>
          <div className="ms-auto flex items-center gap-1">
            {[5, 10, 20, 50].map((size) => (
              <button
                type="button"
                key={size}
                onClick={() => {
                  setPageSize(size);
                  setPage(1);
                }}
                className={`grid size-8 place-items-center rounded-lg ${
                  size === pageSize
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
