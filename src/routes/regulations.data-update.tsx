import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, useSaveSettings, useSettings, type Row } from "@/lib/hr-db";
import {
  DATA_UPDATE_FIELDS,
  buildDefaultFieldMap,
  loadDataUpdateConfig,
  saveDataUpdateConfigLocal,
  type ApproverUserItem,
  type DataUpdateApprovalGroup,
  type DataUpdateConfigState,
  type UserFieldPermissionGroup,
} from "@/lib/data-update-config";

export const Route = createFileRoute("/regulations/data-update")({
  head: () => ({
    meta: [
      { title: "تهيئة تحديث البيانات | اللوائح" },
      {
        name: "description",
        content:
          "تهيئة مجموعات الموافقات وصلاحيات المستخدمين والمدير المباشر وتحديد الحقول المتاحة لطلب تعديل البيانات.",
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
  const [activeTab, setActiveTab] = useState<"approval_groups" | "allowed_fields">("approval_groups");

  // Selection state in Tab 1 & Tab 2
  const [selectedApprovalGroupId, setSelectedApprovalGroupId] = useState<string>("");
  const [selectedUserGroupId, setSelectedUserGroupId] = useState<string>("");

  // Add Approver form inside Tab 1
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
      // Saved in localStorage as fallback
      if (successMsg) toast.success(successMsg);
    }
  };

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

  // Extract unique branches and departments from employees + defaults
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

  // Handlers for Option 1: Approval Groups
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

  // Handlers for Option 2: User Field Permission Groups
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
      for (const f of DATA_UPDATE_FIELDS) {
        const shouldEnable =
          mode === "all" ? true : mode === "core_11" ? Boolean(f.isCoreRequested) : false;
        nextFields[f.key] = {
          fieldKey: f.key,
          enabled: shouldEnable,
          requiresAttachment: prev.allowedFields[f.key]?.requiresAttachment ?? false,
        };
      }
      return { ...prev, allowedFields: nextFields };
    });
    toast.success(
      mode === "core_11"
        ? "تم تفعيل الـ 11 حقل الأساسي لطلب التعديل"
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
      allowedFields: buildDefaultFieldMap(true),
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
    return DATA_UPDATE_FIELDS.filter((f) => activeUserGroup.allowedFields[f.key]?.enabled).length;
  }, [activeUserGroup]);

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
              تهيئة تحديث البيانات وصلاحيات الاعتماد والحقول المتاحة
            </h1>
            <p className="text-[12px] text-slate-500">
              ضبط مجموعات الموافقات والمستخدمين المخولين بالرد والموافقة، وتفعيل موافقة المدير المباشر، وتحديد الحقول المسموح للموظفين بطلب تعديلها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/requests/data-update"
            className="flex items-center gap-1.5 rounded-lg border border-[#0070c0] bg-blue-50/70 px-3.5 py-2 text-xs font-bold text-[#0070c0] transition hover:bg-blue-100"
          >
            <MaterialIcon name="assignment_ind" size={17} />
            فتح شاشة طلبات تحديث البيانات
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

      {/* Global Controls & Direct Manager Master Checkbox */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                السماح للمدير المباشر بالموافقة أو الرد على طلبات تحديث البيانات
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
              عند التفعيل، يظهر طلب تحديث البيانات للمدير المباشر للموظف ويكون له صلاحية الموافقة أو الرد قبل أو بالتوازي مع مجموعة الموافقات.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-3.5 cursor-pointer transition hover:border-emerald-500">
          <input
            type="checkbox"
            checked={config.autoApplyOnApproval}
            onChange={(e) => {
              const checked = e.target.checked;
              void persistConfig(
                { ...config, autoApplyOnApproval: checked },
                checked
                  ? "تم تفعيل التحديث التلقائي لملف الموظف فور اعتماد الطلب"
                  : "تم إيقاف التحديث التلقائي لملف الموظف",
              );
            }}
            className="mt-0.5 h-5 w-5 rounded border-emerald-400 accent-emerald-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-emerald-900">
                تحديث بيانات الموظف تلقائياً في النظام فور الموافقة النهائية
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  config.autoApplyOnApproval
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {config.autoApplyOnApproval ? "تلقائي فوري" : "يدوي"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              يقوم النظام تلقائياً بتعديل الحقل المطلوب في بطاقة الموظف وأرشيف تعديلات الموظف بمجرد اعتماد الطلب.
            </p>
          </div>
        </label>
      </div>

      {/* Main 2 Options Switcher (The 2 Options requested by user) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("approval_groups")}
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-right transition ${
            activeTab === "approval_groups"
              ? "bg-[#0070c0] text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                activeTab === "approval_groups" ? "bg-white/20 text-white" : "bg-blue-50 text-[#0070c0]"
              }`}
            >
              <MaterialIcon name="verified_user" size={20} />
            </div>
            <div>
              <div className="text-[13px] font-extrabold">
                الأوبشن الأول: مجموعات الموافقات وصلاحيات الرد
              </div>
              <div
                className={`text-[11px] ${
                  activeTab === "approval_groups" ? "text-blue-100" : "text-slate-500"
                }`}
              >
                اختيار المستخدمين المخولين بالموافقة أو الرد + خيار موافقة المدير المباشر
              </div>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold font-mono ${
              activeTab === "approval_groups" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {config.approvalGroups.length} مجموعات
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("allowed_fields")}
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-right transition ${
            activeTab === "allowed_fields"
              ? "bg-[#0070c0] text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                activeTab === "allowed_fields" ? "bg-white/20 text-white" : "bg-blue-50 text-[#0070c0]"
              }`}
            >
              <MaterialIcon name="tune" size={20} />
            </div>
            <div>
              <div className="text-[13px] font-extrabold">
                الأوبشن الثاني: الحقول المتاحة لطلب التعديل للموظفين
              </div>
              <div
                className={`text-[11px] ${
                  activeTab === "allowed_fields" ? "text-blue-100" : "text-slate-500"
                }`}
              >
                تحديد البيانات المسموح لمجموعة المستخدمين بطلب تعديلها (القسم، الوظيفة، الهوية، إلخ)
              </div>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold font-mono ${
              activeTab === "allowed_fields" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {enabledFieldsCount} حقل مفعّل
          </span>
        </button>
      </div>

      {/* =====================================================================
          OPTION 1: مجموعات الموافقات وصلاحيات المستخدمين والمدير المباشر
         ===================================================================== */}
      {activeTab === "approval_groups" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Sidebar list of Approval Groups */}
          <div className="lg:col-span-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-[13px] font-extrabold text-[#004e82]">قائمة مجموعات الموافقات</h2>
                <p className="text-[11px] text-slate-500">اختر مجموعة لإدارة المستخدمين وصلاحياتهم</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddApprovalGroupOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-[#0070c0] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#005fa3]"
              >
                <MaterialIcon name="add" size={15} />
                مجموعة جديدة
              </button>
            </div>

            <div className="space-y-2">
              {config.approvalGroups.map((g) => {
                const isSelected = activeApprovalGroup?.id === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedApprovalGroupId(g.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-[#0070c0] bg-blue-50/60 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-extrabold text-[#0070c0] bg-blue-100/70 px-2 py-0.5 rounded">
                        {g.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            g.allowDirectManager
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {g.allowDirectManager ? "المدير المباشر: يوافق" : "بدون مدير مباشر"}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-extrabold text-slate-800">{g.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{g.description}</div>
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-600">
                      <span>
                        المخولون: <strong className="text-[#004e82]">{g.approvers.length} مستخدم</strong>
                      </span>
                      <span>
                        النطاق: <strong>{g.targetDepartment === "الكل" ? "كل الأقسام" : g.targetDepartment}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail panel for selected Approval Group */}
          <div className="lg:col-span-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            {activeApprovalGroup ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#0070c0] px-2 py-0.5 font-mono text-xs font-bold text-white">
                        {activeApprovalGroup.code}
                      </span>
                      <h2 className="text-sm font-extrabold text-[#004e82]">
                        {activeApprovalGroup.name}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{activeApprovalGroup.description}</p>
                  </div>
                  {config.approvalGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteApprovalGroup(activeApprovalGroup.id)}
                      className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <MaterialIcon name="delete" size={16} />
                      حذف المجموعة
                    </button>
                  )}
                </div>

                {/* Group Settings & Direct Manager Checkbox */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">اسم مجموعة الموافقات</span>
                    <input
                      type="text"
                      value={activeApprovalGroup.name}
                      onChange={(e) =>
                        handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">نطاق الفرع</span>
                    <select
                      value={activeApprovalGroup.targetBranch}
                      onChange={(e) =>
                        handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
                          ...prev,
                          targetBranch: e.target.value,
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="الكل">جميع الفروع</option>
                      {branchOptions.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">نطاق القسم</span>
                    <select
                      value={activeApprovalGroup.targetDepartment}
                      onChange={(e) =>
                        handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
                          ...prev,
                          targetDepartment: e.target.value,
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="الكل">جميع الأقسام</option>
                      {departmentOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Direct Manager Approval Checkbox for this group */}
                  <div className="sm:col-span-3 pt-1">
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-[#0070c0]/30 bg-white p-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={activeApprovalGroup.allowDirectManager}
                          onChange={(e) =>
                            handleUpdateApprovalGroup(activeApprovalGroup.id, (prev) => ({
                              ...prev,
                              allowDirectManager: e.target.checked,
                            }))
                          }
                          className="h-5 w-5 rounded accent-[#0070c0]"
                        />
                        <div>
                          <div className="text-xs font-extrabold text-[#004e82]">
                            تفعيل موافقة المدير المباشر لهذه المجموعة (هل المدير المباشر يقدر يوافق أو لا؟)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            عند وضع علامة صح (☑️)، يحق للمدير المباشر للموظف الموافقة أو الرد على طلب تحديث البيانات في هذه المجموعة.
                          </div>
                        </div>
                      </div>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-extrabold ${
                          activeApprovalGroup.allowDirectManager
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {activeApprovalGroup.allowDirectManager
                          ? "نعم - المدير المباشر يوافق"
                          : "لا - بدون المدير المباشر"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Add User / Approver to this Group */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#004e82]">
                    <MaterialIcon name="person_add" size={18} className="text-[#0070c0]" />
                    إضافة مستخدم / موظف له صلاحية الموافقة أو الرد ضمن هذه المجموعة
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <label className="sm:col-span-4 flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-700">
                        اختر من موظفي النظام
                      </span>
                      <select
                        value={selectedEmpIdForApprover}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedEmpIdForApprover(val);
                          if (val) {
                            const emp = employees.find((x: Row) => String(x["id"]) === val);
                            if (emp) {
                              setCustomApproverName(
                                String(emp["full_name"] || emp["employee_name"] || ""),
                              );
                              setCustomApproverRole(
                                String(emp["job_title"] || "مخول بالموافقة والرد"),
                              );
                            }
                          }
                        }}
                        className={inputCls}
                      >
                        <option value="">-- اختر موظفاً أو اكتب اسم المستخدم يدوياً --</option>
                        {employees.map((emp: Row) => (
                          <option key={String(emp["id"])} value={String(emp["id"])}>
                            {String(emp["full_name"] || emp["employee_name"] || "")} (
                            {String(emp["emp_no"] || "بدون رقم")})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="sm:col-span-3 flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-700">
                        اسم المستخدم / المسؤول *
                      </span>
                      <input
                        type="text"
                        placeholder="مثال: أحمد محمد / مدير الموارد"
                        value={customApproverName}
                        onChange={(e) => setCustomApproverName(e.target.value)}
                        className={inputCls}
                      />
                    </label>

                    <label className="sm:col-span-3 flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-700">الصفة / الدور</span>
                      <input
                        type="text"
                        placeholder="مثال: مسؤول الاعتماد"
                        value={customApproverRole}
                        onChange={(e) => setCustomApproverRole(e.target.value)}
                        className={inputCls}
                      />
                    </label>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddApproverToGroup}
                        className="flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-[#0070c0] px-3 text-xs font-bold text-white shadow-xs hover:bg-[#005fa3]"
                      >
                        <MaterialIcon name="add" size={16} />
                        إضافة للمجموعة
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 pt-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newApproverCanApprove}
                        onChange={(e) => setNewApproverCanApprove(e.target.checked)}
                        className="h-4 w-4 accent-[#0070c0]"
                      />
                      صلاحية الموافقة والاعتماد النهائي أو الرفض
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newApproverCanReply}
                        onChange={(e) => setNewApproverCanReply(e.target.checked)}
                        className="h-4 w-4 accent-[#0070c0]"
                      />
                      صلاحية الرد وإضافة الملاحظات والاستفسارات على الطلب
                    </label>
                  </div>
                </div>

                {/* Table of Authorized Approvers in this Group */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-700">
                      المستخدمون المخولون بالموافقة والرد في ({activeApprovalGroup.name})
                    </h3>
                    <span className="text-[11px] font-bold text-slate-500">
                      إجمالي المخولين: {activeApprovalGroup.approvers.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="px-3 py-2.5">#</th>
                          <th className="px-3 py-2.5">اسم المستخدم / الموظف</th>
                          <th className="px-3 py-2.5">الصفة الوظيفية / الدور</th>
                          <th className="px-3 py-2.5 text-center">صلاحية الموافقة والاعتماد</th>
                          <th className="px-3 py-2.5 text-center">صلاحية الرد والمراجعة</th>
                          <th className="px-3 py-2.5 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeApprovalGroup.approvers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-semibold">
                              لا يوجد مستخدمون مضافون في هذه المجموعة حالياً؛ أضف مستخدماً من النموذج أعلاه.
                            </td>
                          </tr>
                        ) : (
                          activeApprovalGroup.approvers.map((ap, idx) => (
                            <tr key={ap.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2.5 font-mono text-slate-500">{idx + 1}</td>
                              <td className="px-3 py-2.5 font-extrabold text-slate-800">
                                {ap.name}
                                {ap.empNo && (
                                  <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                                    #{ap.empNo}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600">{ap.roleLabel}</td>
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
                                  className="h-4 w-4 accent-emerald-600 cursor-pointer"
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
                                  className="h-4 w-4 accent-[#0070c0] cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveApprover(ap.id)}
                                  className="text-rose-600 hover:text-rose-800 font-bold"
                                >
                                  حذف
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* =====================================================================
          OPTION 2: تهيئة الحقول المتاحة لطلب التعديل لكل مجموعة مستخدمين
         ===================================================================== */}
      {activeTab === "allowed_fields" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Sidebar of User / Employee Permission Groups */}
          <div className="lg:col-span-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-[13px] font-extrabold text-[#004e82]">
                  مجموعات المستخدمين / الموظفين
                </h2>
                <p className="text-[11px] text-slate-500">
                  حدد لكل مجموعة ما هي الحقول المسموح لهم بطلب تعديلها
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserGroupOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-[#0070c0] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#005fa3]"
              >
                <MaterialIcon name="add" size={15} />
                إضافة مجموعة
              </button>
            </div>

            <div className="space-y-2">
              {config.userPermissionGroups.map((ug) => {
                const isSelected = activeUserGroup?.id === ug.id;
                const countEnabled = DATA_UPDATE_FIELDS.filter(
                  (f) => ug.allowedFields[f.key]?.enabled,
                ).length;
                const linkedAg = config.approvalGroups.find(
                  (a) => a.id === ug.linkedApprovalGroupId,
                );
                return (
                  <div
                    key={ug.id}
                    onClick={() => setSelectedUserGroupId(ug.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-[#0070c0] bg-blue-50/60 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-extrabold text-[#0070c0] bg-blue-100/70 px-2 py-0.5 rounded">
                        {ug.code}
                      </span>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                        {countEnabled} حقل متاح للتعديل
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-800">{ug.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{ug.description}</div>
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-600">
                      <span>
                        النطاق:{" "}
                        <strong>
                          {ug.scopeType === "all"
                            ? "جميع الموظفين"
                            : `${ug.scopeValue}`}
                        </strong>
                      </span>
                      <span>
                        الاعتماد: <strong>{linkedAg?.name || "المجموعة العامة"}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fields Configuration Checklist for Selected User Group */}
          <div className="lg:col-span-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            {activeUserGroup ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#0070c0] px-2 py-0.5 font-mono text-xs font-bold text-white">
                        {activeUserGroup.code}
                      </span>
                      <h2 className="text-sm font-extrabold text-[#004e82]">
                        الحقول المسموح بطلب تعديلها لـ: {activeUserGroup.name}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      حدد الحقول التي تود السماح لموظفي هذه المجموعة بإرسال طلب تعديل/تحديث لها
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkSelectFields("core_11")}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-[#0070c0] hover:bg-blue-100"
                    >
                      تحديد الحقول الـ 11 الأساسية
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSelectFields("all")}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      تحديد الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSelectFields("none")}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
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

                {/* Group Scope & Linked Approval Group */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">اسم مجموعة الموظفين</span>
                    <input
                      type="text"
                      value={activeUserGroup.name}
                      onChange={(e) =>
                        handleUpdateUserGroup(activeUserGroup.id, (prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">
                      مجموعة الموافقات المختصة (من الأوبشن الأول)
                    </span>
                    <select
                      value={activeUserGroup.linkedApprovalGroupId}
                      onChange={(e) =>
                        handleUpdateUserGroup(activeUserGroup.id, (prev) => ({
                          ...prev,
                          linkedApprovalGroupId: e.target.value,
                        }))
                      }
                      className={inputCls}
                    >
                      {config.approvalGroups.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.allowDirectManager ? "+ المدير المباشر" : "بدون مدير مباشر"})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-slate-700">نطاق تطبيق المجموعة</span>
                    <select
                      value={activeUserGroup.scopeType}
                      onChange={(e) =>
                        handleUpdateUserGroup(activeUserGroup.id, (prev) => ({
                          ...prev,
                          scopeType: e.target.value as UserFieldPermissionGroup["scopeType"],
                          scopeValue: e.target.value === "all" ? "الكل" : prev.scopeValue,
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="all">جميع الموظفين بالنظام</option>
                      <option value="department">حسب القسم</option>
                      <option value="branch">حسب الفرع</option>
                      <option value="category">حسب الفئة الوظيفية</option>
                    </select>
                  </label>
                </div>

                {/* Core 11 Fields Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-[#004e82] flex items-center gap-1.5">
                      <MaterialIcon name="fact_check" size={18} className="text-[#0070c0]" />
                      الحقول الأساسية لتحديث البيانات (القسم، الوظيفة، المستوى، الفئة، التخصص، الفرع، القسم الرئيسي، رقم الهوية، الجنسية، الحالة الاجتماعية، المسار)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {DATA_UPDATE_FIELDS.filter((f) => f.isCoreRequested).map((field, index) => {
                      const rule = activeUserGroup.allowedFields[field.key] ?? {
                        fieldKey: field.key,
                        enabled: true,
                        requiresAttachment: false,
                      };
                      return (
                        <div
                          key={field.key}
                          className={`rounded-xl border p-3 transition ${
                            rule.enabled
                              ? "border-[#0070c0] bg-blue-50/40 shadow-2xs"
                              : "border-slate-200 bg-slate-50/60 opacity-75"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={(e) => handleToggleField(field.key, e.target.checked)}
                                className="h-4 w-4 rounded accent-[#0070c0]"
                              />
                              <div>
                                <div className="text-xs font-extrabold text-slate-800">
                                  {index + 1}. {field.label}
                                </div>
                                <div className="text-[10px] text-slate-500">{field.category}</div>
                              </div>
                            </label>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                rule.enabled
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {rule.enabled ? "متاح" : "مغلق"}
                            </span>
                          </div>

                          {rule.enabled && (
                            <div className="mt-2.5 border-t border-blue-100 pt-2">
                              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rule.requiresAttachment}
                                  onChange={(e) =>
                                    handleToggleFieldAttachment(field.key, e.target.checked)
                                  }
                                  className="h-3.5 w-3.5 rounded accent-amber-600"
                                />
                                إلزام الموظف بإرفاق مستند إثبات
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Extra Optional Fields Section */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-600 flex items-center gap-1.5">
                    <MaterialIcon name="playlist_add_check" size={18} className="text-slate-500" />
                    حقول إضافية مساندة (نوع الهوية، رقم الجوال، البريد الإلكتروني، الآيبان البنكي)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {DATA_UPDATE_FIELDS.filter((f) => !f.isCoreRequested).map((field) => {
                      const rule = activeUserGroup.allowedFields[field.key] ?? {
                        fieldKey: field.key,
                        enabled: false,
                        requiresAttachment: false,
                      };
                      return (
                        <div
                          key={field.key}
                          className={`rounded-xl border p-2.5 transition ${
                            rule.enabled
                              ? "border-[#0070c0] bg-blue-50/30"
                              : "border-slate-200 bg-slate-50/50 opacity-75"
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={(e) => handleToggleField(field.key, e.target.checked)}
                              className="h-4 w-4 rounded accent-[#0070c0]"
                            />
                            <span className="text-xs font-bold text-slate-800">{field.label}</span>
                          </label>
                          {rule.enabled && (
                            <label className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.requiresAttachment}
                                onChange={(e) =>
                                  handleToggleFieldAttachment(field.key, e.target.checked)
                                }
                                className="h-3.5 w-3.5 rounded accent-amber-600"
                              />
                              مرفق إلزامي
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal: Add Approval Group */}
      {isAddApprovalGroupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          dir="rtl"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#004e82]">
                إضافة مجموعة موافقات جديدة
              </h3>
              <button
                type="button"
                onClick={() => setIsAddApprovalGroupOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">اسم المجموعة *</span>
                <input
                  type="text"
                  placeholder="مثال: مجموعة اعتماد الفروع"
                  value={newGroupDraft.name}
                  onChange={(e) => setNewGroupDraft((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">الوصف</span>
                <input
                  type="text"
                  placeholder="وصف مختصر لاختصاص المجموعة"
                  value={newGroupDraft.description}
                  onChange={(e) => setNewGroupDraft((p) => ({ ...p, description: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/50 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newGroupDraft.allowDirectManager}
                  onChange={(e) =>
                    setNewGroupDraft((p) => ({ ...p, allowDirectManager: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[#0070c0]"
                />
                <span className="text-xs font-bold text-[#004e82]">
                  السماح للمدير المباشر بالموافقة أو الرد ضمن هذه المجموعة
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsAddApprovalGroupOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateApprovalGroup}
                className="rounded-lg bg-[#0070c0] px-4 py-2 text-xs font-bold text-white"
              >
                حفظ المجموعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add User Field Permission Group */}
      {isAddUserGroupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          dir="rtl"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#004e82]">
                إضافة مجموعة مستخدمين / موظفين لتخصيص الحقول
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserGroupOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">اسم مجموعة المستخدمين *</span>
                <input
                  type="text"
                  placeholder="مثال: موظفو الفروع والتشغيل"
                  value={newUserGroupDraft.name}
                  onChange={(e) => setNewUserGroupDraft((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">مجموعة الموافقات المرتبطة</span>
                <select
                  value={newUserGroupDraft.linkedApprovalGroupId}
                  onChange={(e) =>
                    setNewUserGroupDraft((p) => ({ ...p, linkedApprovalGroupId: e.target.value }))
                  }
                  className={inputCls}
                >
                  {config.approvalGroups.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">نطاق التطبيق</span>
                <select
                  value={newUserGroupDraft.scopeType}
                  onChange={(e) =>
                    setNewUserGroupDraft((p) => ({
                      ...p,
                      scopeType: e.target.value as UserFieldPermissionGroup["scopeType"],
                    }))
                  }
                  className={inputCls}
                >
                  <option value="all">جميع الموظفين</option>
                  <option value="department">قسم محدد</option>
                  <option value="branch">فرع محدد</option>
                  <option value="category">فئة وظيفية محددة</option>
                </select>
              </label>

              {newUserGroupDraft.scopeType !== "all" && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">قيمة النطاق (اسم القسم / الفرع / الفئة)</span>
                  <input
                    type="text"
                    placeholder="اكتب اسم القسم أو الفرع أو الفئة"
                    value={newUserGroupDraft.scopeValue}
                    onChange={(e) =>
                      setNewUserGroupDraft((p) => ({ ...p, scopeValue: e.target.value }))
                    }
                    className={inputCls}
                  />
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsAddUserGroupOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateUserGroup}
                className="rounded-lg bg-[#0070c0] px-4 py-2 text-xs font-bold text-white"
              >
                إضافة وتخصيص الحقول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
