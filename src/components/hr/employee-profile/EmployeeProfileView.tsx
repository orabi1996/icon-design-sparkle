import React, { useState, useEffect, useMemo } from "react";
import { UserCheck, Wallet, CalendarClock, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useRows, useSaveRow } from "@/lib/hr-db";
import { EmployeeProfileHeader } from "./EmployeeProfileHeader";
import { EmployeeDataTab } from "./EmployeeDataTab";
import { EmployeeFinancialTab } from "./EmployeeFinancialTab";
import { EmployeeAttendanceTab } from "./EmployeeAttendanceTab";

interface EmployeeProfileViewProps {
  employeeId: string;
  initialTab?: "employee" | "financial" | "attendance" | undefined;
}

export function EmployeeProfileView({
  employeeId,
  initialTab = "employee",
}: EmployeeProfileViewProps) {
  const { data: employees = [], isLoading } = useRows("employees") as {
    data?: any[];
    isLoading?: boolean;
  };
  const { data: allEntitlements = [] } = useRows("employee_entitlements") as {
    data?: any[];
  };
  const { data: allDeductions = [] } = useRows("employee_deductions") as {
    data?: any[];
  };
  const saveEmployee = useSaveRow("employees");

  const [mainTab, setMainTab] = useState<
    "employee" | "financial" | "attendance"
  >(initialTab);

  useEffect(() => {
    if (initialTab) {
      setMainTab(initialTab);
    }
  }, [initialTab]);

  const employee: any = useMemo(() => {
    const decoded = decodeURIComponent(employeeId || "");
    return employees.find(
      (e) =>
        String(e.id) === decoded ||
        String(e.emp_no) === decoded ||
        String(e.full_name) === decoded,
    );
  }, [employees, employeeId]);

  const storageKey = useMemo(
    () => `hr_emp_profile_extras_${employee?.id || employeeId}`,
    [employee?.id, employeeId],
  );

  const [profileExtras, setProfileExtras] = useState<any>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setProfileExtras(JSON.parse(raw));
      } else {
        setProfileExtras({});
      }
    } catch {
      setProfileExtras({});
    }
  }, [storageKey]);

  const handleSaveExtras = (patch: Record<string, any>) => {
    setProfileExtras((prev: any) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  };

  const handleSaveEmployee = async (patch: Record<string, any>) => {
    if (!employee) return;
    await saveEmployee.mutateAsync({
      ...employee,
      ...patch,
      id: employee.id,
    });
  };

  // Status flags for the 4 bottom pills in the hero header
  const statusFlags = useMemo(
    () => ({
      onDuty:
        profileExtras.flag_onDuty ??
        (employee?.status || "active") === "active",
      mawaridRegistered: Boolean(profileExtras.mawarid_registered ?? false),
      exemptFromFingerprintDeductions: Boolean(
        profileExtras.flag_exemptFingerprint ?? false,
      ),
      showInFingerprintReports: Boolean(
        profileExtras.flag_showInFingerprintReports ?? true,
      ),
    }),
    [profileExtras, employee?.status],
  );

  const handleToggleFlag = async (
    key:
      | "onDuty"
      | "mawaridRegistered"
      | "exemptFromFingerprintDeductions"
      | "showInFingerprintReports",
  ) => {
    if (key === "onDuty") {
      const nextVal = !statusFlags.onDuty;
      handleSaveExtras({ flag_onDuty: nextVal });
      if (employee) {
        await handleSaveEmployee({
          status: nextVal ? "active" : "inactive",
        });
      }
      toast.success(
        nextVal ? "تم تحديث الحالة: على رأس العمل" : "تم تحديث الحالة: موقوف",
      );
    } else if (key === "mawaridRegistered") {
      const nextVal = !statusFlags.mawaridRegistered;
      handleSaveExtras({ mawarid_registered: nextVal });
      toast.success(
        nextVal ? "تم تفعيل: مقيد موارد" : "تم إلغاء: مقيد موارد",
      );
    } else if (key === "exemptFromFingerprintDeductions") {
      const nextVal = !statusFlags.exemptFromFingerprintDeductions;
      handleSaveExtras({ flag_exemptFingerprint: nextVal });
      toast.success(
        nextVal
          ? "تم تفعيل: مستثنى من خصومات البصمة"
          : "تم إلغاء الاستثناء من خصومات البصمة",
      );
    } else if (key === "showInFingerprintReports") {
      const nextVal = !statusFlags.showInFingerprintReports;
      handleSaveExtras({ flag_showInFingerprintReports: nextVal });
      toast.success(
        nextVal
          ? "تم تفعيل: عرض في تقارير البصمة"
          : "تم إخفاء الموظف من تقارير البصمة",
      );
    }
  };

  // Calculate financial totals
  const { totalSalary, totalDeductions, netSalary } = useMemo(() => {
    if (!employee) {
      return { totalSalary: 0, totalDeductions: 0, netSalary: 0 };
    }
    const basic = Number(employee.basic_salary || 0);
    const housing = Number(employee.housing_allowance || 0);
    const transport = Number(employee.transport_allowance || 0);
    const other = Number(employee.other_allowance || 0);

    const empEnts = allEntitlements.filter(
      (e) =>
        String(e.employee_id) === String(employee.id) ||
        String(e.emp_no) === String(employee.emp_no),
    );
    const extraEnts = empEnts
      .filter(
        (e) =>
          !String(e.entitlement_name).includes("سكن") &&
          !String(e.entitlement_name).includes("نقل"),
      )
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const gross = basic + housing + transport + Math.max(other, extraEnts);

    const empDeds = allDeductions.filter(
      (d) =>
        String(d.employee_id) === String(employee.id) ||
        String(d.emp_no) === String(employee.emp_no),
    );
    const dedsTotal = empDeds.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const penaltiesTotal = (profileExtras.penalties || []).reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0,
    );

    const totalDed = dedsTotal + penaltiesTotal;
    return {
      totalSalary: gross,
      totalDeductions: totalDed,
      netSalary: Math.max(0, gross - totalDed),
    };
  }, [employee, allEntitlements, allDeductions, profileExtras.penalties]);

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-sm font-bold text-slate-600">
            جاري تحميل ملف الموظف...
          </p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
        <h2 className="text-lg font-extrabold text-slate-800">
          لم يتم العثور على الموظف المطلوب
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          تأكد من صحة الرقم الوظيفي أو اختر موظفاً من قائمة شؤون الموظفين.
        </p>
        <Link
          to="/staff"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
        >
          <ArrowRight className="h-4 w-4" />
          العودة لقائمة الموظفين
        </Link>
      </div>
    );
  }

  const mainTabs = [
    {
      key: "employee" as const,
      label: "بيانات الموظف",
      icon: UserCheck,
    },
    {
      key: "financial" as const,
      label: "البيانات المالية",
      icon: Wallet,
    },
    {
      key: "attendance" as const,
      label: "بيانات الحضور",
      icon: CalendarClock,
    },
  ];

  return (
    <div className="space-y-4 pb-10" dir="rtl">
      {/* Top Hero Card */}
      <EmployeeProfileHeader
        employee={{
          ...employee,
          avatar_url: profileExtras.avatar_url || employee.avatar_url,
          fingerprint_no:
            profileExtras.fingerprint_no ||
            employee.fingerprint_no ||
            employee.emp_no,
        }}
        totalSalary={totalSalary}
        totalDeductions={totalDeductions}
        netSalary={netSalary}
        statusFlags={statusFlags}
        onToggleFlag={handleToggleFlag}
        onAvatarChange={(dataUrl) => {
          handleSaveExtras({ avatar_url: dataUrl });
          toast.success("تم تحديث الصورة الشخصية للموظف");
        }}
      />

      {/* 3 Main Segmented Tabs */}
      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xs sm:grid-cols-3">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const active = mainTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMainTab(tab.key)}
              className={`flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                active
                  ? "bg-gradient-to-l from-blue-600 to-blue-700 text-white shadow-sm"
                  : "bg-slate-50/70 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Main Tab Body */}
      {mainTab === "employee" && (
        <EmployeeDataTab
          employee={employee}
          onSaveEmployee={handleSaveEmployee}
          profileExtras={profileExtras}
          onSaveExtras={handleSaveExtras}
        />
      )}

      {mainTab === "financial" && (
        <EmployeeFinancialTab
          employee={employee}
          onSaveEmployee={handleSaveEmployee}
          profileExtras={profileExtras}
          onSaveExtras={handleSaveExtras}
        />
      )}

      {mainTab === "attendance" && (
        <EmployeeAttendanceTab
          employee={employee}
          profileExtras={profileExtras}
          onSaveExtras={handleSaveExtras}
        />
      )}
    </div>
  );
}
