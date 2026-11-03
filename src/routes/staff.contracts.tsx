import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { useRows } from "@/lib/hr-db";
import {
  ContractTypeSettingsSection,
  useContractTypes,
  useManagedEmployeeContracts,
  calculateDurationBetweenDates,
  evaluateContractStatus,
  type ManagedEmployeeContract,
} from "@/components/hr/ContractTypeSettings";

export const Route = createFileRoute("/staff/contracts")({
  head: () => ({
    meta: [
      { title: "إدارة وتشغيل وتجديد العقود | شؤون الموظفين" },
      {
        name: "description",
        content:
          "إدارة عقود الموظفين، إضافة أنواع عقود جديدة بتاريخ بداية وتاريخ نهاية، وتشغيل وتفعيل وتجديد العقود على النظام.",
      },
    ],
  }),
  component: ContractsPage,
});

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

function ContractsPage() {
  const { data: employees = [], isLoading } = useRows("employees", {
    orderBy: "emp_no",
    ascending: true,
  });

  const { contractTypes, activeContractTypes, upsertContractType } = useContractTypes();
  const {
    contracts,
    upsertEmployeeContract,
    toggleEmployeeContractRunning,
    bulkActivateOrRenewContracts,
  } = useManagedEmployeeContracts(employees);

  const [activeTab, setActiveTab] = useState<"employee_contracts" | "contract_types">(
    "employee_contracts",
  );

  // Filters
  const [branchFilter, setBranchFilter] = useState("الكل");
  const [deptFilter, setDeptFilter] = useState("الكل");
  const [typeFilter, setTypeFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination & selection
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);

  // Modal state for creating / activating / renewing a contract with Start & End date
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"single" | "bulk">("single");
  const [createNewTypeInline, setCreateNewTypeInline] = useState(false);
  const [newTypeNameAr, setNewTypeNameAr] = useState("");

  const [contractForm, setContractForm] = useState({
    emp_id: "",
    contract_type:
      activeContractTypes[0]?.name_ar || "عقد عام دراسي (بتاريخ بداية ونهاية)",
    start_date: activeContractTypes[0]?.defaultStartDate || "2026-08-20",
    end_date: activeContractTypes[0]?.defaultEndDate || "2027-06-30",
    leave_days: 30,
    work_type: "دوام كامل",
    work_scope: "داخل المملكة",
    is_running_on_system: true,
    notes: "تم إعداد وتشغيل العقد بتاريخ بداية وتاريخ نهاية على النظام",
  });

  const branches = useMemo(
    () => ["الكل", ...uniq(contracts.map((c) => c.branch))],
    [contracts],
  );
  const departments = useMemo(
    () => ["الكل", ...uniq(contracts.map((c) => c.department))],
    [contracts],
  );
  const contractTypeNames = useMemo(
    () => [
      "الكل",
      ...uniq([
        ...contractTypes.map((t) => t.name_ar),
        ...contracts.map((c) => c.contract_type),
      ]),
    ],
    [contractTypes, contracts],
  );

  const filteredContracts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return contracts.filter((c) => {
      if (branchFilter !== "الكل" && c.branch !== branchFilter) return false;
      if (deptFilter !== "الكل" && c.department !== deptFilter) return false;
      if (typeFilter !== "الكل" && c.contract_type !== typeFilter) return false;
      if (statusFilter !== "الكل" && c.status !== statusFilter) return false;
      if (fromDate && c.start_date < fromDate) return false;
      if (toDate && c.end_date > toDate) return false;
      if (q) {
        const hit =
          c.employee_name.toLowerCase().includes(q) ||
          c.emp_no.toLowerCase().includes(q) ||
          c.contract_no.toLowerCase().includes(q) ||
          c.contract_type.toLowerCase().includes(q) ||
          c.branch.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [contracts, branchFilter, deptFilter, typeFilter, statusFilter, fromDate, toDate, searchQuery]);

  const stats = useMemo(() => {
    const active = contracts.filter((c) => c.status === "ساري" && c.is_running_on_system).length;
    const expiringSoon = contracts.filter((c) => c.status === "قريب الانتهاء").length;
    const expired = contracts.filter((c) => c.status === "منتهي").length;
    const stopped = contracts.filter((c) => !c.is_running_on_system || c.status === "موقوف").length;
    return { active, expiringSoon, expired, stopped };
  }, [contracts]);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => filteredContracts.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredContracts, safePage, pageSize],
  );

  const modalDuration = useMemo(
    () => calculateDurationBetweenDates(contractForm.start_date, contractForm.end_date),
    [contractForm.start_date, contractForm.end_date],
  );

  const openSingleContractModal = (existing?: ManagedEmployeeContract) => {
    setModalMode("single");
    setCreateNewTypeInline(false);
    setNewTypeNameAr("");
    if (existing) {
      setContractForm({
        emp_id: existing.emp_id,
        contract_type: existing.contract_type,
        start_date: existing.start_date,
        end_date: existing.end_date,
        leave_days: existing.leave_days,
        work_type: existing.work_type,
        work_scope: existing.work_scope,
        is_running_on_system: existing.is_running_on_system,
        notes: existing.notes || "تم تحديث وتشغيل العقد على النظام",
      });
    } else {
      const defType = activeContractTypes[0] || contractTypes[0];
      setContractForm({
        emp_id: contracts[0]?.emp_id || "",
        contract_type: defType?.name_ar || "عقد محدد المدة",
        start_date: defType?.defaultStartDate || "2026-11-01",
        end_date: defType?.defaultEndDate || "2027-10-31",
        leave_days: defType?.defaultLeaveDays || 30,
        work_type: defType?.workType || "دوام كامل",
        work_scope: "داخل المملكة",
        is_running_on_system: true,
        notes: "عقد جديد بتاريخ بداية وتاريخ نهاية ومشغل على النظام",
      });
    }
    setModalOpen(true);
  };

  const openBulkContractModal = () => {
    setModalMode("bulk");
    setCreateNewTypeInline(false);
    setNewTypeNameAr("");
    const defType = activeContractTypes[0] || contractTypes[0];
    setContractForm({
      emp_id: "",
      contract_type: defType?.name_ar || "عقد عام دراسي (بتاريخ بداية ونهاية)",
      start_date: defType?.defaultStartDate || "2026-08-20",
      end_date: defType?.defaultEndDate || "2027-06-30",
      leave_days: defType?.defaultLeaveDays || 30,
      work_type: defType?.workType || "دوام كامل",
      work_scope: "داخل المملكة",
      is_running_on_system: true,
      notes: "تفعيل وتجديد جماعي للعقود بتاريخ بداية ونهاية محدد",
    });
    setModalOpen(true);
  };

  const handleSelectContractTypeInModal = (typeName: string) => {
    const found = contractTypes.find((t) => t.name_ar === typeName);
    if (found) {
      setContractForm((prev) => ({
        ...prev,
        contract_type: found.name_ar,
        start_date: found.defaultStartDate || prev.start_date,
        end_date: found.defaultEndDate || prev.end_date,
        leave_days: found.defaultLeaveDays || prev.leave_days,
        work_type: found.workType || prev.work_type,
      }));
    } else {
      setContractForm((prev) => ({ ...prev, contract_type: typeName }));
    }
  };

  const handleSaveModalContract = () => {
    if (!contractForm.start_date || !contractForm.end_date) {
      toast.error("يرجى تحديد تاريخ بداية العقد وتاريخ نهاية العقد");
      return;
    }
    if (new Date(contractForm.end_date) < new Date(contractForm.start_date)) {
      toast.error("تاريخ نهاية العقد يجب أن يكون بعد تاريخ بداية العقد");
      return;
    }

    let finalTypeName = contractForm.contract_type;
    if (createNewTypeInline) {
      if (!newTypeNameAr.trim()) {
        toast.error("يرجى كتابة اسم نوع العقد الجديد");
        return;
      }
      finalTypeName = newTypeNameAr.trim();
      upsertContractType({
        id: `ct-${Date.now()}`,
        code: `CNT_${Math.floor(100 + Math.random() * 900)}`,
        name_ar: finalTypeName,
        name_en: finalTypeName,
        dateMode: "start_and_end",
        defaultStartDate: contractForm.start_date,
        defaultEndDate: contractForm.end_date,
        defaultDurationMonths: modalDuration.months,
        defaultLeaveDays: contractForm.leave_days,
        workType: contractForm.work_type,
        isAjeer: false,
        autoExpireAction: "notify",
        notifyBeforeDays: 60,
        isActive: true,
        description: `نوع عقد مضاف ومفعل بتاريخ بداية (${contractForm.start_date}) ونهاية (${contractForm.end_date})`,
      });
    }

    if (modalMode === "bulk") {
      const targets =
        selectedEmpIds.length > 0
          ? selectedEmpIds
          : filteredContracts.slice(0, 25).map((c) => c.emp_id);
      bulkActivateOrRenewContracts(targets, {
        contract_type: finalTypeName,
        start_date: contractForm.start_date,
        end_date: contractForm.end_date,
        leave_days: contractForm.leave_days,
        work_type: contractForm.work_type,
        is_running_on_system: contractForm.is_running_on_system,
        notes: contractForm.notes,
      });
      setSelectedEmpIds([]);
      setModalOpen(false);
      return;
    }

    const baseContract = contracts.find(
      (c) => c.emp_id === contractForm.emp_id || c.emp_no === contractForm.emp_id,
    );
    if (!baseContract) {
      toast.error("يرجى اختيار الموظف");
      return;
    }

    upsertEmployeeContract({
      ...baseContract,
      contract_type: finalTypeName,
      date_mode: finalTypeName.includes("غير محدد") ? "open_ended" : "start_and_end",
      start_date: contractForm.start_date,
      end_date: contractForm.end_date,
      leave_days: contractForm.leave_days,
      work_type: contractForm.work_type,
      work_scope: contractForm.work_scope,
      is_running_on_system: contractForm.is_running_on_system,
      notes: contractForm.notes,
    });

    toast.success(
      `تم حفظ وتشغيل عقد الموظف «${baseContract.employee_name}» (${finalTypeName}) من ${contractForm.start_date} إلى ${contractForm.end_date}`,
    );
    setModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = filteredContracts.map((c, idx) => {
      const evalRes = evaluateContractStatus(c.end_date, c.is_running_on_system);
      return {
        "#": idx + 1,
        "رقم العقد": c.contract_no,
        "الرقم الوظيفي": c.emp_no,
        "اسم الموظف": c.employee_name,
        "الفرع": c.branch,
        "القسم": c.department,
        "المسمى الوظيفي": c.job_title,
        "نوع العقد": c.contract_type,
        "تاريخ بداية العقد": c.start_date,
        "تاريخ نهاية العقد": c.end_date,
        "مدة العقد (شهر)": c.duration_months,
        "الأيام المتبقية": evalRes.daysRemaining,
        "حالة العقد": c.status,
        "التشغيل على النظام": c.is_running_on_system ? "مشغل ومفعل" : "متوقف",
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "عقود الموظفين");
    XLSX.writeFile(wb, "عقود_الموظفين_وتواريخ_البداية_والنهاية.xlsx");
  };

  const toggleSelectRow = (empId: string) => {
    setSelectedEmpIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId],
    );
  };

  const toggleSelectAllPage = () => {
    const pageIds = pagedRows.map((r) => r.emp_id);
    const allSelected = pageIds.every((id) => selectedEmpIds.includes(id));
    if (allSelected) {
      setSelectedEmpIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedEmpIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  return (
    <div className="mt-4 w-full max-w-none space-y-4" dir="rtl">
      <Breadcrumbs trail={["شؤون الموظفين", "إدارة وتشغيل وتجديد العقود"]} />

      <PageBanner
        icon="description"
        title="إدارة وتشغيل العقود وأنواع العقود (بتاريخ بداية ونهاية)"
        subtitle="إنشاء أنواع عقود جديدة بتاريخ بداية وتاريخ نهاية، وتشغيلها وتفعيلها على موظفي وفروع النظام"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openSingleContractModal()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-600"
            >
              <MaterialIcon name="add_task" size={18} />
              إنشاء / تشغيل عقد بتاريخ بداية ونهاية
            </button>
            <button
              type="button"
              onClick={openBulkContractModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-white/25"
            >
              <MaterialIcon name="done_all" size={18} />
              تفعيل / تجديد جماعي ({selectedEmpIds.length || "دفعة"})
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveTab((t) =>
                  t === "contract_types" ? "employee_contracts" : "contract_types",
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-amber-600"
            >
              <MaterialIcon name="settings_suggest" size={18} />
              {activeTab === "contract_types"
                ? "عرض جدول عقود الموظفين"
                : "إضافة / تهيئة نوع عقد جديد"}
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-white/25"
            >
              <MaterialIcon name="download" size={18} />
              تصدير Excel
            </button>
          </div>
        }
      />

      {/* Mode Switch Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("employee_contracts")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
            activeTab === "employee_contracts"
              ? "bg-[#0070c0] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <MaterialIcon name="assignment_ind" size={18} />
          <span>عقود الموظفين وتشغيلها على النظام ({contracts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contract_types")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
            activeTab === "contract_types"
              ? "bg-[#0070c0] text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <MaterialIcon name="tune" size={18} />
          <span>
            إدارة وتهيئة أنواع العقود (إنشاء نوع عقد بتاريخ بداية ونهاية) ({contractTypes.length})
          </span>
        </button>
      </div>

      {activeTab === "contract_types" ? (
        <ContractTypeSettingsSection />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs">
              <span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <MaterialIcon name="verified" size={24} filled />
              </span>
              <div>
                <p className="text-2xl font-black leading-none text-emerald-700">
                  {stats.active}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-600">
                  عقود سارية ومشغلة على النظام
                </p>
              </div>
            </article>

            <article className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-white p-4 shadow-xs">
              <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                <MaterialIcon name="hourglass_top" size={24} filled />
              </span>
              <div>
                <p className="text-2xl font-black leading-none text-amber-700">
                  {stats.expiringSoon}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-600">
                  قريبة الانتهاء (خلال 60 يوم)
                </p>
              </div>
            </article>

            <article className="flex items-center gap-4 rounded-2xl border border-rose-200 bg-white p-4 shadow-xs">
              <span className="grid size-12 place-items-center rounded-2xl bg-rose-100 text-rose-700">
                <MaterialIcon name="event_busy" size={24} filled />
              </span>
              <div>
                <p className="text-2xl font-black leading-none text-rose-700">
                  {stats.expired}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-600">
                  عقود منتهية تحتاج تجديد
                </p>
              </div>
            </article>

            <article className="flex items-center gap-4 rounded-2xl border border-sky-200 bg-white p-4 shadow-xs">
              <span className="grid size-12 place-items-center rounded-2xl bg-sky-100 text-[#0070c0]">
                <MaterialIcon name="date_range" size={24} filled />
              </span>
              <div>
                <p className="text-2xl font-black leading-none text-[#0070c0]">
                  {activeContractTypes.length}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-600">
                  أنواع العقود المشغلة حالياً
                </p>
              </div>
            </article>
          </section>

          {/* Active Contract Types Quick Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                <MaterialIcon name="bolt" size={18} className="text-amber-500" />
                <span>أنواع العقود المفعلة على النظام (اضغط للفلترة السريعة أو أضف نوعاً جديداً):</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("contract_types")}
                className="text-xs font-extrabold text-[#0070c0] hover:underline"
              >
                + إنشاء نوع عقد جديد بتاريخ بداية ونهاية
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTypeFilter("الكل");
                  setPage(1);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  typeFilter === "الكل"
                    ? "bg-[#0070c0] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                كل الأنواع ({contracts.length})
              </button>
              {activeContractTypes.map((ct) => {
                const count = contracts.filter((c) => c.contract_type === ct.name_ar).length;
                const active = typeFilter === ct.name_ar;
                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => {
                      setTypeFilter(ct.name_ar);
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? "border-[#0070c0] bg-[#0070c0] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-sky-50"
                    }`}
                  >
                    <span>{ct.name_ar}</span>
                    {ct.dateMode === "start_and_end" && (
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                          active ? "bg-white/20 text-white" : "bg-sky-100 text-[#005799]"
                        }`}
                      >
                        {ct.defaultStartDate} ← {ct.defaultEndDate}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                        active ? "bg-white text-[#0070c0]" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
              <div>
                <label className="mb-1 block text-xs font-extrabold text-slate-700">الفرع</label>
                <select
                  value={branchFilter}
                  onChange={(e) => {
                    setBranchFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold text-slate-700">القسم</label>
                <select
                  value={deptFilter}
                  onChange={(e) => {
                    setDeptFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold text-slate-700">
                  نوع العقد
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                >
                  {contractTypeNames.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold text-slate-700">
                  حالة العقد
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                >
                  <option value="الكل">الكل</option>
                  <option value="ساري">ساري</option>
                  <option value="قريب الانتهاء">قريب الانتهاء</option>
                  <option value="منتهي">منتهي</option>
                  <option value="موقوف">موقوف</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold text-slate-700">
                  بداية العقد من
                </label>
                <input
                  type="date"
                  dir="ltr"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold text-slate-700">
                  نهاية العقد إلى
                </label>
                <input
                  type="date"
                  dir="ltr"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold text-slate-700">
                  بحث بالموظف أو الرقم
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="اسم الموظف / الرقم الوظيفي..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBranchFilter("الكل");
                      setDeptFilter("الكل");
                      setTypeFilter("الكل");
                      setStatusFilter("الكل");
                      setFromDate("");
                      setToDate("");
                      setSearchQuery("");
                      setPage(1);
                    }}
                    title="إعادة تعيين"
                    className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  >
                    <MaterialIcon name="restart_alt" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Contracts Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <MaterialIcon name="table_chart" size={20} className="text-[#0070c0]" />
                <h3 className="text-sm font-black text-slate-900">
                  جدول عقود الموظفين وتواريخ البداية والنهاية والتشغيل ({filteredContracts.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">عرض:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold"
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-sm font-bold text-slate-500">
                جاري تحميل بيانات العقود...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-right text-xs">
                  <thead>
                    <tr className="bg-[#005799] text-white">
                      <th className="border-l border-white/15 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={
                            pagedRows.length > 0 &&
                            pagedRows.every((r) => selectedEmpIds.includes(r.emp_id))
                          }
                          onChange={toggleSelectAllPage}
                          className="size-4 accent-emerald-500"
                        />
                      </th>
                      <th className="border-l border-white/15 px-3 py-3 font-extrabold">
                        الرقم الوظيفي
                      </th>
                      <th className="border-l border-white/15 px-3 py-3 font-extrabold">
                        اسم الموظف
                      </th>
                      <th className="border-l border-white/15 px-3 py-3 font-extrabold">
                        الفرع / القسم
                      </th>
                      <th className="border-l border-white/15 px-3 py-3 font-extrabold">
                        نوع العقد
                      </th>
                      <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                        تاريخ بداية العقد
                      </th>
                      <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                        تاريخ نهاية العقد
                      </th>
                      <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                        مدة العقد
                      </th>
                      <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                        المتبقي
                      </th>
                      <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                        حالة العقد
                      </th>
                      <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                        التشغيل على النظام
                      </th>
                      <th className="px-3 py-3 text-center font-extrabold">
                        تعديل / تجديد التواريخ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pagedRows.map((row) => {
                      const evalRes = evaluateContractStatus(
                        row.end_date,
                        row.is_running_on_system,
                      );
                      return (
                        <tr key={row.id} className="hover:bg-sky-50/40">
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={selectedEmpIds.includes(row.emp_id)}
                              onChange={() => toggleSelectRow(row.emp_id)}
                              className="size-4 accent-[#0070c0]"
                            />
                          </td>
                          <td className="px-3 py-2.5 font-mono font-extrabold text-slate-700">
                            <div>{row.emp_no}</div>
                            <div className="text-[10px] text-slate-400">{row.contract_no}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-black text-slate-900">{row.employee_name}</div>
                            <div className="text-[11px] text-slate-500">{row.job_title}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-slate-800">{row.branch}</div>
                            <div className="text-[11px] text-slate-500">{row.department}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-[11px] font-extrabold text-[#005799] border border-sky-200">
                              <MaterialIcon name="description" size={13} />
                              {row.contract_type}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-emerald-700">
                            {row.start_date}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-rose-700">
                            {row.end_date}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-700">
                            {row.duration_months} شهر
                            <div className="text-[10px] text-slate-400">
                              ({row.duration_days} يوم)
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center font-extrabold">
                            {evalRes.status === "منتهي" ? (
                              <span className="text-rose-600">منتهي</span>
                            ) : evalRes.status === "موقوف" ? (
                              <span className="text-slate-400">موقوف</span>
                            ) : (
                              <span className="text-slate-800">{evalRes.daysRemaining} يوم</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                                evalRes.status === "ساري"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : evalRes.status === "قريب الانتهاء"
                                    ? "bg-amber-100 text-amber-800"
                                    : evalRes.status === "منتهي"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {evalRes.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => toggleEmployeeContractRunning(row)}
                              className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-black transition ${
                                row.is_running_on_system
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              }`}
                            >
                              <MaterialIcon
                                name={row.is_running_on_system ? "play_circle" : "pause_circle"}
                                size={15}
                              />
                              {row.is_running_on_system ? "مشغل على النظام" : "تشغيل الآن"}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => openSingleContractModal(row)}
                              className="inline-flex items-center gap-1 rounded-xl bg-[#0070c0] px-3 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-[#005799]"
                            >
                              <MaterialIcon name="autorenew" size={15} />
                              تعديل / تجديد التواريخ
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold text-slate-600">
              <div>
                إجمالي العقود المطابقة: <span className="font-black">{filteredContracts.length}</span>{" "}
                • صفحة {safePage} من {totalPages}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 disabled:opacity-40"
                >
                  السابق
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal for Creating / Running / Renewing Contract with Start & End Date */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            dir="rtl"
          >
            <div className="flex items-center justify-between bg-gradient-to-l from-[#005799] to-[#0070c0] px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <MaterialIcon name="event_Repeat" size={22} />
                <div>
                  <h3 className="text-sm font-black">
                    {modalMode === "bulk"
                      ? "تفعيل / تجديد جماعي للعقود بتاريخ بداية وتاريخ نهاية"
                      : "إنشاء / تعديل وتشغيل عقد موظف (بتاريخ بداية وتاريخ نهاية)"}
                  </h3>
                  <p className="text-[11px] text-sky-100">
                    اختر نوع العقد أو أنشئ نوعاً جديداً وحدد تاريخ البداية وتاريخ النهاية لتشغيله فوراً على النظام
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg bg-white/15 p-1.5 text-white hover:bg-white/25"
              >
                <MaterialIcon name="close" size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {modalMode === "single" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
                    اختر الموظف <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={contractForm.emp_id}
                    onChange={(e) =>
                      setContractForm((prev) => ({ ...prev, emp_id: e.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                  >
                    {contracts.slice(0, 200).map((c) => (
                      <option key={c.emp_id} value={c.emp_id}>
                        {c.emp_no} — {c.employee_name} ({c.branch})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">
                  سيتم تطبيق نوع العقد وتاريخ البداية وتاريخ النهاية وتشغيله على{" "}
                  <span className="font-black underline">
                    {selectedEmpIds.length > 0
                      ? `${selectedEmpIds.length} موظف محددين`
                      : `أول ${Math.min(25, filteredContracts.length)} موظف في القائمة المفلترة`}
                  </span>
                  .
                </div>
              )}

              {/* Contract Type Selection OR Inline New Contract Type Creation */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-extrabold text-slate-800">
                    نوع العقد <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreateNewTypeInline((v) => !v)}
                    className="text-xs font-black text-[#0070c0] hover:underline"
                  >
                    {createNewTypeInline
                      ? "اختيار من أنواع العقود الموجودة"
                      : "+ كتابة وإنشاء نوع عقد جديد الآن"}
                  </button>
                </div>

                {createNewTypeInline ? (
                  <input
                    type="text"
                    placeholder="اكتب اسم نوع العقد الجديد (مثال: عقد فصل دراسي أول / عقد مشروع خاص)..."
                    value={newTypeNameAr}
                    onChange={(e) => setNewTypeNameAr(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#0070c0] bg-white px-3 text-xs font-bold text-slate-900 outline-none"
                  />
                ) : (
                  <select
                    value={contractForm.contract_type}
                    onChange={(e) => handleSelectContractTypeInModal(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                  >
                    {contractTypes.map((ct) => (
                      <option key={ct.id} value={ct.name_ar}>
                        {ct.name_ar}{" "}
                        {ct.dateMode === "start_and_end"
                          ? `(${ct.defaultStartDate} ← ${ct.defaultEndDate})`
                          : "(غير محدد المدة)"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Start Date & End Date */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-black text-[#005799]">
                    تحديد تاريخ بداية العقد وتاريخ نهاية العقد
                  </span>
                  <span className="rounded-full bg-[#0070c0] px-2.5 py-0.5 text-[11px] font-black text-white">
                    المدة: {modalDuration.label}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-slate-700">
                      تاريخ بداية العقد <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      dir="ltr"
                      value={contractForm.start_date}
                      onChange={(e) =>
                        setContractForm((prev) => ({ ...prev, start_date: e.target.value }))
                      }
                      className="h-10 w-full rounded-xl border border-sky-300 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0070c0]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-extrabold text-slate-700">
                      تاريخ نهاية العقد <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      dir="ltr"
                      value={contractForm.end_date}
                      onChange={(e) =>
                        setContractForm((prev) => ({ ...prev, end_date: e.target.value }))
                      }
                      className="h-10 w-full rounded-xl border border-sky-300 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0070c0]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-extrabold text-slate-700">
                    أيام الإجازة السنوية
                  </label>
                  <select
                    value={String(contractForm.leave_days)}
                    onChange={(e) =>
                      setContractForm((prev) => ({
                        ...prev,
                        leave_days: Number(e.target.value) || 30,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="21">21 يوم</option>
                    <option value="30">30 يوم</option>
                    <option value="45">45 يوم</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-extrabold text-slate-700">
                    نوع الدوام
                  </label>
                  <select
                    value={contractForm.work_type}
                    onChange={(e) =>
                      setContractForm((prev) => ({ ...prev, work_type: e.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="دوام كامل">دوام كامل</option>
                    <option value="دوام جزئي">دوام جزئي</option>
                    <option value="عمل مرن">عمل مرن</option>
                  </select>
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-900">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={contractForm.is_running_on_system}
                    onChange={(e) =>
                      setContractForm((prev) => ({
                        ...prev,
                        is_running_on_system: e.target.checked,
                      }))
                    }
                    className="size-4 accent-emerald-600"
                  />
                  <span>تشغيل وتفعيل العقد على النظام فوراً</span>
                </div>
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black text-white">
                  {contractForm.is_running_on_system ? "مشغل على النظام" : "مسودة / متوقف"}
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalContract}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black text-white shadow-sm hover:bg-emerald-700"
                >
                  <MaterialIcon name="play_arrow" size={18} />
                  حفظ وتشغيل العقد على النظام
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
