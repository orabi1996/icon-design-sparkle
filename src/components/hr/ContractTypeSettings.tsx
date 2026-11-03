import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, useSaveRow, useDeleteRow, type Row } from "@/lib/hr-db";

export interface ContractTypeRecord {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  dateMode: "start_and_end" | "open_ended";
  defaultStartDate: string;
  defaultEndDate: string;
  defaultDurationMonths: number;
  defaultLeaveDays: number;
  workType: string;
  isAjeer: boolean;
  autoExpireAction: "notify" | "suspend_on_end" | "auto_renew";
  notifyBeforeDays: number;
  isActive: boolean;
  description: string;
}

export interface ManagedEmployeeContract {
  id: string;
  contract_no: string;
  emp_id: string;
  emp_no: string;
  employee_name: string;
  branch: string;
  department: string;
  job_title: string;
  contract_type: string;
  date_mode: "start_and_end" | "open_ended";
  start_date: string;
  end_date: string;
  duration_months: number;
  duration_days: number;
  leave_days: number;
  work_type: string;
  work_scope: string;
  basic_salary: number;
  total_salary: number;
  is_running_on_system: boolean;
  status: "ساري" | "قريب الانتهاء" | "منتهي" | "موقوف";
  notes: string;
  updated_at: string;
}

const CONTRACT_TYPES_STORAGE_KEY = "hr_contract_types_v1";
const EMPLOYEE_CONTRACTS_STORAGE_KEY = "hr_employee_contracts_v1";
const CONTRACT_TYPES_EVENT = "hr-contract-types-updated";
const EMPLOYEE_CONTRACTS_EVENT = "hr-employee-contracts-updated";

export const DEFAULT_CONTRACT_TYPES: ContractTypeRecord[] = [
  {
    id: "ct-fixed-term",
    code: "CNT_FIXED",
    name_ar: "عقد محدد المدة",
    name_en: "Fixed-Term Contract",
    dateMode: "start_and_end",
    defaultStartDate: "2026-01-01",
    defaultEndDate: "2026-12-31",
    defaultDurationMonths: 12,
    defaultLeaveDays: 30,
    workType: "دوام كامل",
    isAjeer: false,
    autoExpireAction: "notify",
    notifyBeforeDays: 60,
    isActive: true,
    description: "عقد عمل رسمي محدد بتاريخ بداية وتاريخ نهاية مع إشعار قبل الانتهاء بـ 60 يوماً",
  },
  {
    id: "ct-academic-year",
    code: "CNT_ACADEMIC",
    name_ar: "عقد عام دراسي (بتاريخ بداية ونهاية)",
    name_en: "Academic Year Contract",
    dateMode: "start_and_end",
    defaultStartDate: "2026-08-20",
    defaultEndDate: "2027-06-30",
    defaultDurationMonths: 10,
    defaultLeaveDays: 30,
    workType: "دوام كامل",
    isAjeer: false,
    autoExpireAction: "notify",
    notifyBeforeDays: 45,
    isActive: true,
    description: "عقد مخصص للكادر التعليمي والإداري بمدارس الأندلس مرتبط ببداية ونهاية العام الدراسي",
  },
  {
    id: "ct-temp-period",
    code: "CNT_TEMP_PERIOD",
    name_ar: "عقد فترة محددة / مؤقت (بتاريخ بداية ونهاية)",
    name_en: "Temporary Period Contract",
    dateMode: "start_and_end",
    defaultStartDate: "2026-11-01",
    defaultEndDate: "2027-04-30",
    defaultDurationMonths: 6,
    defaultLeaveDays: 21,
    workType: "دوام كامل",
    isAjeer: false,
    autoExpireAction: "suspend_on_end",
    notifyBeforeDays: 30,
    isActive: true,
    description: "عقد لفترة زمنية محددة بتاريخ بداية وتاريخ نهاية يتوقف تلقائياً بانتهاء المدة",
  },
  {
    id: "ct-flex-part",
    code: "CNT_FLEX",
    name_ar: "عقد عمل مرن / جزئي (بتاريخ بداية ونهاية)",
    name_en: "Flexible / Part-Time Contract",
    dateMode: "start_and_end",
    defaultStartDate: "2026-11-01",
    defaultEndDate: "2027-10-31",
    defaultDurationMonths: 12,
    defaultLeaveDays: 21,
    workType: "دوام جزئي",
    isAjeer: false,
    autoExpireAction: "notify",
    notifyBeforeDays: 30,
    isActive: true,
    description: "عقد عمل مرن أو جزئي محدد بتاريخ بداية وتاريخ نهاية",
  },
  {
    id: "ct-ajeer",
    code: "CNT_AJEER",
    name_ar: "عقد أجير (محدد بتاريخ بداية ونهاية)",
    name_en: "Ajeer Contract",
    dateMode: "start_and_end",
    defaultStartDate: "2026-11-01",
    defaultEndDate: "2027-10-31",
    defaultDurationMonths: 12,
    defaultLeaveDays: 21,
    workType: "دوام كامل",
    isAjeer: true,
    autoExpireAction: "suspend_on_end",
    notifyBeforeDays: 30,
    isActive: true,
    description: "عقد عبر منصة أجير محدد بتاريخ بداية وتاريخ نهاية",
  },
  {
    id: "ct-open-ended",
    code: "CNT_OPEN",
    name_ar: "عقد غير محدد المدة",
    name_en: "Open-Ended Contract",
    dateMode: "open_ended",
    defaultStartDate: "2026-01-01",
    defaultEndDate: "2028-12-31",
    defaultDurationMonths: 36,
    defaultLeaveDays: 30,
    workType: "دوام كامل",
    isAjeer: false,
    autoExpireAction: "auto_renew",
    notifyBeforeDays: 60,
    isActive: true,
    description: "عقد عمل مستمر يتجدد تلقائياً ومرتبط بتاريخ مباشرة وتاريخ مراجعة دورية",
  },
];

export function calculateDurationBetweenDates(
  startDate: string,
  endDate: string,
): { days: number; months: number; label: string } {
  if (!startDate || !endDate) {
    return { days: 365, months: 12, label: "12 شهر (365 يوم)" };
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { days: 365, months: 12, label: "12 شهر (365 يوم)" };
  }
  const diffMs = end.getTime() - start.getTime();
  const days = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  const months = Math.max(1, Math.round(days / 30));
  return {
    days,
    months,
    label: `${months} شهر (${days} يوم)`,
  };
}

export function evaluateContractStatus(
  endDate: string,
  isRunning: boolean = true,
): { daysRemaining: number; status: "ساري" | "قريب الانتهاء" | "منتهي" | "موقوف" } {
  if (!isRunning) {
    return { daysRemaining: 0, status: "موقوف" };
  }
  if (!endDate) {
    return { daysRemaining: 365, status: "ساري" };
  }
  const normalized = endDate.replace(/\//g, "-");
  const end = new Date(normalized);
  if (Number.isNaN(end.getTime())) {
    return { daysRemaining: 180, status: "ساري" };
  }
  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { daysRemaining: 0, status: "منتهي" };
  }
  if (diffDays <= 60) {
    return { daysRemaining: diffDays, status: "قريب الانتهاء" };
  }
  return { daysRemaining: diffDays, status: "ساري" };
}

export function loadContractTypesLocal(): ContractTypeRecord[] {
  if (typeof window === "undefined") return DEFAULT_CONTRACT_TYPES;
  try {
    const raw = window.localStorage.getItem(CONTRACT_TYPES_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTRACT_TYPES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_CONTRACT_TYPES;
}

export function saveContractTypesLocal(list: ContractTypeRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONTRACT_TYPES_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(CONTRACT_TYPES_EVENT));
  } catch {
    // ignore
  }
}

export function useContractTypes() {
  const [types, setTypes] = useState<ContractTypeRecord[]>(() => loadContractTypesLocal());
  const { data: dbRows = [] } = useRows("basic_lookups", {
    filters: { category: "نوع العقد" },
  });
  const saveDbRow = useSaveRow("basic_lookups");
  const deleteDbRow = useDeleteRow("basic_lookups");

  useEffect(() => {
    const refresh = () => setTypes(loadContractTypesLocal());
    window.addEventListener(CONTRACT_TYPES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CONTRACT_TYPES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Merge any DB rows that aren't in local storage yet
  const mergedTypes = useMemo(() => {
    const byName = new Map<string, ContractTypeRecord>();
    for (const item of types) {
      byName.set(item.name_ar.trim(), item);
    }
    for (const r of dbRows) {
      const nameAr = String(r["name_ar"] ?? "").trim();
      if (!nameAr || byName.has(nameAr)) continue;
      let parsedDetails: Partial<ContractTypeRecord> = {};
      const rawDetails = r["details"];
      if (typeof rawDetails === "string" && rawDetails.startsWith("{")) {
        try {
          parsedDetails = JSON.parse(rawDetails);
        } catch {
          // ignore
        }
      }
      byName.set(nameAr, {
        id: String(r["id"] ?? `ct-${Date.now()}`),
        code: String(r["code"] ?? parsedDetails.code ?? "CNT_CUSTOM"),
        name_ar: nameAr,
        name_en: String(r["name_en"] ?? nameAr),
        dateMode: parsedDetails.dateMode ?? "start_and_end",
        defaultStartDate: parsedDetails.defaultStartDate ?? "2026-11-01",
        defaultEndDate: parsedDetails.defaultEndDate ?? "2027-10-31",
        defaultDurationMonths: parsedDetails.defaultDurationMonths ?? 12,
        defaultLeaveDays: parsedDetails.defaultLeaveDays ?? 30,
        workType: parsedDetails.workType ?? "دوام كامل",
        isAjeer: Boolean(r["flag"] ?? parsedDetails.isAjeer ?? false),
        autoExpireAction: parsedDetails.autoExpireAction ?? "notify",
        notifyBeforeDays: parsedDetails.notifyBeforeDays ?? 60,
        isActive: r["active"] !== undefined ? Boolean(r["active"]) : true,
        description: parsedDetails.description ?? "نوع عقد مضاف في النظام",
      });
    }
    return Array.from(byName.values());
  }, [types, dbRows]);

  const activeContractTypes = useMemo(
    () => mergedTypes.filter((t) => t.isActive),
    [mergedTypes],
  );

  const upsertContractType = (record: ContractTypeRecord) => {
    const current = loadContractTypesLocal();
    const existsIdx = current.findIndex(
      (item) => item.id === record.id || item.name_ar.trim() === record.name_ar.trim(),
    );
    let next: ContractTypeRecord[];
    if (existsIdx >= 0) {
      next = current.map((item, idx) => (idx === existsIdx ? record : item));
    } else {
      next = [record, ...current];
    }
    saveContractTypesLocal(next);
    setTypes(next);

    // Also persist to basic_lookups for full compatibility
    const dbMatch = dbRows.find(
      (r) =>
        String(r["id"]) === record.id || String(r["name_ar"] ?? "").trim() === record.name_ar.trim(),
    );
    saveDbRow.mutate({
      ...(dbMatch ? { id: dbMatch["id"] } : {}),
      category: "نوع العقد",
      name_ar: record.name_ar,
      name_en: record.name_en || record.name_ar,
      code: record.code,
      flag: record.isAjeer,
      active: record.isActive,
      details: JSON.stringify(record),
    });
  };

  const toggleContractTypeActive = (id: string) => {
    const target = mergedTypes.find((t) => t.id === id);
    if (!target) return;
    const updated: ContractTypeRecord = {
      ...target,
      isActive: !target.isActive,
    };
    upsertContractType(updated);
    toast.success(
      updated.isActive
        ? `تم تشغيل وتفعيل نوع العقد «${updated.name_ar}» على النظام`
        : `تم إيقاف نوع العقد «${updated.name_ar}» مؤقتاً`,
    );
  };

  const removeContractType = (id: string) => {
    const target = mergedTypes.find((t) => t.id === id);
    const next = mergedTypes.filter((t) => t.id !== id);
    saveContractTypesLocal(next);
    setTypes(next);
    if (target) {
      const dbMatch = dbRows.find(
        (r) =>
          String(r["id"]) === id || String(r["name_ar"] ?? "").trim() === target.name_ar.trim(),
      );
      if (dbMatch?.["id"]) {
        deleteDbRow.mutate(String(dbMatch["id"]));
      }
      toast.success(`تم حذف نوع العقد «${target.name_ar}»`);
    }
  };

  return {
    contractTypes: mergedTypes,
    activeContractTypes,
    upsertContractType,
    toggleContractTypeActive,
    removeContractType,
  };
}

export function loadStoredEmployeeContracts(): Record<string, ManagedEmployeeContract> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EMPLOYEE_CONTRACTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // ignore
  }
  return {};
}

export function saveStoredEmployeeContracts(map: Record<string, ManagedEmployeeContract>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EMPLOYEE_CONTRACTS_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(EMPLOYEE_CONTRACTS_EVENT));
  } catch {
    // ignore
  }
}

export function useManagedEmployeeContracts(employees: Row[]) {
  const [overrides, setOverrides] = useState<Record<string, ManagedEmployeeContract>>(() =>
    loadStoredEmployeeContracts(),
  );
  const saveEmpRow = useSaveRow("employees");

  useEffect(() => {
    const refresh = () => setOverrides(loadStoredEmployeeContracts());
    window.addEventListener(EMPLOYEE_CONTRACTS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EMPLOYEE_CONTRACTS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const contracts = useMemo<ManagedEmployeeContract[]>(() => {
    const baseList: ManagedEmployeeContract[] = employees.map((emp, i) => {
      const empId = String(emp["id"] ?? `emp-${i + 1}`);
      const empNo = String(emp["emp_no"] ?? 10000 + i + 1);
      const saved = overrides[empId] || overrides[empNo];
      if (saved) {
        const evalRes = evaluateContractStatus(saved.end_date, saved.is_running_on_system);
        return {
          ...saved,
          status: evalRes.status,
        };
      }

      const basic = Number(emp["basic_salary"] || (i % 2 === 0 ? 6800 : 8500));
      const allowances = Number(emp["allowances"] || Math.round(basic * 0.35));
      const total = basic + allowances;

      const rawType = String(emp["contract_type"] ?? "").trim();
      const contractType =
        rawType ||
        (i % 5 === 0
          ? "عقد عام دراسي (بتاريخ بداية ونهاية)"
          : i % 7 === 0
            ? "عقد فترة محددة / مؤقت (بتاريخ بداية ونهاية)"
            : emp["nationality"] === "سعودي" && i % 3 === 0
              ? "عقد غير محدد المدة"
              : "عقد محدد المدة");

      const startDate = String(
        emp["start_date"] ||
          emp["hire_date"] ||
          (contractType.includes("عام دراسي") ? "2026-08-20" : `2025-${String((i % 12) + 1).padStart(2, "0")}-01`),
      ).replace(/\//g, "-");

      // Create realistic end dates (some active, some expiring soon, some expired)
      const defaultEndYear = i % 11 === 0 ? 2025 : i % 6 === 0 ? 2026 : 2027;
      const defaultEndMonth = String(((i * 3) % 12) + 1).padStart(2, "0");
      const endDate = String(
        emp["contract_end"] ||
          (contractType.includes("عام دراسي")
            ? "2027-06-30"
            : `${defaultEndYear}-${defaultEndMonth}-28`),
      ).replace(/\//g, "-");

      const dur = calculateDurationBetweenDates(startDate, endDate);
      const evalRes = evaluateContractStatus(endDate, true);
      const dateMode: "open_ended" | "start_and_end" = contractType.includes("غير محدد")
        ? "open_ended"
        : "start_and_end";

      return {
        id: `cnt-${empNo}`,
        contract_no: `CNT-2026-${empNo}`,
        emp_id: empId,
        emp_no: empNo,
        employee_name: String(emp["full_name"] ?? "—"),
        branch: String(emp["branch"] ?? "الفرع الرئيسي"),
        department: String(emp["department"] ?? "الشؤون التعليمية"),
        job_title: String(emp["job_title"] ?? "معلم"),
        contract_type: contractType,
        date_mode: dateMode,
        start_date: startDate,
        end_date: endDate,
        duration_months: dur.months,
        duration_days: dur.days,
        leave_days: 30,
        work_type: String(emp["work_type"] || "دوام كامل"),
        work_scope: String(emp["work_scope"] || "داخل المملكة"),
        basic_salary: basic,
        total_salary: total,
        is_running_on_system: true,
        status: evalRes.status,
        notes: "عقد مفعل ومشغل على النظام",
        updated_at: new Date().toISOString().slice(0, 10),
      };
    });

    // Include any standalone custom contracts created for employees not yet in the base list
    const existingEmpIds = new Set(baseList.map((c) => c.emp_id));
    const existingEmpNos = new Set(baseList.map((c) => c.emp_no));
    const extraContracts = Object.values(overrides).filter(
      (c) => !existingEmpIds.has(c.emp_id) && !existingEmpNos.has(c.emp_no),
    );

    return [...extraContracts, ...baseList];
  }, [employees, overrides]);

  const upsertEmployeeContract = (contract: ManagedEmployeeContract) => {
    const current = loadStoredEmployeeContracts();
    const evalRes = evaluateContractStatus(contract.end_date, contract.is_running_on_system);
    const dur = calculateDurationBetweenDates(contract.start_date, contract.end_date);
    const enriched: ManagedEmployeeContract = {
      ...contract,
      duration_months: dur.months,
      duration_days: dur.days,
      status: evalRes.status,
      updated_at: new Date().toISOString().slice(0, 10),
    };
    current[contract.emp_id] = enriched;
    current[contract.emp_no] = enriched;
    saveStoredEmployeeContracts(current);
    setOverrides({ ...current });

    // Also update the employee row if present
    const targetEmp = employees.find(
      (e) => String(e["id"]) === contract.emp_id || String(e["emp_no"]) === contract.emp_no,
    );
    if (targetEmp?.["id"]) {
      saveEmpRow.mutate({
        id: targetEmp["id"],
        contract_type: enriched.contract_type,
        start_date: enriched.start_date,
        contract_end: enriched.end_date,
        work_type: enriched.work_type,
        status: enriched.is_running_on_system ? "نشط" : "موقوف",
      });
    }
  };

  const toggleEmployeeContractRunning = (contract: ManagedEmployeeContract) => {
    const nextRunning = !contract.is_running_on_system;
    upsertEmployeeContract({
      ...contract,
      is_running_on_system: nextRunning,
    });
    toast.success(
      nextRunning
        ? `تم تشغيل وتفعيل عقد الموظف «${contract.employee_name}» على النظام (${contract.start_date} إلى ${contract.end_date})`
        : `تم إيقاف سريان عقد الموظف «${contract.employee_name}» على النظام`,
    );
  };

  const bulkActivateOrRenewContracts = (
    targetEmpIds: string[],
    payload: {
      contract_type: string;
      start_date: string;
      end_date: string;
      leave_days?: number;
      work_type?: string;
      is_running_on_system: boolean;
      notes?: string;
    },
  ) => {
    const current = loadStoredEmployeeContracts();
    const dur = calculateDurationBetweenDates(payload.start_date, payload.end_date);
    const evalRes = evaluateContractStatus(payload.end_date, payload.is_running_on_system);

    for (const c of contracts) {
      if (!targetEmpIds.includes(c.emp_id) && !targetEmpIds.includes(c.emp_no)) continue;
      const updated: ManagedEmployeeContract = {
        ...c,
        contract_type: payload.contract_type || c.contract_type,
        date_mode: (payload.contract_type || c.contract_type).includes("غير محدد")
          ? "open_ended"
          : "start_and_end",
        start_date: payload.start_date,
        end_date: payload.end_date,
        duration_months: dur.months,
        duration_days: dur.days,
        leave_days: payload.leave_days ?? c.leave_days,
        work_type: payload.work_type || c.work_type,
        is_running_on_system: payload.is_running_on_system,
        status: evalRes.status,
        notes: payload.notes || "تم تحديث وتشغيل العقد بتاريخ بداية ونهاية جديد",
        updated_at: new Date().toISOString().slice(0, 10),
      };
      current[c.emp_id] = updated;
      current[c.emp_no] = updated;
    }

    saveStoredEmployeeContracts(current);
    setOverrides({ ...current });
    toast.success(`تم تحديث وتشغيل ${targetEmpIds.length} عقد على النظام بنجاح`);
  };

  return {
    contracts,
    upsertEmployeeContract,
    toggleEmployeeContractRunning,
    bulkActivateOrRenewContracts,
  };
}

export function ContractTypeSettingsSection() {
  const {
    contractTypes,
    upsertContractType,
    toggleContractTypeActive,
    removeContractType,
  } = useContractTypes();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<Omit<ContractTypeRecord, "id">>({
    code: "CNT_CUSTOM_DATE",
    name_ar: "",
    name_en: "",
    dateMode: "start_and_end",
    defaultStartDate: "2026-11-01",
    defaultEndDate: "2027-10-31",
    defaultDurationMonths: 12,
    defaultLeaveDays: 30,
    workType: "دوام كامل",
    isAjeer: false,
    autoExpireAction: "notify",
    notifyBeforeDays: 60,
    isActive: true,
    description: "",
  });

  const computedDuration = useMemo(
    () => calculateDurationBetweenDates(form.defaultStartDate, form.defaultEndDate),
    [form.defaultStartDate, form.defaultEndDate],
  );

  const filteredTypes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contractTypes;
    return contractTypes.filter(
      (t) =>
        t.name_ar.toLowerCase().includes(q) ||
        t.name_en.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [contractTypes, searchQuery]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      code: `CNT_${Math.floor(100 + Math.random() * 900)}`,
      name_ar: "",
      name_en: "",
      dateMode: "start_and_end",
      defaultStartDate: "2026-11-01",
      defaultEndDate: "2027-10-31",
      defaultDurationMonths: 12,
      defaultLeaveDays: 30,
      workType: "دوام كامل",
      isAjeer: false,
      autoExpireAction: "notify",
      notifyBeforeDays: 60,
      isActive: true,
      description: "",
    });
  };

  const handleSave = () => {
    if (!form.name_ar.trim()) {
      toast.error("يرجى إدخال اسم نوع العقد بالعربية");
      return;
    }
    if (form.dateMode === "start_and_end") {
      if (!form.defaultStartDate || !form.defaultEndDate) {
        toast.error("يرجى تحديد تاريخ البداية وتاريخ النهاية لنوع العقد");
        return;
      }
      if (new Date(form.defaultEndDate) < new Date(form.defaultStartDate)) {
        toast.error("تاريخ نهاية العقد يجب أن يكون بعد تاريخ بداية العقد");
        return;
      }
    }

    const record: ContractTypeRecord = {
      id: editingId || `ct-${Date.now()}`,
      ...form,
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim() || form.name_ar.trim(),
      defaultDurationMonths: computedDuration.months,
      description:
        form.description.trim() ||
        (form.dateMode === "start_and_end"
          ? `عقد محدد بتاريخ بداية (${form.defaultStartDate}) وتاريخ نهاية (${form.defaultEndDate}) - المدة ${computedDuration.label}`
          : "عقد غير محدد المدة"),
    };

    upsertContractType(record);
    toast.success(
      editingId
        ? `تم تحديث نوع العقد «${record.name_ar}» وتشغيله على النظام`
        : `تم إنشاء نوع العقد الجديد «${record.name_ar}» (${record.defaultStartDate} ← ${record.defaultEndDate}) وتشغيله على النظام بنجاح`,
    );
    resetForm();
  };

  const handleEdit = (item: ContractTypeRecord) => {
    setEditingId(item.id);
    setForm({
      code: item.code,
      name_ar: item.name_ar,
      name_en: item.name_en,
      dateMode: item.dateMode,
      defaultStartDate: item.defaultStartDate,
      defaultEndDate: item.defaultEndDate,
      defaultDurationMonths: item.defaultDurationMonths,
      defaultLeaveDays: item.defaultLeaveDays,
      workType: item.workType,
      isAjeer: item.isAjeer,
      autoExpireAction: item.autoExpireAction,
      notifyBeforeDays: item.notifyBeforeDays,
      isActive: item.isActive,
      description: item.description,
    });
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="grid size-11 place-items-center rounded-xl bg-sky-50 text-sky-600">
            <MaterialIcon name="description" size={22} filled />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{contractTypes.length}</p>
            <p className="text-xs font-bold text-slate-500">إجمالي أنواع العقود المعرفة</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
          <div className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <MaterialIcon name="play_circle" size={22} filled />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-700">
              {contractTypes.filter((t) => t.isActive).length}
            </p>
            <p className="text-xs font-bold text-emerald-800">أنواع العقود المشغلة على النظام</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-xs">
          <div className="grid size-11 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
            <MaterialIcon name="date_range" size={22} filled />
          </div>
          <div>
            <p className="text-2xl font-black text-indigo-700">
              {contractTypes.filter((t) => t.dateMode === "start_and_end").length}
            </p>
            <p className="text-xs font-bold text-indigo-800">عقود مرتبطة بتاريخ بداية ونهاية</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <div className="grid size-11 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <MaterialIcon name="verified_user" size={22} filled />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-700">
              {contractTypes.filter((t) => t.isAjeer).length}
            </p>
            <p className="text-xs font-bold text-amber-800">عقود مربوطة بنظام أجير / قوى</p>
          </div>
        </div>
      </div>

      {/* Create / Edit Contract Type Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-l from-[#005799] to-[#0070c0] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <MaterialIcon name={editingId ? "edit_calendar" : "add_task"} size={22} />
            <div>
              <h3 className="text-sm font-black">
                {editingId
                  ? "تعديل بيانات نوع العقد وإعدادات تاريخ البداية والنهاية"
                  : "إضافة نوع عقد جديد (بتاريخ بداية وتاريخ نهاية) وتشغيله على النظام"}
              </h3>
              <p className="text-[11px] text-sky-100">
                حدد مسمى نوع العقد وتاريخ البداية وتاريخ النهاية الافتراضي وآلية التشغيل التلقائي ليظهر فوراً في جميع شاشات الموظفين والعقود
              </p>
            </div>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25"
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
                اسم نوع العقد (عربي) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: عقد مشروع خاص / عقد فصل دراسي..."
                value={form.name_ar}
                onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0] focus:ring-2 focus:ring-[#0070c0]/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
                اسم نوع العقد (إنجليزي)
              </label>
              <input
                type="text"
                dir="ltr"
                placeholder="e.g. Fixed Period Contract"
                value={form.name_en}
                onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
                رمز نوع العقد (Code)
              </label>
              <input
                type="text"
                dir="ltr"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#0070c0]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
                نمط وآلية تاريخ العقد <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.dateMode}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    dateMode: e.target.value as "start_and_end" | "open_ended",
                  }))
                }
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
              >
                <option value="start_and_end">مرتبط بتاريخ بداية وتاريخ نهاية (محدد المدة)</option>
                <option value="open_ended">غير محدد المدة (مفتوح بتجديد تلقائي)</option>
              </select>
            </div>
          </div>

          {/* Start Date + End Date + Duration Box */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#005799]">
                <MaterialIcon name="event_available" size={18} />
                <span>إعدادات تاريخ بداية العقد وتاريخ نهاية العقد والتشغيل على النظام</span>
              </div>
              <span className="rounded-full bg-[#0070c0] px-3 py-1 text-[11px] font-extrabold text-white shadow-2xs">
                المدة المحسوبة تلقائياً: {computedDuration.label}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-extrabold text-slate-700">
                  تاريخ بداية العقد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  dir="ltr"
                  value={form.defaultStartDate}
                  onChange={(e) => setForm((p) => ({ ...p, defaultStartDate: e.target.value }))}
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
                  value={form.defaultEndDate}
                  onChange={(e) => setForm((p) => ({ ...p, defaultEndDate: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-sky-300 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0070c0]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold text-slate-700">
                  الإجراء عند تاريخ النهاية
                </label>
                <select
                  value={form.autoExpireAction}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      autoExpireAction: e.target.value as
                        | "notify"
                        | "suspend_on_end"
                        | "auto_renew",
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-sky-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                >
                  <option value="notify">إشعار وتنبيه قبل تاريخ النهاية</option>
                  <option value="suspend_on_end">إيقاف العقد تلقائياً عند تاريخ النهاية</option>
                  <option value="auto_renew">تجديد تلقائي لمدة مماثلة</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold text-slate-700">
                  رصيد الإجازة السنوية (يوم)
                </label>
                <select
                  value={String(form.defaultLeaveDays)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, defaultLeaveDays: Number(e.target.value) || 30 }))
                  }
                  className="h-10 w-full rounded-xl border border-sky-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                >
                  <option value="21">21 يوم سنوياً</option>
                  <option value="30">30 يوم سنوياً</option>
                  <option value="45">45 يوم سنوياً</option>
                  <option value="0">بدون رصيد إجازة مدفوعة</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold text-slate-700">
                  نوع الدوام الافتراضي
                </label>
                <select
                  value={form.workType}
                  onChange={(e) => setForm((p) => ({ ...p, workType: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-sky-300 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
                >
                  <option value="دوام كامل">دوام كامل</option>
                  <option value="دوام جزئي">دوام جزئي</option>
                  <option value="عمل مرن">عمل مرن</option>
                  <option value="عمل عن بعد">عمل عن بعد</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-1">
                <input
                  type="text"
                  placeholder="وصف أو ملاحظات إضافية على نوع العقد..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-sky-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-[#0070c0]"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isAjeer}
                  onChange={(e) => setForm((p) => ({ ...p, isAjeer: e.target.checked }))}
                  className="size-4 accent-[#0070c0]"
                />
                <span>خاضع لمنصة أجير / قوى</span>
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50/80 px-3.5 py-2 text-xs font-extrabold text-emerald-900">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="size-4 accent-emerald-600"
                  />
                  <span>تشغيل وتفعيل هذا النوع على النظام فوراً</span>
                </div>
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                  {form.isActive ? "مشغل" : "متوقف"}
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700"
            >
              <MaterialIcon name="play_arrow" size={18} />
              {editingId
                ? "حفظ التعديلات وتحديث التشغيل على النظام"
                : "إضافة نوع العقد وتشغيله على النظام"}
            </button>
          </div>
        </div>
      </div>

      {/* Contract Types Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <MaterialIcon name="list_alt" size={20} className="text-[#0070c0]" />
            <h4 className="text-sm font-black text-slate-900">
              قائمة أنواع العقود المعرفة وحالة تشغيلها على النظام ({filteredTypes.length})
            </h4>
          </div>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="ابحث في أنواع العقود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-300 bg-white pr-3 pl-8 text-xs font-bold text-slate-800 outline-none focus:border-[#0070c0]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right text-xs">
            <thead>
              <tr className="bg-[#005799] text-white">
                <th className="border-l border-white/15 px-3 py-3 font-extrabold">#</th>
                <th className="border-l border-white/15 px-3 py-3 font-extrabold">نوع العقد</th>
                <th className="border-l border-white/15 px-3 py-3 font-extrabold">نمط العقد</th>
                <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                  تاريخ البداية الافتراضي
                </th>
                <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                  تاريخ النهاية الافتراضي
                </th>
                <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                  المدة المحسوبة
                </th>
                <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                  الإجازة / الدوام
                </th>
                <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                  الإجراء عند الانتهاء
                </th>
                <th className="border-l border-white/15 px-3 py-3 text-center font-extrabold">
                  التشغيل على النظام
                </th>
                <th className="px-3 py-3 text-center font-extrabold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTypes.map((item, idx) => {
                const dur = calculateDurationBetweenDates(
                  item.defaultStartDate,
                  item.defaultEndDate,
                );
                return (
                  <tr key={item.id} className="hover:bg-sky-50/40">
                    <td className="px-3 py-3 font-bold text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-3">
                      <div className="font-black text-slate-900">{item.name_ar}</div>
                      <div className="text-[11px] font-medium text-slate-500">
                        {item.name_en} • <span className="font-mono">{item.code}</span>
                      </div>
                      {item.description && (
                        <div className="mt-0.5 text-[11px] text-slate-500">{item.description}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                          item.dateMode === "start_and_end"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <MaterialIcon
                          name={item.dateMode === "start_and_end" ? "date_range" : "all_inclusive"}
                          size={14}
                        />
                        {item.dateMode === "start_and_end"
                          ? "بتاريخ بداية ونهاية"
                          : "غير محدد المدة"}
                      </span>
                      {item.isAjeer && (
                        <span className="mr-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                          أجير
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-emerald-700">
                      {item.defaultStartDate || "—"}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-rose-700">
                      {item.dateMode === "start_and_end" ? item.defaultEndDate : "متجدد تلقائياً"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="rounded-lg bg-sky-50 px-2.5 py-1 font-extrabold text-[#005799]">
                        {dur.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700">
                      {item.defaultLeaveDays} يوم • {item.workType}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[11px] font-bold text-slate-600">
                        {item.autoExpireAction === "suspend_on_end"
                          ? "إيقاف تلقائي عند النهاية"
                          : item.autoExpireAction === "auto_renew"
                            ? "تجديد تلقائي"
                            : `تنبيه قبل ${item.notifyBeforeDays} يوم`}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleContractTypeActive(item.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-black transition ${
                          item.isActive
                            ? "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        <MaterialIcon
                          name={item.isActive ? "check_circle" : "pause_circle"}
                          size={15}
                        />
                        {item.isActive ? "مشغل على النظام" : "متوقف (اضغط للتشغيل)"}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-lg bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-[#0070c0] hover:bg-sky-100"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => removeContractType(item.id)}
                          className="rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100"
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
      </div>
    </div>
  );
}
