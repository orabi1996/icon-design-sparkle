import { useState, useMemo, useEffect, type ChangeEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  User,
  Building,
  Briefcase,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  Mail,
  ShieldCheck,
  FileText,
  Folder,
  Send,
  Bell,
  Globe,
  LogOut,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Paperclip,
  Clock,
  Eye,
  MessageSquare,
  Award,
  Users,
  HeartPulse,
  Save,
  PlusCircle,
  Star,
  ListTodo,
  FileCheck,
  Check,
  X,
} from "lucide-react";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  useRows,
  useSaveRow,
  useSettings,
  useSaveSettings,
  type Row,
} from "@/lib/hr-db";
import {
  DATA_UPDATE_FIELDS,
  getEmployeeFieldValue,
  loadDataUpdateConfig,
  loadDataUpdateRequests,
  resolveEmployeePermissionGroup,
  saveDataUpdateRequestsLocal,
  type DataUpdateRequestItem,
  type DataUpdateConfigState,
} from "@/lib/data-update-config";

export const Route = createFileRoute("/portal")({
  validateSearch: (search: Record<string, unknown>): {
    employeeId?: string | undefined;
    tab?: "profile" | "inquiries" | "payroll" | "requests" | "reports" | "forms" | "evaluation" | "tasks" | undefined;
    subTab?: "personal" | "work" | "gosi" | "contact" | "notes" | undefined;
  } => {
    const rawEmp = search["employeeId"];
    const rawTab = search["tab"];
    const rawSub = search["subTab"];
    return {
      employeeId: typeof rawEmp === "string" ? rawEmp : undefined,
      tab: typeof rawTab === "string" ? (rawTab as any) : "profile",
      subTab: typeof rawSub === "string" ? (rawSub as any) : "personal",
    };
  },
  head: () => ({
    meta: [
      { title: "بوابة الموظف | نظام الموارد البشرية" },
      {
        name: "description",
        content: "بوابة الخدمة الذاتية للموظف: استعراض وتحديث البيانات، رفع الطلبات، ومتابعة الرواتب والمهام.",
      },
    ],
  }),
  component: EmployeePortalPage,
});

export function EmployeePortalPage() {
  const { employeeId: paramEmpId, tab: searchTab, subTab: searchSubTab } = Route.useSearch();
  const navigate = useNavigate();

  const { data: employees = [], isLoading } = useRows("employees") as {
    data?: any[];
    isLoading?: boolean;
  };
  const saveEmployee = useSaveRow("employees");
  const saveApprovalRequest = useSaveRow("approval_requests");
  const { data: basicLookups = [] } = useRows("basic_lookups") as { data?: any[] };

  const configQuery = useSettings("data_update_config");
  const requestsQuery = useSettings("data_update_requests");
  const saveRequests = useSaveSettings("data_update_requests");

  const config: DataUpdateConfigState = useMemo(() => {
    return loadDataUpdateConfig(configQuery.data?.["config_json"]);
  }, [configQuery.data]);

  const allRequests: DataUpdateRequestItem[] = useMemo(() => {
    return loadDataUpdateRequests(requestsQuery.data?.["requests_json"]);
  }, [requestsQuery.data]);

  // Current active employee
  const currentEmployee = useMemo(() => {
    if (!employees.length) return null;
    if (paramEmpId) {
      const found = employees.find(
        (e) => String(e.id) === paramEmpId || String(e.emp_no) === paramEmpId,
      );
      if (found) return found;
    }
    // Default to Ahmed Mohamed El Sayed or first employee
    const ahmed = employees.find((e) =>
      String(e.full_name || "").includes("أحمد محمد السيد"),
    );
    return ahmed || employees[0];
  }, [employees, paramEmpId]);

  // Filter requests for current employee
  const employeeRequests = useMemo(() => {
    if (!currentEmployee) return [];
    const empId = String(currentEmployee.id || "");
    const empNo = String(currentEmployee.emp_no || "");
    return allRequests.filter(
      (r) =>
        (empId && String(r.employeeId) === empId) ||
        (empNo && String(r.empNo) === empNo) ||
        (currentEmployee.full_name && r.employeeName === currentEmployee.full_name),
    );
  }, [allRequests, currentEmployee]);

  // Resolve user group & permissions
  const resolvedGroup = useMemo(() => {
    return resolveEmployeePermissionGroup(currentEmployee, config);
  }, [currentEmployee, config]);

  const resolvedApprovalGroup = useMemo(() => {
    return (
      config.approvalGroups.find((ag) => ag.id === resolvedGroup.linkedApprovalGroupId) ||
      config.approvalGroups[0] ||
      null
    );
  }, [config.approvalGroups, resolvedGroup]);

  const isDirectManagerEnabled = useMemo(() => {
    if (typeof resolvedGroup.allowDirectManagerOverride === "boolean") {
      return resolvedGroup.allowDirectManagerOverride;
    }
    if (resolvedApprovalGroup) {
      return resolvedApprovalGroup.allowDirectManager;
    }
    return config.globalAllowDirectManager;
  }, [config.globalAllowDirectManager, resolvedApprovalGroup, resolvedGroup]);

  // Allowed fields for this employee
  const allowedFields = useMemo(() => {
    return DATA_UPDATE_FIELDS.filter((f) => {
      const rule = resolvedGroup.allowedFields[f.key];
      return rule ? rule.enabled : Boolean(f.isCoreRequested);
    });
  }, [resolvedGroup]);

  // Top Dark Navbar state
  const [activeNavTab, setActiveNavTab] = useState<string>(searchTab || "profile");
  const [isRequestsDropdownOpen, setIsRequestsDropdownOpen] = useState(false);
  const [isReportsDropdownOpen, setIsReportsDropdownOpen] = useState(false);

  // Sub-tabs in Employee Data
  const [subSection, setSubSection] = useState<"personal" | "work" | "gosi" | "contact" | "notes">(
    searchSubTab || "personal",
  );
  const [topCategoryTab, setTopCategoryTab] = useState<"basic" | "medical" | "dependents">("basic");

  // Editable Form state synced with current employee
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (currentEmployee) {
      setFormData({
        ...currentEmployee,
        family_members_count: currentEmployee.family_members_count ?? 3,
        religion: currentEmployee.religion || "مسلم",
        gender: currentEmployee.gender || "ذكر",
        marital_status: currentEmployee.marital_status || "متزوج",
        nationality: currentEmployee.nationality || "مصري",
        region: currentEmployee.region || "المنطقة الوسطى",
        branch: currentEmployee.branch || "المتقدمة الاهلية - فرع قرطبة",
        main_department: currentEmployee.main_department || "بنين",
        career_path: currentEmployee.career_path || "الأهلي",
        department: currentEmployee.department || "ابتدائي",
        sector: currentEmployee.sector || "إدارة المجمعات التعليمية",
        job_level: currentEmployee.job_level || "تشغيلي",
        manager_name: currentEmployee.manager_name || currentEmployee.direct_manager || "حمدان مانع العمري",
        attendance_schedule: currentEmployee.attendance_schedule || "افتراضي",
        job_title: currentEmployee.job_title || "معلم",
        specialization: currentEmployee.specialization || "تربية بدنية",
        job_designation: currentEmployee.job_designation || "معلم",
        hire_date: currentEmployee.hire_date || "2026-09-13",
        start_date: currentEmployee.start_date || "2026-09-13",
        leave_calc_date: currentEmployee.leave_calc_date || "2026-09-13",
        birth_date: currentEmployee.birth_date || "1993-08-21",
        experience_years: currentEmployee.experience_years ?? 5,
        probation_days: currentEmployee.probation_days ?? 90,
        last_qualification: currentEmployee.last_qualification || "بكالوريوس",
        gosi_no: currentEmployee.gosi_no || "",
        gosi_date: currentEmployee.gosi_date || "",
        gosi_city: currentEmployee.gosi_city || "",
        phone: currentEmployee.phone || "",
        home_country_phone: currentEmployee.home_country_phone || "",
        mobile: currentEmployee.mobile || "574606701",
        home_country_mobile: currentEmployee.home_country_mobile || "",
        current_address: currentEmployee.current_address || "",
        home_country_address: currentEmployee.home_country_address || "",
        short_address: currentEmployee.short_address || "",
        building_no: currentEmployee.building_no || "",
        street: currentEmployee.street || "",
        district: currentEmployee.district || "",
        city: currentEmployee.city || "",
        postal_code: currentEmployee.postal_code || "",
        additional_no: currentEmployee.additional_no || "",
        address_notes: currentEmployee.address_notes || "",
        email: currentEmployee.email || "ahmed.elsayed708@gmail.com",
        private_email: currentEmployee.private_email || "ahmed.elsayed708@gmail.com",
        birth_place: currentEmployee.birth_place || "مصر",
      });
    }
  }, [currentEmployee]);

  const updateField = (key: string, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  // Status pills state
  const [statusFlags, setStatusFlags] = useState({
    onDuty: true,
    mawaridRegistered: false,
    exemptFingerprint: false,
    showFingerprintReports: true,
  });

  // Modal State for New Data Update Request
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>("department");
  const [newValueInput, setNewValueInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentDataUrl, setAttachmentDataUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Field details for the request modal
  const activeFieldDef = useMemo(() => {
    return (
      DATA_UPDATE_FIELDS.find((f) => f.key === selectedFieldKey) ||
      DATA_UPDATE_FIELDS[0]!
    );
  }, [selectedFieldKey]);

  const currentFieldRule = useMemo(() => {
    return resolvedGroup.allowedFields[selectedFieldKey] || {
      fieldKey: selectedFieldKey,
      enabled: true,
      requiresAttachment: false,
    };
  }, [resolvedGroup, selectedFieldKey]);

  const currentSystemValue = useMemo(() => {
    return getEmployeeFieldValue(currentEmployee, selectedFieldKey);
  }, [currentEmployee, selectedFieldKey]);

  // Options for dropdown if field has lookup
  const fieldSelectOptions = useMemo(() => {
    const set = new Set<string>(activeFieldDef.defaultOptions || []);
    if (activeFieldDef.lookupCategory) {
      basicLookups.forEach((row: any) => {
        if (
          String(row["category"] || "") === activeFieldDef.lookupCategory &&
          row["active"] !== false &&
          row["name"]
        ) {
          set.add(String(row["name"]).trim());
        }
      });
    }
    employees.forEach((emp: any) => {
      const val = String(emp[activeFieldDef.key] || "").trim();
      if (val && activeFieldDef.inputType === "select_or_text") {
        set.add(val);
      }
    });
    return Array.from(set).filter(Boolean);
  }, [activeFieldDef, basicLookups, employees]);

  const handleOpenRequestForField = (fieldKey: string) => {
    setSelectedFieldKey(fieldKey);
    setNewValueInput("");
    setReasonInput("");
    setAttachmentName("");
    setAttachmentDataUrl("");
    setIsRequestModalOpen(true);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachmentDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Data Update Request
  const handleSubmitDataUpdateRequest = async () => {
    if (!currentEmployee) return;
    if (!newValueInput.trim()) {
      toast.error(`يرجى إدخال القيمة الجديدة لـ "${activeFieldDef.label}"`);
      return;
    }
    if (newValueInput.trim() === currentSystemValue) {
      toast.error("القيمة الجديدة مطابقة للقيمة الحالية المسجلة");
      return;
    }
    if (currentFieldRule.requiresAttachment && !attachmentName) {
      toast.error(`حقل "${activeFieldDef.label}" يتطلب إرفاق مستند رسمي لإثبات التعديل`);
      return;
    }

    setIsSubmitting(true);
    try {
      const reqNumber = `DU-${String(allRequests.length + 101).padStart(4, "0")}`;
      const empName = String(currentEmployee.full_name || currentEmployee.employee_name || "موظف");
      const empNo = String(currentEmployee.emp_no || "");
      const branch = String(currentEmployee.branch || "الفرع الرئيسي");
      const department = String(currentEmployee.department || "غير محدد");
      const directManager = String(
        currentEmployee.manager_name || currentEmployee.direct_manager || "المدير المباشر",
      );

      const approverNames = (resolvedApprovalGroup?.approvers || []).map(
        (a) => `${a.name} (${a.roleLabel})`,
      );

      const awaitingText = isDirectManagerEnabled
        ? `المدير المباشر (${directManager}) / ${resolvedApprovalGroup?.name || "مجموعة الاعتماد"}`
        : resolvedApprovalGroup?.name || "مجموعة الاعتماد";

      const newReq: DataUpdateRequestItem = {
        id: `du-${Date.now()}`,
        requestNumber: reqNumber,
        employeeId: String(currentEmployee.id || ""),
        empNo,
        employeeName: empName,
        branch,
        department,
        directManagerName: directManager,
        userGroupId: resolvedGroup.id,
        userGroupName: resolvedGroup.name,
        approvalGroupId: resolvedApprovalGroup?.id || "ag-hr-main",
        approvalGroupName: resolvedApprovalGroup?.name || "مجموعة اعتماد الموارد البشرية",
        allowDirectManager: isDirectManagerEnabled,
        directManagerStatus: isDirectManagerEnabled ? "pending" : "not_required",
        fieldKey: activeFieldDef.key,
        fieldLabel: activeFieldDef.label,
        oldValue: currentSystemValue || "غير محدد",
        newValue: newValueInput.trim(),
        reason: reasonInput.trim() || `طلب تعديل ${activeFieldDef.label}`,
        attachmentName: attachmentName || undefined,
        attachmentDataUrl: attachmentDataUrl || undefined,
        status: "pending",
        awaitingText,
        authorizedApproverNames: approverNames,
        appliedToEmployeeRecord: false,
        replies: [
          {
            id: `rep-init-${Date.now()}`,
            authorName: empName,
            authorRole: "الموظف مقدم الطلب",
            message: reasonInput.trim() || `تم تقديم طلب لتحديث ${activeFieldDef.label}`,
            actionType: "reply",
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      };

      const updatedRequests = [newReq, ...allRequests];
      const json = saveDataUpdateRequestsLocal(updatedRequests);
      await saveRequests.mutateAsync({ requests_json: json });

      // Save into approval_requests table
      try {
        await saveApprovalRequest.mutateAsync({
          employee_id: String(currentEmployee.id),
          employee_name: empName,
          emp_no: empNo,
          branch,
          department,
          category: "شؤون موظفين",
          request_type: `طلب تحديث بيانات (${activeFieldDef.label})`,
          request_subject: `تعديل ${activeFieldDef.label}: من [${currentSystemValue}] إلى [${newValueInput.trim()}]`,
          request_details: reasonInput.trim() || `طلب تحديث ${activeFieldDef.label}`,
          approval_chain: isDirectManagerEnabled
            ? `المدير المباشر، ${resolvedApprovalGroup?.name || "الموارد البشرية"}`
            : resolvedApprovalGroup?.name || "الموارد البشرية",
          direct_manager_name: directManager,
          awaiting_approver_name: awaitingText,
          awaiting_stage: isDirectManagerEnabled
            ? "المدير المباشر"
            : resolvedApprovalGroup?.name || "موارد بشرية",
          status: "pending",
          request_date: new Date().toISOString().slice(0, 10),
          entered_at: new Date().toISOString(),
        });
      } catch {
        // ignore
      }

      toast.success(`تم إرسال طلب تحديث البيانات (${reqNumber}) إلى سلسلة الموافقات بنجاح`);
      setIsRequestModalOpen(false);
    } catch {
      toast.error("تعذر إرسال الطلب، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Save handler for basic employee data
  const handleSaveFormData = async () => {
    if (!currentEmployee) return;
    try {
      await saveEmployee.mutateAsync({
        ...currentEmployee,
        ...formData,
        id: currentEmployee.id,
      });
      toast.success("تم حفظ البيانات بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حفظ البيانات");
    }
  };

  if (isLoading || !currentEmployee) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f0f4f9]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-4 border-[#0070c0]/20 border-t-[#0070c0] animate-spin" />
          <span className="text-xs font-bold text-slate-600">جاري تحميل بوابة الموظف...</span>
        </div>
      </div>
    );
  }

  const employeeName = currentEmployee.full_name || "أحمد محمد السيد السيد";

  return (
    <div dir="rtl" className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans antialiased">
      {/* =====================================================================
          1. TOP APP BAR (Exact match to Screenshots)
         ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Right side (RTL): Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-teal-500 text-white shadow-xs">
              <Users className="size-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 leading-tight">
                الموارد البشرية | HR
              </div>
              <div className="text-[11px] font-semibold text-slate-500">بوابة الموظف</div>
            </div>
          </div>

          {/* Left side (RTL): Welcome + Notifications + Lang + Logout */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-700">
              مرحبا ، <span className="font-black text-slate-900">{employeeName}</span>
            </span>

            <button
              type="button"
              title="الإشعارات"
              className="text-slate-500 hover:text-slate-800 transition"
            >
              <Bell className="size-4.5" />
            </button>

            <button
              type="button"
              title="تغيير اللغة"
              className="text-slate-500 hover:text-slate-800 transition"
            >
              <Globe className="size-4.5" />
            </button>

            <Link
              to="/"
              title="تسجيل الخروج والعودة للنظام الرئيسي"
              className="flex items-center text-rose-600 hover:text-rose-700 transition"
            >
              <LogOut className="size-4.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. DARK BLUE NAVBAR (Exact match to Screenshots)
         ===================================================================== */}
      <div className="bg-[#16325c] text-white shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 overflow-x-auto py-1">
          <nav className="flex items-center gap-1 text-xs font-bold py-1">
            {/* 1. بيانات الموظف */}
            <button
              type="button"
              onClick={() => setActiveNavTab("profile")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
                activeNavTab === "profile"
                  ? "bg-[#0284c7] text-white font-black shadow-xs"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <User className="size-3.5" />
              <span>بيانات الموظف</span>
            </button>

            {/* 2. المسائلات */}
            <button
              type="button"
              onClick={() => setActiveNavTab("inquiries")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                activeNavTab === "inquiries"
                  ? "bg-[#0284c7] text-white font-black shadow-xs"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <MessageSquare className="size-3.5" />
              <span>المسائلات</span>
            </button>

            {/* 3. مسير الرواتب */}
            <button
              type="button"
              onClick={() => setActiveNavTab("payroll")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                activeNavTab === "payroll"
                  ? "bg-[#0284c7] text-white font-black shadow-xs"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <FileText className="size-3.5" />
              <span>مسير الرواتب</span>
            </button>

            {/* 4. الطلبات (مع قائمة منسدلة لتحديث البيانات وتقديم الطلبات) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsRequestsDropdownOpen((prev) => !prev);
                  setIsReportsDropdownOpen(false);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition ${
                  activeNavTab === "requests"
                    ? "bg-[#0284c7] text-white font-black shadow-xs"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <Folder className="size-3.5" />
                <span>الطلبات</span>
                <ChevronDown className="size-3 opacity-70" />
              </button>

              {isRequestsDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-1 text-slate-800 shadow-xl z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRequestsDropdownOpen(false);
                      handleOpenRequestForField("department");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-xs font-bold text-[#0070c0] hover:bg-blue-50 transition"
                  >
                    <Send className="size-3.5" />
                    <span>تقديم طلب تحديث بيانات الآن</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRequestsDropdownOpen(false);
                      setActiveNavTab("requests");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Clock className="size-3.5" />
                    <span>متابعة طلبات تحديث البيانات ({employeeRequests.length})</span>
                  </button>
                  <div className="my-1 h-px bg-slate-100" />
                  <Link
                    to="/leaves"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Calendar className="size-3.5" />
                    <span>طلب إجازة</span>
                  </Link>
                  <Link
                    to="/loans"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FileText className="size-3.5" />
                    <span>طلب سلفة</span>
                  </Link>
                  <Link
                    to="/permits"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Briefcase className="size-3.5" />
                    <span>أذونات الغياب والمغادرة</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 5. التقارير */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsReportsDropdownOpen((prev) => !prev);
                  setIsRequestsDropdownOpen(false);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition ${
                  activeNavTab === "reports"
                    ? "bg-[#0284c7] text-white font-black shadow-xs"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <FileCheck className="size-3.5" />
                <span>التقارير</span>
                <ChevronDown className="size-3 opacity-70" />
              </button>

              {isReportsDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1 text-slate-800 shadow-xl z-50">
                  <Link
                    to="/reports/attendance-detailed"
                    className="block rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                  >
                    تقرير الحضور والانصراف
                  </Link>
                  <Link
                    to="/reports/payroll-sheet"
                    className="block rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                  >
                    تقرير الراتب والمسير
                  </Link>
                  <Link
                    to="/reports/employee-leaves"
                    className="block rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                  >
                    تقرير رصيد الإجازات
                  </Link>
                </div>
              )}
            </div>

            {/* 6. النماذج */}
            <Link
              to="/reports/admin-forms"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-white/10 transition"
            >
              <FileCheck className="size-3.5" />
              <span>النماذج</span>
            </Link>

            {/* 7. تقييم الأداء */}
            <Link
              to="/reports/evaluation"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-white/10 transition"
            >
              <Star className="size-3.5" />
              <span>تقييم الأداء</span>
            </Link>

            {/* 8. إدارة المهام */}
            <Link
              to="/tasks"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-200 hover:bg-white/10 transition"
            >
              <ListTodo className="size-3.5" />
              <span>إدارة المهام</span>
            </Link>
          </nav>

          {/* Quick Trigger: Request Data Update */}
          <button
            type="button"
            onClick={() => handleOpenRequestForField("department")}
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-[#0070c0] hover:bg-[#005fa3] px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition"
          >
            <Send className="size-3.5" />
            <span>طلب تحديث بيانات</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          3. MAIN CONTENT CONTAINER
         ===================================================================== */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 space-y-4">
        {/* If Active Tab is "Requests": show the Data Update Tracker */}
        {activeNavTab === "requests" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white p-4 shadow-xs">
              <div>
                <h2 className="text-base font-black text-[#004e82]">
                  طلبات تحديث وتعديل البيانات للموظف
                </h2>
                <p className="text-xs text-slate-500">
                  متابعة حالة الطلبات المرفوعة وسلاسل الموافقات والردود المسجلة
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenRequestForField("department")}
                className="flex items-center gap-1.5 rounded-xl bg-[#0070c0] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa3]"
              >
                <PlusCircle className="size-4" />
                <span>تقديم طلب جديد</span>
              </button>
            </div>

            {/* Requests Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              {employeeRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <FileText className="mx-auto size-12 opacity-30 mb-2" />
                  <p className="text-xs font-bold text-slate-600">لا توجد طلبات تحديث بيانات مقدمة حالياً</p>
                  <button
                    type="button"
                    onClick={() => handleOpenRequestForField("department")}
                    className="mt-3 rounded-lg bg-[#0070c0] px-4 py-1.5 text-xs font-bold text-white"
                  >
                    تقديم أول طلب تحديث بيانات
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">رقم الطلب</th>
                        <th className="px-3 py-2.5">البيان المطلوب تعديله</th>
                        <th className="px-3 py-2.5">القيمة السابقة</th>
                        <th className="px-3 py-2.5">القيمة المطلوبة</th>
                        <th className="px-3 py-2.5">مرحلة الاعتماد / بانتظار</th>
                        <th className="px-3 py-2.5 text-center">الحالة</th>
                        <th className="px-3 py-2.5">تاريخ التقديم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employeeRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-mono font-black text-[#0070c0]">
                            {req.requestNumber}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-800">
                            {req.fieldLabel}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 line-through">
                            {req.oldValue}
                          </td>
                          <td className="px-3 py-2.5 font-black text-emerald-700">
                            {req.newValue}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="text-slate-700">{req.awaitingText}</div>
                            {req.allowDirectManager && (
                              <span className="text-[10px] text-emerald-700 font-bold block">
                                {req.directManagerStatus === "approved"
                                  ? "✓ وافق المدير المباشر"
                                  : "بانتظار المدير المباشر"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                                req.status === "approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : req.status === "rejected"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {req.status === "approved"
                                ? "معتمد وتم التحديث"
                                : req.status === "rejected"
                                  ? "مرفوض"
                                  : "قيد المراجعة"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-500">
                            {req.createdAt.slice(0, 10)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Default Tab: "بيانات الموظف" (Matching Screenshots 2-5 exactly) */
          <div className="space-y-4">
            {/* Top Hero Section: Avatar + Status + 4 Bottom Pills */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-col items-center justify-center text-center">
                {/* Circular Avatar */}
                <div className="relative mb-2">
                  <div className="flex size-24 items-center justify-center rounded-full border-4 border-emerald-500 bg-slate-100 overflow-hidden shadow-xs">
                    <svg viewBox="0 0 100 100" className="size-20 text-slate-700" fill="currentColor">
                      <circle cx="50" cy="36" r="18" fill="#334155" />
                      <path d="M20 88 C20 64, 80 64, 80 88 Z" fill="#1e293b" />
                    </svg>
                  </div>
                </div>

                {/* Name */}
                <h1 className="text-base font-black text-slate-900">{employeeName}</h1>

                {/* Status Pill: مفعل */}
                <div className="mt-1">
                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700">
                    مفعل
                  </span>
                </div>

                {/* 4 Status Pills (Exact match to screenshots) */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {/* على راس العمل */}
                  <div
                    onClick={() => setStatusFlags((p) => ({ ...p, onDuty: !p.onDuty }))}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white cursor-pointer transition shadow-2xs ${
                      statusFlags.onDuty ? "bg-[#0284c7]" : "bg-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>على راس العمل</span>
                  </div>

                  {/* مقيد موارد */}
                  <div
                    onClick={() => setStatusFlags((p) => ({ ...p, mawaridRegistered: !p.mawaridRegistered }))}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white cursor-pointer transition shadow-2xs ${
                      statusFlags.mawaridRegistered ? "bg-[#0284c7]" : "bg-rose-600"
                    }`}
                  >
                    {statusFlags.mawaridRegistered ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <XCircle className="size-3.5" />
                    )}
                    <span>مقيد موارد</span>
                  </div>

                  {/* مستثنى من خصومات البصمة */}
                  <div
                    onClick={() => setStatusFlags((p) => ({ ...p, exemptFingerprint: !p.exemptFingerprint }))}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white cursor-pointer transition shadow-2xs ${
                      statusFlags.exemptFingerprint ? "bg-[#0284c7]" : "bg-rose-600"
                    }`}
                  >
                    {statusFlags.exemptFingerprint ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <XCircle className="size-3.5" />
                    )}
                    <span>مستثنى من خصومات البصمة</span>
                  </div>

                  {/* عرض فى تقارير البصمه */}
                  <div
                    onClick={() => setStatusFlags((p) => ({ ...p, showFingerprintReports: !p.showFingerprintReports }))}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white cursor-pointer transition shadow-2xs ${
                      statusFlags.showFingerprintReports ? "bg-[#0284c7]" : "bg-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>عرض فى تقارير البصمه</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Category Tabs (البيانات الاساسية / التأمين الطبي / المرافقين) */}
            <div className="flex items-center border-b border-slate-200 bg-white rounded-t-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setTopCategoryTab("basic")}
                className={`flex-1 py-3 text-center text-xs font-black transition ${
                  topCategoryTab === "basic"
                    ? "bg-[#1f64aa] text-white shadow-inner"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                البيانات الاساسية
              </button>
              <button
                type="button"
                onClick={() => setTopCategoryTab("medical")}
                className={`flex-1 py-3 text-center text-xs font-bold transition ${
                  topCategoryTab === "medical"
                    ? "bg-[#1f64aa] text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                التأمين الطبي
              </button>
              <button
                type="button"
                onClick={() => setTopCategoryTab("dependents")}
                className={`flex-1 py-3 text-center text-xs font-bold transition ${
                  topCategoryTab === "dependents"
                    ? "bg-[#1f64aa] text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                المرافقين
              </button>
            </div>

            {/* Main Split Body: Right Sidebar + Left Form Content */}
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {/* Right Sidebar Menu (بيانات الموظف) */}
              <div className="w-full md:w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs shrink-0 space-y-1">
                <div className="px-2 py-1 text-xs font-bold text-slate-500 mb-1">
                  بيانات الموظف
                </div>

                {[
                  { key: "personal", label: "البيانات الشخصيه" },
                  { key: "work", label: "بيانات العمل" },
                  { key: "gosi", label: "بيانات التأمينات الاجتماعية" },
                  { key: "contact", label: "بيانات التواصل" },
                  { key: "notes", label: "ملاحظات" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSubSection(item.key as any)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-right text-xs font-bold transition cursor-pointer ${
                      subSection === item.key
                        ? "bg-[#1679bd] text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Left Content Form Panel */}
              <div className="flex-1 w-full space-y-4">
                {/* 1. البيانات الشخصية (Screenshot 2) */}
                {subSection === "personal" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-[#004e82] flex items-center gap-1.5">
                        <User className="size-4 text-[#0070c0]" />
                        <span>البيانات الشخصيه</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleOpenRequestForField("social_status")}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#0070c0] hover:underline"
                      >
                        <Send className="size-3" />
                        <span>طلب تعديل بيان شخصي</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Row 1 */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          اسم الموظف رباعي
                        </label>
                        <input
                          type="text"
                          value={formData["full_name"] || ""}
                          onChange={(e) => updateField("full_name", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          اسم الموظف بالانجليزيه
                        </label>
                        <input
                          type="text"
                          value={formData["full_name_en"] || "Ahmed Mohammed Alsayed Alsayed"}
                          onChange={(e) => updateField("full_name_en", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          الحاله الاجتماعيه
                        </label>
                        <select
                          value={formData["marital_status"] || "متزوج"}
                          onChange={(e) => updateField("marital_status", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        >
                          <option value="متزوج">متزوج</option>
                          <option value="أعزب">أعزب</option>
                          <option value="مطلق">مطلق</option>
                          <option value="أرمل">أرمل</option>
                        </select>
                      </div>

                      {/* Row 2 */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          رقم الهويه
                        </label>
                        <input
                          type="text"
                          value={formData["national_id"] || "2609777368"}
                          onChange={(e) => updateField("national_id", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          الرقم الوظيفي
                        </label>
                        <input
                          type="text"
                          value={formData["emp_no"] || "10078"}
                          onChange={(e) => updateField("emp_no", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          رقم البصمه
                        </label>
                        <input
                          type="text"
                          value={formData["fingerprint_no"] || formData["emp_no"] || "10078"}
                          onChange={(e) => updateField("fingerprint_no", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      {/* Row 3 */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          الجنسيه
                        </label>
                        <select
                          value={formData["nationality"] || "مصري"}
                          onChange={(e) => updateField("nationality", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        >
                          <option value="مصري">مصري</option>
                          <option value="سعودي">سعودي</option>
                          <option value="سوداني">سوداني</option>
                          <option value="أردني">أردني</option>
                          <option value="سوري">سوري</option>
                          <option value="يمني">يمني</option>
                          <option value="أخرى">أخرى</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          الديانه
                        </label>
                        <select
                          value={formData["religion"] || "مسلم"}
                          onChange={(e) => updateField("religion", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        >
                          <option value="مسلم">مسلم</option>
                          <option value="مسيحي">مسيحي</option>
                          <option value="أخرى">أخرى</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          الجنس
                        </label>
                        <select
                          value={formData["gender"] || "ذكر"}
                          onChange={(e) => updateField("gender", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        >
                          <option value="ذكر">ذكر</option>
                          <option value="انثى">انثى</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          عدد افراد الاسره
                        </label>
                        <input
                          type="number"
                          value={formData["family_members_count"] ?? 3}
                          onChange={(e) => updateField("family_members_count", Number(e.target.value))}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. بيانات العمل (Screenshot 3) */}
                {subSection === "work" && (
                  <div className="space-y-3.5">
                    {/* Section 1: بيانات العمل */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-black text-[#004e82] flex items-center gap-1.5">
                          <Building className="size-4 text-[#0070c0]" />
                          <span>بيانات العمل</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleOpenRequestForField("branch")}
                          className="text-[11px] font-bold text-[#0070c0] hover:underline"
                        >
                          طلب تعديل الفرع / المسار ←
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المنطقه</label>
                          <input
                            type="text"
                            value={formData["region"] || "المنطقة الوسطى"}
                            onChange={(e) => updateField("region", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">الفرع</label>
                          <input
                            type="text"
                            value={formData["branch"] || "المتقدمة الاهلية - فرع قرطبة"}
                            onChange={(e) => updateField("branch", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">القسم الرئيسي</label>
                          <input
                            type="text"
                            value={formData["main_department"] || "بنين"}
                            onChange={(e) => updateField("main_department", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المسار</label>
                          <input
                            type="text"
                            value={formData["career_path"] || "الأهلي"}
                            onChange={(e) => updateField("career_path", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: jobDetails */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-black text-[#004e82] flex items-center gap-1.5">
                          <Briefcase className="size-4 text-[#0070c0]" />
                          <span>jobDetails</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleOpenRequestForField("department")}
                          className="text-[11px] font-bold text-[#0070c0] hover:underline"
                        >
                          طلب تعديل القسم / المستوى ←
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">القسم</label>
                          <input
                            type="text"
                            value={formData["department"] || "ابتدائي"}
                            onChange={(e) => updateField("department", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">القطاع</label>
                          <input
                            type="text"
                            value={formData["sector"] || "إدارة المجمعات التعليمية"}
                            onChange={(e) => updateField("sector", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المستوي الوظيفي</label>
                          <input
                            type="text"
                            value={formData["job_level"] || "تشغيلي"}
                            onChange={(e) => updateField("job_level", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المدير المباشر</label>
                          <input
                            type="text"
                            value={formData["manager_name"] || "حمدان مانع العمري"}
                            onChange={(e) => updateField("manager_name", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: الوظيفه الحاليه */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-black text-[#004e82] flex items-center gap-1.5">
                          <GraduationCap className="size-4 text-[#0070c0]" />
                          <span>الوظيفه الحاليه</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleOpenRequestForField("job_title")}
                          className="text-[11px] font-bold text-[#0070c0] hover:underline"
                        >
                          طلب تعديل الوظيفة / التخصص ←
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">جدول الدوام</label>
                          <input
                            type="text"
                            value={formData["attendance_schedule"] || "افتراضي"}
                            onChange={(e) => updateField("attendance_schedule", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">الوظيفه الحاليه</label>
                          <input
                            type="text"
                            value={formData["job_title"] || "معلم"}
                            onChange={(e) => updateField("job_title", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">التخصص</label>
                          <input
                            type="text"
                            value={formData["specialization"] || "تربية بدنية"}
                            onChange={(e) => updateField("specialization", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المسمي الوظيفي</label>
                          <input
                            type="text"
                            value={formData["job_designation"] || "معلم"}
                            onChange={(e) => updateField("job_designation", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: التواريخ */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <h4 className="text-xs font-black text-[#004e82] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Calendar className="size-4 text-[#0070c0]" />
                        <span>التواريخ</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">تاريخ التعيين</label>
                          <input
                            type="date"
                            value={formData["hire_date"] || "2026-09-13"}
                            onChange={(e) => updateField("hire_date", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">تاريخ مباشره العمل</label>
                          <input
                            type="date"
                            value={formData["start_date"] || "2026-09-13"}
                            onChange={(e) => updateField("start_date", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">احتساب الاجازة السنوية</label>
                          <input
                            type="date"
                            value={formData["leave_calc_date"] || "2026-09-13"}
                            onChange={(e) => updateField("leave_calc_date", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">تاريخ الميلاد</label>
                          <input
                            type="date"
                            value={formData["birth_date"] || "1993-08-21"}
                            onChange={(e) => updateField("birth_date", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 5: الخبرة و غيرها */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <h4 className="text-xs font-black text-[#004e82] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Award className="size-4 text-[#0070c0]" />
                        <span>الخبرة و غيرها</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">مده الخبره بالسنوات</label>
                          <input
                            type="number"
                            value={formData["experience_years"] ?? 5}
                            onChange={(e) => updateField("experience_years", Number(e.target.value))}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">فتره التجربه بالايام</label>
                          <input
                            type="number"
                            value={formData["probation_days"] ?? 90}
                            onChange={(e) => updateField("probation_days", Number(e.target.value))}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">تاريخ دخول المملكه</label>
                          <input
                            type="date"
                            value={formData["kingdom_entry_date"] || "2020-01-01"}
                            onChange={(e) => updateField("kingdom_entry_date", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">اخر مؤهل دراسي</label>
                          <input
                            type="text"
                            value={formData["last_qualification"] || "بكالوريوس"}
                            onChange={(e) => updateField("last_qualification", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. بيانات التأمينات الاجتماعية (Screenshot 4) */}
                {subSection === "gosi" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                    <h3 className="text-sm font-black text-[#004e82] flex items-center gap-1.5 border-b border-slate-100 pb-3">
                      <ShieldCheck className="size-4 text-[#0070c0]" />
                      <span>بيانات التأمينات الاجتماعيه</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">الرقم التأميني</label>
                        <input
                          type="text"
                          value={formData["gosi_no"] || ""}
                          onChange={(e) => updateField("gosi_no", e.target.value)}
                          placeholder="الرقم التأميني..."
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">تاريخ تسجيل التامين</label>
                        <input
                          type="date"
                          value={formData["gosi_date"] || ""}
                          onChange={(e) => updateField("gosi_date", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">مكان التأمين</label>
                        <input
                          type="text"
                          value={formData["gosi_city"] || ""}
                          onChange={(e) => updateField("gosi_city", e.target.value)}
                          placeholder="مكان التأمين..."
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. بيانات التواصل (Screenshot 5) */}
                {subSection === "contact" && (
                  <div className="space-y-3.5">
                    {/* Card 1: أرقام الهواتف */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <h4 className="text-xs font-black text-[#004e82] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Phone className="size-4 text-[#0070c0]" />
                        <span>أرقام الهواتف</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">التليفون</label>
                          <input
                            type="text"
                            value={formData["phone"] || ""}
                            onChange={(e) => updateField("phone", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم التليفون في البلد الاصل</label>
                          <input
                            type="text"
                            value={formData["home_country_phone"] || ""}
                            onChange={(e) => updateField("home_country_phone", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم الجوال</label>
                          <input
                            type="text"
                            value={formData["mobile"] || "574606701"}
                            onChange={(e) => updateField("mobile", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم الجوال في البلد الاصل</label>
                          <input
                            type="text"
                            value={formData["home_country_mobile"] || ""}
                            onChange={(e) => updateField("home_country_mobile", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card 2: العناوين */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <h4 className="text-xs font-black text-[#004e82] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <MapPin className="size-4 text-[#0070c0]" />
                        <span>العناوين</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">العنوان في البلد الاصل</label>
                          <textarea
                            rows={2}
                            value={formData["home_country_address"] || ""}
                            onChange={(e) => updateField("home_country_address", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">العنوان الحالي</label>
                          <textarea
                            rows={2}
                            value={formData["current_address"] || ""}
                            onChange={(e) => updateField("current_address", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card 3: تفاصيل العنوان */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <h4 className="text-xs font-black text-[#004e82] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Building className="size-4 text-[#0070c0]" />
                        <span>تفاصيل العنوان</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">العنوان المختصر</label>
                          <input
                            type="text"
                            value={formData["short_address"] || ""}
                            onChange={(e) => updateField("short_address", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم المبنى</label>
                          <input
                            type="text"
                            value={formData["building_no"] || ""}
                            onChange={(e) => updateField("building_no", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">الشارع</label>
                          <input
                            type="text"
                            value={formData["street"] || ""}
                            onChange={(e) => updateField("street", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">الحي</label>
                          <input
                            type="text"
                            value={formData["district"] || ""}
                            onChange={(e) => updateField("district", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المدينة</label>
                          <input
                            type="text"
                            value={formData["city"] || ""}
                            onChange={(e) => updateField("city", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المنطقه</label>
                          <input
                            type="text"
                            value={formData["region"] || ""}
                            onChange={(e) => updateField("region", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card 4: البريد الإلكتروني */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <h4 className="text-xs font-black text-[#004e82] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Mail className="size-4 text-[#0070c0]" />
                        <span>البريد الإلكتروني</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">البريد الالكتروني</label>
                          <input
                            type="email"
                            value={formData["email"] || "ahmed.elsayed708@gmail.com"}
                            onChange={(e) => updateField("email", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">البريد الالكتروني الخاص</label>
                          <input
                            type="email"
                            value={formData["private_email"] || "ahmed.elsayed708@gmail.com"}
                            onChange={(e) => updateField("private_email", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">مكان الميلاد</label>
                          <input
                            type="text"
                            value={formData["birth_place"] || "مصر"}
                            onChange={(e) => updateField("birth_place", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. ملاحظات */}
                {subSection === "notes" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                    <h3 className="text-sm font-black text-[#004e82] border-b border-slate-100 pb-2">
                      ملاحظات الموظف
                    </h3>
                    <textarea
                      rows={4}
                      value={formData["notes"] || ""}
                      onChange={(e) => updateField("notes", e.target.value)}
                      placeholder="اكتب ملاحظاتك هنا..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs"
                    />
                  </div>
                )}

                {/* Bottom Center Save Button (Exact match: Green button centered) */}
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveFormData()}
                    className="rounded-full bg-[#198754] px-10 py-2.5 text-xs font-black text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Bell Button (Exact match to screenshots) */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          type="button"
          onClick={() => handleOpenRequestForField("department")}
          title="تقديم طلب تحديث بيانات فوري"
          className="flex size-12 items-center justify-center rounded-full bg-[#0d1b2a] text-white shadow-xl hover:bg-[#16325c] hover:scale-105 active:scale-95 transition"
        >
          <Bell className="size-5" />
        </button>
      </div>

      {/* =====================================================================
          MODAL: تقديم طلب تحديث بيانات رسمي (في حالة الموظف هيرفع طلب الآن)
         ===================================================================== */}
      {isRequestModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          dir="rtl"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#0070c0]">
                  <Send className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#004e82]">
                    تقديم طلب تحديث بيانات الموظف
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {employeeName} — رقم وظيفي: #{currentEmployee.emp_no || "10078"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Field selection */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-black text-slate-700">
                  اختر البيان / الحقل المطلوب تعديله *
                </span>
                <select
                  value={selectedFieldKey}
                  onChange={(e) => {
                    setSelectedFieldKey(e.target.value);
                    setNewValueInput("");
                  }}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                >
                  {allowedFields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label} ({f.category})
                    </option>
                  ))}
                </select>
              </label>

              {/* Current Value Display */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <span className="text-[11px] font-bold text-slate-500 block">
                  القيمة المسجلة حالياً في النظام:
                </span>
                <span className="text-xs font-black text-slate-800 mt-0.5 block">
                  {currentSystemValue || "غير محددة حالياً"}
                </span>
              </div>

              {/* New Value Input */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black text-emerald-800">
                  القيمة الجديدة المطلوبة لـ ({activeFieldDef.label}) *
                </span>
                {activeFieldDef.inputType === "select_or_text" && fieldSelectOptions.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={fieldSelectOptions.includes(newValueInput) ? newValueInput : ""}
                      onChange={(e) => {
                        if (e.target.value) setNewValueInput(e.target.value);
                      }}
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                    >
                      <option value="">-- اختر من القائمة أو اكتب بالأسفل --</option>
                      {fieldSelectOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder={`أو اكتب ${activeFieldDef.label} الجديد هنا...`}
                      value={newValueInput}
                      onChange={(e) => setNewValueInput(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={`أدخل ${activeFieldDef.label} الجديد...`}
                    value={newValueInput}
                    onChange={(e) => setNewValueInput(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                  />
                )}
              </div>

              {/* Reason */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-black text-slate-700">
                  سبب طلب التعديل / الملاحظات
                </span>
                <textarea
                  rows={2}
                  placeholder="اكتب أسباب ومبررات التعديل..."
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#0070c0]"
                />
              </label>

              {/* Attachment */}
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                    <Paperclip className="size-3.5 text-[#0070c0]" />
                    مستند الإثبات المرفق{" "}
                    {currentFieldRule.requiresAttachment ? (
                      <span className="text-rose-600 font-black">(إلزامي لهذا الحقل *)</span>
                    ) : (
                      <span className="text-slate-400 font-normal">(اختياري)</span>
                    )}
                  </span>
                  {attachmentName && (
                    <span className="text-[10px] font-bold text-emerald-700 truncate max-w-[150px]">
                      {attachmentName}
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-600 file:ml-3 file:rounded-lg file:border-0 file:bg-[#0070c0] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white cursor-pointer"
                />
              </div>

              {/* Approval Route Preview */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs space-y-1">
                <span className="font-black text-[#004e82] block">
                  مسار الاعتماد المبرمج لهذا الطلب:
                </span>
                <p className="text-[11px] text-slate-600">
                  {isDirectManagerEnabled
                    ? `1. موافقة المدير المباشر (${currentEmployee.manager_name || currentEmployee.direct_manager || "المدير المباشر"}) ← 2. اعتمادات ${resolvedApprovalGroup?.name || "الموارد البشرية"}`
                    : `1. تحويل مباشر إلى ${resolvedApprovalGroup?.name || "مجموعة اعتماد الموارد البشرية"}`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSubmitDataUpdateRequest()}
                className="flex items-center gap-1.5 rounded-lg bg-[#0070c0] px-5 py-2 text-xs font-black text-white shadow-xs hover:bg-[#005fa3] disabled:opacity-50"
              >
                <Send className="size-3.5" />
                {isSubmitting ? "جاري الإرسال..." : "إرسال طلب التحديث"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
