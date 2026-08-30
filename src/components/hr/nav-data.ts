import type { NavItem } from "@/components/MegaMenu";

export const nav: NavItem[] = [
  {
    label: "إدارة المهام",
    icon: "dashboard_customize",
    columns: [
      {
        title: "إدارة المهام الإضافية",
        items: [
          { label: "المهام", to: "/tasks" },
          { label: "التهيئة", to: "/tasks/setup" },
          { label: "إدارة الصلاحيات", to: "/tasks/permissions" },
          { label: "التقارير", to: "/tasks/reports" },
        ],
      },
    ],
  },
  { label: "الصلاحيات", icon: "shield_person" },
  { label: "تقييم الأداء", icon: "trending_up" },
  {
    label: "طلبات الاعتماد",
    icon: "task_alt",
    columns: [
      {
        title: "متابعة الطلبات",
        items: [{ label: "طلبات الاعتماد", to: "/approval-requests" }],
      },
    ],
  },
  {
    label: "التقارير",
    icon: "lab_profile",
    columns: [
      {
        title: "تقارير البصمة",
        items: [
          { label: "تقرير البصمة", to: "/reports/fingerprint" },
          { label: "تقرير حضور وإنصراف البصمة", to: "/reports/attendance" },
          "التقرير الاحصائي للحضور والإنصراف",
          "تقرير الحضور والإنصراف التفصيلي",
          "تقرير الحضور والإنصراف الشامل",
          "التأخير اليومي",
          { label: "تقرير غياب الموظف", to: "/reports/absence-employee" },
          { label: "تقرير الغياب اليومي", to: "/reports/absence-daily" },
          { label: "تفاصيل قيمة غياب الموظف", to: "/reports/absence-value" },
          { label: "مقارنة الغياب والتأخير للفروع والأقسام", to: "/reports/absence-late-comparison" },
          { label: "تقرير استثناءات الحضور والإنصراف", to: "/reports/exceptions" },
          { label: "تقرير عدد أيام الغياب", to: "/reports/absence-days-count" },
          { label: "تقرير عدد الدقائق وساعات التأخير", to: "/reports/late-minutes" },
          { label: "تقرير الغياب بالأيام", to: "/reports/absence-days-list" },
          { label: "تقرير التأخير بالأيام", to: "/reports/late-days-list" },
          { label: "تقرير الانصراف المبكر بالأيام", to: "/reports/early-checkout-days" },
          { label: "تقرير حصر الغياب بالأشهر", to: "/reports/absence-monthly" },
        ],
      },
      {
        title: "تقارير بيانات الموظفين",
        items: [
          { label: "تقرير بيانات الموظفين", to: "/reports/employee-data" },
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
          { label: "المسائلات", to: "/inquiries" },
          { label: "الأذونات", to: "/permits" },
          { label: "المراسلات", to: "/correspondence" },
          { label: "مخصص نهاية الخدمة", to: "/end-of-service-provision" },
          { label: "طلبات نهاية الخدمة", to: "/end-of-service-requests" },
        ],
      },
      { title: "ماليات الموظفين", items: [{ label: "السلف", to: "/loans" }] },
      {
        title: "رواتب الموظفين",
        items: [{ label: "تجهيز مسودة المسير", to: "/payroll" }, "ملف البنك"],
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
          { label: "تهيئة ربط الحسابات", to: "/settings/account-links" },
        ],
      },
      {
        title: "تهيئة بيانات الشركات والفروع",
        items: ["تهيئة بيانات الشركة", "تهيئة بيانات الفروع", "مستندات الشركة والافرع"],
      },
      {
        title: "إعدادات أخرى",
        items: [
          { label: "تهيئة السنوات والشهور", to: "/settings/calendar" },
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
  {
    label: "اشعارات الطلبات",
    icon: "notifications_active",
    to: "/request-notifications",
    badge: "٦",
  },
  { label: "الحضور والانصراف", icon: "schedule" },
  { label: "الإجازات", icon: "beach_access", to: "/leaves" },
  { label: "الأذونات", icon: "approval", to: "/permits" },
  { label: "المراسلات", icon: "mail", to: "/correspondence" },
  { label: "مخصص نهاية الخدمة", icon: "savings", to: "/end-of-service-provision" },
  { label: "طلبات نهاية الخدمة", icon: "person_remove", to: "/end-of-service-requests" },
  { label: "اللوائح المالية", icon: "format_list_bulleted", to: "/regulations" },
  { label: "الرواتب", icon: "payments" },
  { label: "التدريب", icon: "school" },
];
