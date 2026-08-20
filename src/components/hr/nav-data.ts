import type { NavItem } from "@/components/MegaMenu";

export const nav: NavItem[] = [
  { label: "إدارة المهام", icon: "dashboard_customize" },
  { label: "الصلاحيات", icon: "shield_person" },
  { label: "تقييم الأداء", icon: "trending_up" },
  { label: "طلبات الاعتماد", icon: "task_alt" },
  {
    label: "التقارير",
    icon: "lab_profile",
    columns: [
      {
        title: "تقارير البصمة",
        items: [
          "تقرير البصمة",
          "تقرير حضور وإنصراف البصمة",
          "التقرير الاحصائي للحضور والإنصراف",
          "تقرير الحضور والإنصراف التفصيلي",
          "تقرير الحضور والإنصراف الشامل",
          "التأخير اليومي",
          "غياب الموظف",
          "تفاصيل قيمة غياب الموظف",
          "مقارنة الغياب والتأخير للفروع والأقسام",
          "تقرير استثناءات الحضور والإنصراف",
          "تقرير عدد أيام الغياب",
          "تقرير الغياب بالأيام",
          "تقرير التأخير بالأيام",
          "تقرير حصر الغياب بالأشهر",
        ],
      },
      {
        title: "تقارير بيانات الموظفين",
        items: [
          "تقارير بيانات الموظفين",
          "تقرير البيانات الاساسية",
          "تقرير التعيينات وإنهاء الخدمة",
          "تقرير ملفات الموظفين",
          "تقرير التقييم",
          "طباعة النماذج الإدارية",
          "تقرير التأمين الطبي للموظفين",
          "تقرير البيانات المالية",
          "تقرير اجازات الموظفين",
          "تقرير المرافقين",
          "تقرير الشهادات",
          "تقرير الدورات التدريبية",
        ],
      },
      {
        title: "تقارير ماليات الموظفين",
        items: [
          "مسير الرواتب",
          "مقارنة بين شهرين للمسير",
          "تقرير الاستحقاقات والاستقطاعات",
          "تقرير كشف الحساب البنكي",
          "تقرير تعديل المسير",
          "تقرير بيانات السلف",
          "تقرير رصيد السلف",
          "تقرير العهد النقدية",
          "كشف حساب الموظف للعام",
        ],
      },
      {
        title: "تقارير إحصائية",
        items: [
          "تقرير الموازنة التقديرية للقوى العاملة",
          "تقرير اعداد الموظفين",
          "تقرير عقود الموظفين",
          "تقرير الطلبات المتنوعة",
          "تقرير التعميمات والاستبيانات",
        ],
      },
      { title: "تقارير تاريخية", items: ["تقرير الملف التاريخي لاجازات الموظفين", "الأرشيف"] },
    ],
  },
  {
    label: "الطلبات",
    icon: "campaign",
    columns: [
      { title: "الموافقة على الطلبات", items: ["الطلبات", "ميزانية الشراء", "تهيئة الطلبات"] },
    ],
  },
  {
    label: "اللوائح",
    icon: "format_list_bulleted",
    columns: [
      {
        title: "التهيئة المالية",
        items: [
          { label: "لائحة الإستحقاقات", to: "/regulations" },
          { label: "لائحة الإستقطاعات", to: "/regulations/deductions" },
          { label: "تهيئة العمولات البنكية", to: "/regulations/bank-fees" },
        ],
      },
      {
        title: "إعدادات متنوعة",
        items: [
          { label: "تهيئة الاجازات", to: "/regulations/vacations" },
          { label: "تهيئة مجموعات الدوام", to: "/regulations/shifts" },
          { label: "تهيئة السلف", to: "/regulations/loans" },
          { label: "تهيئة سلاسل الموافقات", to: "/regulations/approvals" },
          { label: "تهيئة لائحة الأذونات", to: "/regulations/permits" },
        ],
      },
      {
        title: "لائحة خصومات البصمة",
        items: [{ label: "لائحة خصومات البصمة", to: "/regulations/fingerprint" }],
      },
      {
        title: "لوائح أخرى",
        items: [
          { label: "لوائح أخرى", to: "/regulations/other" },
          { label: "لائحة نهاية الخدمة", to: "/regulations/eos" },
        ],
      },
    ],
  },
  {
    label: "عمليات شؤون الموظفين",
    icon: "manage_accounts",
    columns: [
      {
        title: "متابعة المستندات",
        items: [{ label: "اشعارات الطلبات", to: "/request-notifications" }],
      },
      { title: "بيانات الموظفين", items: [{ label: "شؤون الموظفين", to: "/staff" }] },
      {
        title: "عمليات الموظفين",
        items: [
          { label: "الأجازات", to: "/vacations" },
          { label: "طلبات الأجازات", to: "/leaves" },
          { label: "الاستبيانات و التعميم", to: "/surveys" },
          "المسائلات",
          "الاذونات",
          "المراسلات",
          "مخصص نهاية الخدمة",
          "طلبات نهاية الخدمة",
        ],
      },
      { title: "ماليات الموظفين", items: ["السلف"] },
      {
        title: "رواتب الموظفين",
        items: [
          { label: "تجهيز مسودة المسير", to: "/payroll" },
          "ملف البنك",
        ],
      },
    ],
  },
  {
    label: "إعدادات النظام",
    icon: "settings",
    columns: [
      {
        title: "تهيئة البيانات الأساسية",
        items: [
          { label: "التهيئة العامة للبرنامج", to: "/settings/general" },
          { label: "تهيئة البيانات الاساسية", to: "/settings/basic" },
          "تهيئة ربط الحسابات",
        ],
      },
      {
        title: "تهيئة بيانات الشركات والفروع",
        items: ["تهيئة بيانات الشركة", "تهيئة بيانات الفروع", "مستندات الشركة والافرع"],
      },
      {
        title: "إعدادات أخرى",
        items: [
          "تهيئة السنوات والشهور",
          "تهيئة الكفلاء",
          "تهيئة أسباب الايقاف",
          "تحديد اعداد الموظفين في الفروع",
        ],
      },
    ],
  },
];

export const sidebar: { label: string; icon: string; to?: string; badge?: string }[] = [
  { label: "اللوحة الرئيسية", icon: "space_dashboard", to: "/" },
  { label: "الموظفون", icon: "groups", to: "/staff", badge: "٣٢٤" },
  { label: "العقود", icon: "description", to: "/staff/contracts" },
  { label: "اشعارات الطلبات", icon: "notifications_active", to: "/request-notifications", badge: "٦" },
  { label: "الحضور والانصراف", icon: "schedule" },
  { label: "الإجازات", icon: "beach_access", to: "/leaves" },
  { label: "اللوائح المالية", icon: "format_list_bulleted", to: "/regulations" },
  { label: "الرواتب", icon: "payments" },
  { label: "التدريب", icon: "school" },
];