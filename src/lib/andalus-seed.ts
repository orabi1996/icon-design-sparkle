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

  // الموظف رقم 1: أحمد محمد السيد السيد (حساب الموظف الأساسي 10078)
  list.push({
    id: "emp-andalus-10078",
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
    allowances: 1850,
    bank_name: "مصرف الراجحي",
    iban: "SA4480000412608010100780",
    hire_date: "2022-08-25",
    start_date: "2022-08-25",
    contract_end: "2027-06-30",
    status: "active",
    created_at: "2026-01-10T08:00:00Z",
    updated_at: "2026-11-01T08:00:00Z",
  });

  // توليد 499 موظفاً إضافياً ليصبح الإجمالي 500 موظف بالضبط
  for (let i = 1; i <= 499; i++) {
    const empNoNum = 10000 + i + (10000 + i >= 10078 ? 1 : 0);
    const empNo = String(empNoNum);

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
    const fName = firstPool[i % firstPool.length]!;
    const mName1 = MIDDLE_NAMES[(i * 3) % MIDDLE_NAMES.length]!;
    const mName2 = MIDDLE_NAMES[(i * 7 + 5) % MIDDLE_NAMES.length]!;
    const lName = isSaudi
      ? FAMILY_NAMES_SAUDI[(i * 5) % FAMILY_NAMES_SAUDI.length]!
      : FAMILY_NAMES_RESIDENT[(i * 5) % FAMILY_NAMES_RESIDENT.length]!;

    const fullName = `${fName} ${mName1} ${mName2} ${lName}`;
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
    const allowances = Math.round(basicSalary * 0.35);

    const hireYear = 2018 + (i % 8);
    const hireMonth = String(1 + ((i * 3) % 12)).padStart(2, "0");
    const hireDate = `${hireYear}-${hireMonth}-01`;

    list.push({
      id: `emp-andalus-${empNo}`,
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
      manager_name: branchObj.manager_name,
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
      allowances,
      bank_name: i % 3 === 0 ? "البنك الأهلي السعودي" : i % 3 === 1 ? "مصرف الراجحي" : "بنك الإنماء",
      iban: `SA${String(10 + (i % 89))}80000000608010${empNo}`,
      hire_date: hireDate,
      start_date: hireDate,
      contract_end: "2027-06-30",
      status: "active",
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

    if (pattern === 0) {
      // تحديث بيانات التواصل والعنوان الوطني والسكن (تحديث مباشر بإقرار الموظف)
      const oldPhone = `050${String(1100000 + idx * 91).slice(0, 7)}`;
      const newPhone = String(emp["phone"]);
      const oldAddress = `OLD-${1000 + idx}`;
      const newAddress = String(emp["short_address"]);
      const oldPostal = "11111";
      const newPostal = String(emp["postal_code"]);
      const oldBuilding = String(1000 + idx);
      const newBuilding = String(emp["building_no"]);

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
          {
            fieldKey: "short_address",
            fieldLabel: "العنوان الوطني (العنوان المختصر)",
            oldValue: oldAddress,
            newValue: newAddress,
          },
          {
            fieldKey: "postal_code",
            fieldLabel: "بريد السكن (الرمز البريدي)",
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
        fieldLabel: "تحديث الجوال والعنوان الوطني ورقم المبنى وبريد السكن",
        oldValue: `جوال: ${oldPhone} | عنوان وطني: ${oldAddress} | مبنى: ${oldBuilding} | بريد: ${oldPostal}`,
        newValue: `جوال: ${newPhone} | عنوان وطني: ${newAddress} | مبنى: ${newBuilding} | بريد: ${newPostal}`,
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
    } else if (pattern === 1) {
      // تحديث بيانات الإقامة والهوية (يخضع لسلسلة موافقة)
      const oldExpiry = "2025-12-30";
      const newExpiry = String(emp["iqama_expiry"]);
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
        publishedRequestTitle: "طلب تحديث بيانات الإقامة والهوية والحالة الاجتماعية",
        fieldChanges: [
          {
            fieldKey: "iqama_expiry",
            fieldLabel: "بيانات الإقامة (تاريخ انتهاء الإقامة)",
            oldValue: oldExpiry,
            newValue: newExpiry,
          },
          {
            fieldKey: "national_id",
            fieldLabel: "رقم الهوية / الإقامة",
            oldValue: String(emp["national_id"]),
            newValue: String(emp["national_id"]),
          },
        ],
        updateMode: "approval_required",
        employeeDeclared: true,
        declaredAt: `${dateStr} ${timeStr}`,
        declarationTextSnapshot:
          "أقر بأن بيانات الإقامة والهوية المدخلة صحيحة ومطابقة للمستندات الرسمية.",
        approvalGroupId: "ag-branch-ops",
        approvalGroupName: "مجموعة اعتماد الهوية والبيانات الرسمية",
        allowDirectManager: true,
        directManagerStatus: isPending ? "pending" : "approved",
        fieldKey: "iqama_expiry",
        fieldLabel: "بيانات الإقامة (تاريخ انتهاء الإقامة)",
        oldValue: oldExpiry,
        newValue: newExpiry,
        reason: "تجديد الإقامة وتحديث تاريخ الانتهاء في نظام مدارس الأندلس",
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
    } else if (pattern === 2) {
      // تحديث البريد الإلكتروني ورقم الجوال
      const oldEmail = `old.${emp["emp_no"]}@gmail.com`;
      const newEmail = String(emp["email"]);
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
          {
            fieldKey: "email",
            fieldLabel: "البريد الإلكتروني",
            oldValue: oldEmail,
            newValue: newEmail,
          },
        ],
        updateMode: "direct",
        employeeDeclared: true,
        declaredAt: `${dateStr} ${timeStr}`,
        declarationTextSnapshot:
          "أقر بصحة البريد الإلكتروني الرسمي المحدث وأوافق على اعتماده في النظام.",
        approvalGroupId: "ag-hr-main",
        approvalGroupName: "لا يخضع لسلسلة موافقة (تحديث مباشر بإقرار الموظف)",
        allowDirectManager: false,
        directManagerStatus: "not_required",
        fieldKey: "email",
        fieldLabel: "البريد الإلكتروني",
        oldValue: oldEmail,
        newValue: newEmail,
        reason: "اعتماد البريد الرسمي لمدارس الأندلس",
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
      // تحديث المؤهل الدراسي والتخصص (يخضع لسلسلة موافقة)
      const oldQual = "دبلوم تربوي";
      const newQual = String(emp["last_qualification"]);
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
        publishedRequestTitle: "طلب تحديث البيانات الوظيفية والمؤهل الدراسي",
        fieldChanges: [
          {
            fieldKey: "last_qualification",
            fieldLabel: "المؤهل الدراسي",
            oldValue: oldQual,
            newValue: newQual,
          },
        ],
        updateMode: "approval_required",
        employeeDeclared: true,
        declaredAt: `${dateStr} ${timeStr}`,
        declarationTextSnapshot: "أقر بصحة بيانات المؤهل الدراسي المرفق.",
        approvalGroupId: "ag-hr-main",
        approvalGroupName: "مجموعة اعتماد الموارد البشرية والشؤون الإدارية",
        allowDirectManager: true,
        directManagerStatus: isPending ? "pending" : "approved",
        fieldKey: "last_qualification",
        fieldLabel: "المؤهل الدراسي",
        oldValue: oldQual,
        newValue: newQual,
        reason: "إضافة المؤهل الدراسي المحدث في ملف الموظف",
        status: isPending ? "pending" : "approved",
        awaitingText: isPending
          ? `بانتظار موافقة: ${emp["manager_name"]} / الموارد البشرية`
          : "تم الاعتماد والتحديث في النظام ✓",
        authorizedApproverNames: ["مدير الموارد البشرية"],
        appliedToEmployeeRecord: !isPending,
        decisionBy: isPending ? undefined : "مدير الموارد البشرية",
        decisionAt: isPending ? undefined : dateStr,
        replies: [],
        createdAt: `${dateStr}T${timeStr}:00Z`,
      });
    }
  }

  _cachedUpdateRequests = items;
  return items;
}
