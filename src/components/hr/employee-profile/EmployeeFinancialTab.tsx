import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  HandCoins,
  Package,
  Save,
  Plus,
  Trash2,
  Clock,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import {
  ProfileField,
  ClearableSelect,
  FileUploadBox,
  AttachmentPreviewCell,
  ProfileGridTable,
  fieldInputClass,
  formatNumber,
} from "./shared";
import { useRows, useSaveRow, useDeleteRow } from "@/lib/hr-db";

interface EmployeeFinancialTabProps {
  employee: any;
  onSaveEmployee: (patch: Record<string, any>) => Promise<void>;
  profileExtras: any;
  onSaveExtras: (patch: Record<string, any>) => void;
}

export function EmployeeFinancialTab({
  employee,
  onSaveEmployee,
  profileExtras,
  onSaveExtras,
}: EmployeeFinancialTabProps) {
  const [subTab, setSubTab] = useState<
    | "basic_financial"
    | "entitlements"
    | "deductions"
    | "penalties"
    | "loans"
    | "custody"
  >("basic_financial");

  const [entSection, setEntSection] = useState<"active" | "pending">("active");
  const [dedSection, setDedSection] = useState<"active" | "pending">("active");
  const [penSection, setPenSection] = useState<"active" | "pending">("active");
  const [custodySection, setCustodySection] = useState<"students" | "warehouse">(
    "students",
  );

  // Database tables
  const { data: allEntitlementDefs = [] } = useRows("entitlements") as { data?: any[] };
  const { data: allEmpEntitlements = [] } = useRows("employee_entitlements") as { data?: any[] };
  const saveEmpEntitlement = useSaveRow("employee_entitlements");
  const deleteEmpEntitlement = useDeleteRow("employee_entitlements");

  const { data: allDeductionDefs = [] } = useRows("deductions") as { data?: any[] };
  const { data: allEmpDeductions = [] } = useRows("employee_deductions") as { data?: any[] };
  const saveEmpDeduction = useSaveRow("employee_deductions");
  const deleteEmpDeduction = useDeleteRow("employee_deductions");

  const { data: allLoans = [] } = useRows("loans") as { data?: any[] };

  const empEntitlements = allEmpEntitlements.filter(
    (e) =>
      String(e.employee_id) === String(employee.id) ||
      String(e.emp_no) === String(employee.emp_no),
  );
  const empDeductions = allEmpDeductions.filter(
    (d) =>
      String(d.employee_id) === String(employee.id) ||
      String(d.emp_no) === String(employee.emp_no),
  );
  const empLoans = allLoans.filter(
    (l) =>
      String(l.employee_id) === String(employee.id) ||
      String(l.emp_no) === String(employee.emp_no) ||
      String(l.employee_name) === String(employee.full_name),
  );

  // 1. Basic Financial Form
  const [finForm, setFinForm] = useState({
    job_category: profileExtras.job_category || "الفئة الأولى",
    contract_category:
      profileExtras.contract_category || employee.contract_type || "عقد موحد",
    basic_salary: String(employee.basic_salary ?? 0),
    sponsor_name: profileExtras.sponsor_name || "الشركة الرئيسية",
    payment_method:
      profileExtras.payment_method ||
      (employee.iban ? "تحويل بنكي" : "تحويل بنكي"),
    bank_name: employee.bank_name || "مصرف الراجحي",
    iban: employee.iban || "",
    approver_name: profileExtras.approver_name || "المدير العام",
    custody_account: profileExtras.custody_account || "حساب عهد الموظفين",
    labor_office_no: profileExtras.labor_office_no || "",
    mawarid_registered: Boolean(profileExtras.mawarid_registered ?? false),
  });

  useEffect(() => {
    setFinForm({
      job_category: profileExtras.job_category || "الفئة الأولى",
      contract_category:
        profileExtras.contract_category || employee.contract_type || "عقد موحد",
      basic_salary: String(employee.basic_salary ?? 0),
      sponsor_name: profileExtras.sponsor_name || "الشركة الرئيسية",
      payment_method: profileExtras.payment_method || "تحويل بنكي",
      bank_name: employee.bank_name || "مصرف الراجحي",
      iban: employee.iban || "",
      approver_name: profileExtras.approver_name || "المدير العام",
      custody_account: profileExtras.custody_account || "حساب عهد الموظفين",
      labor_office_no: profileExtras.labor_office_no || "",
      mawarid_registered: Boolean(profileExtras.mawarid_registered ?? false),
    });
  }, [employee, profileExtras]);

  const handleSaveBasicFinancial = async () => {
    await onSaveEmployee({
      basic_salary: Number(finForm.basic_salary) || 0,
      bank_name: finForm.bank_name,
      iban: finForm.iban,
    });
    onSaveExtras({
      ...finForm,
    });
    toast.success("تم حفظ البيانات المالية الأساسية بنجاح");
  };

  // 2. Entitlements Form
  const [entForm, setEntForm] = useState({
    entitlement_name: "بدل سكن",
    amount: "",
    months: "كل الشهور",
    default_value: "0",
    reason: "",
    attachment: "",
  });

  const handleAddEntitlement = async () => {
    if (!entForm.entitlement_name || !entForm.amount) {
      toast.error("يرجى اختيار الاستحقاق وإدخال القيمة");
      return;
    }
    const amt = Number(entForm.amount) || 0;
    await saveEmpEntitlement.mutateAsync({
      employee_id: employee.id,
      emp_no: employee.emp_no,
      entitlement_name: entForm.entitlement_name,
      amount: amt,
      is_percentage: false,
      notes: `${entForm.months} | ${entForm.reason || ""}`.trim(),
    });

    // If housing or transport allowance, also sync to employee record
    if (entForm.entitlement_name.includes("سكن")) {
      await onSaveEmployee({ housing_allowance: amt });
    } else if (entForm.entitlement_name.includes("نقل") || entForm.entitlement_name.includes("مواصلات")) {
      await onSaveEmployee({ transport_allowance: amt });
    } else {
      await onSaveEmployee({
        other_allowance: Number(employee.other_allowance || 0) + amt,
      });
    }

    onSaveExtras({
      ent_archive: [
        {
          id: `ea-${Date.now()}`,
          field_name: entForm.entitlement_name,
          old_value: "0",
          new_value: String(amt),
          modified_at: new Date().toISOString().slice(0, 10),
          user: "مدير النظام",
        },
        ...(profileExtras.ent_archive || []),
      ],
    });

    setEntForm({
      ...entForm,
      amount: "",
      reason: "",
      attachment: "",
    });
    toast.success("تم حفظ الاستحقاق للموظف بنجاح");
  };

  // Build combined display rows for Entitlements (including employee's housing & transport if not in employee_entitlements)
  const combinedEntitlementRows = [
    ...(Number(employee.housing_allowance || 0) > 0 &&
    !empEntitlements.some((e) => String(e.entitlement_name).includes("سكن"))
      ? [
          {
            id: "builtin-housing",
            entitlement_name: "بدل سكن",
            status: "مفعل",
            is_custom: "نعم",
            assigned_date: employee.start_date || "2024-01-01",
            months: "كل الشهور",
            amount: Number(employee.housing_allowance || 0),
            notes: "بدل سكن أساسي",
            user: "النظام",
            attachment: "—",
            builtin: true,
          },
        ]
      : []),
    ...(Number(employee.transport_allowance || 0) > 0 &&
    !empEntitlements.some((e) => String(e.entitlement_name).includes("نقل"))
      ? [
          {
            id: "builtin-transport",
            entitlement_name: "بدل نقل",
            status: "مفعل",
            is_custom: "نعم",
            assigned_date: employee.start_date || "2024-01-01",
            months: "كل الشهور",
            amount: Number(employee.transport_allowance || 0),
            notes: "بدل نقل أساسي",
            user: "النظام",
            attachment: "—",
            builtin: true,
          },
        ]
      : []),
    ...empEntitlements.map((e) => ({
      id: e.id,
      entitlement_name: e.entitlement_name,
      status: "مفعل",
      is_custom: "نعم",
      assigned_date: (e.created_at || "").slice(0, 10) || "2026-01-01",
      months: String(e.notes || "").split("|")[0] || "كل الشهور",
      amount: Number(e.amount || 0),
      notes: String(e.notes || "").split("|")[1] || e.notes || "—",
      user: "مدير النظام",
      attachment: "—",
      builtin: false,
    })),
  ];

  // 3. Deductions Form
  const [dedForm, setDedForm] = useState({
    year: "2026",
    months: "كل الشهور",
    deduction_name: "التأمينات الاجتماعية",
    default_value: "0",
    amount: "",
    notes: "",
    attachment: "",
  });

  const handleAddDeduction = async () => {
    if (!dedForm.deduction_name || !dedForm.amount) {
      toast.error("يرجى اختيار الاستقطاع وإدخال القيمة");
      return;
    }
    await saveEmpDeduction.mutateAsync({
      employee_id: employee.id,
      emp_no: employee.emp_no,
      deduction_name: dedForm.deduction_name,
      amount: Number(dedForm.amount) || 0,
      is_percentage: false,
      notes: `${dedForm.year}-${dedForm.months} | ${dedForm.notes || ""} | ${dedForm.attachment || ""}`.trim(),
    });
    setDedForm({
      ...dedForm,
      amount: "",
      notes: "",
      attachment: "",
    });
    toast.success("تم حفظ الاستقطاع بنجاح");
  };

  // 4. Penalties Form
  const [penForm, setPenForm] = useState({
    penalty_type: "إنذار كتابي مع خصم",
    year: "2026",
    month: "04",
    day: "2026-04-12",
    amount: "",
    details: "",
    attachment: "",
  });

  const handleAddPenalty = () => {
    if (!penForm.penalty_type || !penForm.amount) {
      toast.error("يرجى اختيار الجزاء وإدخال القيمة");
      return;
    }
    const list = profileExtras.penalties || [];
    onSaveExtras({
      penalties: [
        {
          id: `pen-${Date.now()}`,
          penalty_type: penForm.penalty_type,
          date: penForm.day,
          amount: Number(penForm.amount) || 0,
          user: "مدير النظام",
          assigned_date: new Date().toISOString().slice(0, 10),
          details: penForm.details,
          attachment: penForm.attachment || "—",
        },
        ...list,
      ],
    });
    setPenForm({ ...penForm, amount: "", details: "", attachment: "" });
    toast.success("تم تسجيل الجزاء بنجاح");
  };

  const subTabs = [
    {
      key: "basic_financial" as const,
      label: "البيانات المالية الأساسية",
      icon: Wallet,
    },
    { key: "entitlements" as const, label: "الاستحقاقات", icon: TrendingUp },
    { key: "deductions" as const, label: "الاستقطاعات", icon: TrendingDown },
    { key: "penalties" as const, label: "الجزاءات", icon: AlertTriangle },
    { key: "loans" as const, label: "السلف", icon: HandCoins },
    { key: "custody" as const, label: "العهد", icon: Package },
  ];

  return (
    <div className="space-y-4">
      {/* 6 Sub-tabs bar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs">
        {subTabs.map((t) => {
          const Icon = t.icon;
          const active = subTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setSubTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                active
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ================= 1. البيانات المالية الأساسية ================= */}
      {subTab === "basic_financial" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Panel 1 (Right): Salary & Category */}
            <div className="space-y-3.5 rounded-xl border border-slate-100 bg-slate-50/40 p-4">
              <ProfileField label="الفئة الوظيفية">
                <ClearableSelect
                  value={finForm.job_category}
                  onChange={(v) =>
                    setFinForm((p) => ({ ...p, job_category: v }))
                  }
                  options={[
                    "الإدارة العليا",
                    "الفئة الأولى",
                    "الفئة الثانية",
                    "الفئة الثالثة",
                  ]}
                />
              </ProfileField>

              <ProfileField label="فئات العقد">
                <ClearableSelect
                  value={finForm.contract_category}
                  onChange={(v) =>
                    setFinForm((p) => ({ ...p, contract_category: v }))
                  }
                  options={["عقد موحد", "عقد سعودي", "عقد وافد", "عقد مرن"]}
                />
              </ProfileField>

              <ProfileField label="الراتب الاساسى" required>
                <input
                  type="number"
                  dir="ltr"
                  className={fieldInputClass}
                  value={finForm.basic_salary}
                  onChange={(e) =>
                    setFinForm((p) => ({ ...p, basic_salary: e.target.value }))
                  }
                />
              </ProfileField>

              <ProfileField label="اسم الكفيل">
                <input
                  type="text"
                  className={fieldInputClass}
                  value={finForm.sponsor_name}
                  onChange={(e) =>
                    setFinForm((p) => ({ ...p, sponsor_name: e.target.value }))
                  }
                />
              </ProfileField>
            </div>

            {/* Panel 2 (Middle): Payment Method & Bank */}
            <div className="space-y-3.5 rounded-xl border border-slate-100 bg-slate-50/40 p-4">
              <ProfileField label="طريقة القبض">
                <ClearableSelect
                  value={finForm.payment_method}
                  onChange={(v) =>
                    setFinForm((p) => ({ ...p, payment_method: v }))
                  }
                  options={["تحويل بنكي", "نقدي (كاش)", "شيك مصرفي"]}
                />
              </ProfileField>

              <ProfileField label="اسم البنك">
                <ClearableSelect
                  value={finForm.bank_name}
                  onChange={(v) => setFinForm((p) => ({ ...p, bank_name: v }))}
                  options={[
                    "مصرف الراجحي",
                    "البنك الأهلي السعودي (SNB)",
                    "بنك الرياض",
                    "مصرف الإنماء",
                    "بنك البلاد",
                    "البنك السعودي الفرنسي",
                    "بنك الجزيرة",
                  ]}
                />
              </ProfileField>

              <ProfileField label="رقم الحساب / الآيبان (IBAN)">
                <input
                  type="text"
                  dir="ltr"
                  className={fieldInputClass}
                  value={finForm.iban}
                  onChange={(e) =>
                    setFinForm((p) => ({ ...p, iban: e.target.value }))
                  }
                  placeholder="SA0000000000000000000000"
                />
              </ProfileField>
            </div>

            {/* Panel 3 (Left): Approvals & Mawarid */}
            <div className="space-y-3.5 rounded-xl border border-slate-100 bg-slate-50/40 p-4">
              <ProfileField label="اسم صاحب الموافقة">
                <ClearableSelect
                  value={finForm.approver_name}
                  onChange={(v) =>
                    setFinForm((p) => ({ ...p, approver_name: v }))
                  }
                  options={[
                    "المدير العام",
                    "مدير الموارد البشرية",
                    "المدير المالي",
                  ]}
                />
              </ProfileField>

              <ProfileField label="حساب العهد">
                <ClearableSelect
                  value={finForm.custody_account}
                  onChange={(v) =>
                    setFinForm((p) => ({ ...p, custody_account: v }))
                  }
                  options={[
                    "حساب عهد الموظفين",
                    "حساب العهد المستديمة",
                    "حساب العهد المؤقتة",
                  ]}
                />
              </ProfileField>

              <ProfileField label="رقم مكتب العمل">
                <input
                  type="text"
                  dir="ltr"
                  className={fieldInputClass}
                  value={finForm.labor_office_no}
                  onChange={(e) =>
                    setFinForm((p) => ({
                      ...p,
                      labor_office_no: e.target.value,
                    }))
                  }
                />
              </ProfileField>

              <div className="pt-4">
                <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={finForm.mawarid_registered}
                    onChange={(e) =>
                      setFinForm((p) => ({
                        ...p,
                        mawarid_registered: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>مقيد موارد</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleSaveBasicFinancial}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <Save className="h-4 w-4" />
              حفظ
            </button>
          </div>
        </div>
      )}

      {/* ================= 2. الاستحقاقات ================= */}
      {subTab === "entitlements" && (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Right Sidebar */}
          <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:w-64">
            <h3 className="mb-2.5 border-b border-slate-100 px-2 pb-2 text-xs font-extrabold text-slate-500">
              أقسام الاستحقاقات
            </h3>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setEntSection("active")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                  entSection === "active"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span>الاستحقاقات</span>
              </button>
              <button
                type="button"
                onClick={() => setEntSection("pending")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                  entSection === "pending"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Clock className="h-4 w-4 shrink-0" />
                <span>استحقاقات قيد التنفيذ</span>
              </button>
            </div>
          </div>

          {/* Left Content */}
          <div className="flex-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ProfileField label="الاستحقاق">
                  <ClearableSelect
                    value={entForm.entitlement_name}
                    onChange={(v) =>
                      setEntForm((p) => ({ ...p, entitlement_name: v }))
                    }
                    options={
                      allEntitlementDefs.length > 0
                        ? allEntitlementDefs.map((e) => String(e.name))
                        : [
                            "بدل سكن",
                            "بدل نقل",
                            "بدل طبيعة عمل",
                            "بدل اتصالات",
                            "بدل تمثيل",
                            "مكافأة تميز",
                          ]
                    }
                  />
                </ProfileField>

                <ProfileField label="القيمة">
                  <input
                    type="number"
                    dir="ltr"
                    className={fieldInputClass}
                    value={entForm.amount}
                    onChange={(e) =>
                      setEntForm((p) => ({ ...p, amount: e.target.value }))
                    }
                  />
                </ProfileField>

                <ProfileField label="الشهور">
                  <ClearableSelect
                    value={entForm.months}
                    onChange={(v) => setEntForm((p) => ({ ...p, months: v }))}
                    options={[
                      "كل الشهور",
                      "يناير",
                      "فبراير",
                      "مارس",
                      "أبريل",
                      "مايو",
                      "يونيو",
                      "يوليو",
                      "أغسطس",
                      "سبتمبر",
                      "أكتوبر",
                      "نوفمبر",
                      "ديسمبر",
                    ]}
                  />
                </ProfileField>

                <ProfileField label="افتراضى">
                  <input
                    type="text"
                    dir="ltr"
                    readOnly
                    className={`${fieldInputClass} bg-slate-50`}
                    value={entForm.default_value}
                  />
                </ProfileField>

                <ProfileField label="السبب" className="lg:col-span-2">
                  <input
                    type="text"
                    className={fieldInputClass}
                    value={entForm.reason}
                    onChange={(e) =>
                      setEntForm((p) => ({ ...p, reason: e.target.value }))
                    }
                  />
                </ProfileField>

                <ProfileField label="المرفقات" className="lg:col-span-2">
                  <FileUploadBox
                    fileName={entForm.attachment}
                    onFileSelect={(name) =>
                      setEntForm((p) => ({ ...p, attachment: name }))
                    }
                  />
                </ProfileField>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddEntitlement}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4" />
                  حفظ
                </button>
              </div>
            </div>

            <ProfileGridTable
              columns={[
                { key: "entitlement_name", label: "الاستحقاق" },
                {
                  key: "status",
                  label: "حاله الاستحقاق",
                  render: (r) => (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      {r.status}
                    </span>
                  ),
                },
                { key: "is_custom", label: "مخصص" },
                { key: "assigned_date", label: "تاريخ التخصيص" },
                { key: "months", label: "الشهور" },
                {
                  key: "amount",
                  label: "القيمة",
                  render: (r) => formatNumber(Number(r.amount || 0)),
                },
                { key: "notes", label: "ملاحظات" },
                { key: "user", label: "المستخدم" },
                { key: "attachment", label: "المرفقات" },
                {
                  key: "del",
                  label: "حذف",
                  render: (r) =>
                    !r.builtin ? (
                      <button
                        type="button"
                        onClick={() =>
                          deleteEmpEntitlement.mutate(String(r.id), {
                            onSuccess: () => toast.success("تم حذف الاستحقاق"),
                          })
                        }
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    ),
                },
              ]}
              rows={entSection === "active" ? combinedEntitlementRows : []}
            />
          </div>
        </div>
      )}

      {/* ================= 3. الاستقطاعات ================= */}
      {subTab === "deductions" && (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Right Sidebar */}
          <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:w-64">
            <h3 className="mb-2.5 border-b border-slate-100 px-2 pb-2 text-xs font-extrabold text-slate-500">
              أقسام الاستقطاعات
            </h3>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setDedSection("active")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                  dedSection === "active"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <TrendingDown className="h-4 w-4 shrink-0" />
                <span>الاستقطاعات</span>
              </button>
              <button
                type="button"
                onClick={() => setDedSection("pending")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                  dedSection === "pending"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Clock className="h-4 w-4 shrink-0" />
                <span>استقطاعات قيد التنفيذ</span>
              </button>
            </div>
          </div>

          {/* Left Content */}
          <div className="flex-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ProfileField label="السنه">
                  <ClearableSelect
                    value={dedForm.year}
                    onChange={(v) => setDedForm((p) => ({ ...p, year: v }))}
                    options={["2025", "2026", "2027"]}
                  />
                </ProfileField>

                <ProfileField label="الشهور">
                  <ClearableSelect
                    value={dedForm.months}
                    onChange={(v) => setDedForm((p) => ({ ...p, months: v }))}
                    options={[
                      "كل الشهور",
                      "يناير",
                      "فبراير",
                      "مارس",
                      "أبريل",
                      "مايو",
                      "يونيو",
                      "يوليو",
                      "أغسطس",
                      "سبتمبر",
                      "أكتوبر",
                      "نوفمبر",
                      "ديسمبر",
                    ]}
                  />
                </ProfileField>

                <ProfileField label="الاستقطاع">
                  <ClearableSelect
                    value={dedForm.deduction_name}
                    onChange={(v) =>
                      setDedForm((p) => ({ ...p, deduction_name: v }))
                    }
                    options={
                      allDeductionDefs.length > 0
                        ? allDeductionDefs.map((d) => String(d.name))
                        : [
                            "التأمينات الاجتماعية",
                            "خصم تأخير",
                            "خصم غياب",
                            "قسط سلفة",
                            "خصم إداري",
                          ]
                    }
                  />
                </ProfileField>

                <ProfileField label="افتراضى">
                  <input
                    type="text"
                    dir="ltr"
                    readOnly
                    className={`${fieldInputClass} bg-slate-50`}
                    value={dedForm.default_value}
                  />
                </ProfileField>

                <ProfileField label="القيمه">
                  <input
                    type="number"
                    dir="ltr"
                    className={fieldInputClass}
                    value={dedForm.amount}
                    onChange={(e) =>
                      setDedForm((p) => ({ ...p, amount: e.target.value }))
                    }
                  />
                </ProfileField>

                <ProfileField label="ملاحظات">
                  <input
                    type="text"
                    className={fieldInputClass}
                    value={dedForm.notes}
                    onChange={(e) =>
                      setDedForm((p) => ({ ...p, notes: e.target.value }))
                    }
                  />
                </ProfileField>

                <ProfileField label="المرفقات" className="lg:col-span-2">
                  <FileUploadBox
                    fileName={dedForm.attachment}
                    onFileSelect={(name) =>
                      setDedForm((p) => ({ ...p, attachment: name }))
                    }
                  />
                </ProfileField>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddDeduction}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4" />
                  حفظ
                </button>
              </div>
            </div>

            <ProfileGridTable
              columns={[
                { key: "deduction_name", label: "الاستقطاع" },
                {
                  key: "status",
                  label: "الحاله",
                  render: () => (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                      مفعل
                    </span>
                  ),
                },
                {
                  key: "amount",
                  label: "القيمة",
                  render: (r) => formatNumber(Number(r.amount || 0)),
                },
                {
                  key: "months",
                  label: "الشهور",
                  render: (r) =>
                    String(r.notes || "").split("|")[0] || "كل الشهور",
                },
                {
                  key: "user",
                  label: "المستخدم",
                  render: () => "مدير النظام",
                },
                { key: "custom", label: "مخصص", render: () => "نعم" },
                {
                  key: "created_at",
                  label: "تاريخ التخصيص",
                  render: (r) =>
                    (r.created_at || "").slice(0, 10) || "2026-01-01",
                },
                {
                  key: "notes",
                  label: "ملاحظات",
                  render: (r) =>
                    String(r.notes || "").split("|")[1] || r.notes || "—",
                },
                {
                  key: "attachment",
                  label: "المرفقات",
                  render: (r) => (
                    <AttachmentPreviewCell
                      value={
                        (String(r.notes || "").split("|")[2] || "").trim() ||
                        r.attachment
                      }
                    />
                  ),
                },
                {
                  key: "del",
                  label: "حذف",
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() =>
                        deleteEmpDeduction.mutate(String(r.id), {
                          onSuccess: () => toast.success("تم حذف الاستقطاع"),
                        })
                      }
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ),
                },
              ]}
              rows={dedSection === "active" ? empDeductions : []}
            />
          </div>
        </div>
      )}

      {/* ================= 4. الجزاءات ================= */}
      {subTab === "penalties" && (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Right Sidebar */}
          <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:w-64">
            <h3 className="mb-2.5 border-b border-slate-100 px-2 pb-2 text-xs font-extrabold text-slate-500">
              أقسام الجزاءات
            </h3>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setPenSection("active")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                  penSection === "active"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>الجزاءات</span>
              </button>
              <button
                type="button"
                onClick={() => setPenSection("pending")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                  penSection === "pending"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Clock className="h-4 w-4 shrink-0" />
                <span>جزاءات قيد التنفيذ</span>
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ProfileField label="الجزاء">
                  <ClearableSelect
                    value={penForm.penalty_type}
                    onChange={(v) =>
                      setPenForm((p) => ({ ...p, penalty_type: v }))
                    }
                    options={[
                      "لفت نظر",
                      "إنذار كتابي مع خصم",
                      "خصم يوم عمل",
                      "خصم يومين عمل",
                      "خصم مخالفة لائحة العمل",
                    ]}
                  />
                </ProfileField>

                <ProfileField label="السنه">
                  <ClearableSelect
                    value={penForm.year}
                    onChange={(v) => setPenForm((p) => ({ ...p, year: v }))}
                    options={["2025", "2026", "2027"]}
                  />
                </ProfileField>

                <ProfileField label="الشهور">
                  <ClearableSelect
                    value={penForm.month}
                    onChange={(v) => setPenForm((p) => ({ ...p, month: v }))}
                    options={[
                      "01",
                      "02",
                      "03",
                      "04",
                      "05",
                      "06",
                      "07",
                      "08",
                      "09",
                      "10",
                      "11",
                      "12",
                    ]}
                  />
                </ProfileField>

                <ProfileField label="يوم">
                  <input
                    type="date"
                    dir="ltr"
                    className={fieldInputClass}
                    value={penForm.day}
                    onChange={(e) =>
                      setPenForm((p) => ({ ...p, day: e.target.value }))
                    }
                  />
                </ProfileField>

                <ProfileField label="القيمة">
                  <input
                    type="number"
                    dir="ltr"
                    className={fieldInputClass}
                    value={penForm.amount}
                    onChange={(e) =>
                      setPenForm((p) => ({ ...p, amount: e.target.value }))
                    }
                  />
                </ProfileField>

                <ProfileField label="تفاصيل">
                  <input
                    type="text"
                    className={fieldInputClass}
                    value={penForm.details}
                    onChange={(e) =>
                      setPenForm((p) => ({ ...p, details: e.target.value }))
                    }
                  />
                </ProfileField>

                <ProfileField label="المرفقات" className="lg:col-span-2">
                  <FileUploadBox
                    fileName={penForm.attachment}
                    onFileSelect={(name) =>
                      setPenForm((p) => ({ ...p, attachment: name }))
                    }
                  />
                </ProfileField>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddPenalty}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4" />
                  حفظ
                </button>
              </div>
            </div>

            <ProfileGridTable
              columns={[
                { key: "penalty_type", label: "الجزاء" },
                { key: "date", label: "التاريخ" },
                {
                  key: "amount",
                  label: "القيمة",
                  render: (r) => formatNumber(Number(r.amount || 0)),
                },
                { key: "user", label: "المستخدم" },
                { key: "assigned_date", label: "تاريخ التخصيص" },
                { key: "attachment", label: "المرفقات" },
              ]}
              rows={
                penSection === "active" ? profileExtras.penalties || [] : []
              }
            />
          </div>
        </div>
      )}

      {/* ================= 5. السلف ================= */}
      {subTab === "loans" && (
        <div className="space-y-4">
          <ProfileGridTable
            columns={[
              {
                key: "branch",
                label: "الفرع",
                render: (r) => r.branch || employee.branch || "الفرع الرئيسي",
              },
              {
                key: "department",
                label: "القسم",
                render: (r) =>
                  r.department || employee.department || "الموارد البشرية",
              },
              {
                key: "amount",
                label: "القيمة المطلوبة",
                render: (r) => formatNumber(Number(r.amount || 0)),
              },
              {
                key: "approved_amount",
                label: "القيمة المعتمدة",
                render: (r) =>
                  formatNumber(Number(r.approved_amount ?? r.amount ?? 0)),
              },
              {
                key: "paid_amount",
                label: "المسدد",
                render: (r) => formatNumber(Number(r.paid_amount || 0)),
              },
              {
                key: "created_at",
                label: "تاريخ ادخال السلفة",
                render: (r) =>
                  (r.created_at || "").slice(0, 10) ||
                  r.start_date ||
                  "2026-01-01",
              },
              {
                key: "start_date",
                label: "تاريخ طلب السلفة",
                render: (r) => r.start_date || "2026-01-01",
              },
              {
                key: "disbursed",
                label: "تم الصرف",
                render: (r) => (r.status === "approved" ? "نعم" : "قيد الصرف"),
              },
              {
                key: "payment_method",
                label: "طريقة السداد",
                render: () => "استقطاع من الراتب",
              },
              {
                key: "status",
                label: "حالة الطلب",
                render: (r) => (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                    {r.status === "approved"
                      ? "معتمد"
                      : r.status || "معتمد"}
                  </span>
                ),
              },
              { key: "notes", label: "ملاحظات" },
              {
                key: "attachment",
                label: "المرفقات",
                render: (r) => <AttachmentPreviewCell value={r.attachment} />,
              },
            ]}
            rows={empLoans}
          />
        </div>
      )}

      {/* ================= 6. العهد ================= */}
      {subTab === "custody" && (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Right Sidebar */}
          <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:w-64">
            <h3 className="mb-2.5 border-b border-slate-100 px-2 pb-2 text-xs font-extrabold text-slate-500">
              أقسام العهد
            </h3>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setCustodySection("students")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                  custodySection === "students"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span>عهد الطلاب</span>
              </button>
              <button
                type="button"
                onClick={() => setCustodySection("warehouse")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                  custodySection === "warehouse"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Package className="h-4 w-4 shrink-0" />
                <span>عهد المستودعات</span>
              </button>
            </div>
          </div>

          <div className="flex-1">
            {custodySection === "students" && (
              <ProfileGridTable
                columns={[
                  { key: "guardian", label: "ولى الامر" },
                  { key: "student_name", label: "اسم الطالب" },
                  { key: "school_name", label: "اسم المدرسة" },
                  { key: "year", label: "السنه" },
                  { key: "remaining_amount", label: "المبلغ المتبقى" },
                ]}
                rows={profileExtras.student_custody || []}
              />
            )}

            {custodySection === "warehouse" && (
              <ProfileGridTable
                columns={[
                  { key: "custody_no", label: "رقم العهدة" },
                  { key: "item_name", label: "اسم الصنف" },
                  { key: "quantity", label: "الكمية" },
                  { key: "received_date", label: "تاريخ الاستلام" },
                  { key: "status", label: "الحالة" },
                  { key: "notes", label: "ملاحظات" },
                ]}
                rows={profileExtras.warehouse_custody || []}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
