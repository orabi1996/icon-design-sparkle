import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  DEFAULT_PUBLISHED_REQUESTS,
  buildMultiFieldEmployeeUpdatePatch,
  getAllDataUpdateFields,
  getEmployeeFieldValue,
  loadDataUpdateConfig,
  loadDataUpdateRequests,
  saveDataUpdateConfigLocal,
  saveDataUpdateRequestsLocal,
  type DataUpdateApprovalGroup,
  type DataUpdateCategory,
  type DataUpdateConfigState,
  type DataUpdateFieldChange,
  type DataUpdateFieldDef,
  type DataUpdatePublishedRequest,
  type DataUpdateRequestItem,
} from "@/lib/data-update-config";

export const Route = createFileRoute("/regulations/data-update")({
  head: () => ({
    meta: [
      { title: "تهيئة وطلبات تحديث البيانات | الموارد البشرية" },
      {
        name: "description",
        content:
          "إنشاء وإرسال طلبات تحديث البيانات للموظفين (Public أو مخصصة) والتحكم في الحقول وسلسلة الموافقات.",
      },
    ],
  }),
  component: DataUpdateCleanPage,
});

const inputCls =
  "h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-2 focus:ring-[#0070c0]/15";

// قوالب سريعة جاهزة لتسهيل إنشاء الطلب بضغطة زر
const QUICK_TEMPLATES = [
  {
    label: "تحديث الجوال والإيميل والعنوان الوطني والسكن",
    title: "طلب تحديث بيانات التواصل والعنوان الوطني والسكن",
    description:
      "يرجى مراجعة وتحديث رقم الجوال، البريد الإلكتروني، العنوان الوطني، بريد السكن، ورقم المبنى",
    fields: ["phone", "email", "short_address", "postal_code", "building_no", "street", "district", "city"],
    requiresApproval: false,
  },
  {
    label: "تحديث بيانات الإقامة والهوية",
    title: "طلب تحديث بيانات الإقامة والهوية والحالة الاجتماعية",
    description: "يرجى تحديث رقم الهوية/الإقامة، تاريخ انتهاء الإقامة، مكان الإصدار، والحالة الاجتماعية",
    fields: ["national_id", "id_type", "iqama_expiry", "iqama_issue_place", "social_status"],
    requiresApproval: true,
  },
  {
    label: "تحديث البيانات الوظيفية والمؤهل",
    title: "طلب تحديث البيانات الوظيفية والمؤهل الدراسي",
    description: "مراجعة وتحديث القسم، الوظيفة الحالية، التخصص، والمؤهل الدراسي",
    fields: ["department", "job_title", "specialization", "last_qualification", "branch"],
    requiresApproval: true,
  },
];

export function DataUpdateCleanPage() {
  const settingsQuery = useSettings("data_update_config");
  const saveSettings = useSaveSettings("data_update_config");

  const requestsSettingsQuery = useSettings("data_update_requests");
  const saveRequestsSettings = useSaveSettings("data_update_requests");

  const { data: employees = [] } = useRows("employees");
  const saveEmployee = useSaveRow("employees");

  const [config, setConfig] = useState<DataUpdateConfigState>(() => loadDataUpdateConfig());
  const [submissions, setSubmissions] = useState<DataUpdateRequestItem[]>(() =>
    loadDataUpdateRequests(),
  );
  const [hydrated, setHydrated] = useState(false);

  // القسم المعروض: الطلبات المنشأة | ردود الموظفين
  const [activeView, setActiveView] = useState<"published" | "submissions">("published");

  // نافذة إنشاء / تعديل طلب تحديث بيانات
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [reqTitle, setReqTitle] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [reqScopeType, setReqScopeType] = useState<"public" | "department" | "branch">("public");
  const [reqScopeValue, setReqScopeValue] = useState("الكل");
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<string[]>([
    "phone",
    "email",
    "short_address",
    "postal_code",
    "building_no",
    "iqama_expiry",
  ]);
  const [requiresApprovalChain, setRequiresApprovalChain] = useState<boolean>(false);
  const [selectedApprovalGroupId, setSelectedApprovalGroupId] = useState<string>("ag-hr-main");
  const [allowDirectManager, setAllowDirectManager] = useState<boolean>(true);
  const [declarationText, setDeclarationText] = useState<string>(
    "أقر بأنني قمت بمراجعة وتعبئة البيانات الموضحة أعلاه والتأكد من صحتها، وأوافق على إضافتها وتحديثها في النظام.",
  );

  // إضافة بيان / حقل جديد سريع داخل الطلب
  const [customFieldName, setCustomFieldName] = useState("");
  const [customFieldType, setCustomFieldType] = useState<"text" | "date" | "number">("text");

  // نافذة تجربة / تعبئة الطلب كموظف (لمعاينة كيف يضيف الموظف بياناته وتسمع في النظام)
  const [fillingPublishedReq, setFillingPublishedReq] =
    useState<DataUpdatePublishedRequest | null>(null);
  const [fillingEmployeeId, setFillingEmployeeId] = useState<string>("");
  const [fillingValues, setFillingValues] = useState<Record<string, string>>({});
  const [employeeConfirmedDeclaration, setEmployeeConfirmedDeclaration] = useState<boolean>(false);
  const [isSubmittingFill, setIsSubmittingFill] = useState(false);

  // نافذة إدارة سلاسل الموافقة (مبسطة جداً)
  const [isApprovalChainsModalOpen, setIsApprovalChainsModalOpen] = useState(false);
  const [newChainName, setNewChainName] = useState("");
  const [newChainApprover, setNewChainApprover] = useState("");
  const [newChainDirectManager, setNewChainDirectManager] = useState(true);

  useEffect(() => {
    if (settingsQuery.isFetched && !hydrated) {
      const loaded = loadDataUpdateConfig(settingsQuery.data?.["config_json"]);
      setConfig(loaded);
      setHydrated(true);
    }
  }, [hydrated, settingsQuery.data, settingsQuery.isFetched]);

  useEffect(() => {
    if (requestsSettingsQuery.isFetched) {
      setSubmissions(loadDataUpdateRequests(requestsSettingsQuery.data?.["requests_json"]));
    }
  }, [requestsSettingsQuery.data, requestsSettingsQuery.isFetched]);

  const persistConfig = async (next: DataUpdateConfigState, successMsg?: string) => {
    setConfig(next);
    const json = saveDataUpdateConfigLocal(next);
    try {
      await saveSettings.mutateAsync({ config_json: json });
    } catch {
      // saved locally
    }
    if (successMsg) toast.success(successMsg);
  };

  const persistSubmissions = async (next: DataUpdateRequestItem[]) => {
    setSubmissions(next);
    const json = saveDataUpdateRequestsLocal(next);
    try {
      await saveRequestsSettings.mutateAsync({ requests_json: json });
    } catch {
      // saved locally
    }
  };

  const allFields = useMemo(() => getAllDataUpdateFields(config), [config]);

  const publishedRequests = useMemo(
    () =>
      Array.isArray(config.publishedRequests) && config.publishedRequests.length > 0
        ? config.publishedRequests
        : DEFAULT_PUBLISHED_REQUESTS,
    [config.publishedRequests],
  );

  const departments = useMemo(() => {
    const s = new Set<string>(["الموارد البشرية", "الشؤون الإدارية", "المالية", "التشغيل"]);
    employees.forEach((e: Row) => {
      if (e["department"]) s.add(String(e["department"]).trim());
    });
    return Array.from(s);
  }, [employees]);

  const branches = useMemo(() => {
    const s = new Set<string>(["الفرع الرئيسي", "فرع الرياض", "فرع جدة"]);
    employees.forEach((e: Row) => {
      if (e["branch"]) s.add(String(e["branch"]).trim());
    });
    return Array.from(s);
  }, [employees]);

  // فتح نافذة إنشاء طلب جديد
  const handleOpenCreateModal = () => {
    setEditingRequestId(null);
    setReqTitle("طلب تحديث بيانات التواصل والعنوان الوطني والإقامة");
    setReqDescription("يرجى مراجعة وتحديث البيانات المحددة والتأكيد على صحتها");
    setReqScopeType("public");
    setReqScopeValue("الكل");
    setSelectedFieldKeys([
      "phone",
      "email",
      "short_address",
      "postal_code",
      "building_no",
      "iqama_expiry",
    ]);
    setRequiresApprovalChain(false);
    setSelectedApprovalGroupId(config.approvalGroups[0]?.id || "ag-hr-main");
    setAllowDirectManager(true);
    setDeclarationText(
      "أقر بأنني قمت بمراجعة وتعبئة البيانات الموضحة أعلاه والتأكد من صحتها، وأوافق على إضافتها وتحديثها في النظام.",
    );
    setIsCreateModalOpen(true);
  };

  // فتح نافذة تعديل طلب قائم
  const handleOpenEditModal = (req: DataUpdatePublishedRequest) => {
    setEditingRequestId(req.id);
    setReqTitle(req.title);
    setReqDescription(req.description || "");
    setReqScopeType(req.targetScopeType === "specific_employees" ? "public" : req.targetScopeType);
    setReqScopeValue(req.targetScopeValue || "الكل");
    setSelectedFieldKeys(req.fieldKeys);
    setRequiresApprovalChain(req.requiresApprovalChain);
    setSelectedApprovalGroupId(req.approvalGroupId || config.approvalGroups[0]?.id || "ag-hr-main");
    setAllowDirectManager(req.allowDirectManager);
    setDeclarationText(req.declarationText || config.declarationText);
    setIsCreateModalOpen(true);
  };

  const toggleFieldKey = (key: string) => {
    setSelectedFieldKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  // إضافة حقل جديد غير موجود في القائمة وإدراجه مباشرة في الطلب
  const handleAddQuickCustomField = async () => {
    const label = customFieldName.trim();
    if (!label) {
      toast.error("يرجى كتابة اسم البيان / الحقل الجديد أولاً");
      return;
    }
    const key = `custom_${Date.now().toString().slice(-5)}`;
    const newField: DataUpdateFieldDef = {
      key,
      label,
      category: "حقول مخصصة لتحديث البيانات" as DataUpdateCategory,
      inputType: customFieldType,
      isCustom: true,
      updateMode: requiresApprovalChain ? "approval_required" : "direct",
      linkedApprovalGroupId: selectedApprovalGroupId,
      allowDirectManager,
      requiresAttachment: false,
      requiresDeclaration: true,
      active: true,
    };

    const nextConfig: DataUpdateConfigState = {
      ...config,
      customFields: [...(config.customFields || []), newField],
    };
    await persistConfig(nextConfig);
    setSelectedFieldKeys((prev) => [...prev, key]);
    setCustomFieldName("");
    toast.success(`تمت إضافة حقل "${label}" وتحديده داخل الطلب`);
  };

  // حفظ الطلب ونشره للموظفين
  const handleSavePublishedRequest = async () => {
    if (!reqTitle.trim()) {
      toast.error("يرجى كتابة عنوان الطلب");
      return;
    }
    if (selectedFieldKeys.length === 0) {
      toast.error("يرجى اختيار حقل واحد على الأقل ليتضمنه الطلب");
      return;
    }

    const item: DataUpdatePublishedRequest = {
      id: editingRequestId || `pub-req-${Date.now()}`,
      code: editingRequestId
        ? publishedRequests.find((r) => r.id === editingRequestId)?.code || "REQ"
        : `REQ-0${publishedRequests.length + 1}`,
      title: reqTitle.trim(),
      description: reqDescription.trim(),
      isPublic: reqScopeType === "public",
      targetScopeType: reqScopeType,
      targetScopeValue: reqScopeType === "public" ? "الكل" : reqScopeValue,
      targetEmployeeIds: [],
      fieldKeys: selectedFieldKeys,
      requiresApprovalChain,
      approvalGroupId: selectedApprovalGroupId,
      allowDirectManager: requiresApprovalChain ? allowDirectManager : false,
      requiresAttachment: false,
      declarationText: declarationText.trim(),
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const nextPublished = editingRequestId
      ? publishedRequests.map((r) => (r.id === editingRequestId ? item : r))
      : [item, ...publishedRequests];

    // نحدث أيضاً إعدادات الحقول المختارة لتتوافق مع وضع الطلب
    const nextFieldConfigs = { ...config.fieldConfigs };
    for (const fk of selectedFieldKeys) {
      const fDef = allFields.find((f) => f.key === fk);
      if (fDef) {
        nextFieldConfigs[fk] = {
          fieldKey: fk,
          label: fDef.label,
          category: fDef.category,
          inputType: fDef.inputType,
          defaultOptions: fDef.defaultOptions,
          updateMode: requiresApprovalChain ? "approval_required" : "direct",
          linkedApprovalGroupId: selectedApprovalGroupId,
          allowDirectManager: requiresApprovalChain ? allowDirectManager : false,
          requiresAttachment: false,
          requiresDeclaration: true,
          active: true,
        };
      }
    }

    await persistConfig(
      {
        ...config,
        fieldConfigs: nextFieldConfigs,
        publishedRequests: nextPublished,
      },
      editingRequestId
        ? "تم تحديث الطلب بنجاح"
        : "تم إنشاء الطلب ونشره للموظفين بنجاح",
    );
    setIsCreateModalOpen(false);
  };

  const handleDeletePublishedRequest = async (id: string) => {
    const next = publishedRequests.filter((r) => r.id !== id);
    await persistConfig({ ...config, publishedRequests: next }, "تم حذف الطلب");
  };

  // فتح نافذة تعبئة الطلب كموظف
  const handleOpenFillModal = (req: DataUpdatePublishedRequest) => {
    const firstEmp =
      employees.find((e: Row) => String(e["emp_no"]) === "10078") || employees[0] || null;
    const empId = firstEmp ? String(firstEmp["id"]) : "";
    setFillingPublishedReq(req);
    setFillingEmployeeId(empId);
    setEmployeeConfirmedDeclaration(false);

    if (firstEmp) {
      const initial: Record<string, string> = {};
      for (const fk of req.fieldKeys) {
        const cur = getEmployeeFieldValue(firstEmp, fk);
        initial[fk] = cur === "غير محدد" ? "" : cur;
      }
      setFillingValues(initial);
    } else {
      setFillingValues({});
    }
  };

  const handleChangeFillEmployee = (empId: string) => {
    setFillingEmployeeId(empId);
    const emp = employees.find((e: Row) => String(e["id"]) === empId);
    if (emp && fillingPublishedReq) {
      const initial: Record<string, string> = {};
      for (const fk of fillingPublishedReq.fieldKeys) {
        const cur = getEmployeeFieldValue(emp, fk);
        initial[fk] = cur === "غير محدد" ? "" : cur;
      }
      setFillingValues(initial);
    }
  };

  // إرسال الموظف للبيانات بعد مراجعتها والموافقة على الإقرار
  const handleEmployeeSubmitRequest = async () => {
    if (!fillingPublishedReq) return;
    const emp = employees.find((e: Row) => String(e["id"]) === fillingEmployeeId);
    if (!emp) {
      toast.error("يرجى اختيار الموظف أولاً");
      return;
    }

    const changes: DataUpdateFieldChange[] = [];
    for (const fk of fillingPublishedReq.fieldKeys) {
      const fDef = allFields.find((f) => f.key === fk);
      const label = fDef?.label || fk;
      const oldVal = getEmployeeFieldValue(emp, fk);
      const newVal = (fillingValues[fk] || "").trim();
      if (newVal && newVal !== oldVal) {
        changes.push({
          fieldKey: fk,
          fieldLabel: label,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    }

    if (changes.length === 0) {
      toast.error("يرجى إدخال أو تعديل قيمة واحدة على الأقل من حقول الطلب");
      return;
    }

    if (!employeeConfirmedDeclaration) {
      toast.error("يرجى التأشير على إقرار صحة البيانات قبل الضغط على موافق");
      return;
    }

    setIsSubmittingFill(true);
    try {
      const reqNumber = `DU-${String(submissions.length + 101).padStart(4, "0")}`;
      const empName = String(emp["full_name"] || emp["employee_name"] || "موظف");
      const empNo = String(emp["emp_no"] || "");
      const branch = String(emp["branch"] || "الفرع الرئيسي");
      const department = String(emp["department"] || "غير محدد");
      const directManager = String(emp["manager_name"] || "المدير المباشر");
      const nowIso = new Date().toISOString();

      const isDirect = !fillingPublishedReq.requiresApprovalChain;
      const appGroup =
        config.approvalGroups.find((g) => g.id === fillingPublishedReq.approvalGroupId) ||
        config.approvalGroups[0];

      // إذا كان الطلب لا يخضع لسلسلة موافقة -> يتحدث فوراً في ملف الموظف بالنظام!
      if (isDirect) {
        const patch = buildMultiFieldEmployeeUpdatePatch(
          emp,
          changes,
          reqNumber,
          `${empName} (تحديث مباشر بإقرار الموظف)`,
        );
        try {
          await saveEmployee.mutateAsync({
            ...emp,
            ...patch,
            id: emp["id"],
          });
        } catch {
          // localStorage extras already updated by buildMultiFieldEmployeeUpdatePatch
        }
      }

      const summaryLabels = changes.map((c) => c.fieldLabel).join(" + ");
      const summaryOld = changes.map((c) => `${c.fieldLabel}: ${c.oldValue}`).join(" | ");
      const summaryNew = changes.map((c) => `${c.fieldLabel}: ${c.newValue}`).join(" | ");

      const newSubmission: DataUpdateRequestItem = {
        id: `du-${Date.now()}`,
        requestNumber: reqNumber,
        employeeId: String(emp["id"]),
        empNo,
        employeeName: empName,
        branch,
        department,
        directManagerName: directManager,
        userGroupId: "ug-all-employees",
        userGroupName: fillingPublishedReq.isPublic ? "طلب عام (Public)" : "طلب مخصص",
        publishedRequestId: fillingPublishedReq.id,
        publishedRequestTitle: fillingPublishedReq.title,
        fieldChanges: changes,
        updateMode: isDirect ? "direct" : "approval_required",
        employeeDeclared: true,
        declaredAt: nowIso.slice(0, 10),
        declarationTextSnapshot: fillingPublishedReq.declarationText,
        approvalGroupId: appGroup?.id || "ag-hr-main",
        approvalGroupName: isDirect
          ? "لا يخضع لسلسلة موافقة (تحديث مباشر بإقرار الموظف)"
          : appGroup?.name || "سلسلة الموافقة",
        allowDirectManager: isDirect ? false : fillingPublishedReq.allowDirectManager,
        directManagerStatus: isDirect
          ? "not_required"
          : fillingPublishedReq.allowDirectManager
            ? "pending"
            : "not_required",
        fieldKey: changes[0]!.fieldKey,
        fieldLabel: changes.length === 1 ? changes[0]!.fieldLabel : `${fillingPublishedReq.title} (${summaryLabels})`,
        oldValue: changes.length === 1 ? changes[0]!.oldValue : summaryOld,
        newValue: changes.length === 1 ? changes[0]!.newValue : summaryNew,
        reason: `رد الموظف على: ${fillingPublishedReq.title}`,
        status: isDirect ? "approved" : "pending",
        awaitingText: isDirect
          ? "تم التحديث في النظام فوراً بإقرار الموظف ✓"
          : `بانتظار موافقة: ${appGroup?.name || "سلسلة الموافقة"}`,
        authorizedApproverNames: (appGroup?.approvers || []).map((a) => a.name),
        appliedToEmployeeRecord: isDirect,
        decisionBy: isDirect ? `${empName} (إقرار مباشر OK)` : undefined,
        decisionAt: isDirect ? nowIso.slice(0, 10) : undefined,
        replies: [
          {
            id: `rep-${Date.now()}`,
            authorName: empName,
            authorRole: "الموظف",
            message: `أقر بصحة البيانات المدخلة (${summaryNew}) والموافقة على إضافتها في النظام.`,
            actionType: isDirect ? "direct_self_update" : "reply",
            createdAt: nowIso.slice(0, 16).replace("T", " "),
          },
        ],
        createdAt: nowIso.slice(0, 10),
      };

      await persistSubmissions([newSubmission, ...submissions]);
      setFillingPublishedReq(null);
      setActiveView("submissions");

      if (isDirect) {
        toast.success(
          `تم تحديث بيانات الموظف "${empName}" في النظام فوراً بناءً على إقراره (${changes.length} بيانات محدثة)`,
        );
      } else {
        toast.success(
          `تم إرسال البيانات لسلسلة الموافقة (${appGroup?.name})، وستتحدث في النظام فور اعتمادها`,
        );
      }
    } finally {
      setIsSubmittingFill(false);
    }
  };

  // اعتماد طلب خاضع لسلسلة موافقة وتحديث بيانات الموظف في النظام فوراً
  const handleApproveSubmission = async (sub: DataUpdateRequestItem) => {
    const emp = employees.find(
      (e: Row) =>
        String(e["id"]) === sub.employeeId ||
        (sub.empNo && String(e["emp_no"]) === sub.empNo),
    );

    const changes: DataUpdateFieldChange[] =
      Array.isArray(sub.fieldChanges) && sub.fieldChanges.length > 0
        ? sub.fieldChanges
        : [
            {
              fieldKey: sub.fieldKey,
              fieldLabel: sub.fieldLabel,
              oldValue: sub.oldValue,
              newValue: sub.newValue,
            },
          ];

    if (emp) {
      const patch = buildMultiFieldEmployeeUpdatePatch(
        emp,
        changes,
        sub.requestNumber,
        "اعتماد سلسلة الموافقة",
      );
      try {
        await saveEmployee.mutateAsync({
          ...emp,
          ...patch,
          id: emp["id"],
        });
      } catch {
        // localStorage updated
      }
    }

    const nowDate = new Date().toISOString().slice(0, 10);
    const updated = submissions.map((item) =>
      item.id === sub.id
        ? {
            ...item,
            status: "approved" as const,
            directManagerStatus: "approved" as const,
            appliedToEmployeeRecord: true,
            decisionBy: "مسؤول سلسلة الموافقة",
            decisionAt: nowDate,
            awaitingText: "تم الاعتماد والتحديث في النظام ✓",
          }
        : item,
    );

    await persistSubmissions(updated);
    toast.success(`تمت الموافقة وتحديث بيانات "${sub.employeeName}" في النظام بنجاح`);
  };

  const handleRejectSubmission = async (sub: DataUpdateRequestItem) => {
    const nowDate = new Date().toISOString().slice(0, 10);
    const updated = submissions.map((item) =>
      item.id === sub.id
        ? {
            ...item,
            status: "rejected" as const,
            decisionBy: "مسؤول سلسلة الموافقة",
            decisionAt: nowDate,
            awaitingText: "مرفوض",
          }
        : item,
    );
    await persistSubmissions(updated);
    toast.info(`تم رفض الطلب #${sub.requestNumber}`);
  };

  // إضافة سلسلة موافقة جديدة بسرعة
  const handleAddApprovalChain = async () => {
    if (!newChainName.trim()) {
      toast.error("يرجى كتابة اسم سلسلة / مجموعة الموافقة");
      return;
    }
    const newGroup: DataUpdateApprovalGroup = {
      id: `ag-${Date.now()}`,
      code: `AG-0${config.approvalGroups.length + 1}`,
      name: newChainName.trim(),
      description: "سلسلة موافقة لطلبات تحديث البيانات",
      targetBranch: "الكل",
      targetDepartment: "الكل",
      allowDirectManager: newChainDirectManager,
      directManagerStageOrder: "first",
      requireAllApprovers: false,
      approvers: [
        {
          id: `ap-${Date.now()}`,
          name: newChainApprover.trim() || "مدير الموارد البشرية",
          roleLabel: "معتمد الطلبات",
          canApprove: true,
          canReply: true,
        },
      ],
      active: true,
    };

    await persistConfig(
      {
        ...config,
        approvalGroups: [...config.approvalGroups, newGroup],
      },
      "تمت إضافة سلسلة الموافقة بنجاح",
    );
    setSelectedApprovalGroupId(newGroup.id);
    setNewChainName("");
    setNewChainApprover("");
  };

  const pendingSubmissionsCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <AppShell>
      <div className="space-y-4">
        {/* =====================================================================
            1. شريط علوي نظيف ومباشر بدون زحام
           ===================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0070c0] text-white shadow-xs">
              <MaterialIcon name="assignment_ind" size={24} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900">
                تحديث البيانات — إنشاء وإرسال الطلبات للموظفين
              </h1>
              <p className="text-xs text-slate-500">
                أنشئ طلب تحديث بيانات (Public أو مخصص)، وحدد الحقول المطلوبة (الجوال، الإيميل، العنوان الوطني، الإقامة...)، واختر هل يخضع لسلسلة موافقة أم يتحدث مباشرة بإقرار الموظف.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 rounded-xl bg-[#0070c0] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-[#005fa3] cursor-pointer"
            >
              <MaterialIcon name="add_circle" size={18} />
              <span>+ إضافة / إنشاء طلب تحديث بيانات</span>
            </button>

            <button
              type="button"
              onClick={() => setIsApprovalChainsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
            >
              <MaterialIcon name="account_tree" size={17} className="text-[#0070c0]" />
              <span>سلاسل الموافقة ({config.approvalGroups.length})</span>
            </button>

            <Link
              to="/portal"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              <MaterialIcon name="badge" size={17} />
              <span>بوابة الموظف</span>
            </Link>

            <Link
              to="/reports/data-update-completion"
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs font-bold text-indigo-800 transition hover:bg-indigo-100"
            >
              <MaterialIcon name="fact_check" size={17} />
              <span>تقرير الإنجاز</span>
            </Link>
          </div>
        </div>

        {/* =====================================================================
            2. تبديل بسيط بين: الطلبات المرسلة للموظفين | ردود الموظفين والاعتمادات
           ===================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 pt-2 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView("published")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition cursor-pointer ${
                activeView === "published"
                  ? "border-[#0070c0] text-[#0070c0]"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <MaterialIcon name="campaign" size={18} />
              <span>الطلبات المنشأة والمرسلة للموظفين ({publishedRequests.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("submissions")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition cursor-pointer ${
                activeView === "submissions"
                  ? "border-[#0070c0] text-[#0070c0]"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <MaterialIcon name="inbox" size={18} />
              <span>ردود الموظفين والبيانات المرسلة ({submissions.length})</span>
              {pendingSubmissionsCount > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                  {pendingSubmissionsCount} بانتظار الموافقة
                </span>
              )}
            </button>
          </div>
        </div>

        {/* =====================================================================
            VIEW A: جدول الطلبات المنشأة والمرسلة للموظفين (بسيط ومباشر)
           ===================================================================== */}
        {activeView === "published" && (
          <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-white p-4 shadow-xs space-y-3">
            {publishedRequests.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm font-bold text-slate-500">
                  لا توجد طلبات تحديث بيانات منشأة حالياً
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0070c0] px-4 py-2 text-xs font-bold text-white"
                >
                  <MaterialIcon name="add" size={17} />
                  <span>إنشاء أول طلب تحديث بيانات</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#004e82] text-white font-bold">
                    <tr>
                      <th className="px-4 py-3">عنوان الطلب</th>
                      <th className="px-4 py-3">النطاق (لمن يظهر؟)</th>
                      <th className="px-4 py-3">البيانات المطلوبة في الطلب</th>
                      <th className="px-4 py-3">حالة سلسلة الموافقة</th>
                      <th className="px-4 py-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {publishedRequests.map((req) => {
                      const chain = config.approvalGroups.find(
                        (g) => g.id === req.approvalGroupId,
                      );
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5 align-top">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                                {req.code}
                              </span>
                              <span className="font-black text-slate-900 text-[13px]">
                                {req.title}
                              </span>
                            </div>
                            {req.description && (
                              <p className="mt-1 text-[11px] text-slate-500">{req.description}</p>
                            )}
                          </td>

                          <td className="px-4 py-3.5 align-top">
                            {req.isPublic || req.targetScopeType === "public" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-extrabold text-[#0070c0]">
                                <MaterialIcon name="public" size={14} />
                                <span>Public — متاح لجميع الموظفين</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-1 text-[11px] font-bold text-purple-800">
                                <span>
                                  مخصص ({req.targetScopeType === "department" ? "قسم" : "فرع"}:{" "}
                                  {req.targetScopeValue})
                                </span>
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 align-top">
                            <div className="flex flex-wrap gap-1.5 max-w-xl">
                              {req.fieldKeys.map((fk) => {
                                const fDef = allFields.find((f) => f.key === fk);
                                return (
                                  <span
                                    key={fk}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700"
                                  >
                                    {fDef?.label || fk}
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 align-top">
                            {!req.requiresApprovalChain ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-900">
                                  <MaterialIcon name="bolt" size={15} />
                                  <span>لا يخضع لسلسلة موافقة</span>
                                </span>
                                <div className="text-[10px] font-semibold text-emerald-700">
                                  يتحدث فوراً بالنظام بعد إقرار الموظف بصحة بياناته
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-900">
                                  <MaterialIcon name="route" size={15} />
                                  <span>يخضع لسلسلة موافقة</span>
                                </span>
                                <div className="text-[10px] font-bold text-slate-600">
                                  {chain?.name || "مجموعة اعتماد الموارد البشرية"}
                                  {req.allowDirectManager ? " + المدير المباشر" : ""}
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 align-top text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenFillModal(req)}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-700 cursor-pointer"
                                title="جرب كيف يفتح الموظف هذا الطلب ويضيف بياناته ويوافق على الإقرار"
                              >
                                <MaterialIcon name="edit_note" size={16} />
                                <span>تعبئة الطلب كموظف</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(req)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                تعديل
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePublishedRequest(req.id)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                              >
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            VIEW B: جدول ردود الموظفين والبيانات المرسلة (للاعتماد أو المراجعة)
           ===================================================================== */}
        {activeView === "submissions" && (
          <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-white p-4 shadow-xs space-y-3">
            {submissions.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400">
                لا توجد ردود مرسلة من الموظفين حتى الآن. يمكنك الضغط على «تعبئة الطلب كموظف» لتجربتها الآن.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-800 text-white font-bold">
                    <tr>
                      <th className="px-3.5 py-3">رقم الطلب</th>
                      <th className="px-3.5 py-3">الموظف</th>
                      <th className="px-3.5 py-3">الطلب والبيانات التي أضافها الموظف</th>
                      <th className="px-3.5 py-3">إقرار الموظف</th>
                      <th className="px-3.5 py-3">مسار الاعتماد</th>
                      <th className="px-3.5 py-3 text-center">الحالة / الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="px-3.5 py-3 font-mono font-bold text-[#0070c0]">
                          #{sub.requestNumber}
                          <div className="text-[10px] text-slate-400">{sub.createdAt}</div>
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="font-black text-slate-900">{sub.employeeName}</div>
                          <div className="text-[10px] text-slate-500">
                            رقم وظيفي: {sub.empNo || "—"} | {sub.department}
                          </div>
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="font-extrabold text-[#004e82] mb-1">
                            {sub.publishedRequestTitle || sub.fieldLabel}
                          </div>
                          {Array.isArray(sub.fieldChanges) && sub.fieldChanges.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {sub.fieldChanges.map((ch) => (
                                <span
                                  key={ch.fieldKey}
                                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50/60 px-2 py-0.5 text-[11px]"
                                >
                                  <strong className="text-slate-700">{ch.fieldLabel}:</strong>
                                  <span className="text-slate-400 line-through text-[10px]">
                                    {ch.oldValue}
                                  </span>
                                  <span className="font-extrabold text-emerald-700">
                                    ← {ch.newValue}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px]">
                              <span className="text-slate-400 line-through ml-1">{sub.oldValue}</span>
                              <span className="font-bold text-emerald-700">← {sub.newValue}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            <MaterialIcon name="verified" size={13} />
                            <span>أقر بصحة البيانات ✓</span>
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-[11px] font-semibold text-slate-600">
                          {sub.updateMode === "direct" ? (
                            <span className="text-emerald-700 font-bold">
                              بدون سلسلة موافقة (تحديث مباشر)
                            </span>
                          ) : (
                            <span>{sub.approvalGroupName}</span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          {sub.status === "pending" ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveSubmission(sub)}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                              >
                                موافقة وتحديث النظام ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectSubmission(sub)}
                                className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                              >
                                رفض
                              </button>
                            </div>
                          ) : sub.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-900">
                              <MaterialIcon name="check_circle" size={14} />
                              <span>تم التحديث في النظام ✓</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">
                              مرفوض
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: نافذة إضافة / إنشاء طلب تحديث بيانات (بسيطة ومباشرة جداً)
         ===================================================================== */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          dir="rtl"
        >
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0070c0] text-white">
                  <MaterialIcon name="post_add" size={20} />
                </span>
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    {editingRequestId
                      ? "تعديل طلب تحديث البيانات"
                      : "إنشاء / إضافة طلب تحديث بيانات لإرساله للموظفين"}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    تحكم في البيانات المطلوبة في الطلب، واجعله Public أو مخصصاً، وحدد هل يخضع لسلسلة موافقة أم لا.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            {/* قوالب سريعة لتعبئة الطلب بضغطة واحدة */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 block">
                اختيار سريع لقالب طلب جاهز (اختياري):
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      setReqTitle(tpl.title);
                      setReqDescription(tpl.description);
                      setSelectedFieldKeys(tpl.fields);
                      setRequiresApprovalChain(tpl.requiresApproval);
                    }}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-bold text-[#0070c0] hover:bg-blue-50 transition cursor-pointer"
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. عنوان الطلب ونطاق الإرسال (Public أو مخصص) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  1. عنوان الطلب الذي سيظهر للموظفين *
                </label>
                <input
                  type="text"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="مثال: طلب تحديث أرقام الجوال والإيميل والعنوان الوطني والإقامة..."
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  نطاق الطلب (لمن يُرسل؟)
                </label>
                <select
                  value={reqScopeType}
                  onChange={(e) =>
                    setReqScopeType(e.target.value as "public" | "department" | "branch")
                  }
                  className={inputCls}
                >
                  <option value="public">Public — عام لجميع الموظفين في النظام</option>
                  <option value="department">مخصص لقسم معين</option>
                  <option value="branch">مخصص لفرع معين</option>
                </select>
              </div>

              {reqScopeType !== "public" && (
                <div className="sm:col-span-12">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اختر {reqScopeType === "department" ? "القسم" : "الفرع"} المستهدف:
                  </label>
                  <select
                    value={reqScopeValue}
                    onChange={(e) => setReqScopeValue(e.target.value)}
                    className={inputCls}
                  >
                    {(reqScopeType === "department" ? departments : branches).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 2. التحكم في الحقول والبيانات المطلوبة في الطلب */}
            <div className="rounded-xl border border-slate-200 p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-black text-[#004e82]">
                    2. حدد البيانات والحقول المطلوب من الموظف تعبئتها أو تحديثها في هذا الطلب ({selectedFieldKeys.length} مختار)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    اختر من بيانات النظام (مثل الجوال، الإيميل، العنوان الوطني، بريد السكن، رقم المبنى، الإقامة...) أو أضف بياناً جديداً بالأسفل.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedFieldKeys(allFields.map((f) => f.key))}
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    تحديد الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFieldKeys([])}
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
                  >
                    إلغاء الكل
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                {allFields.map((field) => {
                  const isChecked = selectedFieldKeys.includes(field.key);
                  return (
                    <label
                      key={field.key}
                      className={`flex items-center gap-2 rounded-lg border p-2 text-xs cursor-pointer transition ${
                        isChecked
                          ? "border-[#0070c0] bg-blue-50/70 font-black text-[#004e82]"
                          : "border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFieldKey(field.key)}
                        className="h-4 w-4 rounded accent-[#0070c0]"
                      />
                      <span className="truncate" title={field.label}>
                        {field.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* إضافة بيان / حقل جديد غير موجود في القائمة */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-extrabold text-slate-700">
                  + إضافة بيان جديد للطلب:
                </span>
                <input
                  type="text"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                  placeholder="اكتب اسم البيان (مثال: بيانات الإقامة، رقم الحدود، عنوان الطوارئ...)"
                  className="h-8 flex-1 min-w-[200px] rounded-lg border border-slate-300 px-2.5 text-xs font-semibold"
                />
                <select
                  value={customFieldType}
                  onChange={(e) =>
                    setCustomFieldType(e.target.value as "text" | "date" | "number")
                  }
                  className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold"
                >
                  <option value="text">نص</option>
                  <option value="date">تاريخ</option>
                  <option value="number">رقم</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddQuickCustomField}
                  className="h-8 rounded-lg bg-slate-800 px-3 text-xs font-bold text-white hover:bg-slate-900 cursor-pointer"
                >
                  + أضف للطلب
                </button>
              </div>
            </div>

            {/* 3. خيار سلسلة الموافقة (خياران واضحان فقط كما طلب المستخدم) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black text-slate-900">
                3. هل يخضع هذا الطلب لسلسلة موافقة أم يتحدث مباشرة بإقرار الموظف؟
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* الخيار الأول: لا يخضع لسلسلة موافقة */}
                <div
                  onClick={() => setRequiresApprovalChain(false)}
                  className={`rounded-xl border-2 p-3.5 cursor-pointer transition ${
                    !requiresApprovalChain
                      ? "border-emerald-600 bg-emerald-50/60 shadow-2xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!requiresApprovalChain}
                      onChange={() => setRequiresApprovalChain(false)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span className="text-xs font-black text-emerald-950">
                      لا يخضع لسلسلة موافقة (تحديث مباشر بإقرار الموظف)
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-600 pr-6">
                    عندما يملأ الموظف البيانات ويؤشر على إقرار صحتها، تتحدث البيانات مباشرة في ملفه بالنظام.
                  </p>
                </div>

                {/* الخيار الثاني: يخضع لسلسلة موافقة */}
                <div
                  onClick={() => setRequiresApprovalChain(true)}
                  className={`rounded-xl border-2 p-3.5 cursor-pointer transition ${
                    requiresApprovalChain
                      ? "border-[#0070c0] bg-blue-50/60 shadow-2xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={requiresApprovalChain}
                      onChange={() => setRequiresApprovalChain(true)}
                      className="h-4 w-4 accent-[#0070c0]"
                    />
                    <span className="text-xs font-black text-[#004e82]">
                      يخضع لسلسلة موافقة (مرتبط بسلسلة اعتماد)
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-600 pr-6">
                    بعد أن يملأ الموظف البيانات ويوافق على الإقرار، يمر الطلب على سلسلة الموافقة لاعتماده قبل تحديث النظام.
                  </p>
                </div>
              </div>

              {/* إذا كان يخضع لسلسلة موافقة -> اختيار السلسلة والمدير المباشر */}
              {requiresApprovalChain && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-[#004e82] mb-1">
                      اختر سلسلة / مجموعة الموافقة المرتبطة بالطلب:
                    </label>
                    <select
                      value={selectedApprovalGroupId}
                      onChange={(e) => setSelectedApprovalGroupId(e.target.value)}
                      className={inputCls}
                    >
                      {config.approvalGroups.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#004e82] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowDirectManager}
                        onChange={(e) => setAllowDirectManager(e.target.checked)}
                        className="h-4 w-4 rounded accent-[#0070c0]"
                      />
                      <span>يمر على المدير المباشر للموظف ضمن سلسلة الموافقة</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 4. نص إقرار الموظف */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. نص الإقرار الذي يظهر للموظف للموافقة عليه بعد مراجعة صحة بياناته:
              </label>
              <input
                type="text"
                value={declarationText}
                onChange={(e) => setDeclarationText(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* أزرار الحفظ */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSavePublishedRequest}
                className="flex items-center gap-1.5 rounded-xl bg-[#0070c0] px-5 py-2 text-xs font-black text-white shadow-sm hover:bg-[#005fa3] cursor-pointer"
              >
                <MaterialIcon name="send" size={16} />
                <span>{editingRequestId ? "حفظ تعديلات الطلب" : "حفظ ونشر الطلب للموظفين"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: نافذة تعبئة الطلب كموظف (إدخال البيانات + إقرار الموظف + التسميع بالنظام)
         ===================================================================== */}
      {fillingPublishedReq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          dir="rtl"
        >
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0070c0]">
                  شاشة الموظف لتعبئة الطلب
                </span>
                <h2 className="text-sm font-black text-slate-900 mt-0.5">
                  {fillingPublishedReq.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setFillingPublishedReq(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            {/* اختيار الموظف الذي يقوم بالتعبئة */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الموظف الذي يقوم بتعبئة البيانات:
              </label>
              <select
                value={fillingEmployeeId}
                onChange={(e) => handleChangeFillEmployee(e.target.value)}
                className={inputCls}
              >
                {employees.map((emp: Row) => (
                  <option key={String(emp["id"])} value={String(emp["id"])}>
                    {String(emp["full_name"] || emp["employee_name"] || "موظف")} (#
                    {String(emp["emp_no"] || "—")})
                  </option>
                ))}
              </select>
            </div>

            {/* الحقول المطلوبة في هذا الطلب */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-[#004e82]">
                  البيانات المطلوبة في هذا الطلب ({fillingPublishedReq.fieldKeys.length} حقول):
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    !fillingPublishedReq.requiresApprovalChain
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {!fillingPublishedReq.requiresApprovalChain
                    ? "تحديث مباشر بالنظام فور الإقرار"
                    : "يمر على سلسلة الموافقة بعد الإقرار"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fillingPublishedReq.fieldKeys.map((fk) => {
                  const fDef = allFields.find((f) => f.key === fk);
                  const emp = employees.find((e: Row) => String(e["id"]) === fillingEmployeeId);
                  const oldVal = getEmployeeFieldValue(emp, fk);
                  return (
                    <div key={fk} className="rounded-lg border border-slate-200 bg-white p-2.5">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-extrabold text-slate-800">
                          {fDef?.label || fk}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          الحالي: {oldVal}
                        </span>
                      </div>
                      <input
                        type={
                          fDef?.inputType === "date"
                            ? "date"
                            : fDef?.inputType === "number"
                              ? "number"
                              : "text"
                        }
                        value={fillingValues[fk] ?? ""}
                        onChange={(e) =>
                          setFillingValues((prev) => ({ ...prev, [fk]: e.target.value }))
                        }
                        placeholder={`أدخل ${fDef?.label || fk}...`}
                        className={inputCls}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* إقرار الموظف بصحة البيانات */}
            <label className="flex items-start gap-2.5 rounded-xl border-2 border-emerald-300 bg-emerald-50/70 p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={employeeConfirmedDeclaration}
                onChange={(e) => setEmployeeConfirmedDeclaration(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-emerald-600"
              />
              <div className="text-xs">
                <span className="font-black text-emerald-950 block">
                  إقرار الموظف بصحة البيانات والموافقة على إضافتها في النظام:
                </span>
                <span className="text-[11px] font-semibold text-emerald-800">
                  {fillingPublishedReq.declarationText}
                </span>
              </div>
            </label>

            {/* أزرار الإرسال */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFillingPublishedReq(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isSubmittingFill}
                onClick={handleEmployeeSubmitRequest}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black text-white shadow-sm hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
              >
                <MaterialIcon name="check_circle" size={17} />
                <span>
                  {!fillingPublishedReq.requiresApprovalChain
                    ? "موافق وتحديث البيانات في النظام فوراً (OK)"
                    : "موافق وإرسال الطلب لسلسلة الموافقة (OK)"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: نافذة سلاسل الموافقة المبسطة
         ===================================================================== */}
      {isApprovalChainsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          dir="rtl"
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">
                سلاسل ومجموعات الموافقة المتاحة للربط بالطلبات
              </h2>
              <button
                type="button"
                onClick={() => setIsApprovalChainsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {config.approvalGroups.map((ag) => (
                <div
                  key={ag.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <div className="font-black text-slate-900">
                      {ag.name} ({ag.code})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      المعتمدون: {ag.approvers.map((a) => a.name).join("، ") || "مدير الموارد البشرية"} |{" "}
                      {ag.allowDirectManager ? "يشمل المدير المباشر" : "بدون المدير المباشر"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 space-y-2.5">
              <div className="text-xs font-extrabold text-[#004e82]">+ إضافة سلسلة موافقة جديدة:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newChainName}
                  onChange={(e) => setNewChainName(e.target.value)}
                  placeholder="اسم السلسلة (مثال: لجنة اعتماد شؤون الموظفين)"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={newChainApprover}
                  onChange={(e) => setNewChainApprover(e.target.value)}
                  placeholder="اسم المسؤول المعتمد..."
                  className={inputCls}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newChainDirectManager}
                    onChange={(e) => setNewChainDirectManager(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#0070c0]"
                  />
                  <span>يمر على المدير المباشر أولاً</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddApprovalChain}
                  className="rounded-lg bg-[#0070c0] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#005fa3]"
                >
                  + حفظ السلسلة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
