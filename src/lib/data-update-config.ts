import type { Row } from "@/lib/hr-db";

export interface DataUpdateFieldDef {
  key: string;
  label: string;
  category: "البيانات الوظيفية والتنظيمية" | "البيانات الشخصية والهوية" | "بيانات التواصل والبنك";
  inputType: "select_or_text" | "text";
  lookupCategory?: string;
  defaultOptions?: string[];
  isCoreRequested?: boolean;
}

/**
 * الحقول المتاحة لطلب تعديل وتحديث البيانات
 * تشمل الحقول الـ 11 الأساسية المطلوبة + حقول إضافية مساندة
 */
export const DATA_UPDATE_FIELDS: DataUpdateFieldDef[] = [
  {
    key: "department",
    label: "القسم",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "الأقسام",
    defaultOptions: [
      "الموارد البشرية",
      "الشؤون الإدارية",
      "الشؤون المالية",
      "تقنية المعلومات",
      "التشغيل",
      "المبيعات والتسويق",
      "خدمة العملاء",
      "المشتريات",
    ],
    isCoreRequested: true,
  },
  {
    key: "job_title",
    label: "الوظيفة الحالية",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "المسميات الوظيفية",
    defaultOptions: [
      "أخصائي موارد بشرية",
      "مدير موارد بشرية",
      "محاسب",
      "مدير مالي",
      "مهندس برمجيات",
      "مشرف تشغيل",
      "منسق إداري",
      "أخصائي مبيعات",
    ],
    isCoreRequested: true,
  },
  {
    key: "job_level",
    label: "المستوى الوظيفي",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "المستويات الوظيفية",
    defaultOptions: ["إداري", "تعليمي", "تشغيلي", "إشرافي", "قيادي", "المستوى الأول", "المستوى الثاني", "المستوى الثالث"],
    isCoreRequested: true,
  },
  {
    key: "employment_category",
    label: "الفئة الوظيفية",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "الفئات الوظيفية",
    defaultOptions: ["إداري", "تعليمي", "فني", "تشغيلي", "طبي", "هندسي"],
    isCoreRequested: true,
  },
  {
    key: "specialization",
    label: "التخصص",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "التخصصات",
    defaultOptions: [
      "إدارة أعمال",
      "موارد بشرية",
      "محاسبة ومالية",
      "علوم حاسب وتقنية معلومات",
      "هندسة",
      "قانون",
      "علاقات عامة",
    ],
    isCoreRequested: true,
  },
  {
    key: "branch",
    label: "الفرع",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "الفروع",
    defaultOptions: ["الفرع الرئيسي", "فرع الرياض", "فرع جدة", "فرع الدمام", "فرع مكة المكرمة", "فرع المدينة المنورة"],
    isCoreRequested: true,
  },
  {
    key: "main_department",
    label: "القسم الرئيسي",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "الأقسام الرئيسية",
    defaultOptions: [
      "الإدارة العامة",
      "إدارة رأس المال البشري",
      "الإدارة المالية والإدارية",
      "إدارة العمليات والتشغيل",
      "إدارة تقنية المعلومات",
    ],
    isCoreRequested: true,
  },
  {
    key: "national_id",
    label: "رقم الهوية",
    category: "البيانات الشخصية والهوية",
    inputType: "text",
    isCoreRequested: true,
  },
  {
    key: "nationality",
    label: "الجنسية",
    category: "البيانات الشخصية والهوية",
    inputType: "select_or_text",
    lookupCategory: "الجنسيات",
    defaultOptions: ["سعودي", "مصري", "سوداني", "يمني", "أردني", "سوري", "هندي", "باكستاني", "فلبيني", "أخرى"],
    isCoreRequested: true,
  },
  {
    key: "social_status",
    label: "الحالة الاجتماعية",
    category: "البيانات الشخصية والهوية",
    inputType: "select_or_text",
    defaultOptions: ["أعزب", "متزوج", "مطلق", "أرمل"],
    isCoreRequested: true,
  },
  {
    key: "career_path",
    label: "المسار",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "المسارات الوظيفية",
    defaultOptions: ["مسار أساسي", "مسار السعودية", "مسار إداري", "مسار تقني", "المسار الإداري", "المسار التخصصي"],
    isCoreRequested: true,
  },
  // حقول إضافية مساندة يمكن تفعيلها عند الرغبة
  {
    key: "id_type",
    label: "نوع الهوية",
    category: "البيانات الشخصية والهوية",
    inputType: "select_or_text",
    lookupCategory: "نوع الهوية",
    defaultOptions: ["الهوية الوطنية", "الإقامة", "جواز سفر", "الرقم القومي"],
    isCoreRequested: false,
  },
  {
    key: "phone",
    label: "رقم الجوال",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: false,
  },
  {
    key: "email",
    label: "البريد الإلكتروني",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: false,
  },
  {
    key: "iban",
    label: "رقم الآيبان البنكي (IBAN)",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: false,
  },
];

export interface ApproverUserItem {
  id: string;
  employeeId?: string | undefined;
  empNo?: string | undefined;
  name: string;
  jobTitle?: string | undefined;
  roleLabel: string;
  canApprove: boolean;
  canReply: boolean;
}

export interface DataUpdateApprovalGroup {
  id: string;
  code: string;
  name: string;
  description: string;
  targetBranch: string; // "الكل" أو اسم الفرع
  targetDepartment: string; // "الكل" أو اسم القسم
  allowDirectManager: boolean; // التشيك بوكس: هل المدير المباشر يقدر يوافق أو يرد؟
  directManagerStageOrder: "first" | "parallel" | "only_if_no_group";
  requireAllApprovers: boolean; // موافقة مستخدم واحد تكفي أم الجميع
  approvers: ApproverUserItem[];
  active: boolean;
}

export interface FieldPermissionRule {
  fieldKey: string;
  enabled: boolean;
  requiresAttachment: boolean;
}

export interface UserFieldPermissionGroup {
  id: string;
  code: string;
  name: string;
  description: string;
  scopeType: "all" | "department" | "branch" | "category" | "specific_employees";
  scopeValue: string; // مثال: "الكل" أو اسم القسم أو الفرع أو الفئة
  specificEmployeeIds: string[];
  linkedApprovalGroupId: string; // ربط بمجموعة الموافقات من الأوبشن الأول
  allowDirectManagerOverride?: boolean | null; // إذا كان null يتبع إعداد مجموعة الموافقة
  allowedFields: Record<string, FieldPermissionRule>;
  active: boolean;
}

export interface DataUpdateConfigState {
  globalAllowDirectManager: boolean;
  autoApplyOnApproval: boolean;
  approvalGroups: DataUpdateApprovalGroup[];
  userPermissionGroups: UserFieldPermissionGroup[];
}

export interface DataUpdateReplyItem {
  id: string;
  authorName: string;
  authorRole: string;
  message: string;
  actionType: "reply" | "approve_direct_manager" | "approve_final" | "reject";
  createdAt: string;
}

export interface DataUpdateRequestItem {
  id: string;
  requestNumber: string;
  employeeId: string;
  empNo: string;
  employeeName: string;
  branch: string;
  department: string;
  directManagerName: string;
  userGroupId: string;
  userGroupName: string;
  approvalGroupId: string;
  approvalGroupName: string;
  allowDirectManager: boolean;
  directManagerStatus: "not_required" | "pending" | "approved" | "rejected";
  directManagerDecisionBy?: string | undefined;
  directManagerDecisionAt?: string | undefined;
  fieldKey: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  reason: string;
  attachmentName?: string | undefined;
  attachmentDataUrl?: string | undefined;
  status: "pending" | "approved" | "rejected" | "cancelled";
  awaitingText: string;
  authorizedApproverNames: string[];
  appliedToEmployeeRecord: boolean;
  decisionBy?: string | undefined;
  decisionAt?: string | undefined;
  rejectionReason?: string | undefined;
  replies: DataUpdateReplyItem[];
  createdAt: string;
}

const STORAGE_KEY_CONFIG = "hr_data_update_config_v1";
const STORAGE_KEY_REQUESTS = "hr_data_update_requests_v1";

export function buildDefaultFieldMap(enableCoreOnly = true): Record<string, FieldPermissionRule> {
  const map: Record<string, FieldPermissionRule> = {};
  for (const f of DATA_UPDATE_FIELDS) {
    map[f.key] = {
      fieldKey: f.key,
      enabled: enableCoreOnly ? Boolean(f.isCoreRequested) : true,
      requiresAttachment: f.key === "national_id" || f.key === "social_status" || f.key === "iban",
    };
  }
  return map;
}

export const DEFAULT_DATA_UPDATE_CONFIG: DataUpdateConfigState = {
  globalAllowDirectManager: true,
  autoApplyOnApproval: true,
  approvalGroups: [
    {
      id: "ag-hr-main",
      code: "AG-01",
      name: "مجموعة اعتماد الموارد البشرية والشؤون الإدارية",
      description: "المجموعة الرئيسية المخولة بالموافقة والرد على طلبات تحديث البيانات الوظيفية والشخصية",
      targetBranch: "الكل",
      targetDepartment: "الكل",
      allowDirectManager: true,
      directManagerStageOrder: "first",
      requireAllApprovers: false,
      approvers: [
        {
          id: "ap-1",
          name: "مدير الموارد البشرية",
          roleLabel: "مسؤول اعتماد الموارد البشرية",
          canApprove: true,
          canReply: true,
        },
        {
          id: "ap-2",
          name: "أخصائي شؤون الموظفين",
          roleLabel: "مراجع بيانات الموظفين",
          canApprove: true,
          canReply: true,
        },
      ],
      active: true,
    },
    {
      id: "ag-branch-ops",
      code: "AG-02",
      name: "مجموعة اعتماد الهوية والبيانات الرسمية",
      description: "مجموعة مخصصة لمراجعة طلبات تعديل رقم الهوية والجنسية والحالة الاجتماعية والمستندات الثبوتية",
      targetBranch: "الكل",
      targetDepartment: "الكل",
      allowDirectManager: false,
      directManagerStageOrder: "first",
      requireAllApprovers: false,
      approvers: [
        {
          id: "ap-3",
          name: "مدير الشؤون الإدارية والعمليات",
          roleLabel: "معتمد الوثائق الرسمية",
          canApprove: true,
          canReply: true,
        },
      ],
      active: true,
    },
  ],
  userPermissionGroups: [
    {
      id: "ug-all-employees",
      code: "UG-01",
      name: "جميع الموظفين (المجموعة العامة)",
      description: "الحقول المتاحة لجميع موظفي المنشأة لطلب تعديلها عبر الخدمة الذاتية وطلبات التحديث",
      scopeType: "all",
      scopeValue: "الكل",
      specificEmployeeIds: [],
      linkedApprovalGroupId: "ag-hr-main",
      allowDirectManagerOverride: null,
      allowedFields: buildDefaultFieldMap(true),
      active: true,
    },
    {
      id: "ug-admin-staff",
      code: "UG-02",
      name: "مجموعة الكادر الإداري والإشرافي",
      description: "صلاحية طلب تحديث كافة البيانات الوظيفية والتنظيمية والشخصية",
      scopeType: "category",
      scopeValue: "إداري",
      specificEmployeeIds: [],
      linkedApprovalGroupId: "ag-hr-main",
      allowDirectManagerOverride: true,
      allowedFields: buildDefaultFieldMap(false),
      active: true,
    },
  ],
};

export function loadDataUpdateConfig(rawFromDb?: unknown): DataUpdateConfigState {
  if (typeof rawFromDb === "string" && rawFromDb.trim()) {
    try {
      const parsed = JSON.parse(rawFromDb);
      if (parsed && Array.isArray(parsed.approvalGroups) && Array.isArray(parsed.userPermissionGroups)) {
        return normalizeConfig(parsed);
      }
    } catch {
      // ignore parse error
    }
  }
  if (typeof window !== "undefined") {
    try {
      const localRaw = window.localStorage.getItem(STORAGE_KEY_CONFIG);
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        if (parsed && Array.isArray(parsed.approvalGroups) && Array.isArray(parsed.userPermissionGroups)) {
          return normalizeConfig(parsed);
        }
      }
    } catch {
      // ignore local storage error
    }
  }
  return normalizeConfig(DEFAULT_DATA_UPDATE_CONFIG);
}

function normalizeConfig(input: Partial<DataUpdateConfigState>): DataUpdateConfigState {
  const approvalGroups = Array.isArray(input.approvalGroups) && input.approvalGroups.length > 0
    ? input.approvalGroups
    : DEFAULT_DATA_UPDATE_CONFIG.approvalGroups;

  const userPermissionGroups = (
    Array.isArray(input.userPermissionGroups) && input.userPermissionGroups.length > 0
      ? input.userPermissionGroups
      : DEFAULT_DATA_UPDATE_CONFIG.userPermissionGroups
  ).map((g) => {
    const defaultMap = buildDefaultFieldMap(true);
    const mergedFields: Record<string, FieldPermissionRule> = { ...defaultMap };
    if (g.allowedFields && typeof g.allowedFields === "object") {
      for (const f of DATA_UPDATE_FIELDS) {
        if (g.allowedFields[f.key]) {
          mergedFields[f.key] = {
            fieldKey: f.key,
            enabled: Boolean(g.allowedFields[f.key]?.enabled),
            requiresAttachment: Boolean(g.allowedFields[f.key]?.requiresAttachment),
          };
        }
      }
    }
    return {
      ...g,
      allowedFields: mergedFields,
    };
  });

  return {
    globalAllowDirectManager: input.globalAllowDirectManager ?? true,
    autoApplyOnApproval: input.autoApplyOnApproval ?? true,
    approvalGroups,
    userPermissionGroups,
  };
}

export function saveDataUpdateConfigLocal(config: DataUpdateConfigState): string {
  const json = JSON.stringify(config);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY_CONFIG, json);
    } catch {
      // ignore quota error
    }
  }
  return json;
}

export function loadDataUpdateRequests(rawFromDb?: unknown): DataUpdateRequestItem[] {
  if (typeof rawFromDb === "string" && rawFromDb.trim()) {
    try {
      const parsed = JSON.parse(rawFromDb);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  if (typeof window !== "undefined") {
    try {
      const localRaw = window.localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
  }
  return [];
}

export function saveDataUpdateRequestsLocal(requests: DataUpdateRequestItem[]): string {
  const json = JSON.stringify(requests);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY_REQUESTS, json);
    } catch {
      // ignore
    }
  }
  return json;
}

/**
 * استخراج القيمة الحالية للحقل من سجل الموظف أو البيانات الإضافية المحفوظة
 */
export function getEmployeeFieldValue(employee: Row | null | undefined, fieldKey: string): string {
  if (!employee) return "";
  let extras: Record<string, any> = {};
  if (typeof window !== "undefined" && employee["id"]) {
    try {
      const raw = window.localStorage.getItem(`hr_emp_profile_extras_${employee["id"]}`);
      if (raw) extras = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  const readKey = (k: string) => {
    const direct = employee[k];
    if (direct !== undefined && direct !== null && String(direct).trim() !== "") {
      return String(direct).trim();
    }
    const extraVal = extras[k];
    if (extraVal !== undefined && extraVal !== null && String(extraVal).trim() !== "") {
      return String(extraVal).trim();
    }
    return "";
  };

  if (fieldKey === "social_status") {
    return readKey("social_status") || readKey("marital_status") || "غير محدد";
  }
  if (fieldKey === "phone") {
    return readKey("phone") || readKey("mobile") || "غير محدد";
  }
  return readKey(fieldKey) || "غير محدد";
}

/**
 * بناء حزمة التحديث لسجل الموظف عند اعتماد طلب تحديث البيانات
 */
export function buildEmployeeUpdatePatch(
  employee: Row,
  fieldKey: string,
  newValue: string,
  requestNumber: string,
  approverName: string,
): Record<string, any> {
  const patch: Record<string, any> = {
    [fieldKey]: newValue,
  };

  // مزامنة الحقول المترادفة في ملف الموظف
  if (fieldKey === "social_status") {
    patch["marital_status"] = newValue;
  } else if (fieldKey === "phone") {
    patch["mobile"] = newValue;
  }

  // تحديث البيانات الإضافية وسجل أرشيف التعديلات في ملف الموظف
  if (typeof window !== "undefined" && employee["id"]) {
    try {
      const storageKey = `hr_emp_profile_extras_${employee["id"]}`;
      const existingRaw = window.localStorage.getItem(storageKey);
      const existingExtras = existingRaw ? JSON.parse(existingRaw) : {};
      const fieldDef = DATA_UPDATE_FIELDS.find((f) => f.key === fieldKey);
      const oldValue = getEmployeeFieldValue(employee, fieldKey);
      const prevArchive = Array.isArray(existingExtras.emp_archive) ? existingExtras.emp_archive : [];

      const nextExtras = {
        ...existingExtras,
        ...patch,
        emp_archive: [
          {
            id: `arch-req-${Date.now()}`,
            field_name: `${fieldDef?.label || fieldKey} (طلب تحديث #${requestNumber})`,
            old_value: oldValue,
            new_value: newValue,
            modified_at: new Date().toISOString().slice(0, 10),
            user: approverName || "اعتماد طلب تحديث بيانات",
          },
          ...prevArchive,
        ],
      };
      window.localStorage.setItem(storageKey, JSON.stringify(nextExtras));
    } catch {
      // ignore local storage error
    }
  }

  return patch;
}

/**
 * تحديد مجموعة صلاحيات الحقول المنطبقة على الموظف
 */
export function resolveEmployeePermissionGroup(
  employee: Row | null | undefined,
  config: DataUpdateConfigState,
): UserFieldPermissionGroup {
  const activeGroups = config.userPermissionGroups.filter((g) => g.active);
  if (employee) {
    const empId = String(employee["id"] || "");
    const empDept = String(employee["department"] || "").trim();
    const empBranch = String(employee["branch"] || "").trim();
    const empCat = String(employee["employment_category"] || employee["category"] || "").trim();

    // 1. مطابقة موظفين محددين
    const byEmp = activeGroups.find(
      (g) => g.scopeType === "specific_employees" && g.specificEmployeeIds.includes(empId),
    );
    if (byEmp) return byEmp;

    // 2. مطابقة القسم
    const byDept = activeGroups.find(
      (g) => g.scopeType === "department" && g.scopeValue && g.scopeValue === empDept,
    );
    if (byDept) return byDept;

    // 3. مطابقة الفرع
    const byBranch = activeGroups.find(
      (g) => g.scopeType === "branch" && g.scopeValue && g.scopeValue === empBranch,
    );
    if (byBranch) return byBranch;

    // 4. مطابقة الفئة الوظيفية
    const byCat = activeGroups.find(
      (g) => g.scopeType === "category" && g.scopeValue && g.scopeValue === empCat,
    );
    if (byCat) return byCat;
  }

  // 5. المجموعة العامة لجميع الموظفين
  return (
    activeGroups.find((g) => g.scopeType === "all") ||
    activeGroups[0] ||
    DEFAULT_DATA_UPDATE_CONFIG.userPermissionGroups[0]!
  );
}
