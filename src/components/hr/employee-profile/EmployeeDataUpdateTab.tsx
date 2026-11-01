import React, { useState, useMemo, ChangeEvent } from "react";
import {
  FileEdit,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Paperclip,
  ArrowLeftRight,
  ShieldAlert,
  MessageSquare,
  User,
  Building,
  Briefcase,
  HelpCircle,
  PlusCircle,
  Eye,
  Download,
} from "lucide-react";
import { toast } from "sonner";
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
  type DataUpdateFieldDef,
} from "@/lib/data-update-config";

interface EmployeeDataUpdateTabProps {
  employee: any;
  onRefreshEmployee?: () => void;
  openNewOnMount?: boolean;
}

export function EmployeeDataUpdateTab({
  employee,
  onRefreshEmployee,
  openNewOnMount = false,
}: EmployeeDataUpdateTabProps) {
  const configQuery = useSettings("data_update_config");
  const requestsQuery = useSettings("data_update_requests");
  const saveRequests = useSaveSettings("data_update_requests");
  const saveApprovalRequest = useSaveRow("approval_requests");
  const { data: basicLookups = [] } = useRows("basic_lookups") as { data?: any[] };
  const { data: allEmployees = [] } = useRows("employees") as { data?: any[] };

  const config: DataUpdateConfigState = useMemo(() => {
    return loadDataUpdateConfig(configQuery.data?.["config_json"]);
  }, [configQuery.data]);

  const allRequests: DataUpdateRequestItem[] = useMemo(() => {
    return loadDataUpdateRequests(requestsQuery.data?.["requests_json"]);
  }, [requestsQuery.data]);

  // Filter requests belonging to this employee
  const employeeRequests = useMemo(() => {
    if (!employee) return [];
    const empId = String(employee.id || "");
    const empNo = String(employee.emp_no || "");
    return allRequests.filter(
      (r) =>
        (empId && String(r.employeeId) === empId) ||
        (empNo && String(r.empNo) === empNo) ||
        (employee.full_name && r.employeeName === employee.full_name),
    );
  }, [allRequests, employee]);

  // Resolve user group & permissions
  const resolvedGroup = useMemo(() => {
    return resolveEmployeePermissionGroup(employee, config);
  }, [employee, config]);

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

  // Modal State for New Request
  const [isModalOpen, setIsModalOpen] = useState(openNewOnMount);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>(
    allowedFields[0]?.key || "department",
  );
  const [newValueInput, setNewValueInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentDataUrl, setAttachmentDataUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for Viewing Request Details / Replying
  const [viewingRequest, setViewingRequest] = useState<DataUpdateRequestItem | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Active filter tab for requests list
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">(
    "all",
  );

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
    return getEmployeeFieldValue(employee, selectedFieldKey);
  }, [employee, selectedFieldKey]);

  // Options for dropdown if applicable
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

    allEmployees.forEach((emp: any) => {
      const val = String(emp[activeFieldDef.key] || "").trim();
      if (val && activeFieldDef.inputType === "select_or_text") {
        set.add(val);
      }
    });

    return Array.from(set).filter(Boolean);
  }, [activeFieldDef, basicLookups, allEmployees]);

  const handleOpenNewRequestForField = (fieldKey: string) => {
    setSelectedFieldKey(fieldKey);
    setNewValueInput("");
    setReasonInput("");
    setAttachmentName("");
    setAttachmentDataUrl("");
    setIsModalOpen(true);
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

  const handleSubmitRequest = async () => {
    if (!employee) return;
    if (!newValueInput.trim()) {
      toast.error(`يرجى إدخال القيمة الجديدة لحقل "${activeFieldDef.label}"`);
      return;
    }
    if (newValueInput.trim() === currentSystemValue) {
      toast.error("القيمة الجديدة مطابقة للقيمة الحالية المسجلة في ملفك");
      return;
    }
    if (currentFieldRule.requiresAttachment && !attachmentName) {
      toast.error(`حقل "${activeFieldDef.label}" يتطلب إرفاق مستند إثبات رسمي حسب لائحة النظام`);
      return;
    }

    setIsSubmitting(true);
    try {
      const reqNumber = `DU-${String(allRequests.length + 101).padStart(4, "0")}`;
      const empName = String(employee.full_name || employee.employee_name || "موظف");
      const empNo = String(employee.emp_no || "");
      const branch = String(employee.branch || "الفرع الرئيسي");
      const department = String(employee.department || "غير محدد");
      const directManager = String(
        employee.manager_name || employee.direct_manager || "المدير المباشر",
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
        employeeId: String(employee.id || ""),
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

      // Record in approval_requests for unified approvals
      try {
        await saveApprovalRequest.mutateAsync({
          employee_id: String(employee.id),
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

      toast.success(`تم تقديم طلب تحديث البيانات (${reqNumber}) بنجاح!`);
      setIsModalOpen(false);
      onRefreshEmployee?.();
    } catch {
      toast.error("حدث خطأ أثناء حفظ الطلب، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEmployeeReply = async () => {
    if (!viewingRequest || !replyInput.trim()) return;
    setIsSendingReply(true);
    try {
      const empName = String(employee?.full_name || "الموظف");
      const newReply = {
        id: `rep-${Date.now()}`,
        authorName: empName,
        authorRole: "الموظف",
        message: replyInput.trim(),
        actionType: "reply" as const,
        createdAt: new Date().toISOString(),
      };

      const updated = {
        ...viewingRequest,
        replies: [...viewingRequest.replies, newReply],
      };

      const nextAll = allRequests.map((r) => (r.id === updated.id ? updated : r));
      const json = saveDataUpdateRequestsLocal(nextAll);
      await saveRequests.mutateAsync({ requests_json: json });

      setViewingRequest(updated);
      setReplyInput("");
      toast.success("تم إرسال ردك على الطلب بنجاح");
    } finally {
      setIsSendingReply(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return employeeRequests.filter((r) => {
      if (statusFilter === "all") return true;
      return r.status === statusFilter;
    });
  }, [employeeRequests, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: employeeRequests.length,
      pending: employeeRequests.filter((r) => r.status === "pending").length,
      approved: employeeRequests.filter((r) => r.status === "approved").length,
      rejected: employeeRequests.filter((r) => r.status === "rejected").length,
    };
  }, [employeeRequests]);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Welcome & Summary Banner */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-l from-blue-50 via-white to-blue-50/40 p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0070c0] text-white shadow-xs">
                <FileEdit className="h-5 w-5" />
              </span>
              <h2 className="text-base font-black text-[#004e82]">
                شاشة طلبات تحديث بيانات الموظف
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-600">
              يمكنك من هنا تقديم طلب رسمي لتعديل بياناتك المسجلة (القسم، الوظيفة، الهوية، الحالة، إلخ) ومتابعة مراحل اعتمادها والردود عليها.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenNewRequestForField(allowedFields[0]?.key || "department")}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#0070c0] to-[#005fa3] px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            تقديم طلب تحديث بيانات جديد
          </button>
        </div>

        {/* Status Mini Cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">إجمالي الطلبات المقدمة</span>
            <p className="mt-1 font-mono text-lg font-black text-slate-800">{counts.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-700">بانتظار الاعتماد والمراجعة</span>
            <p className="mt-1 font-mono text-lg font-black text-amber-700">{counts.pending}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-700">معتمد وتم تحديث البيانات</span>
            <p className="mt-1 font-mono text-lg font-black text-emerald-700">{counts.approved}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 shadow-2xs">
            <span className="text-[11px] font-bold text-rose-700">طلبات مرفوضة</span>
            <p className="mt-1 font-mono text-lg font-black text-rose-700">{counts.rejected}</p>
          </div>
        </div>
      </div>

      {/* Regulation Info Strip for this Employee */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1 font-bold text-slate-700">
            <Briefcase className="h-4 w-4 text-[#0070c0]" />
            مجموعة صلاحياتك: <strong className="text-[#004e82]">{resolvedGroup.name}</strong>
          </span>
          <span className="flex items-center gap-1 font-bold text-slate-700">
            <Building className="h-4 w-4 text-emerald-600" />
            جهة الاعتماد المختصة:{" "}
            <strong className="text-emerald-800">{resolvedApprovalGroup?.name || "الموارد البشرية"}</strong>
          </span>
          <span className="flex items-center gap-1 font-bold text-slate-700">
            <User className="h-4 w-4 text-indigo-600" />
            موافقة المدير المباشر:{" "}
            <strong className={isDirectManagerEnabled ? "text-indigo-800" : "text-slate-500"}>
              {isDirectManagerEnabled
                ? `مطلوبة (${employee.manager_name || employee.direct_manager || "المدير المباشر"})`
                : "غير مطلوبة"}
            </strong>
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-500">
          عدد الحقول المصرح لك بتعديلها:{" "}
          <strong className="text-[#0070c0]">{allowedFields.length} حقل</strong>
        </span>
      </div>

      {/* Allowed Fields Quick Launch Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <MaterialIcon name="touch_app" size={17} className="text-[#0070c0]" />
            الحقول المتاحة لك لطلب التعديل (اضغط على أي حقل لتقديم طلب فوري):
          </h3>
          <span className="text-[11px] text-slate-400">انقر للبدء</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {DATA_UPDATE_FIELDS.map((field) => {
            const isAllowed = allowedFields.some((f) => f.key === field.key);
            const currentVal = getEmployeeFieldValue(employee, field.key);
            const rule = resolvedGroup.allowedFields[field.key];
            const requiresDoc = Boolean(rule?.requiresAttachment);

            if (!isAllowed) {
              return (
                <div
                  key={field.key}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold">{field.label}</span>
                    <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded">
                      محظور
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[11px] text-slate-400">
                    {currentVal || "—"}
                  </div>
                </div>
              );
            }

            return (
              <button
                key={field.key}
                type="button"
                onClick={() => handleOpenNewRequestForField(field.key)}
                className="group relative flex flex-col justify-between rounded-xl border border-blue-200 bg-blue-50/30 p-2.5 text-right transition hover:border-[#0070c0] hover:bg-blue-50 hover:shadow-xs active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#004e82] group-hover:text-[#0070c0]">
                    {field.label}
                  </span>
                  {requiresDoc && (
                    <span
                      title="يتطلب إرفاق مستند"
                      className="flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-black text-amber-800"
                    >
                      <Paperclip className="h-2.5 w-2.5" />
                      مرفق
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="truncate max-w-[120px] font-bold text-slate-700">
                    {currentVal || "غير محدد"}
                  </span>
                  <span className="text-[10px] font-bold text-[#0070c0] group-hover:underline">
                    تعديل ←
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* History & Active Requests Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#0070c0]" />
            <h3 className="text-xs font-black text-slate-800">
              سجل ومتابعة طلبات تحديث البيانات الخاصة بي
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { key: "all", label: "الكل" },
                { key: "pending", label: "قيد المراجعة" },
                { key: "approved", label: "معتمد" },
                { key: "rejected", label: "مرفوض" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  statusFilter === f.key
                    ? "bg-white text-[#0070c0] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FileEdit className="h-6 w-6" />
            </div>
            <p className="mt-2 text-xs font-black text-slate-700">
              لا توجد طلبات تحديث بيانات{" "}
              {statusFilter !== "all" ? "بهذه الحالة حالياً" : "مسجلة لك"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              اضغط على أي من الحقول أعلاه لتقديم طلبك الأول
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">رقم الطلب</th>
                  <th className="px-3 py-2.5">البيان المطلوب تعديله</th>
                  <th className="px-3 py-2.5">القيمة السابقة</th>
                  <th className="px-3 py-2.5">القيمة الجديدة</th>
                  <th className="px-3 py-2.5">تاريخ التقديم</th>
                  <th className="px-3 py-2.5">مرحلة الاعتماد / بانتظار</th>
                  <th className="px-3 py-2.5 text-center">الحالة</th>
                  <th className="px-3 py-2.5 text-center">التفاصيل والردود</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-blue-50/20 transition">
                    <td className="px-3 py-3 font-mono font-black text-[#0070c0]">
                      {req.requestNumber}
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {req.fieldLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-500 line-through">
                      {req.oldValue}
                    </td>
                    <td className="px-3 py-3 font-black text-emerald-700">
                      {req.newValue}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-500">
                      {req.createdAt.slice(0, 10)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-slate-700 font-semibold">{req.awaitingText}</div>
                      {req.allowDirectManager && (
                        <span
                          className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            req.directManagerStatus === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.directManagerStatus === "approved"
                            ? "✓ وافق المدير المباشر"
                            : "بانتظار المدير المباشر"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                          req.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : req.status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {req.status === "approved"
                          ? "✓ معتمد ومُحدّث"
                          : req.status === "rejected"
                            ? "مرفوض"
                            : "قيد المراجعة"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setViewingRequest(req)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0070c0] hover:bg-blue-100 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        عرض الردود ({req.replies?.length || 0})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: تقديم طلب تحديث بيانات جديد للموظف الحالي
         ===================================================================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          dir="rtl"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0070c0]">
                  <Send className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#004e82]">
                    تقديم طلب تحديث بيانات: {employee.full_name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    رقم وظيفي: #{employee.emp_no} | {employee.department || "بدون قسم"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Field to modify */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-black text-slate-700">
                  اختر البيان المطلوب تعديله *
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
                  سبب طلب التعديل / ملاحظات إضافية
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
                    <Paperclip className="h-3.5 w-3.5 text-[#0070c0]" />
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

              {/* Approval Path Preview */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs space-y-1">
                <span className="font-black text-[#004e82] block">
                  مسار الاعتماد المبرمج لهذا الطلب:
                </span>
                <p className="text-[11px] text-slate-600">
                  {isDirectManagerEnabled
                    ? `1. موافقة المدير المباشر (${employee.manager_name || employee.direct_manager || "المدير المباشر"}) ← 2. اعتمادات ${resolvedApprovalGroup?.name || "الموارد البشرية"}`
                    : `1. تحويل فوري إلى ${resolvedApprovalGroup?.name || "مجموعة اعتماد الموارد البشرية"}`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSubmitRequest()}
                className="flex items-center gap-1.5 rounded-lg bg-[#0070c0] px-5 py-2 text-xs font-black text-white shadow-xs hover:bg-[#005fa3] disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? "جاري الإرسال..." : "إرسال طلب التحديث"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: عرض تفاصيل الطلب وسجل الردود والتعليقات
         ===================================================================== */}
      {viewingRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          dir="rtl"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="rounded bg-[#0070c0] px-2 py-0.5 font-mono text-xs font-bold text-white">
                  {viewingRequest.requestNumber}
                </span>
                <h3 className="text-sm font-black text-[#004e82] mt-1">
                  تفاصيل طلب تحديث: {viewingRequest.fieldLabel}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingRequest(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            {/* Comparison Details */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-slate-200 bg-white p-2">
                  <span className="text-[10px] font-bold text-slate-400 block">القيمة السابقة:</span>
                  <span className="font-bold text-slate-700 line-through">
                    {viewingRequest.oldValue}
                  </span>
                </div>
                <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/80 p-2">
                  <span className="text-[10px] font-bold text-emerald-700 block">
                    القيمة المطلوبة:
                  </span>
                  <span className="font-black text-emerald-900">{viewingRequest.newValue}</span>
                </div>
              </div>

              <div className="text-xs text-slate-700">
                <strong>السبب:</strong> {viewingRequest.reason}
              </div>

              {viewingRequest.attachmentName && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5 text-[#0070c0]" />
                    {viewingRequest.attachmentName}
                  </span>
                  {viewingRequest.attachmentDataUrl && (
                    <a
                      href={viewingRequest.attachmentDataUrl}
                      download={viewingRequest.attachmentName}
                      className="text-[#0070c0] font-bold hover:underline text-[11px]"
                    >
                      تحميل
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Replies Thread */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-[#0070c0]" />
                سجل الملاحظات والردود ({viewingRequest.replies.length})
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {viewingRequest.replies.map((rep) => (
                  <div
                    key={rep.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-black text-[#004e82]">
                        {rep.authorName} ({rep.authorRole})
                      </span>
                      <span className="font-mono">
                        {rep.createdAt.slice(0, 16).replace("T", " ")}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">{rep.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Input for Employee */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <span className="text-xs font-black text-slate-700 block">
                إضافة رد أو توضيح على هذا الطلب:
              </span>
              <textarea
                rows={2}
                placeholder="اكتب ردك أو استفسارك هنا..."
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#0070c0]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isSendingReply || !replyInput.trim()}
                  onClick={() => void handleAddEmployeeReply()}
                  className="flex items-center gap-1 rounded-lg bg-[#0070c0] px-4 py-1.5 text-xs font-black text-white hover:bg-[#005fa3] disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  إرسال الرد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
