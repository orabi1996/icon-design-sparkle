import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  DataTable,
  Field,
  Input,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/regulations/permits")({
  head: () => ({
    meta: [
      { title: "تهيئة لائحة الأذونات | اللوائح" },
      {
        name: "description",
        content:
          "إدارة لائحة الأذونات: أنواع الأذونات، عدد الساعات المسموحة، عدد الساعات في الشهر، وعدد مرات الإذن شهرياً مع دمج أذونات التأخير والانصراف المبكر.",
      },
      { property: "og:title", content: "تهيئة لائحة الأذونات | اللوائح" },
      { property: "og:description", content: "أنواع الأذونات والحدود الشهرية للساعات والمرات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Permits,
});

const rows = [
  { code: "١", name: "بدون بصمه", en: "no", by: "بدون بصمة", type: "شهري", hours: "٠", month: "٠", times: "٣" },
  { code: "٢", name: "اذن تأخير", en: "asd", by: "تأخير", type: "شهري", hours: "١", month: "٤", times: "٣" },
  { code: "٣", name: "اذن انصراف مبكر", en: "axc", by: "الانصراف المبكر", type: "شهري", hours: "١", month: "٤", times: "٣" },
  { code: "٤", name: "اذن جديد", en: "row", by: "تأخير", type: "شهري", hours: "٢", month: "٢٠", times: "٥" },
];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-raised)" }}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-extrabold text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="ms-auto grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <MaterialIcon name="close" size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto bg-secondary/40 p-5">{children}</div>
      </div>
    </div>
  );
}

function Permits() {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("شهري");

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "إعدادات متنوعة", "تهيئة لائحة الأذونات"]} />
      <PageBanner
        icon="event_available"
        title="تهيئة لائحة الأذونات"
        subtitle="أنواع الأذونات والحدود المسموحة للساعات والمرات"
        actions={
          <Btn icon="download" variant="onDark">
            تصدير
          </Btn>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Btn icon="add" variant="teal" onClick={() => setOpen(true)}>
          اضافة إذن جديد
        </Btn>
      </div>

      <div
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <TableToolbar title="لائحة الأذونات" />
        <DataTable
          columns={[
            "كود السلسله",
            "الاسم",
            "الاسم بالانجليزيه",
            "تهيئة اللجنة حسب",
            "نوع الاذن",
            "عدد الساعات",
            "عدد الساعات في الشهر",
            "عدد مرات الاذن شهريا",
            "تهيئة",
          ]}
          rows={rows.map((r) => ({
            "كود السلسله": r.code,
            الاسم: <span className="font-extrabold text-primary">{r.name}</span>,
            "الاسم بالانجليزيه": r.en,
            "تهيئة اللجنة حسب": r.by,
            "نوع الاذن": r.type,
            "عدد الساعات": r.hours,
            "عدد الساعات في الشهر": r.month,
            "عدد مرات الاذن شهريا": r.times,
            تهيئة: (
              <button className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90">
                <MaterialIcon name="tune" size={16} />
                تهيئة
              </button>
            ),
          }))}
        />
        <Pager page={1} pages={1} total={rows.length} />
      </div>

      {open && (
        <Modal title="لائحة الأذونات" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Field label="الاسم" required>
              <Input placeholder="اسم الإذن" />
            </Field>
            <Field label="الاسم بالانجليزيه">
              <Input placeholder="Permit name" />
            </Field>
            <Field label="النوع" required>
              <Select options={["اختر ....", "تأخير", "الانصراف المبكر", "بدون بصمة", "استئذان"]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="عدد الساعات">
                <Input type="number" defaultValue={0} />
              </Field>
              <Field label="عدد الساعات في الشهر">
                <Input type="number" defaultValue={0} />
              </Field>
              <Field label="عدد مرات الاذن شهريا">
                <Input type="number" defaultValue={0} />
              </Field>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
              {["شهري", "سنوي"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-bold transition-colors ${
                    period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <MaterialIcon name={period === p ? "radio_button_checked" : "radio_button_unchecked"} size={16} />
                  {p}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[12.5px] font-bold">
              <input type="checkbox" className="size-4 accent-[var(--primary)]" />
              دمج أذونات التأخير والانصراف المبكر
            </label>
          </div>
          <div className="mt-5 flex justify-center gap-2">
            <Btn icon="add" variant="teal" onClick={() => setOpen(false)}>
              اضافة
            </Btn>
            <Btn variant="ghost" onClick={() => setOpen(false)}>
              إلغاء
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
