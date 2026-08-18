import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Btn, Chip } from "@/components/hr/ui";
import { useDeleteRow, useRows, useSaveRow, type HrTable, type Row } from "@/lib/hr-db";

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "checkbox" | "textarea";
  options?: string[];
  required?: boolean;
  /** hide from the table, keep in the form */
  formOnly?: boolean;
  /** hide from the form, keep in the table */
  tableOnly?: boolean;
  render?: (row: Row) => ReactNode;
};

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

const statusTone = (v: string): "green" | "amber" | "teal" | "muted" | "blue" => {
  if (["نشط", "معتمدة", "معتمد", "مسددة", "مقفل", "حاضر"].includes(v)) return "green";
  if (["بانتظار الموافقة", "جديد", "مسودة", "متأخر"].includes(v)) return "amber";
  if (["قيد المعالجة", "قيد السداد"].includes(v)) return "blue";
  if (["مرفوضة", "مرفوض", "موقوف", "غائب", "منتهي الخدمة"].includes(v)) return "muted";
  return "teal";
};

export function CrudTable({
  table,
  title,
  fields,
  addLabel = "إضافة سجل",
  searchKeys,
  orderBy,
  toolbarExtra,
}: {
  table: HrTable;
  title: string;
  fields: FieldDef[];
  addLabel?: string;
  searchKeys?: string[];
  orderBy?: string;
  toolbarExtra?: ReactNode;
}) {
  const { data: rows = [], isLoading, error } = useRows(table, orderBy ? { orderBy } : undefined);
  const save = useSaveRow(table);
  const del = useDeleteRow(table);
  const [draft, setDraft] = useState<Row | null>(null);
  const [term, setTerm] = useState("");

  const tableFields = fields.filter((f) => !f.formOnly);
  const formFields = fields.filter((f) => !f.tableOnly);
  const keys = searchKeys ?? fields.map((f) => f.key);

  const filtered = useMemo(() => {
    const t = term.trim();
    if (!t) return rows;
    return rows.filter((r) => keys.some((k) => String(r[k] ?? "").includes(t)));
  }, [rows, term, keys]);

  const openNew = () => {
    const blank: Row = {};
    for (const f of formFields) blank[f.key] = f.type === "checkbox" ? false : f.type === "number" ? 0 : "";
    setDraft(blank);
  };

  const submit = async () => {
    const missing = formFields.find((f) => f.required && !String(draft?.[f.key] ?? "").trim());
    if (missing) return;
    await save.mutateAsync(draft as Row);
    setDraft(null);
  };

  return (
    <>
      <div
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
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
          {toolbarExtra}
          <div className="relative">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث..."
              className={`${control} h-9 w-48 pe-9`}
            />
            <MaterialIcon
              name="search"
              size={17}
              className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
            />
          </div>
          <Btn icon="add" onClick={openNew}>
            {addLabel}
          </Btn>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-right">
            <thead>
              <tr className="bg-secondary">
                {tableFields.map((f) => (
                  <th
                    key={f.key}
                    className="whitespace-nowrap border-b border-border px-4 py-3 text-[12px] font-extrabold text-secondary-foreground"
                  >
                    {f.label}
                  </th>
                ))}
                <th className="border-b border-border px-4 py-3 text-[12px] font-extrabold text-secondary-foreground">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {(isLoading || error || filtered.length === 0) && (
                <tr>
                  <td
                    colSpan={tableFields.length + 1}
                    className="px-4 py-14 text-center text-sm font-semibold text-muted-foreground"
                  >
                    {isLoading
                      ? "جارٍ تحميل البيانات..."
                      : error
                        ? "تعذر تحميل البيانات"
                        : "لا توجد بيانات"}
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={String(r["id"])}
                  className="border-b border-border transition-colors last:border-0 odd:bg-secondary/35 hover:bg-accent/50"
                >
                  {tableFields.map((f) => (
                    <td key={f.key} className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold">
                      {f.render ? (
                        f.render(r)
                      ) : f.type === "checkbox" ? (
                        r[f.key] ? (
                          <MaterialIcon name="check_circle" size={18} className="text-teal" filled />
                        ) : (
                          <span className="inline-block size-3.5 rounded border border-border bg-secondary" />
                        )
                      ) : f.key === "status" ? (
                        <Chip label={String(r[f.key] ?? "")} tone={statusTone(String(r[f.key]))} />
                      ) : f.type === "number" ? (
                        new Intl.NumberFormat("ar-SA").format(Number(r[f.key] ?? 0))
                      ) : (
                        String(r[f.key] ?? "—")
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex items-center gap-1">
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
                          if (confirm("هل تريد حذف هذا السجل نهائياً؟")) del.mutate(String(r["id"]));
                        }}
                        className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <MaterialIcon name="delete" size={17} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-topbar/50 p-4">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <MaterialIcon name={draft["id"] ? "edit" : "add_circle"} size={20} className="text-primary" filled />
              <h3 className="text-sm font-extrabold">{draft["id"] ? "تعديل سجل" : addLabel}</h3>
              <button onClick={() => setDraft(null)} className="ms-auto text-muted-foreground hover:text-foreground">
                <MaterialIcon name="close" size={20} />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {formFields.map((f) => (
                <label key={f.key} className={f.type === "textarea" ? "sm:col-span-2 xl:col-span-3" : "block"}>
                  <span className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-foreground/80">
                    {f.label}
                    {f.required && <span className="text-destructive">*</span>}
                  </span>
                  {f.type === "select" ? (
                    <select
                      className={control}
                      value={String(draft[f.key] ?? "")}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                    >
                      <option value="">اختر ....</option>
                      {(f.options ?? []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <span className="flex h-10 items-center gap-2 rounded-xl border border-input bg-background px-3">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--primary)]"
                        checked={Boolean(draft[f.key])}
                        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.checked })}
                      />
                      <span className="text-[12px] font-semibold text-muted-foreground">مفعّل</span>
                    </span>
                  ) : f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      className={`${control} h-auto py-2`}
                      value={String(draft[f.key] ?? "")}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                    />
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      className={control}
                      value={String(draft[f.key] ?? "")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                        })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
              <Btn icon="save" onClick={submit}>
                {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </Btn>
              <Btn icon="close" variant="ghost" onClick={() => setDraft(null)}>
                إلغاء
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
