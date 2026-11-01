import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, useSaveSettings, useSettings, type Row } from "@/lib/hr-db";
import {
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

type ConfigTabKey =
  | "direct_fields"
  | "approval_fields"
  | "approval_groups"
  | "employee_groups";

function DataUpdateRegulationPage() {
  const settingsQuery = useSettings("data_update_config");
  const saveSettings = useSaveSettings("data_update_config");
  const { data: employees = [] } = useRows("employees");

  const [config, setConfig] = useState<DataUpdateConfigState>(() => loadDataUpdateConfig());
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<ConfigTabKey>("direct_fields");

  // Selection state in Tab 3 & Tab 4
  const [selectedApprovalGroupId, setSelectedApprovalGroupId] = useState<string>("");
  const [selectedUserGroupId, setSelectedUserGroupId] = useState<string>("");

  // Search & category filter for tables
  const [fieldSearch, setFieldSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [quickConvertFieldKey, setQuickConvertFieldKey] = useState<string>("");

  // Draft for creating a new field (used in Tab 1 for Direct, Tab 2 for Approval-linked)
  const [newFieldDraft, setNewFieldDraft] = useState<{
    label: string;
    category: DataUpdateCategory;
    inputType: "text" | "select_or_text" | "date" | "number";
    optionsText: string;
    linkedApprovalGroupId: string;
    allowDirectManager: boolean;
    requiresAttachment: boolean;
    requiresDeclaration: boolean;
  }>({
    label: "",
    category: "حقول مخصصة لتحديث البيانات",
    inputType: "text",
    optionsText: "",
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

  const directFields = useMemo(
    () =>
      allFields.filter((f) => {
        if (f.updateMode !== "direct") return false;
        if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
        if (fieldSearch.trim()) {
          const q = fieldSearch.trim().toLowerCase();
          return f.label.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
        }
        return true;
      }),
    [allFields, categoryFilter, fieldSearch],
  );

  const approvalFields = useMemo(
    () =>
      allFields.filter((f) => {
        if (f.updateMode !== "approval_required") return false;
        if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
        if (fieldSearch.trim()) {
          const q = fieldSearch.trim().toLowerCase();
          return f.label.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
        }
        return true;
      }),
    [allFields, categoryFilter, fieldSearch],
  );

  const totalDirectCount = useMemo(
    () => allFields.filter((f) => f.updateMode === "direct").length,
    [allFields],
  );
  const totalApprovalCount = useMemo(
    () => allFields.filter((f) => f.updateMode === "approval_required").length,
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
  // Create & Update Field Handlers
  // =========================================================================
  const handleCreateCustomField = (targetMode: FieldUpdateMode) => {
    const label = newFieldDraft.label.trim();
    if (!label) {
      toast.error("يرجى إدخال مسمى الحقل الجديد أولاً");
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

    const approvalGroupId =
      newFieldDraft.linkedApprovalGroupId || config.approvalGroups[0]?.id || "ag-hr-main";

    const newField: DataUpdateFieldDef = {
      key,
      label,
      category: newFieldDraft.category,
      inputType: newFieldDraft.inputType,
      defaultOptions,
      isCoreRequested: true,
      isCustom: true,
      updateMode: targetMode,
      linkedApprovalGroupId: approvalGroupId,
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
      updateMode: targetMode,
      linkedApprovalGroupId: approvalGroupId,
      allowDirectManager: newFieldDraft.allowDirectManager,
      requiresAttachment: newFieldDraft.requiresAttachment,
      requiresDeclaration: newFieldDraft.requiresDeclaration,
      active: true,
    };

    const nextUserGroups = config.userPermissionGroups.map((ug) => ({
      ...ug,
      allowedFields: {
        ...ug.allowedFields,
        [key]: {
          fieldKey: key,
          enabled: true,
          requiresAttachment: newFieldDraft.requiresAttachment,
          updateMode: targetMode,
          linkedApprovalGroupId: approvalGroupId,
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
      targetMode === "direct"
        ? `تم إنشاء الحقل "${label}" وإضافته إلى حقول التحديث المباشر بإقرار الموظف (OK)`
        : `تم إنشاء الحقل "${label}" وربطه بمجموعة الموافقة ومراحل الاعتماد`,
    );

    setNewFieldDraft((p) => ({
      ...p,
      label: "",
      optionsText: "",
    }));
  };

  const handleUpdateFieldConfig = (
    field: DataUpdateFieldDef,
    patch: Partial<FieldCustomConfigOverride>,
    customToast?: string,
  ) => {
    const existingOv: FieldCustomConfigOverride = config.fieldConfigs?.[field.key] || {
      fieldKey: field.key,
      label: field.label,
      category: field.category,
      inputType: field.inputType,
      defaultOptions: field.defaultOptions,
      updateMode: field.updateMode || "approval_required",
      linkedApprovalGroupId:
        field.linkedApprovalGroupId || config.approvalGroups[0]?.id || "ag-hr-main",
      allowDirectManager: field.allowDirectManager ?? true,
      requiresAttachment: Boolean(field.requiresAttachment),
      requiresDeclaration: field.requiresDeclaration ?? true,
      active: field.active ?? true,
    };

    const updatedOv: FieldCustomConfigOverride = {
      ...existingOv,
      ...patch,
    };

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

    void persistConfig(next, customToast);
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
  // Approval Groups Handlers
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
  // Employee Permission Groups Handlers
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
          mode === "all"
            ? true
            : mode === "core_11"
              ? Boolean(f.isCoreRequested || f.isCustom)
              : false;
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

      {/* =====================================================================
          1. COMPACT ORGANIZED TOP HEADER + SUMMARY STRIP
         ===================================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#004e82] text-white shadow-xs">
              <MaterialIcon name="manage_accounts" size={24} />
            </div>
            <div>
              <h1 className="text-[16px] font-extrabold text-[#004e82]">
                تهيئة تحديث البيانات
              </h1>
              <p className="text-[11px] text-slate-500">
                إدارة حقول التحديث الفوري بإقرار الموظف (OK)، والحقول المربوطة بمجموعات الموافقات، وتقرير الإنجاز
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/reports/data-update-completion"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-100"
            >
              <MaterialIcon name="fact_check" size={16} />
              تقرير إنجاز لتحديث البيانات
            </Link>
            <Link
              to="/requests/data-update"
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              <MaterialIcon name="assignment_ind" size={16} />
              طلبات تحديث البيانات
            </Link>
            <button
              type="button"
              onClick={() =>
                void persistConfig(config, "تم حفظ جميع إعدادات تهيئة تحديث البيانات بنجاح")
              }
              className="flex items-center gap-1.5 rounded-xl bg-[#0070c0] px-4 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#005fa3]"
            >
              <MaterialIcon name="save" size={16} />
              حفظ التهيئة
            </button>
          </div>
        </div>

        {/* Clean 4-Metric Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          <div
            onClick={() => setActiveTab("direct_fields")}
            className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 px-3.5 py-2 cursor-pointer hover:bg-emerald-50 transition"
          >
            <div>
              <div className="text-[11px] font-bold text-emerald-800">
                حقول تحديث مباشر بإقرار (OK)
              </div>
              <div className="text-[10px] text-emerald-600">تسمع فوراً بالنظام والتقارير</div>
            </div>
            <span className="text-base font-black text-emerald-700 font-mono">
              {totalDirectCount}
            </span>
          </div>

          <div
            onClick={() => setActiveTab("approval_fields")}
            className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 px-3.5 py-2 cursor-pointer hover:bg-blue-50 transition"
          >
            <div>
              <div className="text-[11px] font-bold text-[#004e82]">
                حقول مربوطة بمراحل موافقة
              </div>
              <div className="text-[10px] text-slate-500">تمر على مجموعة الموافقات</div>
            </div>
            <span className="text-base font-black text-[#0070c0] font-mono">
              {totalApprovalCount}
            </span>
          </div>

          <div
            onClick={() => setActiveTab("approval_groups")}
            className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/50 px-3.5 py-2 cursor-pointer hover:bg-indigo-50 transition"
          >
            <div>
              <div className="text-[11px] font-bold text-indigo-900">مجموعات الموافقات</div>
              <div className="text-[10px] text-indigo-600">والمخولون بالاعتماد والرد</div>
            </div>
            <span className="text-base font-black text-indigo-700 font-mono">
              {config.approvalGroups.length}
            </span>
          </div>

          <div
            onClick={() => setActiveTab("employee_groups")}
            className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 px-3.5 py-2 cursor-pointer hover:bg-amber-50 transition"
          >
            <div>
              <div className="text-[11px] font-bold text-amber-900">
                مجموعات الموظفين والإقرار
              </div>
              <div className="text-[10px] text-amber-700">تخصيص الصلاحيات ونص القرار</div>
            </div>
            <span className="text-base font-black text-amber-700 font-mono">
              {config.userPermissionGroups.length}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. CLEAN HORIZONTAL STEPPER / NAVIGATION TABS
         ===================================================================== */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5">
        {[
          {
            key: "direct_fields" as const,
            step: "1",
            title: "حقول التحديث المباشر بإقرار الموظف (OK)",
            badge: `${totalDirectCount} حقل`,
            icon: "bolt",
          },
          {
            key: "approval_fields" as const,
            step: "2",
            title: "حقول مربوطة بمجموعة ومراحل موافقة",
            badge: `${totalApprovalCount} حقل`,
            icon: "route",
          },
          {
            key: "approval_groups" as const,
            step: "3",
            title: "مجموعات الموافقات والمخولون بالرد",
            badge: `${config.approvalGroups.length} مجموعات`,
            icon: "verified_user",
          },
          {
            key: "employee_groups" as const,
            step: "4",
            title: "صلاحيات الموظفين ونص إقرار التحديث",
            badge: `${config.userPermissionGroups.length} مجموعات`,
            icon: "tune",
          },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setFieldSearch("");
                setCategoryFilter("all");
              }}
              className={`flex-1 min-w-[210px] flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-right transition ${
                isActive
                  ? "bg-[#004e82] text-white shadow-xs"
                  : "bg-transparent text-slate-700 hover:bg-white/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                    isActive ? "bg-white text-[#004e82]" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.step}
                </span>
                <span className="text-xs font-extrabold">{tab.title}</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          TAB 1: حقول التحديث المباشر الفوري بإقرار الموظف (OK)
         ===================================================================== */}
      {activeTab === "direct_fields" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Right Column (4 cols): Create New Direct Field + Quick Convert */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card 1: Create New Field for Direct Self-Update */}
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <MaterialIcon name="add_circle" size={19} />
                </span>
                <div>
                  <h2 className="text-xs font-extrabold text-emerald-900">
                    إنشاء حقل جديد (تحديث مباشر بإقرار OK)
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    يظهر للموظف ليملأه ويؤكد الإقرار فيسمع فوراً بالنظام والتقارير
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-700">
                    مسمى الحقل الجديد (يظهر للموظف) *
                  </span>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="مثال: العنوان الوطني، رقم الآيبان، جوال الطوارئ..."
                    value={newFieldDraft.label}
                    onChange={(e) =>
                      setNewFieldDraft((p) => ({ ...p, label: e.target.value }))
                    }
                  />
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">التصنيف</span>
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
                      <option value="حقول مخصصة لتحديث البيانات">حقول مخصصة</option>
                      <option value="البيانات الشخصية والهوية">بيانات شخصية</option>
                      <option value="بيانات التواصل والبنك">تواصل وبنك</option>
                      <option value="البيانات الوظيفية والتنظيمية">بيانات وظيفية</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">نوع الحقل</span>
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
                      <option value="text">نص حر</option>
                      <option value="select_or_text">قائمة منسدلة</option>
                      <option value="date">تاريخ</option>
                      <option value="number">رقمي</option>
                    </select>
                  </label>
                </div>

                {newFieldDraft.inputType === "select_or_text" && (
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">
                      خيارات القائمة المنسدلة (مفصولة بفاصلة ،)
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
                )}

                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-2.5 space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-emerald-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFieldDraft.requiresDeclaration}
                      onChange={(e) =>
                        setNewFieldDraft((p) => ({
                          ...p,
                          requiresDeclaration: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    <span>إلزام الموظف بإقرار صحة البيانات والضغط على (موافق OK)</span>
                  </label>

                  <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFieldDraft.requiresAttachment}
                      onChange={(e) =>
                        setNewFieldDraft((p) => ({
                          ...p,
                          requiresAttachment: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    <span>يتطلب إرفاق مستند إثبات عند التحديث</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateCustomField("direct")}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-emerald-700"
                >
                  <MaterialIcon name="bolt" size={17} />
                  <span>إضافة الحقل للتحديث الفوري بإقرار (OK)</span>
                </button>
              </div>
            </div>

            {/* Card 2: Quick Convert an Existing Field to Direct Update */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5">
              <h3 className="text-xs font-extrabold text-[#004e82] flex items-center gap-1.5">
                <MaterialIcon name="swap_horiz" size={18} className="text-[#0070c0]" />
                تحويل حقل حالي إلى (تحديث مباشر بإقرار OK)
              </h3>
              <p className="text-[11px] text-slate-500">
                اختر أي حقل من الحقول الخاضعة للموافقة لتحويله إلى تحديث مباشر فوري:
              </p>
              <div className="flex items-center gap-2">
                <select
                  className={inputCls}
                  value={quickConvertFieldKey}
                  onChange={(e) => setQuickConvertFieldKey(e.target.value)}
                >
                  <option value="">-- اختر حقلاً لتحويله --</option>
                  {allFields
                    .filter((f) => f.updateMode !== "direct")
                    .map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label} ({f.category})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const target = allFields.find((f) => f.key === quickConvertFieldKey);
                    if (!target) {
                      toast.error("يرجى اختيار الحقل أولاً");
                      return;
                    }
                    handleUpdateFieldConfig(
                      target,
                      { updateMode: "direct", active: true },
                      `تم تحويل "${target.label}" إلى حقل تحديث مباشر فوري بإقرار الموظف (OK)`,
                    );
                    setQuickConvertFieldKey("");
                  }}
                  className="shrink-0 rounded-lg bg-[#0070c0] px-3 py-2 text-xs font-bold text-white hover:bg-[#005fa3]"
                >
                  تحويل
                </button>
              </div>
            </div>
          </div>

          {/* Left Column (8 cols): Clean Table of Direct Self-Update Fields */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <MaterialIcon name="bolt" size={20} className="text-emerald-600" />
                  <span>قائمة الحقول المتاحة للتحديث المباشر بإقرار الموظف ({directFields.length})</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  هذه الحقول يحدثها الموظف بنفسه، ويظهر له قرار تأكيد صحة البيانات ويضغط (موافق OK) فتسمع فوراً في النظام وفي تقرير الإنجاز.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="بحث في الحقول المباشرة..."
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  className="h-8 w-48 rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-emerald-900 text-white font-bold">
                  <tr>
                    <th className="px-3 py-2.5">تفعيل</th>
                    <th className="px-3 py-2.5">مسمى الحقل</th>
                    <th className="px-3 py-2.5">التصنيف والنوع</th>
                    <th className="px-3 py-2.5 text-center">قرار تأكيد الموظف (OK)</th>
                    <th className="px-3 py-2.5 text-center">إلزامية المرفق</th>
                    <th className="px-3 py-2.5 text-center">تغيير المسار / إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {directFields.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        لا توجد حقول مطابقة حالياً — يمكنك إنشاء حقل جديد من النموذج الجانبي أو تحويل أي حقل حالي.
                      </td>
                    </tr>
                  ) : (
                    directFields.map((field) => {
                      const isActive = field.active !== false;
                      return (
                        <tr
                          key={field.key}
                          className={`transition ${
                            !isActive ? "bg-slate-50 opacity-60" : "hover:bg-emerald-50/40"
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={(e) =>
                                handleUpdateFieldConfig(field, { active: e.target.checked })
                              }
                              className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{field.label}</span>
                              {field.isCustom && (
                                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-black text-purple-800">
                                  جديد
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              ⚡ يسمع فوراً بالنظام وتقرير الإنجاز
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-slate-700">{field.category}</div>
                            <div className="text-[10px] text-slate-400">
                              {field.inputType === "select_or_text"
                                ? "قائمة خيارات"
                                : field.inputType === "date"
                                  ? "تاريخ"
                                  : field.inputType === "number"
                                    ? "رقمي"
                                    : "نص حر"}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 cursor-pointer">
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
                          <td className="px-3 py-2.5 text-center">
                            <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer">
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
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateFieldConfig(
                                    field,
                                    { updateMode: "approval_required" },
                                    `تم نقل "${field.label}" إلى الحقول المربوطة بمراحل موافقة`,
                                  )
                                }
                                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#004e82] hover:bg-blue-100"
                              >
                                ربط بموافقة ←
                              </button>
                              {field.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomField(field.key, field.label)}
                                  className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                                >
                                  حذف
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: الحقول المربوطة بمجموعات ومراحل الموافقة
         ===================================================================== */}
      {activeTab === "approval_fields" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Right Column (4 cols): Create New Approval-Linked Field + Quick Convert */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border-2 border-blue-200 bg-white p-4 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#0070c0]">
                  <MaterialIcon name="add_moderator" size={19} />
                </span>
                <div>
                  <h2 className="text-xs font-extrabold text-[#004e82]">
                    إنشاء حقل جديد مربوط بمجموعة موافقة
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    يمر على مراحل الموافقة المحددة بعد أن يملأ الموظف البيانات ويوافق
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-700">
                    مسمى الحقل الجديد *
                  </span>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="مثال: تعديل المسمى الوظيفي، بدل السكن، الدرجة..."
                    value={newFieldDraft.label}
                    onChange={(e) =>
                      setNewFieldDraft((p) => ({ ...p, label: e.target.value }))
                    }
                  />
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">التصنيف</span>
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
                      <option value="البيانات الوظيفية والتنظيمية">بيانات وظيفية</option>
                      <option value="حقول مخصصة لتحديث البيانات">حقول مخصصة</option>
                      <option value="البيانات الشخصية والهوية">بيانات شخصية</option>
                      <option value="بيانات التواصل والبنك">تواصل وبنك</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">نوع الحقل</span>
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
                      <option value="text">نص حر</option>
                      <option value="select_or_text">قائمة منسدلة</option>
                      <option value="date">تاريخ</option>
                      <option value="number">رقمي</option>
                    </select>
                  </label>
                </div>

                {newFieldDraft.inputType === "select_or_text" && (
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
                )}

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#004e82]">
                    ربط الحقل بمجموعة الموافقات المختصة *
                  </span>
                  <select
                    className={inputCls}
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

                <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-2.5 space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-[#004e82] cursor-pointer">
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
                    <span>يمر أولاً على المدير المباشر للموافقة أو الرد</span>
                  </label>

                  <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer">
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
                    <span>يتطلب إرفاق مستند إثبات رسمي</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateCustomField("approval_required")}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#0070c0] py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#005fa3]"
                >
                  <MaterialIcon name="route" size={17} />
                  <span>إنشاء الحقل وربطه بمراحل الموافقة</span>
                </button>
              </div>
            </div>

            {/* Quick Convert a Direct Field to Approval Required */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5">
              <h3 className="text-xs font-extrabold text-[#004e82] flex items-center gap-1.5">
                <MaterialIcon name="swap_horiz" size={18} className="text-[#0070c0]" />
                ربط حقل مباشر بمجموعة موافقة
              </h3>
              <div className="flex items-center gap-2">
                <select
                  className={inputCls}
                  value={quickConvertFieldKey}
                  onChange={(e) => setQuickConvertFieldKey(e.target.value)}
                >
                  <option value="">-- اختر حقلاً مباشراً --</option>
                  {allFields
                    .filter((f) => f.updateMode === "direct")
                    .map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const target = allFields.find((f) => f.key === quickConvertFieldKey);
                    if (!target) {
                      toast.error("يرجى اختيار الحقل أولاً");
                      return;
                    }
                    handleUpdateFieldConfig(
                      target,
                      { updateMode: "approval_required", active: true },
                      `تم ربط "${target.label}" بمراحل الموافقة`,
                    );
                    setQuickConvertFieldKey("");
                  }}
                  className="shrink-0 rounded-lg bg-[#0070c0] px-3 py-2 text-xs font-bold text-white hover:bg-[#005fa3]"
                >
                  ربط
                </button>
              </div>
            </div>
          </div>

          {/* Left Column (8 cols): Clean Table of Approval-Linked Fields */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#004e82] flex items-center gap-1.5">
                  <MaterialIcon name="route" size={20} className="text-[#0070c0]" />
                  <span>قائمة الحقول المربوطة بمجموعات ومراحل الموافقة ({approvalFields.length})</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  يملأ الموظف الحقل ويؤكد الإقرار (OK)، ثم يمر الطلب على المدير المباشر ومجموعة الموافقة المختارة قبل تسميعه في النظام والتقارير.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-300 bg-slate-50 px-2.5 text-xs font-bold text-slate-700"
                >
                  <option value="all">جميع التصنيفات</option>
                  <option value="البيانات الوظيفية والتنظيمية">البيانات الوظيفية</option>
                  <option value="البيانات الشخصية والهوية">البيانات الشخصية</option>
                  <option value="بيانات التواصل والبنك">التواصل والبنك</option>
                  <option value="حقول مخصصة لتحديث البيانات">حقول مخصصة</option>
                </select>
                <input
                  type="text"
                  placeholder="بحث باسم الحقل..."
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  className="h-8 w-44 rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#004e82] text-white font-bold">
                  <tr>
                    <th className="px-3 py-2.5">تفعيل</th>
                    <th className="px-3 py-2.5">مسمى الحقل</th>
                    <th className="px-3 py-2.5">مجموعة الموافقة المربوطة</th>
                    <th className="px-3 py-2.5 text-center">المدير المباشر</th>
                    <th className="px-3 py-2.5 text-center">المرفق</th>
                    <th className="px-3 py-2.5 text-center">تحويل المسار / إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvalFields.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        لا توجد حقول مطابقة للفلتر المحدد.
                      </td>
                    </tr>
                  ) : (
                    approvalFields.map((field) => {
                      const isActive = field.active !== false;
                      return (
                        <tr
                          key={field.key}
                          className={`transition ${
                            !isActive ? "bg-slate-50 opacity-60" : "hover:bg-blue-50/30"
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={(e) =>
                                handleUpdateFieldConfig(field, { active: e.target.checked })
                              }
                              className="h-4 w-4 rounded accent-[#0070c0] cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{field.label}</span>
                              {field.isCustom && (
                                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-black text-purple-800">
                                  جديد
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500">{field.category}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <select
                              value={
                                field.linkedApprovalGroupId ||
                                config.approvalGroups[0]?.id ||
                                "ag-hr-main"
                              }
                              onChange={(e) =>
                                handleUpdateFieldConfig(
                                  field,
                                  { linkedApprovalGroupId: e.target.value },
                                  `تم ربط "${field.label}" بمجموعة الموافقة المختارة`,
                                )
                              }
                              className="h-8 w-full rounded-lg border border-blue-200 bg-blue-50/40 px-2 text-[11px] font-bold text-[#004e82]"
                            >
                              {config.approvalGroups.map((ag) => (
                                <option key={ag.id} value={ag.id}>
                                  {ag.name} ({ag.code})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.allowDirectManager !== false}
                                onChange={(e) =>
                                  handleUpdateFieldConfig(field, {
                                    allowDirectManager: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 rounded accent-[#0070c0]"
                              />
                              <span>يوافق أولاً</span>
                            </label>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer">
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
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateFieldConfig(
                                    field,
                                    { updateMode: "direct" },
                                    `تم تحويل "${field.label}" إلى تحديث مباشر فوري بإقرار الموظف (OK)`,
                                  )
                                }
                                className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                              >
                                ⚡ تحويل لمباشر
                              </button>
                              {field.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomField(field.key, field.label)}
                                  className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                                >
                                  حذف
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: مجموعات الموافقات واختيار المستخدمين المخولين بالموافقة أو الرد
         ===================================================================== */}
      {activeTab === "approval_groups" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Right Sidebar: List of Approval Groups */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-sm font-extrabold text-[#004e82]">مجموعات الموافقات</h2>
                  <p className="text-[10px] text-slate-500">اختر مجموعة لضبط أعضائها وصلاحياتها</p>
                </div>
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
                            ? "المدير المباشر: مفعّل ✓"
                            : "بدون المدير المباشر"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Left Detail Panel: Active Approval Group */}
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
                          يسمح للمدير المباشر للموظف صاحب الطلب بالموافقة أو الرد قبل اعتماد المجموعة
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
                            directManagerStageOrder:
                              e.target.value as DataUpdateApprovalGroup["directManagerStageOrder"],
                          }))
                        }
                      >
                        <option value="first">المرحلة 1: المدير المباشر أولاً ثم المجموعة</option>
                        <option value="parallel">بالتوازي: المدير المباشر أو المجموعة</option>
                        <option value="only_if_no_group">المدير المباشر يكفي للاعتماد</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Choosing Users who have permission to Approve or Reply */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <MaterialIcon name="person_check" size={18} className="text-[#0070c0]" />
                    المستخدمون المخولون بالموافقة أو الرد ({activeApprovalGroup.approvers.length})
                  </h4>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
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
                        placeholder="أو اكتب اسم المسؤول يدوياً..."
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
                          صلاحية الموافقة والرفض
                        </label>

                        <label className="flex items-center gap-1.5 text-xs font-bold text-[#004e82] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newApproverCanReply}
                            onChange={(e) => setNewApproverCanReply(e.target.checked)}
                            className="h-4 w-4 rounded accent-[#0070c0]"
                          />
                          صلاحية الرد والملاحظات
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
                              لا يوجد مستخدمون مضافون في هذه المجموعة بعد
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
          TAB 4: صلاحيات مجموعات الموظفين وإعدادات نص الإقرار العام
         ===================================================================== */}
      {activeTab === "employee_groups" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Right Column: Employee Groups + Declaration Text Editor */}
          <div className="lg:col-span-4 space-y-4">
            {/* Employee Groups List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="text-sm font-extrabold text-[#004e82]">
                    مجموعات الموظفين
                  </h2>
                  <p className="text-[10px] text-slate-500">تخصيص الحقول المتاحة لكل فئة</p>
                </div>
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
                          {count} حقل مفعّل
                        </span>
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-[#004e82]">
                          النطاق: {ug.scopeValue || "الكل"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Employee Declaration Text & Global Switches Card */}
            <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <MaterialIcon name="gavel" size={18} className="text-emerald-700" />
                <h3 className="text-xs font-extrabold text-[#004e82]">
                  إعدادات نص إقرار الموظف (OK) والضبط العام
                </h3>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-600">عنوان نافذة الإقرار</span>
                <input
                  type="text"
                  className={inputCls}
                  value={config.declarationTitle}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, declarationTitle: e.target.value }))
                  }
                  onBlur={() => void persistConfig(config)}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-600">
                  نص قرار التأكيد الذي يظهر للموظف قبل الضغط على (موافق OK)
                </span>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#0070c0]"
                  value={config.declarationText}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, declarationText: e.target.value }))
                  }
                  onBlur={() => void persistConfig(config)}
                />
              </label>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requireEmployeeDeclaration}
                    onChange={(e) =>
                      void persistConfig({
                        ...config,
                        requireEmployeeDeclaration: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                  <span>تفعيل شرط إقرار الموظف (OK) عند التحديث</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-[#004e82] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.globalAllowDirectManager}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      void persistConfig({
                        ...config,
                        globalAllowDirectManager: checked,
                        approvalGroups: config.approvalGroups.map((g) => ({
                          ...g,
                          allowDirectManager: checked,
                        })),
                      });
                    }}
                    className="h-4 w-4 rounded accent-[#0070c0]"
                  />
                  <span>تفعيل موافقة المدير المباشر بشكل عام</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoApplyOnApproval}
                    onChange={(e) =>
                      void persistConfig({
                        ...config,
                        autoApplyOnApproval: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded accent-[#0070c0]"
                  />
                  <span>تسميع التحديث تلقائياً في ملف الموظف والتقارير</span>
                </label>
              </div>
            </div>
          </div>

          {/* Left Main Area: Allowed Fields for Selected Employee Group */}
          <div className="lg:col-span-8 space-y-4">
            {activeUserGroup && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
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
                      الحقول المسموح لموظفي هذه المجموعة بتحديثها ({enabledFieldsCount} من{" "}
                      {allFields.length} مفعّل)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
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
                    <span className="text-[11px] font-bold text-slate-600">نطاق الموظفين</span>
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
                    <span className="text-[11px] font-bold text-slate-600">القيمة المستهدفة</span>
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
                        placeholder="أدخل الفئة الوظيفية..."
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
                      مجموعة الموافقات الافتراضية
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-2">
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
                        className={`rounded-xl border p-3 transition ${
                          rule.enabled
                            ? isDirect
                              ? "border-emerald-400 bg-emerald-50/30"
                              : "border-blue-300 bg-blue-50/30"
                            : "border-slate-200 bg-slate-50/60 opacity-70"
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
                            {isDirect ? "مباشر OK" : "بموافقة"}
                          </span>
                        </div>

                        {rule.enabled && (
                          <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.requiresAttachment}
                                onChange={(e) =>
                                  handleToggleFieldAttachment(field.key, e.target.checked)
                                }
                                className="h-3.5 w-3.5 rounded accent-amber-600"
                              />
                              مرفق إثبات إلزامي
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                إضافة مجموعة موظفين وصلاحيات حقول
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
                  placeholder="مثال: موظفو الكادر التعليمي / موظفو الفروع"
                  value={newUserGroupDraft.name}
                  onChange={(e) =>
                    setNewUserGroupDraft((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">نوع النطاق</span>
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
                  <option value="all">جميع الموظفين</option>
                  <option value="department">حسب القسم</option>
                  <option value="branch">حسب الفرع</option>
                  <option value="category">حسب الفئة الوظيفية</option>
                </select>
              </label>

              {newUserGroupDraft.scopeType !== "all" && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">قيمة النطاق</span>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="اكتب اسم القسم أو الفرع أو الفئة..."
                    value={newUserGroupDraft.scopeValue}
                    onChange={(e) =>
                      setNewUserGroupDraft((p) => ({ ...p, scopeValue: e.target.value }))
                    }
                  />
                </label>
              )}

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">ربط بمجموعة الموافقات</span>
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
