import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, useSettings, type Row } from "@/lib/hr-db";
import {
  getAllDataUpdateFields,
  getEmployeeFieldValue,
  loadDataUpdateConfig,
  loadDataUpdateRequests,
  resolveEmployeePermissionGroup,
  type DataUpdateConfigState,
  type DataUpdateRequestItem,
} from "@/lib/data-update-config";

export const Route = createFileRoute("/reports/data-update-completion")({
  head: () => ({
    meta: [
      { title: "تقرير إنجاز لتحديث البيانات | التقارير" },
      {
        name: "description",
        content:
          "تقرير إنجاز لتحديث البيانات: متابعة نسب إنجاز الموظفين لتحديث البيانات، الإقرارات المؤكدة، التحديثات المباشرة، ومراحل الموافقات.",
      },
    ],
  }),
  component: DataUpdateCompletionReportPage,
});

const inputCls =
  "h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-2 focus:ring-[#0070c0]/15";

function DataUpdateCompletionReportPage() {
  const configQuery = useSettings("data_update_config");
  const requestsQuery = useSettings("data_update_requests");
  const { data: employees = [] } = useRows("employees");

  const [config, setConfig] = useState<DataUpdateConfigState>(() => loadDataUpdateConfig());
  const [requests, setRequests] = useState<DataUpdateRequestItem[]>(() => loadDataUpdateRequests());

  useEffect(() => {
    if (configQuery.isFetched) {
      setConfig(loadDataUpdateConfig(configQuery.data?.["config_json"]));
    }
  }, [configQuery.data, configQuery.isFetched]);

  useEffect(() => {
    if (requestsQuery.isFetched) {
      setRequests(loadDataUpdateRequests(requestsQuery.data?.["requests_json"]));
    }
  }, [requestsQuery.data, requestsQuery.isFetched]);

  const allFields = useMemo(() => getAllDataUpdateFields(config), [config]);

  // Active Report View Tab
  const [reportTab, setReportTab] = useState<"operations_log" | "employees_matrix">("operations_log");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState<"all" | "direct" | "approval_required">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "rejected">("all");

  // Branches & Departments options
  const branchOptions = useMemo(() => {
    const s = new Set<string>();
    employees.forEach((e: Row) => {
      const b = String(e["branch"] || "").trim();
      if (b) s.add(b);
    });
    requests.forEach((r) => {
      if (r.branch) s.add(r.branch);
    });
    return Array.from(s);
  }, [employees, requests]);

  const departmentOptions = useMemo(() => {
    const s = new Set<string>();
    employees.forEach((e: Row) => {
      const d = String(e["department"] || "").trim();
      if (d) s.add(d);
    });
    requests.forEach((r) => {
      if (r.department) s.add(r.department);
    });
    return Array.from(s);
  }, [employees, requests]);

  // Filtered Operations / Requests Log
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (branchFilter !== "all" && req.branch !== branchFilter) return false;
      if (departmentFilter !== "all" && req.department !== departmentFilter) return false;
      if (fieldFilter !== "all" && req.fieldKey !== fieldFilter) return false;
      const effectiveMode = req.updateMode || "approval_required";
      if (modeFilter !== "all" && effectiveMode !== modeFilter) return false;

      if (statusFilter === "completed" && req.status !== "approved") return false;
      if (statusFilter === "pending" && req.status !== "pending") return false;
      if (statusFilter === "rejected" && req.status !== "rejected") return false;

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const hay = [
          req.requestNumber,
          req.employeeName,
          req.empNo,
          req.fieldLabel,
          req.oldValue,
          req.newValue,
          req.branch,
          req.department,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [branchFilter, departmentFilter, fieldFilter, modeFilter, requests, searchTerm, statusFilter]);

  // Employee Completion Matrix computation
  const employeeMatrix = useMemo(() => {
    const list = employees.length > 0
      ? employees
      : [
          {
            id: "emp-10078",
            emp_no: "10078",
            full_name: "أحمد محمد السيد السيد",
            branch: "المتقدمة الاهلية - فرع قرطبة",
            department: "ابتدائي",
            job_title: "معلم",
          },
        ];

    return list
      .map((emp: Row) => {
        const empId = String(emp["id"] || "");
        const empNo = String(emp["emp_no"] || "");
        const empName = String(emp["full_name"] || emp["employee_name"] || "موظف");
        const branch = String(emp["branch"] || "الفرع الرئيسي");
        const department = String(emp["department"] || "غير محدد");
        const jobTitle = String(emp["job_title"] || "—");

        const userGroup = resolveEmployeePermissionGroup(emp, config);
        const availableFields = allFields.filter(
          (f) => f.active !== false && userGroup.allowedFields[f.key]?.enabled !== false,
        );

        const empReqs = requests.filter(
          (r) =>
            (empId && String(r.employeeId) === empId) ||
            (empNo && String(r.empNo) === empNo) ||
            r.employeeName === empName,
        );

        const completedFieldKeys = new Set<string>();
        const pendingFieldKeys = new Set<string>();
        let directUpdatesCount = 0;
        let approvedWorkflowCount = 0;
        let lastUpdatedAt = "";
        let hasDeclared = false;

        empReqs.forEach((r) => {
          if (r.employeeDeclared) hasDeclared = true;
          if (!lastUpdatedAt || r.createdAt > lastUpdatedAt) {
            lastUpdatedAt = r.createdAt;
          }
          if (r.status === "approved") {
            completedFieldKeys.add(r.fieldKey);
            if (r.updateMode === "direct") directUpdatesCount++;
            else approvedWorkflowCount++;
          } else if (r.status === "pending") {
            pendingFieldKeys.add(r.fieldKey);
          }
        });

        // Also count fields that already have populated values on employee record
        const populatedFieldsCount = availableFields.filter((f) => {
          const val = getEmployeeFieldValue(emp, f.key);
          return val && val !== "غير محدد";
        }).length;

        const totalTarget = Math.max(availableFields.length, 1);
        const updatedOrCompletedCount = completedFieldKeys.size;
        const completionPct =
          updatedOrCompletedCount > 0
            ? Math.min(100, Math.round(((updatedOrCompletedCount + populatedFieldsCount * 0.5) / totalTarget) * 100))
            : Math.min(95, Math.round((populatedFieldsCount / totalTarget) * 100));

        return {
          empId,
          empNo,
          empName,
          branch,
          department,
          jobTitle,
          totalAvailableFields: availableFields.length,
          completedUpdatesCount: empReqs.filter((r) => r.status === "approved").length,
          directUpdatesCount,
          approvedWorkflowCount,
          pendingUpdatesCount: empReqs.filter((r) => r.status === "pending").length,
          hasDeclared: hasDeclared || empReqs.length > 0,
          lastUpdatedAt,
          completionPct: empReqs.some((r) => r.status === "approved") ? Math.max(completionPct, 100) : completionPct,
          empReqs,
        };
      })
      .filter((row) => {
        if (branchFilter !== "all" && row.branch !== branchFilter) return false;
        if (departmentFilter !== "all" && row.department !== departmentFilter) return false;
        if (statusFilter === "completed" && row.completedUpdatesCount === 0) return false;
        if (statusFilter === "pending" && row.pendingUpdatesCount === 0) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.trim().toLowerCase();
          if (
            !row.empName.toLowerCase().includes(q) &&
            !row.empNo.toLowerCase().includes(q) &&
            !row.branch.toLowerCase().includes(q) &&
            !row.department.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      });
  }, [allFields, branchFilter, config, departmentFilter, employees, requests, searchTerm, statusFilter]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const totalEmployees = Math.max(employees.length, 1);
    const employeesWithUpdates = new Set(
      requests.filter((r) => r.status === "approved").map((r) => r.employeeId || r.empNo || r.employeeName),
    ).size;
    const directCount = requests.filter((r) => r.updateMode === "direct" && r.status === "approved").length;
    const approvalCompletedCount = requests.filter(
      (r) => r.updateMode !== "direct" && r.status === "approved",
    ).length;
    const pendingApprovalCount = requests.filter((r) => r.status === "pending").length;
    const totalCompletedOps = directCount + approvalCompletedCount;

    return {
      totalEmployees,
      employeesWithUpdates,
      directCount,
      approvalCompletedCount,
      pendingApprovalCount,
      totalCompletedOps,
    };
  }, [employees.length, requests]);

  // Export to Excel
  const handleExportExcel = () => {
    if (reportTab === "operations_log") {
      const rows = filteredRequests.map((r) => ({
        "رقم العملية": r.requestNumber,
        "الرقم الوظيفي": r.empNo,
        "اسم الموظف": r.employeeName,
        الفرع: r.branch,
        القسم: r.department,
        "الحقل المحدث": r.fieldLabel,
        "القيمة السابقة": r.oldValue,
        "القيمة الجديدة": r.newValue,
        "آلية التحديث":
          r.updateMode === "direct"
            ? "تحديث مباشر فوري بإقرار الموظف"
            : `مراحل موافقة (${r.approvalGroupName})`,
        "إقرار الموظف (OK)": r.employeeDeclared !== false ? "تم الإقرار والتأكيد ✓" : "—",
        "الحالة النهائية":
          r.status === "approved"
            ? "منجز ومسمّع في النظام"
            : r.status === "rejected"
              ? "مرفوض"
              : "قيد مراحل الموافقة",
        "تاريخ التحديث": r.createdAt.slice(0, 10),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "تقرير إنجاز تحديث البيانات");
      XLSX.writeFile(wb, `تقرير_إنجاز_تحديث_البيانات_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("تم تصدير تقرير إنجاز تحديث البيانات إلى Excel بنجاح");
    } else {
      const rows = employeeMatrix.map((m) => ({
        "الرقم الوظيفي": m.empNo,
        "اسم الموظف": m.empName,
        الفرع: m.branch,
        القسم: m.department,
        "المسمى الوظيفي": m.jobTitle,
        "الحقول المتاحة": m.totalAvailableFields,
        "تحديثات مباشرة منجزة": m.directUpdatesCount,
        "تحديثات بموافقة معتمدة": m.approvedWorkflowCount,
        "طلبات قيد الموافقة": m.pendingUpdatesCount,
        "إقرار صحة البيانات": m.hasDeclared ? "مؤكد ✓" : "لم يقر بعد",
        "نسبة الإنجاز": `${m.completionPct}%`,
        "آخر تحديث": m.lastUpdatedAt ? m.lastUpdatedAt.slice(0, 10) : "—",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "إنجاز الموظفين");
      XLSX.writeFile(wb, `تقرير_إنجاز_الموظفين_لتحديث_البيانات_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("تم تصدير مصفوفة إنجاز الموظفين إلى Excel بنجاح");
    }
  };

  return (
    <AppShell>
      <div className="mt-2 space-y-4" dir="rtl">
        <Breadcrumbs trail={["التقارير", "تقارير الموظفين", "تقرير إنجاز لتحديث البيانات"]} />

        {/* Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <MaterialIcon name="fact_check" size={26} />
            </div>
            <div>
              <h1 className="text-[16px] font-extrabold text-[#004e82]">
                تقرير إنجاز لتحديث البيانات وإقرارات الموظفين
              </h1>
              <p className="text-[12px] text-slate-500">
                متابعة شاملة لجميع الحقول المحدثة مباشرة بإقرار الموظف (OK) والحقول المعتمدة عبر مجموعات ومراحل الموافقة ونسب إنجاز الموظفين
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <MaterialIcon name="download" size={17} />
              تصدير Excel
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <MaterialIcon name="print" size={17} />
              طباعة التقرير
            </button>
            <Link
              to="/regulations/data-update"
              className="flex items-center gap-1.5 rounded-lg border border-[#0070c0] bg-blue-50 px-3.5 py-2 text-xs font-bold text-[#0070c0] transition hover:bg-blue-100"
            >
              <MaterialIcon name="settings" size={17} />
              تهيئة وإنشاء الحقول
            </Link>
            <Link
              to="/portal"
              className="flex items-center gap-1.5 rounded-lg bg-[#0070c0] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#005fa3]"
            >
              <MaterialIcon name="person" size={17} />
              بوابة الموظف
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-900">
                إجمالي التحديثات المنجزة والمسمّعة
              </span>
              <MaterialIcon name="verified" size={22} className="text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-800">
              {kpis.totalCompletedOps}
            </div>
            <p className="mt-1 text-[11px] font-semibold text-emerald-700">
              سمعت في ملفات الموظفين والتقارير بنجاح
            </p>
          </div>

          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-teal-900">
                تحديثات مباشرة فورية (بإقرار الموظف OK)
              </span>
              <MaterialIcon name="bolt" size={22} className="text-teal-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-teal-800">{kpis.directCount}</div>
            <p className="mt-1 text-[11px] font-semibold text-teal-700">
              تمت مباشرة بعد تأكيد قرار صحة البيانات
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#004e82]">
                تحديثات معتمدة عبر مجموعات الموافقة
              </span>
              <MaterialIcon name="approval" size={22} className="text-[#0070c0]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#0070c0]">
              {kpis.approvalCompletedCount}
            </div>
            <p className="mt-1 text-[11px] font-semibold text-slate-600">
              مرت بمراحل الاعتماد ({kpis.pendingApprovalCount} قيد المراجعة حالياً)
            </p>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-purple-900">
                الحقول المفعلة في التهيئة
              </span>
              <MaterialIcon name="Library_add_check" size={22} className="text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-purple-800">{allFields.length}</div>
            <p className="mt-1 text-[11px] font-semibold text-purple-700">
              منها {(config.customFields || []).length} حقول مخصصة أنشئت في التهيئة
            </p>
          </div>
        </div>

        {/* Report View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReportTab("operations_log")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                reportTab === "operations_log"
                  ? "bg-[#0070c0] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <MaterialIcon name="receipt_long" size={18} />
              <span>سجل عمليات إنجاز تحديث البيانات والإقرارات ({filteredRequests.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setReportTab("employees_matrix")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                reportTab === "employees_matrix"
                  ? "bg-[#0070c0] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <MaterialIcon name="groups" size={18} />
              <span>مصفوفة نسب إنجاز الموظفين ({employeeMatrix.length})</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 w-full pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="بحث بالموظف، الرقم الوظيفي، الحقل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={inputCls}
            />

            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className={inputCls}
            >
              <option value="all">جميع الحقول (الأساسية والمخصصة)</option>
              {allFields.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label} ({f.updateMode === "direct" ? "تحديث مباشر" : "بموافقة"})
                </option>
              ))}
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as any)}
              className={inputCls}
            >
              <option value="all">جميع مسارات التحديث</option>
              <option value="direct">تحديث مباشر فوري بإقرار الموظف (OK)</option>
              <option value="approval_required">مربوط بمجموعة ومراحل موافقة</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={inputCls}
            >
              <option value="all">جميع حالات الإنجاز</option>
              <option value="completed">مُنجز وسمّع في النظام ✓</option>
              <option value="pending">قيد مراحل الموافقة</option>
              <option value="rejected">مرفوض</option>
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className={inputCls}
            >
              <option value="all">جميع الفروع</option>
              {branchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ===================================================================
            TAB 1: سجل عمليات إنجاز تحديث البيانات والإقرارات
           =================================================================== */}
        {reportTab === "operations_log" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0f3560] text-white font-bold">
                  <tr>
                    <th className="px-3 py-3">رقم العملية</th>
                    <th className="px-3 py-3">الموظف</th>
                    <th className="px-3 py-3">الفرع / القسم</th>
                    <th className="px-3 py-3">الحقل المحدث</th>
                    <th className="px-3 py-3">القيمة السابقة ⬅️ الجديدة</th>
                    <th className="px-3 py-3">آلية التحديث والمسار</th>
                    <th className="px-3 py-3 text-center">إقرار الموظف (OK)</th>
                    <th className="px-3 py-3 text-center">حالة الإنجاز والتسميع</th>
                    <th className="px-3 py-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <MaterialIcon name="fact_check" size={40} className="opacity-30" />
                          <span className="font-bold text-slate-600">
                            لا توجد عمليات تحديث مسجلة تطابق الفلتر الحالي
                          </span>
                          <span className="text-[11px] text-slate-400">
                            بمجرد قيام الموظف بتحديث بياناته والضغط على (موافق OK) ستسمع البيانات وتظهر هنا فوراً
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isDirect = req.updateMode === "direct";
                      return (
                        <tr key={req.id} className="hover:bg-slate-50 transition">
                          <td className="px-3 py-3 font-mono font-black text-[#0070c0]">
                            {req.requestNumber}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-extrabold text-slate-900">{req.employeeName}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              #{req.empNo || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-semibold text-slate-800">{req.branch}</div>
                            <div className="text-[10px] text-slate-500">{req.department}</div>
                          </td>
                          <td className="px-3 py-3 font-extrabold text-[#004e82]">
                            {req.fieldLabel}
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-slate-400 line-through ml-1.5">
                              {req.oldValue || "غير محدد"}
                            </span>
                            <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              {req.newValue}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {isDirect ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                <MaterialIcon name="bolt" size={13} />
                                تحديث مباشر فوري بإقرار الموظف
                              </span>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-extrabold text-[#004e82]">
                                  مراحل موافقة: {req.approvalGroupName}
                                </span>
                                {req.allowDirectManager && (
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    المدير المباشر:{" "}
                                    {req.directManagerStatus === "approved"
                                      ? "وافق ✓"
                                      : req.directManagerStatus === "rejected"
                                        ? "رفض ✗"
                                        : "بانتظار الموافقة"}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {req.employeeDeclared !== false ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800"
                                title={req.declarationTextSnapshot || "أقر الموظف بصحة البيانات"}
                              >
                                <MaterialIcon name="check_circle" size={13} />
                                أقر وتأكد (OK)
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${
                                req.status === "approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : req.status === "rejected"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {req.status === "approved"
                                ? "مُنجز وسمّع في النظام ✓"
                                : req.status === "rejected"
                                  ? "مرفوض"
                                  : `قيد الاعتماد (${req.awaitingText})`}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono text-[11px] text-slate-600">
                            {req.createdAt.slice(0, 10)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: مصفوفة نسب إنجاز الموظفين لتحديث البيانات
           =================================================================== */}
        {reportTab === "employees_matrix" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0f3560] text-white font-bold">
                  <tr>
                    <th className="px-3 py-3">الرقم الوظيفي</th>
                    <th className="px-3 py-3">اسم الموظف</th>
                    <th className="px-3 py-3">الفرع / القسم</th>
                    <th className="px-3 py-3 text-center">الحقول المتاحة</th>
                    <th className="px-3 py-3 text-center">تحديث مباشر منجز</th>
                    <th className="px-3 py-3 text-center">تحديث بموافقة معتمد</th>
                    <th className="px-3 py-3 text-center">قيد الموافقة</th>
                    <th className="px-3 py-3 text-center">إقرار صحة البيانات</th>
                    <th className="px-3 py-3">نسبة إنجاز تحديث البيانات</th>
                    <th className="px-3 py-3">آخر تحديث</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employeeMatrix.map((row) => (
                    <tr key={row.empId || row.empNo} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-3 font-mono font-bold text-[#0070c0]">
                        #{row.empNo || "—"}
                      </td>
                      <td className="px-3 py-3 font-extrabold text-slate-900">{row.empName}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-700">{row.branch}</div>
                        <div className="text-[10px] text-slate-500">{row.department}</div>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-700">
                        {row.totalAvailableFields}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-extrabold text-emerald-800">
                          {row.directUpdatesCount}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-extrabold text-[#004e82]">
                          {row.approvedWorkflowCount}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-extrabold text-amber-800">
                          {row.pendingUpdatesCount}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {row.hasDeclared ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <MaterialIcon name="verified" size={13} />
                            تم الإقرار (OK)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">لم يقر بعد</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.completionPct >= 80
                                  ? "bg-emerald-600"
                                  : row.completionPct >= 50
                                    ? "bg-[#0070c0]"
                                    : "bg-amber-500"
                              }`}
                              style={{ width: `${row.completionPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-black text-slate-800">
                            {row.completionPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-slate-500">
                        {row.lastUpdatedAt ? row.lastUpdatedAt.slice(0, 10) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
