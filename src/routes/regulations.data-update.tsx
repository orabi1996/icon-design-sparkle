import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, useSaveSettings, useSettings, type Row } from "@/lib/hr-db";
import {
  DATA_UPDATE_FIELDS,
  buildDefaultFieldMap,
  getAllDataUpdateFields,
  loadDataUpdateConfig,
  saveDataUpdateConfigLocal,
  type ApproverUserItem,
  type DataUpdateApprovalGroup,
  type DataUpdateCategory,
  type DataUpdateConfigState,
  type DataUpdateFieldDef,
  type FieldCustomConfigOverride,
  type FieldUpdateMode,
  type UserFieldPermissionGroup,
} from "@/lib/data-update-config";

export const Route = createFileRoute("/regulations/data-update")({
  head: () => ({
    meta: [
      { title: "تهيئة تحديث البيانات | اللوائح" },
      {
        name: "description",
        content:
          "تهيئة وإنشاء حقول تحديث البيانات (تحديث فوري بإقرار الموظف أو مربوط بمجموعات ومراحل موافقة)، وضبط الصلاحيات والمدير المباشر.",
      },
    ],
  }),
  component: DataUpdateRegulationPage,
});

const inputCls =
  "h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-2 focus:ring-[#0070c0]/15";

function DataUpdateRegulationPage() {
  const settingsQuery = useSettings("data_update_config");
  const saveSettings = useSaveSettings("data_update_config");
  const { data: employees = [] } = useRows("employees");

  const [config, setConfig] = useState<DataUpdateConfigState>(() => loadDataUpdateConfig());
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "fields_builder" | "approval_groups" | "allowed_fields"
  >("fields_builder");

  // Selection state in Tab 2 & Tab 3
  const [selectedApprovalGroupId, setSelectedApprovalGroupId] = useState<string>("");
  const [selectedUserGroupId, setSelectedUserGroupId] = useState<string>("");

  // Filter inside Tab 1 (Fields Builder)
  const [fieldModeFilter, setFieldModeFilter] = useState<"all" | "direct" | "approval_required" | "custom">("all");
  const [fieldSearch, setFieldSearch] = useState("");

  // Create New Field Modal / Card state
  const [isCreateFieldOpen, setIsCreateFieldOpen] = useState(false);
  const [newFieldDraft, setNewFieldDraft] = useState<{
    label: string;
    category: DataUpdateCategory;
    inputType: "text" | "select_or_text" | "date" | "number";
    optionsText: string;
    updateMode: FieldUpdateMode;
    linkedApprovalGroupId: string;
    allowDirectManager: boolean;
    requiresAttachment: boolean;
    requiresDeclaration: boolean;
  }>({
    label: "",
    category: "حقول مخصصة لتحديث البيانات",
    inputType: "text",
    optionsText: "",
    updateMode: "direct",
    linkedApprovalGroupId: "ag-hr-main",
    allowDirectManager: true,
    requiresAttachment: false,
    requiresDeclaration: true,
  });

  // Add Approver form inside Approval Groups Tab
  const [selectedEmpIdForApprover, setSelectedEmpIdForApprover] = useState<string>("");
  const [customApproverName, setCustomApproverName] = useState<string>("");
  const [customApproverRole, setCustomApproverRole] = useState<string>("مسؤول اعتماد وتحديث البيانات");
  const [newApproverCanApprove, setNewApproverCanApprove] = useState<boolean>(true);
  const [newApproverCanReply, setNewApproverCanReply] = useState<boolean>(true);

  // Add Approval Group Modal
  const [isAddApprovalGroupOpen, setIsAddApprovalGroupOpen] = useState(false);
  const [newGroupDraft, setNewGroupDraft] = useState({
    name: "",
    description: "",
    targetBranch: "الكل",
    targetDepartment: "الكل",
    allowDirectManager: true,
  });

  // Add User Permission Group Modal
  const [isAddUserGroupOpen, setIsAddUserGroupOpen] = useState(false);
  const [newUserGroupDraft, setNewUserGroupDraft] = useState<{
    name: string;
    description: string;
    scopeType: UserFieldPermissionGroup["scopeType"];
    scopeValue: string;
    linkedApprovalGroupId: string;
  }>({
    name: "",
    description: "",
    scopeType: "all",
    scopeValue: "الكل",
    linkedApprovalGroupId: "ag-hr-main",
  });

  useEffect(() => {
    if (!settingsQuery.isFetched || hydrated) return;
    const loaded = loadDataUpdateConfig(settingsQuery.data?.["config_json"]);
    setConfig(loaded);
    setSelectedApprovalGroupId(loaded.approvalGroups[0]?.id || "");
    setSelectedUserGroupId(loaded.userPermissionGroups[0]?.id || "");
    setHydrated(true);
  }, [hydrated, settingsQuery.data, settingsQuery.isFetched]);

  useEffect(() => {
    if (!selectedApprovalGroupId && config.approvalGroups[0]) {
      setSelectedApprovalGroupId(config.approvalGroups[0].id);
    }
    if (!selectedUserGroupId && config.userPermissionGroups[0]) {
      setSelectedUserGroupId(config.userPermissionGroups[0].id);
    }
  }, [config.approvalGroups, config.userPermissionGroups, selectedApprovalGroupId, selectedUserGroupId]);

  const persistConfig = async (nextConfig: DataUpdateConfigState, successMsg?: string) => {
    setConfig(nextConfig);
    const json = saveDataUpdateConfigLocal(nextConfig);
    try {
      await saveSettings.mutateAsync({ config_json: json });
      if (successMsg) toast.success(successMsg);
    } catch {
      if (successMsg) toast.success(successMsg);
    }
  };

  const allFields = useMemo(() => getAllDataUpdateFields(config), [config]);

  const filteredBuilderFields = useMemo(() => {
    return allFields.filter((f) => {
      if (fieldModeFilter === "direct" && f.updateMode !== "direct") return false;
      if (fieldModeFilter === "approval_required" && f.updateMode !== "approval_required") return false;
      if (fieldModeFilter === "custom" && !f.isCustom) return false;
      if (fieldSearch.trim()) {
        const q = fieldSearch.trim().toLowerCase();
        if (
          !f.label.toLowerCase().includes(q) &&
          !f.key.toLowerCase().includes(q) &&
          !f.category.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allFields, fieldModeFilter, fieldSearch]);

  const directFieldsCount = useMemo(
    () => allFields.filter((f) => f.active !== false && f.updateMode === "direct").length,
    [allFields],
  );
  const approvalFieldsCount = useMemo(
    () => allFields.filter((f) => f.active !== false && f.updateMode === "approval_required").length,
    [allFields],
  );

  const activeApprovalGroup = useMemo(
    () =>
      config.approvalGroups.find((g) => g.id === selectedApprovalGroupId) ||
      config.approvalGroups[0] ||
      null,
    [config.approvalGroups, selectedApprovalGroupId],
  );

  const activeUserGroup = useMemo(
    () =>
      config.userPermissionGroups.find((g) => g.id === selectedUserGroupId) ||
      config.userPermissionGroups[0] ||
      null,
    [config.userPermissionGroups, selectedUserGroupId],
  );

  // Extract unique branches and departments
  const branchOptions = useMemo(() => {
    const set = new Set<string>(["الفرع الرئيسي", "فرع الرياض", "فرع جدة", "فرع الدمام"]);
    employees.forEach((e: Row) => {
      const b = String(e["branch"] || "").trim();
      if (b) set.add(b);
    });
    return Array.from(set);
  }, [employees]);

  const departmentOptions = useMemo(() => {
    const set = new Set<string>([
      "الموارد البشرية",
      "الشؤون الإدارية",
      "الشؤون المالية",
      "تقنية المعلومات",
      "التشغيل",
    ]);
    employees.forEach((e: Row) => {
      const d = String(e["department"] || "").trim();
      if (d) set.add(d);
    });
    return Array.from(set);
  }, [employees]);

  // =========================================================================
  // Handlers for Tab 1: Creating & Configuring Fields + Update Modes
  // =========================================================================
  const handleCreateCustomField = () => {
    const label = newFieldDraft.label.trim();
    if (!label) {
      toast.error("يرجى إدخال اسم الحقل المراد إنشاؤه");
      return;
    }

    const cleanSlug = label
      .replace(/\s+/g, "_")
      .replace(/[^\u0600-\u06FFa-zA-Z0-9_]/g, "")
      .slice(0, 24);
    const key = `custom_${cleanSlug}_${Date.now().toString().slice(-4)}`;

    const defaultOptions =
      newFieldDraft.inputType === "select_or_text" && newFieldDraft.optionsText.trim()
        ? newFieldDraft.optionsText
            .split(/[,،]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newField: DataUpdateFieldDef = {
      key,
      label,
      category: newFieldDraft.category,
      inputType: newFieldDraft.inputType,
      defaultOptions,
      isCoreRequested: true,
      isCustom: true,
      updateMode: newFieldDraft.updateMode,
      linkedApprovalGroupId: newFieldDraft.linkedApprovalGroupId || config.approvalGroups[0]?.id || "ag-hr-main",
      allowDirectManager: newFieldDraft.allowDirectManager,
      requiresAttachment: newFieldDraft.requiresAttachment,
      requiresDeclaration: newFieldDraft.requiresDeclaration,
      active: true,
    };

    const nextFieldConfig: FieldCustomConfigOverride = {
      fieldKey: key,
      label,
      category: newFieldDraft.category,
      inputType: newFieldDraft.inputType,
      defaultOptions,
      updateMode: newFieldDraft.updateMode,
      linkedApprovalGroupId: newField.linkedApprovalGroupId,
      allowDirectManager: newFieldDraft.allowDirectManager,
      requiresAttachment: newFieldDraft.requiresAttachment,
      requiresDeclaration: newFieldDraft.requiresDeclaration,
      active: true,
    };

    // Enable the new field across user permission groups automatically
    const nextUserGroups = config.userPermissionGroups.map((ug) => ({
      ...ug,
      allowedFields: {
        ...ug.allowedFields,
        [key]: {
          fieldKey: key,
          enabled: true,
          requiresAttachment: newFieldDraft.requiresAttachment,
          updateMode: newFieldDraft.updateMode,
          linkedApprovalGroupId: newField.linkedApprovalGroupId,
          allowDirectManager: newFieldDraft.allowDirectManager,
        },
      },
    }));

    const next: DataUpdateConfigState = {
      ...config,
      customFields: [...(config.customFields || []), newField],
      fieldConfigs: {
        ...(config.fieldConfigs || {}),
        [key]: nextFieldConfig,
      },
      userPermissionGroups: nextUserGroups,
    };

    void persistConfig(
      next,
      newFieldDraft.updateMode === "direct"
        ? `تم إنشاء الحقل "${label}" كحقل تحديث مباشر فوري بإقرار الموظف`
        : `تم إنشاء الحقل "${label}" وربطه بمجموعة الموافقة ومراحل الاعتماد`,
    );

    setIsCreateFieldOpen(false);
    setNewFieldDraft({
      label: "",
      category: "حقول مخصصة لتحديث البيانات",
      inputType: "text",
      optionsText: "",
      updateMode: "direct",
      linkedApprovalGroupId: config.approvalGroups[0]?.id || "ag-hr-main",
      allowDirectManager: true,
      requiresAttachment: false,
      requiresDeclaration: true,
    });
  };

  const handleUpdateFieldConfig = (
    field: DataUpdateFieldDef,
    patch: Partial<FieldCustomConfigOverride>,
  ) => {
    const existingOv: FieldCustomConfigOverride = config.fieldConfigs?.[field.key] || {
      fieldKey: field.key,
      label: field.label,
      category: field.category,
      inputType: field.inputType,
      defaultOptions: field.defaultOptions,
      updateMode: field.updateMode || "approval_required",
      linkedApprovalGroupId: field.linkedApprovalGroupId || config.approvalGroups[0]?.id || "ag-hr-main",
      allowDirectManager: field.allowDirectManager ?? true,
      requiresAttachment: Boolean(field.requiresAttachment),
      requiresDeclaration: field.requiresDeclaration ?? true,
      active: field.active ?? true,
    };

    const updatedOv: FieldCustomConfigOverride = {
      ...existingOv,
      ...patch,
    };

    // Sync with userPermissionGroups so all groups reflect the updated mode/approval group
    const nextUserGroups = config.userPermissionGroups.map((ug) => {
      const prevRule = ug.allowedFields[field.key] || {
        fieldKey: field.key,
        enabled: true,
        requiresAttachment: updatedOv.requiresAttachment,
      };
      return {
        ...ug,
        allowedFields: {
          ...ug.allowedFields,
          [field.key]: {
            ...prevRule,
            enabled: patch.active !== undefined ? patch.active : prevRule.enabled,
            requiresAttachment:
              patch.requiresAttachment !== undefined
                ? patch.requiresAttachment
                : prevRule.requiresAttachment,
            updateMode: updatedOv.updateMode,
            linkedApprovalGroupId: updatedOv.linkedApprovalGroupId,
            allowDirectManager: updatedOv.allowDirectManager,
          },
        },
      };
    });

    const nextCustomFields = (config.customFields || []).map((cf) =>
      cf.key === field.key
        ? {
            ...cf,
            updateMode: updatedOv.updateMode,
            linkedApprovalGroupId: updatedOv.linkedApprovalGroupId,
            allowDirectManager: updatedOv.allowDirectManager,
            requiresAttachment: updatedOv.requiresAttachment,
            requiresDeclaration: updatedOv.requiresDeclaration,
            active: updatedOv.active,
          }
        : cf,
    );

    const next: DataUpdateConfigState = {
      ...config,
      customFields: nextCustomFields,
      fieldConfigs: {
        ...(config.fieldConfigs || {}),
        [field.key]: updatedOv,
      },
      userPermissionGroups: nextUserGroups,
    };

    void persistConfig(next);
  };

  const handleDeleteCustomField = (fieldKey: string, label: string) => {
    const nextCustom = (config.customFields || []).filter((cf) => cf.key !== fieldKey);
    const nextConfigs = { ...(config.fieldConfigs || {}) };
    delete nextConfigs[fieldKey];

    const next: DataUpdateConfigState = {
      ...config,
      customFields: nextCustom,
      fieldConfigs: nextConfigs,
    };
    void persistConfig(next, `تم حذف الحقل المخصص "${label}"`);
  };

  // =========================================================================
  // Handlers for Tab 2: Approval Groups
  // =========================================================================
  const handleUpdateApprovalGroup = (
    groupId: string,
    updater: (prev: DataUpdateApprovalGroup) => DataUpdateApprovalGroup,
  ) => {
    const next: DataUpdateConfigState = {
      ...config,
      approvalGroups: config.approvalGroups.map((g) => (g.id === groupId ? updater(g) : g)),
    };
    void persistConfig(next);
  };

  const handleAddApproverToGroup = () => {
    if (!activeApprovalGroup) return;

    let name = customApproverName.trim();
    let empNo = "";
    let jobTitle = "";
    let empId = "";

    if (selectedEmpIdForApprover) {
      const emp = employees.find((e: Row) => String(e["id"]) === selectedEmpIdForApprover);
      if (emp) {
        name = String(emp["full_name"] || emp["employee_name"] || "");
        empNo = String(emp["emp_no"] || "");
        jobTitle = String(emp["job_title"] || "");
        empId = String(emp["id"] || "");
      }
    }

    if (!name) {
      toast.error("يرجى اختيار موظف من القائمة أو كتابة اسم المستخدم المخول بالموافقة/الرد");
      return;
    }

    if (!newApproverCanApprove && !newApproverCanReply) {
      toast.error("يرجى منح المستخدم صلاحية الموافقة أو صلاحية الرد على الأقل");
      return;
    }

    const newItem: ApproverUserItem = {
      id: `ap-${Date.now()}`,
      employeeId: empId || undefined,
      empNo: empNo || undefined,
      name,
      jobTitle: jobTitle || undefined,
      roleLabel: customApproverRole.trim() || "مخول بالموافقة والرد",
      canApprove: newApproverCanApprove,
      canReply: newApproverCanReply,
    };

    handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
      ...prev,
      approvers: [...prev.approvers, newItem],
    }));

    setSelectedEmpIdForApprover("");
    setCustomApproverName("");
    toast.success(`تمت إضافة "${name}" إلى مجموعة الموافقة بنجاح`);
  };

  const handleRemoveApprover = (approverId: string) => {
    if (!activeApprovalGroup) return;
    handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
      ...prev,
      approvers: prev.approvers.filter((a) => a.id !== approverId),
    }));
    toast.success("تم إزالة المستخدم من مجموعة الموافقة");
  };

  const handleCreateApprovalGroup = () => {
    if (!newGroupDraft.name.trim()) {
      toast.error("يرجى إدخال اسم مجموعة الموافقات");
      return;
    }
    const newGroup: DataUpdateApprovalGroup = {
      id: `ag-${Date.now()}`,
      code: `AG-${String(config.approvalGroups.length + 1).padStart(2, "0")}`,
      name: newGroupDraft.name.trim(),
      description: newGroupDraft.description.trim() || "مجموعة موافقات مخصصة لطلبات تحديث البيانات",
      targetBranch: newGroupDraft.targetBranch,
      targetDepartment: newGroupDraft.targetDepartment,
      allowDirectManager: newGroupDraft.allowDirectManager,
      directManagerStageOrder: "first",
      requireAllApprovers: false,
      approvers: [],
      active: true,
    };
    const next: DataUpdateConfigState = {
      ...config,
      approvalGroups: [...config.approvalGroups, newGroup],
    };
    void persistConfig(next, "تم إنشاء مجموعة الموافقات الجديدة بنجاح");
    setSelectedApprovalGroupId(newGroup.id);
    setIsAddApprovalGroupOpen(false);
    setNewGroupDraft({
      name: "",
      description: "",
      targetBranch: "الكل",
      targetDepartment: "الكل",
      allowDirectManager: true,
    });
  };

  const handleDeleteApprovalGroup = (groupId: string) => {
    if (config.approvalGroups.length <= 1) {
      toast.error("يجب الاحتفاظ بمجموعة موافقات واحدة على الأقل في النظام");
      return;
    }
    const nextGroups = config.approvalGroups.filter((g) => g.id !== groupId);
    const next: DataUpdateConfigState = {
      ...config,
      approvalGroups: nextGroups,
    };
    void persistConfig(next, "تم حذف مجموعة الموافقات");
    setSelectedApprovalGroupId(nextGroups[0]?.id || "");
  };

  // =========================================================================
  // Handlers for Tab 3: User Field Permission Groups
  // =========================================================================
  const handleUpdateUserGroup = (
    groupId: string,
    updater: (prev: UserFieldPermissionGroup) => UserFieldPermissionGroup,
  ) => {
    const next: DataUpdateConfigState = {
      ...config,
      userPermissionGroups: config.userPermissionGroups.map((g) => (g.id === groupId ? updater(g) : g)),
    };
    void persistConfig(next);
  };

  const handleToggleField = (fieldKey: string, enabled: boolean) => {
    if (!activeUserGroup) return;
    handleUpdateUserGroup(activeUserGroup.id, (prev) => ({
      ...prev,
      allowedFields: {
        ...prev.allowedFields,
        [fieldKey]: {
          ...prev.allowedFields[fieldKey],
          fieldKey,
          enabled,
          requiresAttachment: prev.allowedFields[fieldKey]?.requiresAttachment ?? false,
        },
      },
    }));
  };

  const handleToggleFieldAttachment = (fieldKey: string, requiresAttachment: boolean) => {
    if (!activeUserGroup) return;
    handleUpdateUserGroup(activeUserGroup.id, (prev) => ({
      ...prev,
      allowedFields: {
        ...prev.allowedFields,
        [fieldKey]: {
          ...prev.allowedFields[fieldKey],
          fieldKey,
          enabled: prev.allowedFields[fieldKey]?.enabled ?? true,
          requiresAttachment,
        },
      },
    }));
  };

  const handleBulkSelectFields = (mode: "core_11" | "all" | "none") => {
    if (!activeUserGroup) return;
    handleUpdateUserGroup(activeUserGroup.id, (prev) => {
      const nextFields = { ...prev.allowedFields };
      for (const f of allFields) {
        const shouldEnable =
          mode === "all" ? true : mode === "core_11" ? Boolean(f.isCoreRequested || f.isCustom) : false;
        nextFields[f.key] = {
          ...prev.allowedFields[f.key],
          fieldKey: f.key,
          enabled: shouldEnable,
          requiresAttachment: prev.allowedFields[f.key]?.requiresAttachment ?? false,
        };
      }
      return { ...prev, allowedFields: nextFields };
    });
    toast.success(
      mode === "core_11"
        ? "تم تفعيل الحقول الأساسية والمخصصة"
        : mode === "all"
          ? "تم تفعيل جميع الحقول"
          : "تم إلغاء تحديد كافة الحقول",
    );
  };

  const handleCreateUserGroup = () => {
    if (!newUserGroupDraft.name.trim()) {
      toast.error("يرجى إدخال اسم مجموعة المستخدمين / الموظفين");
      return;
    }
    const newGroup: UserFieldPermissionGroup = {
      id: `ug-${Date.now()}`,
      code: `UG-${String(config.userPermissionGroups.length + 1).padStart(2, "0")}`,
      name: newUserGroupDraft.name.trim(),
      description:
        newUserGroupDraft.description.trim() || "مجموعة صلاحيات حقول طلب تحديث البيانات",
      scopeType: newUserGroupDraft.scopeType,
      scopeValue: newUserGroupDraft.scopeType === "all" ? "الكل" : newUserGroupDraft.scopeValue,
      specificEmployeeIds: [],
      linkedApprovalGroupId:
        newUserGroupDraft.linkedApprovalGroupId || config.approvalGroups[0]?.id || "ag-hr-main",
      allowDirectManagerOverride: null,
      allowedFields: buildDefaultFieldMap(true, config.customFields),
      active: true,
    };

    const next: DataUpdateConfigState = {
      ...config,
      userPermissionGroups: [...config.userPermissionGroups, newGroup],
    };
    void persistConfig(next, "تمت إضافة مجموعة المستخدمين وصلاحيات الحقول بنجاح");
    setSelectedUserGroupId(newGroup.id);
    setIsAddUserGroupOpen(false);
    setNewUserGroupDraft({
      name: "",
      description: "",
      scopeType: "all",
      scopeValue: "الكل",
      linkedApprovalGroupId: config.approvalGroups[0]?.id || "ag-hr-main",
    });
  };

  const handleDeleteUserGroup = (groupId: string) => {
    if (config.userPermissionGroups.length <= 1) {
      toast.error("يجب الاحتفاظ بمجموعة مستخدمين واحدة على الأقل");
      return;
    }
    const nextGroups = config.userPermissionGroups.filter((g) => g.id !== groupId);
    const next: DataUpdateConfigState = {
      ...config,
      userPermissionGroups: nextGroups,
    };
    void persistConfig(next, "تم حذف مجموعة المستخدمين");
    setSelectedUserGroupId(nextGroups[0]?.id || "");
  };

  const enabledFieldsCount = useMemo(() => {
    if (!activeUserGroup) return 0;
    return allFields.filter((f) => activeUserGroup.allowedFields[f.key]?.enabled).length;
  }, [activeUserGroup, allFields]);

  return (
    <div className="mt-2 space-y-4" dir="rtl">
      <Breadcrumbs trail={["اللوائح", "إعدادات متنوعة", "تهيئة تحديث البيانات"]} />

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0070c0]/10 text-[#0070c0]">
            <MaterialIcon name="manage_accounts" size={26} />
          </div>
          <div>
            <h1 className="text-[16px] font-extrabold text-[#004e82]">
              تهيئة تحديث البيانات وإنشاء الحقول ومسارات الاعتماد
            </h1>
            <p className="text-[12px] text-slate-500">
              إنشاء وتخصيص حقول تحديث البيانات (تحديث فوري بإقرار الموظف أو مربوط بمجموعات ومراحل موافقة) ومتابعة تقرير إنجاز تحديث البيانات
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={"/reports/data-update-completion" as string}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-100"
          >
            <MaterialIcon name="fact_check" size={17} />
            تقرير إنجاز لتحديث البيانات
          </Link>
          <Link
            to="/requests/data-update"
            className="flex items-center gap-1.5 rounded-lg border border-[#0070c0] bg-blue-50/70 px-3.5 py-2 text-xs font-bold text-[#0070c0] transition hover:bg-blue-100"
          >
            <MaterialIcon name="assignment_ind" size={17} />
            شاشة طلبات تحديث البيانات
          </Link>
          <button
            type="button"
            onClick={() => void persistConfig(config, "تم حفظ جميع إعدادات تهيئة تحديث البيانات بنجاح")}
            className="flex items-center gap-1.5 rounded-lg bg-[#0070c0] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#005fa3]"
          >
            <MaterialIcon name="save" size={17} />
            حفظ التهيئة
          </button>
        </div>
      </div>

      {/* Global Controls & Declaration Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <label className="flex items-start gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-3.5 cursor-pointer transition hover:border-emerald-500">
          <input
            type="checkbox"
            checked={config.requireEmployeeDeclaration}
            onChange={(e) => {
              const checked = e.target.checked;
              void persistConfig(
                { ...config, requireEmployeeDeclaration: checked },
                checked
                  ? "تم تفعيل إقرار وتأكيد الموظف على صحة البيانات عند التعبئة"
                  : "تم إيقاف شرط الإقرار عند التعبئة",
              );
            }}
            className="mt-0.5 h-5 w-5 rounded border-emerald-400 accent-emerald-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-emerald-900">
                إظهار قرار/تأكيد صحة البيانات للموظف والضغط على (موافق OK)
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  config.requireEmployeeDeclaration
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {config.requireEmployeeDeclaration ? "مفعّل" : "غير مفعّل"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              يظهر للموظف أثناء تحديث بياناته إقرار بأنه تأكد من صحة البيانات المعبأة بشكل عام، وبمجرد الضغط على موافق (OK) تسمع في النظام والتقارير أو تدخل مراحل الموافقة.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-xl border-2 border-blue-200 bg-blue-50/50 p-3.5 cursor-pointer transition hover:border-[#0070c0]">
          <input
            type="checkbox"
            checked={config.globalAllowDirectManager}
            onChange={(e) => {
              const checked = e.target.checked;
              const next: DataUpdateConfigState = {
                ...config,
                globalAllowDirectManager: checked,
                approvalGroups: config.approvalGroups.map((g) => ({
                  ...g,
                  allowDirectManager: checked,
                })),
              };
              void persistConfig(
                next,
                checked
                  ? "تم تفعيل صلاحية المدير المباشر للموافقة والرد على طلبات تحديث البيانات"
                  : "تم إيقاف صلاحية المدير المباشر للموافقة وحصرها بمجموعات الموافقات",
              );
            }}
            className="mt-0.5 h-5 w-5 rounded border-blue-400 accent-[#0070c0]"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-[#004e82]">
                السماح للمدير المباشر بالموافقة أو الرد في مراحل الاعتماد
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  config.globalAllowDirectManager
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {config.globalAllowDirectManager ? "مفعّل" : "غير مفعّل"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              للحقول المربوطة بمراحل موافقة: يمر الطلب على المدير المباشر للموظف للموافقة أو الرد قبل أو بالتوازي مع مجموعة الموافقات.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-xl border-2 border-sky-200 bg-sky-50/40 p-3.5 cursor-pointer transition hover:border-sky-500">
          <input
            type="checkbox"
            checked={config.autoApplyOnApproval}
            onChange={(e) => {
              const checked = e.target.checked;
              void persistConfig(
                { ...config, autoApplyOnApproval: checked },
                checked
                  ? "تم تفعيل التسميع التلقائي في النظام والتقارير"
                  : "تم إيقاف التحديث التلقائي",
              );
            }}
            className="mt-0.5 h-5 w-5 rounded border-sky-400 accent-sky-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-sky-900">
                تسميع البيانات تلقائياً في النظام وتقرير الإنجاز
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  config.autoApplyOnApproval
                    ? "bg-sky-100 text-sky-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {config.autoApplyOnApproval ? "مفعّل" : "غير مفعّل"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              الحقول المباشرة تسمع فوراً بعد إقرار الموظف، والحقول المربوطة بمجموعة موافقة تسمع فور اكتمال مراحل الموافقة وتظهر في تقرير إنجاز تحديث البيانات.
            </p>
          </div>
        </label>
      </div>

      {/* Main 3 Tabs Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("fields_builder")}
          className={`flex items-center justify-between rounded-xl border-2 p-3.5 text-right transition ${
            activeTab === "fields_builder"
              ? "border-[#0070c0] bg-[#0070c0] text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                activeTab === "fields_builder"
                  ? "bg-white/20 text-white"
                  : "bg-blue-50 text-[#0070c0]"
              }`}
            >
              <MaterialIcon name="add_box" size={22} />
            </span>
            <div>
              <div className="text-xs font-extrabold">
                1. إنشاء الحقول وتحديد آلية التحديث (مباشر / بموافقة)
              </div>
              <div
                className={`text-[11px] ${
                  activeTab === "fields_builder" ? "text-blue-100" : "text-slate-500"
                }`}
              >
                تحديث فوري بإقرار ({directFieldsCount}) · بمراحل موافقة ({approvalFieldsCount})
              </div>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              activeTab === "fields_builder"
                ? "bg-white text-[#0070c0]"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {allFields.length} حقل
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("approval_groups")}
          className={`flex items-center justify-between rounded-xl border-2 p-3.5 text-right transition ${
            activeTab === "approval_groups"
              ? "border-[#0070c0] bg-[#0070c0] text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                activeTab === "approval_groups"
                  ? "bg-white/20 text-white"
                  : "bg-blue-50 text-[#0070c0]"
              }`}
            >
              <MaterialIcon name="verified_user" size={22} />
            </span>
            <div>
              <div className="text-xs font-extrabold">
                2. مجموعات الموافقات والمخولين بالرد والاعتماد
              </div>
              <div
                className={`text-[11px] ${
                  activeTab === "approval_groups" ? "text-blue-100" : "text-slate-500"
                }`}
              >
                إعداد المجموعات التي تُربط بها الحقول الخاضعة للموافقة
              </div>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              activeTab === "approval_groups"
                ? "bg-white text-[#0070c0]"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {config.approvalGroups.length} مجموعات
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("allowed_fields")}
          className={`flex items-center justify-between rounded-xl border-2 p-3.5 text-right transition ${
            activeTab === "allowed_fields"
              ? "border-[#0070c0] bg-[#0070c0] text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-800 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                activeTab === "allowed_fields"
                  ? "bg-white/20 text-white"
                  : "bg-blue-50 text-[#0070c0]"
              }`}
            >
              <MaterialIcon name="tune" size={22} />
            </span>
            <div>
              <div className="text-xs font-extrabold">
                3. مجموعات الموظفين وتخصيص صلاحيات الحقول
              </div>
              <div
                className={`text-[11px] ${
                  activeTab === "allowed_fields" ? "text-blue-100" : "text-slate-500"
                }`}
              >
                تحديد الحقول المتاحة لكل فئة أو قسم أو فرع
              </div>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              activeTab === "allowed_fields"
                ? "bg-white text-[#0070c0]"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {config.userPermissionGroups.length} مجموعات
          </span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: إنشاء الحقول وتحديد آلية التحديث (مباشر بإقرار / بمراحل موافقة)
         ===================================================================== */}
      {activeTab === "fields_builder" && (
        <div className="space-y-4">
          {/* Card: Declaration Statement Configuration */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <MaterialIcon name="gavel" size={19} />
                </span>
                <div>
                  <h2 className="text-xs font-extrabold text-[#004e82]">
                    صيغة إقرار وتأكيد الموظف على صحة البيانات المدخلة
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    النص الذي يظهر للموظف عند تعبئة البيانات ليؤكد صحتها ويضغط على زر (موافق / OK)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  عنوان نافذة الإقرار
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={config.declarationTitle}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, declarationTitle: e.target.value }))
                  }
                  onBlur={() => void persistConfig(config)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  نص قرار تأكيد صحة البيانات التي تم تعبئتها بشكل عام
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={config.declarationText}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, declarationText: e.target.value }))
                  }
                  onBlur={() => void persistConfig(config)}
                />
              </div>
            </div>
          </div>

          {/* Card: Create Fields & Manage All Fields */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#004e82]">
                  إدارة وإنشاء حقول تحديث البيانات وتحديد مسار كل حقل
                </h2>
                <p className="text-[11px] text-slate-500">
                  يمكنك إنشاء حقول جديدة متاحة للموظفين لتحديثها مباشرة بإقرار (تسمع فوراً في النظام وفي تقرير الإنجاز)، أو ربط أي حقل بمجموعة موافقة ليمر بمراحل اعتماد بعد إقرار الموظف.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateFieldOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0070c0] px-4 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#005fa3]"
              >
                <MaterialIcon name={isCreateFieldOpen ? "expand_less" : "add_circle"} size={18} />
                <span>إنشاء حقل جديد لتحديث البيانات</span>
              </button>
            </div>

            {/* Expandable Form: Create a New Field */}
            {isCreateFieldOpen && (
              <div className="rounded-2xl border-2 border-[#0070c0]/30 bg-blue-50/30 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="post_add" size={20} className="text-[#0070c0]" />
                    <span className="text-xs font-extrabold text-[#004e82]">
                      إنشاء وتكوين حقل جديد متاح للموظفين لتحديث البيانات
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateFieldOpen(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <MaterialIcon name="close" size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">
                      مسمى الحقل (يظهر للموظف) *
                    </span>
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="مثال: العنوان الوطني، رقم الآيبان، المؤهل..."
                      value={newFieldDraft.label}
                      onChange={(e) =>
                        setNewFieldDraft((p) => ({ ...p, label: e.target.value }))
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">تصنيف الحقل</span>
                    <select
                      className={inputCls}
                      value={newFieldDraft.category}
                      onChange={(e) =>
                        setNewFieldDraft((p) => ({
                          ...p,
                          category: e.target.value as DataUpdateCategory,
                        }))
                      }
                    >
                      <option value="حقول مخصصة لتحديث البيانات">حقول مخصصة لتحديث البيانات</option>
                      <option value="البيانات الشخصية والهوية">البيانات الشخصية والهوية</option>
                      <option value="البيانات الوظيفية والتنظيمية">البيانات الوظيفية والتنظيمية</option>
                      <option value="بيانات التواصل والبنك">بيانات التواصل والبنك</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">نوع الإدخال</span>
                    <select
                      className={inputCls}
                      value={newFieldDraft.inputType}
                      onChange={(e) =>
                        setNewFieldDraft((p) => ({
                          ...p,
                          inputType: e.target.value as "text" | "select_or_text" | "date" | "number",
                        }))
                      }
                    >
                      <option value="text">نص حر (Text)</option>
                      <option value="select_or_text">قائمة خيارات منسدلة (Dropdown)</option>
                      <option value="date">تاريخ (Date)</option>
                      <option value="number">رقم (Number)</option>
                    </select>
                  </label>

                  {newFieldDraft.inputType === "select_or_text" ? (
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-700">
                        خيارات القائمة (مفصولة بفاصلة ،)
                      </span>
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="مثال: خيار 1، خيار 2، خيار 3"
                        value={newFieldDraft.optionsText}
                        onChange={(e) =>
                          setNewFieldDraft((p) => ({ ...p, optionsText: e.target.value }))
                        }
                      />
                    </label>
                  ) : (
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newFieldDraft.requiresAttachment}
                          onChange={(e) =>
                            setNewFieldDraft((p) => ({
                              ...p,
                              requiresAttachment: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded accent-[#0070c0]"
                        />
                        <span>يتطلب إرفاق مستند إثبات</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Choosing Update Mode: Direct vs Linked to Approval Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div
                    onClick={() =>
                      setNewFieldDraft((p) => ({ ...p, updateMode: "direct" }))
                    }
                    className={`rounded-xl border-2 p-3.5 cursor-pointer transition ${
                      newFieldDraft.updateMode === "direct"
                        ? "border-emerald-600 bg-emerald-50/70 shadow-2xs"
                        : "border-slate-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={newFieldDraft.updateMode === "direct"}
                        onChange={() =>
                          setNewFieldDraft((p) => ({ ...p, updateMode: "direct" }))
                        }
                        className="h-4 w-4 accent-emerald-600"
                      />
                      <span className="text-xs font-extrabold text-emerald-900">
                        الخيار (1): متاح للتحديث المباشر الفوري بإقرار الموظف (بدون انتظار موافقات)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 mr-6">
                      يقوم الموظف بتعبئة الحقل، ويظهر له قرار تأكيد صحة البيانات ويضغط (موافق OK)، فتسمع البيانات فوراً في النظام وفي تقرير إنجاز تحديث البيانات.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      setNewFieldDraft((p) => ({ ...p, updateMode: "approval_required" }))
                    }
                    className={`rounded-xl border-2 p-3.5 cursor-pointer transition ${
                      newFieldDraft.updateMode === "approval_required"
                        ? "border-[#0070c0] bg-blue-50/70 shadow-2xs"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={newFieldDraft.updateMode === "approval_required"}
                        onChange={() =>
                          setNewFieldDraft((p) => ({ ...p, updateMode: "approval_required" }))
                        }
                        className="h-4 w-4 accent-[#0070c0]"
                      />
                      <span className="text-xs font-extrabold text-[#004e82]">
                        الخيار (2): مربوط بمجموعة موافقة ويمر على مراحل اعتماد بعد إقرار الموظف
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 mr-6">
                      بعد تعبئة الموظف للبيانات وتأكيد الإقرار (OK)، يمر الطلب على مراحل الموافقة (المدير المباشر ومجموعة الموافقة المختارة) ليُعتمد ثم يسمع في النظام.
                    </p>

                    {newFieldDraft.updateMode === "approval_required" && (
                      <div
                        className="mt-3 mr-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-blue-200 pt-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-[#004e82]">
                            ربط بمجموعة الموافقة المختصة:
                          </span>
                          <select
                            className="h-8 rounded-lg border border-blue-300 bg-white px-2 text-[11px] font-bold text-slate-800"
                            value={newFieldDraft.linkedApprovalGroupId}
                            onChange={(e) =>
                              setNewFieldDraft((p) => ({
                                ...p,
                                linkedApprovalGroupId: e.target.value,
                              }))
                            }
                          >
                            {config.approvalGroups.map((ag) => (
                              <option key={ag.id} value={ag.id}>
                                {ag.name} ({ag.code})
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="flex items-center gap-2 text-[11px] font-bold text-[#004e82] pt-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newFieldDraft.allowDirectManager}
                            onChange={(e) =>
                              setNewFieldDraft((p) => ({
                                ...p,
                                allowDirectManager: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded accent-[#0070c0]"
                          />
                          <span>يمر على المدير المباشر كمرحلة موافقة</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-blue-200/60 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateFieldOpen(false)}
                    className="rounded-lg bg-white border border-slate-300 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCustomField}
                    className="flex items-center gap-1.5 rounded-lg bg-[#0070c0] px-5 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-[#005fa3]"
                  >
                    <MaterialIcon name="check_circle" size={16} />
                    <span>حفظ وإدراج الحقل في النظام</span>
                  </button>
                </div>
              </div>
            )}

            {/* Filter Bar for Fields */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: "all", label: `جميع الحقول (${allFields.length})` },
                  {
                    key: "direct",
                    label: `تحديث مباشر بإقرار الموظف (${directFieldsCount})`,
                  },
                  {
                    key: "approval_required",
                    label: `مربوط بمجموعة ومراحل موافقة (${approvalFieldsCount})`,
                  },
                  {
                    key: "custom",
                    label: `الحقول المخصصة المضافة (${(config.customFields || []).length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFieldModeFilter(tab.key as any)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                      fieldModeFilter === tab.key
                        ? "bg-[#0070c0] text-white shadow-2xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="بحث باسم الحقل أو التصنيف..."
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Fields Table / Cards with Instant Mode & Approval Group Controls */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">الحقل ومربوط بـ</th>
                    <th className="px-3 py-2.5">التصنيف والنوع</th>
                    <th className="px-3 py-2.5">آلية التحديث عند تأكيد الموظف (OK)</th>
                    <th className="px-3 py-2.5">مجموعة الموافقة ومراحل الاعتماد</th>
                    <th className="px-3 py-2.5 text-center">إقرار الموظف</th>
                    <th className="px-3 py-2.5 text-center">المرفق</th>
                    <th className="px-3 py-2.5 text-center">الحالة / إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBuilderFields.map((field) => {
                    const isDirect = field.updateMode === "direct";
                    const isActive = field.active !== false;
                    return (
                      <tr
                        key={field.key}
                        className={`transition ${
                          !isActive
                            ? "bg-slate-50/60 opacity-60"
                            : isDirect
                              ? "bg-emerald-50/20 hover:bg-emerald-50/40"
                              : "bg-white hover:bg-blue-50/30"
                        }`}
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={(e) =>
                                handleUpdateFieldConfig(field, { active: e.target.checked })
                              }
                              className="h-4 w-4 rounded accent-[#0070c0]"
                            />
                            <div>
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>{field.label}</span>
                                {field.isCustom && (
                                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-black text-purple-800">
                                    حقل مخصص
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {field.key}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-semibold text-slate-700">{field.category}</div>
                          <div className="text-[10px] text-slate-500">
                            {field.inputType === "select_or_text"
                              ? "قائمة خيارات / نص"
                              : field.inputType === "date"
                                ? "تاريخ"
                                : field.inputType === "number"
                                  ? "رقمي"
                                  : "نص حر"}
                          </div>
                        </td>

                        {/* Switch Update Mode: Direct vs Approval Required */}
                        <td className="px-3 py-3">
                          <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateFieldConfig(field, { updateMode: "direct" })
                              }
                              className={`rounded-md px-2.5 py-1 text-[11px] font-extrabold transition ${
                                isDirect
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              تحديث مباشر فوري بإقرار
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateFieldConfig(field, {
                                  updateMode: "approval_required",
                                })
                              }
                              className={`rounded-md px-2.5 py-1 text-[11px] font-extrabold transition ${
                                !isDirect
                                  ? "bg-[#0070c0] text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              مربوط بمراحل موافقة
                            </button>
                          </div>
                        </td>

                        {/* Approval Group & Direct Manager Configuration */}
                        <td className="px-3 py-3">
                          {isDirect ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800">
                              <MaterialIcon name="bolt" size={14} />
                              يسمع فوراً في النظام والتقارير بعد ضغط الموظف (OK)
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1.5 max-w-xs">
                              <select
                                value={
                                  field.linkedApprovalGroupId ||
                                  config.approvalGroups[0]?.id ||
                                  "ag-hr-main"
                                }
                                onChange={(e) =>
                                  handleUpdateFieldConfig(field, {
                                    linkedApprovalGroupId: e.target.value,
                                  })
                                }
                                className="h-7 rounded border border-blue-300 bg-white px-2 text-[11px] font-bold text-[#004e82]"
                              >
                                {config.approvalGroups.map((ag) => (
                                  <option key={ag.id} value={ag.id}>
                                    {ag.name}
                                  </option>
                                ))}
                              </select>
                              <label className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.allowDirectManager !== false}
                                  onChange={(e) =>
                                    handleUpdateFieldConfig(field, {
                                      allowDirectManager: e.target.checked,
                                    })
                                  }
                                  className="h-3.5 w-3.5 rounded accent-[#0070c0]"
                                />
                                <span>مرحلة موافقة المدير المباشر أولاً</span>
                              </label>
                            </div>
                          )}
                        </td>

                        {/* Declaration Required */}
                        <td className="px-3 py-3 text-center">
                          <label className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.requiresDeclaration !== false}
                              onChange={(e) =>
                                handleUpdateFieldConfig(field, {
                                  requiresDeclaration: e.target.checked,
                                })
                              }
                              className="h-4 w-4 rounded accent-emerald-600"
                            />
                            <span>إقرار + OK</span>
                          </label>
                        </td>

                        {/* Attachment Required */}
                        <td className="px-3 py-3 text-center">
                          <label className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(field.requiresAttachment)}
                              onChange={(e) =>
                                handleUpdateFieldConfig(field, {
                                  requiresAttachment: e.target.checked,
                                })
                              }
                              className="h-4 w-4 rounded accent-amber-600"
                            />
                            <span>مرفق</span>
                          </label>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 text-center">
                          {field.isCustom ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomField(field.key, field.label)}
                              className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                            >
                              <MaterialIcon name="delete" size={14} />
                              حذف
                            </button>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400">
                              حقل نظام أساسي
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: مجموعات الموافقات واختيار المستخدمين المخولين بالموافقة أو الرد
         ===================================================================== */}
      {activeTab === "approval_groups" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Sidebar: List of Approval Groups */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold text-[#004e82]">مجموعات الموافقات</h2>
                <button
                  type="button"
                  onClick={() => setIsAddApprovalGroupOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-[#0070c0] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#005fa3]"
                >
                  <MaterialIcon name="add" size={15} />
                  إضافة مجموعة
                </button>
              </div>

              <div className="space-y-2">
                {config.approvalGroups.map((group) => {
                  const isSelected = activeApprovalGroup?.id === group.id;
                  return (
                    <div
                      key={group.id}
                      onClick={() => setSelectedApprovalGroupId(group.id)}
                      className={`rounded-xl border p-3 cursor-pointer transition ${
                        isSelected
                          ? "border-[#0070c0] bg-blue-50/70 shadow-2xs"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">
                          {group.name}
                        </span>
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                          {group.code}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                        {group.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-[#004e82]">
                          {group.approvers.length} مستخدم مخول
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 font-bold ${
                            group.allowDirectManager
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {group.allowDirectManager
                            ? "المدير المباشر: يوافق/يرد ✓"
                            : "بدون المدير المباشر"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detail Panel: Active Approval Group */}
          <div className="lg:col-span-8 space-y-4">
            {activeApprovalGroup && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-[#0070c0]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#0070c0]">
                        {activeApprovalGroup.code}
                      </span>
                      <h3 className="text-base font-extrabold text-[#004e82]">
                        {activeApprovalGroup.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeApprovalGroup.description}
                    </p>
                  </div>

                  {config.approvalGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteApprovalGroup(activeApprovalGroup.id)}
                      className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <MaterialIcon name="delete" size={15} />
                      حذف المجموعة
                    </button>
                  )}
                </div>

                {/* Group Basic Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-600">اسم مجموعة الموافقات</span>
                    <input
                      type="text"
                      className={inputCls}
                      value={activeApprovalGroup.name}
                      onChange={(e) =>
                        handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-600">نطاق الفرع</span>
                    <select
                      className={inputCls}
                      value={activeApprovalGroup.targetBranch}
                      onChange={(e) =>
                        handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
                          ...prev,
                          targetBranch: e.target.value,
                        }))
                      }
                    >
                      <option value="الكل">جميع الفروع (الكل)</option>
                      {branchOptions.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-600">نطاق القسم</span>
                    <select
                      className={inputCls}
                      value={activeApprovalGroup.targetDepartment}
                      onChange={(e) =>
                        handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
                          ...prev,
                          targetDepartment: e.target.value,
                        }))
                      }
                    >
                      <option value="الكل">جميع الأقسام (الكل)</option>
                      {departmentOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Direct Manager Checkbox inside the Approval Group */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeApprovalGroup.allowDirectManager}
                        onChange={(e) =>
                          handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
                            ...prev,
                            allowDirectManager: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-blue-400 accent-[#0070c0]"
                      />
                      <div>
                        <span className="text-xs font-extrabold text-[#004e82] block">
                          تمكين المدير المباشر من الموافقة والرد ضمن هذه المجموعة
                        </span>
                        <span className="text-[11px] text-slate-600">
                          يسمح للمدير المباشر للموظف صاحب الطلب بالموافقة المبدئية أو النهائية وإضافة رد مباشر على الطلب
                        </span>
                      </div>
                    </label>

                    {activeApprovalGroup.allowDirectManager && (
                      <select
                        className="h-8 rounded-lg border border-blue-300 bg-white px-2.5 text-[11px] font-bold text-[#004e82]"
                        value={activeApprovalGroup.directManagerStageOrder}
                        onChange={(e) =>
                          handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
                            ...prev,
                            directManagerStageOrder: e.target.value as DataUpdateApprovalGroup["directManagerStageOrder"],
                          }))
                        }
                      >
                        <option value="first">المرحلة 1: المدير المباشر أولاً ثم مجموعة الموافقات</option>
                        <option value="parallel">بالتوازي: المدير المباشر أو أي عضو في المجموعة</option>
                        <option value="only_if_no_group">المدير المباشر يكفي للاعتماد المباشر</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Choosing Users who have permission to Approve or Reply */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <MaterialIcon name="person_check" size={18} className="text-[#0070c0]" />
                      المستخدمون المخولون بالموافقة أو الرد على طلبات التحديث ({activeApprovalGroup.approvers.length})
                    </h4>
                  </div>

                  {/* Add User / Approver Form */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                    <div className="text-[11px] font-bold text-slate-700">
                      إضافة مستخدم جديد له صلاحية الموافقة أو الرد:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <select
                        className={inputCls}
                        value={selectedEmpIdForApprover}
                        onChange={(e) => {
                          setSelectedEmpIdForApprover(e.target.value);
                          if (e.target.value) setCustomApproverName("");
                        }}
                      >
                        <option value="">-- اختر موظفاً من النظام --</option>
                        {employees.map((emp: Row) => (
                          <option key={String(emp["id"])} value={String(emp["id"])}>
                            {String(emp["full_name"] || emp["employee_name"] || "")} (
                            {String(emp["emp_no"] || "بدون رقم")})
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        className={inputCls}
                        placeholder="أو اكتب اسم المستخدم/المسؤول يدوياً..."
                        value={customApproverName}
                        onChange={(e) => {
                          setCustomApproverName(e.target.value);
                          if (e.target.value) setSelectedEmpIdForApprover("");
                        }}
                      />

                      <input
                        type="text"
                        className={inputCls}
                        placeholder="الصفة / الدور (مثال: مدير الموارد البشرية)"
                        value={customApproverRole}
                        onChange={(e) => setCustomApproverRole(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newApproverCanApprove}
                            onChange={(e) => setNewApproverCanApprove(e.target.checked)}
                            className="h-4 w-4 rounded accent-emerald-600"
                          />
                          صلاحية الموافقة والرفض (Approve / Reject)
                        </label>

                        <label className="flex items-center gap-1.5 text-xs font-bold text-[#004e82] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newApproverCanReply}
                            onChange={(e) => setNewApproverCanReply(e.target.checked)}
                            className="h-4 w-4 rounded accent-[#0070c0]"
                          />
                          صلاحية الرد وإضافة الملاحظات (Reply)
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddApproverToGroup}
                        className="flex items-center gap-1 rounded-lg bg-[#0070c0] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#005fa3]"
                      >
                        <MaterialIcon name="person_add" size={16} />
                        إضافة للمجموعة
                      </button>
                    </div>
                  </div>

                  {/* Table of Approvers */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="px-3 py-2.5">اسم المستخدم المخول</th>
                          <th className="px-3 py-2.5">الدور / المسمى</th>
                          <th className="px-3 py-2.5 text-center">صلاحية الموافقة</th>
                          <th className="px-3 py-2.5 text-center">صلاحية الرد</th>
                          <th className="px-3 py-2.5 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeApprovalGroup.approvers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              لا يوجد مستخدمون مضافون في هذه المجموعة بعد — أضف مستخدماً من النموذج أعلاه
                            </td>
                          </tr>
                        ) : (
                          activeApprovalGroup.approvers.map((ap) => (
                            <tr key={ap.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2.5 font-extrabold text-slate-900">
                                {ap.name}
                                {ap.empNo && (
                                  <span className="mr-1.5 font-mono text-[10px] text-slate-500">
                                    (#{ap.empNo})
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600">
                                {ap.roleLabel}
                                {ap.jobTitle ? ` — ${ap.jobTitle}` : ""}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={ap.canApprove}
                                  onChange={(e) =>
                                    handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
                                      ...prev,
                                      approvers: prev.approvers.map((item) =>
                                        item.id === ap.id
                                          ? { ...item, canApprove: e.target.checked }
                                          : item,
                                      ),
                                    }))
                                  }
                                  className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={ap.canReply}
                                  onChange={(e) =>
                                    handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
                                      ...prev,
                                      approvers: prev.approvers.map((item) =>
                                        item.id === ap.id
                                          ? { ...item, canReply: e.target.checked }
                                          : item,
                                      ),
                                    }))
                                  }
                                  className="h-4 w-4 rounded accent-[#0070c0] cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveApprover(ap.id)}
                                  className="text-rose-600 hover:text-rose-800"
                                  title="حذف المستخدم"
                                >
                                  <MaterialIcon name="delete_outline" size={17} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: مجموعات الموظفين والحقول المسموح بطلب تعديلها
         ===================================================================== */}
      {activeTab === "allowed_fields" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Sidebar: User Groups */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold text-[#004e82]">
                  مجموعات المستخدمين / الموظفين
                </h2>
                <button
                  type="button"
                  onClick={() => setIsAddUserGroupOpen(true)}
                  className="flex items-center gap-1 rounded-lg bg-[#0070c0] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#005fa3]"
                >
                  <MaterialIcon name="add" size={15} />
                  مجموعة جديدة
                </button>
              </div>

              <div className="space-y-2">
                {config.userPermissionGroups.map((ug) => {
                  const isSelected = activeUserGroup?.id === ug.id;
                  const count = allFields.filter((f) => ug.allowedFields[f.key]?.enabled).length;
                  const linkedGroup = config.approvalGroups.find(
                    (ag) => ag.id === ug.linkedApprovalGroupId,
                  );

                  return (
                    <div
                      key={ug.id}
                      onClick={() => setSelectedUserGroupId(ug.id)}
                      className={`rounded-xl border p-3 cursor-pointer transition ${
                        isSelected
                          ? "border-[#0070c0] bg-blue-50/70 shadow-2xs"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">{ug.name}</span>
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                          {ug.code}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">{ug.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                          {count} حقل متاح للتعديل
                        </span>
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-[#004e82]">
                          النطاق: {ug.scopeValue || "الكل"}
                        </span>
                        {linkedGroup && (
                          <span className="rounded-md bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">
                            الاعتماد: {linkedGroup.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Area: Checkboxes for Allowed Fields */}
          <div className="lg:col-span-8 space-y-4">
            {activeUserGroup && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-[#0070c0]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#0070c0]">
                        {activeUserGroup.code}
                      </span>
                      <h3 className="text-base font-extrabold text-[#004e82]">
                        {activeUserGroup.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      حدد الحقول التي يحق لموظفي هذه المجموعة تحديثها أو إرسال طلب بتعديلها ({enabledFieldsCount} من {allFields.length} مفعّل)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBulkSelectFields("core_11")}
                      className="rounded-lg border border-[#0070c0] bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-[#0070c0] hover:bg-blue-100"
                    >
                      تحديد الحقول الأساسية والمخصصة
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSelectFields("all")}
                      className="rounded-lg border border-emerald-600 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      تحديد الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSelectFields("none")}
                      className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                    >
                      إلغاء الكل
                    </button>
                    {config.userPermissionGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUserGroup(activeUserGroup.id)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                      >
                        حذف المجموعة
                      </button>
                    )}
                  </div>
                </div>

                {/* Group Scope & Approval Link */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-600">نوع نطاق الموظفين</span>
                    <select
                      className={inputCls}
                      value={activeUserGroup.scopeType}
                      onChange={(e) => {
                        const st = e.target.value as UserFieldPermissionGroup["scopeType"];
                        handleUpdateUserGroup(activeUserGroup.id, (prev) => ({
                          ...prev,
                          scopeType: st,
                          scopeValue: st === "all" ? "الكل" : prev.scopeValue,
                        }));
                      }}
                    >
                      <option value="all">جميع الموظفين في النظام</option>
                      <option value="department">حسب القسم</option>
                      <option value="branch">حسب الفرع</option>
                      <option value="category">حسب الفئة الوظيفية</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-600">قيمة النطاق المستهدف</span>
                    {activeUserGroup.scopeType === "all" ? (
                      <input type="text" className={inputCls} value="جميع الموظفين (الكل)" disabled />
                    ) : activeUserGroup.scopeType === "department" ? (
                      <select
                        className={inputCls}
                        value={activeUserGroup.scopeValue}
                        onChange={(e) =>
                          handleUpdateUserGroup(activeUserGroup.id, (prev) => ({
                            ...prev,
                            scopeValue: e.target.value,
                          }))
                        }
                      >
                        {departmentOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    ) : activeUserGroup.scopeType === "branch" ? (
                      <select
                        className={inputCls}
                        value={activeUserGroup.scopeValue}
                        onChange={(e) =>
                          handleUpdateUserGroup(activeUserGroup.id, (prev) => ({
                            ...prev,
                            scopeValue: e.target.value,
                          }))
                        }
                      >
                        {branchOptions.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="أدخل الفئة الوظيفية (مثال: إداري / تعليمي)..."
                        value={activeUserGroup.scopeValue}
                        onChange={(e) =>
                          handleUpdateUserGroup(activeUserGroup.id, (prev) => ({
                            ...prev,
                            scopeValue: e.target.value,
                          }))
                        }
                      />
                    )}
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-600">
                      مجموعة الموافقات الافتراضية للمجموعة
                    </span>
                    <select
                      className={inputCls}
                      value={activeUserGroup.linkedApprovalGroupId}
                      onChange={(e) =>
                        handleUpdateUserGroup(activeUserGroup.id, (prev) => ({
                          ...prev,
                          linkedApprovalGroupId: e.target.value,
                        }))
                      }
                    >
                      {config.approvalGroups.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.code})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Grid of All Fields */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-[#004e82] flex items-center gap-1.5">
                      <MaterialIcon name="check_circle" size={18} className="text-[#0070c0]" />
                      الحقول المتاحة للموظفين في هذه المجموعة:
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {allFields.map((field) => {
                      const rule = activeUserGroup.allowedFields[field.key] || {
                        fieldKey: field.key,
                        enabled: false,
                        requiresAttachment: false,
                      };
                      const isDirect = field.updateMode === "direct";
                      return (
                        <div
                          key={field.key}
                          className={`rounded-xl border-2 p-3 transition ${
                            rule.enabled
                              ? isDirect
                                ? "border-emerald-500 bg-emerald-50/40 shadow-2xs"
                                : "border-[#0070c0] bg-blue-50/40 shadow-2xs"
                              : "border-slate-200 bg-slate-50/60 opacity-75"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={(e) => handleToggleField(field.key, e.target.checked)}
                                className="h-4 w-4 rounded accent-[#0070c0]"
                              />
                              <div>
                                <span className="text-xs font-extrabold text-slate-900 block">
                                  {field.label}
                                </span>
                                <span className="text-[10px] text-slate-500">{field.category}</span>
                              </div>
                            </label>

                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                isDirect
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-[#004e82]"
                              }`}
                            >
                              {isDirect ? "تحديث مباشر" : "بمراحل موافقة"}
                            </span>
                          </div>

                          {rule.enabled && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rule.requiresAttachment}
                                  onChange={(e) =>
                                    handleToggleFieldAttachment(field.key, e.target.checked)
                                  }
                                  className="h-3.5 w-3.5 rounded accent-amber-600"
                                />
                                إلزامية إرفاق مستند إثبات
                              </label>
                              {rule.requiresAttachment && (
                                <span className="text-[9px] font-bold text-amber-700">
                                  مرفق إلزامي *
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Approval Group */}
      {isAddApprovalGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="text-sm font-extrabold text-[#004e82]">
                إضافة مجموعة موافقات جديدة
              </h3>
              <button
                type="button"
                onClick={() => setIsAddApprovalGroupOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <MaterialIcon name="close" size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">اسم المجموعة *</span>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="مثال: لجنة اعتماد تحديث البيانات الوظيفية"
                  value={newGroupDraft.name}
                  onChange={(e) => setNewGroupDraft((p) => ({ ...p, name: e.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">الوصف</span>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="وصف مختصر لاختصاص المجموعة..."
                  value={newGroupDraft.description}
                  onChange={(e) =>
                    setNewGroupDraft((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-[#004e82] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newGroupDraft.allowDirectManager}
                  onChange={(e) =>
                    setNewGroupDraft((p) => ({ ...p, allowDirectManager: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-[#0070c0]"
                />
                تمكين المدير المباشر من الموافقة والرد
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsAddApprovalGroupOpen(false)}
                className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateApprovalGroup}
                className="rounded-lg bg-[#0070c0] px-4 py-1.5 text-xs font-bold text-white"
              >
                حفظ المجموعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add User Permission Group */}
      {isAddUserGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="text-sm font-extrabold text-[#004e82]">
                إضافة مجموعة مستخدمين / موظفين جديدة
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserGroupOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <MaterialIcon name="close" size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">اسم مجموعة الموظفين *</span>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="مثال: موظفو الفروع التشغيلية"
                  value={newUserGroupDraft.name}
                  onChange={(e) => setNewUserGroupDraft((p) => ({ ...p, name: e.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">نطاق التطبيق</span>
                <select
                  className={inputCls}
                  value={newUserGroupDraft.scopeType}
                  onChange={(e) =>
                    setNewUserGroupDraft((p) => ({
                      ...p,
                      scopeType: e.target.value as UserFieldPermissionGroup["scopeType"],
                    }))
                  }
                >
                  <option value="all">الكل</option>
                  <option value="department">قسم محدد</option>
                  <option value="branch">فرع محدد</option>
                  <option value="category">فئة وظيفية</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">مجموعة الموافقات المرتبطة</span>
                <select
                  className={inputCls}
                  value={newUserGroupDraft.linkedApprovalGroupId}
                  onChange={(e) =>
                    setNewUserGroupDraft((p) => ({
                      ...p,
                      linkedApprovalGroupId: e.target.value,
                    }))
                  }
                >
                  {config.approvalGroups.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsAddUserGroupOpen(false)}
                className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateUserGroup}
                className="rounded-lg bg-[#0070c0] px-4 py-1.5 text-xs font-bold text-white"
              >
                إضافة المجموعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
