import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Breadcrumbs } from "@/components/hr/ui";
import { useRows, useSaveRow, type Row } from "@/lib/hr-db";
import { supabase } from "@/integrations/supabase/client";
import { isValidSaudiNationalId, isValidIban } from "@/lib/employee-core.mjs";
import {
  resolveIdTypesFromLookups,
  validateIdNumberAgainstRule,
  computeRuleSummary,
  type IdTypeRule,
} from "@/components/hr/IdTypeSettings";
import { useContractTypes } from "@/components/hr/ContractTypeSettings";
import {
  transliterateArabicNameToUsEnglish,
  validateQuadrupleArabicName,
} from "@/lib/arabic-name-transliterator";
import { ANDALUS_BRANCHES, ANDALUS_DEPARTMENTS } from "@/lib/andalus-seed";

type Value = string | number | boolean;

type FieldProps = {
  label: string;
  required?: boolean | undefined;
  action?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
};

const controlClass =
  "h-10 w-full rounded-md border border-slate-400 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none transition focus:border-[#1679bd] focus:ring-2 focus:ring-[#1679bd]/15 disabled:bg-slate-100 disabled:text-slate-500";

const steps = [
  { title: "البيانات الشخصية", icon: "location_on" },
  { title: "بيانات العمل", icon: "work" },
  { title: "بيانات التواصل", icon: "mail" },
  { title: "البيانات المالية", icon: "account_balance" },
  { title: "العقود", icon: "description" },
];

const nationalities = [
  "سعودي",
  "مصري",
  "سوداني",
  "أردني",
  "سوري",
  "يمني",
  "فلسطيني",
  "لبناني",
  "تونسي",
  "مغربي",
  "جزائري",
  "عراقي",
  "كويتي",
  "إماراتي",
  "بحريني",
  "عماني",
  "قطري",
  "هندي",
  "باكستاني",
  "فلبيني",
  "بنغلاديشي",
  "أخرى",
];
const religions = ["مسلم", "مسيحي", "أخرى"];
const socialStatuses = ["أعزب", "متزوج", "مطلق", "أرمل"];
const defaultBranches = Array.from(
  new Set([
    ...ANDALUS_BRANCHES.map((b) => b.name_ar),
    "الفرع الرئيسي",
    "فرع الرياض",
    "فرع جدة",
    "فرع مكة المكرمة",
    "فرع الدمام",
  ]),
);
const defaultRegions = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "المنطقة الشرقية",
  "الدمام",
  "الخبر",
  "عسير",
  "أبها",
  "خميس مشيط",
  "القصيم",
  "حائل",
  "تبوك",
  "جازان",
  "نجران",
  "الباحة",
  "الجوف",
  "الحدود الشمالية",
  "أخرى",
];
const defaultMainDepartments = [
  "الإدارة العامة",
  "قسم البنين",
  "قسم البنات",
  "رياض الأطفال",
  "المسار الدولي / العالمي",
  "الإشراف التربوي والتطوير",
  "الخدمات المساندة",
];
const defaultSectors = [
  "شركة مدارس الأندلس التعليمية",
  "إدارة المجمعات التعليمية",
  "القطاع التعليمي",
  "القطاع الإداري",
  "قطاع السعودية",
  "قطاع التشغيل",
  "قطاع الخدمات",
];
const defaultCareerPaths = [
  "المسار الأهلي",
  "المسار العالمي / الدولي",
  "المسار الإداري",
  "مسار السعودية",
  "المسار التعليمي",
  "المسار الإشرافي",
  "المسار التقني",
  "مسار أساسي",
];
const defaultJobLevels = [
  "تعليمي",
  "إداري",
  "إشرافي",
  "قيادي",
  "تشغيلي",
  "تخصصي",
  "المستوى الأول",
  "المستوى الثاني",
  "المستوى الثالث",
];
const defaultSchedules = [
  "دوام المدارس الصباحي (06:45 - 14:15)",
  "دوام الإدارة العامة (07:30 - 15:30)",
  "دوام صباحي",
  "دوام مسائي",
  "دوام مرن",
  "مناوبات",
];
const qualificationsList = [
  "ثانوية عامة",
  "دبلوم متوسط",
  "بكالوريوس",
  "دبلوم عالي / تربوي",
  "ماجستير",
  "دكتوراه",
  "أخرى",
];
const probationPresets = [30, 60, 90, 180];
const defaultJobCategories = ["تعليمي", "إداري", "إشرافي", "قيادي", "فني", "تشغيلي"];
const contractCategories = ["دوام كلي", "دوام جزئي", "موسمي", "تدريب", "أجير"];
const paymentMethods = ["بنك", "نقدي", "صرافة", "شيك"];
const defaultSaudiBanks = [
  "مصرف الراجحي",
  "البنك الأهلي السعودي (SNB)",
  "بنك الرياض",
  "مصرف الإنماء",
  "بنك البلاد",
  "بنك الجزيرة",
  "البنك السعودي الفرنسي",
  "البنك العربي الوطني (ANB)",
  "البنك السعودي الأول (SAB)",
  "بنك الخليج الدولي (GIB)",
];
const defaultExchangeProviders = [
  "STC Pay",
  "Urpay",
  "تحويل الراجحي",
  "إنجاز للتحويل",
  "تيليموني (TeleMoney)",
  "ويسترن يونيون",
];
const defaultSponsors = [
  "شركة مدارس الأندلس التعليمية",
  "مؤسسة الأندلس التعليمية",
  "نظام أجير (إعارة)",
  "كفالة خاصة",
];
const defaultContractTypes = [
  "محدد المدة",
  "غير محدد المدة",
  "على نظام أجير",
  "تجربة",
  "مؤقت",
];
const leavePolicies = [
  "30 يوم سنويًا",
  "21 يوم سنويًا",
  "لائحة الإجازات التعليمية (36 يومًا)",
  "لائحة نظام أجير",
  "حسب العقد",
];
const workTypes = ["دوام كلي", "دوام جزئي", "عن بعد", "تطوعي", "هجين"];
const workScopes = ["داخل المملكة", "خارج المملكة", "حسب موقع المشروع"];
const hourStandards = ["يومي", "أسبوعي", "شهري"];
const contractTerms = [
  "بنود عقد العمل الموحد - منصة قوى",
  "العقد التعليمي الموحد - منصة قوى",
  "عقد العمل الإداري الموحد - منصة قوى",
  "عقد نظام أجير الموحد - منصة قوى",
  "العقد القياسي",
  "عقد تشغيلي",
];
const qiwaContractClauses = [
  "بند فترة التجربة (المادة 53 - نظام العمل)",
  "بند الإجازة السنوية والراحة الأسبوعية (المادة 104 و 109)",
  "بند عدم المنافسة وحفظ الأسرار المهنية (المادة 83)",
  "بند التكليف بعمل آخر وفق مقتضيات العمل (المادة 60)",
  "بند مكافأة نهاية الخدمة (المادة 84 و 85)",
  "بند الالتزام بلائحة تنظيم العمل المعتمدة في منصة قوى",
];

export function isIndefiniteContractType(contractType: string): boolean {
  const norm = String(contractType ?? "").trim();
  return norm.includes("غير محدد");
}

const emptyForm = {
  emp_no: "",
  full_name: "",
  employee_name_en: "",
  social_status: "متزوج",
  id_type: "الهوية الوطنية",
  national_id: "",
  fingerprint_no: "",
  nationality: "سعودي",
  religion: "مسلم",
  gender: "ذكر",
  family_members: 1,
  on_duty: true,
  fingerprint_deduction_exempt: false,
  show_in_fingerprint_reports: true,
  region: "",
  branch: "",
  main_department: "",
  career_path: "",
  department: "",
  sector: "شركة مدارس الأندلس التعليمية",
  job_level: "",
  manager_name: "",
  attendance_schedule: "",
  job_title: "",
  specialization: "",
  job_designation: "",
  birth_date: "",
  hire_date: "",
  start_date: "",
  annual_leave_calc_date: "",
  experience_years: 0,
  probation_days: 90,
  kingdom_entry_date: "",
  qualification: "بكالوريوس",
  landline: "",
  phone: "",
  phone_secondary: "",
  home_country_phone: "",
  home_country_mobile: "",
  home_country_address: "",
  current_address: "",
  building_no: "",
  postal_code: "",
  additional_no: "",
  district: "",
  email: "",
  private_email: "",
  birth_place: "",
  short_address: "",
  street: "",
  city: "",
  address_region: "",
  unit_no: "",
  address_extra_no: "",
  emergency_contact_name: "",
  emergency_contact_relation: "",
  emergency_contact_phone: "",
  address_notes: "",
  basic_salary: 0,
  housing_allowance: 0,
  transport_allowance: 0,
  other_allowances: 0,
  gosi_deduction: 0,
  other_deductions: 0,
  employment_category: "",
  contract_category: "دوام كلي",
  sponsor_name: "شركة مدارس الأندلس التعليمية",
  payment_method: "بنك",
  bank_account_holder: "",
  exchange_company: "",
  custody_account: "",
  labor_office_no: "",
  bank_data_blocked: false,
  resource_restricted: true,
  add_entitlements_deductions: false,
  contract_type: "محدد المدة",
  annual_leave_policy: "30 يوم سنويًا",
  contract_end: "",
  work_type: "دوام كلي",
  work_scope: "داخل المملكة",
  weekly_work_days: 5,
  work_hours_standard: "يومي",
  daily_work_hours: 8,
  weekly_rest_days: 2,
  contract_terms: "العقد القياسي",
  status: "نشط",
  allowances: 0,
  bank_name: "",
  iban: "",
} satisfies Record<string, Value>;

type EmployeeForm = { [K in keyof typeof emptyForm]: Value };

const labels: Record<string, string> = {
  emp_no: "الرقم الوظيفي",
  full_name: "اسم الموظف رباعي",
  employee_name_en: "اسم الموظف بالإنجليزية (US)",
  id_type: "نوع الهوية",
  national_id: "رقم الهوية",
  fingerprint_no: "رقم البصمة",
  nationality: "الجنسية",
  religion: "الديانة",
  gender: "الجنس",
  region: "المنطقة",
  branch: "الفرع",
  main_department: "القسم الرئيسي",
  career_path: "المسار",
  department: "القسم",
  sector: "القطاع",
  job_level: "المستوى الوظيفي",
  manager_name: "المدير المباشر",
  attendance_schedule: "جدول الدوام",
  job_title: "الوظيفة الحالية",
  birth_date: "تاريخ الميلاد",
  hire_date: "تاريخ التعيين",
  start_date: "تاريخ مباشرة العمل",
  annual_leave_calc_date: "احتساب الإجازة السنوية",
  experience_years: "مدة الخبرة بالسنوات",
  probation_days: "فترة التجربة بالأيام",
  kingdom_entry_date: "تاريخ دخول المملكة",
  qualification: "آخر مؤهل دراسي",
  email: "البريد الإلكتروني",
  basic_salary: "الراتب الأساسي",
  employment_category: "الفئة الوظيفية",
  sponsor_name: "اسم الكفيل",
  bank_name: "اسم البنك",
  iban: "رقم الآيبان (IBAN)",
  contract_type: "نوع العقد",
  annual_leave_policy: "لائحة الإجازة السنوية",
  contract_end: "تاريخ نهاية العقد",
  work_type: "نوع العمل",
  work_scope: "نطاق العمل",
  weekly_work_days: "عدد أيام العمل الأسبوعية",
  work_hours_standard: "معيار ساعات العمل",
  daily_work_hours: "عدد ساعات العمل",
  weekly_rest_days: "عدد أيام الراحة الأسبوعية",
};

const requiredByStep: (keyof EmployeeForm)[][] = [
  ["emp_no", "full_name", "id_type", "national_id", "nationality", "religion", "gender"],
  [
    "region",
    "branch",
    "department",
    "job_level",
    "attendance_schedule",
    "job_title",
    "birth_date",
    "hire_date",
    "start_date",
    "annual_leave_calc_date",
  ],
  ["email"],
  ["basic_salary", "employment_category", "sponsor_name"],
  [
    "contract_type",
    "annual_leave_policy",
    "work_type",
    "work_scope",
    "weekly_work_days",
    "work_hours_standard",
    "daily_work_hours",
    "weekly_rest_days",
  ],
];

function Field({ label, required, action, children, className = "" }: FieldProps) {
  return (
    <div className={"grid gap-1.5 text-right " + className}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-slate-900">
          {label}
          {required ? <span className="mr-1 text-lg leading-none text-red-600">*</span> : null}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function InputControl({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  min,
  dir,
  list,
}: {
  value: Value;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  min?: number | undefined;
  dir?: "rtl" | "ltr" | undefined;
  list?: string | undefined;
}) {
  return (
    <input
      className={controlClass}
      type={type}
      min={min}
      dir={dir}
      list={list}
      value={String(value ?? "")}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function SelectControl({
  value,
  onChange,
  options,
}: {
  value: Value;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      className={controlClass}
      value={String(value ?? "")}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">اختر ....</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function Panel({
  title,
  index,
  children,
  className = "",
}: {
  title?: string;
  index?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "rounded-md border border-slate-300 bg-[#eef5ff] p-4 shadow-sm md:p-5 " + className
      }
    >
      {title ? (
        <h3 className="mb-4 text-right text-[15px] font-extrabold text-slate-950">
          {index ? String(index) + "- " : ""}
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  );
}

function CheckCard({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string;
  helper: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-20 cursor-pointer items-start justify-between gap-3 rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
      <span className="grid gap-1 text-right">
        <span className="text-[13px] font-extrabold text-slate-900">{label}</span>
        <span className="text-[11px] text-slate-500">{helper}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-[#1679bd]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function hijriDate(value: Value) {
  if (!value) return "";
  const date = new Date(String(value) + "T12:00:00");
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

function DualDate({
  label,
  required,
  value,
  onChange,
}: {
  label: string;
  required?: boolean | undefined;
  value: Value;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} required={required}>
      <div className="grid gap-1 rounded-md border border-slate-300 bg-white p-1.5">
        <span className="px-1 text-[10px] font-bold text-slate-600">ميلادي</span>
        <input
          type="date"
          className="h-9 w-full border-0 bg-transparent px-2 text-[12px] outline-none"
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="border-t border-slate-200 px-1 pt-1 text-[10px] font-bold text-slate-600">
          هجري
        </span>
        <input
          readOnly
          className="h-8 w-full bg-slate-50 px-2 text-[12px] text-slate-600 outline-none"
          value={hijriDate(value)}
          placeholder="يُحسب تلقائيًا"
        />
      </div>
    </Field>
  );
}

export function EmployeeWizard() {
  const navigate = useNavigate();
  const save = useSaveRow("employees");
  const saveLookup = useSaveRow("basic_lookups");
  const { data: departments = [] } = useRows("departments", {
    orderBy: "name",
    ascending: true,
  });
  const { data: employees = [] } = useRows("employees", {
    orderBy: "created_at",
    ascending: false,
    limit: 600,
  });
  const { data: allLookups = [] } = useRows("basic_lookups", {
    orderBy: "created_at",
    ascending: true,
  });
  const { data: shiftGroups = [] } = useRows("work_shift_groups", {
    orderBy: "created_at",
    ascending: true,
  });
  const dbAllowances = useMemo(
    () =>
      allLookups
        .filter((r) => String(r["category"] ?? "") === "البدلات")
        .map((r) => ({
          id: r["id"],
          name: r["name_ar"] ?? r["name"] ?? "بدل",
          amount: r["amount"] ?? 500,
        })),
    [allLookups],
  );
  const { data: dbDeductions = [] } = useRows("deductions", {
    orderBy: "created_at",
    ascending: true,
  });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EmployeeForm>({ ...emptyForm });
  const [manualEnOverride, setManualEnOverride] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [dupAlert, setDupAlert] = useState<{
    field: string;
    name: string;
    empNo: string;
  } | null>(null);

  // Quick Add ID Type inline state
  const [showAddIdTypeModal, setShowAddIdTypeModal] = useState(false);
  const [newIdTypeNameAr, setNewIdTypeNameAr] = useState("");
  const [newIdTypeNameEn, setNewIdTypeNameEn] = useState("");
  const [newIdTypeDigits, setNewIdTypeDigits] = useState("10");
  const [newIdTypeStartsWith, setNewIdTypeStartsWith] = useState("");
  const [newIdTypeFormat, setNewIdTypeFormat] = useState<
    "أرقام فقط" | "حروف إنجليزية وأرقام"
  >("أرقام فقط");

  const { activeContractTypes, contractTypes: allDefinedContractTypes } =
    useContractTypes();
  const dynamicContractOptions = useMemo(() => {
    const fromSettings = activeContractTypes.map((ct) => ct.name_ar);
    return Array.from(new Set([...fromSettings, ...defaultContractTypes]));
  }, [activeContractTypes]);

  const rawIdTypes = useMemo(
    () => allLookups.filter((r) => String(r["category"] ?? "") === "نوع الهوية"),
    [allLookups],
  );

  const { idTypeOptions, idTypeRulesMap, defaultIdType } = useMemo(() => {
    const resolved = resolveIdTypesFromLookups(rawIdTypes).filter((r) => r.isActive);
    const map = new Map<string, IdTypeRule>();
    const options: string[] = [];
    for (const item of resolved) {
      if (item.name_ar && !options.includes(item.name_ar)) {
        options.push(item.name_ar);
        map.set(item.name_ar, item.rule);
      }
    }
    return {
      idTypeOptions: options,
      idTypeRulesMap: map,
      defaultIdType: options[0] || "الهوية الوطنية",
    };
  }, [rawIdTypes]);

  const lookupByCat = (cat: string, fallback: string[]) => {
    const fromDb = allLookups
      .filter((r) => String(r["category"] ?? "") === cat && r["active"] !== false)
      .map((r) => String(r["name_ar"] ?? r["name"] ?? "").trim())
      .filter(Boolean);
    return Array.from(new Set([...fromDb, ...fallback]));
  };

  const regions = useMemo(() => lookupByCat("المنطقة", defaultRegions), [allLookups]);
  const branches = useMemo(() => lookupByCat("الفرع", defaultBranches), [allLookups]);
  const mainDepartmentOptions = useMemo(
    () => lookupByCat("القسم الرئيسي", defaultMainDepartments),
    [allLookups],
  );
  const careerPaths = useMemo(
    () => lookupByCat("المسار", defaultCareerPaths),
    [allLookups],
  );
  const sectors = useMemo(() => lookupByCat("القطاع", defaultSectors), [allLookups]);
  const jobLevels = useMemo(
    () => lookupByCat("المستوى الوظيفي", defaultJobLevels),
    [allLookups],
  );
  const jobCategories = useMemo(
    () => lookupByCat("الفئات الوظيفية", defaultJobCategories),
    [allLookups],
  );
  const bankOptions = useMemo(
    () => lookupByCat("البنوك", defaultSaudiBanks),
    [allLookups],
  );
  const sponsorOptions = useMemo(
    () => lookupByCat("الكفلاء", defaultSponsors),
    [allLookups],
  );
  const schedules = useMemo(() => {
    const fromShifts = shiftGroups
      .filter((s) => s["active"] !== false)
      .map((s) => String(s["name_ar"] ?? s["name"] ?? "").trim())
      .filter(Boolean);
    return Array.from(new Set([...fromShifts, ...defaultSchedules]));
  }, [shiftGroups]);

  const departmentOptions = useMemo(() => {
    const fromDb = departments
      .map((row) => String(row["name"] ?? "").trim())
      .filter(Boolean);
    const fromSeed = ANDALUS_DEPARTMENTS.map((d) =>
      typeof d === "string" ? d : String((d as Record<string, unknown>)["name"] ?? ""),
    ).filter(Boolean);
    return Array.from(new Set([...fromDb, ...fromSeed]));
  }, [departments]);

  const managerOptions = useMemo(() => {
    const setNames = new Set<string>([
      "د. عبد الرحمن بن سليمان الحربي",
      "أ. خالد بن عبد العزيز المنصور",
      "أ. فهد بن محمد القحطاني",
      "أ. سلطان بن عبد الله الشمري",
      "أ. نورة بنت عبد الرحمن السديري",
      "أ. سارة بنت محمد العتيبي",
    ]);
    for (const d of departments) {
      const m = String(d["manager_name"] ?? "").trim();
      if (m) setNames.add(m);
    }
    for (const e of employees.slice(0, 80)) {
      const m = String(e["manager_name"] ?? "").trim();
      if (m) setNames.add(m);
    }
    return Array.from(setNames);
  }, [departments, employees]);

  const nameValidation = useMemo(
    () => validateQuadrupleArabicName(String(form.full_name ?? "")),
    [form.full_name],
  );

  const set = <K extends keyof EmployeeForm>(key: K, value: EmployeeForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleArabicNameChange = (value: string) => {
    const autoEn = transliterateArabicNameToUsEnglish(value);
    setForm((current) => ({
      ...current,
      full_name: value,
      employee_name_en:
        manualEnOverride && current.employee_name_en ? current.employee_name_en : autoEn,
      bank_account_holder:
        !current.bank_account_holder || current.bank_account_holder === current.full_name
          ? value
          : current.bank_account_holder,
    }));
  };

  const handleRegenerateEnglishName = () => {
    const autoEn = transliterateArabicNameToUsEnglish(String(form.full_name ?? ""));
    setManualEnOverride(false);
    set("employee_name_en", autoEn);
    if (autoEn) {
      toast.success("تم توليد الاسم باللغة الإنجليزية (US) تلقائياً");
    }
  };

  const handleRegenerateNumbers = () => {
    const nextNumber =
      Math.max(
        100000,
        ...employees.map((row) => Number.parseInt(String(row["emp_no"] ?? "0"), 10) || 0),
      ) + 1;
    setForm((current) => ({
      ...current,
      emp_no: String(nextNumber),
      fingerprint_no: String(new Date().getFullYear()) + String(nextNumber).slice(-6),
    }));
    toast.success("تم توليد الرقم الوظيفي ورقم البصمة تلقائياً");
  };

  const handleBasicSalaryChange = (rawVal: string) => {
    const base = Math.max(0, Number(rawVal) || 0);
    setForm((current) => {
      const isSaudi = String(current.nationality) === "سعودي";
      const housing = Number(current.housing_allowance) || Math.round(base * 0.25);
      const transport = Number(current.transport_allowance) || Math.round(base * 0.1);
      const otherAll = Number(current.other_allowances) || 0;
      const gosi = isSaudi ? Math.round((base + housing) * 0.0975) : 0;
      return {
        ...current,
        basic_salary: base,
        housing_allowance: current.add_entitlements_deductions ? housing : current.housing_allowance,
        transport_allowance: current.add_entitlements_deductions
          ? transport
          : current.transport_allowance,
        gosi_deduction: current.add_entitlements_deductions ? gosi : current.gosi_deduction,
        allowances: current.add_entitlements_deductions
          ? housing + transport + otherAll
          : Number(current.allowances) || 0,
      };
    });
  };

  const handleToggleEntitlements = (checked: boolean) => {
    setForm((current) => {
      const base = Number(current.basic_salary) || 0;
      const isSaudi = String(current.nationality) === "سعودي";
      const housing = Number(current.housing_allowance) || Math.round(base * 0.25);
      const transport = Number(current.transport_allowance) || Math.round(base * 0.1);
      const otherAll = Number(current.other_allowances) || 0;
      const gosi =
        Number(current.gosi_deduction) ||
        (isSaudi ? Math.round((base + housing) * 0.0975) : 0);
      return {
        ...current,
        add_entitlements_deductions: checked,
        housing_allowance: checked ? housing : 0,
        transport_allowance: checked ? transport : 0,
        gosi_deduction: checked ? gosi : 0,
        allowances: checked ? housing + transport + otherAll : 0,
      };
    });
  };

  const handleContractTypeChange = (value: string) => {
    const indefinite = isIndefiniteContractType(value);
    const matched = allDefinedContractTypes.find((t) => t.name_ar === value);
    setForm((current) => {
      let nextLeavePolicy = String(current.annual_leave_policy || "30 يوم سنويًا");
      if (value.includes("أجير")) {
        nextLeavePolicy = "لائحة نظام أجير";
      } else if (value.includes("تجربة") || value.includes("مؤقت")) {
        nextLeavePolicy = "21 يوم سنويًا";
      } else if (!nextLeavePolicy) {
        nextLeavePolicy = "30 يوم سنويًا";
      }

      let nextEndDate = String(current.contract_end || "");
      if (indefinite) {
        nextEndDate = "";
      } else if (matched?.defaultEndDate) {
        nextEndDate = matched.defaultEndDate;
      } else if (!nextEndDate && current.start_date) {
        const d = new Date(String(current.start_date) + "T12:00:00");
        if (!Number.isNaN(d.getTime())) {
          d.setFullYear(d.getFullYear() + 1);
          nextEndDate = d.toISOString().slice(0, 10);
        }
      }

      return {
        ...current,
        contract_type: value,
        annual_leave_policy: nextLeavePolicy,
        start_date: matched?.defaultStartDate || current.start_date,
        contract_end: nextEndDate,
        work_type: matched?.workType || current.work_type || "دوام كلي",
      };
    });
  };

  const handleAddQuickIdType = async () => {
    const trimmedAr = newIdTypeNameAr.trim();
    if (!trimmedAr) {
      toast.error("يرجى إدخال اسم نوع الهوية بالعربية");
      return;
    }
    const ruleSummary = computeRuleSummary(
      newIdTypeFormat,
      newIdTypeStartsWith,
      newIdTypeDigits,
      newIdTypeDigits,
    );
    const rule: IdTypeRule = {
      formatType: newIdTypeFormat,
      startsWith: newIdTypeStartsWith.trim(),
      minDigits: newIdTypeDigits.trim(),
      maxDigits: newIdTypeDigits.trim(),
      sortOrder: idTypeOptions.length + 1,
      ruleSummary,
    };
    try {
      await saveLookup.mutateAsync({
        category: "نوع الهوية",
        name_ar: trimmedAr,
        name_en: newIdTypeNameEn.trim() || trimmedAr,
        code: trimmedAr.replace(/\s+/g, "_").toUpperCase(),
        active: true,
        flag: true,
        details: JSON.stringify(rule),
      });
      set("id_type", trimmedAr);
      setShowAddIdTypeModal(false);
      setNewIdTypeNameAr("");
      setNewIdTypeNameEn("");
      toast.success(`تمت إضافة نوع الهوية "${trimmedAr}" واختياره بنجاح`);
    } catch {
      toast.error("تعذر حفظ نوع الهوية الجديد");
    }
  };

  useEffect(() => {
    try {
      const draft = sessionStorage.getItem("employee-wizard-draft");
      if (draft) setForm({ ...emptyForm, ...(JSON.parse(draft) as EmployeeForm) });
    } catch {
      sessionStorage.removeItem("employee-wizard-draft");
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    sessionStorage.setItem("employee-wizard-draft", JSON.stringify(form));
  }, [draftReady, form]);

  useEffect(() => {
    if (form.emp_no) return;
    const nextNumber =
      Math.max(
        100000,
        ...employees.map((row) => Number.parseInt(String(row["emp_no"] ?? "0"), 10) || 0),
      ) + 1;
    setForm((current) => ({
      ...current,
      emp_no: String(nextNumber),
      fingerprint_no:
        current.fingerprint_no ||
        String(new Date().getFullYear()) + String(nextNumber).slice(-6),
    }));
  }, [employees, form.emp_no]);

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const changePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : "");
  };

  const validateStep = (index: number) => {
    if (index === 0) {
      const quadCheck = validateQuadrupleArabicName(String(form.full_name ?? ""));
      if (!quadCheck.isValid) {
        toast.error(quadCheck.message);
        return false;
      }

      const norm = (s: unknown) =>
        String(s ?? "")
          .trim()
          .replaceAll(/\s+/g, " ")
          .toLowerCase();
      const nidIn = String(form.national_id ?? "").trim();
      const byId = nidIn
        ? employees.find((e) => String(e["national_id"] ?? "").trim() === nidIn)
        : undefined;
      const byName = norm(form.full_name)
        ? employees.find((e) => norm(e["full_name"]) === norm(form.full_name))
        : undefined;
      const dup = byId ?? byName;
      if (dup) {
        setDupAlert({
          field: byId
            ? `رقم الهوية ${nidIn}`
            : `الاسم "${String(form.full_name).trim()}"`,
          name: String(dup["full_name"] ?? "—"),
          empNo: String(dup["emp_no"] ?? "—"),
        });
        return false;
      }
    }
    const missing = (requiredByStep[index] ?? []).filter((key) => {
      const value = form[key];
      if (typeof value === "number") return value <= 0;
      return !String(value ?? "").trim();
    });
    if (missing.length) {
      toast.error("يرجى استكمال: " + missing.map((key) => labels[key] ?? key).join("، "));
      return false;
    }
    if (index === 0 && form.national_id) {
      const nid = String(form.national_id).trim();
      const currentIdType = String(form.id_type || defaultIdType).trim();
      const rule = idTypeRulesMap.get(currentIdType);
      if (rule) {
        const valRes = validateIdNumberAgainstRule(nid, rule);
        if (!valRes.valid) {
          toast.error(`${currentIdType || "رقم الهوية"}: ${valRes.message}`);
          return false;
        }
      }
      if (
        (currentIdType === "الهوية الوطنية" || currentIdType === "الإقامة") &&
        /^[12]\d{9}$/.test(nid) &&
        !isValidSaudiNationalId(nid)
      ) {
        toast.error(
          "رقم الهوية الوطنية / الإقامة غير صحيح وفق خوارزمية التدقيق الرسمية",
        );
        return false;
      }
      if (form.birth_date) {
        const bDate = new Date(String(form.birth_date));
        const today = new Date();
        const age = (today.getTime() - bDate.getTime()) / (365.25 * 24 * 3600 * 1000);
        if (age < 18) {
          toast.error("يجب ألا يقل عمر الموظف عن 18 عاماً نظاماً");
          return false;
        }
      }
    }
    if (index === 2 && !String(form.email).includes("@")) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return false;
    }
    if (index === 3) {
      const payMethod = String(form.payment_method || "");
      if (payMethod === "بنك" || payMethod === "تحويل بنكي") {
        if (!String(form.bank_name || "").trim()) {
          toast.error("يرجى اختيار اسم البنك عند تحديد طريقة القبض (بنك)");
          return false;
        }
      }
      if (form.iban) {
        const ibanClean = String(form.iban).replaceAll(/\s+/g, "").toUpperCase();
        if (!isValidIban(ibanClean)) {
          toast.error("صيغة الآيبان البنكي غير صحيحة أو رمز التدقيق البنكي غير مطابق");
          return false;
        }
      }
    }
    if (index === 4) {
      const indefinite = isIndefiniteContractType(String(form.contract_type || ""));
      if (!indefinite && !String(form.contract_end || "").trim()) {
        toast.error("يرجى تحديد تاريخ نهاية العقد (للعقود محددة المدة)");
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const previous = () => {
    setStep((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const upload = async (file: File, folder: string) => {
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) return file.name;
      const safeName = file.name.replace(/[^\w.\-]+/g, "-");
      const path =
        data.user.id + "/" + folder + "/" + crypto.randomUUID() + "-" + safeName;
      const { error } = await supabase.storage
        .from("employee-documents")
        .upload(path, file, { upsert: false });
      if (error) return file.name;
      return path;
    } catch {
      return file.name;
    }
  };

  const totalAllowances = useMemo(() => {
    if (!form.add_entitlements_deductions) {
      return Number(form.allowances) || 0;
    }
    return (
      (Number(form.housing_allowance) || 0) +
      (Number(form.transport_allowance) || 0) +
      (Number(form.other_allowances) || 0)
    );
  }, [
    form.add_entitlements_deductions,
    form.allowances,
    form.housing_allowance,
    form.transport_allowance,
    form.other_allowances,
  ]);

  const totalDeductions = useMemo(() => {
    if (!form.add_entitlements_deductions) return 0;
    return (Number(form.gosi_deduction) || 0) + (Number(form.other_deductions) || 0);
  }, [form.add_entitlements_deductions, form.gosi_deduction, form.other_deductions]);

  const netSalaryPreview = useMemo(() => {
    return Math.max(0, (Number(form.basic_salary) || 0) + totalAllowances - totalDeductions);
  }, [form.basic_salary, totalAllowances, totalDeductions]);

  const submit = async () => {
    for (let index = 0; index < requiredByStep.length; index += 1) {
      if (!validateStep(index)) {
        setStep(index);
        return;
      }
    }

    try {
      const photoPath = photoFile ? await upload(photoFile, "profiles") : "";
      const contractPath = contractFile ? await upload(contractFile, "contracts") : "";
      const finalEnName =
        String(form.employee_name_en || "").trim() ||
        transliterateArabicNameToUsEnglish(String(form.full_name || ""));
      const payload: Row = {
        ...form,
        employee_name_en: finalEnName,
        full_name_en: finalEnName,
        photo_path: photoPath || null,
        contract_attachment_path: contractPath || null,
        status: form.on_duty ? "نشط" : "موقوف",
        basic_salary: Number(form.basic_salary) || 0,
        allowances: totalAllowances,
        housing_allowance: Number(form.housing_allowance) || 0,
        transport_allowance: Number(form.transport_allowance) || 0,
        other_allowances: Number(form.other_allowances) || 0,
        gosi_deduction: Number(form.gosi_deduction) || 0,
        other_deductions: Number(form.other_deductions) || 0,
        family_members: Number(form.family_members) || 0,
        experience_years: Number(form.experience_years) || 0,
        probation_days: Number(form.probation_days) || 0,
        weekly_work_days: Number(form.weekly_work_days) || 0,
        daily_work_hours: Number(form.daily_work_hours) || 0,
        weekly_rest_days: Number(form.weekly_rest_days) || 0,
      };
      for (const key of [
        "birth_date",
        "hire_date",
        "start_date",
        "annual_leave_calc_date",
        "kingdom_entry_date",
        "contract_end",
      ]) {
        if (!payload[key]) payload[key] = null;
      }
      await save.mutateAsync(payload);
      sessionStorage.removeItem("employee-wizard-draft");
      toast.success("تم حفظ الموظف وجميع بياناته بنجاح");
      navigate({ to: "/staff" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "خطأ غير معروف";
      if (/column|schema cache|bucket/i.test(message)) {
        toast.error("يلزم تطبيق تحديث قاعدة بيانات إضافة الموظف قبل الحفظ");
      }
    }
  };

  const currentIdRule = idTypeRulesMap.get(String(form.id_type || defaultIdType));
  const isIndefiniteContract = isIndefiniteContractType(String(form.contract_type || ""));

  const personalStep = (
    <div className="grid gap-4">
      <div className="border-b-8 border-[#1679bd] pb-2 text-right text-[16px] font-extrabold text-slate-950">
        البيانات الشخصية
      </div>
      <Panel>
        <div className="grid gap-4 xl:grid-cols-[240px_1fr]">
          <label className="group flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white p-3 shadow-sm">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="صورة الموظف"
                className="h-40 w-40 rounded-lg object-cover"
              />
            ) : (
              <MaterialIcon name="person" size={120} className="text-slate-700" />
            )}
            <span className="text-xs font-bold text-[#1679bd]">اختيار صورة الموظف</span>
            <input type="file" accept="image/*" className="hidden" onChange={changePhoto} />
          </label>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="اسم الموظف رباعي (بالعربية)"
              required
              action={
                <span
                  className={
                    "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold " +
                    (nameValidation.isValid
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800")
                  }
                >
                  {nameValidation.partsCount}/4 مقاطع {nameValidation.isValid ? "✓" : ""}
                </span>
              }
            >
              <InputControl
                value={form.full_name}
                placeholder="مثال: محمد بن عبد الله بن صالح العتيبي"
                onChange={handleArabicNameChange}
              />
              <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                {nameValidation.parts.length > 0 ? (
                  nameValidation.parts.map((part, idx) => (
                    <span
                      key={`${part}-${idx}`}
                      className="rounded border border-sky-200 bg-white px-2 py-0.5 font-bold text-slate-700"
                    >
                      {idx + 1}. {part}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">
                    يشترط إدخال الاسم الرباعي كاملاً (4 أسماء على الأقل)
                  </span>
                )}
              </div>
            </Field>

            <Field
              label="اسم الموظف بالإنجليزية (US English)"
              action={
                <button
                  type="button"
                  onClick={handleRegenerateEnglishName}
                  className="inline-flex items-center gap-1 rounded bg-[#1679bd]/10 px-2 py-0.5 text-[11px] font-bold text-[#1679bd] hover:bg-[#1679bd]/20"
                  title="تحويل تلقائي من الاسم العربي إلى الإنجليزية الأمريكية"
                >
                  <MaterialIcon name="autorenew" size={14} />
                  توليد تلقائي (US)
                </button>
              }
            >
              <InputControl
                dir="ltr"
                value={form.employee_name_en}
                placeholder="Auto-generated in US English..."
                onChange={(value) => {
                  setManualEnOverride(Boolean(value.trim()));
                  set("employee_name_en", value);
                }}
              />
              <span className="text-[11px] font-medium text-emerald-700">
                يُترجم تلقائياً إلى الإنجليزية الأمريكية فور كتابة الاسم الرباعي
              </span>
            </Field>

            <Field label="الحالة الاجتماعية">
              <SelectControl
                value={form.social_status}
                onChange={(value) => set("social_status", value)}
                options={socialStatuses}
              />
            </Field>

            <Field
              label="نوع الهوية"
              required
              action={
                <button
                  type="button"
                  onClick={() => setShowAddIdTypeModal((v) => !v)}
                  className="inline-flex items-center gap-1 rounded bg-[#1679bd]/10 px-2 py-0.5 text-[11px] font-bold text-[#1679bd] hover:bg-[#1679bd]/20"
                >
                  <MaterialIcon name="add" size={14} />
                  إضافة نوع هوية
                </button>
              }
            >
              <SelectControl
                value={form.id_type || defaultIdType}
                onChange={(value) => {
                  set("id_type", value);
                  if (value === "الهوية الوطنية" && !form.nationality) {
                    set("nationality", "سعودي");
                  }
                }}
                options={idTypeOptions}
              />
              {currentIdRule ? (
                <span className="text-[11px] text-slate-500">
                  القاعدة: {currentIdRule.ruleSummary}
                </span>
              ) : null}
            </Field>

            <Field label="رقم الهوية / الإقامة / الجواز" required>
              <InputControl
                dir="ltr"
                value={form.national_id}
                placeholder={
                  form.id_type === "الهوية الوطنية"
                    ? "1xxxxxxxxx (10 أرقام)"
                    : form.id_type === "الإقامة"
                      ? "2xxxxxxxxx (10 أرقام)"
                      : "أدخل رقم الوثيقة"
                }
                onChange={(value) => set("national_id", value)}
              />
            </Field>

            <Field
              label="الرقم الوظيفي"
              required
              action={
                <button
                  type="button"
                  onClick={handleRegenerateNumbers}
                  className="inline-flex items-center gap-1 rounded bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-slate-300"
                >
                  <MaterialIcon name="refresh" size={13} />
                  توليد تلقائي
                </button>
              }
            >
              <InputControl
                dir="ltr"
                value={form.emp_no}
                placeholder="قابل للتعديل أو التوليد التلقائي"
                onChange={(value) => set("emp_no", value)}
              />
            </Field>

            <Field label="رقم البصمة">
              <InputControl
                dir="ltr"
                value={form.fingerprint_no}
                placeholder="قابل للتعديل"
                onChange={(value) => set("fingerprint_no", value)}
              />
            </Field>

            <Field label="الجنسية" required>
              <SelectControl
                value={form.nationality}
                onChange={(value) => set("nationality", value)}
                options={nationalities}
              />
            </Field>

            <Field label="الديانة" required>
              <SelectControl
                value={form.religion}
                onChange={(value) => set("religion", value)}
                options={religions}
              />
            </Field>

            <Field label="الجنس" required>
              <SelectControl
                value={form.gender}
                onChange={(value) => set("gender", value)}
                options={["ذكر", "أنثى"]}
              />
            </Field>

            <Field label="عدد الأفراد (أفراد الأسرة)">
              <InputControl
                type="number"
                min={0}
                value={form.family_members}
                onChange={(value) => set("family_members", Number(value))}
              />
            </Field>
          </div>
        </div>

        {showAddIdTypeModal ? (
          <div className="mt-4 rounded-lg border border-[#1679bd]/40 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-[#1679bd]">
                إضافة نوع هوية جديد (الهوية الوطنية / إقامة / جواز سفر / أخرى)
              </h4>
              <button
                type="button"
                onClick={() => setShowAddIdTypeModal(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                إغلاق ✕
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <Field label="اسم نوع الهوية (عربي)" required>
                <InputControl
                  value={newIdTypeNameAr}
                  placeholder="مثال: هوية زائر / جواز دبلوماسي"
                  onChange={setNewIdTypeNameAr}
                />
              </Field>
              <Field label="الاسم بالإنجليزية">
                <InputControl
                  dir="ltr"
                  value={newIdTypeNameEn}
                  placeholder="e.g. Diplomatic Passport"
                  onChange={setNewIdTypeNameEn}
                />
              </Field>
              <Field label="نوع الخانات">
                <SelectControl
                  value={newIdTypeFormat}
                  onChange={(v) =>
                    setNewIdTypeFormat(v as "أرقام فقط" | "حروف إنجليزية وأرقام")
                  }
                  options={["أرقام فقط", "حروف إنجليزية وأرقام"]}
                />
              </Field>
              <Field label="عدد الخانات">
                <InputControl
                  type="number"
                  min={4}
                  value={newIdTypeDigits}
                  onChange={setNewIdTypeDigits}
                />
              </Field>
              <Field label="يبدأ بـ (اختياري)">
                <div className="flex gap-2">
                  <InputControl
                    value={newIdTypeStartsWith}
                    placeholder="مثال: 1 أو 2"
                    onChange={setNewIdTypeStartsWith}
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickIdType}
                    className="shrink-0 rounded-md bg-[#1679bd] px-4 text-xs font-bold text-white hover:bg-[#126399]"
                  >
                    حفظ
                  </button>
                </div>
              </Field>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );

  const workStep = (
    <div className="grid gap-4">
      <div className="border-b-8 border-[#1679bd] pb-2 text-right text-[16px] font-extrabold text-slate-950">
        بيانات العمل
      </div>
      <Panel title="حالة العمل والبصمة والتقارير">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CheckCard
            label="على رأس العمل"
            helper="حالة العمل والبصمة والتقارير"
            checked={Boolean(form.on_duty)}
            onChange={(value) => set("on_duty", value)}
          />
          <CheckCard
            label="مستثنى من خصومات البصمة"
            helper="استثناء من نظام البصمة"
            checked={Boolean(form.fingerprint_deduction_exempt)}
            onChange={(value) => set("fingerprint_deduction_exempt", value)}
          />
          <CheckCard
            label="عرض في تقارير البصمة"
            helper="إظهار في التقارير"
            checked={Boolean(form.show_in_fingerprint_reports)}
            onChange={(value) => set("show_in_fingerprint_reports", value)}
          />
        </div>
      </Panel>

      <Panel index={1} title="البيانات الأساسية للعمل">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="المنطقة" required>
            <SelectControl
              value={form.region}
              onChange={(value) => set("region", value)}
              options={regions}
            />
          </Field>
          <Field label="الفرع" required>
            <SelectControl
              value={form.branch}
              onChange={(value) => {
                set("branch", value);
                const matchedBranch = ANDALUS_BRANCHES.find((b) => b.name_ar === value);
                if (matchedBranch && !form.region) {
                  set("region", matchedBranch.city);
                }
              }}
              options={branches}
            />
          </Field>
          <Field label="القسم الرئيسي">
            <SelectControl
              value={form.main_department}
              onChange={(value) => set("main_department", value)}
              options={mainDepartmentOptions}
            />
          </Field>
          <Field label="المسار">
            <SelectControl
              value={form.career_path}
              onChange={(value) => set("career_path", value)}
              options={careerPaths}
            />
          </Field>
        </div>
      </Panel>

      <Panel index={2} title="بيانات الوظيفة والتفاصيل الإدارية">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="القسم" required>
            <SelectControl
              value={form.department}
              onChange={(value) => set("department", value)}
              options={departmentOptions}
            />
          </Field>
          <Field label="القطاع">
            <SelectControl
              value={form.sector}
              onChange={(value) => set("sector", value)}
              options={sectors}
            />
          </Field>
          <Field label="المستوى الوظيفي" required>
            <SelectControl
              value={form.job_level}
              onChange={(value) => {
                set("job_level", value);
                if (!form.employment_category && jobCategories.includes(value)) {
                  set("employment_category", value);
                }
              }}
              options={jobLevels}
            />
          </Field>
          <Field label="المدير المباشر">
            <InputControl
              list="wizard-managers-list"
              value={form.manager_name}
              placeholder="اختر من القائمة أو اكتب اسم المدير المباشر"
              onChange={(value) => set("manager_name", value)}
            />
            <datalist id="wizard-managers-list">
              {managerOptions.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>
          <Field label="جدول الدوام" required>
            <SelectControl
              value={form.attendance_schedule}
              onChange={(value) => set("attendance_schedule", value)}
              options={schedules}
            />
          </Field>
          <Field label="الوظيفة الحالية" required>
            <InputControl
              value={form.job_title}
              placeholder="مثال: معلم، مشرف تربوي، محاسب، أخصائي موارد بشرية"
              onChange={(value) => {
                set("job_title", value);
                if (!form.job_designation) {
                  set("job_designation", value);
                }
              }}
            />
          </Field>
          <Field label="التخصص">
            <InputControl
              value={form.specialization}
              placeholder="مثال: رياضيات، لغة عربية، إدارة أعمال، حاسب آلي"
              onChange={(value) => set("specialization", value)}
            />
          </Field>
          <Field label="المسمى الوظيفي">
            <InputControl
              value={form.job_designation}
              placeholder="المسمى الوظيفي المعتمد في العقد"
              onChange={(value) => set("job_designation", value)}
            />
          </Field>
        </div>
      </Panel>

      <Panel index={3} title="بيانات التواريخ الوظيفية">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DualDate
            label="تاريخ الميلاد"
            required
            value={form.birth_date}
            onChange={(value) => set("birth_date", value)}
          />
          <DualDate
            label="تاريخ التعيين"
            required
            value={form.hire_date}
            onChange={(value) => {
              setForm((current) => ({
                ...current,
                hire_date: value,
                start_date: current.start_date || value,
                annual_leave_calc_date: current.annual_leave_calc_date || value,
              }));
            }}
          />
          <DualDate
            label="تاريخ مباشرة العمل"
            required
            value={form.start_date}
            onChange={(value) => {
              setForm((current) => ({
                ...current,
                start_date: value,
                annual_leave_calc_date: current.annual_leave_calc_date || value,
              }));
            }}
          />
          <DualDate
            label="احتساب الإجازة السنوية"
            required
            value={form.annual_leave_calc_date}
            onChange={(value) => set("annual_leave_calc_date", value)}
          />
        </div>
      </Panel>

      <Panel index={4} title="بيانات الخبرة العملية والمؤهل الدراسي">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="مدة الخبرة بالسنوات">
            <InputControl
              type="number"
              min={0}
              value={form.experience_years}
              onChange={(value) => set("experience_years", Number(value))}
            />
          </Field>

          <Field
            label="فترة التجربة بالأيام"
            action={
              <div className="flex items-center gap-1">
                {probationPresets.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => set("probation_days", days)}
                    className={
                      "rounded px-2 py-0.5 text-[11px] font-bold transition " +
                      (Number(form.probation_days) === days
                        ? "bg-[#1679bd] text-white"
                        : "bg-white text-slate-700 hover:bg-slate-200")
                    }
                  >
                    {days} يوم
                  </button>
                ))}
              </div>
            }
          >
            <InputControl
              type="number"
              min={0}
              value={form.probation_days}
              onChange={(value) => set("probation_days", Number(value))}
            />
          </Field>

          <DualDate
            label="تاريخ دخول المملكة"
            value={form.kingdom_entry_date}
            onChange={(value) => set("kingdom_entry_date", value)}
          />

          <Field label="آخر مؤهل دراسي حصل عليه">
            <SelectControl
              value={form.qualification}
              onChange={(value) => set("qualification", value)}
              options={qualificationsList}
            />
          </Field>
        </div>
      </Panel>
    </div>
  );

  const contactStep = (
    <div className="grid gap-4">
      <div className="border-b-8 border-[#1679bd] pb-2 text-right text-[16px] font-extrabold text-slate-950">
        بيانات التواصل
      </div>
      <Panel index={1} title="أرقام التواصل">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="التلفون الثابت">
            <InputControl
              dir="ltr"
              value={form.landline}
              placeholder="011xxxxxxx"
              onChange={(value) => set("landline", value)}
            />
          </Field>
          <Field label="رقم الجوال 1 (الأساسي)">
            <InputControl
              dir="ltr"
              value={form.phone}
              placeholder="05xxxxxxxx"
              onChange={(value) => set("phone", value)}
            />
          </Field>
          <Field label="رقم الجوال 2 (إضافي)">
            <InputControl
              dir="ltr"
              value={form.phone_secondary}
              placeholder="05xxxxxxxx"
              onChange={(value) => set("phone_secondary", value)}
            />
          </Field>
          <Field label="رقم التلفون في البلد الأصل">
            <InputControl
              dir="ltr"
              value={form.home_country_phone}
              onChange={(value) => set("home_country_phone", value)}
            />
          </Field>
          <Field label="رقم الجوال في البلد الأصل">
            <InputControl
              dir="ltr"
              value={form.home_country_mobile}
              onChange={(value) => set("home_country_mobile", value)}
            />
          </Field>
        </div>
      </Panel>

      <Panel index={2} title="عناوين الإقامة">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="العنوان في البلد الأصل">
            <textarea
              className={controlClass + " min-h-20 py-2"}
              value={String(form.home_country_address)}
              placeholder="المدينة، الحي، الشارع، وتفاصيل العنوان في البلد الأصل"
              onChange={(event) => set("home_country_address", event.target.value)}
            />
          </Field>
          <Field label="العنوان الحالي (داخل المملكة)">
            <textarea
              className={controlClass + " min-h-20 py-2"}
              value={String(form.current_address)}
              placeholder="المدينة، الحي، الشارع، ورقم المبنى في محل الإقامة الحالي"
              onChange={(event) => set("current_address", event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      <Panel index={3} title="معلومات بريدية">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="رقم المبنى">
            <InputControl
              dir="ltr"
              value={form.building_no}
              placeholder="4 أرقام"
              onChange={(value) => set("building_no", value)}
            />
          </Field>
          <Field label="الرقم البريدي">
            <InputControl
              dir="ltr"
              value={form.postal_code}
              placeholder="5 أرقام"
              onChange={(value) => set("postal_code", value)}
            />
          </Field>
          <Field label="الرقم الإضافي">
            <InputControl
              dir="ltr"
              value={form.additional_no}
              placeholder="4 أرقام"
              onChange={(value) => set("additional_no", value)}
            />
          </Field>
          <Field label="الحي">
            <InputControl
              value={form.district}
              onChange={(value) => set("district", value)}
            />
          </Field>
        </div>
      </Panel>

      <Panel index={4} title="بيانات البريد الإلكتروني">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="البريد الإلكتروني الرسمي" required>
            <InputControl
              type="email"
              dir="ltr"
              value={form.email}
              placeholder="name@andalus.edu.sa"
              onChange={(value) => set("email", value)}
            />
          </Field>
          <Field label="البريد الإلكتروني الخاص">
            <InputControl
              type="email"
              dir="ltr"
              value={form.private_email}
              placeholder="personal@email.com"
              onChange={(value) => set("private_email", value)}
            />
          </Field>
          <Field label="مكان الميلاد">
            <SelectControl
              value={form.birth_place}
              onChange={(value) => set("birth_place", value)}
              options={regions}
            />
          </Field>
        </div>
      </Panel>

      <Panel index={5} title="المزيد من بيانات التواصل بالموظف والعنوان الوطني">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="العنوان المختصر (الوطني)">
            <InputControl
              dir="ltr"
              value={form.short_address}
              placeholder="مثال: RRRD2929"
              onChange={(value) => set("short_address", value)}
            />
          </Field>
          <Field label="الشارع">
            <InputControl
              value={form.street}
              onChange={(value) => set("street", value)}
            />
          </Field>
          <Field label="المدينة">
            <InputControl
              value={form.city}
              onChange={(value) => set("city", value)}
            />
          </Field>
          <Field label="المنطقة">
            <InputControl
              value={form.address_region}
              onChange={(value) => set("address_region", value)}
            />
          </Field>
          <Field label="رقم الوحدة">
            <InputControl
              value={form.unit_no}
              onChange={(value) => set("unit_no", value)}
            />
          </Field>
          <Field label="الرقم الإضافي الفرعي">
            <InputControl
              value={form.address_extra_no}
              onChange={(value) => set("address_extra_no", value)}
            />
          </Field>
          <Field label="اسم شخص للتواصل في الطوارئ">
            <InputControl
              value={form.emergency_contact_name}
              placeholder="الاسم الثلاثي أو الرباعي"
              onChange={(value) => set("emergency_contact_name", value)}
            />
          </Field>
          <Field label="صلة القرابة">
            <SelectControl
              value={form.emergency_contact_relation}
              onChange={(value) => set("emergency_contact_relation", value)}
              options={["أب", "أخ", "ابن", "زوج / زوجة", "عم / خال", "صديق", "أخرى"]}
            />
          </Field>
          <Field label="رقم جوال الطوارئ">
            <InputControl
              dir="ltr"
              value={form.emergency_contact_phone}
              placeholder="05xxxxxxxx"
              onChange={(value) => set("emergency_contact_phone", value)}
            />
          </Field>
          <Field label="ملاحظات العنوان والتواصل" className="md:col-span-2 xl:col-span-3">
            <textarea
              className={controlClass + " min-h-20 py-2"}
              value={String(form.address_notes)}
              onChange={(event) => set("address_notes", event.target.value)}
            />
          </Field>
        </div>
      </Panel>
    </div>
  );

  const isBankPayment =
    form.payment_method === "بنك" || form.payment_method === "تحويل بنكي";
  const isExchangePayment = form.payment_method === "صرافة";

  const financialStep = (
    <div className="grid gap-5">
      <div className="border-b-8 border-[#1679bd] pb-2 text-right text-[16px] font-extrabold text-slate-950">
        البيانات المالية
      </div>

      {/* Live Financial Summary Banner */}
      <div className="grid gap-3 rounded-lg border border-[#1679bd]/30 bg-white p-4 shadow-sm md:grid-cols-4">
        <div className="rounded-md bg-slate-50 p-3 text-right">
          <div className="text-xs font-bold text-slate-500">الراتب الأساسي</div>
          <div className="mt-1 text-lg font-extrabold text-slate-900">
            {(Number(form.basic_salary) || 0).toLocaleString("en-US")} ر.س
          </div>
        </div>
        <div className="rounded-md bg-emerald-50 p-3 text-right">
          <div className="text-xs font-bold text-emerald-700">
            إجمالي الاستحقاقات والبدلات
          </div>
          <div className="mt-1 text-lg font-extrabold text-emerald-800">
            + {totalAllowances.toLocaleString("en-US")} ر.س
          </div>
        </div>
        <div className="rounded-md bg-rose-50 p-3 text-right">
          <div className="text-xs font-bold text-rose-700">إجمالي الاستقطاعات</div>
          <div className="mt-1 text-lg font-extrabold text-rose-800">
            - {totalDeductions.toLocaleString("en-US")} ر.س
          </div>
        </div>
        <div className="rounded-md bg-[#1679bd] p-3 text-right text-white">
          <div className="text-xs font-bold text-sky-100">صافي الراتب المتوقع</div>
          <div className="mt-1 text-lg font-extrabold">
            {netSalaryPreview.toLocaleString("en-US")} ر.س
          </div>
        </div>
      </div>

      <Panel index={1} title="الراتب الأساسي والفئة الوظيفية والكفيل">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="الراتب الأساسي (ر.س)" required>
            <InputControl
              type="number"
              min={0}
              value={form.basic_salary}
              onChange={handleBasicSalaryChange}
            />
          </Field>
          <Field label="الفئة الوظيفية" required>
            <SelectControl
              value={form.employment_category}
              onChange={(value) => set("employment_category", value)}
              options={jobCategories}
            />
          </Field>
          <Field label="فئات العقد">
            <SelectControl
              value={form.contract_category}
              onChange={(value) => set("contract_category", value)}
              options={contractCategories}
            />
          </Field>
          <Field label="اسم الكفيل" required>
            <InputControl
              list="wizard-sponsors-list"
              value={form.sponsor_name}
              placeholder="اختر أو اكتب اسم الكفيل"
              onChange={(value) => set("sponsor_name", value)}
            />
            <datalist id="wizard-sponsors-list">
              {sponsorOptions.map((sp) => (
                <option key={sp} value={sp} />
              ))}
            </datalist>
          </Field>
        </div>
      </Panel>

      <Panel index={2} title="طريقة القبض وبيانات الحساب البنكي / الصرافة">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="طريقة القبض (نقدي / بنك / صرافة)">
            <SelectControl
              value={form.payment_method}
              onChange={(value) => set("payment_method", value)}
              options={paymentMethods}
            />
          </Field>

          {isBankPayment ? (
            <>
              <Field label="اسم البنك (المهيأ في النظام)" required>
                <SelectControl
                  value={form.bank_name}
                  onChange={(value) => set("bank_name", value)}
                  options={bankOptions}
                />
              </Field>
              <Field label="رقم الآيبان (IBAN)">
                <InputControl
                  dir="ltr"
                  value={form.iban}
                  placeholder="SA0000000000000000000000"
                  onChange={(value) => set("iban", value.toUpperCase())}
                />
              </Field>
            </>
          ) : null}

          {isExchangePayment ? (
            <Field label="شركة الصرافة / المحفظة">
              <SelectControl
                value={form.exchange_company}
                onChange={(value) => set("exchange_company", value)}
                options={defaultExchangeProviders}
              />
            </Field>
          ) : null}

          <Field label="صاحب الحساب البنكي / المستفيد">
            <InputControl
              value={form.bank_account_holder}
              placeholder="اسم المستفيد كما يظهر في البنك"
              onChange={(value) => set("bank_account_holder", value)}
            />
          </Field>
          <Field label="حساب العهد">
            <InputControl
              value={form.custody_account}
              onChange={(value) => set("custody_account", value)}
            />
          </Field>
          <Field label="رقم مكتب العمل">
            <InputControl
              dir="ltr"
              value={form.labor_office_no}
              onChange={(value) => set("labor_office_no", value)}
            />
          </Field>
        </div>
      </Panel>

      <Panel index={3} title="الضوابط المالية والاستحقاقات والاستقطاعات">
        <div className="grid gap-4 md:grid-cols-3">
          <CheckCard
            label="حظر تعديل البيانات البنكية"
            helper="منع الموظف من تعديل بياناته البنكية"
            checked={Boolean(form.bank_data_blocked)}
            onChange={(value) => set("bank_data_blocked", value)}
          />
          <CheckCard
            label="مقيد موارد"
            helper="ربط الموظف بقيود الموارد"
            checked={Boolean(form.resource_restricted)}
            onChange={(value) => set("resource_restricted", value)}
          />
          <CheckCard
            label="إضافة استحقاقات واستقطاعات"
            helper="تفعيل بدل السكن وبدل النقل والبدلات الأخرى والاستقطاعات"
            checked={Boolean(form.add_entitlements_deductions)}
            onChange={handleToggleEntitlements}
          />
        </div>

        {form.add_entitlements_deductions ? (
          <div className="mt-4 rounded-xl border border-[#1679bd]/40 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <h4 className="text-sm font-extrabold text-[#1679bd]">
                تفصيل الاستحقاقات (البدلات) والاستقطاعات الشهرية
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const base = Number(form.basic_salary) || 0;
                    const housing = Math.round(base * 0.25);
                    const transport = Math.round(base * 0.1);
                    const isSaudi = String(form.nationality) === "سعودي";
                    const gosi = isSaudi ? Math.round((base + housing) * 0.0975) : 0;
                    setForm((curr) => ({
                      ...curr,
                      housing_allowance: housing,
                      transport_allowance: transport,
                      gosi_deduction: gosi,
                      allowances:
                        housing + transport + (Number(curr.other_allowances) || 0),
                    }));
                    toast.success("تم احتساب البدلات القياسية والتأمينات تلقائياً");
                  }}
                  className="rounded-md bg-[#1679bd]/10 px-3 py-1 text-xs font-bold text-[#1679bd] hover:bg-[#1679bd]/20"
                >
                  احتساب تلقائي (سكن 25% + نقل 10% + تأمينات)
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Field
                label="بدل السكن (ر.س)"
                action={
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "housing_allowance",
                        Math.round((Number(form.basic_salary) || 0) * 0.25),
                      )
                    }
                    className="text-[11px] font-bold text-[#1679bd] hover:underline"
                  >
                    25% من الأساسي
                  </button>
                }
              >
                <InputControl
                  type="number"
                  min={0}
                  value={form.housing_allowance}
                  onChange={(value) => set("housing_allowance", Number(value))}
                />
              </Field>

              <Field
                label="بدل النقل / المواصلات (ر.س)"
                action={
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "transport_allowance",
                        Math.round((Number(form.basic_salary) || 0) * 0.1),
                      )
                    }
                    className="text-[11px] font-bold text-[#1679bd] hover:underline"
                  >
                    10% من الأساسي
                  </button>
                }
              >
                <InputControl
                  type="number"
                  min={0}
                  value={form.transport_allowance}
                  onChange={(value) => set("transport_allowance", Number(value))}
                />
              </Field>

              <Field label="بدلات واستحقاقات أخرى (ر.س)">
                <InputControl
                  type="number"
                  min={0}
                  value={form.other_allowances}
                  onChange={(value) => set("other_allowances", Number(value))}
                />
              </Field>

              <Field
                label="استقطاع التأمينات (GOSI)"
                action={
                  <button
                    type="button"
                    onClick={() => {
                      const base = Number(form.basic_salary) || 0;
                      const housing = Number(form.housing_allowance) || 0;
                      set("gosi_deduction", Math.round((base + housing) * 0.0975));
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    9.75% (سعودي)
                  </button>
                }
              >
                <InputControl
                  type="number"
                  min={0}
                  value={form.gosi_deduction}
                  onChange={(value) => set("gosi_deduction", Number(value))}
                />
              </Field>

              <Field label="استقطاعات أخرى (ر.س)">
                <InputControl
                  type="number"
                  min={0}
                  value={form.other_deductions}
                  onChange={(value) => set("other_deductions", Number(value))}
                />
              </Field>
            </div>

            {dbAllowances.length > 0 || dbDeductions.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs">
                <span className="font-bold text-slate-600">
                  عناصر مهيأة في النظام للإضافة السريعة:
                </span>
                {dbAllowances.slice(0, 5).map((al) => (
                  <button
                    key={String(al["id"])}
                    type="button"
                    onClick={() => {
                      const amt = Number(al["amount"]) || 500;
                      set(
                        "other_allowances",
                        (Number(form.other_allowances) || 0) + amt,
                      );
                      toast.success(`تمت إضافة "${String(al["name"])}" (${amt} ر.س)`);
                    }}
                    className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    + {String(al["name"])} ({Number(al["amount"]) || 0} ر.س)
                  </button>
                ))}
                {dbDeductions.slice(0, 4).map((dd) => (
                  <button
                    key={String(dd["id"])}
                    type="button"
                    onClick={() => {
                      const amt = Number(dd["amount"]) || 200;
                      set(
                        "other_deductions",
                        (Number(form.other_deductions) || 0) + amt,
                      );
                      toast.success(`تمت إضافة استقطاع "${String(dd["name"])}" (${amt} ر.س)`);
                    }}
                    className="rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 font-bold text-rose-800 hover:bg-rose-100"
                  >
                    - {String(dd["name"])} ({Number(dd["amount"]) || 0} ر.س)
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );

  const contractStep = (
    <div className="grid gap-5">
      <div className="border-b-8 border-[#1679bd] pb-2 text-right text-[16px] font-extrabold text-slate-950">
        العقود
      </div>
      <Panel index={1} title="تفاصيل العقد الأساسية">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="نوع العقد (محدد / غير محدد / أجير)" required>
            <SelectControl
              value={form.contract_type}
              onChange={handleContractTypeChange}
              options={dynamicContractOptions}
            />
          </Field>
          <Field label="لائحة الإجازة السنوية (مرتبطة بالعقد)" required>
            <SelectControl
              value={form.annual_leave_policy}
              onChange={(value) => set("annual_leave_policy", value)}
              options={leavePolicies}
            />
          </Field>
          <Field label="تاريخ بداية العقد" required>
            <InputControl
              type="date"
              value={form.start_date}
              onChange={(value) => set("start_date", value)}
            />
          </Field>
          <Field
            label={
              isIndefiniteContract
                ? "تاريخ نهاية العقد (غير محدد المدة)"
                : "تاريخ نهاية العقد"
            }
            required={!isIndefiniteContract}
          >
            <InputControl
              type="date"
              disabled={isIndefiniteContract}
              value={isIndefiniteContract ? "" : form.contract_end}
              placeholder={
                isIndefiniteContract ? "عقد غير محدد المدة — لا يوجد تاريخ نهاية" : ""
              }
              onChange={(value) => set("contract_end", value)}
            />
            {isIndefiniteContract ? (
              <span className="text-[11px] font-bold text-emerald-700">
                ✓ العقد غير محدد المدة لا يشترط تاريخ نهاية عقد
              </span>
            ) : null}
          </Field>
        </div>
      </Panel>

      <Panel index={2} title="تنظيم أوقات العمل">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="نوع العمل (كلي / جزئي / عن بعد / تطوعي)" required>
            <SelectControl
              value={form.work_type}
              onChange={(value) => set("work_type", value)}
              options={workTypes}
            />
          </Field>
          <Field label="نطاق العمل (داخل / خارج المملكة)" required>
            <SelectControl
              value={form.work_scope}
              onChange={(value) => set("work_scope", value)}
              options={workScopes}
            />
          </Field>
          <Field label="عدد أيام العمل الأسبوعية" required>
            <InputControl
              type="number"
              min={1}
              value={form.weekly_work_days}
              onChange={(value) => {
                const workDays = Math.min(7, Math.max(1, Number(value) || 5));
                setForm((curr) => ({
                  ...curr,
                  weekly_work_days: workDays,
                  weekly_rest_days: Math.max(1, 7 - workDays),
                }));
              }}
            />
          </Field>
          <Field label="معيار ساعات العمل (يومي / أسبوعي)" required>
            <SelectControl
              value={form.work_hours_standard}
              onChange={(value) => {
                set("work_hours_standard", value);
                if (value === "أسبوعي" && Number(form.daily_work_hours) <= 12) {
                  set("daily_work_hours", Number(form.weekly_work_days || 5) * 8);
                } else if (value === "يومي" && Number(form.daily_work_hours) > 12) {
                  set("daily_work_hours", 8);
                }
              }}
              options={hourStandards}
            />
          </Field>
          <Field
            label={
              form.work_hours_standard === "أسبوعي"
                ? "عدد ساعات العمل الأسبوعية"
                : "عدد ساعات العمل اليومية"
            }
            required
          >
            <InputControl
              type="number"
              min={1}
              value={form.daily_work_hours}
              onChange={(value) => set("daily_work_hours", Number(value))}
            />
          </Field>
        </div>
      </Panel>

      <Panel index={3} title="تنظيم الإجازات والراحة وبنود منصة قوى">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="عدد أيام الراحة الأسبوعية"
            required
            action={
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                تلقائي (7 - {Number(form.weekly_work_days) || 5} أيام عمل)
              </span>
            }
          >
            <InputControl
              type="number"
              min={1}
              value={form.weekly_rest_days}
              onChange={(value) => set("weekly_rest_days", Number(value))}
            />
          </Field>
          <Field label="بنود العقد المعتمدة (منصة قوى)">
            <SelectControl
              value={form.contract_terms}
              onChange={(value) => set("contract_terms", value)}
              options={contractTerms}
            />
          </Field>
          <Field label="مرفق العقد الموثق">
            <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#1679bd] bg-white px-3 text-xs font-bold text-[#1679bd]">
              <MaterialIcon name="cloud_upload" size={18} />
              {contractFile ? contractFile.name : "اختيار مرفق العقد"}
              <input
                type="file"
                className="hidden"
                onChange={(event) => setContractFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </Field>
        </div>

        <div className="mt-4 rounded-lg border border-slate-300 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#1679bd]">
              بنود عقد العمل الإضافية المتوافقة مع منصة قوى:
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              يتم تضمينها تلقائياً في مسودة عقد الموظف
            </span>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {qiwaContractClauses.map((clause) => (
              <label
                key={clause}
                className="flex cursor-pointer items-center gap-2 rounded border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-sky-50"
              >
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 accent-[#1679bd]"
                />
                <span>{clause}</span>
              </label>
            ))}
          </div>
        </div>
      </Panel>

      <Panel index={4} title="استعراض ومراجعة بيانات الموظف الكاملة قبل الحفظ">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-extrabold text-[#1679bd]">
                1. البيانات الشخصية
              </span>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-[11px] font-bold text-slate-500 hover:text-[#1679bd]"
              >
                تعديل
              </button>
            </div>
            <div className="grid gap-1 text-xs text-slate-700">
              <div>
                <b>الاسم الرباعي:</b> {String(form.full_name || "—")}
              </div>
              <div>
                <b>الاسم بالإنجليزية (US):</b>{" "}
                <span dir="ltr">{String(form.employee_name_en || "—")}</span>
              </div>
              <div>
                <b>نوع ورقم الهوية:</b> {String(form.id_type || "—")} —{" "}
                <span dir="ltr">{String(form.national_id || "—")}</span>
              </div>
              <div>
                <b>الرقم الوظيفي / البصمة:</b> {String(form.emp_no || "—")} /{" "}
                {String(form.fingerprint_no || "—")}
              </div>
              <div>
                <b>الجنسية / الجنس / الأفراد:</b> {String(form.nationality || "—")} /{" "}
                {String(form.gender || "—")} ({Number(form.family_members) || 0} أفراد)
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-extrabold text-[#1679bd]">
                2. بيانات العمل والتواريخ
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] font-bold text-slate-500 hover:text-[#1679bd]"
              >
                تعديل
              </button>
            </div>
            <div className="grid gap-1 text-xs text-slate-700">
              <div>
                <b>المنطقة / الفرع:</b> {String(form.region || "—")} —{" "}
                {String(form.branch || "—")}
              </div>
              <div>
                <b>القسم / المسار:</b> {String(form.department || "—")} (
                {String(form.career_path || "—")})
              </div>
              <div>
                <b>الوظيفة / المستوى:</b> {String(form.job_title || "—")} —{" "}
                {String(form.job_level || "—")}
              </div>
              <div>
                <b>تاريخ التعيين والمباشرة:</b> {String(form.hire_date || "—")} /{" "}
                {String(form.start_date || "—")}
              </div>
              <div>
                <b>المؤهل / الخبرة / التجربة:</b> {String(form.qualification || "—")} —{" "}
                {Number(form.experience_years) || 0} سنوات ({Number(form.probation_days) || 90}{" "}
                يوم تجربة)
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-extrabold text-[#1679bd]">
                3. التواصل والبيانات المالية والعقد
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-[11px] font-bold text-slate-500 hover:text-[#1679bd]"
                >
                  التواصل
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-[11px] font-bold text-slate-500 hover:text-[#1679bd]"
                >
                  المالية
                </button>
              </div>
            </div>
            <div className="grid gap-1 text-xs text-slate-700">
              <div>
                <b>الجوال / البريد:</b> <span dir="ltr">{String(form.phone || "—")}</span>{" "}
                — <span dir="ltr">{String(form.email || "—")}</span>
              </div>
              <div>
                <b>الراتب الأساسي / الصافي:</b>{" "}
                {(Number(form.basic_salary) || 0).toLocaleString("en-US")} ر.س (الصافي:{" "}
                <b>{netSalaryPreview.toLocaleString("en-US")} ر.س</b>)
              </div>
              <div>
                <b>طريقة القبض:</b> {String(form.payment_method || "—")}{" "}
                {isBankPayment && form.bank_name ? `— ${String(form.bank_name)}` : ""}
              </div>
              <div>
                <b>نوع العقد / الإجازة:</b> {String(form.contract_type || "—")} (
                {String(form.annual_leave_policy || "—")})
              </div>
              <div>
                <b>أوقات العمل والراحة:</b> {String(form.work_type || "—")} —{" "}
                {Number(form.weekly_work_days) || 5} أيام عمل /{" "}
                {Number(form.weekly_rest_days) || 2} راحة
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );

  const bodies = [personalStep, workStep, contactStep, financialStep, contractStep];

  return (
    <div className="mt-4" dir="rtl">
      <AlertDialog open={!!dupAlert} onOpenChange={(o) => !o && setDupAlert(null)}>
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              تنبيه: يوجد تشابه في بيانات الموظف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-7">
              {dupAlert?.field} موجود بالفعل داخل النظام على الموظف{" "}
              <b>{dupAlert?.name}</b> (الرقم الوظيفي {dupAlert?.empNo}). لا يمكن إضافة
              موظف ببيانات مكررة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>حسنًا</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Breadcrumbs trail={["عمليات شؤون الموظفين", "شؤون الموظفين", "إضافة موظف"]} />

      <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-5 shadow-sm">
        <div className="grid grid-cols-5">
          {steps.map((item, index) => {
            const active = index === step;
            const completed = index < step;
            const enabled = index <= step;
            return (
              <button
                key={item.title}
                type="button"
                disabled={!enabled}
                onClick={() => enabled && setStep(index)}
                className="relative grid min-w-0 justify-items-center gap-2 px-1 disabled:cursor-default"
              >
                {index < steps.length - 1 ? (
                  <span
                    className={
                      "absolute right-1/2 top-5 h-0.5 w-full " +
                      (index < step ? "bg-[#1679bd]" : "bg-slate-200")
                    }
                  />
                ) : null}
                <span
                  className={
                    "relative z-10 grid h-10 w-10 place-items-center rounded-full " +
                    (active || completed
                      ? "bg-[#1679bd] text-white"
                      : "bg-slate-200 text-slate-400")
                  }
                >
                  <MaterialIcon name={completed ? "check" : item.icon} size={20} />
                </span>
                <span
                  className={
                    "truncate text-[11px] font-extrabold md:text-[13px] " +
                    (active ? "text-[#1679bd]" : "text-slate-900")
                  }
                >
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">{bodies[step]}</div>

      <div className="sticky bottom-0 z-20 mt-6 flex items-center justify-between border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur">
        <button
          type="button"
          onClick={previous}
          disabled={step === 0 || save.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[#1679bd] px-6 py-2.5 text-sm font-bold text-white shadow disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MaterialIcon name="arrow_forward" size={19} />
          السابق
        </button>

        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 rounded-full bg-[#1679bd] px-6 py-2.5 text-sm font-bold text-white shadow"
          >
            التالي
            <MaterialIcon name="arrow_back" size={19} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-2.5 text-sm font-bold text-white shadow disabled:cursor-wait disabled:opacity-60"
          >
            <MaterialIcon name="save" size={19} />
            {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        )}
      </div>
    </div>
  );
}
