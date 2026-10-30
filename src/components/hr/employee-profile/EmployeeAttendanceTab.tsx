import React, { useState } from "react";
import {
  Clock,
  LogOut,
  UserX,
  CalendarDays,
  Power,
  PlayCircle,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  Calculator,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import {
  ProfileField,
  ClearableSelect,
  ProfileGridTable,
  fieldInputClass,
  toHijriDate,
  formatNumber,
} from "./shared";
import { useRows } from "@/lib/hr-db";

interface EmployeeAttendanceTabProps {
  employee: any;
  profileExtras: any;
  onSaveExtras: (patch: Record<string, any>) => void;
}

export function EmployeeAttendanceTab({
  employee,
  profileExtras,
  onSaveExtras,
}: EmployeeAttendanceTabProps) {
  const [subTab, setSubTab] = useState<
    | "lateness"
    | "early_leave"
    | "absence"
    | "leaves"
    | "activation"
    | "work_start"
    | "schedule"
  >("lateness");

  const { data: allAttendance = [] } = useRows("attendance_records") as { data?: any[] };
  const { data: allLeaves = [] } = useRows("leave_requests") as { data?: any[] };
  const { data: allShiftGroups = [] } = useRows("work_shift_groups") as { data?: any[] };

  const empAttendance = allAttendance.filter(
    (a) =>
      String(a.employee_id) === String(employee.id) ||
      String(a.emp_no) === String(employee.emp_no) ||
      String(a.employee_name) === String(employee.full_name),
  );

  const empLeaves = allLeaves.filter(
    (l) =>
      String(l.employee_id) === String(employee.id) ||
      String(l.emp_no) === String(employee.emp_no) ||
      String(l.employee_name) === String(employee.full_name),
  );

  // Shared year/month filter
  const [filterYear, setFilterYear] = useState("2026");
  const [filterMonth, setFilterMonth] = useState("كل الشهور");

  // 1. Lateness Form
  const [lateForm, setLateForm] = useState({
    date: "2026-04-12",
    apply_regulation: false,
    official_in: "08:00",
    actual_in: "08:30",
    details: "تأخير صباحي",
  });

  const calcMinutesDiff = (t1: string, t2: string) => {
    const [h1 = 8, m1 = 0] = (t1 || "08:00").split(":").map(Number);
    const [h2 = 8, m2 = 0] = (t2 || "08:00").split(":").map(Number);
    return Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1));
  };

  const handleAddLateness = (mode: "regulation" | "custom") => {
    const mins = calcMinutesDiff(lateForm.official_in, lateForm.actual_in);
    const dailyRate = Number(employee.basic_salary || 6000) / 30;
    const minuteRate = dailyRate / (8 * 60);
    const rawValue = Math.round(mins * minuteRate * 100) / 100;
    const calcValue =
      mode === "regulation" ? Math.round(rawValue * 1.25 * 100) / 100 : rawValue;

    const list = profileExtras.lateness_records || [];
    onSaveExtras({
      lateness_records: [
        {
          id: `lat-${Date.now()}`,
          date: lateForm.date,
          late_minutes: mins,
          late_value: rawValue,
          deduction_type: lateForm.apply_regulation
            ? "خصم لائحة تلقائي"
            : "خصم دقائق",
          calc_type: mode === "regulation" ? "احتساب لائحة" : "تطبيق مخصص",
          calc_value: calcValue,
          details: lateForm.details || "—",
        },
        ...list,
      ],
    });
    toast.success(
      `تم تسجيل التأخير (${mins} دقيقة) بنظام ${
        mode === "regulation" ? "احتساب اللائحة" : "التطبيق المخصص"
      }`,
    );
  };

  const latenessRows = [
    ...(profileExtras.lateness_records || []),
    ...empAttendance
      .filter((a) => Number(a.late_minutes || 0) > 0)
      .map((a) => ({
        id: a.id,
        date: a.record_date || a.date || "2026-04-01",
        late_minutes: a.late_minutes,
        late_value: Math.round(Number(a.late_minutes || 0) * 0.5),
        deduction_type: "خصم بصمة",
        calc_type: "احتساب لائحة",
        calc_value: Math.round(Number(a.late_minutes || 0) * 0.5),
        details: a.notes || "بصمة الحضور",
      })),
  ];

  // 2. Early Leave Form
  const [earlyForm, setEarlyForm] = useState({
    date: "2026-04-12",
    apply_regulation: false,
    official_out: "16:00",
    actual_out: "15:15",
    details: "انصراف مبكر",
  });

  const handleAddEarlyLeave = (mode: "regulation" | "custom") => {
    const mins = calcMinutesDiff(earlyForm.actual_out, earlyForm.official_out);
    const dailyRate = Number(employee.basic_salary || 6000) / 30;
    const minuteRate = dailyRate / (8 * 60);
    const val = Math.round(mins * minuteRate * 100) / 100;

    const list = profileExtras.early_leave_records || [];
    onSaveExtras({
      early_leave_records: [
        {
          id: `ear-${Date.now()}`,
          date: earlyForm.date,
          actual_out: earlyForm.actual_out,
          official_out: earlyForm.official_out,
          minutes: mins,
          calc_type: mode === "regulation" ? "احتساب لائحة" : "تطبيق مخصص",
          value: val,
          details: earlyForm.details || "—",
        },
        ...list,
      ],
    });
    toast.success(`تم تسجيل الانصراف المبكر (${mins} دقيقة)`);
  };

  // 3. Absence Form
  const [absForm, setAbsForm] = useState({
    day: "2026-04-12",
    apply_regulation: false,
    reason: "غياب بدون عذر",
    notes: "",
  });

  const handleAddAbsence = (mode: "regulation" | "custom") => {
    const dailyRate = Math.round(Number(employee.basic_salary || 6000) / 30);
    const list = profileExtras.absence_records || [];
    onSaveExtras({
      absence_records: [
        {
          id: `abs-${Date.now()}`,
          date: absForm.day,
          deduction: mode === "regulation" ? dailyRate * 1.5 : dailyRate,
          deduction_type:
            mode === "regulation" ? "خصم لائحة (يوم ونصف)" : "خصم يوم عمل",
          reason: absForm.reason,
          notes: absForm.notes || "—",
        },
        ...list,
      ],
    });
    toast.success("تم تسجيل يوم الغياب بنجاح");
  };

  // 7. Work Schedule Accordion
  const [expandedGroup, setExpandedGroup] = useState<string>("grp-1");

  const shiftGroupsDisplay = [
    {
      id: "grp-1",
      group_name:
        profileExtras.shift_group ||
        allShiftGroups[0]?.name ||
        "الاداريين",
      start_date: employee.start_date || "2025-11-17",
      end_date: "2026-12-31",
      morning_in_from: "06:00",
      morning_in_to: "07:00",
      morning_out_from: "14:00",
      morning_out_to: "15:00",
      evening_in_from: "--",
      evening_in_to: "--",
      evening_out_from: "--",
      evening_out_to: "--",
      days: [
        {
          day: "الاحد",
          p1_in: "06:30:00",
          p1_out: "14:30:00",
          p2_in: "--",
          p2_out: "--",
          minutes: "480.0",
        },
        {
          day: "الاثنين",
          p1_in: "06:30:00",
          p1_out: "14:30:00",
          p2_in: "--",
          p2_out: "--",
          minutes: "480.0",
        },
        {
          day: "الثلاثاء",
          p1_in: "06:30:00",
          p1_out: "14:30:00",
          p2_in: "--",
          p2_out: "--",
          minutes: "480.0",
        },
        {
          day: "الاربعاء",
          p1_in: "06:30:00",
          p1_out: "14:30:00",
          p2_in: "--",
          p2_out: "--",
          minutes: "480.0",
        },
        {
          day: "الخميس",
          p1_in: "06:30:00",
          p1_out: "14:30:00",
          p2_in: "--",
          p2_out: "--",
          minutes: "480.0",
        },
        {
          day: "الجمعة",
          p1_in: "--",
          p1_out: "--",
          p2_in: "--",
          p2_out: "--",
          minutes: "0.0",
        },
        {
          day: "السبت",
          p1_in: "--",
          p1_out: "--",
          p2_in: "--",
          p2_out: "--",
          minutes: "0.0",
        },
      ],
    },
  ];

  const subTabs = [
    { key: "lateness" as const, label: "التأخير", icon: Clock },
    { key: "early_leave" as const, label: "الانصراف المبكر", icon: LogOut },
    { key: "absence" as const, label: "الغياب", icon: UserX },
    { key: "leaves" as const, label: "الاجازات", icon: CalendarDays },
    {
      key: "activation" as const,
      label: "تفعيل او ايقاف الموظفين",
      icon: Power,
    },
    { key: "work_start" as const, label: "مباشرة العمل", icon: PlayCircle },
    { key: "schedule" as const, label: "جدول الدوام", icon: CalendarRange },
  ];

  return (
    <div className="space-y-4">
      {/* 7 Sub-tabs bar */}
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

      {/* ================= 1. التأخير ================= */}
      {subTab === "lateness" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <ProfileField label="التاريخ">
                <input
                  type="date"
                  dir="ltr"
                  className={fieldInputClass}
                  value={lateForm.date}
                  onChange={(e) =>
                    setLateForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </ProfileField>

              <ProfileField label="هجري">
                <input
                  type="text"
                  dir="ltr"
                  readOnly
                  className={`${fieldInputClass} bg-slate-50`}
                  value={toHijriDate(lateForm.date)}
                />
              </ProfileField>

              <ProfileField label="الحضور الرسمى">
                <input
                  type="time"
                  dir="ltr"
                  className={fieldInputClass}
                  value={lateForm.official_in}
                  onChange={(e) =>
                    setLateForm((p) => ({ ...p, official_in: e.target.value }))
                  }
                />
              </ProfileField>

              <ProfileField label="الحضور الفعلى">
                <input
                  type="time"
                  dir="ltr"
                  className={fieldInputClass}
                  value={lateForm.actual_in}
                  onChange={(e) =>
                    setLateForm((p) => ({ ...p, actual_in: e.target.value }))
                  }
                />
              </ProfileField>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={lateForm.apply_regulation}
                  onChange={(e) =>
                    setLateForm((p) => ({
                      ...p,
                      apply_regulation: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>تطبيق جزاء اللائحة عند احتساب المسير</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddLateness("regulation")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  احتساب لائحة
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLateness("custom")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  تطبيق مخصص
                </button>
              </div>
            </div>
          </div>

          {/* Year & Month Filter */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <ProfileField label="السنة">
              <ClearableSelect
                value={filterYear}
                onChange={setFilterYear}
                options={["2025", "2026", "2027"]}
              />
            </ProfileField>
            <ProfileField label="الشهور">
              <ClearableSelect
                value={filterMonth}
                onChange={setFilterMonth}
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
          </div>

          <ProfileGridTable
            columns={[
              { key: "date", label: "التاريخ" },
              { key: "late_minutes", label: "دقائق التأخير" },
              {
                key: "late_value",
                label: "قيمة التأخير",
                render: (r) => formatNumber(Number(r.late_value || 0)),
              },
              { key: "deduction_type", label: "نوع الخصم" },
              { key: "calc_type", label: "نوع الاحتساب" },
              {
                key: "calc_value",
                label: "قيمة احتساب الخصم",
                render: (r) => formatNumber(Number(r.calc_value || 0)),
              },
              { key: "details", label: "تفاصيل" },
            ]}
            rows={latenessRows}
          />
        </div>
      )}

      {/* ================= 2. الانصراف المبكر ================= */}
      {subTab === "early_leave" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <ProfileField label="التاريخ">
                <input
                  type="date"
                  dir="ltr"
                  className={fieldInputClass}
                  value={earlyForm.date}
                  onChange={(e) =>
                    setEarlyForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </ProfileField>

              <ProfileField label="هجري">
                <input
                  type="text"
                  dir="ltr"
                  readOnly
                  className={`${fieldInputClass} bg-slate-50`}
                  value={toHijriDate(earlyForm.date)}
                />
              </ProfileField>

              <ProfileField label="الانصراف الرسمى">
                <input
                  type="time"
                  dir="ltr"
                  className={fieldInputClass}
                  value={earlyForm.official_out}
                  onChange={(e) =>
                    setEarlyForm((p) => ({
                      ...p,
                      official_out: e.target.value,
                    }))
                  }
                />
              </ProfileField>

              <ProfileField label="الانصراف الفعلى">
                <input
                  type="time"
                  dir="ltr"
                  className={fieldInputClass}
                  value={earlyForm.actual_out}
                  onChange={(e) =>
                    setEarlyForm((p) => ({ ...p, actual_out: e.target.value }))
                  }
                />
              </ProfileField>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={earlyForm.apply_regulation}
                  onChange={(e) =>
                    setEarlyForm((p) => ({
                      ...p,
                      apply_regulation: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>تطبيق جزاء اللائحة عند احتساب المسير</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddEarlyLeave("regulation")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  احتساب لائحة
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEarlyLeave("custom")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  تطبيق مخصص
                </button>
              </div>
            </div>
          </div>

          {/* Year & Month Filter */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <ProfileField label="السنة">
              <ClearableSelect
                value={filterYear}
                onChange={setFilterYear}
                options={["2025", "2026", "2027"]}
              />
            </ProfileField>
            <ProfileField label="الشهور">
              <ClearableSelect
                value={filterMonth}
                onChange={setFilterMonth}
                options={["كل الشهور", "يناير", "فبراير", "مارس", "أبريل"]}
              />
            </ProfileField>
          </div>

          <ProfileGridTable
            columns={[
              { key: "date", label: "التاريخ" },
              { key: "actual_out", label: "الانصراف الفعلى" },
              { key: "official_out", label: "الانصراف الرسمى" },
              { key: "minutes", label: "عدد الدقائق" },
              { key: "calc_type", label: "نوع الاحتساب" },
              {
                key: "value",
                label: "القيمة",
                render: (r) => formatNumber(Number(r.value || 0)),
              },
              { key: "details", label: "تفاصيل" },
            ]}
            rows={profileExtras.early_leave_records || []}
          />
        </div>
      )}

      {/* ================= 3. الغياب ================= */}
      {subTab === "absence" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ProfileField label="يوم">
                <input
                  type="date"
                  dir="ltr"
                  className={fieldInputClass}
                  value={absForm.day}
                  onChange={(e) =>
                    setAbsForm((p) => ({ ...p, day: e.target.value }))
                  }
                />
              </ProfileField>

              <ProfileField label="السبب">
                <input
                  type="text"
                  className={fieldInputClass}
                  value={absForm.reason}
                  onChange={(e) =>
                    setAbsForm((p) => ({ ...p, reason: e.target.value }))
                  }
                />
              </ProfileField>

              <ProfileField label="ملاحظات">
                <input
                  type="text"
                  className={fieldInputClass}
                  value={absForm.notes}
                  onChange={(e) =>
                    setAbsForm((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </ProfileField>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={absForm.apply_regulation}
                  onChange={(e) =>
                    setAbsForm((p) => ({
                      ...p,
                      apply_regulation: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>تطبيق جزاء اللائحة عند احتساب المسير</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddAbsence("regulation")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  احتساب لائحة
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAbsence("custom")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  تطبيق مخصص
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <ProfileField label="السنة">
              <ClearableSelect
                value={filterYear}
                onChange={setFilterYear}
                options={["2025", "2026", "2027"]}
              />
            </ProfileField>
            <ProfileField label="الشهور">
              <ClearableSelect
                value={filterMonth}
                onChange={setFilterMonth}
                options={["كل الشهور", "يناير", "فبراير", "مارس", "أبريل"]}
              />
            </ProfileField>
          </div>

          <ProfileGridTable
            columns={[
              { key: "date", label: "تاريخ الغياب" },
              {
                key: "deduction",
                label: "الخصم",
                render: (r) => formatNumber(Number(r.deduction || 0)),
              },
              { key: "deduction_type", label: "نوع الخصم" },
              { key: "reason", label: "السبب" },
              { key: "notes", label: "ملاحظات" },
            ]}
            rows={profileExtras.absence_records || []}
          />
        </div>
      )}

      {/* ================= 4. الاجازات ================= */}
      {subTab === "leaves" && (
        <ProfileGridTable
          columns={[
            {
              key: "leave_type",
              label: "اسم الاجازه",
              render: (r) => r.leave_type || "إجازة سنوية",
            },
            {
              key: "created_at",
              label: "تاريخ الطلب",
              render: (r) =>
                (r.created_at || "").slice(0, 10) ||
                r.start_date ||
                "2026-01-01",
            },
            {
              key: "national_id",
              label: "رقم الهويه",
              render: () => employee.national_id || "—",
            },
            {
              key: "nationality",
              label: "الجنسيه",
              render: () => employee.nationality || "سعودي",
            },
            {
              key: "branch",
              label: "الفرع",
              render: () => employee.branch || "الفرع الرئيسي",
            },
            {
              key: "department",
              label: "القسم",
              render: () => employee.department || "الموارد البشرية",
            },
            {
              key: "job_title",
              label: "الوظيفه",
              render: () => employee.job_title || "—",
            },
            { key: "days", label: "المدة" },
            { key: "start_date", label: "تاريخ بداية الاجازة" },
            { key: "end_date", label: "تاريخ نهاية الاجازة" },
            {
              key: "status",
              label: "الحاله",
              render: (r) => (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  {r.status === "approved" ? "معتمدة" : r.status || "معتمدة"}
                </span>
              ),
            },
          ]}
          rows={empLeaves}
        />
      )}

      {/* ================= 5. تفعيل او ايقاف الموظفين ================= */}
      {subTab === "activation" && (
        <ProfileGridTable
          columns={[
            { key: "reason", label: "السبب" },
            { key: "year", label: "السنه" },
            { key: "date", label: "التاريخ" },
            {
              key: "status",
              label: "الحاله",
              render: (r) => (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  {r.status}
                </span>
              ),
            },
            { key: "user", label: "المستخدم" },
            { key: "entry_date", label: "تاريخ الادخال" },
          ]}
          rows={
            profileExtras.activation_logs || [
              {
                id: "act-1",
                reason: "تعيين وتفعيل حساب الموظف",
                year: (employee.hire_date || "2024").slice(0, 4),
                date: employee.hire_date || "2024-01-01",
                status: "مفعل",
                user: "مدير النظام",
                entry_date: employee.hire_date || "2024-01-01",
              },
            ]
          }
        />
      )}

      {/* ================= 6. مباشرة العمل ================= */}
      {subTab === "work_start" && (
        <ProfileGridTable
          columns={[
            { key: "branch", label: "الفرع" },
            { key: "department", label: "القسم" },
            { key: "entry_date", label: "تاريخ الادخال" },
            { key: "last_notice_date", label: "تاريخ اخر اشعار" },
            { key: "previous_date", label: "التاريخ السابق" },
            { key: "user", label: "المستخدم" },
          ]}
          rows={
            profileExtras.work_start_logs || [
              {
                id: "ws-1",
                branch: employee.branch || "الفرع الرئيسي",
                department: employee.department || "الموارد البشرية",
                entry_date:
                  employee.start_date || employee.hire_date || "2024-01-01",
                last_notice_date:
                  employee.start_date || employee.hire_date || "2024-01-01",
                previous_date: "—",
                user: "مدير النظام",
              },
            ]
          }
        />
      )}

      {/* ================= 7. جدول الدوام ================= */}
      {subTab === "schedule" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-blue-50/70 text-slate-700">
                  <th className="w-12 px-3 py-3 text-center">#</th>
                  <th className="px-4 py-3 font-bold">اسم المجموعة</th>
                  <th className="px-4 py-3 font-bold">تاريخ البدايه</th>
                  <th className="px-4 py-3 font-bold">تاريخ الانتهاء</th>
                </tr>
              </thead>
              <tbody>
                {shiftGroupsDisplay.map((grp) => {
                  const isOpen = expandedGroup === grp.id;
                  return (
                    <React.Fragment key={grp.id}>
                      <tr
                        onClick={() =>
                          setExpandedGroup(isOpen ? "" : grp.id)
                        }
                        className="cursor-pointer border-b border-slate-100 bg-slate-50/50 transition hover:bg-blue-50/30"
                      >
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600"
                          >
                            {isOpen ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronLeft className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-extrabold text-slate-800">
                          {grp.group_name}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600" dir="ltr">
                          {grp.start_date}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600" dir="ltr">
                          {grp.end_date}
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={4} className="bg-slate-50/40 p-4">
                            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                              {/* Warm Amber Summary Header */}
                              <div className="overflow-x-auto rounded-lg border border-amber-200">
                                <table className="w-full text-center text-xs">
                                  <thead>
                                    <tr className="bg-amber-50/90 text-amber-900">
                                      <th className="border-l border-amber-200 px-3 py-2 font-bold">
                                        الحضور الصباحى من
                                      </th>
                                      <th className="border-l border-amber-200 px-3 py-2 font-bold">
                                        الحضور الصباحى الى
                                      </th>
                                      <th className="border-l border-amber-200 px-3 py-2 font-bold">
                                        الانصراف الصباحى من
                                      </th>
                                      <th className="border-l border-amber-200 px-3 py-2 font-bold">
                                        الانصراف الصباحى الى
                                      </th>
                                      <th className="border-l border-amber-200 px-3 py-2 font-bold">
                                        الحضور المسائى من
                                      </th>
                                      <th className="border-l border-amber-200 px-3 py-2 font-bold">
                                        الحضور المسائى الى
                                      </th>
                                      <th className="border-l border-amber-200 px-3 py-2 font-bold">
                                        الانصراف المسائى من
                                      </th>
                                      <th className="px-3 py-2 font-bold">
                                        الانصراف المسائى الى
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="bg-white font-bold text-slate-700" dir="ltr">
                                      <td className="border-l border-slate-100 px-3 py-2">
                                        {grp.morning_in_from}
                                      </td>
                                      <td className="border-l border-slate-100 px-3 py-2">
                                        {grp.morning_in_to}
                                      </td>
                                      <td className="border-l border-slate-100 px-3 py-2">
                                        {grp.morning_out_from}
                                      </td>
                                      <td className="border-l border-slate-100 px-3 py-2">
                                        {grp.morning_out_to}
                                      </td>
                                      <td className="border-l border-slate-100 px-3 py-2">
                                        {grp.evening_in_from}
                                      </td>
                                      <td className="border-l border-slate-100 px-3 py-2">
                                        {grp.evening_in_to}
                                      </td>
                                      <td className="border-l border-slate-100 px-3 py-2">
                                        {grp.evening_out_from}
                                      </td>
                                      <td className="px-3 py-2">
                                        {grp.evening_out_to}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* 7-Day Daily Breakdown Table */}
                              <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-center text-xs">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-700">
                                      <th className="border-l border-slate-200 px-3 py-2 font-bold">
                                        يوم
                                      </th>
                                      <th className="border-l border-slate-200 px-3 py-2 font-bold">
                                        حضور رسمى فترة 1
                                      </th>
                                      <th className="border-l border-slate-200 px-3 py-2 font-bold">
                                        انصراف رسمى فترة 1
                                      </th>
                                      <th className="border-l border-slate-200 px-3 py-2 font-bold">
                                        حضور رسمى فترة 2
                                      </th>
                                      <th className="border-l border-slate-200 px-3 py-2 font-bold">
                                        انصراف رسمى فترة 2
                                      </th>
                                      <th className="px-3 py-2 font-bold">
                                        الحضور بالدقائق
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {grp.days.map((d) => (
                                      <tr
                                        key={d.day}
                                        className="border-t border-slate-100 hover:bg-slate-50"
                                      >
                                        <td className="border-l border-slate-100 px-3 py-2 font-bold text-slate-800">
                                          {d.day}
                                        </td>
                                        <td
                                          className="border-l border-slate-100 px-3 py-2 text-slate-600"
                                          dir="ltr"
                                        >
                                          {d.p1_in}
                                        </td>
                                        <td
                                          className="border-l border-slate-100 px-3 py-2 text-slate-600"
                                          dir="ltr"
                                        >
                                          {d.p1_out}
                                        </td>
                                        <td
                                          className="border-l border-slate-100 px-3 py-2 text-slate-600"
                                          dir="ltr"
                                        >
                                          {d.p2_in}
                                        </td>
                                        <td
                                          className="border-l border-slate-100 px-3 py-2 text-slate-600"
                                          dir="ltr"
                                        >
                                          {d.p2_out}
                                        </td>
                                        <td
                                          className="px-3 py-2 font-bold text-blue-700"
                                          dir="ltr"
                                        >
                                          {d.minutes}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
