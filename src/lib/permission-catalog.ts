import { nav } from "@/components/hr/nav-data";

export type PermissionResource = {
  key: string;
  name: string;
  section: string;
};

const baseResources: PermissionResource[] = [
  { key: "/", name: "لوحة المعلومات الرئيسية", section: "لوحة المعلومات" },
  { key: "/permissions", name: "مركز الصلاحيات", section: "الصلاحيات" },
  { key: "/auth", name: "تسجيل الدخول", section: "النظام" },
  { key: "/reset-password", name: "تغيير كلمة المرور", section: "النظام" },
];

const menuResources: PermissionResource[] = nav.flatMap((menu) => {
  if (menu.to) {
    return [{ key: menu.to, name: menu.label, section: menu.label }];
  }
  if (!menu.columns) {
    return [{ key: `module:${menu.label}`, name: menu.label, section: menu.label }];
  }
  return menu.columns.flatMap((column) =>
    column.items.map((item) => {
      const label = typeof item === "string" ? item : item.label;
      return {
        key: typeof item === "string" ? `legacy:${menu.label}:${column.title}:${label}` : item.to,
        name: `${menu.label} - ${column.title} - ${label}`,
        section: menu.label,
      };
    }),
  );
});

export const PERMISSION_RESOURCES = Array.from(
  new Map(
    [...baseResources, ...menuResources].map((resource) => [resource.key, resource]),
  ).values(),
).sort((a, b) => a.section.localeCompare(b.section, "ar") || a.name.localeCompare(b.name, "ar"));

export type PermissionFeature = {
  key: string;
  name: string;
  description: string;
};

export const DATA_UPDATE_FEATURES: PermissionFeature[] = [
  {
    key: "data_update.facility",
    name: "تحديث بيانات المنشأة",
    description: "استيراد رقم مكتب العمل وبيانات المنشأة من ملف Excel",
  },
  {
    key: "data_update.employee_add",
    name: "إضافة بيانات الموظفين",
    description: "إنشاء موظفين جدد جماعيًا من النموذج المعتمد",
  },
  {
    key: "data_update.employee_update",
    name: "تحديث بيانات الموظفين",
    description: "تعديل بيانات الموظفين الحاليين بواسطة الرقم الوظيفي أو الهوية",
  },
  {
    key: "data_update.salary",
    name: "تحديث بيانات رواتب الموظفين",
    description: "تحديث الراتب والبدلات والعناصر المالية",
  },
  {
    key: "data_update.documents",
    name: "تحديث مستندات الموظفين",
    description: "رفع وتحديث بيانات المستندات وتواريخ انتهائها",
  },
  {
    key: "data_update.relatives",
    name: "رفع ملفات الأقارب والمرافقين",
    description: "إضافة وتحديث بيانات أقارب ومرافقي الموظف",
  },
  {
    key: "data_update.entitlements",
    name: "إضافة الاستحقاقات",
    description: "استيراد الاستحقاقات المالية للموظفين",
  },
  {
    key: "data_update.deductions",
    name: "إضافة الاستقطاعات",
    description: "استيراد الاستقطاعات المالية للموظفين",
  },
  {
    key: "data_update.bank",
    name: "إضافة الحساب البنكي",
    description: "تحديث أرقام الحسابات والآيبان والبنوك",
  },
];

export const ADMIN_FORM_FEATURES: PermissionFeature[] = [
  {
    key: "admin_forms.employee",
    name: "نموذج بيانات الموظف",
    description: "طباعة الملف الأساسي للموظف",
  },
  { key: "admin_forms.contract", name: "نماذج العقود", description: "طباعة العقود والتجديدات" },
  {
    key: "admin_forms.salary_certificate",
    name: "شهادة تعريف بالراتب",
    description: "إصدار نموذج تعريف الراتب",
  },
  {
    key: "admin_forms.service_certificate",
    name: "شهادة خبرة",
    description: "إصدار شهادة مدة الخدمة",
  },
  { key: "admin_forms.leave", name: "نموذج إجازة", description: "طباعة طلب وقرار الإجازة" },
  {
    key: "admin_forms.eos",
    name: "نموذج نهاية الخدمة",
    description: "طباعة قرار وتسوية نهاية الخدمة",
  },
  {
    key: "admin_forms.warning",
    name: "نموذج إنذار أو جزاء",
    description: "طباعة الإنذارات والجزاءات الإدارية",
  },
  { key: "admin_forms.handover", name: "إخلاء طرف", description: "طباعة نموذج إخلاء طرف الموظف" },
];

export const DASHBOARD_FEATURES: PermissionFeature[] = [
  {
    key: "dashboard.employee_totals",
    name: "إجمالي الموظفين",
    description: "بطاقة عدد الموظفين وحالاتهم",
  },
  {
    key: "dashboard.attendance",
    name: "الحضور والانصراف",
    description: "مؤشرات الحضور والغياب والتأخير",
  },
  {
    key: "dashboard.requests",
    name: "الطلبات والاعتمادات",
    description: "حالة الطلبات في مراحل الاعتماد",
  },
  {
    key: "dashboard.leave",
    name: "الإجازات والأرصدة",
    description: "أرصدة الإجازات والطلبات الحالية",
  },
  {
    key: "dashboard.payroll",
    name: "ملخص الرواتب",
    description: "إجماليات المسير والاستحقاقات والاستقطاعات",
  },
  {
    key: "dashboard.departments",
    name: "توزيع الأقسام",
    description: "رسومات توزيع الموظفين على الإدارات",
  },
  {
    key: "dashboard.expirations",
    name: "المستندات المنتهية",
    description: "تنبيهات انتهاء الهويات والعقود والمستندات",
  },
  { key: "dashboard.eos", name: "نهاية الخدمة", description: "المخصصات والطلبات المفتوحة" },
];
