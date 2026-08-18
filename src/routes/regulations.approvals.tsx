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

export const Route = createFileRoute("/regulations/approvals")({
  head: () => ({
    meta: [
      { title: "تهيئة سلاسل الموافقات | اللوائح" },
      {
        name: "description",
        content:
          "إنشاء سلاسل الموافقات وتهيئة اللجان والمدى الوظيفي، وربط سلاسل الموافقات بأنواع الطلبات مثل الأذونات والمساءلات.",
      },
      { property: "og:title", content: "تهيئة سلاسل الموافقات | اللوائح" },
      {
        property: "og:description",
        content: "سلاسل الموافقات وربطها بأنواع الطلبات داخل نظام الموارد البشرية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Approvals,
});

const tabs = [
  { key: "chains", label: "تهيئة سلاسل الموافقات", icon: "account_tree" },
  { key: "links", label: "ربط تهيئة الموافقات", icon: "link" },
];

const chains = [
  {
    code: "١",
    name: "موارد بشريه",
    en: "HR",
    committee: "الهيكلية",
    scope: "موظف",
    withManager: false,
    note: "—",
    active: true,
  },
  {
    code: "٣",
    name: "الاعتماد",
    en: "deal",
    committee: "الهيكلية",
    scope: "موظف",
    withManager: true,
    note: "—",
    active: false,
  },
];

const links = [
  { req: "الأذونات", type: "اذن تأخير" },
  { req: "الأذونات", type: "اذن انصراف مبكر" },
  { req: "الأذونات", type: "اذن استئذان" },
  { req: "المساءلات", type: "مساءلة إدارية" },
];

function IconBtn({ icon, tone = "primary" }: { icon: string; tone?: "primary" | "teal" }) {
  const tones = {
    primary: "bg-primary/10 text-primary hover:bg-primary/20",
    teal: "bg-teal/12 text-teal hover:bg-teal/20",
  } as const;
  return (
    <button className={`grid size-8 place-items-center rounded-lg transition-colors ${tones[icon ? tone : tone]}`}>
      <MaterialIcon name={icon} size={17} />
    </button>
  );
}

function Mark({ on }: { on: boolean }) {
  return on ? (
    <MaterialIcon name="check_circle" size={18} className="text-teal" filled />
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        on ? "bg-teal/12 text-teal" : "bg-secondary text-muted-foreground"
      }`}
    >
      <span className={`size-2 rounded-full ${on ? "bg-teal" : "bg-muted-foreground"}`} />
      {on ? "مفعل" : "موقوف"}
    </span>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
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
        <div className="bg-secondary/40 p-5">{children}</div>
      </div>
    </div>
  );
}

function Approvals() {
  const [tab, setTab] = useState("chains");
  const [chainOpen, setChainOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "إعدادات متنوعة", "تهيئة سلاسل الموافقات"]} />
      <PageBanner
        icon="account_tree"
        title="تهيئة سلاسل الموافقات"
        subtitle="إنشاء سلاسل الموافقات وربطها بأنواع الطلبات"
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

      <div className="mt-4 space-y-4">
        {tab === "chains" && (
          <>
            <div className="flex flex-wrap gap-2">
              <Btn icon="add" variant="teal" onClick={() => setChainOpen(true)}>
                اضافة سلسلة موافقات
              </Btn>
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="سلاسل الموافقات" />
              <DataTable
                columns={[
                  "كود السلسلة",
                  "الاسم",
                  "الاسم بالإنجليزيه",
                  "تهيئة اللجنة حسب",
                  "تهيئة المدى حسب",
                  "اضافة المدير المباشر للجنة الاعتمادات",
                  "ملاحظات",
                  "تفعيل - ايقاف",
                  "تهيئة",
                  "تعديل",
                ]}
                rows={chains.map((c) => ({
                  "كود السلسلة": c.code,
                  الاسم: <span className="font-extrabold text-primary">{c.name}</span>,
                  "الاسم بالإنجليزيه": c.en,
                  "تهيئة اللجنة حسب": c.committee,
                  "تهيئة المدى حسب": c.scope,
                  "اضافة المدير المباشر للجنة الاعتمادات": <Mark on={c.withManager} />,
                  ملاحظات: c.note,
                  "تفعيل - ايقاف": <Toggle on={c.active} />,
                  تهيئة: (
                    <button className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90">
                      <MaterialIcon name="tune" size={16} />
                      تهيئة اللجنة
                    </button>
                  ),
                  تعديل: <IconBtn icon="edit" />,
                }))}
              />
              <Pager page={1} pages={1} total={chains.length} />
            </div>
          </>
        )}

        {tab === "links" && (
          <>
            <div className="flex flex-wrap gap-2">
              <Btn icon="add" variant="teal" onClick={() => setLinkOpen(true)}>
                اضافة ربط سلسلة
              </Btn>
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <TableToolbar title="ربط تهيئة الموافقات" />
              <DataTable
                columns={["الطلبات", "نوع الطلبات", "تفاصيل"]}
                rows={links.map((l) => ({
                  الطلبات: <span className="font-extrabold text-primary">{l.req}</span>,
                  "نوع الطلبات": l.type,
                  تفاصيل: (
                    <button className="flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-[12px] font-bold text-primary transition-colors hover:bg-accent">
                      <MaterialIcon name="description" size={16} />
                      عرض التفاصيل
                    </button>
                  ),
                }))}
              />
              <Pager page={1} pages={1} total={links.length} />
            </div>
          </>
        )}
      </div>

      {chainOpen && (
        <Modal title="اضافة سلسلة الموافقات" onClose={() => setChainOpen(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم" required>
              <Input placeholder="اسم السلسلة" />
            </Field>
            <Field label="الاسم بالانجليزيه">
              <Input placeholder="Chain name" />
            </Field>
            <Field label="تهيئة اللجنة حسب">
              <Select options={["الهيكلية", "الفرع", "الإدارة"]} />
            </Field>
            <Field label="تهيئة المدى حسب">
              <Select options={["موظف", "فئة وظيفية", "درجة وظيفية"]} />
            </Field>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[12.5px] font-bold">
              <input type="checkbox" className="size-4 accent-[var(--primary)]" />
              اضافة المدير المباشر للجنة الاعتمادات
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[12.5px] font-bold">
              <input type="checkbox" defaultChecked className="size-4 accent-[var(--primary)]" />
              مفعل
            </label>
          </div>
          <div className="mt-5 flex justify-center gap-2">
            <Btn icon="add" variant="teal" onClick={() => setChainOpen(false)}>
              اضافة
            </Btn>
            <Btn variant="ghost" onClick={() => setChainOpen(false)}>
              إلغاء
            </Btn>
          </div>
        </Modal>
      )}

      {linkOpen && (
        <Modal title="اضافة سلسلة الموافقات" onClose={() => setLinkOpen(false)}>
          <div className="space-y-4">
            <Field label="الطلبات" required>
              <Select options={["اختر ....", "الأذونات", "المساءلات", "الإجازات", "السلف"]} />
            </Field>
            <Field label="تفاصيل الطلبات" required>
              <Select options={["اختر ....", "اذن تأخير", "اذن انصراف مبكر", "اذن استئذان"]} />
            </Field>
            <Field label="تهيئه سلاسل الموافقات" required>
              <Select options={["اختر ....", "موارد بشريه", "الاعتماد"]} />
            </Field>
          </div>
          <div className="mt-5 flex justify-center gap-2">
            <Btn icon="add" variant="teal" onClick={() => setLinkOpen(false)}>
              اضافة
            </Btn>
            <Btn variant="ghost" onClick={() => setLinkOpen(false)}>
              إلغاء
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
