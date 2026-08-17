import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Card,
  Check,
  DateInput,
  Field,
  Fieldset,
  PageBanner,
  Select,
} from "@/components/hr/ui";

export const Route = createFileRoute("/staff/add")({
  head: () => ({
    meta: [
      { title: "إضافة موظف جديد | نموذج البيانات الكامل" },
      {
        name: "description",
        content: "نموذج إضافة موظف على خمس خطوات: البيانات الشخصية، الوظيفية، الاتصال، المالية، والعقود.",
      },
      { property: "og:title", content: "إضافة موظف جديد | نموذج البيانات الكامل" },
      { property: "og:description", content: "خمس خطوات لاستكمال ملف الموظف الجديد بالكامل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddEmployee,
});

const steps = [
  { label: "البيانات الشخصية", icon: "person" },
  { label: "البيانات الوظيفية", icon: "work" },
  { label: "بيانات الاتصال", icon: "contact_phone" },
  { label: "البيانات المالية", icon: "payments" },
  { label: "العقود", icon: "description" },
];

function AddEmployee() {
  const [step, setStep] = useState(0);

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["شؤون الموظفين", "إضافة موظف"]} />
      <PageBanner
        icon="person_add"
        title="إضافة موظف جديد"
        subtitle={`الخطوة ${step + 1} من ${steps.length} · ${steps[step]?.label ?? ""}`}
        actions={
          <Btn icon="save" variant="onDark">
            حفظ كمسودة
          </Btn>
        }
      />

      {/* Stepper */}
      <div
        className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card p-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <ol className="flex min-w-max items-center gap-2">
          {steps.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s.label} className="flex items-center gap-2">
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-colors ${
                    current
                      ? "bg-primary text-primary-foreground"
                      : done
                        ? "bg-teal/12 text-teal"
                        : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-lg text-[11px] ${
                      current ? "bg-white/20" : done ? "bg-teal/20" : "bg-card"
                    }`}
                  >
                    {done ? <MaterialIcon name="check" size={14} /> : i + 1}
                  </span>
                  <MaterialIcon name={s.icon} size={17} filled={current} />
                  {s.label}
                </button>
                {i < steps.length - 1 && (
                  <span className={`h-0.5 w-6 rounded-full ${i < step ? "bg-teal" : "bg-border"}`} />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-4 space-y-4">
        {step === 0 && <PersonalStep />}
        {step === 1 && <JobStep />}
        {step === 2 && <ContactStep />}
        {step === 3 && <FinanceStep />}
        {step === 4 && <ContractStep />}
      </div>

      <div
        className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <Btn icon="arrow_forward" variant="ghost" onClick={() => setStep(Math.max(0, step - 1))}>
          السابق
        </Btn>
        <span className="text-[12px] font-bold text-muted-foreground">
          {step + 1} / {steps.length}
        </span>
        <div className="ms-auto flex gap-2">
          <Btn icon="close" variant="soft">
            إلغاء
          </Btn>
          {step < steps.length - 1 ? (
            <Btn icon="arrow_back" onClick={() => setStep(step + 1)}>
              التالي
            </Btn>
          ) : (
            <Btn icon="check_circle" variant="teal">
              حفظ الموظف
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonalStep() {
  return (
    <Card title="البيانات الشخصية" icon="person">
      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-primary/35 bg-secondary/50 p-6">
          <span className="grid size-20 place-items-center rounded-full bg-primary/10 text-primary">
            <MaterialIcon name="add_a_photo" size={34} />
          </span>
          <p className="text-center text-[12px] font-bold text-muted-foreground">
            صورة الموظف
            <br />
            <span className="font-semibold">PNG / JPG · أقصى ٢ ميجا</span>
          </p>
          <Btn icon="upload" variant="ghost">
            اختيار صورة
          </Btn>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="الاسم بالعربي" required />
          <Field label="الاسم بالإنجليزي" required />
          <Field label="رقم الهوية / الإقامة" required />
          <Field label="تاريخ الميلاد">
            <DateInput />
          </Field>
          <Field label="تاريخ انتهاء الهوية">
            <DateInput />
          </Field>
          <Field label="الجنس">
            <Select options={["ذكر", "أنثى"]} />
          </Field>
          <Field label="الجنسية" required>
            <Select options={["سعودي", "مصري", "سوداني", "هندي", "أخرى"]} />
          </Field>
          <Field label="الحالة الاجتماعية">
            <Select options={["أعزب", "متزوج", "مطلق"]} />
          </Field>
          <Field label="الديانة">
            <Select options={["مسلم", "غير ذلك"]} />
          </Field>
          <Field label="عدد المرافقين" />
          <Field label="مكان الميلاد" />
          <Field label="المؤهل الدراسي">
            <Select options={["ثانوي", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه"]} />
          </Field>
        </div>
      </div>
    </Card>
  );
}

function JobStep() {
  return (
    <>
      <Fieldset index={1} title="إعدادات الحضور والانصراف">
        <Field label="مجموعة الدوام">
          <Select options={["دوام إداري", "دوام متغير", "ورديات"]} />
        </Field>
        <Field label="طريقة تسجيل الحضور">
          <Select options={["بصمة", "تطبيق الجوال", "يدوي"]} />
        </Field>
        <Field label="رقم البصمة" />
        <Field label="أيام الراحة">
          <Select options={["الجمعة والسبت", "الخميس والجمعة"]} />
        </Field>
      </Fieldset>
      <Fieldset index={2} title="البيانات الوظيفية">
        <Field label="الرقم الوظيفي" required />
        <Field label="الفرع" required>
          <Select options={["الرئيسي", "جدة", "الدمام"]} />
        </Field>
        <Field label="القسم" required>
          <Select options={["التسويق", "تقنية المعلومات", "المالية", "الموارد البشرية", "العمليات"]} />
        </Field>
        <Field label="المسمى الوظيفي" required />
        <Field label="المدير المباشر">
          <Select options={["مدير النظام", "خالد الزهراني", "نورة القحطاني"]} />
        </Field>
        <Field label="تاريخ التعيين" required>
          <DateInput />
        </Field>
        <Field label="نوع التوظيف">
          <Select options={["دوام كامل", "دوام جزئي", "عقد مؤقت"]} />
        </Field>
        <Field label="الكفيل">
          <Select options={["الشركة", "أخرى"]} />
        </Field>
      </Fieldset>
      <Fieldset index={3} title="الخبرات والمؤهلات">
        <Field label="سنوات الخبرة" />
        <Field label="جهة العمل السابقة" />
        <Field label="المهارات" />
        <Field label="رقم العضوية المهنية" />
      </Fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <Check label="خاضع للتأمينات الاجتماعية" defaultChecked />
        <Check label="مشمول بالتأمين الطبي" defaultChecked hint="الشركة تتحمل ٧٠٪" />
        <Check label="يستحق بدل نقل" />
      </div>
    </>
  );
}

function ContactStep() {
  return (
    <>
      <Fieldset index={1} title="أرقام التواصل">
        <Field label="رقم الجوال" required />
        <Field label="رقم بديل" />
        <Field label="هاتف العمل" />
        <Field label="الرقم الداخلي" />
      </Fieldset>
      <Fieldset index={2} title="العنوان">
        <Field label="الدولة">
          <Select options={["السعودية", "مصر", "الأردن"]} />
        </Field>
        <Field label="المدينة" />
        <Field label="الحي" />
        <Field label="الرمز البريدي" />
        <Field label="العنوان الوطني" />
        <Field label="صندوق البريد" />
      </Fieldset>
      <Fieldset index={3} title="البريد الإلكتروني وجهة الطوارئ">
        <Field label="البريد الإلكتروني للعمل" required />
        <Field label="البريد الشخصي" />
        <Field label="اسم شخص للطوارئ" />
        <Field label="جوال شخص الطوارئ" />
      </Fieldset>
    </>
  );
}

function FinanceStep() {
  return (
    <>
      <Fieldset index={1} title="الراتب والمستحقات">
        <Field label="الراتب الأساسي" required />
        <Field label="بدل السكن" />
        <Field label="بدل النقل" />
        <Field label="بدلات أخرى" />
        <Field label="الفئة الوظيفية">
          <Select options={["الفئة الأولى", "الفئة الثانية", "الفئة الثالثة"]} />
        </Field>
        <Field label="الدرجة">
          <Select options={["أ", "ب", "ج"]} />
        </Field>
        <Field label="طريقة الصرف">
          <Select options={["تحويل بنكي", "نقدي", "شيك"]} />
        </Field>
        <Field label="العملة">
          <Select options={["ريال سعودي", "دولار"]} />
        </Field>
      </Fieldset>
      <Fieldset index={2} title="البيانات البنكية">
        <Field label="البنك">
          <Select options={["الراجحي", "الأهلي", "الرياض", "الإنماء"]} />
        </Field>
        <Field label="رقم الحساب" />
        <Field label="رقم الآيبان" required />
        <Field label="اسم صاحب الحساب" />
      </Fieldset>
    </>
  );
}

function ContractStep() {
  return (
    <>
      <Fieldset index={1} title="بيانات العقد">
        <Field label="رقم العقد" required />
        <Field label="نوع العقد">
          <Select options={["محدد المدة", "غير محدد المدة"]} />
        </Field>
        <Field label="تاريخ بداية العقد" required>
          <DateInput />
        </Field>
        <Field label="تاريخ نهاية العقد">
          <DateInput />
        </Field>
        <Field label="مدة التجربة (يوم)" />
        <Field label="فترة الإشعار (يوم)" />
      </Fieldset>
      <Fieldset index={2} title="ساعات العمل والإجازات">
        <Field label="ساعات العمل اليومية" />
        <Field label="أيام العمل الأسبوعية" />
        <Field label="رصيد الإجازة السنوية" />
        <Field label="نوع تذكرة السفر">
          <Select options={["سنوية", "كل سنتين", "لا يستحق"]} />
        </Field>
      </Fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <Check label="تجديد تلقائي للعقد" defaultChecked />
        <Check label="يستحق مكافأة نهاية الخدمة" defaultChecked />
        <Check label="مرفق نسخة موقعة من العقد" />
      </div>
    </>
  );
}
