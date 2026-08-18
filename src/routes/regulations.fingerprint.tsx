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

export const Route = createFileRoute("/regulations/fingerprint")({
  head: () => ({
    meta: [
      { title: "لائحة خصومات البصمة | اللوائح" },
      {
        name: "description",
        content:
          "لائحة خصومات البصمة: لائحة الجزاءات، لائحة الغياب، لائحة التأخير، لائحة البصمة، ولائحة الانصراف المبكر مع نوافذ الإضافة والتفاصيل.",
      },
      { property: "og:title", content: "لائحة خصومات البصمة | اللوائح" },
      { property: "og:description", content: "الجزاءات والغياب والتأخير والبصمة والانصراف المبكر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fingerprint,
});

type TabKey = "penalties" | "absence" | "late" | "print" | "early";

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: "penalties", label: "لائحة الجزاءات", icon: "gavel" },
  { key: "absence", label: "لائحة الغياب", icon: "event_busy" },
  { key: "late", label: "لائحة التأخير", icon: "schedule" },
  { key: "print", label: "لائحة البصمه", icon: "fingerprint" },
  { key: "early", label: "لائحة الانصراف المبكر", icon: "logout" },
];

const penalties = [
  { name: "جزاء تاخير ٦٠", en: "", job: "أجير", type: "شهري", deduct: false, on: true },
  { name: "٥٠٠", en: "", job: "H.M", type: "شهري", deduct: true, on: true },
  { name: "تقصير في العمل", en: "", job: "كل الوظائف", type: "سنوي", deduct: true, on: true },
  { name: "تست", en: "", job: "كل الوظائف", type: "شهري", deduct: false, on: false },
  { name: "جزاء تست المساءلات", en: "", job: "كل الوظائف", type: "شهري", deduct: true, on: false },
  { name: "تأخير بدون إذن مسبق", en: "", job: "كل الوظائف", type: "شهري", deduct: false, on: true },
  { name: "الأكل الجماعي", en: "", job: "كل الوظائف", type: "شهري", deduct: true, on: true },
  { name: "جزاء جديد تست", en: "", job: "كل الوظائف", type: "شهري", deduct: false, on: true },
  { name: "جزاء خصم يوم غياب", en: "abc", job: "كل الوظائف", type: "شهري", deduct: true, on: true },
  { name: "جزاء مساعله غياب للموظف", en: "", job: "كل الوظائف", type: "شهري", deduct: true, on: true },
];

const absence = [
  { dept: "الاداره العامه", days: "١", val: "١", kind: "يوم", pen: "تواجد الموظف في غير مكان العمل دون مبرر", def: true },
  { dept: "الكل", days: "١", val: "١", kind: "يوم", pen: "غياب مكرر و", def: true },
  { dept: "الكل", days: "٢", val: "٢٧٥", kind: "نسبة من اليوم", pen: "جزاء جديد تست", def: true },
  { dept: "الكل", days: "٣", val: "١", kind: "يوم", pen: "", def: true },
  { dept: "إدارة المجمع", days: "٤", val: "١", kind: "نسبة من اليوم", pen: "", def: true },
  { dept: "الكل", days: "٥", val: "٥", kind: "يوم", pen: "", def: true },
  { dept: "الكل", days: "٦", val: "١", kind: "يوم", pen: "", def: false },
  { dept: "الكل", days: "٧", val: "١", kind: "مقطوع", pen: "", def: false },
];

const late = [
  { cat: "مقيم تأمينات", from: "٢٠١", to: "١٠٠٠", val: "١", kind: "يوم", pen: "", def: true },
  { cat: "الفئة الوظيفية", from: "١", to: "١٥", val: "١", kind: "ساعة", pen: "", def: false },
  { cat: "مقيم خارج التأمينات", from: "١٠١", to: "٢٠٠", val: "١٠", kind: "نسبة من اليوم", pen: "", def: false },
  { cat: "مقيم خارج التأمينات", from: "١٦", to: "١٠٠", val: "١", kind: "دقيقة", pen: "", def: false },
  { cat: "مقيم بدون تأمينات", from: "١٠٠", to: "١٢٠", val: "٢٠٠", kind: "دقيقة", pen: "جزاء مساعله غياب للموظف", def: true },
];

const print = [
  { from: "١", to: "٣٠", val: "٥٠٠", kind: "مقطوع", pen: "", def: true },
  { from: "٣١", to: "٣٥", val: "٥٠٠", kind: "دقيقة", pen: "", def: true },
];

const early = [
  { job: "الكل", from: "٦١", to: "٣٠٠٠٠", val: "١٠", kind: "نسبة من الراتب", pen: "", def: true },
  { job: "الكل", from: "١", to: "١٥", val: "١٠", kind: "يوم", pen: "", def: false },
  { job: "الكل", from: "١٦", to: "٦٠", val: "٢٥", kind: "نسبة من اليوم", pen: "جزاء انصراف مبكر", def: false },
];

const valueTypes = ["اختر ....", "مقطوع", "دقيقة", "ساعة", "يوم", "نسبة من اليوم", "نسبة من الراتب"];
const jobs = ["اختر ....", "الكل", "كل الوظائف", "أجير", "مقيم تأمينات", "مقيم خارج التأمينات", "مقيم بدون تأمينات"];
const depts = ["اختر ....", "الكل", "الاداره العامه", "إدارة المجمع"];
const penaltyNames = ["اختر ....", "جزاء انصراف مبكر", "جزاء خصم يوم غياب", "جزاء مساعله غياب للموظف"];

function IconBtn({ icon, tone = "primary" }: { icon: string; tone?: "primary" | "danger" }) {
  return (
    <button
      className={`grid size-8 place-items-center rounded-lg transition-colors ${
        tone === "danger"
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      <MaterialIcon name={icon} size={17} />
    </button>
  );
}

function Tick({ on }: { on: boolean }) {
  return on ? (
    <MaterialIcon name="check" size={18} className="text-teal" />
  ) : (
    <span className="inline-block size-3.5 rounded border border-border bg-secondary" />
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold ${
        on ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
      }`}
    >
      <span
        className={`grid h-4 w-7 items-center rounded-full px-0.5 ${on ? "bg-primary" : "bg-muted-foreground/40"}`}
      >
        <span className={`size-3 rounded-full bg-card ${on ? "translate-x-0" : "translate-x-3"}`} />
      </span>
      {on ? "مفعل" : "ايقاف"}
    </span>
  );
}

function Modal({
  title,
  onClose,
  submit,
  children,
}: {
  title: string;
  onClose: () => void;
  submit: string;
  children: React.ReactNode;
}) {
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
        <div className="max-h-[70vh] space-y-4 overflow-y-auto bg-secondary/40 p-5">{children}</div>
        <div className="flex justify-center gap-2 border-t border-border px-5 py-4">
          <Btn icon="add" variant="teal" onClick={onClose}>
            {submit}
          </Btn>
          <Btn variant="ghost" onClick={onClose}>
            إلغاء
          </Btn>
        </div>
      </div>
    </div>
  );
}

function PenaltyLink() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="اضافة جزاء">
        <Select options={penaltyNames} />
      </Field>
      <Field label="استحقاق افتراضي">
        <Select options={["اختر ....", "بدل انتقال", "بدل سكن"]} />
      </Field>
    </div>
  );
}

function Fingerprint() {
  const [tab, setTab] = useState<TabKey>("penalties");
  const [open, setOpen] = useState<TabKey | null>(null);

  const addLabels: Record<TabKey, string> = {
    penalties: "اضافة جزاء",
    absence: "اضافة الغياب",
    late: "اضافة التأخير",
    print: "اضافة لائحة البصمة",
    early: "اضافة لائحة الانصراف المبكر",
  };

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "لائحة خصومات البصمة"]} />
      <PageBanner
        icon="fingerprint"
        title="لائحة خصومات البصمة"
        subtitle="الجزاءات والغياب والتأخير والبصمة والانصراف المبكر"
        actions={
          <Btn icon="download" variant="onDark">
            تصدير
          </Btn>
        }
      />

      <div
        className="mt-4 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-2"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {tabs.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-bold transition-colors ${
                on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <MaterialIcon name={t.icon} size={18} filled={on} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Btn icon="add" variant="teal" onClick={() => setOpen(tab)}>
          {addLabels[tab]}
        </Btn>
      </div>

      <div
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {tab === "penalties" && (
          <>
            <TableToolbar title="لائحة الجزاءات" />
            <DataTable
              columns={[
                "الجزاء",
                "الاسم بالانجليزيه",
                "الوظيفه",
                "خصم استحقاقات افتراضية",
                "نوع الجزاء",
                "تعديل",
                "اضافة تفاصيل",
                "تفعيل - ايقاف",
              ]}
              rows={penalties.map((r) => ({
                الجزاء: <span className="font-extrabold text-primary">{r.name}</span>,
                "الاسم بالانجليزيه": r.en || "—",
                الوظيفه: r.job,
                "خصم استحقاقات افتراضية": <Tick on={r.deduct} />,
                "نوع الجزاء": r.type,
                تعديل: <IconBtn icon="edit" />,
                "اضافة تفاصيل": (
                  <button className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90">
                    <MaterialIcon name="add" size={16} />
                    اضافة تفاصيل
                  </button>
                ),
                "تفعيل - ايقاف": <Toggle on={r.on} />,
              }))}
            />
            <Pager page={1} pages={9} total={83} />
          </>
        )}

        {tab === "absence" && (
          <>
            <TableToolbar title="لائحة الغياب" />
            <DataTable
              columns={["القسم", "فى حالة الغياب يوم", "قيمة الخصم", "نوع الخصم", "الجزاء", "استحقاق افتراضي", "تعديل"]}
              rows={absence.map((r) => ({
                القسم: <span className="font-extrabold text-primary">{r.dept}</span>,
                "فى حالة الغياب يوم": r.days,
                "قيمة الخصم": r.val,
                "نوع الخصم": r.kind,
                الجزاء: r.pen || "—",
                "استحقاق افتراضي": <Tick on={r.def} />,
                تعديل: <IconBtn icon="edit" />,
              }))}
            />
            <Pager page={1} pages={1} total={absence.length} />
          </>
        )}

        {tab === "late" && (
          <>
            <TableToolbar title="لائحة التأخير" />
            <DataTable
              columns={["الفئة الوظيفية", "من", "الى", "القيمة", "نوع القيمه", "الجزاء", "استحقاق افتراضي", "تعديل", "حذف"]}
              rows={late.map((r) => ({
                "الفئة الوظيفية": <span className="font-extrabold text-primary">{r.cat}</span>,
                من: r.from,
                الى: r.to,
                القيمة: r.val,
                "نوع القيمه": r.kind,
                الجزاء: r.pen || "—",
                "استحقاق افتراضي": <Tick on={r.def} />,
                تعديل: <IconBtn icon="edit" />,
                حذف: <IconBtn icon="delete" tone="danger" />,
              }))}
            />
            <Pager page={1} pages={1} total={late.length} />
          </>
        )}

        {tab === "print" && (
          <>
            <TableToolbar title="لائحة البصمه" />
            <DataTable
              columns={["من", "الى", "القيمة", "نوع القيمه", "الجزاء", "استحقاق افتراضي", "تعديل", "حذف"]}
              rows={print.map((r) => ({
                من: <span className="font-extrabold text-primary">{r.from}</span>,
                الى: r.to,
                القيمة: r.val,
                "نوع القيمه": r.kind,
                الجزاء: r.pen || "—",
                "استحقاق افتراضي": <Tick on={r.def} />,
                تعديل: <IconBtn icon="edit" />,
                حذف: <IconBtn icon="delete" tone="danger" />,
              }))}
            />
            <Pager page={1} pages={1} total={print.length} />
          </>
        )}

        {tab === "early" && (
          <>
            <TableToolbar title="لائحة الانصراف المبكر" />
            <DataTable
              columns={["الوظيفه", "من", "الى", "القيمة", "نوع القيمه", "الجزاء", "استحقاق افتراضي", "تعديل"]}
              rows={early.map((r) => ({
                الوظيفه: <span className="font-extrabold text-primary">{r.job}</span>,
                من: r.from,
                الى: r.to,
                القيمة: r.val,
                "نوع القيمه": r.kind,
                الجزاء: r.pen || "—",
                "استحقاق افتراضي": <Tick on={r.def} />,
                تعديل: <IconBtn icon="edit" />,
              }))}
            />
            <Pager page={1} pages={1} total={early.length} />
          </>
        )}
      </div>

      {open === "penalties" && (
        <Modal title="اضافة جزاء" submit="اضافة جزاء" onClose={() => setOpen(null)}>
          <Field label="الجزاء" required>
            <Input placeholder="اسم الجزاء" />
          </Field>
          <Field label="الجزاء الاسم بالانجليزيه">
            <Input placeholder="Penalty name" />
          </Field>
          <Field label="الوظيفه" required>
            <Select options={jobs} />
          </Field>
          <Field label="نوع الجزاء" required>
            <Select options={["اختر ....", "شهري", "سنوي"]} />
          </Field>
          <Field label="استحقاق افتراضي">
            <Select options={["اختر ....", "بدل انتقال", "بدل سكن"]} />
          </Field>
        </Modal>
      )}

      {open === "absence" && (
        <Modal title="اضافة الغياب" submit="اضافة الغياب" onClose={() => setOpen(null)}>
          <Field label="القسم" required>
            <Select options={depts} />
          </Field>
          <Field label="فى حالة الغياب يوم">
            <Input type="number" defaultValue={0} />
          </Field>
          <Field label="قيمة الخصم">
            <Input type="number" defaultValue={0} />
          </Field>
          <Field label="نوع الخصم" required>
            <Select options={valueTypes} />
          </Field>
          <PenaltyLink />
        </Modal>
      )}

      {open === "late" && (
        <Modal title="اضافة التأخير" submit="اضافة التأخير" onClose={() => setOpen(null)}>
          <Field label="الفئة الوظيفية" required>
            <Select options={jobs} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="من">
              <Input type="number" defaultValue={0} />
            </Field>
            <Field label="الى">
              <Input type="number" defaultValue={0} />
            </Field>
          </div>
          <Field label="القيمة">
            <Input type="number" defaultValue={0} />
          </Field>
          <Field label="نوع القيمه" required>
            <Select options={valueTypes} />
          </Field>
          <PenaltyLink />
        </Modal>
      )}

      {open === "print" && (
        <Modal title="اضافة لائحة البصمة" submit="اضافة لائحة البصمة" onClose={() => setOpen(null)}>
          <Field label="اسم المجموعة" required>
            <Select options={["اختر ....", "مجموعة الدوام الصباحي", "مجموعة الدوام المسائي"]} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="من">
              <Input type="number" defaultValue={0} />
            </Field>
            <Field label="الى">
              <Input type="number" defaultValue={0} />
            </Field>
          </div>
          <Field label="القيمة">
            <Input type="number" defaultValue={0} />
          </Field>
          <Field label="نوع القيمه" required>
            <Select options={valueTypes} />
          </Field>
          <PenaltyLink />
        </Modal>
      )}

      {open === "early" && (
        <Modal title="اضافة لائحة الانصراف المبكر" submit="اضافة لائحة الانصراف المبكر" onClose={() => setOpen(null)}>
          <Field label="الوظيفه" required>
            <Select options={jobs} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="من">
              <Input type="number" defaultValue={0} />
            </Field>
            <Field label="الى">
              <Input type="number" defaultValue={0} />
            </Field>
          </div>
          <Field label="القيمة">
            <Input type="number" defaultValue={0} />
          </Field>
          <Field label="نوع القيمه" required>
            <Select options={valueTypes} />
          </Field>
          <PenaltyLink />
        </Modal>
      )}
    </div>
  );
}
