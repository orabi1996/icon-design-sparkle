import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, Btn, Chip, PageBanner } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, useSaveRow, useDeleteRow, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/approval-requests")({
  head: () => ({
    meta: [
      { title: "طلبات الاعتماد | نظام الموارد البشرية" },
      {
        name: "description",
        content:
          "متابعة طلبات الموظفين ودورة الاعتماد: أذون الانصراف والتأخير والإجازات وسلاسل الموافقات.",
      },
      { property: "og:title", content: "طلبات الاعتماد" },
      {
        property: "og:description",
        content: "قائمة طلبات الموظفين مع سلسلة الاعتماد وحالة الاعتماد الحالية.",
      },
    ],
  }),
  component: ApprovalRequestsPage,
});

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

const REQUEST_TYPES = [
  "أذن إنصراف مبكر",
  "أذن تأخير",
  "أذن مغادرة",
  "طلب إجازة",
  "طلب سلفة",
  "طلب تعديل بصمة",
  "طلب مراسلة",
  "طلب استقالة",
];

const APPROVAL_CHAINS = [
  "موارد بشرية",
  "الشؤون الإدارية",
  "الشؤون المالية",
  "المدير التنفيذي",
];

const AWAITING_STAGES = [
  "المدير المباشر",
  "موارد بشرية",
  "المدير المالي",
  "المدير التنفيذي",
];

const STATUS_META: Record<
  string,
  { label: string; tone: "amber" | "green" | "muted" | "blue"; icon: string }
> = {
  pending:   { label: "بانتظار الاعتماد", tone: "amber",  icon: "hourglass_top" },
  approved:  { label: "معتمد",            tone: "green",  icon: "check_circle" },
  rejected:  { label: "مرفوض",            tone: "muted",  icon: "cancel" },
  cancelled: { label: "ملغى",             tone: "muted",  icon: "block" },
};

function fmtDateTime(v: unknown) {
  if (!v) return "—";
  const s = String(v);
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return s;
  }
}

function ApprovalRequestsPage() {
  const { data: rows = [], isLoading } = useRows("approval_requests", {
    orderBy: "request_date",
  });
  const save = useSaveRow("approval_requests");
  const del = useDeleteRow("approval_requests");

  const [draft, setDraft] = useState<Row | null>(null);
  const [term, setTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const t = term.trim();
    return rows.filter((r) => {
      if (statusFilter && r["status"] !== statusFilter) return false;
      if (typeFilter && r["request_type"] !== typeFilter) return false;
      if (!t) return true;
      return [
        "employee_name",
        "emp_no",
        "request_type",
        "request_subject",
        "branch",
        "department",
        "direct_manager_name",
        "awaiting_approver_name",
      ].some((k) => String(r[k] ?? "").includes(t));
    });
  }, [rows, term, statusFilter, typeFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = useMemo(() => {
    const by = (s: string) => rows.filter((r) => r["status"] === s).length;
    return {
      total: rows.length,
      pending: by("pending"),
      approved: by("approved"),
      rejected: by("rejected"),
    };
  }, [rows]);

  const openNew = () =>
    setDraft({
      employee_name: "",
      emp_no: "",
      branch: "",
      department: "",
      category: "",
      request_type: "",
      request_subject: "",
      request_details: "",
      approval_chain: "",
      direct_manager_name: "",
      awaiting_approver_name: "",
      awaiting_stage: "المدير المباشر",
      status: "pending",
    });

  const submit = async () => {
    if (!draft) return;
    if (!String(draft["employee_name"] ?? "").trim()) return;
    if (!String(draft["request_type"] ?? "").trim()) return;
    await save.mutateAsync(draft);
    setDraft(null);
  };

  const approve = async (r: Row) => {
    await save.mutateAsync({
      ...r,
      status: "approved",
      decision_at: new Date().toISOString(),
    });
  };
  const reject = async (r: Row) => {
    const reason = prompt("سبب الرفض؟") ?? "";
    await save.mutateAsync({
      ...r,
      status: "rejected",
      decision_at: new Date().toISOString(),
      decision_reason: reason,
    });
  };

  return (
    <AppShell>
      <Breadcrumbs trail={["طلبات الاعتماد"]} />
      <PageBanner
        icon="task_alt"
        title="طلبات الاعتماد"
        subtitle="متابعة طلبات الموظفين وسلسلة الاعتماد والحالة الحالية"
        actions={
          <Btn icon="add" variant="onDark" onClick={openNew}>
            إضافة طلب
          </Btn>
        }
      />

      {/* Stat cards */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="إجمالي الطلبات" value={stats.total} icon="inbox" tone="primary" />
        <StatCard title="بانتظار الاعتماد" value={stats.pending} icon="hourglass_top" tone="amber" />
        <StatCard title="معتمد" value={stats.approved} icon="check_circle" tone="emerald" />
        <StatCard title="مرفوض" value={stats.rejected} icon="cancel" tone="rose" />
      </div>

      {/* Table */}
      <div
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
            <MaterialIcon name="pending_actions" size={19} className="text-primary" filled />
            قائمة الطلبات
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {filtered.length}
            </span>
          </h2>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`${control} h-9 w-44`}
          >
            <option value="">كل الأنواع</option>
            {REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${control} h-9 w-40`}
          >
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث..."
              className={`${control} h-9 w-56 pe-9`}
            />
            <MaterialIcon
              name="search"
              size={17}
              className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
            />
          </div>

          {[
            { icon: "picture_as_pdf", label: "PDF" },
            { icon: "table_view", label: "Excel" },
            { icon: "print", label: "طباعة" },
          ].map((b) => (
            <button
              key={b.label}
              title={b.label}
              className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-primary transition-colors hover:bg-accent"
            >
              <MaterialIcon name={b.icon} size={17} />
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-right">
            <thead>
              <tr className="bg-secondary">
                {[
                  "اسم الموظف",
                  "بيانات الطلب",
                  "الفرع",
                  "التصنيف",
                  "تاريخ الطلب",
                  "تاريخ الإدخال",
                  "سلسلة الموافقة",
                  "المدير المباشر",
                  "في انتظار موافقة",
                  "الحالة",
                  "إجراءات",
                ].map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap border-b border-border px-4 py-3 text-[12px] font-extrabold text-secondary-foreground"
                  >
                    <span className="flex items-center gap-1.5">
                      {c}
                      <MaterialIcon
                        name="filter_list"
                        size={14}
                        className="text-primary/40"
                      />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(isLoading || pageRows.length === 0) && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-14 text-center text-sm font-semibold text-muted-foreground"
                  >
                    {isLoading ? "جارٍ تحميل الطلبات..." : "لا توجد طلبات مطابقة"}
                  </td>
                </tr>
              )}

              {pageRows.map((r) => {
                const meta =
                  STATUS_META[String(r["status"] ?? "pending")] ??
                  ({ label: "بانتظار الاعتماد", tone: "amber", icon: "hourglass_top" } as const);
                return (
                  <tr
                    key={String(r["id"])}
                    className="border-b border-border transition-colors last:border-0 odd:bg-secondary/35 hover:bg-accent/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                          <MaterialIcon name="person" size={17} filled />
                        </span>
                        <span>
                          <span className="block text-[13px] font-bold">
                            {String(r["employee_name"] ?? "—")}
                          </span>
                          {r["emp_no"] && (
                            <span className="block text-[10px] font-semibold text-muted-foreground">
                              #{String(r["emp_no"])}
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="flex items-center gap-2">
                        <MaterialIcon
                          name="description"
                          size={16}
                          className="text-primary/70"
                        />
                        <span className="text-[13px] font-semibold">
                          {String(r["request_type"] ?? "—")}
                        </span>
                      </span>
                      {r["request_subject"] && (
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {String(r["request_subject"])}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {String(r["branch"] ?? "—")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {r["category"] ? (
                        <Chip label={String(r["category"])} tone="teal" />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold text-muted-foreground">
                      {fmtDateTime(r["request_date"])}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold text-muted-foreground">
                      {fmtDateTime(r["entered_at"])}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {r["approval_chain"] ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-bold text-primary">
                          <MaterialIcon name="account_tree" size={13} />
                          {String(r["approval_chain"])}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {String(r["direct_manager_name"] ?? "—")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {r["awaiting_approver_name"] ? (
                        String(r["awaiting_approver_name"])
                      ) : (
                        <span className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                          بانتظار {String(r["awaiting_stage"] ?? "المدير المباشر")}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Chip label={meta.label} tone={meta.tone} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="flex items-center gap-1">
                        {r["status"] === "pending" && (
                          <>
                            <button
                              title="اعتماد"
                              onClick={() => approve(r)}
                              className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                            >
                              <MaterialIcon name="check" size={17} />
                            </button>
                            <button
                              title="رفض"
                              onClick={() => reject(r)}
                              className="grid size-8 place-items-center rounded-lg bg-rose-100 text-rose-700 transition-colors hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300"
                            >
                              <MaterialIcon name="close" size={17} />
                            </button>
                          </>
                        )}
                        <button
                          title="تعديل"
                          onClick={() => setDraft({ ...r })}
                          className="grid size-8 place-items-center rounded-lg bg-secondary text-primary transition-colors hover:bg-accent"
                        >
                          <MaterialIcon name="edit" size={17} />
                        </button>
                        <button
                          title="حذف"
                          onClick={() => {
                            if (confirm("هل تريد حذف هذا الطلب نهائياً؟"))
                              del.mutate(String(r["id"]));
                          }}
                          className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <MaterialIcon name="delete" size={17} />
                        </button>
                      </span>
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
            {[5, 10, 20].map((n) => (
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
          <div className="ms-auto flex items-center gap-1">
            <span className="me-2 text-muted-foreground">
              صفحة {currentPage} من {pages} ({filtered.length} عنصر)
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={currentPage >= pages}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-40"
            >
              <MaterialIcon name="chevron_right" size={18} />
            </button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((n) => (
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
            ))}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-40"
            >
              <MaterialIcon name="chevron_left" size={18} />
            </button>
          </div>
        </div>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-topbar/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <MaterialIcon
                name={draft["id"] ? "edit" : "add_task"}
                size={22}
                className="text-primary"
                filled
              />
              <div>
                <h3 className="text-sm font-extrabold">
                  {draft["id"] ? "تعديل طلب اعتماد" : "إضافة طلب اعتماد"}
                </h3>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  أدخل بيانات الموظف والطلب وسلسلة الاعتماد
                </p>
              </div>
              <button
                onClick={() => setDraft(null)}
                className="ms-auto text-muted-foreground hover:text-foreground"
              >
                <MaterialIcon name="close" size={22} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <section className="rounded-2xl border border-border bg-secondary/40 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
                  <MaterialIcon name="badge" size={17} className="text-primary" filled />
                  بيانات الموظف
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <FieldText
                    label="اسم الموظف"
                    required
                    value={String(draft["employee_name"] ?? "")}
                    onChange={(v) => setDraft({ ...draft, employee_name: v })}
                  />
                  <FieldText
                    label="رقم الموظف"
                    value={String(draft["emp_no"] ?? "")}
                    onChange={(v) => setDraft({ ...draft, emp_no: v })}
                  />
                  <FieldText
                    label="الفرع"
                    value={String(draft["branch"] ?? "")}
                    onChange={(v) => setDraft({ ...draft, branch: v })}
                  />
                  <FieldText
                    label="القسم"
                    value={String(draft["department"] ?? "")}
                    onChange={(v) => setDraft({ ...draft, department: v })}
                  />
                  <FieldText
                    label="التصنيف الإداري"
                    value={String(draft["category"] ?? "")}
                    onChange={(v) => setDraft({ ...draft, category: v })}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-secondary/40 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
                  <MaterialIcon name="description" size={17} className="text-primary" filled />
                  بيانات الطلب
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <FieldSelect
                    label="نوع الطلب"
                    required
                    value={String(draft["request_type"] ?? "")}
                    options={REQUEST_TYPES.map((t) => ({ value: t, label: t }))}
                    onChange={(v) => setDraft({ ...draft, request_type: v })}
                  />
                  <FieldText
                    label="عنوان الطلب"
                    value={String(draft["request_subject"] ?? "")}
                    onChange={(v) => setDraft({ ...draft, request_subject: v })}
                  />
                  <label>
                    <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                      من تاريخ
                    </span>
                    <input
                      type="date"
                      className={control}
                      value={String(draft["effective_from"] ?? "")}
                      onChange={(e) => setDraft({ ...draft, effective_from: e.target.value })}
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                      إلى تاريخ
                    </span>
                    <input
                      type="date"
                      className={control}
                      value={String(draft["effective_to"] ?? "")}
                      onChange={(e) => setDraft({ ...draft, effective_to: e.target.value })}
                    />
                  </label>
                  <label className="sm:col-span-2 xl:col-span-3">
                    <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                      تفاصيل الطلب
                    </span>
                    <textarea
                      rows={3}
                      className={`${control} h-auto py-2`}
                      value={String(draft["request_details"] ?? "")}
                      onChange={(e) => setDraft({ ...draft, request_details: e.target.value })}
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-secondary/40 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
                  <MaterialIcon name="account_tree" size={17} className="text-primary" filled />
                  سلسلة الاعتماد
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <FieldSelect
                    label="سلسلة الموافقة"
                    value={String(draft["approval_chain"] ?? "")}
                    options={APPROVAL_CHAINS.map((t) => ({ value: t, label: t }))}
                    onChange={(v) => setDraft({ ...draft, approval_chain: v })}
                  />
                  <FieldText
                    label="المدير المباشر"
                    value={String(draft["direct_manager_name"] ?? "")}
                    onChange={(v) => setDraft({ ...draft, direct_manager_name: v })}
                  />
                  <FieldText
                    label="في انتظار موافقة"
                    value={String(draft["awaiting_approver_name"] ?? "")}
                    onChange={(v) => setDraft({ ...draft, awaiting_approver_name: v })}
                  />
                  <FieldSelect
                    label="المرحلة الحالية"
                    value={String(draft["awaiting_stage"] ?? "المدير المباشر")}
                    options={AWAITING_STAGES.map((t) => ({ value: t, label: t }))}
                    onChange={(v) => setDraft({ ...draft, awaiting_stage: v })}
                  />
                  <FieldSelect
                    label="الحالة"
                    value={String(draft["status"] ?? "pending")}
                    options={Object.entries(STATUS_META).map(([k, v]) => ({
                      value: k,
                      label: v.label,
                    }))}
                    onChange={(v) => setDraft({ ...draft, status: v })}
                  />
                </div>
              </section>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
              <button
                onClick={submit}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700"
              >
                <MaterialIcon name="save" size={18} />
                {save.isPending ? "جارٍ الحفظ..." : draft["id"] ? "حفظ التعديلات" : "إضافة الطلب"}
              </button>
              <button
                onClick={() => setDraft(null)}
                className="flex items-center gap-2 rounded-xl bg-rose-100 px-4 py-2.5 text-[13px] font-bold text-rose-700 hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-200"
              >
                <MaterialIcon name="close" size={18} />
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
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
  tone: "primary" | "amber" | "emerald" | "rose";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };
  return (
    <div
      className="rounded-2xl border border-border bg-card p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <span className={`grid size-11 place-items-center rounded-xl ${tones[tone]}`}>
          <MaterialIcon name={icon} size={22} filled />
        </span>
        <span className="text-2xl font-black tracking-tight">
          {new Intl.NumberFormat("ar-SA").format(value)}
        </span>
      </div>
      <p className="mt-2 text-[12px] font-bold text-muted-foreground">{title}</p>
    </div>
  );
}

function FieldText({
  label,
  required,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-foreground/80">
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
      <input
        className={control}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function FieldSelect({
  label,
  required,
  value,
  options,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-foreground/80">
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
      <select className={control} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">اختر ....</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
