import type { Row } from "@/lib/hr-db";
import {
  ANDALUS_BRANCHES,
  ANDALUS_DEPARTMENTS,
  generateAndalusDataUpdateHistory,
} from "@/lib/andalus-seed";

export type DataUpdateCategory =
  | "البيانات الوظيفية والتنظيمية"
  | "البيانات الشخصية والهوية"
  | "بيانات التواصل والبنك"
  | "حقول مخصصة لتحديث البيانات";

export type FieldUpdateMode = "direct" | "approval_required";

export interface DataUpdateFieldDef {
  key: string;
  label: string;
  category: DataUpdateCategory;
  inputType: "select_or_text" | "text" | "date" | "number";
  lookupCategory?: string | undefined;
  defaultOptions?: string[] | undefined;
  isCoreRequested?: boolean | undefined;
  isCustom?: boolean | undefined;
  /**
   * آلية التحديث:
   * - "direct": تحديث مباشر فوري بعد إقرار الموظف والضغط على موافق (يسمع فوراً في النظام والتقارير)
   * - "approval_required": مربوط بمجموعة موافقة ويمر بمراحل اعتماد بعد إقرار الموظف
   */
  updateMode?: FieldUpdateMode | undefined;
  linkedApprovalGroupId?: string | undefined;
  allowDirectManager?: boolean | null | undefined;
  requiresAttachment?: boolean | undefined;
  requiresDeclaration?: boolean | undefined;
  active?: boolean | undefined;
}

/**
 * الحقول الأساسية المتاحة لطلب تعديل وتحديث البيانات
 */
export const DATA_UPDATE_FIELDS: DataUpdateFieldDef[] = [
  {
    key: "department",
    label: "القسم",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "الأقسام",
    defaultOptions: Array.from(
      new Set([
        ...ANDALUS_DEPARTMENTS,
        "الموارد البشرية",
        "الشؤون الإدارية",
        "الشؤون المالية",
        "تقنية المعلومات",
        "التشغيل",
        "المبيعات والتسويق",
        "خدمة العملاء",
        "المشتريات",
      ]),
    ),
    isCoreRequested: true,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: true,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
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
      "معلم",
    ],
    isCoreRequested: true,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: true,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "job_level",
    label: "المستوى الوظيفي",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "المستويات الوظيفية",
    defaultOptions: [
      "إداري",
      "تعليمي",
      "تشغيلي",
      "إشرافي",
      "قيادي",
      "المستوى الأول",
      "المستوى الثاني",
      "المستوى الثالث",
    ],
    isCoreRequested: true,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: true,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "employment_category",
    label: "الفئة الوظيفية",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "الفئات الوظيفية",
    defaultOptions: ["إداري", "تعليمي", "فني", "تشغيلي", "طبي", "هندسي"],
    isCoreRequested: true,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: true,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
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
      "تربية بدنية",
      "لغة عربية",
      "رياضيات",
    ],
    isCoreRequested: true,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "branch",
    label: "الفرع",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "الفروع",
    defaultOptions: [
      ...ANDALUS_BRANCHES.map((b) => b.name_ar),
      "المتقدمة الاهلية - فرع قرطبة",
    ],
    isCoreRequested: true,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: true,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
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
      "بنين",
      "بنات",
    ],
    isCoreRequested: true,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: true,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "national_id",
    label: "رقم الهوية",
    category: "البيانات الشخصية والهوية",
    inputType: "text",
    isCoreRequested: true,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-branch-ops",
    allowDirectManager: false,
    requiresAttachment: true,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "nationality",
    label: "الجنسية",
    category: "البيانات الشخصية والهوية",
    inputType: "select_or_text",
    lookupCategory: "الجنسيات",
    defaultOptions: [
      "سعودي",
      "مصري",
      "سوداني",
      "يمني",
      "أردني",
      "سوري",
      "هندي",
      "باكستاني",
      "فلبيني",
      "أخرى",
    ],
    isCoreRequested: true,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-branch-ops",
    allowDirectManager: false,
    requiresAttachment: true,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "social_status",
    label: "الحالة الاجتماعية",
    category: "البيانات الشخصية والهوية",
    inputType: "select_or_text",
    defaultOptions: ["أعزب", "متزوج", "مطلق", "أرمل"],
    isCoreRequested: true,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-branch-ops",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "career_path",
    label: "المسار",
    category: "البيانات الوظيفية والتنظيمية",
    inputType: "select_or_text",
    lookupCategory: "المسارات الوظيفية",
    defaultOptions: [
      "مسار أساسي",
      "مسار السعودية",
      "مسار إداري",
      "مسار تقني",
      "المسار الإداري",
      "المسار التخصصي",
      "الأهلي",
      "العالمي",
    ],
    isCoreRequested: true,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: true,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  // حقول إضافية مساندة (افتراضياً تحديث مباشر بإقرار الموظف أو بموافقة حسب التهيئة)
  {
    key: "id_type",
    label: "نوع الهوية",
    category: "البيانات الشخصية والهوية",
    inputType: "select_or_text",
    lookupCategory: "نوع الهوية",
    defaultOptions: ["الهوية الوطنية", "الإقامة", "جواز سفر", "الرقم القومي"],
    isCoreRequested: false,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-branch-ops",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "phone",
    label: "رقم الجوال",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: true,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "email",
    label: "البريد الإلكتروني",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: true,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "short_address",
    label: "العنوان الوطني (العنوان المختصر)",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: true,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "postal_code",
    label: "بريد السكن (الرمز البريدي)",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: true,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "building_no",
    label: "رقم المبنى",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: true,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "street",
    label: "الشارع",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: false,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "district",
    label: "الحي",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: false,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "city",
    label: "المدينة",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: false,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "current_address",
    label: "العنوان التفصيلي للسكن",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: true,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "iqama_expiry",
    label: "بيانات الإقامة (تاريخ انتهاء الإقامة)",
    category: "البيانات الشخصية والهوية",
    inputType: "date",
    isCoreRequested: true,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-branch-ops",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "iqama_issue_place",
    label: "مكان إصدار الإقامة / الهوية",
    category: "البيانات الشخصية والهوية",
    inputType: "text",
    isCoreRequested: false,
    updateMode: "direct",
    linkedApprovalGroupId: "ag-branch-ops",
    allowDirectManager: false,
    requiresAttachment: false,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "last_qualification",
    label: "المؤهل الدراسي",
    category: "البيانات الشخصية والهوية",
    inputType: "select_or_text",
    defaultOptions: ["ثانوية عامة", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه"],
    isCoreRequested: true,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: true,
    requiresAttachment: true,
    requiresDeclaration: true,
    active: true,
  },
  {
    key: "iban",
    label: "رقم الآيبان البنكي (IBAN)",
    category: "بيانات التواصل والبنك",
    inputType: "text",
    isCoreRequested: false,
    updateMode: "approval_required",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: true,
    requiresDeclaration: true,
    active: true,
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
  updateMode?: FieldUpdateMode | undefined;
  linkedApprovalGroupId?: string | undefined;
  allowDirectManager?: boolean | null | undefined;
}

export interface UserFieldPermissionGroup {
  id: string;
  code: string;
  name: string;
  description: string;
  scopeType: "all" | "department" | "branch" | "category" | "specific_employees";
  scopeValue: string; // مثال: "الكل" أو اسم القسم أو الفرع أو الفئة
  specificEmployeeIds: string[];
  linkedApprovalGroupId: string; // ربط بمجموعة الموافقات الافتراضية
  allowDirectManagerOverride?: boolean | null; // إذا كان null يتبع إعداد مجموعة الموافقة
  allowedFields: Record<string, FieldPermissionRule>;
  active: boolean;
}

export interface FieldCustomConfigOverride {
  fieldKey: string;
  label?: string | undefined;
  category?: DataUpdateCategory | undefined;
  inputType?: "select_or_text" | "text" | "date" | "number" | undefined;
  defaultOptions?: string[] | undefined;
  updateMode: FieldUpdateMode;
  linkedApprovalGroupId?: string | undefined;
  allowDirectManager?: boolean | null | undefined;
  requiresAttachment: boolean;
  requiresDeclaration: boolean;
  active: boolean;
}

export interface DataUpdatePublishedRequest {
  id: string;
  code: string;
  title: string;
  description?: string | undefined;
  isPublic: boolean;
  targetScopeType: "public" | "department" | "branch" | "specific_employees";
  targetScopeValue: string;
  targetEmployeeIds: string[];
  fieldKeys: string[];
  requiresApprovalChain: boolean; // false = لا يخضع لسلسلة موافقة | true = يخضع لسلسلة موافقة
  approvalGroupId: string;
  allowDirectManager: boolean;
  requiresAttachment: boolean;
  declarationText: string;
  active: boolean;
  createdAt: string;
}

export interface DataUpdateFieldChange {
  fieldKey: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

export interface DataUpdateConfigState {
  globalAllowDirectManager: boolean;
  autoApplyOnApproval: boolean;
  requireEmployeeDeclaration: boolean;
  declarationTitle: string;
  declarationText: string;
  customFields: DataUpdateFieldDef[];
  fieldConfigs: Record<string, FieldCustomConfigOverride>;
  approvalGroups: DataUpdateApprovalGroup[];
  userPermissionGroups: UserFieldPermissionGroup[];
  publishedRequests?: DataUpdatePublishedRequest[] | undefined;
}

export interface DataUpdateReplyItem {
  id: string;
  authorName: string;
  authorRole: string;
  message: string;
  actionType: "reply" | "approve_direct_manager" | "approve_final" | "reject" | "direct_self_update";
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
  publishedRequestId?: string | undefined;
  publishedRequestTitle?: string | undefined;
  fieldChanges?: DataUpdateFieldChange[] | undefined;
  /**
   * آلية التحديث لهذا الحقل:
   * - "direct": تحديث فوري مباشر بإقرار الموظف
   * - "approval_required": يمر عبر مراحل موافقة
   */
  updateMode?: FieldUpdateMode | undefined;
  /**
   * بيانات إقرار الموظف بصحة البيانات
   */
  employeeDeclared?: boolean | undefined;
  declaredAt?: string | undefined;
  declarationTextSnapshot?: string | undefined;
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

export function buildDefaultFieldConfigs(): Record<string, FieldCustomConfigOverride> {
  const map: Record<string, FieldCustomConfigOverride> = {};
  for (const f of DATA_UPDATE_FIELDS) {
    map[f.key] = {
      fieldKey: f.key,
      label: f.label,
      category: f.category,
      inputType: f.inputType,
      defaultOptions: f.defaultOptions,
      updateMode: f.updateMode || "approval_required",
      linkedApprovalGroupId: f.linkedApprovalGroupId || "ag-hr-main",
      allowDirectManager: f.allowDirectManager ?? true,
      requiresAttachment: Boolean(f.requiresAttachment),
      requiresDeclaration: f.requiresDeclaration ?? true,
      active: f.active ?? true,
    };
  }
  return map;
}

export function buildDefaultFieldMap(
  enableCoreOnly = true,
  customFields: DataUpdateFieldDef[] = [],
): Record<string, FieldPermissionRule> {
  const map: Record<string, FieldPermissionRule> = {};
  const all = [...DATA_UPDATE_FIELDS, ...customFields];
  for (const f of all) {
    map[f.key] = {
      fieldKey: f.key,
      enabled: enableCoreOnly ? Boolean(f.isCoreRequested || f.isCustom) : true,
      requiresAttachment:
        Boolean(f.requiresAttachment) ||
        f.key === "national_id" ||
        f.key === "iban",
      updateMode: f.updateMode || "approval_required",
      linkedApprovalGroupId: f.linkedApprovalGroupId || "ag-hr-main",
      allowDirectManager: f.allowDirectManager ?? null,
    };
  }
  return map;
}

export const DEFAULT_DECLARATION_TITLE = "إقرار وتأكيد صحة البيانات المدخلة";
export const DEFAULT_DECLARATION_TEXT =
  "أقر أنا الموظف بأنني قد راجعت وتأكدت من صحة ودقة جميع البيانات التي تم تعبئتها بشكل عام، وأنها مطابقة للوثائق والمستندات الرسمية، وأتحمل كامل المسؤولية النظامية عن صحتها.";

export const DEFAULT_PUBLISHED_REQUESTS: DataUpdatePublishedRequest[] = [
  {
    id: "pub-req-contact-address",
    code: "REQ-01",
    title: "طلب تحديث بيانات التواصل والعنوان الوطني والسكن",
    description:
      "تحديث أرقام الجوال، البريد الإلكتروني، العنوان الوطني المختصر، بريد السكن (الرمز البريدي)، ورقم المبنى",
    isPublic: true,
    targetScopeType: "public",
    targetScopeValue: "الكل",
    targetEmployeeIds: [],
    fieldKeys: ["phone", "email", "short_address", "postal_code", "building_no", "street", "district", "city"],
    requiresApprovalChain: false, // لا يخضع لسلسلة موافقة (تحديث مباشر بإقرار الموظف)
    approvalGroupId: "ag-hr-main",
    allowDirectManager: false,
    requiresAttachment: false,
    declarationText:
      "أقر بأنني قمت بمراجعة وتعبئة بيانات التواصل والعنوان الوطني الموضحة أعلاه والتأكد من صحتها، وأوافق على إضافتها وتحديثها في النظام.",
    active: true,
    createdAt: "2026-11-01",
  },
  {
    id: "pub-req-iqama-identity",
    code: "REQ-02",
    title: "طلب تحديث بيانات الإقامة والهوية والحالة الاجتماعية",
    description: "تحديث رقم الهوية/الإقامة، تاريخ انتهاء الإقامة، مكان الإصدار، والحالة الاجتماعية",
    isPublic: true,
    targetScopeType: "public",
    targetScopeValue: "الكل",
    targetEmployeeIds: [],
    fieldKeys: ["national_id", "id_type", "iqama_expiry", "iqama_issue_place", "social_status"],
    requiresApprovalChain: true, // يخضع لسلسلة موافقة
    approvalGroupId: "ag-branch-ops",
    allowDirectManager: true,
    requiresAttachment: false,
    declarationText:
      "أقر بأن بيانات الإقامة والهوية المدخلة صحيحة ومطابقة للمستندات الرسمية، وأوافق على رفعها للاعتماد وتحديثها في النظام.",
    active: true,
    createdAt: "2026-11-01",
  },
];

export const DEFAULT_DATA_UPDATE_CONFIG: DataUpdateConfigState = {
  globalAllowDirectManager: true,
  autoApplyOnApproval: true,
  requireEmployeeDeclaration: true,
  declarationTitle: DEFAULT_DECLARATION_TITLE,
  declarationText: DEFAULT_DECLARATION_TEXT,
  customFields: [],
  fieldConfigs: buildDefaultFieldConfigs(),
  publishedRequests: DEFAULT_PUBLISHED_REQUESTS,
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
      description: "الحقول المتاحة لجميع موظفي المنشأة لتحديثها أو طلب تعديلها عبر الخدمة الذاتية",
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
      description: "صلاحية تحديث وطلب تعديل كافة البيانات الوظيفية والتنظيمية والشخصية",
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

/**
 * استرجاع كافة الحقول (الأساسية + الحقول المخصصة التي أنشأها المسؤول) مع إعداداتها المحدثة
 */
export function getAllDataUpdateFields(config?: DataUpdateConfigState): DataUpdateFieldDef[] {
  if (!config) return DATA_UPDATE_FIELDS;
  const customList = Array.isArray(config.customFields) ? config.customFields : [];
  const overrides = config.fieldConfigs || {};

  const combined: DataUpdateFieldDef[] = [];
  const seenKeys = new Set<string>();

  for (const baseField of DATA_UPDATE_FIELDS) {
    seenKeys.add(baseField.key);
    const ov = overrides[baseField.key];
    combined.push({
      ...baseField,
      label: ov?.label || baseField.label,
      category: ov?.category || baseField.category,
      inputType: ov?.inputType || baseField.inputType,
      defaultOptions: ov?.defaultOptions || baseField.defaultOptions,
      updateMode: ov?.updateMode || baseField.updateMode || "approval_required",
      linkedApprovalGroupId: ov?.linkedApprovalGroupId || baseField.linkedApprovalGroupId || "ag-hr-main",
      allowDirectManager:
        ov?.allowDirectManager !== undefined ? ov.allowDirectManager : (baseField.allowDirectManager ?? true),
      requiresAttachment:
        ov?.requiresAttachment !== undefined ? ov.requiresAttachment : Boolean(baseField.requiresAttachment),
      requiresDeclaration:
        ov?.requiresDeclaration !== undefined ? ov.requiresDeclaration : (baseField.requiresDeclaration ?? true),
      active: ov?.active !== undefined ? ov.active : (baseField.active ?? true),
    });
  }

  for (const cf of customList) {
    if (!cf.key || seenKeys.has(cf.key)) continue;
    seenKeys.add(cf.key);
    const ov = overrides[cf.key];
    combined.push({
      ...cf,
      isCustom: true,
      updateMode: ov?.updateMode || cf.updateMode || "direct",
      linkedApprovalGroupId: ov?.linkedApprovalGroupId || cf.linkedApprovalGroupId || "ag-hr-main",
      allowDirectManager:
        ov?.allowDirectManager !== undefined ? ov.allowDirectManager : (cf.allowDirectManager ?? false),
      requiresAttachment:
        ov?.requiresAttachment !== undefined ? ov.requiresAttachment : Boolean(cf.requiresAttachment),
      requiresDeclaration:
        ov?.requiresDeclaration !== undefined ? ov.requiresDeclaration : (cf.requiresDeclaration ?? true),
      active: ov?.active !== undefined ? ov.active : (cf.active ?? true),
    });
  }

  return combined;
}

/**
 * استخراج الإعداد الفعلي للحقل (هل هو تحديث مباشر أم يتطلب موافقة، وأي مجموعة موافقة، وهل يتطلب المدير المباشر)
 */
export function resolveFieldEffectiveWorkflow(
  fieldKey: string,
  config: DataUpdateConfigState,
  userGroup?: UserFieldPermissionGroup | null,
): {
  fieldDef: DataUpdateFieldDef;
  updateMode: FieldUpdateMode;
  approvalGroup: DataUpdateApprovalGroup | null;
  allowDirectManager: boolean;
  requiresAttachment: boolean;
  requiresDeclaration: boolean;
} {
  const allFields = getAllDataUpdateFields(config);
  const fieldDef =
    allFields.find((f) => f.key === fieldKey) ||
    allFields[0] ||
    DATA_UPDATE_FIELDS[0]!;

  const groupRule = userGroup?.allowedFields?.[fieldKey];
  const ov = config.fieldConfigs?.[fieldKey];

  const updateMode: FieldUpdateMode =
    ov?.updateMode ||
    groupRule?.updateMode ||
    fieldDef.updateMode ||
    "approval_required";

  const linkedGroupId =
    ov?.linkedApprovalGroupId ||
    groupRule?.linkedApprovalGroupId ||
    fieldDef.linkedApprovalGroupId ||
    userGroup?.linkedApprovalGroupId ||
    config.approvalGroups[0]?.id ||
    "ag-hr-main";

  const approvalGroup =
    config.approvalGroups.find((ag) => ag.id === linkedGroupId) ||
    config.approvalGroups[0] ||
    null;

  let allowDirectManager = config.globalAllowDirectManager;
  if (typeof ov?.allowDirectManager === "boolean") {
    allowDirectManager = ov.allowDirectManager;
  } else if (typeof groupRule?.allowDirectManager === "boolean") {
    allowDirectManager = groupRule.allowDirectManager;
  } else if (typeof fieldDef.allowDirectManager === "boolean") {
    allowDirectManager = fieldDef.allowDirectManager;
  } else if (typeof userGroup?.allowDirectManagerOverride === "boolean") {
    allowDirectManager = userGroup.allowDirectManagerOverride;
  } else if (approvalGroup) {
    allowDirectManager = approvalGroup.allowDirectManager;
  }

  const requiresAttachment =
    ov?.requiresAttachment !== undefined
      ? ov.requiresAttachment
      : groupRule?.requiresAttachment !== undefined
        ? groupRule.requiresAttachment
        : Boolean(fieldDef.requiresAttachment);

  const requiresDeclaration =
    config.requireEmployeeDeclaration !== false &&
    (ov?.requiresDeclaration ?? fieldDef.requiresDeclaration ?? true);

  return {
    fieldDef,
    updateMode,
    approvalGroup,
    allowDirectManager: updateMode === "approval_required" ? allowDirectManager : false,
    requiresAttachment,
    requiresDeclaration,
  };
}

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
  const approvalGroups =
    Array.isArray(input.approvalGroups) && input.approvalGroups.length > 0
      ? input.approvalGroups
      : DEFAULT_DATA_UPDATE_CONFIG.approvalGroups;

  const customFields: DataUpdateFieldDef[] = Array.isArray(input.customFields)
    ? input.customFields
    : [];

  const defaultFieldConfigs = buildDefaultFieldConfigs();
  const mergedFieldConfigs: Record<string, FieldCustomConfigOverride> = {
    ...defaultFieldConfigs,
    ...(input.fieldConfigs || {}),
  };

  for (const cf of customFields) {
    if (!mergedFieldConfigs[cf.key]) {
      mergedFieldConfigs[cf.key] = {
        fieldKey: cf.key,
        label: cf.label,
        category: cf.category,
        inputType: cf.inputType,
        defaultOptions: cf.defaultOptions,
        updateMode: cf.updateMode || "direct",
        linkedApprovalGroupId: cf.linkedApprovalGroupId || approvalGroups[0]?.id || "ag-hr-main",
        allowDirectManager: cf.allowDirectManager ?? false,
        requiresAttachment: Boolean(cf.requiresAttachment),
        requiresDeclaration: cf.requiresDeclaration ?? true,
        active: cf.active ?? true,
      };
    }
  }

  const allFields = [...DATA_UPDATE_FIELDS, ...customFields];

  const userPermissionGroups = (
    Array.isArray(input.userPermissionGroups) && input.userPermissionGroups.length > 0
      ? input.userPermissionGroups
      : DEFAULT_DATA_UPDATE_CONFIG.userPermissionGroups
  ).map((g) => {
    const defaultMap = buildDefaultFieldMap(true, customFields);
    const mergedFields: Record<string, FieldPermissionRule> = { ...defaultMap };
    if (g.allowedFields && typeof g.allowedFields === "object") {
      for (const f of allFields) {
        const existingRule = g.allowedFields[f.key];
        const fc = mergedFieldConfigs[f.key];
        if (existingRule) {
          mergedFields[f.key] = {
            fieldKey: f.key,
            enabled: Boolean(existingRule.enabled),
            requiresAttachment: Boolean(existingRule.requiresAttachment ?? fc?.requiresAttachment),
            updateMode: existingRule.updateMode || fc?.updateMode || f.updateMode || "approval_required",
            linkedApprovalGroupId:
              existingRule.linkedApprovalGroupId ||
              fc?.linkedApprovalGroupId ||
              f.linkedApprovalGroupId ||
              g.linkedApprovalGroupId,
            allowDirectManager:
              existingRule.allowDirectManager !== undefined
                ? existingRule.allowDirectManager
                : (fc?.allowDirectManager ?? null),
          };
        } else if (f.isCustom) {
          mergedFields[f.key] = {
            fieldKey: f.key,
            enabled: fc?.active !== false,
            requiresAttachment: Boolean(fc?.requiresAttachment),
            updateMode: fc?.updateMode || "direct",
            linkedApprovalGroupId: fc?.linkedApprovalGroupId || g.linkedApprovalGroupId,
            allowDirectManager: fc?.allowDirectManager ?? false,
          };
        }
      }
    }
    return {
      ...g,
      allowedFields: mergedFields,
    };
  });

  const publishedRequests: DataUpdatePublishedRequest[] =
    Array.isArray(input.publishedRequests) && input.publishedRequests.length > 0
      ? input.publishedRequests
      : DEFAULT_PUBLISHED_REQUESTS;

  return {
    globalAllowDirectManager: input.globalAllowDirectManager ?? true,
    autoApplyOnApproval: input.autoApplyOnApproval ?? true,
    requireEmployeeDeclaration: input.requireEmployeeDeclaration ?? true,
    declarationTitle: input.declarationTitle || DEFAULT_DECLARATION_TITLE,
    declarationText: input.declarationText || DEFAULT_DECLARATION_TEXT,
    customFields,
    fieldConfigs: mergedFieldConfigs,
    approvalGroups,
    userPermissionGroups,
    publishedRequests,
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
  const seedRequests = generateAndalusDataUpdateHistory();
  let customRequests: DataUpdateRequestItem[] = [];

  if (typeof rawFromDb === "string" && rawFromDb.trim()) {
    try {
      const parsed = JSON.parse(rawFromDb);
      if (Array.isArray(parsed)) customRequests = parsed;
    } catch {
      // ignore
    }
  }
  if (customRequests.length === 0 && typeof window !== "undefined") {
    try {
      const localRaw = window.localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        if (Array.isArray(parsed)) customRequests = parsed;
      }
    } catch {
      // ignore
    }
  }

  if (customRequests.length === 0) return seedRequests;

  const map = new Map<string, DataUpdateRequestItem>();
  for (const item of customRequests) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const seed of seedRequests) {
    if (!map.has(seed.id)) {
      map.set(seed.id, seed);
    }
  }
  return Array.from(map.values());
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
  if (fieldKey === "short_address") {
    return readKey("short_address") || readKey("national_address") || "غير محدد";
  }
  return readKey(fieldKey) || "غير محدد";
}

/**
 * بناء حزمة تحديث لعدة حقول دفعة واحدة عند تعبئة طلب تحديث بيانات من الموظف أو اعتماده
 */
export function buildMultiFieldEmployeeUpdatePatch(
  employee: Row,
  changes: DataUpdateFieldChange[],
  requestNumber: string,
  approverName: string,
): Record<string, any> {
  const combinedPatch: Record<string, any> = {};
  for (const ch of changes) {
    if (!ch.fieldKey || !ch.newValue.trim()) continue;
    const singlePatch = buildEmployeeUpdatePatch(
      employee,
      ch.fieldKey,
      ch.newValue.trim(),
      requestNumber,
      approverName,
      ch.fieldLabel,
    );
    Object.assign(combinedPatch, singlePatch);
  }
  return combinedPatch;
}

/**
 * استرجاع طلبات التحديث المنشورة (Public أو المخصصة) المتاحة لموظف معين
 */
export function getPublishedRequestsForEmployee(
  employee: Row | null | undefined,
  config: DataUpdateConfigState,
): DataUpdatePublishedRequest[] {
  const list = Array.isArray(config.publishedRequests)
    ? config.publishedRequests
    : DEFAULT_PUBLISHED_REQUESTS;

  return list.filter((req) => {
    if (!req.active) return false;
    if (req.isPublic || req.targetScopeType === "public") return true;
    if (!employee) return true;
    const empId = String(employee["id"] || "");
    const empDept = String(employee["department"] || "").trim();
    const empBranch = String(employee["branch"] || "").trim();

    if (req.targetScopeType === "specific_employees") {
      return req.targetEmployeeIds.includes(empId);
    }
    if (req.targetScopeType === "department") {
      return !req.targetScopeValue || req.targetScopeValue === "الكل" || req.targetScopeValue === empDept;
    }
    if (req.targetScopeType === "branch") {
      return !req.targetScopeValue || req.targetScopeValue === "الكل" || req.targetScopeValue === empBranch;
    }
    return true;
  });
}

/**
 * بناء حزمة التحديث لسجل الموظف عند اعتماد طلب تحديث البيانات أو التحديث الفوري المباشر
 */
export function buildEmployeeUpdatePatch(
  employee: Row,
  fieldKey: string,
  newValue: string,
  requestNumber: string,
  approverName: string,
  fieldLabelOverride?: string,
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
      const label = fieldLabelOverride || fieldDef?.label || fieldKey;
      const oldValue = getEmployeeFieldValue(employee, fieldKey);
      const prevArchive = Array.isArray(existingExtras.emp_archive) ? existingExtras.emp_archive : [];

      const nextExtras = {
        ...existingExtras,
        ...patch,
        emp_archive: [
          {
            id: `arch-req-${Date.now()}`,
            field_name: `${label} (تحديث #${requestNumber})`,
            old_value: oldValue,
            new_value: newValue,
            modified_at: new Date().toISOString().slice(0, 10),
            user: approverName || "تحديث بيانات معتمد",
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
