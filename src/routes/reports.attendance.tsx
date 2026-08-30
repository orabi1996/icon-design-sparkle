import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, Btn, Chip } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/attendance")({
  head: () => ({
    meta: [
      { title: "تقرير حضور و انصراف البصمة | تقارير البصمة" },
      {
        name: "description",
        content:
          "تقرير الحضور والانصراف من سجلات البصمة مع فلاتر متعددة (الفرع، القسم، الوظيفة، الحالة، الفئة، الجنس، التاريخ وغيرها).",
      },
      { property: "og:title", content: "تقرير حضور و انصراف البصمة" },
    ],
  }),
  component: AttendanceReportPage,
});

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

const STATUS_OPTIONS = ["نشط", "موقوف", "منتهي الخدمة", "إجازة"];
const GENDER_OPTIONS = ["ذكر", "أنثى"];

/* ---------- date helpers ---------- */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function fmtDate(v: unknown) {
  if (!v) return "—";
  const s = String(v);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
}
function fmtTime(v: unknown) {
  if (!v) return "—";
  const s = String(v);
  try {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(11, 19);
    }
  } catch {
    /* fall through */
  }
  return s.length >= 8 ? s.slice(-8) : s;
}
function minutesToHM(mins: number) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}س ${m}د` : `${m}د`;
}

/* ---------- CSV export ---------- */
function escapeCsv(v: unknown) {
  const raw = String(v ?? "").replaceAll('"', '""');
  return `"${raw}"`;
}
function exportCsv(rows: Row[]) {
  const header = [
    "الرقم الوظيفي",
    "اسم الموظف",
    "الفرع",
    "القسم",
    "التاريخ",
    "الحضور",
    "الإنصراف",
    "التأخير (دقائق)",
    "الحالة",
  ];
  const body = rows.map((r) => [
    r["emp_no"] ?? "",
    r["employee_name"] ?? "",
    r["branch"] ?? "",
    r["department"] ?? "",
    fmtDate(r["work_date"]),
    fmtTime(r["check_in"]),
    fmtTime(r["check_out"]),
    r["late_minutes"] ?? 0,
    r["status"] ?? "",
  ]);
  const csv = `\uFEFF${[header, ...body].map((r) => r.map(escapeCsv).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance-report-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("تم تصدير التقرير");
}

/* ---------- filter tag helper (chip that shows applied filter) ---------- */
function AppliedTag({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-1 text-[11px] font-bold text-primary">
      <span className="font-semibold text-primary/70">{label}:</span> {value}
      <button
        onClick={onClear}
        className="me-0.5 grid size-4 place-items-center rounded-full bg-primary/15 hover:bg-primary/30"
        title="إزالة"
      >
        <MaterialIcon name="close" size={11} />
      </button>
    </span>
  );
}

/* ================================ page ================================ */

type Filters = {
  from: string;
  to: string;
  employee: string;
  gender: string;
  path: string;
  jobLevel: string;
  jobCategory: string;
  sector: string;
  sponsor: string;
  specialization: string;
  mainDept: string;
  jobTitle: string;
  status: string;
  department: string;
  branch: string;
  showInFingerprint: boolean;
};

const EMPTY_FILTERS: Filters = {
  from: firstOfMonth(),
  to: todayISO(),
  employee: "",
  gender: "",
  path: "",
  jobLevel: "",
  jobCategory: "",
  sector: "",
  sponsor: "",
  specialization: "",
  mainDept: "",
  jobTitle: "",
  status: "",
  department: "",
  branch: "",
  showInFingerprint: false,
};

function AttendanceReportPage() {
  const [f, setF] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Load lookups (from basic_lookups)
  const { data: lookups = [] } = useRows("basic_lookups", { orderBy: "name_ar", ascending: true });
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

  const opt = (key: string) => byCat[key] ?? [];

  // Load department + branch names from their tables
  const { data: departments = [] } = useRows("departments", { orderBy: "name" });
  const branchOptions = useMemo(
    () => opt("الفروع").length ? opt("الفروع") : Array.from(new Set(departments.map((d) => String(d["branch"] ?? "")).filter(Boolean))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [byCat, departments],
  );
  const departmentOptions = useMemo(
    () => Array.from(new Set(departments.map((d) => String(d["name"] ?? "")).filter(Boolean))),
    [departments],
  );

  // Query attendance records with date-range filter (server-side)
  const query = useRows("attendance_records", {
    orderBy: "work_date",
    rangeColumn: "work_date",
    ...(applied?.from ? { from: applied.from } : {}),
    ...(applied?.to ? { to: applied.to } : {}),
  });

  const rows = query.data ?? [];
  const isLoading = query.isLoading;

  // Client-side filtering for the rest (attendance_records is small; the
  // employees join would need server-side view for full filters — kept
  // client-side for now).
  const filtered = useMemo(() => {
    if (!applied) return [] as Row[];
    return rows.filter((r) => {
      if (applied.employee) {
        const q = applied.employee.trim();
        if (
          !String(r["employee_name"] ?? "").includes(q) &&
          !String(r["emp_no"] ?? "").includes(q) &&
          !String(r["employee_id"] ?? "").includes(q)
        )
          return false;
      }
      if (applied.status && r["status"] !== applied.status) return false;
      if (applied.branch && r["branch"] !== applied.branch) return false;
      if (applied.department && r["department"] !== applied.department) return false;
      return true;
    });
  }, [rows, applied]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const dateInvalid = f.from > f.to;

  const runSearch = () => {
    if (dateInvalid) {
      toast.error("تاريخ البداية بعد تاريخ النهاية");
      return;
    }
    setApplied(f);
    setPage(1);
  };

  const resetFilters = () => {
    setF(EMPTY_FILTERS);
    setApplied(null);
    setPage(1);
  };

  // Stats
  const stats = useMemo(() => {
    if (!filtered.length) return { total: 0, present: 0, absent: 0, late: 0 };
    const present = filtered.filter((r) => r["check_in"]).length;
    const late = filtered.filter((r) => Number(r["late_minutes"] ?? 0) > 0).length;
    const absent = filtered.length - present;
    return { total: filtered.length, present, absent, late };
  }, [filtered]);

  // Applied-filter tags
  const appliedTags: Array<{ key: keyof Filters; label: string; value: string }> = [];
  if (applied) {
    const push = (key: keyof Filters, label: string) => {
      const v = String(applied[key] ?? "");
      if (v && v !== "false") appliedTags.push({ key, label, value: v });
    };
    push("employee", "موظف");
    push("gender", "الجنس");
    push("path", "المسار");
    push("jobLevel", "المستوى الوظيفي");
    push("jobCategory", "الفئة الوظيفية");
    push("sector", "القطاع");
    push("sponsor", "الكفالة");
    push("specialization", "التخصص");
    push("mainDept", "القسم الرئيسي");
    push("jobTitle", "الوظيفة الحالية");
    push("status", "الحالة");
    push("department", "القسم");
    push("branch", "الفروع");
    if (applied.showInFingerprint) appliedTags.push({ key: "showInFingerprint", label: "عرض في تقارير البصمة", value: "نعم" });
  }

  return (
    <AppShell>
      <div className="mt-3">
        <Breadcrumbs trail={["التقارير", "تقارير البصمة", "تقرير حضور و انصراف البصمة"]} />
      </div>

      <h1 className="mt-3 flex items-center gap-2 text-lg font-extrabold text-foreground">
        <MaterialIcon name="fact_check" size={22} className="text-primary" filled />
        تقرير حضور و انصراف البصمة
      </h1>

      {/* Filters card */}
      <div className="mt-3 rounded-2xl border border-border bg-secondary/60 p-4">
        {/* Row 1 (matches mockup right-to-left):
             checkbox / الفروع / القسم / الحالة / الوظيفة الحالية / القسم الرئيسي */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <FieldCheck
            label="عرض في تقارير البصمة"
            checked={f.showInFingerprint}
            onChange={(v) => setF({ ...f, showInFingerprint: v })}
          />
          <FieldSelect
            label="الفروع"
            value={f.branch}
            options={branchOptions}
            placeholder={branchOptions.length ? "اختر ..." : "جار التحميل"}
            onChange={(v) => setF({ ...f, branch: v })}
          />
          <FieldSelect
            label="القسم"
            value={f.department}
            options={departmentOptions}
            placeholder={departmentOptions.length ? "اختر ..." : "جار التحميل"}
            onChange={(v) => setF({ ...f, department: v })}
          />
          <FieldSelect
            label="الحالة"
            value={f.status}
            options={STATUS_OPTIONS}
            placeholder="اختر .."
            onChange={(v) => setF({ ...f, status: v })}
          />
          <FieldSelect
            label="الوظيفة الحالية"
            value={f.jobTitle}
            options={[...(opt("الوظيفه الحاليه") || []), ...(opt("المسمي الوظيفي") || [])]}
            placeholder="جار التحميل"
            onChange={(v) => setF({ ...f, jobTitle: v })}
          />
          <FieldSelect
            label="القسم الرئيسي"
            value={f.mainDept}
            options={opt("القسم الرئيسي")}
            placeholder="جار التحميل"
            onChange={(v) => setF({ ...f, mainDept: v })}
          />
        </div>

        {/* Row 2: التخصص / الكفالة / القطاع / الفئة الوظيفية / المستوى الوظيفي / المسار */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <FieldSelect
            label="التخصص"
            value={f.specialization}
            options={opt("التخصص")}
            placeholder="جار التحميل"
            onChange={(v) => setF({ ...f, specialization: v })}
          />
          <FieldSelect
            label="الكفالة"
            value={f.sponsor}
            options={opt("الكفلاء")}
            placeholder="جار التحميل"
            onChange={(v) => setF({ ...f, sponsor: v })}
            icon="calendar_month"
          />
          <FieldSelect
            label="القطاع"
            value={f.sector}
            options={opt("القطاع")}
            placeholder="جار التحميل"
            onChange={(v) => setF({ ...f, sector: v })}
          />
          <FieldSelect
            label="الفئة الوظيفية"
            value={f.jobCategory}
            options={opt("الفئة الوظيفية")}
            placeholder="جار التحميل"
            onChange={(v) => setF({ ...f, jobCategory: v })}
          />
          <FieldSelect
            label="المستوى الوظيفي"
            value={f.jobLevel}
            options={opt("المستويات الوظيفية")}
            placeholder="جار التحميل"
            onChange={(v) => setF({ ...f, jobLevel: v })}
          />
          <FieldSelect
            label="المسار"
            value={f.path}
            options={opt("المسار")}
            placeholder="جار التحميل"
            onChange={(v) => setF({ ...f, path: v })}
          />
        </div>

        {/* Row 3: الجنس / موظف / التاريخ من / التاريخ إلى / زر بحث */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr_1fr_auto_auto]">
          <FieldSelect
            label="الجنس"
            value={f.gender}
            options={GENDER_OPTIONS}
            placeholder="اختر ..."
            onChange={(v) => setF({ ...f, gender: v })}
          />
          <label>
            <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">موظف</span>
            <input
              value={f.employee}
              onChange={(e) => setF({ ...f, employee: e.target.value })}
              placeholder="البحث بإسم أو رقم الموظف"
              className={control}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
              التاريخ من
            </span>
            <div className="relative">
              <input
                type="date"
                value={f.from}
                onChange={(e) => setF({ ...f, from: e.target.value })}
                className={control}
              />
              <MaterialIcon
                name="calendar_month"
                size={17}
                className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
              />
            </div>
          </label>
          <label>
            <span className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-foreground/80">
              التاريخ الى
              {dateInvalid && (
                <span className="ms-auto inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <MaterialIcon name="warning_amber" size={13} />
                </span>
              )}
            </span>
            <div className="relative">
              <input
                type="date"
                value={f.to}
                onChange={(e) => setF({ ...f, to: e.target.value })}
                className={`${control} ${
                  dateInvalid ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200" : ""
                }`}
              />
              <MaterialIcon
                name="calendar_month"
                size={17}
                className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
              />
            </div>
          </label>
          <div className="self-end">
            <Btn icon="search" onClick={runSearch}>
              بحث
            </Btn>
          </div>
          <div className="self-end">
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] font-bold text-foreground hover:bg-secondary"
            >
              <MaterialIcon name="restart_alt" size={17} />
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {/* No search yet */}
      {!applied && (
        <div className="mt-4 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.03] p-10 text-center">
          <MaterialIcon name="filter_alt" size={40} className="mx-auto text-primary/60" />
          <p className="mt-3 text-sm font-bold text-foreground/80">
            حدد الفلاتر ثم اضغط <span className="text-primary">"بحث"</span> لعرض التقرير
          </p>
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
            التاريخ من {f.from} إلى {f.to}
          </p>
        </div>
      )}

      {/* Result section */}
      {applied && (
        <>
          {/* Applied filter tags */}
          {appliedTags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2">
              <MaterialIcon name="tune" size={16} className="text-primary" />
              <span className="text-[11px] font-bold text-muted-foreground">
                الفلاتر المطبقة:
              </span>
              {appliedTags.map((t) => (
                <AppliedTag
                  key={t.key}
                  label={t.label}
                  value={t.value}
                  onClear={() => {
                    const next = { ...applied, [t.key]: t.key === "showInFingerprint" ? false : "" } as Filters;
                    setF(next);
                    setApplied(next);
                    setPage(1);
                  }}
                />
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="إجمالي السجلات" value={stats.total} icon="list_alt" tone="primary" />
            <StatCard title="حضور" value={stats.present} icon="check_circle" tone="emerald" />
            <StatCard title="غياب" value={stats.absent} icon="cancel" tone="rose" />
            <StatCard title="تأخير" value={stats.late} icon="schedule" tone="amber" />
          </div>

          {/* Table */}
          <div
            className="mt-3 overflow-hidden rounded-2xl border border-border bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
              <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
                <MaterialIcon name="table_rows" size={19} className="text-primary" filled />
                نتائج التقرير
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                  {filtered.length}
                </span>
              </h2>
              {[
                { icon: "picture_as_pdf", label: "PDF", onClick: () => window.print() },
                { icon: "table_view", label: "Excel/CSV", onClick: () => exportCsv(filtered) },
                { icon: "print", label: "طباعة", onClick: () => window.print() },
              ].map((b) => (
                <button
                  key={b.label}
                  title={b.label}
                  onClick={b.onClick}
                  className="grid size-9 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                  <MaterialIcon name={b.icon} size={17} />
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-right">
                <thead>
                  <tr className="bg-topbar text-topbar-foreground">
                    {[
                      "الرقم الوظيفي",
                      "اسم الموظف",
                      "الفرع",
                      "القسم",
                      "التاريخ",
                      "الحضور",
                      "الإنصراف",
                      "التأخير",
                      "الحالة",
                    ].map((c) => (
                      <th
                        key={c}
                        className="whitespace-nowrap px-4 py-3 text-[12.5px] font-extrabold"
                      >
                        <span className="flex items-center gap-1.5">
                          {c}
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
                        colSpan={9}
                        className="px-4 py-14 text-center text-sm font-semibold text-muted-foreground"
                      >
                        {isLoading ? "جارٍ تحميل التقرير..." : "لا توجد سجلات مطابقة للفلاتر"}
                      </td>
                    </tr>
                  )}
                  {pageRows.map((r) => {
                    const late = Number(r["late_minutes"] ?? 0);
                    return (
                      <tr
                        key={String(r["id"])}
                        className="border-b border-border last:border-0 odd:bg-secondary/30 hover:bg-accent/40"
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 text-[13px] font-bold text-primary">
                          {String(r["emp_no"] ?? "—")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-[13px] font-semibold">
                          {String(r["employee_name"] ?? "—")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-[13px]">
                          {String(r["branch"] ?? "—")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-[13px]">
                          {String(r["department"] ?? "—")}
                        </td>
                        <td
                          dir="ltr"
                          className="whitespace-nowrap px-4 py-2.5 text-left font-mono text-[12.5px]"
                        >
                          {fmtDate(r["work_date"])}
                        </td>
                        <td
                          dir="ltr"
                          className="whitespace-nowrap px-4 py-2.5 text-left font-mono text-[12.5px]"
                        >
                          {r["check_in"] ? (
                            <span className="text-emerald-700 dark:text-emerald-300">
                              {fmtTime(r["check_in"])}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td
                          dir="ltr"
                          className="whitespace-nowrap px-4 py-2.5 text-left font-mono text-[12.5px]"
                        >
                          {r["check_out"] ? (
                            <span className="text-amber-700 dark:text-amber-300">
                              {fmtTime(r["check_out"])}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-[12.5px]">
                          {late > 0 ? (
                            <Chip label={minutesToHM(late)} tone="amber" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <Chip
                            label={String(r["status"] ?? "—")}
                            tone={
                              r["status"] === "نشط"
                                ? "green"
                                : r["status"] === "متأخر"
                                  ? "amber"
                                  : r["status"] === "غائب"
                                    ? "muted"
                                    : "blue"
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pager */}
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
                <span className="ms-2 text-muted-foreground">({filtered.length} عنصر)</span>
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
        </>
      )}
    </AppShell>
  );
}

/* ================================ helpers ============================== */

function FieldSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
  icon?: string;
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
              {o}
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

function FieldCheck({
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

function StatCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: number;
  icon: string;
  tone: "primary" | "emerald" | "rose" | "amber";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <div
      className="rounded-2xl border border-border bg-card p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}>
          <MaterialIcon name={icon} size={20} filled />
        </span>
        <span className="text-2xl font-black tracking-tight">
          {new Intl.NumberFormat("ar-SA").format(value)}
        </span>
      </div>
      <p className="mt-2 text-[12px] font-bold text-muted-foreground">{title}</p>
    </div>
  );
}
