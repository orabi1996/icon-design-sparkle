import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Breadcrumbs, Btn, Field, Fieldset, Input, PageBanner } from "@/components/hr/ui";
import { useRows, useSaveRow, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/staff/add")({
  head: () => ({
    meta: [
      { title: "إضافة موظف | شؤون الموظفين" },
      {
        name: "description",
        content: "إضافة موظف جديد وحفظ بياناته الشخصية والوظيفية والمالية والبنكية مباشرة في قاعدة البيانات.",
      },
      { property: "og:title", content: "إضافة موظف | شؤون الموظفين" },
      { property: "og:description", content: "نموذج إضافة موظف جديد بجميع البيانات المطلوبة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddEmployee,
});

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-ring/25";

const empty: Row = {
  emp_no: "",
  full_name: "",
  national_id: "",
  gender: "ذكر",
  nationality: "سعودي",
  job_title: "",
  department: "",
  branch: "الفرع الرئيسي",
  manager_name: "",
  hire_date: "",
  contract_end: "",
  status: "نشط",
  basic_salary: 0,
  allowances: 0,
  phone: "",
  email: "",
  bank_name: "الراجحي",
  iban: "",
};

function AddEmployee() {
  const navigate = useNavigate();
  const save = useSaveRow("employees");
  const { data: departments = [] } = useRows("departments", { orderBy: "name", ascending: true });
  const [form, setForm] = useState<Row>({ ...empty });

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const Sel = ({ k, options }: { k: string; options: string[] }) => (
    <select className={control} value={String(form[k] ?? "")} onChange={(e) => set(k, e.target.value)}>
      <option value="">اختر ....</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );

  const submit = async () => {
    if (!String(form["emp_no"]).trim() || !String(form["full_name"]).trim()) {
      toast.error("الرقم الوظيفي واسم الموظف مطلوبان");
      return;
    }
    const payload: Row = { ...form };
    for (const k of ["hire_date", "contract_end"]) if (!payload[k]) payload[k] = null;
    await save.mutateAsync(payload);
    setForm({ ...empty });
    navigate({ to: "/staff" });
  };

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["عمليات شؤون الموظفين", "إضافة موظف"]} />
      <PageBanner icon="person_add" title="إضافة موظف" subtitle="أدخل بيانات الموظف الجديد ثم اضغط حفظ" />

      <div className="mt-4 grid gap-4">
        <Fieldset index={1} title="البيانات الشخصية">
          <Field label="الرقم الوظيفي" required>
            <Input value={String(form["emp_no"])} onChange={(e) => set("emp_no", e.target.value)} />
          </Field>
          <Field label="اسم الموظف" required>
            <Input value={String(form["full_name"])} onChange={(e) => set("full_name", e.target.value)} />
          </Field>
          <Field label="رقم الهوية / الإقامة">
            <Input value={String(form["national_id"])} onChange={(e) => set("national_id", e.target.value)} />
          </Field>
          <Field label="الجنس">
            <Sel k="gender" options={["ذكر", "أنثى"]} />
          </Field>
          <Field label="الجنسية">
            <Sel k="nationality" options={["سعودي", "مصري", "هندي", "يمني", "سوداني", "أخرى"]} />
          </Field>
          <Field label="الجوال">
            <Input value={String(form["phone"])} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="البريد الإلكتروني">
            <Input value={String(form["email"])} onChange={(e) => set("email", e.target.value)} />
          </Field>
        </Fieldset>

        <Fieldset index={2} title="البيانات الوظيفية">
          <Field label="المسمى الوظيفي">
            <Input value={String(form["job_title"])} onChange={(e) => set("job_title", e.target.value)} />
          </Field>
          <Field label="القسم">
            <Sel k="department" options={departments.map((d) => String(d["name"]))} />
          </Field>
          <Field label="الفرع">
            <Sel k="branch" options={["الفرع الرئيسي", "فرع جدة", "فرع الدمام"]} />
          </Field>
          <Field label="المدير المباشر">
            <Input value={String(form["manager_name"])} onChange={(e) => set("manager_name", e.target.value)} />
          </Field>
          <Field label="تاريخ التعيين">
            <input type="date" className={control} value={String(form["hire_date"] ?? "")} onChange={(e) => set("hire_date", e.target.value)} />
          </Field>
          <Field label="نهاية العقد">
            <input type="date" className={control} value={String(form["contract_end"] ?? "")} onChange={(e) => set("contract_end", e.target.value)} />
          </Field>
          <Field label="الحالة الوظيفية">
            <Sel k="status" options={["نشط", "موقوف", "منتهي الخدمة"]} />
          </Field>
        </Fieldset>

        <Fieldset index={3} title="البيانات المالية والبنكية">
          <Field label="الراتب الأساسي">
            <Input type="number" value={String(form["basic_salary"])} onChange={(e) => set("basic_salary", Number(e.target.value))} />
          </Field>
          <Field label="إجمالي البدلات">
            <Input type="number" value={String(form["allowances"])} onChange={(e) => set("allowances", Number(e.target.value))} />
          </Field>
          <Field label="البنك">
            <Sel k="bank_name" options={["الراجحي", "الأهلي", "الرياض", "ساب", "الإنماء", "البلاد"]} />
          </Field>
          <Field label="الآيبان">
            <Input value={String(form["iban"])} onChange={(e) => set("iban", e.target.value)} />
          </Field>
        </Fieldset>

        <div className="flex flex-wrap gap-2">
          <Btn icon="save" onClick={submit}>
            {save.isPending ? "جارٍ الحفظ..." : "حفظ الموظف"}
          </Btn>
          <Btn icon="restart_alt" variant="ghost" onClick={() => setForm({ ...empty })}>
            تفريغ النموذج
          </Btn>
        </div>
      </div>
    </div>
  );
}
