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
  Search,
  FileSpreadsheet,
  RotateCw,
  Database,
  Download,
  AlertCircle,
  ArrowRight,
  UploadCloud,
  Printer,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { supabase } from "@/integrations/supabase/client";
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
    reqView?: "employee" | "manager" | undefined;
    reqSubTab?: "leaves" | "misc" | undefined;
    subTab?: "personal" | "work" | "gosi" | "contact" | "notes" | undefined;
  } => {
    const rawEmp = search["employeeId"];
    const rawTab = search["tab"];
    const rawReqView = search["reqView"];
    const rawReqSubTab = search["reqSubTab"];
    const rawSub = search["subTab"];
    return {
      employeeId: typeof rawEmp === "string" ? rawEmp : undefined,
      tab: typeof rawTab === "string" ? (rawTab as any) : "profile",
      reqView: typeof rawReqView === "string" ? (rawReqView as any) : "employee",
      reqSubTab: typeof rawReqSubTab === "string" ? (rawReqSubTab as any) : "leaves",
      subTab: typeof rawSub === "string" ? (rawSub as any) : "personal",
    };
  },
  head: () => ({
    meta: [
      { title: "بوابة الموظف | نظام الموارد البشرية" },
      {
        name: "description",
        content: "بوابة الخدمة الذاتية للموظف: استعراض وتحديث البيانات، رفع الطلبات، ومتابعة الرواتب والمسائلات.",
      },
    ],
  }),
  component: EmployeePortalPage,
});

export function EmployeePortalPage() {
  const {
    employeeId: paramEmpId,
    tab: searchTab,
    reqView: searchReqView,
    reqSubTab: searchReqSubTab,
    subTab: searchSubTab,
  } = Route.useSearch();
  const navigate = useNavigate();

  const { data: employees = [], isLoading } = useRows("employees") as {
    data?: any[];
    isLoading?: boolean;
  };
  const { data: inquiries = [] } = useRows("inquiries") as { data?: any[] };
  const { data: leaveRequests = [] } = useRows("leave_requests") as { data?: any[] };
  const saveEmployee = useSaveRow("employees");
  const saveApprovalRequest = useSaveRow("approval_requests");
  const saveLeaveRequest = useSaveRow("leave_requests");
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
    if (paramEmpId && employees.length) {
      const found = employees.find(
        (e) => String(e.id) === paramEmpId || String(e.emp_no) === paramEmpId,
      );
      if (found) return found;
    }
    // Default to Ahmed Mohamed El Sayed
    const ahmed = employees.find((e) =>
      String(e.full_name || "").includes("أحمد محمد السيد"),
    );
    if (ahmed) return ahmed;
    if (employees.length) return employees[0];

    // Fallback Ahmed Mohamed El Sayed standard demo data
    return {
      id: "emp-10078",
      emp_no: "10078",
      full_name: "أحمد محمد السيد السيد",
      full_name_en: "Ahmed Mohammed Alsayed Alsayed",
      national_id: "2609777368",
      marital_status: "متزوج",
      job_title: "معلم",
      department: "ابتدائي",
      branch: "المتقدمة الاهلية - فرع قرطبة",
      nationality: "مصري",
      gender: "ذكر",
      religion: "مسلم",
      family_members_count: 3,
      basic_salary: 5000,
      allowances: 1500,
      phone: "574606701",
      email: "ahmed.elsayed708@gmail.com",
      manager_name: "حمدان مانع العمري",
      career_path: "الأهلي",
      main_department: "بنين",
      sector: "إدارة المجمعات التعليمية",
      job_level: "تشغيلي",
      attendance_schedule: "افتراضي",
      specialization: "تربية بدنية",
      job_designation: "معلم",
      hire_date: "2026-09-13",
      start_date: "2026-09-13",
      leave_calc_date: "2026-09-13",
      birth_date: "1993-08-21",
      last_qualification: "بكالوريوس",
    };
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

  // Check if current employee has subordinate team members
  const subordinates = useMemo(() => {
    if (!currentEmployee) return [];
    const name = String(currentEmployee.full_name || "");
    const id = String(currentEmployee.id || "");
    return employees.filter(
      (e) =>
        (e.manager_name && e.manager_name === name) ||
        (e.direct_manager && e.direct_manager === name) ||
        (e.manager_id && String(e.manager_id) === id),
    );
  }, [currentEmployee, employees]);

  // Filter Inquiries for current employee
  const employeeInquiries = useMemo(() => {
    if (!currentEmployee) return [];
    const empId = String(currentEmployee.id || "");
    const empNo = String(currentEmployee.emp_no || "");
    const name = String(currentEmployee.full_name || "");
    return inquiries.filter(
      (inq: any) =>
        (empId && String(inq.employee_id) === empId) ||
        (empNo && String(inq.emp_no) === empNo) ||
        (name && inq.employee_name === name),
    );
  }, [currentEmployee, inquiries]);

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

  // Navigation tab state
  const [activeNavTab, setActiveNavTab] = useState<string>(searchTab || "profile");
  const [reqView, setReqView] = useState<"employee" | "manager">(searchReqView || "employee");
  const [reqSubTab, setReqSubTab] = useState<"leaves" | "misc">(searchReqSubTab || "leaves");
  const [isRequestsDropdownOpen, setIsRequestsDropdownOpen] = useState(false);
  const [isReportsDropdownOpen, setIsReportsDropdownOpen] = useState(false);

  // Keep state synced if URL search params change
  useEffect(() => {
    if (searchTab && searchTab !== activeNavTab) setActiveNavTab(searchTab);
  }, [searchTab]);

  useEffect(() => {
    if (searchReqView && searchReqView !== reqView) setReqView(searchReqView);
  }, [searchReqView]);

  useEffect(() => {
    if (searchReqSubTab && searchReqSubTab !== reqSubTab) setReqSubTab(searchReqSubTab);
  }, [searchReqSubTab]);

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

  // =========================================================================
  // Screen States: INQUIRIES (Screenshot 1)
  // =========================================================================
  const [inquirySearch, setInquirySearch] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [inquiryReplyText, setInquiryReplyText] = useState("");

  const filteredInquiries = useMemo(() => {
    if (!inquirySearch.trim()) return employeeInquiries;
    const q = inquirySearch.toLowerCase();
    return employeeInquiries.filter(
      (inq: any) =>
        String(inq.inquiry_name || "").toLowerCase().includes(q) ||
        String(inq.inquiry_type || "").toLowerCase().includes(q) ||
        String(inq.notes || "").toLowerCase().includes(q),
    );
  }, [employeeInquiries, inquirySearch]);

  // =========================================================================
  // Screen States: PAYROLL (Screenshot 2)
  // =========================================================================
  const [payrollYear, setPayrollYear] = useState("2026");
  const [payrollMonth, setPayrollMonth] = useState("");
  const [payrollEntitlement, setPayrollEntitlement] = useState("");
  const [payrollDeduction, setPayrollDeduction] = useState("");
  const [showFingerprintDetails, setShowFingerprintDetails] = useState(true);
  const [exportAllData, setExportAllData] = useState(false);
  const [showSalaryStatement, setShowSalaryStatement] = useState(false);

  // =========================================================================
  // Screen States: LEAVES & REQUESTS (Screenshot 3)
  // =========================================================================
  const [leaveType, setLeaveType] = useState("");
  const [leaveName, setLeaveName] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveNotes, setLeaveNotes] = useState("");
  const [leaveAttachmentName, setLeaveAttachmentName] = useState("");
  const [isSavingLeave, setIsSavingLeave] = useState(false);

  // Calculate days difference
  const calculatedLeaveDays = useMemo(() => {
    if (!leaveStartDate || !leaveEndDate) return 0;
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [leaveStartDate, leaveEndDate]);

  // Submit Leave Request
  const handleSaveLeaveRequest = async () => {
    if (!leaveType) {
      toast.error("يرجى تحديد نوع الإجازة");
      return;
    }
    if (!leaveStartDate) {
      toast.error("يرجى إدخال تاريخ بداية الإجازة");
      return;
    }
    if (!leaveEndDate) {
      toast.error("يرجى إدخال تاريخ نهاية الإجازة");
      return;
    }
    if (calculatedLeaveDays <= 0) {
      toast.error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
      return;
    }

    setIsSavingLeave(true);
    try {
      const empName = currentEmployee.full_name || "أحمد محمد السيد السيد";
      const empId = String(currentEmployee.id || "");
      const directMgr = currentEmployee.manager_name || "حمدان مانع العمري";

      // 1. Save to leave_requests
      await saveLeaveRequest.mutateAsync({
        employee_id: empId,
        employee_name: empName,
        leave_type: leaveName || leaveType,
        days: calculatedLeaveDays,
        from_date: leaveStartDate,
        to_date: leaveEndDate,
        notes: leaveNotes || `طلب إجازة (${leaveType})`,
        balance_before: 21,
        status: "pending",
      });

      // 2. Save into approval_requests
      await saveApprovalRequest.mutateAsync({
        employee_id: empId,
        employee_name: empName,
        emp_no: currentEmployee.emp_no || "10078",
        branch: currentEmployee.branch || "المتقدمة الاهلية - فرع قرطبة",
        department: currentEmployee.department || "ابتدائي",
        category: "إجازات",
        request_type: `طلب إجازة (${leaveType})`,
        request_subject: `إجازة ${leaveType} لمدة ${calculatedLeaveDays} يوم من ${leaveStartDate} إلى ${leaveEndDate}`,
        request_details: leaveNotes || `طلب إجازة ${leaveType}`,
        approval_chain: `المدير المباشر (${directMgr})، الموارد البشرية`,
        direct_manager_name: directMgr,
        awaiting_approver_name: `المدير المباشر (${directMgr})`,
        awaiting_stage: "المدير المباشر",
        status: "pending",
        request_date: new Date().toISOString().slice(0, 10),
        entered_at: new Date().toISOString(),
      });

      toast.success(`تم حفظ طلب الإجازة (${calculatedLeaveDays} يوم) بنجاح وإرساله للمدير المباشر للاعتماد`);
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveNotes("");
      setLeaveAttachmentName("");
    } catch {
      toast.error("تعذر حفظ طلب الإجازة، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSavingLeave(false);
    }
  };

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
              onClick={() => toast.info("لا توجد إشعارات جديدة حالياً")}
              className="text-slate-500 hover:text-slate-800 transition"
            >
              <Bell className="size-4.5" />
            </button>

            <button
              type="button"
              title="تغيير اللغة"
              onClick={() => toast.info("اللغة الحالية: العربية")}
              className="text-slate-500 hover:text-slate-800 transition"
            >
              <Globe className="size-4.5" />
            </button>

            <button
              type="button"
              title="تسجيل الخروج والعودة للشاشة الرئيسية"
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("تم تسجيل الخروج بنجاح");
                navigate({ to: "/auth", replace: true });
              }}
              className="flex items-center text-rose-600 hover:text-rose-700 transition"
            >
              <LogOut className="size-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. DARK BLUE NAVBAR (Exact match to Screenshots)
         ===================================================================== */}
      <div className="bg-[#16325c] text-white shadow-xs relative z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-1">
          <nav className="flex items-center gap-1 text-xs font-bold py-1 flex-wrap sm:flex-nowrap">
            {/* 1. بيانات الموظف */}
            <button
              type="button"
              onClick={() => {
                setActiveNavTab("profile");
                setIsRequestsDropdownOpen(false);
                setIsReportsDropdownOpen(false);
              }}
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
              onClick={() => {
                setActiveNavTab("inquiries");
                setIsRequestsDropdownOpen(false);
                setIsReportsDropdownOpen(false);
              }}
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
              onClick={() => {
                setActiveNavTab("payroll");
                setIsRequestsDropdownOpen(false);
                setIsReportsDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                activeNavTab === "payroll"
                  ? "bg-[#0284c7] text-white font-black shadow-xs"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <FileText className="size-3.5" />
              <span>مسير الرواتب</span>
            </button>

            {/* 4. الطلبات (مع قائمة منسدلة: طلبات الموظف / طلبات المدير المباشر) */}
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
                <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1 text-slate-800 shadow-xl z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNavTab("requests");
                      setReqView("employee");
                      setIsRequestsDropdownOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-xs font-bold transition ${
                      activeNavTab === "requests" && reqView === "employee"
                        ? "bg-blue-50 text-[#0070c0]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Folder className="size-3.5" />
                    <span>طلبات الموظف</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveNavTab("requests");
                      setReqView("manager");
                      setIsRequestsDropdownOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-xs font-bold transition ${
                      activeNavTab === "requests" && reqView === "manager"
                        ? "bg-blue-50 text-[#0070c0]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="size-3.5" />
                    <span>طلبات المدير المباشر</span>
                  </button>
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

      {/* Backdrop for open dropdowns so clicking outside closes them smoothly */}
      {(isRequestsDropdownOpen || isReportsDropdownOpen) && (
        <div
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => {
            setIsRequestsDropdownOpen(false);
            setIsReportsDropdownOpen(false);
          }}
        />
      )}

      {/* =====================================================================
          3. MAIN CONTENT CONTAINER
         ===================================================================== */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 space-y-4">

        {/* ===================================================================
            VIEW 1: المسائلات (SCREENSHOT 1)
           =================================================================== */}
        {activeNavTab === "inquiries" && (
          <div className="space-y-3">
            {/* Solid Blue Header Banner */}
            <div className="bg-[#106ba3] py-2.5 px-4 text-center text-sm font-black text-white shadow-xs rounded-t-lg">
              المسائلات
            </div>

            {/* Search + Action Icons Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="...ابحث 🔍"
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                    className="h-8 w-44 sm:w-56 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#0070c0]"
                  />
                </div>

                {/* PDF Button */}
                <button
                  type="button"
                  title="تصدير PDF"
                  onClick={() => toast.info("جاري تجهيز تقرير المسائلات بصيغة PDF...")}
                  className="flex size-8 items-center justify-center rounded-md border border-slate-300 bg-white text-rose-600 hover:bg-rose-50 transition shadow-2xs"
                >
                  <FileText className="size-4" />
                </button>

                {/* Excel Button */}
                <button
                  type="button"
                  title="تصدير Excel"
                  onClick={() => toast.info("جاري تصدير المسائلات إلى ملف Excel...")}
                  className="flex size-8 items-center justify-center rounded-md border border-slate-300 bg-white text-emerald-600 hover:bg-emerald-50 transition shadow-2xs"
                >
                  <FileSpreadsheet className="size-4" />
                </button>

                {/* Database / Copy Button */}
                <button
                  type="button"
                  title="نسخ / قاعدة البيانات"
                  onClick={() => toast.info("تمت مزامنة سجلات المسائلات")}
                  className="flex size-8 items-center justify-center rounded-md border border-slate-300 bg-white text-teal-600 hover:bg-teal-50 transition shadow-2xs"
                >
                  <Database className="size-4" />
                </button>

                {/* Refresh Button */}
                <button
                  type="button"
                  title="تحديث الجدول"
                  onClick={() => toast.success("تم تحديث جدول المسائلات")}
                  className="flex size-8 items-center justify-center rounded-md border border-slate-300 bg-white text-emerald-600 hover:bg-emerald-50 transition shadow-2xs"
                >
                  <RotateCw className="size-4" />
                </button>
              </div>
            </div>

            {/* Navy Blue Header Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0f3560] text-white font-bold">
                  <tr>
                    <th className="px-4 py-2.5 text-center">
                      <div className="inline-flex items-center gap-1 cursor-pointer">
                        <span>عرض المحادثه</span>
                        <span className="text-[10px]">▼</span>
                      </div>
                    </th>
                    <th className="px-4 py-2.5">
                      <div className="inline-flex items-center gap-1 cursor-pointer">
                        <span>تاريخ الادخال</span>
                        <span className="text-[10px]">▼</span>
                      </div>
                    </th>
                    <th className="px-4 py-2.5">
                      <div className="inline-flex items-center gap-1 cursor-pointer">
                        <span>تاريخ المسائلة</span>
                        <span className="text-[10px]">▼</span>
                      </div>
                    </th>
                    <th className="px-4 py-2.5">
                      <div className="inline-flex items-center gap-1 cursor-pointer">
                        <span>التصنيف</span>
                        <span className="text-[10px]">▼</span>
                      </div>
                    </th>
                    <th className="px-4 py-2.5">
                      <div className="inline-flex items-center gap-1 cursor-pointer">
                        <span>ادارى/الى</span>
                        <span className="text-[10px]">▼</span>
                      </div>
                    </th>
                    <th className="px-4 py-2.5">
                      <div className="inline-flex items-center gap-1 cursor-pointer">
                        <span>تفاصيل</span>
                        <span className="text-[10px]">▼</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.length === 0 ? (
                    <tr className="bg-white">
                      <td colSpan={6} className="py-20 text-center text-xs font-semibold text-slate-400">
                        No data
                      </td>
                    </tr>
                  ) : (
                    filteredInquiries.map((inq: any) => (
                      <tr key={inq.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedInquiry(inq)}
                            className="inline-flex items-center gap-1 rounded bg-[#0070c0] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#005fa3]"
                          >
                            <MessageSquare className="size-3" />
                            <span>فتح</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {inq.entry_date || inq.created_at?.slice(0, 10) || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {inq.inquiry_date || "—"}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {inq.inquiry_type || inq.inquiry_name || "مسائلة إدارية"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {inq.department || inq.branch || "الموارد البشرية"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {inq.notes || inq.details || "لا توجد تفاصيل إضافية"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer (Exact match to screenshot) */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-2 py-1">
              <div className="flex items-center gap-2">
                <span>صفحة 1 من 1 ({filteredInquiries.length} عنصر)</span>
                <div className="inline-flex items-center gap-1">
                  <button type="button" disabled className="size-6 rounded border border-slate-200 bg-white text-slate-400 disabled:opacity-40">
                    &lt;
                  </button>
                  <span className="flex size-6 items-center justify-center rounded bg-[#106ba3] text-white font-bold text-xs">
                    1
                  </span>
                  <button type="button" disabled className="size-6 rounded border border-slate-200 bg-white text-slate-400 disabled:opacity-40">
                    &gt;
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-mono">
                <span className="cursor-pointer hover:text-slate-800">5</span>
                <span className="font-bold text-[#106ba3] underline cursor-pointer">10</span>
                <span className="cursor-pointer hover:text-slate-800">20</span>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 2: مسير الرواتب (SCREENSHOT 2)
           =================================================================== */}
        {activeNavTab === "payroll" && (
          <div className="space-y-3">
            {/* Solid Blue Header Banner */}
            <div className="bg-[#106ba3] py-2.5 px-4 text-center text-sm font-black text-white shadow-xs rounded-t-lg">
              مسير الرواتب
            </div>

            {/* Filter Card (Exact to screenshot 2) */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end text-xs">
                {/* 1. السنه */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">السنه</label>
                  <select
                    value={payrollYear}
                    onChange={(e) => setPayrollYear(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>

                {/* 2. الشهر */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">الشهر</label>
                  <select
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="">... اختر</option>
                    <option value="01">يناير</option>
                    <option value="02">فبراير</option>
                    <option value="03">مارس</option>
                    <option value="04">أبريل</option>
                    <option value="05">مايو</option>
                    <option value="06">يونيو</option>
                    <option value="07">يوليو</option>
                    <option value="08">أغسطس</option>
                    <option value="09">سبتمبر</option>
                    <option value="10">أكتوبر</option>
                    <option value="11">نوفمبر</option>
                    <option value="12">ديسمبر</option>
                  </select>
                </div>

                {/* 3. الاستحقاق */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">الاستحقاق</label>
                  <select
                    value={payrollEntitlement}
                    onChange={(e) => setPayrollEntitlement(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="">... اختر</option>
                    <option value="all">الكل</option>
                    <option value="basic">راتب أساسي</option>
                    <option value="housing">بدل سكن</option>
                    <option value="transport">بدل نقل</option>
                  </select>
                </div>

                {/* 4. الاستقطاعات */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">الاستقطاعات</label>
                  <select
                    value={payrollDeduction}
                    onChange={(e) => setPayrollDeduction(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="">... اختر</option>
                    <option value="all">الكل</option>
                    <option value="gosi">تأمينات اجتماعية</option>
                    <option value="absence">غياب وتأخير</option>
                    <option value="loans">سلف</option>
                  </select>
                </div>

                {/* 5. عرض تفاصيل البصمة */}
                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="fingerprintCheck"
                    checked={showFingerprintDetails}
                    onChange={(e) => setShowFingerprintDetails(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-[#0070c0]"
                  />
                  <label htmlFor="fingerprintCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                    عرض تفاصيل البصمة
                  </label>
                </div>

                {/* 6. زر بحث */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSalaryStatement(true);
                      toast.success("تم استرجاع بيانات مسير الراتب");
                    }}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0070c0] text-xs font-bold text-white shadow-2xs hover:bg-[#005fa3] transition"
                  >
                    <Search className="size-3.5" />
                    <span>بحث</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Secondary Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportAllData}
                    onChange={(e) => setExportAllData(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-[#0070c0]"
                  />
                  <span>تصدير كل الداتا</span>
                </label>

                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <span>الرقم المرجعي</span>
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toast.info("تمت إعادة ضبط الجدول")}
                  className="flex items-center gap-1 rounded-md bg-[#28a745] px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-2xs transition"
                >
                  <RotateCw className="size-3.5" />
                  <span>اعاده ضبط الجدول العمودي</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.success("جاري تصدير بيانات الراتب...")}
                  className="flex items-center gap-1 rounded-md bg-[#28a745] px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-2xs transition"
                >
                  <Download className="size-3.5" />
                  <span>تصدير</span>
                </button>
              </div>
            </div>

            {/* Blue Banner: لايوجد بيانات (Screenshot 2 exact) */}
            {!showSalaryStatement ? (
              <div className="bg-[#106ba3] py-2.5 px-4 text-center text-sm font-black text-white shadow-xs rounded-sm">
                لايوجد بيانات
              </div>
            ) : (
              /* When searched: Detailed Salary Breakdown */
              <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#004e82]">
                      كشف مسير الراتب — {employeeName} (#{currentEmployee.emp_no || "10078"})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      السنة: {payrollYear} | الحالة: معتمد ومحول بنكياً
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="size-3.5" />
                    <span>طباعة القسيمة</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
                    <span className="font-black text-emerald-800 block text-xs">الاستحقاقات الأساسية والبدلات</span>
                    <div className="flex justify-between py-1 border-b border-emerald-100">
                      <span className="text-slate-600">الراتب الأساسي:</span>
                      <span className="font-bold text-slate-900">5,000.00 ر.س</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-100">
                      <span className="text-slate-600">بدل السكن:</span>
                      <span className="font-bold text-slate-900">1,250.00 ر.س</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-100">
                      <span className="text-slate-600">بدل النقل:</span>
                      <span className="font-bold text-slate-900">500.00 ر.س</span>
                    </div>
                    <div className="flex justify-between pt-1 text-emerald-900 font-black">
                      <span>إجمالي الاستحقاق:</span>
                      <span>6,750.00 ر.س</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-2">
                    <span className="font-black text-rose-800 block text-xs">الاستقطاعات والخصومات</span>
                    <div className="flex justify-between py-1 border-b border-rose-100">
                      <span className="text-slate-600">التأمينات الاجتماعية (GOSI):</span>
                      <span className="font-bold text-slate-900">607.50 ر.س</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-rose-100">
                      <span className="text-slate-600">غياب / تأخير:</span>
                      <span className="font-bold text-slate-900">0.00 ر.س</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-rose-100">
                      <span className="text-slate-600">سلف:</span>
                      <span className="font-bold text-slate-900">0.00 ر.س</span>
                    </div>
                    <div className="flex justify-between pt-1 text-rose-900 font-black">
                      <span>إجمالي الاستقطاع:</span>
                      <span>607.50 ر.س</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="font-black text-[#004e82] block text-xs">صافي الراتب المستحق</span>
                      <div className="mt-2 text-2xl font-black text-[#0070c0]">
                        6,142.50 <span className="text-xs font-normal text-slate-500">ر.س</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        مصرف الراجحي — حساب: SA4480000412608010100780
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSalaryStatement(false)}
                      className="text-[11px] font-bold text-slate-500 hover:underline text-left"
                    >
                      إغلاق التفاصيل
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            VIEW 3: الطلبات -> طلبات الموظف (SCREENSHOT 3)
           =================================================================== */}
        {activeNavTab === "requests" && reqView === "employee" && (
          <div className="space-y-4">
            {/* Top Blue Header Banner */}
            <div className="bg-[#106ba3] py-2.5 px-4 text-center text-sm font-black text-white shadow-xs rounded-t-lg">
              طلبات الموظف
            </div>

            {/* Sub-Tabs: الأجازات / طلبات متنوعة */}
            <div className="flex items-center border-b border-slate-200 bg-white px-2">
              <button
                type="button"
                onClick={() => setReqSubTab("leaves")}
                className={`px-6 py-2.5 text-xs font-black transition border-b-2 ${
                  reqSubTab === "leaves"
                    ? "border-[#0070c0] text-[#0070c0]"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                الأجازات
              </button>
              <button
                type="button"
                onClick={() => setReqSubTab("misc")}
                className={`px-6 py-2.5 text-xs font-black transition border-b-2 ${
                  reqSubTab === "misc"
                    ? "border-[#0070c0] text-[#0070c0]"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                طلبات متنوعة (تحديث البيانات والموافقات)
              </button>
            </div>

            {/* SUB-TAB 1: الأجازات (SCREENSHOT 3 EXACT) */}
            {reqSubTab === "leaves" && (
              <div className="space-y-4">
                {/* 1- تحديد نوع الاجازة */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                  <h3 className="text-sm font-black text-slate-800">
                    1- تحديد نوع الاجازة
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        نوع الأجازة
                      </label>
                      <select
                        value={leaveType}
                        onChange={(e) => {
                          setLeaveType(e.target.value);
                          if (!leaveName) setLeaveName(e.target.value);
                        }}
                        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
                      >
                        <option value="">.. اختر</option>
                        <option value="إجازة سنوية اعتيادية">إجازة سنوية اعتيادية</option>
                        <option value="إجازة مرضية">إجازة مرضية</option>
                        <option value="إجازة اضطرارية">إجازة اضطرارية</option>
                        <option value="إجازة بدون راتب">إجازة بدون راتب</option>
                        <option value="إجازة وضع/أمومة">إجازة وضع/أمومة</option>
                        <option value="إجازة وفاة">إجازة وفاة</option>
                        <option value="إجازة زواج">إجازة زواج</option>
                        <option value="إجازة دراسية">إجازة دراسية</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        اسم الاجازه
                      </label>
                      <select
                        value={leaveName}
                        onChange={(e) => setLeaveName(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
                      >
                        <option value="">.. اختر</option>
                        <option value="إجازة اعتيادية سنوية">إجازة اعتيادية سنوية</option>
                        <option value="إجازة مرضية بتقرير طبي">إجازة مرضية بتقرير طبي</option>
                        <option value="إجازة عارضة طارئة">إجازة عارضة طارئة</option>
                        <option value="إجازة خاصة">إجازة خاصة</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Form Card: Balances + Dates + Notes + Upload (Screenshot 3 exact) */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                  {/* Row 1 (4 columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        الرصيد السنوي المستحق
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="21"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-center text-xs font-bold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        الرصيد السابق
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="0"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-center text-xs font-bold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        رصيد الفتره
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="0"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-center text-xs font-bold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        الرصيد حتى تاريخه
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="21"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-center text-xs font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Row 2 (4 columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        المنصرف حتى تاريخه
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="0"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-center text-xs font-bold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        مصروف نقدا
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="0"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-center text-xs font-bold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        الرصيد الحالي
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="21"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-center text-xs font-bold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <span className="text-rose-600 font-black">*</span>
                        <span>تاريخ بداية الاجازة</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={leaveStartDate}
                          onChange={(e) => setLeaveStartDate(e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3 (4 columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <span className="text-rose-600 font-black">*</span>
                        <span>تاريخ نهايه الاجازه</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={leaveEndDate}
                          onChange={(e) => setLeaveEndDate(e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        المدة
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={calculatedLeaveDays}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-center text-xs font-black text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        ملاحظات
                      </label>
                      <input
                        type="text"
                        value={leaveNotes}
                        onChange={(e) => setLeaveNotes(e.target.value)}
                        placeholder="أدخل أي ملاحظات..."
                        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        المرفقات
                      </label>
                      <label className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-sky-400 bg-sky-50/50 px-3 text-xs font-bold text-[#0070c0] hover:bg-sky-50 cursor-pointer transition">
                        <UploadCloud className="size-4" />
                        <span className="truncate max-w-[120px]">
                          {leaveAttachmentName || "رفع ملف"}
                        </span>
                        <input
                          type="file"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setLeaveAttachmentName(f.name);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Centered Green Save Button */}
                  <div className="flex justify-center pt-3">
                    <button
                      type="button"
                      disabled={isSavingLeave}
                      onClick={() => void handleSaveLeaveRequest()}
                      className="rounded-full bg-[#198754] px-12 py-2 text-xs font-black text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                    >
                      {isSavingLeave ? "جاري الحفظ..." : "حفظ"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: طلبات متنوعة (تحديث البيانات والموافقات) */}
            {reqSubTab === "misc" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-white p-4 shadow-xs">
                  <div>
                    <h3 className="text-sm font-black text-[#004e82]">
                      طلبات تحديث وتعديل البيانات للموظف
                    </h3>
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
                    <span>تقديم طلب تحديث بيانات جديد</span>
                  </button>
                </div>

                {/* Data Update Requests Table */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
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
            )}
          </div>
        )}

        {/* ===================================================================
            VIEW 4: الطلبات -> طلبات المدير المباشر (SCREENSHOT 4)
           =================================================================== */}
        {activeNavTab === "requests" && reqView === "manager" && (
          <div className="space-y-4">
            {subordinates.length === 0 ? (
              /* Exact match to Screenshot 4: Pink Alert Box across the page */
              <div className="w-full rounded-xs border border-rose-200 bg-[#fde8e8] p-3 text-center sm:text-right text-xs font-bold text-rose-800 shadow-2xs">
                لا يوجد موظفين تحت ادارتك!
              </div>
            ) : (
              /* If manager has subordinates: Display approval list */
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <h3 className="text-sm font-black text-[#004e82]">
                    طلبات الموظفين التابعين لإدارتك
                  </h3>
                  <p className="text-xs text-slate-500">
                    عدد الموظفين تحت إشرافك: {subordinates.length} موظف
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            VIEW 5: بيانات الموظف (DEFAULT TAB - SCREENSHOTS 2-5 FROM FIRST TURN)
           =================================================================== */}
        {activeNavTab === "profile" && (
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
                          value={formData["emp_no"] || "10078"}
                          onChange={(e) => updateField("emp_no", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      {/* Row 3 */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          الجنسيه
                        </label>
                        <input
                          type="text"
                          value={formData["nationality"] || "مصري"}
                          onChange={(e) => updateField("nationality", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800"
                        />
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
                          <option value="أنثى">أنثى</option>
                        </select>
                      </div>

                      {/* Row 4 */}
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
                  <div className="space-y-4">
                    {/* Block A: بيانات العمل */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black text-[#004e82] flex items-center gap-1.5">
                          <Building className="size-4 text-[#0070c0]" />
                          <span>بيانات العمل</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleOpenRequestForField("branch")}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#0070c0] hover:underline"
                        >
                          <Send className="size-3" />
                          <span>طلب تعديل بيانات العمل</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المنطقه</label>
                          <input
                            type="text"
                            value={formData["region"] || "المنطقة الوسطى"}
                            onChange={(e) => updateField("region", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
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

                    {/* Block B: jobDetails */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                      <h3 className="text-sm font-black text-[#004e82] border-b border-slate-100 pb-3 flex items-center gap-1.5">
                        <Briefcase className="size-4 text-[#0070c0]" />
                        <span>jobDetails</span>
                      </h3>

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
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">المستوى الوظيفي</label>
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

                    {/* Block C: الوظيفة الحالية */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                      <h3 className="text-sm font-black text-[#004e82] border-b border-slate-100 pb-3 flex items-center gap-1.5">
                        <GraduationCap className="size-4 text-[#0070c0]" />
                        <span>الوظيفه الحاليه</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">جدول الدوام</label>
                          <input
                            type="text"
                            value={formData["attendance_schedule"] || "افتراضي"}
                            onChange={(e) => updateField("attendance_schedule", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
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

                    {/* Block D: التواريخ (ميلادي / هجري) */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                      <h3 className="text-sm font-black text-[#004e82] border-b border-slate-100 pb-3 flex items-center gap-1.5">
                        <Calendar className="size-4 text-[#0070c0]" />
                        <span>التواريخ</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        {/* تاريخ التعيين */}
                        <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/40">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">تاريخ التعيين</label>
                          <span className="text-[10px] text-slate-400 block mb-0.5">ميلادي</span>
                          <input
                            type="date"
                            value={formData["hire_date"] || "2026-09-13"}
                            onChange={(e) => updateField("hire_date", e.target.value)}
                            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs"
                          />
                          <span className="text-[10px] text-slate-400 block mt-1.5 mb-0.5">هجري</span>
                          <input
                            type="text"
                            readOnly
                            value="1448/4/2"
                            className="h-8 w-full rounded-md border border-slate-200 bg-slate-100 px-2 text-xs font-mono text-slate-600"
                          />
                        </div>

                        {/* تاريخ مباشره العمل */}
                        <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/40">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">تاريخ مباشره العمل</label>
                          <span className="text-[10px] text-slate-400 block mb-0.5">ميلادي</span>
                          <input
                            type="date"
                            value={formData["start_date"] || "2026-09-13"}
                            onChange={(e) => updateField("start_date", e.target.value)}
                            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs"
                          />
                          <span className="text-[10px] text-slate-400 block mt-1.5 mb-0.5">هجري</span>
                          <input
                            type="text"
                            readOnly
                            value="1448/4/2"
                            className="h-8 w-full rounded-md border border-slate-200 bg-slate-100 px-2 text-xs font-mono text-slate-600"
                          />
                        </div>

                        {/* احتساب الإجازة السنوية */}
                        <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/40">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">احتساب الإجازة السنوية</label>
                          <span className="text-[10px] text-slate-400 block mb-0.5">ميلادي</span>
                          <input
                            type="date"
                            value={formData["leave_calc_date"] || "2026-09-13"}
                            onChange={(e) => updateField("leave_calc_date", e.target.value)}
                            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs"
                          />
                          <span className="text-[10px] text-slate-400 block mt-1.5 mb-0.5">هجري</span>
                          <input
                            type="text"
                            readOnly
                            value="1448/4/2"
                            className="h-8 w-full rounded-md border border-slate-200 bg-slate-100 px-2 text-xs font-mono text-slate-600"
                          />
                        </div>

                        {/* تاريخ الميلاد */}
                        <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/40">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">تاريخ الميلاد</label>
                          <span className="text-[10px] text-slate-400 block mb-0.5">ميلادي</span>
                          <input
                            type="date"
                            value={formData["birth_date"] || "1993-08-21"}
                            onChange={(e) => updateField("birth_date", e.target.value)}
                            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs"
                          />
                          <span className="text-[10px] text-slate-400 block mt-1.5 mb-0.5">هجري</span>
                          <input
                            type="text"
                            readOnly
                            value="1414/3/4"
                            className="h-8 w-full rounded-md border border-slate-200 bg-slate-100 px-2 text-xs font-mono text-slate-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Block E: الخبرة وغيرها */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                      <h3 className="text-sm font-black text-[#004e82] border-b border-slate-100 pb-3 flex items-center gap-1.5">
                        <Award className="size-4 text-[#0070c0]" />
                        <span>الخبرة و غيرها</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">مده الخبره بالسنوات</label>
                          <input
                            type="number"
                            value={formData["experience_years"] ?? 5}
                            onChange={(e) => updateField("experience_years", Number(e.target.value))}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">فتره التجربه بالايام</label>
                          <input
                            type="number"
                            value={formData["probation_days"] ?? 90}
                            onChange={(e) => updateField("probation_days", Number(e.target.value))}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">تاريخ دخول المملكه</label>
                          <input
                            type="date"
                            value={formData["entry_date"] || ""}
                            onChange={(e) => updateField("entry_date", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
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
                    <h3 className="text-sm font-black text-[#004e82] border-b border-slate-100 pb-3 flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-[#0070c0]" />
                      <span>بيانات التأمينات الاجتماعيه</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">الرقم التاميني</label>
                        <input
                          type="text"
                          value={formData["gosi_no"] || ""}
                          onChange={(e) => updateField("gosi_no", e.target.value)}
                          placeholder="أدخل الرقم التأميني..."
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">تاريخ تسجيل التامين</label>
                        <input
                          type="date"
                          value={formData["gosi_date"] || ""}
                          onChange={(e) => updateField("gosi_date", e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">مكان التامين</label>
                        <input
                          type="text"
                          value={formData["gosi_city"] || ""}
                          onChange={(e) => updateField("gosi_city", e.target.value)}
                          placeholder="الرياض..."
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. بيانات التواصل (Screenshot 5) */}
                {subSection === "contact" && (
                  <div className="space-y-4">
                    {/* أرقام الهواتف */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                      <h3 className="text-sm font-black text-[#004e82] border-b border-slate-100 pb-3 flex items-center gap-1.5">
                        <Phone className="size-4 text-[#0070c0]" />
                        <span>أرقام الهواتف</span>
                      </h3>

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
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم التليفون فى البلد الاصل</label>
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
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم الجوال فى البلد الاصل</label>
                          <input
                            type="text"
                            value={formData["home_country_mobile"] || ""}
                            onChange={(e) => updateField("home_country_mobile", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* العناوين */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                      <h3 className="text-sm font-black text-[#004e82] border-b border-slate-100 pb-3 flex items-center gap-1.5">
                        <MapPin className="size-4 text-[#0070c0]" />
                        <span>العناوين</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">العنوان فى البلد الاصل</label>
                          <textarea
                            rows={2}
                            value={formData["home_country_address"] || ""}
                            onChange={(e) => updateField("home_country_address", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">العنوان الحالي</label>
                          <textarea
                            rows={2}
                            value={formData["current_address"] || ""}
                            onChange={(e) => updateField("current_address", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* تفاصيل العنوان الوطني */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                      <h3 className="text-sm font-black text-[#004e82] border-b border-slate-100 pb-3 flex items-center gap-1.5">
                        <Building className="size-4 text-[#0070c0]" />
                        <span>تفاصيل العنوان</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم المبني</label>
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
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم الوحدة</label>
                          <input
                            type="text"
                            value={formData["unit_no"] || ""}
                            onChange={(e) => updateField("unit_no", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">الرقم البريدي</label>
                          <input
                            type="text"
                            value={formData["postal_code"] || ""}
                            onChange={(e) => updateField("postal_code", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* البريد الإلكتروني */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                      <h3 className="text-sm font-black text-[#004e82] border-b border-slate-100 pb-3 flex items-center gap-1.5">
                        <Mail className="size-4 text-[#0070c0]" />
                        <span>البريد الإلكتروني</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">البريد الإلكتروني</label>
                          <input
                            type="email"
                            value={formData["email"] || "ahmed.elsayed708@gmail.com"}
                            onChange={(e) => updateField("email", e.target.value)}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">البريد الإلكتروني الخاص</label>
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

      {/* =====================================================================
          MODAL: محادثة المسائلة (Inquiry Conversation Modal)
         ===================================================================== */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#0070c0]">
                  <MessageSquare className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#004e82]">
                    محادثة المسائلة الإدارية
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    تاريخ المسائلة: {selectedInquiry.inquiry_date || "—"} | التصنيف: {selectedInquiry.inquiry_type || "مسائلة"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs space-y-1">
                <span className="font-bold text-[#004e82] block">نص المسائلة من الإدارة:</span>
                <p className="text-slate-800 font-semibold">{selectedInquiry.notes || selectedInquiry.details || "يرجى الإفادة حول الموضوع المذكور."}</p>
              </div>

              {selectedInquiry.employee_reply && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs space-y-1">
                  <span className="font-bold text-emerald-800 block">ردك المسجل سابقاً:</span>
                  <p className="text-slate-800">{selectedInquiry.employee_reply}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كتابة الرد أو التوضيح:
                </label>
                <textarea
                  rows={3}
                  value={inquiryReplyText}
                  onChange={(e) => setInquiryReplyText(e.target.value)}
                  placeholder="اكتب ردك وتوضيحك هنا..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#0070c0]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!inquiryReplyText.trim()) {
                    toast.error("يرجى كتابة نص الرد قبل الإرسال");
                    return;
                  }
                  toast.success("تم إرسال ردك على المسائلة إلى إدارة الموارد البشرية بنجاح");
                  setSelectedInquiry(null);
                  setInquiryReplyText("");
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[#0070c0] px-5 py-2 text-xs font-black text-white hover:bg-[#005fa3]"
              >
                <Send className="size-3.5" />
                <span>إرسال الرد</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
