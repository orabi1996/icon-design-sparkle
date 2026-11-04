import type { Row } from "@/lib/hr-db";
import type { DataUpdateRequestItem } from "@/lib/data-update-config";

export interface AndalusBranchDef {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  manager_name: string;
  active: boolean;
}

/**
 * فروع شركة مدارس الأندلس التعليمية (الأهلية والعالمية) في المملكة
 */
export const ANDALUS_BRANCHES: AndalusBranchDef[] = [
  {
    id: "11111111-2222-4333-8444-000000000001",
    code: "AND-HQ",
    name_ar: "الإدارة العامة - شركة مدارس الأندلس التعليمية (جدة)",
    name_en: "Al-Andalus Educational HQ - Jeddah",
    city: "جدة",
    district: "حي الزهراء",
    phone: "0126910000",
    email: "hq@andalus.edu.sa",
    manager_name: "د. عبدالله بن صالح الغامدي",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000002",
    code: "AND-JED-B",
    name_ar: "مدارس الأندلس الأهلية - فرع جدة (بنين - حي الزهراء)",
    name_en: "Al-Andalus Schools - Jeddah Boys (Al-Zahra)",
    city: "جدة",
    district: "حي الزهراء",
    phone: "0126911100",
    email: "jed.boys@andalus.edu.sa",
    manager_name: "أ. خالد بن عبدالرحمن القحطاني",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000003",
    code: "AND-JED-G",
    name_ar: "مدارس الأندلس الأهلية - فرع جدة (بنات - حي الحمراء)",
    name_en: "Al-Andalus Schools - Jeddah Girls (Al-Hamra)",
    city: "جدة",
    district: "حي الحمراء",
    phone: "0126652200",
    email: "jed.girls@andalus.edu.sa",
    manager_name: "أ. نورة بنت محمد الشهري",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000004",
    code: "AND-JED-INT",
    name_ar: "مدارس الأندلس العالمية - فرع جدة (Al-Andalus International)",
    name_en: "Al-Andalus International School - Jeddah",
    city: "جدة",
    district: "حي الشاطئ",
    phone: "0126923300",
    email: "int.jed@andalus.edu.sa",
    manager_name: "د. طارق بن فيصل الحربي",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000005",
    code: "AND-RUH-B",
    name_ar: "مدارس الأندلس الأهلية - فرع الرياض (بنين - حي قرطبة)",
    name_en: "Al-Andalus Schools - Riyadh Boys (Qurtubah)",
    city: "الرياض",
    district: "حي قرطبة",
    phone: "0112484400",
    email: "ruh.boys@andalus.edu.sa",
    manager_name: "أ. حمدان مانع العمري",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000006",
    code: "AND-RUH-G",
    name_ar: "مدارس الأندلس الأهلية - فرع الرياض (بنات - حي الياسمين)",
    name_en: "Al-Andalus Schools - Riyadh Girls (Al-Yasmin)",
    city: "الرياض",
    district: "حي الياسمين",
    phone: "0112485500",
    email: "ruh.girls@andalus.edu.sa",
    manager_name: "أ. سارة بنت عبدالعزيز العتيبي",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000007",
    code: "AND-MKH-B",
    name_ar: "مدارس الأندلس الأهلية - فرع مكة المكرمة (بنين - الشوقية)",
    name_en: "Al-Andalus Schools - Makkah Boys (Al-Shawqiyah)",
    city: "مكة المكرمة",
    district: "حي الشوقية",
    phone: "0125366600",
    email: "mkh.boys@andalus.edu.sa",
    manager_name: "أ. فهد بن عمر القرشي",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000008",
    code: "AND-MKH-G",
    name_ar: "مدارس الأندلس الأهلية - فرع مكة المكرمة (بنات - بطحاء قريش)",
    name_en: "Al-Andalus Schools - Makkah Girls (Batha Quraish)",
    city: "مكة المكرمة",
    district: "بطحاء قريش",
    phone: "0125367700",
    email: "mkh.girls@andalus.edu.sa",
    manager_name: "أ. هند بنت سالم السلمي",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000009",
    code: "AND-ABH-B",
    name_ar: "مدارس الأندلس الأهلية - فرع أبها (المجمع التعليمي - بنين)",
    name_en: "Al-Andalus Schools - Abha Boys Campus",
    city: "أبها",
    district: "حي المنسك",
    phone: "0172298800",
    email: "abha.boys@andalus.edu.sa",
    manager_name: "أ. سعيد بن علي عسيري",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000010",
    code: "AND-ABH-G",
    name_ar: "مدارس الأندلس الأهلية - فرع أبها (المجمع التعليمي - بنات)",
    name_en: "Al-Andalus Schools - Abha Girls Campus",
    city: "أبها",
    district: "حي المنسك",
    phone: "0172299900",
    email: "abha.girls@andalus.edu.sa",
    manager_name: "أ. فاطمة بنت أحمد الألمعي",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000011",
    code: "AND-KHM-B",
    name_ar: "مدارس الأندلس الأهلية - فرع خميس مشيط (بنين - حي الراقي)",
    name_en: "Al-Andalus Schools - Khamis Mushait Boys",
    city: "خميس مشيط",
    district: "حي الراقي",
    phone: "0172211122",
    email: "khm.boys@andalus.edu.sa",
    manager_name: "أ. محمد بن سعد الشهراني",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000012",
    code: "AND-KHM-G",
    name_ar: "مدارس الأندلس الأهلية - فرع خميس مشيط (بنات - حي الضيافة)",
    name_en: "Al-Andalus Schools - Khamis Mushait Girls",
    city: "خميس مشيط",
    district: "حي الضيافة",
    phone: "0172213344",
    email: "khm.girls@andalus.edu.sa",
    manager_name: "أ. مريم بنت حسن القحطاني",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000013",
    code: "AND-TIF",
    name_ar: "مدارس الأندلس الأهلية - فرع الطائف (حي الوسام)",
    name_en: "Al-Andalus Schools - Taif Branch (Al-Wissam)",
    city: "الطائف",
    district: "حي الوسام",
    phone: "0127455566",
    email: "taif@andalus.edu.sa",
    manager_name: "أ. سلطان بن نايف الثبيتي",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000014",
    code: "AND-BAH",
    name_ar: "مدارس الأندلس الأهلية - فرع الباحة",
    name_en: "Al-Andalus Schools - Al-Baha Branch",
    city: "الباحة",
    district: "حي الشهدا",
    phone: "0177256677",
    email: "baha@andalus.edu.sa",
    manager_name: "أ. عادل بن راشد الزهراني",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000015",
    code: "AND-JZN",
    name_ar: "مدارس الأندلس الأهلية - فرع جازان (الكورنيش الشمالي)",
    name_en: "Al-Andalus Schools - Jazan Branch",
    city: "جازان",
    district: "الكورنيش الشمالي",
    phone: "0173227788",
    email: "jazan@andalus.edu.sa",
    manager_name: "أ. يحيى بن أحمد حكمي",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000016",
    code: "AND-NJR",
    name_ar: "مدارس الأندلس الأهلية - فرع نجران (حي الفهد)",
    name_en: "Al-Andalus Schools - Najran Branch",
    city: "نجران",
    district: "حي الفهد",
    phone: "0175238899",
    email: "najran@andalus.edu.sa",
    manager_name: "أ. صالح بن مانع اليامي",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000017",
    code: "AND-JWF",
    name_ar: "مدارس الأندلس الأهلية - فرع الجوف (سكاكا)",
    name_en: "Al-Andalus Schools - Al-Jouf (Sakaka)",
    city: "سكاكا",
    district: "حي الربوة",
    phone: "0146249900",
    email: "jouf@andalus.edu.sa",
    manager_name: "أ. نواف بن فهد الشمري",
    active: true,
  },
  {
    id: "11111111-2222-4333-8444-000000000018",
    code: "AND-ARR",
    name_ar: "مدارس الأندلس الأهلية - فرع عرعر (الحدود الشمالية)",
    name_en: "Al-Andalus Schools - Arar Branch",
    city: "عرعر",
    district: "حي المساعدية",
    phone: "0146621100",
    email: "arar@andalus.edu.sa",
    manager_name: "أ. ماجد بن عواد العنزي",
    active: true,
  },
];

export const ANDALUS_DEPARTMENTS: string[] = [
  "المرحلة الابتدائية",
  "المرحلة المتوسطة",
  "المرحلة الثانوية",
  "رياض الأطفال والطفولة المبكرة",
  "المسار الدولي (الدبلوما الأمريكية)",
  "الإشراف التربوي والتطوير الأكاديمي",
  "التوجيه والإرشاد الطلابي",
  "الموارد البشرية وشؤون المعلمين",
  "الشؤون الإدارية والقبول والتسجيل",
  "الشؤون المالية والمحاسبة",
  "تقنية المعلومات والتحول الرقمي",
  "الأمن والسلامة والخدمات المساندة",
];

const FIRST_NAMES_MALE = [
  "أحمد", "محمد", "عبدالله", "خالد", "فهد", "سلمان", "عبدالرحمن", "سلطان", "فيصل", "تركي",
  "عمر", "علي", "حسن", "إبراهيم", "يوسف", "طارق", "ماجد", "وليد", "سعيد", "صالح",
  "نايف", "بندر", "راشد", "عادل", "ياسر", "أيمن", "مصطفى", "محمود", "حسام", "كريم",
];

const FIRST_NAMES_FEMALE = [
  "نورة", "سارة", "فاطمة", "مريم", "هند", "مها", "ريم", "أمل", "منيرة", "خلود",
  "عائشة", "سمية", "أسماء", "رانيا", "إيمان", "دلال", "لطيفة", "جواهر", "عبير", "هدى",
];

const MIDDLE_NAMES = [
  "محمد", "عبدالله", "صالح", "إبراهيم", "أحمد", "سليمان", "حسن", "علي", "عبدالعزيز", "سعد",
  "محمود", "السيد", "عبدالرحمن", "حسين", "منصور", "ناصر", "عوض", "سالم", "فهد", "كامل",
];

const FAMILY_NAMES_SAUDI = [
  "الغامدي", "القحطاني", "العتيبي", "الشهري", "الحربي", "الزهراني", "الدوسري", "الشمري",
  "المطيري", "العنزي", "السبيعي", "العمري", "المالكي", "الأسمري", "اليامي", "القرشي",
  "السلمي", "الثبيتي", "الشهراني", "الحازمي",
];

const FAMILY_NAMES_RESIDENT = [
  "السيد", "الشافعي", "المنشاوي", "الخطيب", "النجار", "العرابي", "الرفاعي", "البدوي",
  "الكيلاني", "المصري", "الحسيني", "العباسي", "الزغبي", "المومني", "ميرغني", "باشراحيل",
];

const SPECIALIZATIONS = [
  "لغة عربية",
  "تربية إسلامية",
  "رياضيات",
  "فيزياء",
  "كيمياء",
  "أحياء وعلوم",
  "لغة إنجليزية",
  "حاسب آلي وتقنية رقمية",
  "تربية بدنية",
  "اجتماعيات",
  "رياض أطفال",
  "إدارة تربوية",
  "محاسبة ومالية",
  "موارد بشرية",
  "إرشاد طلابي",
];

const JOB_TITLES = [
  "معلم",
  "معلم أول",
  "مشرف تربوي",
  "وكيل مرحلة",
  "قائد مدرسة",
  "مرشد طلابي",
  "أخصائي موارد بشرية",
  "محاسب",
  "منسق قبول وتسجيل",
  "أخصائي تقنية معلومات",
  "رائد نشاط",
  "أمين مصادر تعلم",
];

const NATIONALITIES = [
  "سعودي",
  "مصري",
  "أردني",
  "سوداني",
  "سوري",
  "يمني",
  "تونسي",
];

const SHORT_ADDRESS_PREFIXES: Record<string, string> = {
  "جدة": "JEDB",
  "الرياض": "RRMA",
  "مكة المكرمة": "MACA",
  "أبها": "ABHA",
  "خميس مشيط": "KMST",
  "الطائف": "TAIF",
  "الباحة": "BAHA",
  "جازان": "JAZN",
  "نجران": "NAJR",
  "سكاكا": "SKKA",
  "عرعر": "ARAR",
};

const CITY_POSTAL_BASE: Record<string, number> = {
  "جدة": 23421,
  "الرياض": 13244,
  "مكة المكرمة": 24351,
  "أبها": 62521,
  "خميس مشيط": 62461,
  "الطائف": 26521,
  "الباحة": 65521,
  "جازان": 82721,
  "نجران": 66261,
  "سكاكا": 72341,
  "عرعر": 73311,
};

const STREETS = [
  "شارع الأمير سلطان",
  "طريق الملك فهد",
  "شارع التحلية",
  "طريق الملك عبدالله",
  "شارع فلسطين",
  "طريق الثمامة",
  "شارع الستين",
  "طريق الدائري الشرقي",
  "شارع حراء",
  "طريق الأمير محمد بن سلمان",
];

let _cachedEmployees: Row[] | null = null;
let _cachedUpdateRequests: DataUpdateRequestItem[] | null = null;

/**
 * توليد 500 موظف حقيقي لشركة مدارس الأندلس موزعين على كافة الفروع والأقسام
 */
export function generateAndalusEmployees500(): Row[] {
  if (_cachedEmployees) return _cachedEmployees;

  const list: Row[] = [];
  const usedNames = new Set<string>();

  // الموظف رقم 1: أحمد محمد السيد السيد (حساب الموظف الأساسي 10078)
  usedNames.add("أحمد محمد السيد السيد");
  list.push({
    id: "cdfac520-782f-40f2-b40d-5895a9c9d5e3",
    emp_no: "10078",
    full_name: "أحمد محمد السيد السيد",
    full_name_en: "Ahmed Mohammed Alsayed Alsayed",
    national_id: "2609777368",
    id_type: "الإقامة",
    nationality: "مصري",
    gender: "ذكر",
    social_status: "متزوج",
    marital_status: "متزوج",
    religion: "مسلم",
    family_members_count: 4,
    branch: "مدارس الأندلس الأهلية - فرع الرياض (بنين - حي قرطبة)",
    main_department: "بنين",
    department: "المرحلة الابتدائية",
    sector: "إدارة المجمعات التعليمية - مدارس الأندلس",
    job_title: "معلم",
    job_designation: "معلم",
    job_level: "تعليمي",
    employment_category: "تعليمي",
    specialization: "تربية بدنية",
    career_path: "الأهلي",
    manager_name: "أ. حمدان مانع العمري",
    phone: "0574606701",
    mobile: "0574606701",
    email: "ahmed.elsayed708@gmail.com",
    short_address: "RRMA4321",
    postal_code: "13245",
    building_no: "4321",
    street: "طريق الثمامة",
    district: "حي قرطبة",
    city: "الرياض",
    region: "منطقة الرياض",
    unit_no: "12",
    current_address: "الرياض - حي قرطبة - طريق الثمامة - مبنى 4321",
    iqama_expiry: "2027-06-15",
    iqama_issue_place: "الرياض",
    last_qualification: "بكالوريوس",
    basic_salary: 6500,
    housing_allowance: 1625,
    transport_allowance: 650,
    other_allowance: 500,
    allowances: 2775,
    contract_type: "عقد عام دراسي (بتاريخ بداية ونهاية)",
    bank_name: "مصرف الراجحي",
    iban: "SA4480000412608010100780",
    hire_date: "2022-08-25",
    start_date: "2022-08-25",
    contract_end: "2027-06-30",
    status: "نشط",
    employment_status: "active",
    created_at: "2026-01-10T08:00:00Z",
    updated_at: "2026-11-01T08:00:00Z",
  });

  // توليد 549 موظفاً إضافياً ليصبح الإجمالي 550 موظفاً
  for (let i = 1; i <= 549; i++) {
    const empNoNum = 10000 + i + (10000 + i >= 10078 ? 1 : 0);
    const empNo = String(empNoNum);
    const detUuid = `00000000-0001-4000-8000-${(i + 1).toString(16).padStart(12, "0")}`;

    const branchObj = ANDALUS_BRANCHES[i % ANDALUS_BRANCHES.length]!;
    const isGirlsBranch =
      branchObj.name_ar.includes("بنات") ||
      (branchObj.code === "AND-HQ" && i % 4 === 0);
    const gender = isGirlsBranch ? "أنثى" : "ذكر";

    const isSaudi = i % 10 < 6; // 60% سعوديون و 40% مقيمون
    const nationality = isSaudi
      ? "سعودي"
      : NATIONALITIES[1 + (i % (NATIONALITIES.length - 1))]!;

    const firstPool = gender === "أنثى" ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE;
    const famPool = isSaudi ? FAMILY_NAMES_SAUDI : FAMILY_NAMES_RESIDENT;
    let fullName = "";
    let attempt = 0;
    while (!fullName || usedNames.has(fullName)) {
      const fName = firstPool[(i + attempt) % firstPool.length]!;
      const mName1 = MIDDLE_NAMES[(i * 3 + attempt * 5) % MIDDLE_NAMES.length]!;
      const mName2 = MIDDLE_NAMES[(i * 7 + 5 + attempt * 11) % MIDDLE_NAMES.length]!;
      const mName3 = MIDDLE_NAMES[(i * 11 + 3 + attempt * 13) % MIDDLE_NAMES.length]!;
      const lName = famPool[(i * 5 + attempt * 7) % famPool.length]!;
      fullName =
        attempt < 20
          ? `${fName} ${mName1} ${mName2} ${lName}`
          : `${fName} ${mName1} ${mName2} ${mName3} ${lName}`;
      attempt++;
    }
    usedNames.add(fullName);

    const nationalId = isSaudi
      ? `10${String(24500000 + i * 137).slice(0, 8)}`
      : `24${String(68100000 + i * 193).slice(0, 8)}`;

    const dept = ANDALUS_DEPARTMENTS[i % ANDALUS_DEPARTMENTS.length]!;
    const spec = SPECIALIZATIONS[i % SPECIALIZATIONS.length]!;
    const jobTitle = JOB_TITLES[i % JOB_TITLES.length]!;
    const isInternational =
      branchObj.code === "AND-JED-INT" || dept.includes("الدولي");

    const city = branchObj.city;
    const addrPrefix = SHORT_ADDRESS_PREFIXES[city] || "JEDB";
    const buildingNo = String(2100 + ((i * 17) % 7800));
    const postalCode = String((CITY_POSTAL_BASE[city] || 23421) + (i % 75));
    const shortAddress = `${addrPrefix}${buildingNo}`;
    const street = STREETS[i % STREETS.length]!;
    const phone = `05${String(50100000 + i * 149).slice(0, 8)}`;
    const email = `emp${empNo}@andalus.edu.sa`;

    const iqamaYear = isSaudi ? 2030 : 2026 + (i % 3);
    const iqamaMonth = String(1 + (i % 12)).padStart(2, "0");
    const iqamaDay = String(10 + (i % 18)).padStart(2, "0");
    const iqamaExpiry = `${iqamaYear}-${iqamaMonth}-${iqamaDay}`;

    const basicSalary = 5500 + (i % 12) * 450;
    const housingAllowance = Math.round(basicSalary * 0.25);
    const transportAllowance = Math.round(basicSalary * 0.1);
    const otherAllowance = i % 3 === 0 ? 500 : 0;
    const allowances = housingAllowance + transportAllowance + otherAllowance;

    const hireYear = 2018 + (i % 8);
    const hireMonth = String(1 + ((i * 3) % 12)).padStart(2, "0");
    const hireDate = `${hireYear}-${hireMonth}-01`;
    const contractType =
      i % 4 === 0
        ? "عقد عام دراسي (بتاريخ بداية ونهاية)"
        : i % 6 === 0
          ? "عقد فترة محددة / مؤقت (بتاريخ بداية ونهاية)"
          : isSaudi && i % 3 === 0
            ? "عقد غير محدد المدة"
            : "عقد محدد المدة";

    list.push({
      id: detUuid,
      emp_no: empNo,
      full_name: fullName,
      full_name_en: `Employee ${empNo} - Al-Andalus`,
      national_id: nationalId,
      id_type: isSaudi ? "الهوية الوطنية" : "الإقامة",
      nationality,
      gender,
      social_status: i % 4 === 0 ? "أعزب" : "متزوج",
      marital_status: i % 4 === 0 ? "أعزب" : "متزوج",
      religion: "مسلم",
      family_members_count: i % 4 === 0 ? 1 : 2 + (i % 5),
      branch: branchObj.name_ar,
      main_department: isGirlsBranch ? "بنات" : "بنين",
      department: dept,
      sector: "شركة مدارس الأندلس التعليمية",
      job_title: jobTitle,
      job_designation: jobTitle,
      job_level: jobTitle.includes("مشرف") || jobTitle.includes("قائد") ? "إشرافي" : "تعليمي",
      employment_category:
        dept.includes("الموارد") || dept.includes("المالية") || dept.includes("الإدارية")
          ? "إداري"
          : "تعليمي",
      specialization: spec,
      career_path: isInternational ? "العالمي" : "الأهلي",
      manager_name: i <= 18 ? "أحمد محمد السيد السيد" : branchObj.manager_name,
      phone,
      mobile: phone,
      email,
      short_address: shortAddress,
      postal_code: postalCode,
      building_no: buildingNo,
      street,
      district: branchObj.district,
      city,
      region: city,
      unit_no: String(1 + (i % 20)),
      current_address: `${city} - ${branchObj.district} - ${street} - مبنى ${buildingNo}`,
      iqama_expiry: iqamaExpiry,
      iqama_issue_place: city,
      last_qualification: i % 7 === 0 ? "ماجستير" : "بكالوريوس",
      basic_salary: basicSalary,
      housing_allowance: housingAllowance,
      transport_allowance: transportAllowance,
      other_allowance: otherAllowance,
      allowances,
      contract_type: contractType,
      bank_name: i % 3 === 0 ? "البنك الأهلي السعودي" : i % 3 === 1 ? "مصرف الراجحي" : "بنك الإنماء",
      iban: `SA${String(10 + (i % 89))}80000000608010${empNo}`,
      hire_date: hireDate,
      start_date: hireDate,
      contract_end: "2027-06-30",
      status: "نشط",
      employment_status: "active",
      created_at: `${hireDate}T08:00:00Z`,
      updated_at: "2026-11-01T08:00:00Z",
    });
  }

  _cachedEmployees = list;
  return list;
}

/**
 * توليد سجل تحديثات بيانات واقعي لموظفي مدارس الأندلس (منجز + قيد المراجعة)
 * بحيث يظهر في التقرير من قام بالتحديث (بالقيمة السابقة والجديدة والتاريخ) ومن لم يحدث بعد
 */
export function generateAndalusDataUpdateHistory(): DataUpdateRequestItem[] {
  if (_cachedUpdateRequests) return _cachedUpdateRequests;

  const employees = generateAndalusEmployees500();
  const items: DataUpdateRequestItem[] = [];

  // نجعل أول 315 موظفاً لديهم عمليات تحديث منجزة أو قيد الاعتماد، والـ 185 الباقين غير منجزين لاختبار الفلاتر بدقة!
  for (let idx = 0; idx < 315; idx++) {
    const emp = employees[idx]!;
    const reqNo = `DU-${String(1001 + idx).padStart(4, "0")}`;
    const dayNum = 1 + (idx % 28);
    const monthNum = idx % 3 === 0 ? "10" : "11";
    const dateStr = monthNum === "11" ? "2026-11-01" : `2026-10-${String(dayNum).padStart(2, "0")}`;
    const timeStr = `${String(8 + (idx % 10)).padStart(2, "0")}:${String(10 + (idx % 45)).padStart(2, "0")}`;

    // نوع التحديث حسب الموظف
    const pattern = idx % 4;
    const isPending = idx >= 290; // 25 طلباً قيد المراجعة، و 290 طلباً منجزاً ومعتمداً

    const oldPhone = `050${String(1100000 + idx * 91).slice(0, 7)}`;
    const newPhone = String(emp["phone"]);
    const oldEmail = `old.${emp["emp_no"]}@gmail.com`;
    const newEmail = String(emp["email"]);
    const oldAddress = `OLD-${1000 + idx}`;
    const newAddress = String(emp["short_address"]);
    const oldPostal = "11111";
    const newPostal = String(emp["postal_code"]);
    const oldBuilding = String(1000 + idx);
    const newBuilding = String(emp["building_no"]);
    const oldExpiry = "2025-12-30";
    const newExpiry = String(emp["iqama_expiry"]);

    if (pattern === 0 || pattern === 2) {
      // تحديث بيانات التواصل والعنوان الوطني والسكن (تحديث مباشر بإقرار الموظف)
      items.push({
        id: `seed-du-${idx + 1}`,
        requestNumber: reqNo,
        employeeId: String(emp["id"]),
        empNo: String(emp["emp_no"]),
        employeeName: String(emp["full_name"]),
        branch: String(emp["branch"]),
        department: String(emp["department"]),
        directManagerName: String(emp["manager_name"]),
        userGroupId: "ug-all-employees",
        userGroupName: "طلب عام (Public)",
        publishedRequestId: "pub-req-contact-address",
        publishedRequestTitle: "طلب تحديث بيانات التواصل والعنوان الوطني والسكن",
        fieldChanges: [
          { fieldKey: "phone", fieldLabel: "رقم الجوال", oldValue: oldPhone, newValue: newPhone },
          { fieldKey: "email", fieldLabel: "البريد الإلكتروني", oldValue: oldEmail, newValue: newEmail },
          {
            fieldKey: "short_address",
            fieldLabel: "العنوان الوطني",
            oldValue: oldAddress,
            newValue: newAddress,
          },
          {
            fieldKey: "postal_code",
            fieldLabel: "بريد السكن",
            oldValue: oldPostal,
            newValue: newPostal,
          },
          {
            fieldKey: "building_no",
            fieldLabel: "رقم المبنى",
            oldValue: oldBuilding,
            newValue: newBuilding,
          },
        ],
        updateMode: "direct",
        employeeDeclared: true,
        declaredAt: `${dateStr} ${timeStr}`,
        declarationTextSnapshot:
          "أقر بأنني راجعت بيانات التواصل والعنوان الوطني وتأكدت من صحتها وأوافق على إضافتها في النظام.",
        approvalGroupId: "ag-hr-main",
        approvalGroupName: "لا يخضع لسلسلة موافقة (تحديث مباشر بإقرار الموظف)",
        allowDirectManager: false,
        directManagerStatus: "not_required",
        fieldKey: "short_address",
        fieldLabel: "تحديث الجوال والإيميل والعنوان الوطني وبريد السكن ورقم المبنى",
        oldValue: oldAddress,
        newValue: newAddress,
        reason: "تحديث بيانات التواصل والعنوان الوطني السنوي لمنسوبي مدارس الأندلس",
        status: "approved",
        awaitingText: "تم التحديث في النظام فوراً بإقرار الموظف ✓",
        authorizedApproverNames: ["تحديث مباشر بإقرار الموظف"],
        appliedToEmployeeRecord: true,
        decisionBy: `${emp["full_name"]} (إقرار مباشر OK)`,
        decisionAt: dateStr,
        replies: [],
        createdAt: `${dateStr}T${timeStr}:00Z`,
      });
    } else {
      // تحديث شامل شاملاً بيانات الإقامة والهوية والعنوان (يخضع لسلسلة موافقة)
      items.push({
        id: `seed-du-${idx + 1}`,
        requestNumber: reqNo,
        employeeId: String(emp["id"]),
        empNo: String(emp["emp_no"]),
        employeeName: String(emp["full_name"]),
        branch: String(emp["branch"]),
        department: String(emp["department"]),
        directManagerName: String(emp["manager_name"]),
        userGroupId: "ug-all-employees",
        userGroupName: "طلب عام (Public)",
        publishedRequestId: "pub-req-iqama-identity",
        publishedRequestTitle: "طلب تحديث بيانات الإقامة والتواصل والعنوان الوطني",
        fieldChanges: [
          { fieldKey: "phone", fieldLabel: "رقم الجوال", oldValue: oldPhone, newValue: newPhone },
          { fieldKey: "email", fieldLabel: "البريد الإلكتروني", oldValue: oldEmail, newValue: newEmail },
          {
            fieldKey: "short_address",
            fieldLabel: "العنوان الوطني",
            oldValue: oldAddress,
            newValue: newAddress,
          },
          {
            fieldKey: "postal_code",
            fieldLabel: "بريد السكن",
            oldValue: oldPostal,
            newValue: newPostal,
          },
          {
            fieldKey: "building_no",
            fieldLabel: "رقم المبنى",
            oldValue: oldBuilding,
            newValue: newBuilding,
          },
          {
            fieldKey: "iqama_expiry",
            fieldLabel: "بيانات الإقامة",
            oldValue: oldExpiry,
            newValue: newExpiry,
          },
        ],
        updateMode: "approval_required",
        employeeDeclared: true,
        declaredAt: `${dateStr} ${timeStr}`,
        declarationTextSnapshot:
          "أقر بأن بيانات الإقامة والتواصل والعنوان المدخلة صحيحة ومطابقة للمستندات الرسمية.",
        approvalGroupId: "ag-branch-ops",
        approvalGroupName: "مجموعة اعتماد الهوية والبيانات الرسمية",
        allowDirectManager: true,
        directManagerStatus: isPending ? "pending" : "approved",
        fieldKey: "iqama_expiry",
        fieldLabel: "بيانات الإقامة والتواصل والعنوان الوطني",
        oldValue: oldExpiry,
        newValue: newExpiry,
        reason: "تجديد الإقامة وتحديث بيانات العنوان الوطني في نظام مدارس الأندلس",
        status: isPending ? "pending" : "approved",
        awaitingText: isPending
          ? `بانتظار موافقة: ${emp["manager_name"]} / مجموعة اعتماد الهوية`
          : "تم الاعتماد والتحديث في النظام ✓",
        authorizedApproverNames: ["مدير الشؤون الإدارية والعمليات"],
        appliedToEmployeeRecord: !isPending,
        decisionBy: isPending ? undefined : "مدير الشؤون الإدارية والعمليات",
        decisionAt: isPending ? undefined : dateStr,
        replies: [],
        createdAt: `${dateStr}T${timeStr}:00Z`,
      });
    }
  }

  _cachedUpdateRequests = items;
  return items;
}

const _tableSeedCache = new Map<string, Row[]>();

/**
 * توليد البيانات التجريبية الشاملة لجميع جداول النظام (550 موظف، مسيرات رواتب، حضور وبصمة، إجازات، سلف، مساءلات، أذونات، مراسلات، نهاية خدمة، طلبات اعتماد، مهام، لوائح)
 */
export function generateAndalusSeedForTable(table: string): Row[] {
  const cached = _tableSeedCache.get(table);
  if (cached) return cached;

  const employees = generateAndalusEmployees500();
  let rows: Row[] = [];

  switch (table) {
    case "employees": {
      rows = employees;
      break;
    }

    case "departments": {
      rows = ANDALUS_DEPARTMENTS.map((dName, i) => {
        const br = ANDALUS_BRANCHES[i % ANDALUS_BRANCHES.length]!;
        return {
          id: `andalus-dept-${i + 1}`,
          name: dName,
          branch: br.name_ar,
          manager_name: br.manager_name,
          created_at: "2026-01-01T00:00:00Z",
        };
      });
      break;
    }

    case "basic_lookups": {
      const lookups: Row[] = [];
      for (const br of ANDALUS_BRANCHES) {
        lookups.push({
          id: `lookup-br-${br.code}`,
          category: "الفروع",
          code: br.code,
          name: br.name_ar,
          name_ar: br.name_ar,
          name_en: br.name_en,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
        });
      }
      ANDALUS_DEPARTMENTS.forEach((deptName, i) => {
        lookups.push({
          id: `lookup-dept-${i + 1}`,
          category: "الأقسام",
          code: `DEP-${i + 1}`,
          name: deptName,
          name_ar: deptName,
          name_en: `Department ${i + 1}`,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
        });
      });
      const banks = [
        { ar: "مصرف الراجحي", en: "Al Rajhi Bank", code: "RJHI", sabb: "80" },
        { ar: "البنك الأهلي السعودي", en: "Saudi National Bank (SNB)", code: "NCBK", sabb: "10" },
        { ar: "مصرف الإنماء", en: "Alinma Bank", code: "INMA", sabb: "05" },
        { ar: "بنك الرياض", en: "Riyad Bank", code: "RIBL", sabb: "20" },
        { ar: "بنك البلاد", en: "Bank Albilad", code: "ALBI", sabb: "15" },
        { ar: "البنك السعودي الفرنسي", en: "Banque Saudi Fransi", code: "BSFR", sabb: "55" },
      ];
      banks.forEach((b, i) => {
        lookups.push({
          id: `lookup-bank-${i + 1}`,
          category: "البنوك",
          code: b.code,
          sabb_code: b.sabb,
          name_ar: b.ar,
          name_en: b.en,
          flag: true,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
        });
      });
      rows = lookups;
      break;
    }

    case "payroll_runs": {
      const totalGross = employees.reduce(
        (sum, e) => sum + Number(e["basic_salary"] || 0) + Number(e["allowances"] || 0),
        0,
      );
      const totalDed = Math.round(totalGross * 0.068);
      const totalNet = totalGross - totalDed;

      const monthsList = [
        { year: 2026, month: 11, label: "نوفمبر 2026", status: "مسودة" },
        { year: 2026, month: 10, label: "أكتوبر 2026", status: "مقفل" },
        { year: 2026, month: 9, label: "سبتمبر 2026", status: "مقفل" },
        { year: 2026, month: 8, label: "أغسطس 2026", status: "مقفل" },
        { year: 2026, month: 7, label: "يوليو 2026", status: "مقفل" },
        { year: 2026, month: 6, label: "يونيو 2026", status: "مقفل" },
        { year: 2026, month: 5, label: "مايو 2026", status: "مقفل" },
        { year: 2026, month: 4, label: "أبريل 2026", status: "مقفل" },
        { year: 2026, month: 3, label: "مارس 2026", status: "مقفل" },
        { year: 2026, month: 2, label: "فبراير 2026", status: "مقفل" },
        { year: 2026, month: 1, label: "يناير 2026", status: "مقفل" },
        { year: 2025, month: 12, label: "ديسمبر 2025", status: "مقفل" },
        { year: 2025, month: 11, label: "نوفمبر 2025", status: "مقفل" },
        { year: 2025, month: 10, label: "أكتوبر 2025", status: "مقفل" },
        { year: 2025, month: 9, label: "سبتمبر 2025", status: "مقفل" },
        { year: 2025, month: 8, label: "أغسطس 2025", status: "مقفل" },
      ];

      rows = monthsList.map((m, idx) => {
        const variance = 1 - (idx % 4) * 0.005;
        const g = Math.round(totalGross * variance);
        const d = Math.round(totalDed * variance);
        const n = g - d;
        const mStr = String(m.month).padStart(2, "0");
        return {
          id: `pr-andalus-${m.year}-${mStr}`,
          run_no: `PR-${m.year}-${mStr}`,
          title: `مسير رواتب شركة مدارس الأندلس التعليمية — ${m.label}`,
          month: m.month,
          year: m.year,
          branch: "جميع فروع مدارس الأندلس (18 فرعاً)",
          payroll_type: "رواتب",
          status: m.status,
          employees_count: employees.length,
          total_gross: g,
          total_deductions: d,
          total_net: n,
          closed_at: `${m.year}-${mStr}-27`,
          created_at: `${m.year}-${mStr}-25T09:00:00Z`,
          updated_at: `${m.year}-${mStr}-27T14:00:00Z`,
        };
      });
      break;
    }

    case "entitlements": {
      rows = [
        { id: "ent-1", name: "بدل سكن (25%)", calc_type: "نسبة مئوية", amount: 25, gosi_subject: true, active: true, notes: "بدل سكن 25% من الراتب الأساسي", created_at: "2026-01-01T08:00:00Z" },
        { id: "ent-2", name: "بدل نقل ومواصلات (10%)", calc_type: "نسبة مئوية", amount: 10, gosi_subject: false, active: true, notes: "بدل مواصلات شهري", created_at: "2026-01-01T08:00:00Z" },
        { id: "ent-3", name: "بدل طبيعة عمل وتدريس", calc_type: "مبلغ ثابت", amount: 500, gosi_subject: false, active: true, notes: "خاص بالكادر التعليمي في مدارس الأندلس", created_at: "2026-01-01T08:00:00Z" },
        { id: "ent-4", name: "بدل إشراف تربوي وقيادة مدرسية", calc_type: "مبلغ ثابت", amount: 1200, gosi_subject: false, active: true, notes: "لقادة المدارس والمشرفين التربويين", created_at: "2026-01-01T08:00:00Z" },
        { id: "ent-5", name: "مكافأة تميز أكاديمي", calc_type: "مبلغ ثابت", amount: 1000, gosi_subject: false, active: true, notes: "تصرف للمتميزين في تقييم الأداء الفصلي", created_at: "2026-01-01T08:00:00Z" },
        { id: "ent-6", name: "بدل حصص إضافية ومناوبات", calc_type: "مبلغ ثابت", amount: 450, gosi_subject: false, active: true, notes: "بدل تكليف بالحصص الإضافية", created_at: "2026-01-01T08:00:00Z" },
      ];
      break;
    }

    case "deductions": {
      rows = [
        { id: "ded-1", name: "التأمينات الاجتماعية للسعوديين (GOSI 9.75%)", calc_type: "نسبة مئوية", amount: 9.75, active: true, notes: "استقطاع نظامي للموظفين السعوديين", created_at: "2026-01-01T08:00:00Z" },
        { id: "ded-2", name: "خصم غياب بدون عذر (بصمة)", calc_type: "يومي", amount: 1, active: true, notes: "خصم أجر يوم عمل عن كل يوم غياب", created_at: "2026-01-01T08:00:00Z" },
        { id: "ded-3", name: "خصم تأخير صباحي متكرر", calc_type: "مبلغ ثابت", amount: 150, active: true, notes: "حسب لائحة خصومات البصمة", created_at: "2026-01-01T08:00:00Z" },
        { id: "ded-4", name: "قسط سلفة شخصية", calc_type: "مبلغ ثابت", amount: 500, active: true, notes: "استقطاع شهري لسداد السلفة", created_at: "2026-01-01T08:00:00Z" },
        { id: "ded-5", name: "نسبة تحمل التأمين الطبي للمرافقين", calc_type: "مبلغ ثابت", amount: 250, active: true, notes: "استقطاع شهري للتأمين الطبي الإضافي", created_at: "2026-01-01T08:00:00Z" },
      ];
      break;
    }

    case "employee_entitlements": {
      rows = employees.slice(0, 250).map((emp, idx) => ({
        id: `emp-ent-${idx + 1}`,
        employee_id: emp["id"],
        emp_no: emp["emp_no"],
        employee_name: emp["full_name"],
        branch: emp["branch"],
        department: emp["department"],
        entitlement_name: idx % 3 === 0 ? "مكافأة تميز أكاديمي" : idx % 2 === 0 ? "بدل طبيعة عمل وتدريس" : "بدل إشراف تربوي وقيادة مدرسية",
        amount: idx % 3 === 0 ? 1000 : idx % 2 === 0 ? 500 : 1200,
        is_percentage: false,
        year: "2026",
        month: String(1 + (idx % 11)).padStart(2, "0"),
        notes: "2026-10 | استحقاق معتمد في مسير الرواتب",
        created_at: "2026-10-15T08:00:00Z",
      }));
      break;
    }

    case "employee_deductions": {
      rows = employees.slice(0, 180).map((emp, idx) => ({
        id: `emp-ded-${idx + 1}`,
        employee_id: emp["id"],
        emp_no: emp["emp_no"],
        employee_name: emp["full_name"],
        branch: emp["branch"],
        department: emp["department"],
        deduction_name: idx % 3 === 0 ? "خصم تأخير صباحي متكرر" : idx % 2 === 0 ? "قسط سلفة شخصية" : "خصم غياب بدون عذر (بصمة)",
        amount: idx % 3 === 0 ? 150 : idx % 2 === 0 ? 500 : 240,
        is_percentage: false,
        year: "2026",
        month: String(1 + (idx % 11)).padStart(2, "0"),
        notes: "2026-10 | استقطاع مطبق في المسير",
        created_at: "2026-10-15T08:00:00Z",
      }));
      break;
    }

    case "attendance_records":
    case "fingerprint_records": {
      rows = employees.slice(0, 500).map((emp, idx) => {
        const isAbsent = idx % 14 === 0;
        const isLate = !isAbsent && idx % 5 === 0;
        const day = String(1 + (idx % 28)).padStart(2, "0");
        const workDate = `2026-10-${day}`;
        const lateMins = isLate ? 15 + (idx % 35) : 0;
        return {
          id: `att-andalus-${idx + 1}`,
          employee_id: emp["id"],
          emp_no: emp["emp_no"],
          employee_name: emp["full_name"],
          branch: emp["branch"],
          department: emp["department"],
          work_date: workDate,
          record_date: workDate,
          date: workDate,
          check_in: isAbsent ? null : isLate ? `07:${String(15 + (idx % 35)).padStart(2, "0")}:00` : "06:55:00",
          check_out: isAbsent ? null : "14:15:00",
          late_minutes: lateMins,
          status: isAbsent ? "غائب" : isLate ? "متأخر" : "حاضر",
          created_at: `${workDate}T07:00:00Z`,
        };
      });
      break;
    }

    case "work_shift_groups": {
      rows = [
        { id: "sh-1", name: "دوام الكادر التعليمي الصباحي (مدارس الأندلس)", branch: "جميع الفروع التعليمية", start_time: "06:45", end_time: "14:00", grace_minutes: 15, break_minutes: 30, work_days: "الأحد - الخميس", active: true, notes: "الدوام الرسمي للمعلمين والمعلمات" },
        { id: "sh-2", name: "دوام الإدارة العامة والكادر الإداري", branch: "الإدارة العامة - شركة مدارس الأندلس التعليمية (جدة)", start_time: "08:00", end_time: "16:00", grace_minutes: 15, break_minutes: 60, work_days: "الأحد - الخميس", active: true, notes: "دوام الموظفين الإداريين والماليين" },
        { id: "sh-3", name: "دوام رياض الأطفال والطفولة المبكرة", branch: "جميع الفروع", start_time: "07:00", end_time: "13:00", grace_minutes: 15, break_minutes: 30, work_days: "الأحد - الخميس", active: true, notes: "دوام معلمات رياض الأطفال" },
        { id: "sh-4", name: "دوام المسار الدولي (Al-Andalus International)", branch: "مدارس الأندلس العالمية - فرع جدة (Al-Andalus International)", start_time: "07:30", end_time: "15:00", grace_minutes: 10, break_minutes: 45, work_days: "الأحد - الخميس", active: true, notes: "دوام الدبلوما الأمريكية والبريطانية" },
      ];
      break;
    }

    case "leave_requests": {
      const leaveTypes = ["أجازة سنوية", "أجازة مرضية", "أجازة اضطرارية", "أجازة بدون راتب", "أجازة وضع", "أجازة زواج"];
      rows = employees.slice(0, 120).map((emp, idx) => {
        const days = 2 + (idx % 10);
        const startDay = String(1 + (idx % 18)).padStart(2, "0");
        const endDay = String(Math.min(28, Number(startDay) + days)).padStart(2, "0");
        const status = idx % 5 === 0 ? "بانتظار الموافقة" : idx % 9 === 0 ? "مرفوضة" : "معتمدة";
        return {
          id: `lv-andalus-${idx + 1}`,
          employee_id: emp["id"],
          emp_no: emp["emp_no"],
          employee_name: emp["full_name"],
          branch: emp["branch"],
          department: emp["department"],
          leave_type: leaveTypes[idx % leaveTypes.length],
          from_date: `2026-10-${startDay}`,
          to_date: `2026-10-${endDay}`,
          start_date: `2026-10-${startDay}`,
          end_date: `2026-10-${endDay}`,
          days,
          balance_before: 30,
          status,
          notes: "طلب إجازة مقدم عبر بوابة الموظف الإلكترونية لمدارس الأندلس",
          created_at: `2026-10-${startDay}T09:00:00Z`,
        };
      });
      break;
    }

    case "loans": {
      const loanTypes = ["سلفة شخصية", "سلفة طارئة", "سلفة سكن", "سلفة زواج", "سلفة سيارة"];
      rows = employees.slice(0, 90).map((emp, idx) => {
        const amount = 6000 + (idx % 8) * 3000;
        const installments = 12;
        const monthlyAmount = Math.round(amount / installments);
        const paidMonths = idx % 10;
        const paidAmount = Math.min(amount, paidMonths * monthlyAmount);
        const isPaid = paidAmount >= amount;
        return {
          id: `loan-andalus-${idx + 1}`,
          employee_id: emp["id"],
          emp_no: emp["emp_no"],
          employee_name: emp["full_name"],
          national_id: emp["national_id"],
          branch: emp["branch"],
          department: emp["department"],
          main_department: emp["main_department"],
          sector: emp["sector"],
          path: emp["career_path"],
          job_title: emp["job_title"],
          nationality: emp["nationality"],
          basic_salary: emp["basic_salary"],
          allowances: emp["allowances"],
          total_salary: Number(emp["basic_salary"]) + Number(emp["allowances"]),
          loan_type: loanTypes[idx % loanTypes.length],
          loan_name: `${loanTypes[idx % loanTypes.length]} — ${emp["full_name"]}`,
          amount,
          approved_amount: amount,
          installments,
          monthly_amount: monthlyAmount,
          paid_amount: paidAmount,
          deduction_method: "تخصم شهريا",
          request_date: "2026-03-10",
          entry_date: "2026-03-10",
          start_date: "2026-04-01",
          first_installment_date: "2026-04-01",
          month: 4,
          year: 2026,
          request_status: idx % 8 === 0 ? "بانتظار الموافقة" : "معتمدة",
          status: isPaid ? "مسددة" : "قيد السداد",
          stage: idx % 8 === 0 ? "المدير المالي" : "منتهية",
          expense_account: "110401 - ذمم وسلف العاملين",
          account_name: "حساب سلف منسوبي مدارس الأندلس",
          posted: idx % 8 !== 0,
          notes: "يخصم القسط شهرياً من مسير الرواتب",
          created_at: "2026-03-10T10:00:00Z",
        };
      });
      break;
    }

    case "inquiries": {
      const inqNames = ["غياب الى من البصمة", "مسائلة تأخير", "مسائلة انصراف مبكر", "مسائلة غياب"];
      const inqTypes = ["غياب", "تأخير", "انصراف مبكر", "غياب"];
      rows = employees.slice(0, 95).map((emp, idx) => {
        const day = String(1 + (idx % 25)).padStart(2, "0");
        const dateStr = `2026-10-${day}`;
        return {
          id: `inq-andalus-${idx + 1}`,
          employee_id: emp["id"],
          emp_no: emp["emp_no"],
          employee_name: emp["full_name"],
          national_id: emp["national_id"],
          branch: emp["branch"],
          department: emp["department"],
          main_department: emp["main_department"],
          sector: emp["sector"],
          path: emp["career_path"],
          inquiry_name: inqNames[idx % inqNames.length],
          inquiry_type: inqTypes[idx % inqTypes.length],
          inquiry_date: dateStr,
          entry_date: dateStr,
          status: idx % 3 === 0 ? "قيد التنفيذ" : "مغلقة (مقبول)",
          source: "تلقائي",
          user_name: emp["manager_name"] || "إدارة شؤون المعلمين",
          approved_by: "إدارة الموارد البشرية",
          employee_reply: idx % 3 === 0 ? "بانتظار الرد" : "تم إرفاق العذر الطبي والمهمة الرسمية",
          email_sent: true,
          active: true,
          notes: `مساءلة مسجلة بتاريخ ${dateStr} عبر نظام البصمة`,
          created_at: `${dateStr}T08:30:00Z`,
        };
      });
      break;
    }

    case "employee_permits": {
      rows = employees.slice(0, 90).map((emp, idx) => {
        const day = String(1 + (idx % 25)).padStart(2, "0");
        const dateStr = `2026-10-${day}`;
        const kind = idx % 3 === 0 ? "تأخير" : idx % 3 === 1 ? "انصراف مبكر" : "إذن شخصي";
        return {
          id: `perm-andalus-${idx + 1}`,
          employee_id: emp["id"],
          emp_no: emp["emp_no"],
          employee_name: emp["full_name"],
          national_id: emp["national_id"],
          branch: emp["branch"],
          department: emp["department"],
          main_department: emp["main_department"],
          sector: emp["sector"],
          career_path: emp["career_path"],
          kind,
          permit_type: kind === "تأخير" ? "إذن تأخير" : kind === "انصراف مبكر" ? "إذن انصراف مبكر" : "إذن بالساعات",
          permission_date: dateStr,
          entry_date: dateStr,
          status: idx % 4 === 0 ? "بانتظار الموافقة" : "معتمد",
          user_name: emp["manager_name"],
          morning_shift_in: "06:45",
          actual_morning_in: kind === "تأخير" ? "07:35" : "06:45",
          evening_shift_out: "14:00",
          actual_evening_out: kind === "انصراف مبكر" ? "12:30" : "14:00",
          total_minutes: kind === "تأخير" ? 50 : 90,
          notes: "إذن مسجل ومعتمد من إدارة المدرسة",
          created_at: `${dateStr}T09:00:00Z`,
        };
      });
      break;
    }

    case "employee_correspondence": {
      const subjects = [
        "خطاب تعريف بالراتب موجه للبنك",
        "خطاب شكر وتقدير للتميز في الأداء الأكاديمي",
        "تكليف بالإشراف على الاختبارات الفصلية",
        "قرار نقل داخلي بين فروع مدارس الأندلس",
        "خطاب تجديد عقد العمل للعام الدراسي الجديد",
      ];
      rows = employees.slice(0, 65).map((emp, idx) => ({
        id: `corr-andalus-${idx + 1}`,
        employee_id: emp["id"],
        emp_no: emp["emp_no"],
        employee_name: emp["full_name"],
        branch: emp["branch"],
        department: emp["department"],
        subject: subjects[idx % subjects.length],
        correspondence_type: idx % 2 === 0 ? "صادر" : "داخلي",
        correspondence_date: `2026-10-${String(1 + (idx % 26)).padStart(2, "0")}`,
        status: "معتمد ومرسل",
        notes: "تم إصدار الخطاب إلكترونياً من إدارة الموارد البشرية بمدارس الأندلس",
        created_at: "2026-10-15T10:00:00Z",
      }));
      break;
    }

    case "approval_requests":
    case "requests": {
      const reqTypes = [
        "طلب إجازة",
        "طلب سلفة",
        "أذن إنصراف مبكر",
        "أذن تأخير",
        "طلب تحديث بيانات",
        "طلب تعريف بالراتب",
      ];
      rows = employees.slice(0, 110).map((emp, idx) => {
        const day = String(1 + (idx % 27)).padStart(2, "0");
        const rType = reqTypes[idx % reqTypes.length]!;
        const st = idx % 3 === 0 ? "pending" : idx % 10 === 0 ? "rejected" : "approved";
        return {
          id: `app-req-${idx + 1}`,
          employee_id: emp["id"],
          emp_no: emp["emp_no"],
          employee_name: emp["full_name"],
          branch: emp["branch"],
          department: emp["department"],
          request_type: rType,
          category: rType.includes("سلفة") || rType.includes("راتب") ? "مالية" : "إدارية وشؤون معلمين",
          request_date: `2026-10-${day}T09:15:00Z`,
          entered_at: `2026-10-${day}T09:15:00Z`,
          approval_chain: "موارد بشرية",
          direct_manager_name: emp["manager_name"] || "أ. حمدان مانع العمري",
          awaiting_approver_name: st === "pending" ? "مدير الموارد البشرية" : "مكتمل الاعتماد",
          status: st,
          amount: rType === "طلب سلفة" ? 6000 : 0,
          notes: `${rType} مقدم من ${emp["full_name"]} (${emp["branch"]})`,
          created_at: `2026-10-${day}T09:15:00Z`,
        };
      });
      break;
    }

    case "employee_documents": {
      const docTypes = ["الهوية الوطنية / الإقامة", "جواز السفر", "عقد العمل الموثق", "المؤهل الجامعي", "الرخصة المهنية للمعلمين"];
      rows = employees.slice(0, 300).map((emp, idx) => ({
        id: `doc-andalus-${idx + 1}`,
        employee_id: emp["id"],
        emp_no: emp["emp_no"],
        employee_name: emp["full_name"],
        branch: emp["branch"],
        department: emp["department"],
        doc_type: docTypes[idx % docTypes.length],
        doc_no: `DOC-${emp["emp_no"]}-${idx + 1}`,
        issue_date: "2024-09-01",
        expiry_date: emp["iqama_expiry"] || "2027-09-01",
        status: "ساري",
        notes: "مستند رسمي محفوظ في أرشيف الموظف",
        created_at: "2026-01-15T08:00:00Z",
      }));
      break;
    }

    case "employee_relatives": {
      rows = employees.slice(0, 220).map((emp, idx) => ({
        id: `rel-andalus-${idx + 1}`,
        employee_id: emp["id"],
        emp_no: emp["emp_no"],
        employee_name: emp["full_name"],
        branch: emp["branch"],
        relative_name: idx % 2 === 0 ? `مرافق أول - ${emp["full_name"]}` : `مرافق ثانٍ - ${emp["full_name"]}`,
        relation: idx % 3 === 0 ? "زوج / زوجة" : idx % 3 === 1 ? "ابن" : "ابنة",
        birth_date: idx % 3 === 0 ? "1992-05-14" : "2018-09-10",
        national_id: `25${String(41000000 + idx * 173).slice(0, 8)}`,
        insurance_class: "VIP - A",
        insurance_company: "بوبا العربية للتأمين التعاوني",
        created_at: "2026-01-15T08:00:00Z",
      }));
      break;
    }

    case "employee_eos_provisions": {
      rows = employees.slice(0, 200).map((emp, idx) => {
        const years = 2 + (idx % 7);
        const salary = Number(emp["basic_salary"] || 6500) + Number(emp["allowances"] || 1800);
        const accrued = Math.round((salary / 2) * years);
        return {
          id: `eos-prov-${idx + 1}`,
          employee_id: emp["id"],
          emp_no: emp["emp_no"],
          employee_name: emp["full_name"],
          branch: emp["branch"],
          department: emp["department"],
          hire_date: emp["hire_date"],
          service_years: years,
          last_salary: salary,
          accrued_amount: accrued,
          month: 10,
          year: 2026,
          status: "محتسب ومرحل",
          created_at: "2026-10-28T10:00:00Z",
        };
      });
      break;
    }

    case "end_of_service_requests": {
      rows = employees.slice(0, 25).map((emp, idx) => {
        const salary = Number(emp["basic_salary"] || 6500) + Number(emp["allowances"] || 1800);
        return {
          id: `eos-req-${idx + 1}`,
          employee_id: emp["id"],
          emp_no: emp["emp_no"],
          employee_name: emp["full_name"],
          branch: emp["branch"],
          department: emp["department"],
          job_title: emp["job_title"],
          hire_date: emp["hire_date"],
          last_working_day: "2026-10-30",
          termination_reason: idx % 2 === 0 ? "انتهاء مدة العقد" : "استقالة",
          service_years: 4,
          eos_award: Math.round(salary * 2),
          leave_compensation: Math.round((salary / 30) * 18),
          net_settlement: Math.round(salary * 2.6),
          status: idx % 3 === 0 ? "بانتظار الاعتماد" : "معتمد ومصفى",
          created_at: "2026-10-20T10:00:00Z",
        };
      });
      break;
    }

    case "tasks": {
      rows = [
        { id: "tsk-1", title: "مراجعة واعتماد مسير رواتب فروع مدارس الأندلس لشهر أكتوبر 2026", category: "الرواتب والشؤون المالية", priority: "عاجل جداً", status: "مكتملة", assignee_name: "أ. حمدان مانع العمري", branch: "جميع الفروع", due_date: "2026-10-27", created_at: "2026-10-20T08:00:00Z" },
        { id: "tsk-2", title: "متابعة تقرير إنجاز تحديث بيانات الموظفين (550 موظف)", category: "شؤون الموظفين", priority: "مرتفعة", status: "قيد التنفيذ", assignee_name: "أحمد محمد السيد السيد", branch: "مدارس الأندلس الأهلية - فرع الرياض (بنين - حي قرطبة)", due_date: "2026-11-10", created_at: "2026-11-01T08:00:00Z" },
        { id: "tsk-3", title: "تجديد عقود العام الدراسي وتفعيلها على النظام", category: "العقود والوثائق", priority: "مرتفعة", status: "مكتملة", assignee_name: "د. عبدالله بن صالح الغامدي", branch: "الإدارة العامة - شركة مدارس الأندلس التعليمية (جدة)", due_date: "2026-11-05", created_at: "2026-10-25T08:00:00Z" },
        { id: "tsk-4", title: "إصدار ملف حماية الأجور WPS للبنوك المعتمدة", category: "الرواتب والشؤون المالية", priority: "عاجل جداً", status: "مكتملة", assignee_name: "إدارة الشؤون المالية", branch: "جميع الفروع", due_date: "2026-10-28", created_at: "2026-10-26T08:00:00Z" },
      ];
      break;
    }

    case "announcements": {
      rows = [
        { id: "ann-1", title: "تعميم: تحديث بيانات التواصل والعنوان الوطني لمنسوبي مدارس الأندلس", kind: "تعميم إداري", target: "جميع الفروع (550 موظف)", body: "نأمل من جميع المعلمين والإداريين الدخول على بوابة الموظف ومراجعة وتحديث بيانات التواصل والعنوان الوطني.", created_at: "2026-11-01T08:00:00Z" },
        { id: "ann-2", title: "إيداع مسير رواتب شهر أكتوبر 2026 لجميع فروع شركة مدارس الأندلس", kind: "إشعار مالي", target: "جميع الموظفين", body: "تم اعتماد وصرف رواتب شهر أكتوبر 2026 وإيداعها في الحسابات البنكية لمنسوبي الشركة.", created_at: "2026-10-27T11:00:00Z" },
        { id: "ann-3", title: "تفعيل عقود العام الدراسي الجديد بتاريخ بداية وتاريخ نهاية على النظام", kind: "تعميم شؤون المعلمين", target: "الكادر التعليمي والإداري", body: "تم تفعيل العقود المحددة بتاريخ بداية وتاريخ نهاية للعام الدراسي 2026-2027 في النظام.", created_at: "2026-10-15T09:00:00Z" },
      ];
      break;
    }

    case "regulation_rules": {
      rows = [
        { id: "reg-1", name: "لائحة الإجازة السنوية للكادر التعليمي والإداري", category: "الإجازات", value_type: "أيام", days: 30, amount: 0, active: true, notes: "30 يوماً مدفوعة الأجر سنوياً", created_at: "2026-01-01T08:00:00Z" },
        { id: "reg-2", name: "لائحة خصم التأخير الصباحي (أكثر من 15 دقيقة)", category: "خصومات البصمة", value_type: "نسبة يوم", days: 1, amount: 25, active: true, notes: "تطبق بعد فترة السماح الصباحية", created_at: "2026-01-01T08:00:00Z" },
        { id: "reg-3", name: "لائحة السلف الشخصية (الحد الأقصى 3 رواتب أساسية)", category: "السلف", value_type: "أشهر", days: 12, amount: 15000, active: true, notes: "تقسط على 12 شهراً بدون فوائد", created_at: "2026-01-01T08:00:00Z" },
      ];
      break;
    }

    case "account_links": {
      rows = ANDALUS_BRANCHES.slice(0, 10).map((br, idx) => ({
        id: `acc-link-${idx + 1}`,
        branch: br.name_ar,
        department: ANDALUS_DEPARTMENTS[idx % ANDALUS_DEPARTMENTS.length],
        main_department: idx % 2 === 0 ? "بنين" : "بنات",
        sector: "شركة مدارس الأندلس التعليمية",
        link_type: "رواتب واستحقاقات",
        operation_type: "قيد مسير الرواتب الشهري",
        item_name: "الراتب الأساسي والبدلات",
        debit_account: "510101 - مصروف الرواتب والأجور",
        credit_account: "210301 - الرواتب المستحقة للصرف",
        expense_account: "510101 - مصروف الرواتب والأجور",
        provision_account: "220101 - مخصص مكافأة نهاية الخدمة",
        cost_center: `CC-${br.code}`,
        active: true,
        notes: `ربط محاسبي آلي لفرع ${br.city}`,
        created_at: "2026-01-01T08:00:00Z",
      }));
      break;
    }

    default:
      rows = [];
  }

  _tableSeedCache.set(table, rows);
  return rows;
}

