import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  useRows,
  useSaveRow,
  useSaveSettings,
  useSettings,
  type Row,
} from "@/lib/hr-db";
import {
  DATA_UPDATE_FIELDS,
  buildEmployeeUpdatePatch,
  getEmployeeFieldValue,
  loadDataUpdateConfig,
  loadDataUpdateRequests,
  resolveEmployeePermissionGroup,
  saveDataUpdateRequestsLocal,
  type DataUpdateConfigState,
  type DataUpdateRequestItem,
} from "@/lib/data-update-config";

export const Route = createFileRoute("/requests/data-update")({
  head: () => ({
    meta: [
      { title: "طلبات تحديث البيانات | الطلبات" },
      {
        name: "description",
        content:
          "إدارة طلبات تحديث وتعديل بيانات الموظفين ومراجعتها والرد عليها واعتمادها مع التحديث التلقائي لملف الموظف.",
      },
    ],
  }),
  component: DataUpdateRequestsPage,
});

const inputCls =
  "h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-2 focus:ring-[#0070c0]/15";

function DataUpdateRequestsPage() {
  const configSettingsQuery = useSettings("data_update_config");
  const requestsSettingsQuery = useSettings("data_update_requests");
  const saveRequestsSettings = useSaveSettings("data_update_requests");

  const { data: employees = [] } = useRows("employees");
  const saveEmployee = useSaveRow("employees");
  const saveApprovalRequest = useSaveRow("approval_requests");
  const { data: basicLookups = [] } = useRows("basic_lookups");

  const [config, setConfig] = useState<DataUpdateConfigState>(() => loadDataUpdateConfig());
  const [requests, setRequests] = useState<DataUpdateRequestItem[]>(() => loadDataUpdateRequests());
  const [hydrated, setHydrated] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fieldFilter, setFieldFilter] = useState<string>("all");

  // New Request Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>("department");
  const [newValueInput, setNewValueInput] = useState<string>("");
  const [reasonInput, setReasonInput] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string>("");

  // Review / Reply / Approve Modal State
  const [activeRequest, setActiveRequest] = useState<DataUpdateRequestItem | null>(null);
  const [selectedActorName, setSelectedActorName] = useState<string>("");
  const [replyMessage, setReplyMessage] = useState<string>("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  useEffect(() => {
    if (configSettingsQuery.isFetched) {
      setConfig(loadDataUpdateConfig(configSettingsQuery.data?.["config_json"]));
    }
  }, [configSettingsQuery.data, configSettingsQuery.isFetched]);

  useEffect(() => {
    if (requestsSettingsQuery.isFetched && !hydrated) {
      setRequests(loadDataUpdateRequests(requestsSettingsQuery.data?.["requests_json"]));
      setHydrated(true);
    }
  }, [hydrated, requestsSettingsQuery.data, requestsSettingsQuery.isFetched]);

  const persistRequests = async (next: DataUpdateRequestItem[]) => {
    setRequests(next);
    const json = saveDataUpdateRequestsLocal(next);
    try {
      await saveRequestsSettings.mutateAsync({ requests_json: json });
    } catch {
      // Saved in localStorage as fallback
    }
  };

  // Currently selected employee in the "New Request" modal
  const selectedEmployee = useMemo(
    () => employees.find((e: Row) => String(e["id"]) === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  );

  // Resolve permission group & approval group for selected employee
  const resolvedUserGroup = useMemo(
    () => resolveEmployeePermissionGroup(selectedEmployee, config),
    [selectedEmployee, config],
  );

  const resolvedApprovalGroup = useMemo(
    () =>
      config.approvalGroups.find((ag) => ag.id === resolvedUserGroup.linkedApprovalGroupId) ||
      config.approvalGroups[0] ||
      null,
    [config.approvalGroups, resolvedUserGroup],
  );

  const isDirectManagerEnabledForRequest = useMemo(() => {
    if (typeof resolvedUserGroup.allowDirectManagerOverride === "boolean") {
      return resolvedUserGroup.allowDirectManagerOverride;
    }
    if (resolvedApprovalGroup) {
      return resolvedApprovalGroup.allowDirectManager;
    }
    return config.globalAllowDirectManager;
  }, [config.globalAllowDirectManager, resolvedApprovalGroup, resolvedUserGroup]);

  // Allowed fields for the selected employee according to Option 2 in `تهيئة تحديث البيانات`
  const allowedFieldDefs = useMemo(() => {
    return DATA_UPDATE_FIELDS.filter(
      (f) => resolvedUserGroup.allowedFields[f.key]?.enabled !== false,
    );
  }, [resolvedUserGroup]);

  useEffect(() => {
    if (
      allowedFieldDefs.length > 0 &&
      !allowedFieldDefs.some((f) => f.key === selectedFieldKey)
    ) {
      setSelectedFieldKey(allowedFieldDefs[0]!.key);
    }
  }, [allowedFieldDefs, selectedFieldKey]);

  const activeFieldDef = useMemo(
    () => DATA_UPDATE_FIELDS.find((f) => f.key === selectedFieldKey) || DATA_UPDATE_FIELDS[0]!,
    [selectedFieldKey],
  );

  const currentFieldRequiresAttachment = useMemo(
    () => Boolean(resolvedUserGroup.allowedFields[selectedFieldKey]?.requiresAttachment),
    [resolvedUserGroup, selectedFieldKey],
  );

  const currentEmployeeFieldValue = useMemo(
    () => getEmployeeFieldValue(selectedEmployee, selectedFieldKey),
    [selectedEmployee, selectedFieldKey],
  );

  // Dynamic options for the selected field (from basic_lookups + existing employee values + defaults)
  const fieldSelectOptions = useMemo(() => {
    const set = new Set<string>(activeFieldDef.defaultOptions || []);

    if (activeFieldDef.lookupCategory) {
      basicLookups.forEach((row: Row) => {
        if (
          String(row["category"] || "") === activeFieldDef.lookupCategory &&
          row["active"] !== false &&
          row["name"]
        ) {
          set.add(String(row["name"]).trim());
        }
      });
    }

    employees.forEach((emp: Row) => {
      const val = String(emp[activeFieldDef.key] || "").trim();
      if (val && activeFieldDef.inputType === "select_or_text") {
        set.add(val);
      }
    });

    return Array.from(set).filter(Boolean);
  }, [activeFieldDef, basicLookups, employees]);

  const handleAttachmentUpload = (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleOpenNewModal = () => {
    const firstEmp = employees[0];
    setSelectedEmployeeId(firstEmp ? String(firstEmp["id"]) : "");
    setNewValueInput("");
    setReasonInput("");
    setAttachmentName("");
    setAttachmentDataUrl("");
    setIsNewModalOpen(true);
  };

  const handleSubmitNewRequest = async () => {
    if (!selectedEmployee) {
      toast.error("يرجى اختيار الموظف أولاً");
      return;
    }
    if (!selectedFieldKey) {
      toast.error("يرجى اختيار الحقل المطلوب تعديله");
      return;
    }
    if (!newValueInput.trim()) {
      toast.error(`يرجى إدخال القيمة الجديدة لحقل "${activeFieldDef.label}"`);
      return;
    }
    if (newValueInput.trim() === currentEmployeeFieldValue) {
      toast.error("القيمة الجديدة مطابقة للقيمة الحالية المسجلة للموظف");
      return;
    }
    if (currentFieldRequiresAttachment && !attachmentName) {
      toast.error(`حقل "${activeFieldDef.label}" يتطلب إرفاق مستند إثبات حسب لائحة تهيئة تحديث البيانات`);
      return;
    }

    const reqNumber = `DU-${String(requests.length + 101).padStart(4, "0")}`;
    const empName = String(
      selectedEmployee["full_name"] || selectedEmployee["employee_name"] || "موظف",
    );
    const empNo = String(selectedEmployee["emp_no"] || "");
    const branch = String(selectedEmployee["branch"] || "الفرع الرئيسي");
    const department = String(selectedEmployee["department"] || "غير محدد");
    const directManager = String(
      selectedEmployee["manager_name"] ||
        selectedEmployee["direct_manager"] ||
        "المدير المباشر",
    );

    const approverNames = (resolvedApprovalGroup?.approvers || []).map(
      (a) => `${a.name} (${a.roleLabel})`,
    );

    const awaitingText = isDirectManagerEnabledForRequest
      ? `المدير المباشر (${directManager}) / ${resolvedApprovalGroup?.name || "مجموعة الموافقات"}`
      : resolvedApprovalGroup?.name || "مجموعة الموافقات";

    const newReq: DataUpdateRequestItem = {
      id: `du-${Date.now()}`,
      requestNumber: reqNumber,
      employeeId: String(selectedEmployee["id"]),
      empNo,
      employeeName: empName,
      branch,
      department,
      directManagerName: directManager,
      userGroupId: resolvedUserGroup.id,
      userGroupName: resolvedUserGroup.name,
      approvalGroupId: resolvedApprovalGroup?.id || "ag-hr-main",
      approvalGroupName: resolvedApprovalGroup?.name || "مجموعة اعتماد الموارد البشرية",
      allowDirectManager: isDirectManagerEnabledForRequest,
      directManagerStatus: isDirectManagerEnabledForRequest ? "pending" : "not_required",
      fieldKey: activeFieldDef.key,
      fieldLabel: activeFieldDef.label,
      oldValue: currentEmployeeFieldValue,
      newValue: newValueInput.trim(),
      reason: reasonInput.trim() || `طلب تحديث ${activeFieldDef.label}`,
      attachmentName: attachmentName || undefined,
      attachmentDataUrl: attachmentDataUrl || undefined,
      status: "pending",
      awaitingText,
      authorizedApproverNames: approverNames,
      appliedToEmployeeRecord: false,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    const next = [newReq, ...requests];
    await persistRequests(next);

    // Also record in general approval_requests table for unified visibility
    try {
      await saveApprovalRequest.mutateAsync({
        employee_id: String(selectedEmployee["id"]),
        employee_name: empName,
        emp_no: empNo,
        branch,
        department,
        category: "شؤون موظفين",
        request_type: `طلب تحديث بيانات (${activeFieldDef.label})`,
        request_subject: `تعديل ${activeFieldDef.label}: من [${currentEmployeeFieldValue}] إلى [${newValueInput.trim()}]`,
        request_details: reasonInput.trim() || `طلب تحديث ${activeFieldDef.label}`,
        approval_chain: isDirectManagerEnabledForRequest
          ? `المدير المباشر، ${resolvedApprovalGroup?.name || "الموارد البشرية"}`
          : resolvedApprovalGroup?.name || "الموارد البشرية",
        direct_manager_name: directManager,
        awaiting_approver_name: awaitingText,
        awaiting_stage: isDirectManagerEnabledForRequest
          ? "المدير المباشر"
          : resolvedApprovalGroup?.name || "موارد بشرية",
        status: "pending",
        request_date: new Date().toISOString().slice(0, 10),
        entered_at: new Date().toISOString(),
      });
    } catch {
      // ignore if approval_requests table has different constraints
    }

    toast.success(`تم إرسال طلب تحديث البيانات (${reqNumber}) بنجاح`);
    setIsNewModalOpen(false);
  };

  // Open Review Modal
  const handleOpenReview = (req: DataUpdateRequestItem) => {
    setActiveRequest(req);
    setReplyMessage("");
    const ag = config.approvalGroups.find((g) => g.id === req.approvalGroupId);
    const firstApprover = ag?.approvers[0]?.name;
    if (req.allowDirectManager && req.directManagerStatus === "pending") {
      setSelectedActorName(`المدير المباشر: ${req.directManagerName}`);
    } else if (firstApprover) {
      setSelectedActorName(firstApprover);
    } else {
      setSelectedActorName("مدير الموارد البشرية");
    }
  };

  // Handle Reply Only
  const handleAddReplyOnly = async () => {
    if (!activeRequest) return;
    if (!replyMessage.trim()) {
      toast.error("يرجى كتابة نص الرد أو الملاحظة أولاً");
      return;
    }
    const newReply = {
      id: `rep-${Date.now()}`,
      authorName: selectedActorName || "مسؤول الاعتماد",
      authorRole: selectedActorName.includes("المدير المباشر")
        ? "المدير المباشر"
        : activeRequest.approvalGroupName,
      message: replyMessage.trim(),
      actionType: "reply" as const,
      createdAt: new Date().toISOString(),
    };

    const updatedReq: DataUpdateRequestItem = {
      ...activeRequest,
      replies: [...activeRequest.replies, newReply],
    };

    const next = requests.map((r) => (r.id === updatedReq.id ? updatedReq : r));
    await persistRequests(next);
    setActiveRequest(updatedReq);
    setReplyMessage("");
    toast.success("تم تسجيل الرد على طلب تحديث البيانات");
  };

  // Handle Direct Manager Approval Step
  const handleDirectManagerApprove = async () => {
    if (!activeRequest) return;
    setIsSubmittingDecision(true);
    try {
      const actor = selectedActorName || `المدير المباشر (${activeRequest.directManagerName})`;
      const newReply = {
        id: `rep-${Date.now()}`,
        authorName: actor,
        authorRole: "المدير المباشر",
        message: replyMessage.trim() || "تمت موافقة المدير المباشر على طلب تحديث البيانات",
        actionType: "approve_direct_manager" as const,
        createdAt: new Date().toISOString(),
      };

      const ag = config.approvalGroups.find((g) => g.id === activeRequest.approvalGroupId);
      const hasGroupApprovers = (ag?.approvers.filter((a) => a.canApprove) || []).length > 0;

      // If no group approvers exist, direct manager approval can finalize immediately
      if (!hasGroupApprovers) {
        await finalizeApprovalAndApply(activeRequest, actor, newReply);
        return;
      }

      const updatedReq: DataUpdateRequestItem = {
        ...activeRequest,
        directManagerStatus: "approved",
        directManagerDecisionBy: actor,
        directManagerDecisionAt: new Date().toISOString(),
        awaitingText: `${activeRequest.approvalGroupName} (تمت موافقة المدير المباشر)`,
        replies: [...activeRequest.replies, newReply],
      };

      const next = requests.map((r) => (r.id === updatedReq.id ? updatedReq : r));
      await persistRequests(next);
      setActiveRequest(updatedReq);
      setReplyMessage("");
      toast.success("تم اعتماد المدير المباشر وتحويل الطلب إلى مجموعة الموافقات النهائية");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Finalize Approval & Auto-Update Employee Record in DB + Profile Extras
  const finalizeApprovalAndApply = async (
    reqItem: DataUpdateRequestItem,
    actor: string,
    customReply?: DataUpdateRequestItem["replies"][number],
  ) => {
    setIsSubmittingDecision(true);
    try {
      const targetEmp = employees.find(
        (e: Row) =>
          String(e["id"]) === String(reqItem.employeeId) ||
          (reqItem.empNo && String(e["emp_no"]) === String(reqItem.empNo)),
      );

      let applied = false;
      if (targetEmp && config.autoApplyOnApproval) {
        const patch = buildEmployeeUpdatePatch(
          targetEmp,
          reqItem.fieldKey,
          reqItem.newValue,
          reqItem.requestNumber,
          actor,
        );
        await saveEmployee.mutateAsync({
          ...targetEmp,
          ...patch,
          id: targetEmp["id"],
        });
        applied = true;
      }

      const finalReply = customReply || {
        id: `rep-${Date.now()}`,
        authorName: actor,
        authorRole: reqItem.approvalGroupName,
        message:
          replyMessage.trim() ||
          `تم الاعتماد النهائي وتحديث (${reqItem.fieldLabel}) إلى "${reqItem.newValue}"`,
        actionType: "approve_final" as const,
        createdAt: new Date().toISOString(),
      };

      const updatedReq: DataUpdateRequestItem = {
        ...reqItem,
        status: "approved",
        directManagerStatus:
          reqItem.allowDirectManager && reqItem.directManagerStatus === "pending"
            ? "approved"
            : reqItem.directManagerStatus,
        awaitingText: "مكتمل - تم الاعتماد وتحديث البيانات",
        appliedToEmployeeRecord: applied,
        decisionBy: actor,
        decisionAt: new Date().toISOString(),
        replies: [...reqItem.replies, finalReply],
      };

      const next = requests.map((r) => (r.id === updatedReq.id ? updatedReq : r));
      await persistRequests(next);
      setActiveRequest(updatedReq);
      setReplyMessage("");

      toast.success(
        applied
          ? `تم اعتماد الطلب وتحديث "${reqItem.fieldLabel}" في ملف الموظف (${reqItem.employeeName}) تلقائياً!`
          : "تم اعتماد طلب تحديث البيانات بنجاح",
      );
    } catch {
      toast.error("حدث خطأ أثناء تحديث سجل الموظف؛ يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Handle Reject Request
  const handleRejectRequest = async () => {
    if (!activeRequest) return;
    if (!replyMessage.trim()) {
      toast.error("يرجى كتابة سبب الرفض في خانة الرد والملاحظات");
      return;
    }
    const actor = selectedActorName || "مسؤول الاعتماد";
    const rejectReply = {
      id: `rep-${Date.now()}`,
      authorName: actor,
      authorRole: actor.includes("المدير المباشر")
        ? "المدير المباشر"
        : activeRequest.approvalGroupName,
      message: `تم رفض الطلب: ${replyMessage.trim()}`,
      actionType: "reject" as const,
      createdAt: new Date().toISOString(),
    };

    const updatedReq: DataUpdateRequestItem = {
      ...activeRequest,
      status: "rejected",
      awaitingText: "مرفوض",
      decisionBy: actor,
      decisionAt: new Date().toISOString(),
      rejectionReason: replyMessage.trim(),
      replies: [...activeRequest.replies, rejectReply],
    };

    const next = requests.map((r) => (r.id === updatedReq.id ? updatedReq : r));
    await persistRequests(next);
    setActiveRequest(updatedReq);
    setReplyMessage("");
    toast.success("تم رفض طلب تحديث البيانات وتسجيل السبب");
  };

  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (fieldFilter !== "all" && r.fieldKey !== fieldFilter) return false;
      if (!q) return true;
      return (
        r.requestNumber.toLowerCase().includes(q) ||
        r.employeeName.toLowerCase().includes(q) ||
        r.empNo.toLowerCase().includes(q) ||
        r.fieldLabel.toLowerCase().includes(q) ||
        r.oldValue.toLowerCase().includes(q) ||
        r.newValue.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
      );
    });
  }, [requests, searchTerm, statusFilter, fieldFilter]);

  const handleExportExcel = () => {
    const exportRows = filteredRequests.map((r, i) => ({
      "#": i + 1,
      "رقم الطلب": r.requestNumber,
      "الرقم الوظيفي": r.empNo,
      "اسم الموظف": r.employeeName,
      "الفرع": r.branch,
      "القسم": r.department,
      "الحقل المطلوب تعديله": r.fieldLabel,
      "القيمة السابقة": r.oldValue,
      "القيمة الجديدة المطلوبة": r.newValue,
      "موافقة المدير المباشر": r.allowDirectManager ? "مفعلة" : "غير مطلوبة",
      "مجموعة الموافقات": r.approvalGroupName,
      "الحالة":
        r.status === "approved"
          ? "معتمد وتم التحديث"
          : r.status === "rejected"
            ? "مرفوض"
            : "بانتظار الاعتماد",
      "تاريخ الطلب": r.createdAt.slice(0, 10),
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "طلبات تحديث البيانات");
    XLSX.writeFile(wb, `طلبات_تحديث_البيانات_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Actors list for the active request in Review Modal
  const availableActorsForActiveRequest = useMemo(() => {
    if (!activeRequest) return [];
    const list: { label: string; value: string; canApprove: boolean; canReply: boolean }[] = [];
    if (activeRequest.allowDirectManager) {
      list.push({
        label: `المدير المباشر: ${activeRequest.directManagerName}`,
        value: `المدير المباشر (${activeRequest.directManagerName})`,
        canApprove: true,
        canReply: true,
      });
    }
    const ag = config.approvalGroups.find((g) => g.id === activeRequest.approvalGroupId);
    if (ag) {
      ag.approvers.forEach((ap) => {
        list.push({
          label: `${ap.name} — ${ap.roleLabel}`,
          value: ap.name,
          canApprove: ap.canApprove,
          canReply: ap.canReply,
        });
      });
    }
    if (list.length === 0) {
      list.push({
        label: "مدير الموارد البشرية (اعتماد عام)",
        value: "مدير الموارد البشرية",
        canApprove: true,
        canReply: true,
      });
    }
    return list;
  }, [activeRequest, config.approvalGroups]);

  return (
    <AppShell>
      <div className="space-y-4" dir="rtl">
        {/* Title & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
              <MaterialIcon name="manage_accounts" size={22} className="text-[#0070c0]" />
              طلبات تحديث البيانات ومراجعتها واعتمادها
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              إرسال ومراجعة طلبات تعديل بيانات الموظفين (القسم، الوظيفة، المستوى، الفئة، التخصص، الفرع، الهوية، الجنسية، الحالة الاجتماعية، المسار)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/regulations/data-update"
              className="flex items-center gap-1.5 rounded-lg border border-[#0070c0] bg-blue-50 px-3 py-2 text-xs font-bold text-[#0070c0] transition hover:bg-blue-100"
            >
              <MaterialIcon name="settings" size={16} />
              تهيئة تحديث البيانات (اللوائح)
            </Link>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              <MaterialIcon name="download" size={16} />
              تصدير إكسيل
            </button>
            <button
              type="button"
              onClick={handleOpenNewModal}
              className="flex items-center gap-1.5 rounded-lg bg-[#0070c0] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#005fa3]"
            >
              <MaterialIcon name="add_circle" size={17} />
              طلب تحديث بيانات جديد
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500">إجمالي طلبات تحديث البيانات</div>
            <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">
              {requests.length} طلب
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500">بانتظار الموافقة أو الرد</div>
            <div className="text-lg font-extrabold text-amber-700 font-mono mt-1">
              {requests.filter((r) => r.status === "pending").length} طلب
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500">معتمد (تم تحديث ملف الموظف)</div>
            <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">
              {requests.filter((r) => r.status === "approved").length} طلب
            </div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500">طلبات مرفوضة</div>
            <div className="text-lg font-extrabold text-rose-700 font-mono mt-1">
              {requests.filter((r) => r.status === "rejected").length} طلب
            </div>
          </div>
        </div>

        {/* Active Regulation Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <MaterialIcon name="verified_user" size={16} className="text-[#0070c0]" />
              مجموعات الموافقات الفعالة:{" "}
              <strong className="text-[#004e82]">{config.approvalGroups.length} مجموعات</strong>
            </span>
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <MaterialIcon name="supervisor_account" size={16} className="text-emerald-600" />
              موافقة المدير المباشر:{" "}
              <strong
                className={
                  config.globalAllowDirectManager ? "text-emerald-700" : "text-rose-600"
                }
              >
                {config.globalAllowDirectManager ? "مفعّلة (يحق له الموافقة والرد)" : "غير مفعّلة"}
              </strong>
            </span>
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <MaterialIcon name="fact_check" size={16} className="text-indigo-600" />
              مجموعات صلاحيات الحقول:{" "}
              <strong className="text-indigo-800">
                {config.userPermissionGroups.length} مجموعات
              </strong>
            </span>
          </div>
          <Link
            to="/regulations/data-update"
            className="text-[11px] font-extrabold text-[#0070c0] hover:underline"
          >
            تعديل إعدادات مجموعات الموافقة والحقول المتاحة ←
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="sm:col-span-5 relative">
            <input
              type="text"
              placeholder="بحث برقم الطلب، اسم الموظف، الرقم الوظيفي، الحقل، القيمة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-4">
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className={inputCls}
            >
              <option value="all">جميع الحقول المتاحة للتعديل</option>
              {DATA_UPDATE_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputCls}
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">بانتظار الموافقة والرد</option>
              <option value="approved">معتمد وتم تحديث البيانات</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#004e82] text-white font-bold">
              <tr>
                <th className="px-3 py-3">رقم الطلب</th>
                <th className="px-3 py-3">الموظف</th>
                <th className="px-3 py-3">الفرع / القسم</th>
                <th className="px-3 py-3">بيان التحديث (الحقل)</th>
                <th className="px-3 py-3">القيمة الحالية</th>
                <th className="px-3 py-3">القيمة الجديدة المطلوبة</th>
                <th className="px-3 py-3">المدير المباشر</th>
                <th className="px-3 py-3">مجموعة الموافقة / بانتظار</th>
                <th className="px-3 py-3 text-center">الحالة</th>
                <th className="px-3 py-3 text-center">إجراءات الرد والموافقة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <MaterialIcon name="manage_accounts" size={34} className="text-slate-300" />
                      <div className="font-bold text-slate-600">
                        لا توجد طلبات تحديث بيانات مطابقة حالياً
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenNewModal}
                        className="mt-1 rounded-lg bg-[#0070c0] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#005fa3]"
                      >
                        + إنشاء أول طلب تحديث بيانات
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-blue-50/30 transition">
                    <td className="px-3 py-2.5 font-mono font-extrabold text-[#0070c0]">
                      {req.requestNumber}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-extrabold text-slate-800">{req.employeeName}</div>
                      {req.empNo && (
                        <div className="font-mono text-[10px] text-slate-500">#{req.empNo}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      <div>{req.branch}</div>
                      <div className="text-[10px] text-slate-400">{req.department}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 font-extrabold text-[#004e82]">
                        {req.fieldLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 line-through">{req.oldValue}</td>
                    <td className="px-3 py-2.5 font-extrabold text-emerald-700">{req.newValue}</td>
                    <td className="px-3 py-2.5">
                      <div className="text-slate-700 font-semibold">{req.directManagerName}</div>
                      <span
                        className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          !req.allowDirectManager
                            ? "bg-slate-100 text-slate-500"
                            : req.directManagerStatus === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {!req.allowDirectManager
                          ? "غير مطلوب باللائحة"
                          : req.directManagerStatus === "approved"
                            ? "وافق المدير المباشر"
                            : "يحق له الموافقة"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-slate-800">{req.approvalGroupName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{req.awaitingText}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
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
                            : "بانتظار الموافقة"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenReview(req)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#0070c0] px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-[#005fa3]"
                      >
                        <MaterialIcon name="rate_review" size={14} />
                        مراجعة / موافقة / رد
                        {req.replies.length > 0 && (
                          <span className="mr-1 rounded-full bg-white/25 px-1.5 text-[10px]">
                            {req.replies.length}
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================================================
            MODAL 1: إنشاء طلب تحديث بيانات جديد
           ===================================================================== */}
        {isNewModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
            dir="rtl"
          >
            <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-extrabold text-[#004e82] flex items-center gap-2">
                  <MaterialIcon name="edit_note" size={20} className="text-[#0070c0]" />
                  تقديم طلب تحديث / تعديل بيانات موظف
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <MaterialIcon name="close" size={20} />
                </button>
              </div>

              {/* Employee Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs font-bold text-slate-700">اختر الموظف مقدم الطلب *</span>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => {
                      setSelectedEmployeeId(e.target.value);
                      setNewValueInput("");
                    }}
                    className={inputCls}
                  >
                    <option value="">-- اختر الموظف --</option>
                    {employees.map((emp: Row) => (
                      <option key={String(emp["id"])} value={String(emp["id"])}>
                        {String(emp["full_name"] || emp["employee_name"] || "")} — رقم وظيفي:{" "}
                        {String(emp["emp_no"] || "—")} ({String(emp["department"] || "بدون قسم")})
                      </option>
                    ))}
                  </select>
                </label>

                {selectedEmployee && (
                  <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">الفرع الحالي</span>
                      <strong className="text-slate-800">
                        {String(selectedEmployee["branch"] || "غير محدد")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">القسم الحالي</span>
                      <strong className="text-slate-800">
                        {String(selectedEmployee["department"] || "غير محدد")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">المدير المباشر</span>
                      <strong className="text-slate-800">
                        {String(
                          selectedEmployee["manager_name"] ||
                            selectedEmployee["direct_manager"] ||
                            "المدير المباشر",
                        )}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">مجموعة الصلاحيات</span>
                      <strong className="text-[#0070c0]">{resolvedUserGroup.name}</strong>
                    </div>
                  </div>
                )}

                {/* Select Target Field (Filtered by what is enabled in `تهيئة تحديث البيانات`) */}
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      البيان / الحقل المطلوب تعديله * (حسب الحقول المفعّلة في تهيئة تحديث البيانات)
                    </span>
                    <span className="text-[11px] font-bold text-[#0070c0]">
                      {allowedFieldDefs.length} حقل مسموح للموظف
                    </span>
                  </div>
                  <select
                    value={selectedFieldKey}
                    onChange={(e) => {
                      setSelectedFieldKey(e.target.value);
                      setNewValueInput("");
                    }}
                    className={inputCls}
                  >
                    {allowedFieldDefs.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label} ({f.category})
                      </option>
                    ))}
                  </select>
                </label>

                {/* Current Value vs New Value */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-600">
                    القيمة الحالية المسجلة بالنظام ({activeFieldDef.label})
                  </span>
                  <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-bold text-slate-700">
                    {currentEmployeeFieldValue || "غير محدد"}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-emerald-800">
                    القيمة الجديدة المطلوبة لـ ({activeFieldDef.label}) *
                  </span>
                  {activeFieldDef.inputType === "select_or_text" && fieldSelectOptions.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={fieldSelectOptions.includes(newValueInput) ? newValueInput : ""}
                        onChange={(e) => {
                          if (e.target.value) setNewValueInput(e.target.value);
                        }}
                        className={inputCls}
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
                        className={inputCls}
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder={`أدخل ${activeFieldDef.label} الجديد...`}
                      value={newValueInput}
                      onChange={(e) => setNewValueInput(e.target.value)}
                      className={inputCls}
                    />
                  )}
                </div>

                {/* Reason */}
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs font-bold text-slate-700">سبب طلب التعديل / الملاحظات</span>
                  <textarea
                    rows={2}
                    placeholder="اكتب مبررات طلب تعديل البيانات..."
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#0070c0]"
                  />
                </label>

                {/* Attachment Upload */}
                <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700">
                      مرفق إثبات التحديث{" "}
                      {currentFieldRequiresAttachment ? (
                        <span className="text-rose-600 font-extrabold">(إلزامي لهذا الحقل *)</span>
                      ) : (
                        <span className="text-slate-400">(اختياري)</span>
                      )}
                    </span>
                    {attachmentName && (
                      <span className="text-[11px] font-bold text-emerald-700">
                        تم إرفاق: {attachmentName}
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleAttachmentUpload}
                    className="text-xs text-slate-600 file:ml-3 file:rounded-lg file:border-0 file:bg-[#0070c0] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                  />
                </div>

                {/* Live Approval Routing Info Box */}
                <div className="sm:col-span-2 rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs space-y-1">
                  <div className="font-extrabold text-[#004e82] flex items-center gap-1.5">
                    <MaterialIcon name="route" size={16} className="text-[#0070c0]" />
                    مسار الموافقة والرد حسب لائحة (تهيئة تحديث البيانات):
                  </div>
                  <div className="text-[11px] text-slate-700">
                    • <strong>موافقة المدير المباشر:</strong>{" "}
                    {isDirectManagerEnabledForRequest
                      ? "مفعّلة (يحق للمدير المباشر الموافقة أو الرد)"
                      : "غير مفعّلة (يرسل مباشرة لمجموعة الموافقات)"}
                  </div>
                  <div className="text-[11px] text-slate-700">
                    • <strong>مجموعة الموافقات المختصة:</strong>{" "}
                    {resolvedApprovalGroup?.name || "مجموعة الموارد البشرية"} (
                    {(resolvedApprovalGroup?.approvers || []).map((a) => a.name).join("، ") ||
                      "مسؤول الاعتماد"}
                    )
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitNewRequest()}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0070c0] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa3]"
                >
                  <MaterialIcon name="send" size={16} />
                  إرسال طلب تحديث البيانات
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL 2: مراجعة الطلب والرد والموافقة وتحديث ملف الموظف
           ===================================================================== */}
        {activeRequest && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
            dir="rtl"
          >
            <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#0070c0] px-2 py-0.5 font-mono text-xs font-bold text-white">
                      {activeRequest.requestNumber}
                    </span>
                    <h3 className="text-sm font-extrabold text-[#004e82]">
                      مراجعة والرد على طلب تحديث بيانات: {activeRequest.employeeName}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    مجموعة الموافقة: {activeRequest.approvalGroupName} | تاريخ الطلب:{" "}
                    {activeRequest.createdAt.slice(0, 10)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveRequest(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <MaterialIcon name="close" size={20} />
                </button>
              </div>

              {/* Comparison Card: Old Value vs New Value */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#004e82]">
                    البيان المطلوب تعديله: <span className="text-[#0070c0]">{activeRequest.fieldLabel}</span>
                  </span>
                  {activeRequest.appliedToEmployeeRecord && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                      ✓ تم تحديث بطاقة الموظف بالنظام
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] font-bold text-slate-400">القيمة السابقة بالنظام</div>
                    <div className="text-sm font-bold text-slate-600 mt-1">
                      {activeRequest.oldValue}
                    </div>
                  </div>
                  <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/60 p-3">
                    <div className="text-[11px] font-bold text-emerald-700">
                      القيمة الجديدة المطلوبة
                    </div>
                    <div className="text-sm font-extrabold text-emerald-900 mt-1">
                      {activeRequest.newValue}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-700">
                  <strong>سبب التعديل / ملاحظات الموظف:</strong> {activeRequest.reason}
                </div>

                {activeRequest.attachmentName && (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <MaterialIcon name="attach_file" size={16} className="text-[#0070c0]" />
                      المرفق: {activeRequest.attachmentName}
                    </span>
                    {activeRequest.attachmentDataUrl && (
                      <a
                        href={activeRequest.attachmentDataUrl}
                        download={activeRequest.attachmentName}
                        className="rounded bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0070c0] hover:bg-blue-100"
                      >
                        تحميل / معاينة المرفق
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Conversation & Replies History */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-700">
                  سجل الردود والاعتمادات ({activeRequest.replies.length})
                </h4>
                {activeRequest.replies.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-400">
                    لا توجد ردود أو ملاحظات مسجلة على هذا الطلب حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {activeRequest.replies.map((rep) => (
                      <div
                        key={rep.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-extrabold text-[#004e82]">
                            {rep.authorName} ({rep.authorRole})
                          </span>
                          <span className="font-mono">{rep.createdAt.slice(0, 16).replace("T", " ")}</span>
                        </div>
                        <div className="font-semibold text-slate-800">{rep.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Controls for Authorized User or Direct Manager */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-bold text-slate-700">
                      المستخدم القائم بالموافقة أو الرد (حسب مجموعات الموافقات والمدير المباشر)
                    </span>
                    <select
                      value={selectedActorName}
                      onChange={(e) => setSelectedActorName(e.target.value)}
                      className={inputCls}
                    >
                      {availableActorsForActiveRequest.map((actor, i) => (
                        <option key={i} value={actor.value}>
                          {actor.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-bold text-slate-700">
                      إضافة رد / قرار المراجعة أو سبب الرفض
                    </span>
                    <textarea
                      rows={2}
                      placeholder="اكتب ردك أو ملاحظتك للموظف هنا..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#0070c0]"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handleAddReplyOnly()}
                    className="flex items-center gap-1 rounded-lg border border-[#0070c0] bg-white px-3.5 py-2 text-xs font-bold text-[#0070c0] hover:bg-blue-50"
                  >
                    <MaterialIcon name="reply" size={16} />
                    إرسال رد فقط
                  </button>

                  {activeRequest.status === "pending" && (
                    <div className="flex flex-wrap items-center gap-2">
                      {activeRequest.allowDirectManager &&
                        activeRequest.directManagerStatus === "pending" && (
                          <button
                            type="button"
                            disabled={isSubmittingDecision}
                            onClick={() => void handleDirectManagerApprove()}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <MaterialIcon name="supervisor_account" size={16} />
                            موافقة المدير المباشر
                          </button>
                        )}

                      <button
                        type="button"
                        disabled={isSubmittingDecision}
                        onClick={() =>
                          void finalizeApprovalAndApply(
                            activeRequest,
                            selectedActorName || "مسؤول الاعتماد",
                          )
                        }
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <MaterialIcon name="check_circle" size={16} />
                        اعتماد وتحديث بيانات الموظف
                      </button>

                      <button
                        type="button"
                        disabled={isSubmittingDecision}
                        onClick={() => void handleRejectRequest()}
                        className="flex items-center gap-1 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        <MaterialIcon name="cancel" size={16} />
                        رفض الطلب
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
