import React, { useState, useEffect } from "react";
import {
  User,
  Briefcase,
  ShieldCheck,
  Phone,
  FileText,
  History,
  FileSignature,
  FolderOpen,
  HeartPulse,
  Users,
  Archive,
  Save,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  GraduationCap,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import {
  ProfileField,
  ClearableSelect,
  FileUploadBox,
  AttachmentPreviewCell,
  ProfileGridTable,
  fieldInputClass,
  toHijriDate,
} from "./shared";
import { useRows, useSaveRow, useDeleteRow } from "@/lib/hr-db";

interface EmployeeDataTabProps {
  employee: any;
  onSaveEmployee: (patch: Record<string, any>) => Promise<void>;
  profileExtras: any;
  onSaveExtras: (patch: Record<string, any>) => void;
}

export function EmployeeDataTab({
  employee,
  onSaveEmployee,
  profileExtras,
  onSaveExtras,
}: EmployeeDataTabProps) {
  const [subTab, setSubTab] = useState<
    "basic" | "contracts" | "documents" | "medical" | "dependents" | "archive"
  >("basic");

  // Sub-section states for tabs with right sidebars
  const [basicSection, setBasicSection] = useState<
    "personal" | "work" | "gosi" | "contact" | "notes" | "creation_archive"
  >("personal");
  const [docsSection, setDocsSection] = useState<
    "docs" | "qualifications" | "courses" | "experience"
  >("docs");
  const [dependentsSection, setDependentsSection] = useState<
    "relatives_data" | "relatives_medical"
  >("relatives_data");
  const [archiveSection, setArchiveSection] = useState<
    "emp_archive" | "ent_archive"
  >("emp_archive");

  // Database rows for documents & relatives
  const { data: allDocuments = [] } = useRows("employee_documents") as { data?: any[] };
  const saveDocument = useSaveRow("employee_documents");
  const deleteDocument = useDeleteRow("employee_documents");

  const { data: allRelatives = [] } = useRows("employee_relatives") as { data?: any[] };
  const saveRelative = useSaveRow("employee_relatives");
  const deleteRelative = useDeleteRow("employee_relatives");

  const { data: allShiftGroups = [] } = useRows("work_shift_groups") as { data?: any[] };
  const { data: idTypeLookups = [] } = useRows("basic_lookups", {
    filters: { category: "نوع الهوية" },
  }) as { data?: any[] };

  const idTypeOptions = React.useMemo(() => {
    const list = idTypeLookups
      .filter((l: any) => l.active !== false && l.name)
      .map((l: any) => String(l.name));
    if (list.length > 0) return list;
    return ["الهوية الوطنية", "الإقامة", "جواز سفر", "الرقم القومي"];
  }, [idTypeLookups]);

  const empDocuments = allDocuments.filter(
    (d) =>
      String(d.employee_id) === String(employee.id) ||
      String(d.emp_no) === String(employee.emp_no),
  );
  const empRelatives = allRelatives.filter(
    (r) =>
      String(r.employee_id) === String(employee.id) ||
      String(r.emp_no) === String(employee.emp_no),
  );

  // Editable form state synced with employee + profileExtras
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    setForm({
      ...profileExtras,
      ...employee,
      fingerprint_no:
        employee.fingerprint_no ||
        profileExtras.fingerprint_no ||
        employee.emp_no ||
        "",
      id_type:
        employee.id_type ||
        profileExtras.id_type ||
        (String(employee.national_id || "").startsWith("1")
          ? "هوية وطنية"
          : "إقامة"),
      religion: employee.religion || profileExtras.religion || "مسلم",
      gender:
        employee.gender === "F" || employee.gender === "انثى"
          ? "انثى"
          : "ذكر",
      marital_status:
        employee.marital_status || profileExtras.marital_status || "متزوج",
      family_members_count:
        employee.family_members_count ??
        profileExtras.family_members_count ??
        3,
      region: employee.region || profileExtras.region || "المنطقة الوسطى",
      main_department:
        employee.main_department ||
        profileExtras.main_department ||
        employee.department ||
        "الإدارة العامة",
      career_path:
        employee.career_path || profileExtras.career_path || "المسار الإداري",
      sector: employee.sector || profileExtras.sector || "القطاع الخاص",
      job_level:
        employee.job_level || profileExtras.job_level || "المستوى الأول",
      direct_manager:
        employee.direct_manager ||
        profileExtras.direct_manager ||
        "المدير العام",
      shift_group:
        employee.shift_group ||
        profileExtras.shift_group ||
        allShiftGroups[0]?.name ||
        "الاداريين",
      specialization:
        employee.specialization ||
        profileExtras.specialization ||
        employee.job_title ||
        "إدارة أعمال",
      job_designation:
        employee.job_designation ||
        profileExtras.job_designation ||
        employee.job_title ||
        "",
      hire_date:
        employee.hire_date ||
        profileExtras.hire_date ||
        employee.start_date ||
        "2023-01-01",
      start_date:
        employee.start_date ||
        profileExtras.start_date ||
        employee.hire_date ||
        "2023-01-01",
      leave_calc_date:
        employee.leave_calc_date ||
        profileExtras.leave_calc_date ||
        employee.start_date ||
        "2023-01-01",
      experience_years:
        employee.experience_years ?? profileExtras.experience_years ?? 5,
      probation_days:
        employee.probation_days ?? profileExtras.probation_days ?? 90,
      kingdom_entry_date:
        employee.kingdom_entry_date ||
        profileExtras.kingdom_entry_date ||
        "2020-01-01",
    });
  }, [employee, profileExtras, allShiftGroups]);

  const updateField = (key: string, val: any) => {
    setForm((prev: any) => ({ ...prev, [key]: val }));
  };

  const handleSaveBasicSection = async () => {
    // Record audit archive entries for modified fields
    const changedEntries: Array<Record<string, any>> = [];
    const fieldLabels: Record<string, string> = {
      full_name: "اسم الموظف رباعى",
      full_name_en: "اسم الموظف بالانجليزيه",
      national_id: "رقم الهويه",
      emp_no: "الرقم الوظيفي",
      nationality: "الجنسيه",
      branch: "الفرع",
      department: "القسم",
      job_title: "الوظيفة",
      mobile: "رقم الجوال",
      email: "البريد الالكتروني",
    };

    Object.keys(fieldLabels).forEach((k) => {
      if (
        form[k] !== undefined &&
        String(form[k] || "") !== String(employee[k] || "")
      ) {
        changedEntries.push({
          id: `arch-${Date.now()}-${k}`,
          field_name: fieldLabels[k],
          old_value: String(employee[k] || "—"),
          new_value: String(form[k] || "—"),
          modified_at: new Date().toISOString().slice(0, 10),
          user: "مدير النظام",
        });
      }
    });

    await onSaveEmployee({
      full_name: form.full_name,
      full_name_en: form.full_name_en,
      national_id: form.national_id,
      emp_no: form.emp_no,
      nationality: form.nationality,
      gender: form.gender,
      birth_date: form.birth_date || null,
      marital_status: form.marital_status,
      mobile: form.mobile,
      email: form.email,
      branch: form.branch,
      department: form.department,
      job_title: form.job_title,
      hire_date: form.hire_date || null,
      start_date: form.start_date || null,
      gosi_no: form.gosi_no,
    });

    onSaveExtras({
      ...form,
      emp_archive: [
        ...(profileExtras.emp_archive || []),
        ...changedEntries,
      ],
    });
    toast.success("تم حفظ بيانات الموظف بنجاح");
  };

  // --- Sub-tab 2: Contracts State ---
  const [contractForm, setContractForm] = useState({
    contract_type: employee.contract_type || "عقد محدد المدة",
    leave_days: "30",
    end_date: "2026-12-31",
    work_type: "دوام كامل",
    work_scope: "داخل المملكة",
    weekly_work_days: "6",
    work_hours_standard: "يومي",
    work_hours_count: "8",
    weekly_rest_days: "1",
    contract_terms: "تطبق أحكام نظام العمل السعودي ولوائح الشركة الداخلية.",
    attachment: "",
  });

  const contractsList: any[] = profileExtras.contracts || [
    {
      id: "cnt-1",
      contract_no: `CNT-${employee.emp_no || "100"}-01`,
      leave_days: 30,
      contract_type: employee.contract_type || "عقد محدد المدة",
      start_date: employee.start_date || employee.hire_date || "2024-01-01",
      end_date: "2026-12-31",
      status: "ساري",
      work_type: "دوام كامل",
      work_scope: "داخل المملكة",
      work_hours_standard: "يومي",
      work_hours_count: 8,
      weekly_work_days: 6,
      weekly_rest_days: 1,
      remaining_days: 425,
      attachment: "عقد_العمل.pdf",
      end_archive: "—",
    },
  ];

  const handleSaveContract = () => {
    const nextContract = {
      id: `cnt-${Date.now()}`,
      contract_no: `CNT-${employee.emp_no || "100"}-0${contractsList.length + 1}`,
      leave_days: Number(contractForm.leave_days) || 30,
      contract_type: contractForm.contract_type || "عقد محدد المدة",
      start_date: employee.start_date || new Date().toISOString().slice(0, 10),
      end_date: contractForm.end_date || "2026-12-31",
      status: "ساري",
      work_type: contractForm.work_type || "دوام كامل",
      work_scope: contractForm.work_scope || "داخل المملكة",
      work_hours_standard: contractForm.work_hours_standard || "يومي",
      work_hours_count: Number(contractForm.work_hours_count) || 8,
      weekly_work_days: Number(contractForm.weekly_work_days) || 6,
      weekly_rest_days: Number(contractForm.weekly_rest_days) || 1,
      remaining_days: Math.max(
        0,
        Math.ceil(
          (new Date(contractForm.end_date || "2026-12-31").getTime() -
            Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      ),
      attachment: contractForm.attachment || "—",
      end_archive: "—",
    };
    onSaveExtras({
      contracts: [nextContract, ...contractsList],
    });
    toast.success("تم تحديث وحفظ بيانات العقد بنجاح");
  };

  // --- Sub-tab 3: Documents Forms ---
  const [docForm, setDocForm] = useState({
    doc_type: "",
    doc_no: "",
    has_dates: true,
    issue_date: "2026-04-12",
    expiry_date: "2026-04-12",
    attachment: "",
  });

  const [qualForm, setQualForm] = useState({
    degree: "",
    university: "",
    country: "المملكة العربية السعودية",
    grade: "",
    percentage: "",
    grad_date: "2020-06-01",
    attachment: "",
  });

  const [courseForm, setCourseForm] = useState({
    course_name: "",
    course_type: "",
    training_type: "",
    issuer: "",
    start_date: "2026-04-12",
    end_date: "2026-04-12",
    months: "",
    days: "",
    hours: "",
    percentage: "",
    grade: "",
    attachment: "",
  });

  const [expForm, setExpForm] = useState({
    company: "",
    job_title: "",
    start_date: "2020-01-01",
    end_date: "2022-12-31",
    salary: "",
    leave_reason: "",
    attachment: "",
  });

  const handleAddDocument = async () => {
    if (!docForm.doc_type) {
      toast.error("يرجى اختيار أو إدخال اسم المستند");
      return;
    }
    await saveDocument.mutateAsync({
      employee_id: employee.id,
      emp_no: employee.emp_no,
      doc_type: docForm.doc_type,
      doc_no: docForm.doc_no,
      issue_date: docForm.has_dates ? docForm.issue_date || null : null,
      expiry_date: docForm.has_dates ? docForm.expiry_date || null : null,
      notes: docForm.attachment || null,
    });
    setDocForm({
      doc_type: "",
      doc_no: "",
      has_dates: true,
      issue_date: "2026-04-12",
      expiry_date: "2026-04-12",
      attachment: "",
    });
    toast.success("تم إضافة المستند بنجاح");
  };

  // --- Sub-tab 4: Medical Insurance ---
  const [medForm, setMedForm] = useState({
    category: "VIP / A",
    company: "بوبا العربية للتأمين التعاوني",
    policy_no: "",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    amount: "2500",
  });

  const medicalList: any[] =
    profileExtras.medical_records || [];

  const handleSaveMedical = () => {
    if (!medForm.company) {
      toast.error("يرجى اختيار شركة التأمين");
      return;
    }
    const nextMed = {
      id: `med-${Date.now()}`,
      company: medForm.company,
      category: medForm.category || "A",
      policy_no: medForm.policy_no || `MED-${employee.emp_no || "100"}`,
      start_date: medForm.start_date,
      end_date: medForm.end_date,
      year: (medForm.start_date || "2026").slice(0, 4),
      amount: Number(medForm.amount) || 0,
    };
    onSaveExtras({
      medical_records: [nextMed, ...medicalList],
    });
    toast.success("تم حفظ التأمين الطبي بنجاح");
  };

  // --- Sub-tab 5: Dependents ---
  const [relForm, setRelForm] = useState({
    name: "",
    name_en: "",
    gender: "ذكر",
    relation: "ابن",
    nationality: employee.nationality || "سعودي",
    national_id: "",
    passport_no: "",
    job: "طالب",
    id_expiry_hijri: "1448-01-01",
    passport_expiry: "2028-04-12",
    birth_date: "2018-04-12",
    attachment: "",
  });

  const [relMedForm, setRelMedForm] = useState({
    relative_name: "",
    company: "بوبا العربية للتأمين التعاوني",
    category: "A",
    policy_no: "",
    start_date: "2026-04-12",
    end_date: "2027-04-12",
    year: "2026",
    amount: "1800",
    company_bear: "100%",
  });

  const handleAddRelative = async () => {
    if (!relForm.name) {
      toast.error("يرجى إدخال اسم المرافق");
      return;
    }
    await saveRelative.mutateAsync({
      employee_id: employee.id,
      emp_no: employee.emp_no,
      name: relForm.name,
      relation: relForm.relation,
      national_id: relForm.national_id,
      birth_date: relForm.birth_date || null,
      phone: relForm.passport_no || null,
    });
    onSaveExtras({
      relatives_meta: {
        ...(profileExtras.relatives_meta || {}),
        [relForm.name]: relForm,
      },
    });
    setRelForm({
      ...relForm,
      name: "",
      name_en: "",
      national_id: "",
      passport_no: "",
    });
    toast.success("تم إضافة المرافق بنجاح");
  };

  const subTabs = [
    { key: "basic" as const, label: "البيانات الاساسيه", icon: User },
    { key: "contracts" as const, label: "العقود", icon: FileSignature },
    { key: "documents" as const, label: "المستندات", icon: FolderOpen },
    { key: "medical" as const, label: "التامين الطبى", icon: HeartPulse },
    { key: "dependents" as const, label: "المرافقين", icon: Users },
    { key: "archive" as const, label: "الارشيف", icon: Archive },
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

      {/* ================= 1. البيانات الاساسيه ================= */}
      {subTab === "basic" && (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Right Sidebar: أقسام بيانات الأساسية */}
          <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:w-64">
            <h3 className="mb-2.5 border-b border-slate-100 px-2 pb-2 text-xs font-extrabold text-slate-500">
              أقسام بيانات الأساسية
            </h3>
            <div className="space-y-1">
              {[
                {
                  key: "personal" as const,
                  label: "البيانات الشخصيه",
                  icon: User,
                },
                { key: "work" as const, label: "بيانات العمل", icon: Briefcase },
                {
                  key: "gosi" as const,
                  label: "بيانات التامينات الاجتماعيه",
                  icon: ShieldCheck,
                },
                {
                  key: "contact" as const,
                  label: "بيانات التواصل",
                  icon: Phone,
                },
                { key: "notes" as const, label: "ملاحظات", icon: FileText },
                {
                  key: "creation_archive" as const,
                  label: "ارشيف اضافة الموظف",
                  icon: History,
                },
              ].map((sec) => {
                const Icon = sec.icon;
                const active = basicSection === sec.key;
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setBasicSection(sec.key)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                      active
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Left Content Panel */}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            {basicSection === "personal" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800">
                    البيانات الشخصيه
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <ProfileField label="اسم الموظف رباعى" required>
                    <input
                      type="text"
                      className={fieldInputClass}
                      value={form.full_name || ""}
                      onChange={(e) => updateField("full_name", e.target.value)}
                    />
                  </ProfileField>

                  <ProfileField label="اسم الموظف بالانجليزيه">
                    <input
                      type="text"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.full_name_en || ""}
                      onChange={(e) =>
                        updateField("full_name_en", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="الحاله الاجتماعيه">
                    <ClearableSelect
                      value={form.marital_status || "متزوج"}
                      onChange={(v) => updateField("marital_status", v)}
                      options={["أعزب", "متزوج", "مطلق", "أرمل"]}
                    />
                  </ProfileField>

                  <ProfileField label="نوع الهويه" required>
                    <ClearableSelect
                      value={form.id_type || idTypeOptions[0] || "الهوية الوطنية"}
                      onChange={(v) => updateField("id_type", v)}
                      options={idTypeOptions}
                    />
                  </ProfileField>

                  <ProfileField label="رقم الهويه" required>
                    <input
                      type="text"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.national_id || ""}
                      onChange={(e) =>
                        updateField("national_id", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="الرقم الوظيفي" required>
                    <input
                      type="text"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.emp_no || ""}
                      onChange={(e) => updateField("emp_no", e.target.value)}
                    />
                  </ProfileField>

                  <ProfileField label="رقم البصمه">
                    <input
                      type="text"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.fingerprint_no || ""}
                      onChange={(e) =>
                        updateField("fingerprint_no", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="الجنسيه" required>
                    <ClearableSelect
                      value={form.nationality || "سعودي"}
                      onChange={(v) => updateField("nationality", v)}
                      options={[
                        "سعودي",
                        "مصري",
                        "أردني",
                        "سوري",
                        "يمني",
                        "سوداني",
                        "باكستاني",
                        "هندي",
                        "فلبيني",
                      ]}
                    />
                  </ProfileField>

                  <ProfileField label="الديانه">
                    <ClearableSelect
                      value={form.religion || "مسلم"}
                      onChange={(v) => updateField("religion", v)}
                      options={["مسلم", "غير مسلم"]}
                    />
                  </ProfileField>

                  <ProfileField label="الجنس">
                    <ClearableSelect
                      value={form.gender || "ذكر"}
                      onChange={(v) => updateField("gender", v)}
                      options={["ذكر", "انثى"]}
                    />
                  </ProfileField>

                  <ProfileField label="عدد افراد الاسره">
                    <input
                      type="number"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.family_members_count ?? 0}
                      onChange={(e) =>
                        updateField("family_members_count", e.target.value)
                      }
                    />
                  </ProfileField>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={handleSaveBasicSection}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" />
                    حفظ
                  </button>
                </div>
              </div>
            )}

            {basicSection === "work" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800">
                    بيانات العمل
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <ProfileField label="المنطقة">
                    <ClearableSelect
                      value={form.region || "المنطقة الوسطى"}
                      onChange={(v) => updateField("region", v)}
                      options={[
                        "المنطقة الوسطى",
                        "المنطقة الغربية",
                        "المنطقة الشرقية",
                        "المنطقة الجنوبية",
                        "المنطقة الشمالية",
                      ]}
                    />
                  </ProfileField>

                  <ProfileField label="الفرع" required>
                    <ClearableSelect
                      value={form.branch || "الفرع الرئيسي"}
                      onChange={(v) => updateField("branch", v)}
                      options={[
                        "الفرع الرئيسي",
                        "فرع الرياض",
                        "فرع جدة",
                        "فرع الدمام",
                      ]}
                    />
                  </ProfileField>

                  <ProfileField label="الاداره الرئيسيه">
                    <ClearableSelect
                      value={form.main_department || "الإدارة العامة"}
                      onChange={(v) => updateField("main_department", v)}
                      options={[
                        "الإدارة العامة",
                        "إدارة الموارد البشرية",
                        "الإدارة المالية",
                        "إدارة التشغيل",
                        "إدارة تقنية المعلومات",
                      ]}
                    />
                  </ProfileField>

                  <ProfileField label="المسار الوظيفي">
                    <ClearableSelect
                      value={form.career_path || "المسار الإداري"}
                      onChange={(v) => updateField("career_path", v)}
                      options={[
                        "المسار الإداري",
                        "المسار الهندسي والفني",
                        "المسار المالي",
                        "المسار التشغيلي",
                      ]}
                    />
                  </ProfileField>

                  <ProfileField label="القسم" required>
                    <ClearableSelect
                      value={form.department || "الموارد البشرية"}
                      onChange={(v) => updateField("department", v)}
                      options={[
                        "الموارد البشرية",
                        "المالية والمحاسبة",
                        "تقنية المعلومات",
                        "المبيعات والتسويق",
                        "العمليات والتشغيل",
                        "الشؤون الإدارية",
                      ]}
                    />
                  </ProfileField>

                  <ProfileField label="القطاع">
                    <ClearableSelect
                      value={form.sector || "القطاع الخاص"}
                      onChange={(v) => updateField("sector", v)}
                      options={["القطاع الخاص", "القطاع الحكومي", "قطاع الأعمال"]}
                    />
                  </ProfileField>

                  <ProfileField label="المستوى الوظيفي">
                    <ClearableSelect
                      value={form.job_level || "المستوى الأول"}
                      onChange={(v) => updateField("job_level", v)}
                      options={[
                        "الإدارة العليا",
                        "المستوى الأول",
                        "المستوى الثاني",
                        "المستوى الثالث",
                      ]}
                    />
                  </ProfileField>

                  <ProfileField label="المدير المباشر">
                    <input
                      type="text"
                      className={fieldInputClass}
                      value={form.direct_manager || ""}
                      onChange={(e) =>
                        updateField("direct_manager", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="جدول الدوام">
                    <ClearableSelect
                      value={form.shift_group || "الاداريين"}
                      onChange={(v) => updateField("shift_group", v)}
                      options={
                        allShiftGroups.length > 0
                          ? allShiftGroups.map((g) => String(g.name))
                          : ["الاداريين", "الفترة الصباحية", "المناوبات"]
                      }
                    />
                  </ProfileField>

                  <ProfileField label="الوظيفة" required>
                    <input
                      type="text"
                      className={fieldInputClass}
                      value={form.job_title || ""}
                      onChange={(e) => updateField("job_title", e.target.value)}
                    />
                  </ProfileField>

                  <ProfileField label="التخصص">
                    <input
                      type="text"
                      className={fieldInputClass}
                      value={form.specialization || ""}
                      onChange={(e) =>
                        updateField("specialization", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="المسمى الوظيفي">
                    <input
                      type="text"
                      className={fieldInputClass}
                      value={form.job_designation || form.job_title || ""}
                      onChange={(e) =>
                        updateField("job_designation", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="تاريخ الميلاد">
                    <input
                      type="date"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.birth_date || "1990-01-01"}
                      onChange={(e) =>
                        updateField("birth_date", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="تاريخ التعيين">
                    <input
                      type="date"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.hire_date || ""}
                      onChange={(e) => updateField("hire_date", e.target.value)}
                    />
                  </ProfileField>

                  <ProfileField label="تاريخ المباشره">
                    <input
                      type="date"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.start_date || ""}
                      onChange={(e) =>
                        updateField("start_date", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="تاريخ احتساب الاجازه السنويه">
                    <input
                      type="date"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.leave_calc_date || ""}
                      onChange={(e) =>
                        updateField("leave_calc_date", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="عدد سنوات الخبره">
                    <input
                      type="number"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.experience_years ?? 0}
                      onChange={(e) =>
                        updateField("experience_years", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="فترة التجربة (بالأيام)">
                    <input
                      type="number"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.probation_days ?? 90}
                      onChange={(e) =>
                        updateField("probation_days", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="تاريخ الدخول للمملكه">
                    <input
                      type="date"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.kingdom_entry_date || ""}
                      onChange={(e) =>
                        updateField("kingdom_entry_date", e.target.value)
                      }
                    />
                  </ProfileField>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={handleSaveBasicSection}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" />
                    حفظ
                  </button>
                </div>
              </div>
            )}

            {basicSection === "gosi" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800">
                    بيانات التامينات الاجتماعيه
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <ProfileField label="رقم المشترك بالتأمينات">
                    <input
                      type="text"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.gosi_no || ""}
                      onChange={(e) => updateField("gosi_no", e.target.value)}
                      placeholder="مثال: 389102938"
                    />
                  </ProfileField>

                  <ProfileField label="تاريخ التسجيل بالتأمينات">
                    <input
                      type="date"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.gosi_reg_date || form.hire_date || "2023-01-01"}
                      onChange={(e) =>
                        updateField("gosi_reg_date", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="حالة التأمينات">
                    <ClearableSelect
                      value={form.gosi_status || "مشترك نشط"}
                      onChange={(v) => updateField("gosi_status", v)}
                      options={["مشترك نشط", "غير مشترك", "قيد التسجيل", "مستبعد"]}
                    />
                  </ProfileField>

                  <ProfileField label="نسبة استقطاع الموظف (%)">
                    <input
                      type="number"
                      step="0.25"
                      dir="ltr"
                      className={fieldInputClass}
                      value={
                        form.gosi_emp_percent ??
                        (form.nationality === "سعودي" ? 9.75 : 0)
                      }
                      onChange={(e) =>
                        updateField("gosi_emp_percent", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="نسبة تحمل الشركة (%)">
                    <input
                      type="number"
                      step="0.25"
                      dir="ltr"
                      className={fieldInputClass}
                      value={
                        form.gosi_comp_percent ??
                        (form.nationality === "سعودي" ? 11.75 : 2)
                      }
                      onChange={(e) =>
                        updateField("gosi_comp_percent", e.target.value)
                      }
                    />
                  </ProfileField>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={handleSaveBasicSection}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" />
                    حفظ
                  </button>
                </div>
              </div>
            )}

            {basicSection === "contact" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800">
                    بيانات التواصل والعنوان الوطني
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <ProfileField label="رقم الجوال الاساسى" required>
                    <input
                      type="text"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.mobile || ""}
                      onChange={(e) => updateField("mobile", e.target.value)}
                    />
                  </ProfileField>

                  <ProfileField label="رقم الهاتف الثانوى">
                    <input
                      type="text"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.secondary_phone || ""}
                      onChange={(e) =>
                        updateField("secondary_phone", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="البريد الالكتروني الرسمى">
                    <input
                      type="email"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </ProfileField>

                  <ProfileField label="المدينة">
                    <input
                      type="text"
                      className={fieldInputClass}
                      value={form.city || "الرياض"}
                      onChange={(e) => updateField("city", e.target.value)}
                    />
                  </ProfileField>

                  <ProfileField label="الحي">
                    <input
                      type="text"
                      className={fieldInputClass}
                      value={form.district || ""}
                      onChange={(e) => updateField("district", e.target.value)}
                    />
                  </ProfileField>

                  <ProfileField label="الشارع">
                    <input
                      type="text"
                      className={fieldInputClass}
                      value={form.street || ""}
                      onChange={(e) => updateField("street", e.target.value)}
                    />
                  </ProfileField>

                  <ProfileField label="رقم المبنى">
                    <input
                      type="text"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.building_no || ""}
                      onChange={(e) =>
                        updateField("building_no", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="الرمز البريدى">
                    <input
                      type="text"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.postal_code || ""}
                      onChange={(e) =>
                        updateField("postal_code", e.target.value)
                      }
                    />
                  </ProfileField>

                  <ProfileField label="العنوان المختصر">
                    <input
                      type="text"
                      dir="ltr"
                      className={fieldInputClass}
                      value={form.short_address || ""}
                      onChange={(e) =>
                        updateField("short_address", e.target.value)
                      }
                    />
                  </ProfileField>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={handleSaveBasicSection}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" />
                    حفظ
                  </button>
                </div>
              </div>
            )}

            {basicSection === "notes" && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800">
                  ملاحظات الموظف
                </h3>
                <ProfileField label="إضافة ملاحظة جديدة">
                  <textarea
                    rows={3}
                    className={fieldInputClass}
                    value={form.notes_draft || ""}
                    onChange={(e) => updateField("notes_draft", e.target.value)}
                    placeholder="اكتب ملاحظة حول الموظف..."
                  />
                </ProfileField>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!form.notes_draft) return;
                      const list = profileExtras.notes_list || [];
                      onSaveExtras({
                        notes_list: [
                          {
                            id: `n-${Date.now()}`,
                            note: form.notes_draft,
                            date: new Date().toISOString().slice(0, 10),
                            user: "مدير النظام",
                          },
                          ...list,
                        ],
                      });
                      updateField("notes_draft", "");
                      toast.success("تم حفظ الملاحظة");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                    حفظ الملاحظة
                  </button>
                </div>
                <ProfileGridTable
                  columns={[
                    { key: "note", label: "الملاحظة" },
                    { key: "date", label: "التاريخ" },
                    { key: "user", label: "المستخدم" },
                  ]}
                  rows={profileExtras.notes_list || []}
                />
              </div>
            )}

            {basicSection === "creation_archive" && (
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800">
                  ارشيف اضافة الموظف
                </h3>
                <ProfileGridTable
                  columns={[
                    { key: "emp_no", label: "الرقم الوظيفي" },
                    { key: "full_name", label: "اسم الموظف" },
                    { key: "created_at", label: "تاريخ الإضافة" },
                    { key: "created_by", label: "تمت الإضافة بواسطة" },
                    { key: "status", label: "الحالة عند الإضافة" },
                  ]}
                  rows={[
                    {
                      id: "create-1",
                      emp_no: employee.emp_no || "—",
                      full_name: employee.full_name || "—",
                      created_at:
                        (employee.created_at || "").slice(0, 10) ||
                        employee.hire_date ||
                        "2024-01-01",
                      created_by: "مدير النظام (HR Admin)",
                      status: "مفعل",
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 2. العقود ================= */}
      {subTab === "contracts" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <ProfileField label="نوع العقد">
                <ClearableSelect
                  value={contractForm.contract_type}
                  onChange={(v) =>
                    setContractForm((p) => ({ ...p, contract_type: v }))
                  }
                  options={[
                    "عقد محدد المدة",
                    "عقد غير محدد المدة",
                    "عقد عمل مرن",
                    "عقد تدريب",
                  ]}
                />
              </ProfileField>

              <ProfileField label="الأجازات">
                <ClearableSelect
                  value={contractForm.leave_days}
                  onChange={(v) =>
                    setContractForm((p) => ({ ...p, leave_days: v }))
                  }
                  options={["21", "30", "45"]}
                />
              </ProfileField>

              <ProfileField label="تاريخ نهايه العقد">
                <input
                  type="date"
                  dir="ltr"
                  className={fieldInputClass}
                  value={contractForm.end_date}
                  onChange={(e) =>
                    setContractForm((p) => ({ ...p, end_date: e.target.value }))
                  }
                />
              </ProfileField>

              <ProfileField label="نوع العمل">
                <ClearableSelect
                  value={contractForm.work_type}
                  onChange={(v) =>
                    setContractForm((p) => ({ ...p, work_type: v }))
                  }
                  options={["دوام كامل", "دوام جزئي", "عمل عن بعد"]}
                />
              </ProfileField>

              <ProfileField label="نطاق العمل">
                <ClearableSelect
                  value={contractForm.work_scope}
                  onChange={(v) =>
                    setContractForm((p) => ({ ...p, work_scope: v }))
                  }
                  options={["داخل المملكة", "خارج المملكة"]}
                />
              </ProfileField>

              <ProfileField label="عدد ايام العمل الاسبوعيه">
                <ClearableSelect
                  value={contractForm.weekly_work_days}
                  onChange={(v) =>
                    setContractForm((p) => ({ ...p, weekly_work_days: v }))
                  }
                  options={["5", "6"]}
                />
              </ProfileField>

              <ProfileField label="معيار ساعات العمل">
                <ClearableSelect
                  value={contractForm.work_hours_standard}
                  onChange={(v) =>
                    setContractForm((p) => ({ ...p, work_hours_standard: v }))
                  }
                  options={["يومي", "أسبوعي"]}
                />
              </ProfileField>

              <ProfileField label="عدد ساعات العمل">
                <input
                  type="number"
                  dir="ltr"
                  className={fieldInputClass}
                  value={contractForm.work_hours_count}
                  onChange={(e) =>
                    setContractForm((p) => ({
                      ...p,
                      work_hours_count: e.target.value,
                    }))
                  }
                />
              </ProfileField>

              <ProfileField label="عدد ايام الراحه الاسبوعيه">
                <ClearableSelect
                  value={contractForm.weekly_rest_days}
                  onChange={(v) =>
                    setContractForm((p) => ({ ...p, weekly_rest_days: v }))
                  }
                  options={["1", "2"]}
                />
              </ProfileField>

              <ProfileField label="بنود العقد" className="lg:col-span-2">
                <textarea
                  rows={2}
                  className={fieldInputClass}
                  value={contractForm.contract_terms}
                  onChange={(e) =>
                    setContractForm((p) => ({
                      ...p,
                      contract_terms: e.target.value,
                    }))
                  }
                />
              </ProfileField>

              <ProfileField label="المرفقات">
                <FileUploadBox
                  fileName={contractForm.attachment}
                  onFileSelect={(name) =>
                    setContractForm((p) => ({ ...p, attachment: name }))
                  }
                />
              </ProfileField>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveContract}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Save className="h-4 w-4" />
                تحديث
              </button>
            </div>
          </div>

          <ProfileGridTable
            columns={[
              { key: "contract_no", label: "رقم العقد" },
              { key: "leave_days", label: "الأجازات" },
              { key: "contract_type", label: "نوع العقد" },
              { key: "start_date", label: "تاريخ بدايه العقد" },
              { key: "end_date", label: "تاريخ نهايه العقد" },
              {
                key: "status",
                label: "الحاله",
                render: (r) => (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    {r.status}
                  </span>
                ),
              },
              { key: "work_type", label: "نوع العمل" },
              { key: "work_scope", label: "نطاق العمل" },
              { key: "work_hours_standard", label: "معيار ساعات العمل" },
              { key: "work_hours_count", label: "عدد ساعات العمل" },
              { key: "weekly_work_days", label: "عدد ايام العمل الاسبوعيه" },
              { key: "weekly_rest_days", label: "عدد ايام الراحه الاسبوعيه" },
              { key: "remaining_days", label: "الايام المتبقيه" },
              { key: "attachment", label: "المرفقات" },
              {
                key: "edit",
                label: "تعديل",
                render: (r) => (
                  <button
                    type="button"
                    onClick={() => {
                      setContractForm({
                        contract_type: r.contract_type,
                        leave_days: String(r.leave_days),
                        end_date: r.end_date,
                        work_type: r.work_type,
                        work_scope: r.work_scope,
                        weekly_work_days: String(r.weekly_work_days),
                        work_hours_standard: r.work_hours_standard,
                        work_hours_count: String(r.work_hours_count),
                        weekly_rest_days: String(r.weekly_rest_days),
                        contract_terms: contractForm.contract_terms,
                        attachment: r.attachment,
                      });
                      toast.info("تم تحميل بيانات العقد للتعديل");
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                  >
                    <Edit3 className="h-3 w-3" />
                    تعديل
                  </button>
                ),
              },
              {
                key: "activate",
                label: "تفعيل",
                render: () => (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    مفعل
                  </span>
                ),
              },
              { key: "end_archive", label: "ارشيف نهايه العقد" },
            ]}
            rows={contractsList}
          />
        </div>
      )}

      {/* ================= 3. المستندات ================= */}
      {subTab === "documents" && (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Right Sidebar: أقسام المستندات */}
          <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:w-64">
            <h3 className="mb-2.5 border-b border-slate-100 px-2 pb-2 text-xs font-extrabold text-slate-500">
              أقسام المستندات
            </h3>
            <div className="space-y-1">
              {[
                {
                  key: "docs" as const,
                  label: "بيانات المستندات",
                  icon: FileText,
                },
                {
                  key: "qualifications" as const,
                  label: "المؤهلات الدراسيه",
                  icon: GraduationCap,
                },
                {
                  key: "courses" as const,
                  label: "الدورات التدريبية / شهادات اخرى / المشاركات",
                  icon: Award,
                },
                {
                  key: "experience" as const,
                  label: "خبرات الموظف السابقة",
                  icon: Briefcase,
                },
              ].map((sec) => {
                const Icon = sec.icon;
                const active = docsSection === sec.key;
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setDocsSection(sec.key)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                      active
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Left Content */}
          <div className="flex-1 space-y-4">
            {docsSection === "docs" && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <ProfileField label="اسم المستند" required>
                      <ClearableSelect
                        value={docForm.doc_type}
                        onChange={(v) => {
                          const noExpiryDocs = [
                            "شهادة الآيبان البنكي",
                            "مسوغات التعيين",
                            "السيرة الذاتية",
                            "إخلاء طرف",
                          ];
                          setDocForm((p) => ({
                            ...p,
                            doc_type: v,
                            has_dates: v
                              ? !noExpiryDocs.includes(v)
                              : p.has_dates,
                          }));
                        }}
                        options={[
                          "الهوية الوطنية / الإقامة",
                          "جواز السفر",
                          "رخصة القيادة",
                          "الشهادة الصحية",
                          "عقد العمل الموقع",
                          "شهادة التأمينات الاجتماعية",
                          "شهادة الآيبان البنكي",
                          "مسوغات التعيين",
                          "السيرة الذاتية",
                          "إخلاء طرف",
                        ]}
                      />
                    </ProfileField>

                    <ProfileField label="رقم المستند">
                      <input
                        type="text"
                        dir="ltr"
                        className={fieldInputClass}
                        value={docForm.doc_no}
                        onChange={(e) =>
                          setDocForm((p) => ({ ...p, doc_no: e.target.value }))
                        }
                        placeholder="أدخل رقم المستند (اختياري)"
                      />
                    </ProfileField>

                    {/* السؤال قبل إظهار تاريخ البداية وتاريخ النهاية */}
                    <ProfileField
                      label="هل المستند له تاريخ بداية وتاريخ نهاية؟"
                      className="md:col-span-2"
                    >
                      <div className="grid h-9 grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() =>
                            setDocForm((p) => ({ ...p, has_dates: true }))
                          }
                          className={`flex items-center justify-center gap-1.5 rounded-md text-xs font-bold transition ${
                            docForm.has_dates
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:bg-white/80"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>نعم، له تاريخ بداية ونهاية</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDocForm((p) => ({ ...p, has_dates: false }))
                          }
                          className={`flex items-center justify-center gap-1.5 rounded-md text-xs font-bold transition ${
                            !docForm.has_dates
                              ? "bg-slate-700 text-white shadow-xs"
                              : "text-slate-600 hover:bg-white/80"
                          }`}
                        >
                          <span>لا (بدون تاريخ صلاحية)</span>
                        </button>
                      </div>
                    </ProfileField>

                    {docForm.has_dates ? (
                      <>
                        <ProfileField label="تاريخ البداية ميلادي">
                          <input
                            type="date"
                            dir="ltr"
                            className={fieldInputClass}
                            value={docForm.issue_date}
                            onChange={(e) =>
                              setDocForm((p) => ({
                                ...p,
                                issue_date: e.target.value,
                              }))
                            }
                          />
                        </ProfileField>

                        <ProfileField label="تاريخ النهاية ميلادي">
                          <input
                            type="date"
                            dir="ltr"
                            className={fieldInputClass}
                            value={docForm.expiry_date}
                            onChange={(e) =>
                              setDocForm((p) => ({
                                ...p,
                                expiry_date: e.target.value,
                              }))
                            }
                          />
                        </ProfileField>

                        <ProfileField label="تاريخ البداية هجري">
                          <input
                            type="text"
                            dir="ltr"
                            readOnly
                            className={`${fieldInputClass} bg-slate-50`}
                            value={toHijriDate(docForm.issue_date)}
                          />
                        </ProfileField>

                        <ProfileField label="تاريخ النهاية هجري">
                          <input
                            type="text"
                            dir="ltr"
                            readOnly
                            className={`${fieldInputClass} bg-slate-50`}
                            value={toHijriDate(docForm.expiry_date)}
                          />
                        </ProfileField>
                      </>
                    ) : (
                      <div className="md:col-span-2 flex items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-slate-500">
                        هذا المستند دائم وغير مرتبط بتاريخ بداية أو انتهاء صلاحية.
                      </div>
                    )}

                    <ProfileField
                      label="المرفقات"
                      className={
                        docForm.has_dates ? "lg:col-span-4" : "md:col-span-2"
                      }
                    >
                      <FileUploadBox
                        fileName={docForm.attachment}
                        onFileSelect={(name) =>
                          setDocForm((p) => ({ ...p, attachment: name }))
                        }
                      />
                    </ProfileField>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      اضافه
                    </button>
                  </div>
                </div>

                <ProfileGridTable
                  columns={[
                    { key: "doc_type", label: "اسم المستند" },
                    { key: "doc_no", label: "رقم المستند" },
                    {
                      key: "has_validity",
                      label: "صلاحية المستند",
                      render: (r) =>
                        r.issue_date || r.expiry_date ? (
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                            محدد بتاريخ
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                            بدون تاريخ صلاحية
                          </span>
                        ),
                    },
                    {
                      key: "issue_date",
                      label: "تاريخ البداية",
                      render: (r) => r.issue_date || "لا يوجد",
                    },
                    {
                      key: "expiry_date",
                      label: "تاريخ النهاية",
                      render: (r) => r.expiry_date || "لا يوجد",
                    },
                    {
                      key: "notes",
                      label: "المرفقات",
                      render: (r) => <AttachmentPreviewCell value={r.notes} />,
                    },
                    {
                      key: "actions",
                      label: "حذف",
                      render: (r) => (
                        <button
                          type="button"
                          onClick={() =>
                            deleteDocument.mutate(String(r.id), {
                              onSuccess: () =>
                                toast.success("تم حذف المستند"),
                            })
                          }
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ),
                    },
                  ]}
                  rows={empDocuments}
                />
              </>
            )}

            {docsSection === "qualifications" && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <ProfileField label="شهادة التخرج">
                      <ClearableSelect
                        value={qualForm.degree}
                        onChange={(v) =>
                          setQualForm((p) => ({ ...p, degree: v }))
                        }
                        options={[
                          "ثانوية عامة",
                          "دبلوم",
                          "بكالوريوس",
                          "ماجستير",
                          "دكتوراه",
                        ]}
                      />
                    </ProfileField>

                    <ProfileField label="الجامعة">
                      <input
                        type="text"
                        className={fieldInputClass}
                        value={qualForm.university}
                        onChange={(e) =>
                          setQualForm((p) => ({
                            ...p,
                            university: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="الدولة">
                      <ClearableSelect
                        value={qualForm.country}
                        onChange={(v) =>
                          setQualForm((p) => ({ ...p, country: v }))
                        }
                        options={[
                          "المملكة العربية السعودية",
                          "مصر",
                          "الأردن",
                          "المملكة المتحدة",
                          "الولايات المتحدة",
                        ]}
                      />
                    </ProfileField>

                    <ProfileField label="التقدير">
                      <ClearableSelect
                        value={qualForm.grade}
                        onChange={(v) =>
                          setQualForm((p) => ({ ...p, grade: v }))
                        }
                        options={["ممتاز", "جيد جداً", "جيد", "مقبول"]}
                      />
                    </ProfileField>

                    <ProfileField label="التقدير نسبة">
                      <input
                        type="text"
                        dir="ltr"
                        className={fieldInputClass}
                        value={qualForm.percentage}
                        onChange={(e) =>
                          setQualForm((p) => ({
                            ...p,
                            percentage: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="تاريخ التخرج">
                      <input
                        type="date"
                        dir="ltr"
                        className={fieldInputClass}
                        value={qualForm.grad_date}
                        onChange={(e) =>
                          setQualForm((p) => ({
                            ...p,
                            grad_date: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="المرفقات" className="lg:col-span-2">
                      <FileUploadBox
                        fileName={qualForm.attachment}
                        onFileSelect={(name) =>
                          setQualForm((p) => ({ ...p, attachment: name }))
                        }
                      />
                    </ProfileField>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!qualForm.degree) {
                          toast.error("يرجى اختيار شهادة التخرج");
                          return;
                        }
                        const list = profileExtras.qualifications || [];
                        onSaveExtras({
                          qualifications: [
                            { id: `q-${Date.now()}`, ...qualForm },
                            ...list,
                          ],
                        });
                        toast.success("تم إضافة المؤهل الدراسي");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      اضافه
                    </button>
                  </div>
                </div>

                <ProfileGridTable
                  columns={[
                    { key: "degree", label: "المؤهلات الدراسية" },
                    { key: "university", label: "مكان الاصدار" },
                    { key: "grade", label: "التقدير" },
                    { key: "country", label: "الدولة" },
                    { key: "grad_date", label: "التاريخ" },
                    { key: "percentage", label: "التقدير نسبة" },
                    { key: "attachment", label: "المرفقات" },
                  ]}
                  rows={profileExtras.qualifications || []}
                />
              </>
            )}

            {docsSection === "courses" && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <ProfileField label="إسم الدورة">
                      <input
                        type="text"
                        className={fieldInputClass}
                        value={courseForm.course_name}
                        onChange={(e) =>
                          setCourseForm((p) => ({
                            ...p,
                            course_name: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="نوع الدورة">
                      <ClearableSelect
                        value={courseForm.course_type}
                        onChange={(v) =>
                          setCourseForm((p) => ({ ...p, course_type: v }))
                        }
                        options={["تأهيلية", "تطويرية", "تخصصية", "شهادة مهنية"]}
                      />
                    </ProfileField>

                    <ProfileField label="نوع التدريب">
                      <ClearableSelect
                        value={courseForm.training_type}
                        onChange={(v) =>
                          setCourseForm((p) => ({ ...p, training_type: v }))
                        }
                        options={["حضوري", "عن بعد", "مدمج"]}
                      />
                    </ProfileField>

                    <ProfileField label="مكان الاصدار">
                      <input
                        type="text"
                        className={fieldInputClass}
                        value={courseForm.issuer}
                        onChange={(e) =>
                          setCourseForm((p) => ({
                            ...p,
                            issuer: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="تاريخ البداية">
                      <input
                        type="date"
                        dir="ltr"
                        className={fieldInputClass}
                        value={courseForm.start_date}
                        onChange={(e) =>
                          setCourseForm((p) => ({
                            ...p,
                            start_date: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="تاريخ النهاية">
                      <input
                        type="date"
                        dir="ltr"
                        className={fieldInputClass}
                        value={courseForm.end_date}
                        onChange={(e) =>
                          setCourseForm((p) => ({
                            ...p,
                            end_date: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="مدة الدورة شهر">
                      <input
                        type="number"
                        dir="ltr"
                        className={fieldInputClass}
                        value={courseForm.months}
                        onChange={(e) =>
                          setCourseForm((p) => ({
                            ...p,
                            months: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="مدة الدورة يوم">
                      <input
                        type="number"
                        dir="ltr"
                        className={fieldInputClass}
                        value={courseForm.days}
                        onChange={(e) =>
                          setCourseForm((p) => ({ ...p, days: e.target.value }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="مدة الدورة ساعات">
                      <input
                        type="number"
                        dir="ltr"
                        className={fieldInputClass}
                        value={courseForm.hours}
                        onChange={(e) =>
                          setCourseForm((p) => ({
                            ...p,
                            hours: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="التقدير نسبة">
                      <input
                        type="text"
                        dir="ltr"
                        className={fieldInputClass}
                        value={courseForm.percentage}
                        onChange={(e) =>
                          setCourseForm((p) => ({
                            ...p,
                            percentage: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="التقدير">
                      <ClearableSelect
                        value={courseForm.grade}
                        onChange={(v) =>
                          setCourseForm((p) => ({ ...p, grade: v }))
                        }
                        options={["ممتاز", "جيد جداً", "جيد", "اجتياز"]}
                      />
                    </ProfileField>

                    <ProfileField label="المرفقات">
                      <FileUploadBox
                        fileName={courseForm.attachment}
                        onFileSelect={(name) =>
                          setCourseForm((p) => ({ ...p, attachment: name }))
                        }
                      />
                    </ProfileField>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!courseForm.course_name) {
                          toast.error("يرجى إدخال اسم الدورة");
                          return;
                        }
                        const list = profileExtras.courses || [];
                        onSaveExtras({
                          courses: [
                            { id: `c-${Date.now()}`, ...courseForm },
                            ...list,
                          ],
                        });
                        toast.success("تم إضافة الدورة التدريبية");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      اضافه
                    </button>
                  </div>
                </div>

                <ProfileGridTable
                  columns={[
                    { key: "course_name", label: "اسم الدورة" },
                    { key: "course_type", label: "نوع الدورة" },
                    { key: "start_date", label: "تاريخ البداية" },
                    { key: "end_date", label: "تاريخ النهاية" },
                    { key: "issuer", label: "مكان الاصدار" },
                    { key: "grade", label: "التقدير" },
                    { key: "months", label: "مدة الدورة شهر" },
                    { key: "days", label: "مدة الدورة يوم" },
                    { key: "hours", label: "مدة الدورة ساعة" },
                    { key: "percentage", label: "التقدير نسبة" },
                    { key: "attachment", label: "المرفقات" },
                  ]}
                  rows={profileExtras.courses || []}
                />
              </>
            )}

            {docsSection === "experience" && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <ProfileField label="جهة العمل السابقة">
                      <input
                        type="text"
                        className={fieldInputClass}
                        value={expForm.company}
                        onChange={(e) =>
                          setExpForm((p) => ({ ...p, company: e.target.value }))
                        }
                      />
                    </ProfileField>
                    <ProfileField label="المسمى الوظيفي">
                      <input
                        type="text"
                        className={fieldInputClass}
                        value={expForm.job_title}
                        onChange={(e) =>
                          setExpForm((p) => ({
                            ...p,
                            job_title: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>
                    <ProfileField label="تاريخ البداية">
                      <input
                        type="date"
                        dir="ltr"
                        className={fieldInputClass}
                        value={expForm.start_date}
                        onChange={(e) =>
                          setExpForm((p) => ({
                            ...p,
                            start_date: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>
                    <ProfileField label="تاريخ النهاية">
                      <input
                        type="date"
                        dir="ltr"
                        className={fieldInputClass}
                        value={expForm.end_date}
                        onChange={(e) =>
                          setExpForm((p) => ({
                            ...p,
                            end_date: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>
                    <ProfileField label="الراتب">
                      <input
                        type="number"
                        dir="ltr"
                        className={fieldInputClass}
                        value={expForm.salary}
                        onChange={(e) =>
                          setExpForm((p) => ({ ...p, salary: e.target.value }))
                        }
                      />
                    </ProfileField>
                    <ProfileField label="سبب الترك">
                      <input
                        type="text"
                        className={fieldInputClass}
                        value={expForm.leave_reason}
                        onChange={(e) =>
                          setExpForm((p) => ({
                            ...p,
                            leave_reason: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>
                    <ProfileField label="المرفقات" className="lg:col-span-2">
                      <FileUploadBox
                        fileName={expForm.attachment}
                        onFileSelect={(name) =>
                          setExpForm((p) => ({ ...p, attachment: name }))
                        }
                      />
                    </ProfileField>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!expForm.company) {
                          toast.error("يرجى إدخال جهة العمل");
                          return;
                        }
                        const list = profileExtras.experiences || [];
                        onSaveExtras({
                          experiences: [
                            { id: `ex-${Date.now()}`, ...expForm },
                            ...list,
                          ],
                        });
                        toast.success("تم إضافة الخبرة السابقة");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      اضافه
                    </button>
                  </div>
                </div>

                <ProfileGridTable
                  columns={[
                    { key: "company", label: "جهة العمل" },
                    { key: "job_title", label: "المسمى الوظيفي" },
                    { key: "start_date", label: "تاريخ البداية" },
                    { key: "end_date", label: "تاريخ النهاية" },
                    { key: "salary", label: "الراتب" },
                    { key: "leave_reason", label: "سبب الترك" },
                    { key: "attachment", label: "المرفقات" },
                  ]}
                  rows={profileExtras.experiences || []}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= 4. التامين الطبى ================= */}
      {subTab === "medical" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ProfileField label="فئه التامين">
                <ClearableSelect
                  value={medForm.category}
                  onChange={(v) => setMedForm((p) => ({ ...p, category: v }))}
                  options={["VIP", "A+", "A", "B", "C"]}
                />
              </ProfileField>

              <ProfileField label="شركه التامين">
                <ClearableSelect
                  value={medForm.company}
                  onChange={(v) => setMedForm((p) => ({ ...p, company: v }))}
                  options={[
                    "بوبا العربية للتأمين التعاوني",
                    "التعاونية للتأمين",
                    "ميدغلف للتأمين",
                    "تكافل الراجحي",
                    "ولاء للتأمين",
                  ]}
                />
              </ProfileField>

              <ProfileField label="رقم التامين">
                <input
                  type="text"
                  dir="ltr"
                  className={fieldInputClass}
                  value={medForm.policy_no}
                  onChange={(e) =>
                    setMedForm((p) => ({ ...p, policy_no: e.target.value }))
                  }
                />
              </ProfileField>

              <ProfileField label="تاريخ البداية">
                <input
                  type="date"
                  dir="ltr"
                  className={fieldInputClass}
                  value={medForm.start_date}
                  onChange={(e) =>
                    setMedForm((p) => ({ ...p, start_date: e.target.value }))
                  }
                />
              </ProfileField>

              <ProfileField label="تاريخ النهاية">
                <input
                  type="date"
                  dir="ltr"
                  className={fieldInputClass}
                  value={medForm.end_date}
                  onChange={(e) =>
                    setMedForm((p) => ({ ...p, end_date: e.target.value }))
                  }
                />
              </ProfileField>

              <ProfileField label="القيمة">
                <input
                  type="number"
                  dir="ltr"
                  className={fieldInputClass}
                  value={medForm.amount}
                  onChange={(e) =>
                    setMedForm((p) => ({ ...p, amount: e.target.value }))
                  }
                />
              </ProfileField>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveMedical}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Save className="h-4 w-4" />
                حفظ
              </button>
            </div>
          </div>

          <ProfileGridTable
            columns={[
              { key: "company", label: "شركه التامين" },
              { key: "category", label: "فئه التامين" },
              { key: "policy_no", label: "رقم التامين" },
              { key: "start_date", label: "تاريخ البدايه" },
              { key: "end_date", label: "تاريخ نهايه التامين" },
              { key: "year", label: "السنه" },
              { key: "amount", label: "مبلغ التامين" },
            ]}
            rows={medicalList}
          />
        </div>
      )}

      {/* ================= 5. المرافقين ================= */}
      {subTab === "dependents" && (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Right Sidebar: أقسام المرافقين */}
          <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:w-64">
            <h3 className="mb-2.5 border-b border-slate-100 px-2 pb-2 text-xs font-extrabold text-slate-500">
              أقسام المرافقين
            </h3>
            <div className="space-y-1">
              {[
                {
                  key: "relatives_data" as const,
                  label: "بيانات المرافقين",
                  icon: Users,
                },
                {
                  key: "relatives_medical" as const,
                  label: "بيانات التامين الطبى",
                  icon: HeartPulse,
                },
              ].map((sec) => {
                const Icon = sec.icon;
                const active = dependentsSection === sec.key;
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setDependentsSection(sec.key)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                      active
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Left Content */}
          <div className="flex-1 space-y-4">
            {dependentsSection === "relatives_data" && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <ProfileField label="اسم المرافق">
                      <input
                        type="text"
                        className={fieldInputClass}
                        value={relForm.name}
                        onChange={(e) =>
                          setRelForm((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="الأسم بالانجليزيه">
                      <input
                        type="text"
                        dir="ltr"
                        className={fieldInputClass}
                        value={relForm.name_en}
                        onChange={(e) =>
                          setRelForm((p) => ({ ...p, name_en: e.target.value }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="الجنس">
                      <ClearableSelect
                        value={relForm.gender}
                        onChange={(v) =>
                          setRelForm((p) => ({ ...p, gender: v }))
                        }
                        options={["ذكر", "انثى"]}
                      />
                    </ProfileField>

                    <ProfileField label="صله القرابه">
                      <ClearableSelect
                        value={relForm.relation}
                        onChange={(v) =>
                          setRelForm((p) => ({ ...p, relation: v }))
                        }
                        options={["زوجة", "زوج", "ابن", "ابنة", "أب", "أم"]}
                      />
                    </ProfileField>

                    <ProfileField label="الجنسيه">
                      <ClearableSelect
                        value={relForm.nationality}
                        onChange={(v) =>
                          setRelForm((p) => ({ ...p, nationality: v }))
                        }
                        options={["سعودي", "مصري", "أردني", "سوري", "يمني"]}
                      />
                    </ProfileField>

                    <ProfileField label="رقم الهويه">
                      <input
                        type="text"
                        dir="ltr"
                        className={fieldInputClass}
                        value={relForm.national_id}
                        onChange={(e) =>
                          setRelForm((p) => ({
                            ...p,
                            national_id: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="رقم جواز السفر">
                      <input
                        type="text"
                        dir="ltr"
                        className={fieldInputClass}
                        value={relForm.passport_no}
                        onChange={(e) =>
                          setRelForm((p) => ({
                            ...p,
                            passport_no: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="الوظيفه">
                      <ClearableSelect
                        value={relForm.job}
                        onChange={(v) => setRelForm((p) => ({ ...p, job: v }))}
                        options={["طالب", "ربة منزل", "طفل", "لا يعمل"]}
                      />
                    </ProfileField>

                    <ProfileField label="تاريخ انتهاء الهوية هجري">
                      <input
                        type="text"
                        dir="ltr"
                        className={fieldInputClass}
                        value={relForm.id_expiry_hijri}
                        onChange={(e) =>
                          setRelForm((p) => ({
                            ...p,
                            id_expiry_hijri: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="تاريخ انتهاء جواز السفر">
                      <input
                        type="date"
                        dir="ltr"
                        className={fieldInputClass}
                        value={relForm.passport_expiry}
                        onChange={(e) =>
                          setRelForm((p) => ({
                            ...p,
                            passport_expiry: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="تاريخ الميلاد">
                      <input
                        type="date"
                        dir="ltr"
                        className={fieldInputClass}
                        value={relForm.birth_date}
                        onChange={(e) =>
                          setRelForm((p) => ({
                            ...p,
                            birth_date: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="صورة جواز السفر - الهوية">
                      <FileUploadBox
                        fileName={relForm.attachment}
                        onFileSelect={(name) =>
                          setRelForm((p) => ({ ...p, attachment: name }))
                        }
                      />
                    </ProfileField>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddRelative}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      اضافه
                    </button>
                  </div>
                </div>

                <ProfileGridTable
                  columns={[
                    { key: "name", label: "اسم المرافق" },
                    {
                      key: "name_en",
                      label: "الأسم بالانجليزيه",
                      render: (r) =>
                        profileExtras.relatives_meta?.[r.name]?.name_en || "—",
                    },
                    {
                      key: "gender",
                      label: "الجنس",
                      render: (r) =>
                        profileExtras.relatives_meta?.[r.name]?.gender || "—",
                    },
                    { key: "relation", label: "صله القرابه" },
                    {
                      key: "nationality",
                      label: "الجنسيه",
                      render: (r) =>
                        profileExtras.relatives_meta?.[r.name]?.nationality ||
                        employee.nationality ||
                        "—",
                    },
                    { key: "national_id", label: "رقم الهويه" },
                    { key: "phone", label: "رقم جواز السفر" },
                    {
                      key: "job",
                      label: "الوظيفه",
                      render: (r) =>
                        profileExtras.relatives_meta?.[r.name]?.job || "—",
                    },
                    {
                      key: "id_expiry_hijri",
                      label: "تاريخ انتهاء الهويه",
                      render: (r) =>
                        profileExtras.relatives_meta?.[r.name]
                          ?.id_expiry_hijri || "—",
                    },
                    {
                      key: "passport_expiry",
                      label: "تاريخ انتهاء جواز السفر",
                      render: (r) =>
                        profileExtras.relatives_meta?.[r.name]
                          ?.passport_expiry || "—",
                    },
                    { key: "birth_date", label: "تاريخ الميلاد" },
                    {
                      key: "attachment",
                      label: "صورة جواز السفر - الهوية",
                      render: (r) => (
                        <AttachmentPreviewCell
                          value={
                            profileExtras.relatives_meta?.[r.name]?.attachment
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
                            deleteRelative.mutate(String(r.id), {
                              onSuccess: () => toast.success("تم حذف المرافق"),
                            })
                          }
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ),
                    },
                  ]}
                  rows={empRelatives}
                />
              </>
            )}

            {dependentsSection === "relatives_medical" && (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <ProfileField label="اسم المرافق">
                      <ClearableSelect
                        value={relMedForm.relative_name}
                        onChange={(v) =>
                          setRelMedForm((p) => ({ ...p, relative_name: v }))
                        }
                        options={
                          empRelatives.length > 0
                            ? empRelatives.map((r) => String(r.name))
                            : ["مرافق 1", "مرافق 2"]
                        }
                      />
                    </ProfileField>

                    <ProfileField label="شركه التامين">
                      <ClearableSelect
                        value={relMedForm.company}
                        onChange={(v) =>
                          setRelMedForm((p) => ({ ...p, company: v }))
                        }
                        options={[
                          "بوبا العربية للتأمين التعاوني",
                          "التعاونية للتأمين",
                          "ميدغلف للتأمين",
                        ]}
                      />
                    </ProfileField>

                    <ProfileField label="فئه التامين">
                      <ClearableSelect
                        value={relMedForm.category}
                        onChange={(v) =>
                          setRelMedForm((p) => ({ ...p, category: v }))
                        }
                        options={["VIP", "A", "B", "C"]}
                      />
                    </ProfileField>

                    <ProfileField label="رقم التامين">
                      <input
                        type="text"
                        dir="ltr"
                        className={fieldInputClass}
                        value={relMedForm.policy_no}
                        onChange={(e) =>
                          setRelMedForm((p) => ({
                            ...p,
                            policy_no: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="تاريخ البداية">
                      <input
                        type="date"
                        dir="ltr"
                        className={fieldInputClass}
                        value={relMedForm.start_date}
                        onChange={(e) =>
                          setRelMedForm((p) => ({
                            ...p,
                            start_date: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="تاريخ نهايه التامين">
                      <input
                        type="date"
                        dir="ltr"
                        className={fieldInputClass}
                        value={relMedForm.end_date}
                        onChange={(e) =>
                          setRelMedForm((p) => ({
                            ...p,
                            end_date: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="السنه">
                      <ClearableSelect
                        value={relMedForm.year}
                        onChange={(v) =>
                          setRelMedForm((p) => ({ ...p, year: v }))
                        }
                        options={["2025", "2026", "2027"]}
                      />
                    </ProfileField>

                    <ProfileField label="مبلغ التامين">
                      <input
                        type="number"
                        dir="ltr"
                        className={fieldInputClass}
                        value={relMedForm.amount}
                        onChange={(e) =>
                          setRelMedForm((p) => ({
                            ...p,
                            amount: e.target.value,
                          }))
                        }
                      />
                    </ProfileField>

                    <ProfileField label="تحمل الشركه">
                      <ClearableSelect
                        value={relMedForm.company_bear}
                        onChange={(v) =>
                          setRelMedForm((p) => ({ ...p, company_bear: v }))
                        }
                        options={["100%", "50%", "0% (تحمل الموظف)"]}
                      />
                    </ProfileField>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const list = profileExtras.relatives_medical || [];
                        onSaveExtras({
                          relatives_medical: [
                            { id: `rm-${Date.now()}`, ...relMedForm },
                            ...list,
                          ],
                        });
                        toast.success("تم حفظ التأمين الطبي للمرافق");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Save className="h-4 w-4" />
                      حفظ
                    </button>
                  </div>
                </div>

                <ProfileGridTable
                  columns={[
                    { key: "relative_name", label: "اسم المرافق" },
                    { key: "company", label: "شركه التامين" },
                    { key: "category", label: "فئه التامين" },
                    { key: "policy_no", label: "رقم التامين" },
                    { key: "start_date", label: "تاريخ البدايه" },
                    { key: "end_date", label: "تاريخ نهايه التامين" },
                    { key: "year", label: "السنه" },
                    { key: "amount", label: "مبلغ التامين" },
                    { key: "company_bear", label: "تحمل الشركه" },
                  ]}
                  rows={profileExtras.relatives_medical || []}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= 6. الارشيف ================= */}
      {subTab === "archive" && (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Right Sidebar: أقسام الارشيف */}
          <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:w-64">
            <h3 className="mb-2.5 border-b border-slate-100 px-2 pb-2 text-xs font-extrabold text-slate-500">
              أقسام الارشيف
            </h3>
            <div className="space-y-1">
              {[
                {
                  key: "emp_archive" as const,
                  label: "ارشيف بيانات الموظف",
                  icon: History,
                },
                {
                  key: "ent_archive" as const,
                  label: "ارشيف الاستحقاقات",
                  icon: Archive,
                },
              ].map((sec) => {
                const Icon = sec.icon;
                const active = archiveSection === sec.key;
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setArchiveSection(sec.key)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-xs font-bold transition ${
                      active
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1">
            {archiveSection === "emp_archive" && (
              <ProfileGridTable
                columns={[
                  { key: "field_name", label: "اسم الحقل" },
                  { key: "old_value", label: "القيمة القديمة" },
                  { key: "new_value", label: "القيمة الجديدة" },
                  { key: "modified_at", label: "تاريخ التعديل" },
                  { key: "user", label: "المستخدم" },
                ]}
                rows={profileExtras.emp_archive || []}
              />
            )}

            {archiveSection === "ent_archive" && (
              <ProfileGridTable
                columns={[
                  { key: "field_name", label: "اسم الحقل" },
                  { key: "old_value", label: "القيمة القديمة" },
                  { key: "new_value", label: "القيمة الجديدة" },
                  { key: "modified_at", label: "تاريخ التعديل" },
                  { key: "user", label: "المستخدم" },
                ]}
                rows={profileExtras.ent_archive || []}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
