import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, useSettings, type Row } from "@/lib/hr-db";
import {
  getAllDataUpdateFields,
  getEmployeeFieldValue,
  loadDataUpdateConfig,
  loadDataUpdateRequests,
  type DataUpdateConfigState,
  type DataUpdateRequestItem,
} from "@/lib/data-update-config";
import { ANDALUS_BRANCHES, ANDALUS_DEPARTMENTS } from "@/lib/andalus-seed";

export const Route = createFileRoute("/reports/data-update-completion")({
  head: () => ({
    meta: [
      { title: "تقرير إنجاز تحديث بيانات الموظفين | شركة مدارس الأندلس التعليمية" },
      {
        name: "description",
        content:
          "تقرير إنجاز تحديث بيانات الموظفين لشركة مدارس الأندلس التعليمية: متابعة المنجز وغير المنجز، القيمة السابقة والجديدة، التواريخ، وتصدير Excel و PDF.",
      },
    ],
  }),
  component: DataUpdateCompletionReportPage,
});

const inputCls =
  "h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-[12px] font-bold text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-2 focus:ring-[#0070c0]/15";

export interface ExtraReportColumn {
  id: string;
  label: string;
  fieldKey: string;
  enabled: boolean;
  isCustomUserCol?: boolean;
}

const DEFAULT_EXTRA_COLUMNS: ExtraReportColumn[] = [
  { id: "col_national_id", label: "رقم الهوية / الإقامة", fieldKey: "national_id", enabled: false },
  { id: "col_job_title", label: "المسمى الوظيفي", fieldKey: "job_title", enabled: true },
  { id: "col_nationality", label: "الجنسية", fieldKey: "nationality", enabled: false },
  { id: "col_phone", label: "رقم الجوال الحالي", fieldKey: "phone", enabled: false },
  { id: "col_email", label: "البريد الإلكتروني", fieldKey: "email", enabled: false },
  { id: "col_short_address", label: "العنوان الوطني المختصر", fieldKey: "short_address", enabled: false },
  { id: "col_postal_code", label: "بريد السكن (الرمز البريدي)", fieldKey: "postal_code", enabled: false },
  { id: "col_building_no", label: "رقم المبنى", fieldKey: "building_no", enabled: false },
  { id: "col_iqama_expiry", label: "تاريخ انتهاء الإقامة", fieldKey: "iqama_expiry", enabled: false },
  { id: "col_direct_manager", label: "المدير المباشر", fieldKey: "direct_manager", enabled: false },
  { id: "col_request_title", label: "اسم طلب التحديث", fieldKey: "_request_title", enabled: true },
  { id: "col_approver", label: "المعتمد / حالة الإقرار", fieldKey: "_approver_info", enabled: true },
];

export interface UnifiedReportRow {
  rowId: string;
  empId: string;
  empNo: string;
  employeeName: string;
  branch: string;
  department: string;
  completionStatus: "completed" | "not_completed" | "pending";
  completionLabel: string;
  updatesCount: number;
  requestNumber: string;
  requestTitle: string;
  fieldKey: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  updatedDate: string;
  updatedTime: string;
  decisionDate: string;
  updateModeLabel: string;
  approverInfo: string;
  employeeRecord: Row;
}

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

  // Filters State
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [completionFilter, setCompletionFilter] = useState<
    "all" | "completed" | "not_completed" | "pending"
  >("all");
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<"all" | "direct" | "approval_required">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Granularity Mode:
  // "all_employees": shows every employee (Completed with their updates + Not Completed so user knows who updated and who hasn't)
  // "detailed_fields": expands multi-field updates into individual field change rows
  const [granularity, setGranularity] = useState<"all_employees" | "detailed_fields">("all_employees");

  // Extra Columns Customizer ("إضافة فيتشر أو كولم زيادة")
  const [extraColumns, setExtraColumns] = useState<ExtraReportColumn[]>(DEFAULT_EXTRA_COLUMNS);
  const [showColumnBuilder, setShowColumnBuilder] = useState<boolean>(false);
  const [newColLabel, setNewColLabel] = useState<string>("");
  const [newColFieldKey, setNewColFieldKey] = useState<string>("social_status");

  // Pagination
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Branch & Department Options (including all Al-Andalus Schools branches)
  const branchOptions = useMemo(() => {
    const set = new Set<string>(ANDALUS_BRANCHES.map((b) => b.name_ar));
    employees.forEach((e: Row) => {
      const b = String(e["branch"] || "").trim();
      if (b) set.add(b);
    });
    requests.forEach((r) => {
      if (r.branch) set.add(r.branch);
    });
    return Array.from(set);
  }, [employees, requests]);

  const departmentOptions = useMemo(() => {
    const set = new Set<string>(ANDALUS_DEPARTMENTS);
    employees.forEach((e: Row) => {
      const d = String(e["department"] || "").trim();
      if (d) set.add(d);
    });
    requests.forEach((r) => {
      if (r.department) set.add(r.department);
    });
    return Array.from(set);
  }, [employees, requests]);

  // Index requests by employeeId and empNo
  const requestsByEmployee = useMemo(() => {
    const map = new Map<string, DataUpdateRequestItem[]>();
    for (const req of requests) {
      const keys = [String(req.employeeId || ""), String(req.empNo || "")].filter(Boolean);
      for (const k of keys) {
        const list = map.get(k) || [];
        if (!list.some((x) => x.id === req.id)) {
          list.push(req);
          map.set(k, list);
        }
      }
    }
    return map;
  }, [requests]);

  // Build Unified Report Rows across all 500 employees
  const allUnifiedRows = useMemo<UnifiedReportRow[]>(() => {
    const rows: UnifiedReportRow[] = [];

    for (const emp of employees) {
      const empId = String(emp["id"] || "");
      const empNo = String(emp["emp_no"] || "");
      const employeeName = String(emp["full_name"] || emp["name"] || "موظف");
      const branch = String(emp["branch"] || "مدارس الأندلس الأهلية - الإدارة العامة (جدة)");
      const department = String(emp["department"] || "المرحلة الابتدائية");

      const empReqs =
        requestsByEmployee.get(empId) ||
        requestsByEmployee.get(empNo) ||
        [];

      if (empReqs.length === 0) {
        // الموظف لم يقم بتحديث البيانات بعد (غير منجز)
        rows.push({
          rowId: `uncompleted-${empId || empNo}`,
          empId,
          empNo,
          employeeName,
          branch,
          department,
          completionStatus: "not_completed",
          completionLabel: "غير منجز (لم يقم بالتحديث)",
          updatesCount: 0,
          requestNumber: "—",
          requestTitle: "لم يتم تقديم طلب تحديث بعد",
          fieldKey: "",
          fieldLabel: "لم يتم تحديث أي بيان",
          oldValue: "—",
          newValue: "—",
          updatedDate: "—",
          updatedTime: "—",
          decisionDate: "—",
          updateModeLabel: "لم يبدأ",
          approverInfo: "بانتظار قيام الموظف بالتحديث",
          employeeRecord: emp,
        });
      } else {
        // الموظف لديه طلبات تحديث (منجز أو قيد الموافقة)
        for (const req of empReqs) {
          const status: "completed" | "not_completed" | "pending" =
            req.status === "approved"
              ? "completed"
              : req.status === "pending"
                ? "pending"
                : "not_completed";

          const statusLabel =
            req.status === "approved"
              ? "منجز ومعتمد ✓"
              : req.status === "pending"
                ? "قيد المراجعة والاعتماد"
                : "مرفوض / غير مكتمل";

          const datePart = req.createdAt ? req.createdAt.slice(0, 10) : "2026-11-01";
          const timePart =
            req.createdAt && req.createdAt.includes("T")
              ? req.createdAt.slice(11, 16)
              : "09:30";
          const decisionDatePart = req.decisionAt ? req.decisionAt.slice(0, 10) : datePart;

          const modeLabel =
            req.updateMode === "direct"
              ? "لا يخضع لسلسلة موافقة (تحديث مباشر بإقرار الموظف)"
              : `يخضع لسلسلة موافقة (${req.approvalGroupName || "اعتماد الموارد البشرية"})`;

          const approverInfo =
            req.status === "approved"
              ? `${req.decisionBy || "إقرار الموظف المباشر"} (${decisionDatePart})`
              : req.awaitingText || "بانتظار الاعتماد";

          const changes =
            Array.isArray(req.fieldChanges) && req.fieldChanges.length > 0
              ? req.fieldChanges
              : [
                  {
                    fieldKey: req.fieldKey,
                    fieldLabel: req.fieldLabel,
                    oldValue: req.oldValue,
                    newValue: req.newValue,
                  },
                ];

          if (granularity === "detailed_fields" && changes.length > 1) {
            changes.forEach((ch, idx) => {
              rows.push({
                rowId: `${req.id}-ch-${idx}`,
                empId,
                empNo,
                employeeName,
                branch: req.branch || branch,
                department: req.department || department,
                completionStatus: status,
                completionLabel: statusLabel,
                updatesCount: changes.length,
                requestNumber: req.requestNumber,
                requestTitle: req.publishedRequestTitle || req.reason || "طلب تحديث بيانات الموظف",
                fieldKey: ch.fieldKey,
                fieldLabel: ch.fieldLabel,
                oldValue: ch.oldValue || "غير محدد",
                newValue: ch.newValue || "—",
                updatedDate: datePart,
                updatedTime: timePart,
                decisionDate: decisionDatePart,
                updateModeLabel: modeLabel,
                approverInfo,
                employeeRecord: emp,
              });
            });
          } else {
            const combinedLabels = changes.map((c) => c.fieldLabel).join(" + ");
            const combinedOld = changes
              .map((c) => (changes.length > 1 ? `${c.fieldLabel}: ${c.oldValue}` : c.oldValue))
              .join(" | ");
            const combinedNew = changes
              .map((c) => (changes.length > 1 ? `${c.fieldLabel}: ${c.newValue}` : c.newValue))
              .join(" | ");

            rows.push({
              rowId: req.id,
              empId,
              empNo,
              employeeName,
              branch: req.branch || branch,
              department: req.department || department,
              completionStatus: status,
              completionLabel: statusLabel,
              updatesCount: changes.length,
              requestNumber: req.requestNumber,
              requestTitle: req.publishedRequestTitle || req.reason || "طلب تحديث بيانات الموظف",
              fieldKey: req.fieldKey,
              fieldLabel: combinedLabels || req.fieldLabel,
              oldValue: combinedOld || req.oldValue || "غير محدد",
              newValue: combinedNew || req.newValue || "—",
              updatedDate: datePart,
              updatedTime: timePart,
              decisionDate: decisionDatePart,
              updateModeLabel: modeLabel,
              approverInfo,
              employeeRecord: emp,
            });
          }
        }
      }
    }

    return rows;
  }, [employees, requestsByEmployee, granularity]);

  // Apply Filters to Unified Rows
  const filteredRows = useMemo(() => {
    return allUnifiedRows.filter((row) => {
      if (branchFilter !== "all" && row.branch !== branchFilter) return false;
      if (departmentFilter !== "all" && row.department !== departmentFilter) return false;

      if (completionFilter === "completed" && row.completionStatus !== "completed") return false;
      if (completionFilter === "not_completed" && row.completionStatus !== "not_completed")
        return false;
      if (completionFilter === "pending" && row.completionStatus !== "pending") return false;

      if (fieldFilter !== "all") {
        if (row.completionStatus === "not_completed") return false;
        const matchesKey =
          row.fieldKey === fieldFilter ||
          row.fieldLabel.includes(
            allFields.find((f) => f.key === fieldFilter)?.label || fieldFilter,
          );
        if (!matchesKey) return false;
      }

      if (modeFilter !== "all") {
        if (row.completionStatus === "not_completed") return false;
        const isDirect = row.updateModeLabel.includes("لا يخضع");
        if (modeFilter === "direct" && !isDirect) return false;
        if (modeFilter === "approval_required" && isDirect) return false;
      }

      if (dateFrom && row.updatedDate !== "—" && row.updatedDate < dateFrom) return false;
      if (dateTo && row.updatedDate !== "—" && row.updatedDate > dateTo) return false;
      if ((dateFrom || dateTo) && row.updatedDate === "—") return false;

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const hay = [
          row.empNo,
          row.employeeName,
          row.branch,
          row.department,
          row.requestNumber,
          row.requestTitle,
          row.fieldLabel,
          row.oldValue,
          row.newValue,
          String(row.employeeRecord["national_id"] || ""),
          String(row.employeeRecord["phone"] || ""),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    allUnifiedRows,
    branchFilter,
    departmentFilter,
    completionFilter,
    fieldFilter,
    modeFilter,
    dateFrom,
    dateTo,
    searchTerm,
    allFields,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    branchFilter,
    departmentFilter,
    completionFilter,
    fieldFilter,
    modeFilter,
    dateFrom,
    dateTo,
    searchTerm,
    granularity,
  ]);

  // KPIs Calculation based on current Branch & Department scope
  const scopeStats = useMemo(() => {
    const scopedEmployees = employees.filter((e) => {
      if (branchFilter !== "all" && String(e["branch"] || "") !== branchFilter) return false;
      if (departmentFilter !== "all" && String(e["department"] || "") !== departmentFilter)
        return false;
      return true;
    });

    const totalEmployeesInScope = scopedEmployees.length;
    let completedEmployeesCount = 0;
    let pendingEmployeesCount = 0;
    let notCompletedEmployeesCount = 0;
    let totalCompletedUpdates = 0;
    let totalFieldChangesCount = 0;

    for (const emp of scopedEmployees) {
      const empId = String(emp["id"] || "");
      const empNo = String(emp["emp_no"] || "");
      const reqs = requestsByEmployee.get(empId) || requestsByEmployee.get(empNo) || [];

      const approvedReqs = reqs.filter((r) => r.status === "approved");
      const pendingReqs = reqs.filter((r) => r.status === "pending");

      if (approvedReqs.length > 0) {
        completedEmployeesCount++;
        totalCompletedUpdates += approvedReqs.length;
        approvedReqs.forEach((r) => {
          totalFieldChangesCount +=
            Array.isArray(r.fieldChanges) && r.fieldChanges.length > 0
              ? r.fieldChanges.length
              : 1;
        });
      } else if (pendingReqs.length > 0) {
        pendingEmployeesCount++;
      } else {
        notCompletedEmployeesCount++;
      }
    }

    const completionRate =
      totalEmployeesInScope > 0
        ? Math.round((completedEmployeesCount / totalEmployeesInScope) * 100)
        : 0;

    return {
      totalEmployeesInScope,
      completedEmployeesCount,
      pendingEmployeesCount,
      notCompletedEmployeesCount,
      totalCompletedUpdates,
      totalFieldChangesCount,
      completionRate,
    };
  }, [employees, requestsByEmployee, branchFilter, departmentFilter]);

  // Branch Completion Breakdown for Al-Andalus Schools
  const branchBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { branch: string; total: number; completed: number; pending: number; uncompleted: number }
    >();

    for (const emp of employees) {
      const b = String(emp["branch"] || "فرع غير محدد");
      const curr = map.get(b) || { branch: b, total: 0, completed: 0, pending: 0, uncompleted: 0 };
      curr.total++;

      const empId = String(emp["id"] || "");
      const empNo = String(emp["emp_no"] || "");
      const reqs = requestsByEmployee.get(empId) || requestsByEmployee.get(empNo) || [];

      if (reqs.some((r) => r.status === "approved")) {
        curr.completed++;
      } else if (reqs.some((r) => r.status === "pending")) {
        curr.pending++;
      } else {
        curr.uncompleted++;
      }
      map.set(b, curr);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [employees, requestsByEmployee]);

  const activeExtraColumns = useMemo(
    () => extraColumns.filter((c) => c.enabled),
    [extraColumns],
  );

  // Helper to read extra column value for a row
  const getExtraColumnValue = (row: UnifiedReportRow, col: ExtraReportColumn): string => {
    if (col.fieldKey === "_request_title") return row.requestTitle;
    if (col.fieldKey === "_approver_info") return row.approverInfo;
    const val = getEmployeeFieldValue(row.employeeRecord, col.fieldKey);
    return val || "—";
  };

  // Toggle an extra column
  const toggleExtraColumn = (colId: string) => {
    setExtraColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, enabled: !c.enabled } : c)),
    );
  };

  // Add a custom column on the fly
  const handleAddCustomColumn = () => {
    const label = newColLabel.trim() || allFields.find((f) => f.key === newColFieldKey)?.label || newColFieldKey;
    if (!label) {
      toast.error("يرجى تحديد اسم العمود الإضافي");
      return;
    }
    const id = `custom_col_${Date.now()}`;
    setExtraColumns((prev) => [
      ...prev,
      {
        id,
        label,
        fieldKey: newColFieldKey,
        enabled: true,
        isCustomUserCol: true,
      },
    ]);
    setNewColLabel("");
    toast.success(`تمت إضافة عمود «${label}» إلى التقرير بنجاح`);
  };

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // ─── Export to Excel (.xlsx) ───
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      toast.error("لا توجد بيانات مطابقة للفلاتر الحالية لتصديرها");
      return;
    }

    const rowsForExcel = filteredRows.map((r, index) => {
      const baseObj: Record<string, string | number> = {
        م: index + 1,
        "الرقم الوظيفي": r.empNo,
        "اسم الموظف": r.employeeName,
        الفرع: r.branch,
        القسم: r.department,
        "حالة الإنجاز": r.completionLabel,
        "عدد الحقول المحدثة": r.updatesCount,
        "رقم الطلب": r.requestNumber,
        "البيان / الحقل المحدث": r.fieldLabel,
        "القيمة السابقة": r.oldValue,
        "القيمة الجديدة": r.newValue,
        "تاريخ التحديث": r.updatedDate,
        "وقت التحديث": r.updatedTime,
        "تاريخ الاعتماد": r.decisionDate,
        "آلية التحديث": r.updateModeLabel,
      };

      for (const col of activeExtraColumns) {
        baseObj[col.label] = getExtraColumnValue(r, col);
      }

      return baseObj;
    });

    const ws = XLSX.utils.json_to_sheet(rowsForExcel);
    ws["!views"] = [{ rightToLeft: true }];
    const colKeys = Object.keys(rowsForExcel[0] || {});
    ws["!cols"] = colKeys.map((k) => ({
      wch: Math.max(k.length + 6, 18),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير إنجاز تحديث البيانات");
    XLSX.writeFile(
      wb,
      `تقرير_إنجاز_تحديث_بيانات_الموظفين_مدارس_الأندلس_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    toast.success(`تم تصدير ${filteredRows.length} سجل إلى ملف Excel بنجاح`);
  };

  // ─── Export to Official RTL PDF from inside the system ───
  const handleExportPDF = () => {
    if (filteredRows.length === 0) {
      toast.error("لا توجد بيانات مطابقة للفلاتر الحالية لتصديرها إلى PDF");
      return;
    }

    const printWin = window.open("", "_blank", "width=1280,height=900");
    if (!printWin) {
      window.print();
      return;
    }

    const extraHeadersHtml = activeExtraColumns
      .map((c) => `<th>${c.label}</th>`)
      .join("");

    const rowsHtml = filteredRows
      .map((r, idx) => {
        const statusBadgeStyle =
          r.completionStatus === "completed"
            ? "background:#dcfce7;color:#166534;border:1px solid #86efac;"
            : r.completionStatus === "pending"
              ? "background:#fef3c7;color:#92400e;border:1px solid #fcd34d;"
              : "background:#ffe4e6;color:#9f1239;border:1px solid #fda4af;";

        const extraCellsHtml = activeExtraColumns
          .map((c) => `<td>${getExtraColumnValue(r, c)}</td>`)
          .join("");

        return `
          <tr>
            <td style="text-align:center;font-weight:700;">${idx + 1}</td>
            <td style="text-align:center;font-family:monospace;font-weight:700;color:#004e82;">${r.empNo}</td>
            <td style="font-weight:700;">${r.employeeName}</td>
            <td>${r.branch}</td>
            <td>${r.department}</td>
            <td style="text-align:center;">
              <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800;${statusBadgeStyle}">
                ${r.completionLabel}
              </span>
            </td>
            <td style="font-weight:700;color:#0f3560;">${r.fieldLabel}</td>
            <td style="color:#64748b;text-decoration:${r.oldValue !== "—" ? "line-through" : "none"};">${r.oldValue}</td>
            <td style="font-weight:800;color:#047857;background:#ecfdf5;">${r.newValue}</td>
            <td style="text-align:center;font-family:monospace;">${r.updatedDate}${r.updatedTime !== "—" ? ` (${r.updatedTime})` : ""}</td>
            ${extraCellsHtml}
          </tr>
        `;
      })
      .join("");

    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تقرير إنجاز تحديث بيانات الموظفين - شركة مدارس الأندلس التعليمية</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 12px;
      background: #ffffff;
      color: #0f172a;
      direction: rtl;
      font-size: 11px;
    }
    .report-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #0f3560;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .company-box h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #0f3560;
    }
    .company-box p {
      margin: 2px 0 0;
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }
    .title-box {
      text-align: center;
    }
    .title-box h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #0070c0;
    }
    .title-box span {
      font-size: 11px;
      color: #64748b;
      font-weight: 700;
    }
    .meta-box {
      text-align: left;
      font-size: 11px;
      color: #334155;
      font-weight: 700;
    }
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .kpi-card .label {
      font-size: 10px;
      color: #475569;
      font-weight: 700;
    }
    .kpi-card .val {
      font-size: 16px;
      font-weight: 800;
      color: #0f3560;
      margin-top: 2px;
    }
    .filters-bar {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 10px;
      margin-bottom: 10px;
      font-size: 10.5px;
      font-weight: 700;
      color: #334155;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    th {
      background: #0f3560 !important;
      color: #ffffff !important;
      padding: 6px 6px;
      border: 1px solid #0f3560;
      text-align: right;
      font-weight: 800;
    }
    td {
      padding: 5px 6px;
      border: 1px solid #cbd5e1;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .footer-sign {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      border-top: 1px dashed #94a3b8;
      padding-top: 10px;
    }
    .no-print-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f3560;
      color: #fff;
      padding: 8px 14px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .no-print-bar button {
      background: #10b981;
      color: #fff;
      border: none;
      padding: 6px 16px;
      border-radius: 6px;
      font-weight: 800;
      cursor: pointer;
      font-size: 12px;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span>معاينة التقرير الرسمي الجاهز للتصدير بصيغة PDF — شركة مدارس الأندلس التعليمية (${filteredRows.length} سجل)</span>
    <div style="display:flex;gap:8px;">
      <button onclick="window.print()">حفظ كملف PDF / طباعة الآن</button>
      <button onclick="window.close()" style="background:#64748b;">إغلاق</button>
    </div>
  </div>

  <div class="report-header">
    <div class="company-box">
      <h1>شركة مدارس الأندلس التعليمية</h1>
      <p>الإدارة العامة للموارد البشرية وشؤون الموظفين — المملكة العربية السعودية</p>
    </div>
    <div class="title-box">
      <h2>تقرير إنجاز تحديث بيانات الموظفين</h2>
      <span>بيان تفصيلي بالتحديثات المنجزة وغير المنجزة والقيم السابقة والجديدة والتواريخ</span>
    </div>
    <div class="meta-box">
      <div>تاريخ استخراج التقرير: ${new Date().toISOString().slice(0, 10)}</div>
      <div>إجمالي السجلات المعروضة: ${filteredRows.length} سجل</div>
    </div>
  </div>

  <div class="kpi-strip">
    <div class="kpi-card">
      <div class="label">إجمالي الموظفين المشمولين</div>
      <div class="val">${scopeStats.totalEmployeesInScope} موظف</div>
    </div>
    <div class="kpi-card">
      <div class="label">إجمالي التحديثات التي تمت</div>
      <div class="val" style="color:#047857;">${scopeStats.totalCompletedUpdates} طلب (${scopeStats.totalFieldChangesCount} بيان)</div>
    </div>
    <div class="kpi-card">
      <div class="label">الموظفون المنجزون (حدثوا بياناتهم)</div>
      <div class="val" style="color:#047857;">${scopeStats.completedEmployeesCount} موظف (${scopeStats.completionRate}%)</div>
    </div>
    <div class="kpi-card">
      <div class="label">غير المنجزين (لم يحدثوا بعد)</div>
      <div class="val" style="color:#be123c;">${scopeStats.notCompletedEmployeesCount} موظف</div>
    </div>
    <div class="kpi-card">
      <div class="label">طلبات قيد المراجعة والاعتماد</div>
      <div class="val" style="color:#b45309;">${scopeStats.pendingEmployeesCount} طلب</div>
    </div>
  </div>

  <div class="filters-bar">
    <span>الفرع: ${branchFilter === "all" ? "جميع فروع مدارس الأندلس" : branchFilter}</span>
    <span>القسم: ${departmentFilter === "all" ? "جميع الأقسام" : departmentFilter}</span>
    <span>حالة الإنجاز: ${
      completionFilter === "all"
        ? "الكل (المنجز وغير المنجز)"
        : completionFilter === "completed"
          ? "المنجز فقط"
          : completionFilter === "not_completed"
            ? "غير المنجز فقط"
            : "قيد الاعتماد"
    }</span>
    ${dateFrom ? `<span>من تاريخ: ${dateFrom}</span>` : ""}
    ${dateTo ? `<span>إلى تاريخ: ${dateTo}</span>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:32px;text-align:center;">م</th>
        <th style="width:65px;text-align:center;">الرقم الوظيفي</th>
        <th>اسم الموظف</th>
        <th>الفرع</th>
        <th>القسم</th>
        <th style="text-align:center;">حالة الإنجاز</th>
        <th>البيان المحدث</th>
        <th>القيمة السابقة</th>
        <th>القيمة الجديدة</th>
        <th style="text-align:center;">تاريخ ووقت التحديث</th>
        ${extraHeadersHtml}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer-sign">
    <div>إعداد: قسم عمليات الموارد البشرية</div>
    <div>مراجعة: إدارة شؤون الموظفين — شركة مدارس الأندلس التعليمية</div>
    <div>اعتماد: المدير العام للموارد البشرية</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
    toast.success("تم تجهيز ملف PDF الرسمي للتقرير بنجاح");
  };

  return (
    <AppShell>
      <div className="w-full space-y-4" dir="rtl">
        {/* Top Official Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f3560] text-white shadow-xs">
              <MaterialIcon name="fact_check" size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[17px] font-black text-[#0f3560]">
                  تقرير إنجاز تحديث بيانات الموظفين
                </h1>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                  شركة مدارس الأندلس التعليمية ({employees.length} موظف • {ANDALUS_BRANCHES.length} فرع)
                </span>
              </div>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                متابعة دقيقة لإجمالي التحديثات التي تمت، الموظفين المنجزين وغير المنجزين، القيمة السابقة والقيمة الجديدة بالتواريخ، مع تخصيص الأعمدة وتصدير Excel و PDF
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowColumnBuilder((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition ${
                showColumnBuilder
                  ? "border-[#0070c0] bg-[#0070c0] text-white"
                  : "border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100"
              }`}
            >
              <MaterialIcon name="view_column" size={17} />
              <span>إضافة / تخصيص أعمدة التقرير ({activeExtraColumns.length})</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <MaterialIcon name="table_view" size={17} />
              <span>تصدير Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-rose-700"
            >
              <MaterialIcon name="picture_as_pdf" size={17} />
              <span>تصدير PDF رسمي</span>
            </button>

            <Link
              to="/regulations/data-update"
              className="flex items-center gap-1.5 rounded-xl border border-[#0070c0] bg-blue-50 px-3.5 py-2 text-xs font-extrabold text-[#0070c0] transition hover:bg-blue-100"
            >
              <MaterialIcon name="add_task" size={17} />
              <span>إنشاء / تهيئة طلب تحديث</span>
            </Link>
          </div>
        </div>

        {/* 5 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => setCompletionFilter("all")}
            className={`text-right rounded-2xl border p-4 transition ${
              completionFilter === "all"
                ? "border-[#0070c0] bg-blue-50/70 ring-2 ring-[#0070c0]/20"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-600">
                إجمالي موظفي مدارس الأندلس
              </span>
              <MaterialIcon name="groups" size={22} className="text-[#0070c0]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#0f3560] font-mono">
              {scopeStats.totalEmployeesInScope}
            </div>
            <p className="mt-1 text-[11px] font-bold text-slate-500">
              موزعين على {ANDALUS_BRANCHES.length} فرعاً تعليمياً وإدارياً
            </p>
          </button>

          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-teal-900">
                إجمالي التحديثات التي تمت
              </span>
              <MaterialIcon name="published_with_changes" size={22} className="text-teal-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-teal-800 font-mono">
                {scopeStats.totalCompletedUpdates}
              </span>
              <span className="text-xs font-extrabold text-teal-700">
                طلب ({scopeStats.totalFieldChangesCount} بيان محدث)
              </span>
            </div>
            <p className="mt-1 text-[11px] font-bold text-teal-700">
              سمّعت في ملفات الموظفين والتقارير
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCompletionFilter("completed")}
            className={`text-right rounded-2xl border p-4 transition ${
              completionFilter === "completed"
                ? "border-emerald-600 bg-emerald-100/70 ring-2 ring-emerald-600/20"
                : "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-900">
                المنجز (قاموا بتحديث بياناتهم)
              </span>
              <MaterialIcon name="check_circle" size={22} className="text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-800 font-mono">
                {scopeStats.completedEmployeesCount}
              </span>
              <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-xs font-black text-emerald-900 font-mono">
                {scopeStats.completionRate}%
              </span>
            </div>
            <p className="mt-1 text-[11px] font-bold text-emerald-700">
              اضغط لعرض الموظفين المنجزين فقط
            </p>
          </button>

          <button
            type="button"
            onClick={() => setCompletionFilter("not_completed")}
            className={`text-right rounded-2xl border p-4 transition ${
              completionFilter === "not_completed"
                ? "border-rose-600 bg-rose-100/70 ring-2 ring-rose-600/20"
                : "border-rose-200 bg-rose-50/50 hover:bg-rose-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-900">
                غير المنجز (لم يحدثوا بعد)
              </span>
              <MaterialIcon name="pending_actions" size={22} className="text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-800 font-mono">
                {scopeStats.notCompletedEmployeesCount}
              </span>
              <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-xs font-black text-rose-900 font-mono">
                {scopeStats.totalEmployeesInScope > 0
                  ? Math.round(
                      (scopeStats.notCompletedEmployeesCount / scopeStats.totalEmployeesInScope) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
            <p className="mt-1 text-[11px] font-bold text-rose-700">
              اضغط لحصر الموظفين الذين لم يحدثوا بياناتهم
            </p>
          </button>

          <button
            type="button"
            onClick={() => setCompletionFilter("pending")}
            className={`text-right rounded-2xl border p-4 transition ${
              completionFilter === "pending"
                ? "border-amber-600 bg-amber-100/70 ring-2 ring-amber-600/20"
                : "border-amber-200 bg-amber-50/50 hover:bg-amber-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-900">
                قيد سلسلة الموافقات
              </span>
              <MaterialIcon name="hourglass_top" size={22} className="text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-800 font-mono">
              {scopeStats.pendingEmployeesCount}
            </div>
            <p className="mt-1 text-[11px] font-bold text-amber-700">
              بانتظار مراجعة واعتماد السلسلة
            </p>
          </button>
        </div>

        {/* Interactive Al-Andalus Branches Completion Strip */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <MaterialIcon name="domain" size={18} className="text-[#0070c0]" />
              <span className="text-xs font-extrabold text-[#0f3560]">
                نسب إنجاز تحديث البيانات في فروع شركة مدارس الأندلس التعليمية (اضغط على الفرع للفلترة الفورية):
              </span>
            </div>
            {branchFilter !== "all" && (
              <button
                type="button"
                onClick={() => setBranchFilter("all")}
                className="text-[11px] font-extrabold text-rose-600 hover:underline"
              >
                إلغاء فلتر الفرع وعرض جميع الفروع ({ANDALUS_BRANCHES.length})
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
            {branchBreakdown.map((b) => {
              const pct = b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0;
              const isSelected = branchFilter === b.branch;
              return (
                <button
                  key={b.branch}
                  type="button"
                  onClick={() => setBranchFilter(isSelected ? "all" : b.branch)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-right transition ${
                    isSelected
                      ? "border-[#0070c0] bg-[#0070c0] text-white shadow-xs"
                      : "border-slate-200 bg-slate-50/70 text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-[11px] font-extrabold whitespace-nowrap">
                    {b.branch.replace("مدارس الأندلس الأهلية - ", "")}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] font-bold">
                    <span className={isSelected ? "text-emerald-200" : "text-emerald-700"}>
                      منجز: {b.completed}
                    </span>
                    <span>•</span>
                    <span className={isSelected ? "text-rose-200" : "text-rose-600"}>
                      غير منجز: {b.uncompleted}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.2 font-mono font-black ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-blue-100 text-[#004e82]"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Extra Column Customizer Panel ("إضافة فيتشر أو كولم زيادة في التقرير") */}
        {showColumnBuilder && (
          <div className="rounded-2xl border-2 border-[#0070c0]/30 bg-blue-50/40 p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MaterialIcon name="add_chart" size={20} className="text-[#0070c0]" />
                <h3 className="text-xs font-black text-[#0f3560]">
                  إضافة وتخصيص أعمدة إضافية في التقرير (تظهر فوراً في الجدول وفي تصدير Excel و PDF)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowColumnBuilder(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                إغلاق ✕
              </button>
            </div>

            {/* Toggleable Column Chips */}
            <div className="flex flex-wrap gap-2">
              {extraColumns.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => toggleExtraColumn(col.id)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition ${
                    col.enabled
                      ? "border-[#0070c0] bg-[#0070c0] text-white shadow-2xs"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <MaterialIcon
                    name={col.enabled ? "check_box" : "check_box_outline_blank"}
                    size={16}
                  />
                  <span>{col.label}</span>
                </button>
              ))}
            </div>

            {/* Add New Custom Column on the fly */}
            <div className="flex flex-wrap items-end gap-2 border-t border-blue-200/60 pt-3">
              <div className="w-60">
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  اختر البيان المراد إضافته كعمود في التقرير
                </label>
                <select
                  value={newColFieldKey}
                  onChange={(e) => setNewColFieldKey(e.target.value)}
                  className={inputCls}
                >
                  {allFields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                  <option value="basic_salary">الراتب الأساسي</option>
                  <option value="hire_date">تاريخ التعيين</option>
                  <option value="contract_type">نوع العقد</option>
                </select>
              </div>
              <div className="w-60">
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  عنوان العمود في التقرير (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: الحالة الاجتماعية / المؤهل..."
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomColumn}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-[#0f3560] px-4 text-xs font-extrabold text-white hover:bg-[#1a4b84]"
              >
                <MaterialIcon name="add" size={16} />
                <span>إضافة العمود للتقرير</span>
              </button>
            </div>
          </div>
        )}

        {/* Comprehensive Filters Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MaterialIcon name="filter_alt" size={19} className="text-[#0070c0]" />
              <span className="text-xs font-black text-[#0f3560]">
                فلاتر البحث المتقدم واستخراج التقرير (الفرع • القسم • الحالة: المنجز وغير المنجز • البيان • التاريخ)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Granularity Switch */}
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setGranularity("all_employees")}
                  className={`rounded-lg px-3 py-1 text-[11px] font-extrabold transition ${
                    granularity === "all_employees"
                      ? "bg-white text-[#0f3560] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  عرض حسب الموظف والطلب
                </button>
                <button
                  type="button"
                  onClick={() => setGranularity("detailed_fields")}
                  className={`rounded-lg px-3 py-1 text-[11px] font-extrabold transition ${
                    granularity === "detailed_fields"
                      ? "bg-white text-[#0f3560] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  تفصيل كل بيان محدث بسطر مستقل
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBranchFilter("all");
                  setDepartmentFilter("all");
                  setCompletionFilter("all");
                  setFieldFilter("all");
                  setModeFilter("all");
                  setDateFrom("");
                  setDateTo("");
                  setSearchTerm("");
                }}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
              >
                <MaterialIcon name="restart_alt" size={15} />
                إعادة ضبط الفلاتر
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {/* 1. فلتر الفرع */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                1. الفرع (مدارس الأندلس)
              </label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className={inputCls}
              >
                <option value="all">جميع فروع مدارس الأندلس ({branchOptions.length})</option>
                {branchOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. فلتر القسم */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                2. القسم / المرحلة
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className={inputCls}
              >
                <option value="all">جميع الأقسام ({departmentOptions.length})</option>
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. فلتر الحالة: المنجز وغير المنجز */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                3. الحالة (المنجز وغير المنجز)
              </label>
              <select
                value={completionFilter}
                onChange={(e) => setCompletionFilter(e.target.value as any)}
                className={inputCls}
              >
                <option value="all">الكل (المنجز وغير المنجز)</option>
                <option value="completed">المنجز فقط (الذين حدثوا بياناتهم ✓)</option>
                <option value="not_completed">غير المنجز فقط (الذين لم يحدثوا ✗)</option>
                <option value="pending">قيد الموافقة والاعتماد ⏳</option>
              </select>
            </div>

            {/* 4. فلتر البيان / الحقل */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                4. البيان المحدث
              </label>
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className={inputCls}
              >
                <option value="all">جميع البيانات والحقول</option>
                {allFields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. من تاريخ */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                5. من تاريخ
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* 6. إلى تاريخ */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                6. إلى تاريخ
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* 7. بحث سريع */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                7. بحث بالاسم / الرقم / القيمة
              </label>
              <input
                type="text"
                placeholder="ابحث بالاسم، الرقم الوظيفي، القيمة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Main Report Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#0f3560]">
                نتائج التقرير المطابقة للفلاتر:
              </span>
              <span className="rounded-full bg-[#0070c0] px-2.5 py-0.5 text-xs font-black text-white font-mono">
                {filteredRows.length} سجل
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span>عدد الصفوف في الصفحة:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-extrabold text-slate-800"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>عرض الكل (500+)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right text-[11.5px]">
              <thead className="bg-[#0f3560] text-white font-extrabold">
                <tr>
                  <th className="px-3 py-3 text-center w-10">#</th>
                  <th className="px-3 py-3 text-center">الرقم الوظيفي</th>
                  <th className="px-3 py-3">اسم الموظف</th>
                  <th className="px-3 py-3">الفرع (مدارس الأندلس)</th>
                  <th className="px-3 py-3">القسم</th>
                  <th className="px-3 py-3 text-center">حالة الإنجاز</th>
                  <th className="px-3 py-3">البيان المحدث</th>
                  <th className="px-3 py-3">القيمة السابقة</th>
                  <th className="px-3 py-3">القيمة الجديدة</th>
                  <th className="px-3 py-3 text-center">تاريخ ووقت التحديث</th>
                  {activeExtraColumns.map((col) => (
                    <th key={col.id} className="px-3 py-3 bg-[#16467d]">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10 + activeExtraColumns.length}
                      className="py-14 text-center text-slate-500 font-bold"
                    >
                      لا توجد سجلات تطابق الفلاتر المحددة حالياً
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const serial = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={row.rowId}
                        className={`transition hover:bg-blue-50/40 ${
                          row.completionStatus === "not_completed"
                            ? "bg-rose-50/20"
                            : idx % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50/50"
                        }`}
                      >
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-400">
                          {serial}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-black text-[#0070c0]">
                          {row.empNo}
                        </td>
                        <td className="px-3 py-2.5 font-extrabold text-slate-900 whitespace-nowrap">
                          {row.employeeName}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">
                          {row.branch}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-600">
                          {row.department}
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold ${
                              row.completionStatus === "completed"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : row.completionStatus === "pending"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            <MaterialIcon
                              name={
                                row.completionStatus === "completed"
                                  ? "check_circle"
                                  : row.completionStatus === "pending"
                                    ? "schedule"
                                    : "cancel"
                              }
                              size={13}
                            />
                            {row.completionLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-extrabold text-[#0f3560]">
                          {row.fieldLabel}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">
                          {row.oldValue !== "—" ? (
                            <span className="line-through decoration-rose-400/70">
                              {row.oldValue}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {row.newValue !== "—" ? (
                            <span className="inline-block rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-extrabold text-emerald-800">
                              {row.newValue}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">لم يحدث بعد</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap">
                          {row.updatedDate !== "—" ? (
                            <div>
                              <div>{row.updatedDate}</div>
                              <div className="text-[10px] text-slate-400">
                                الساعة {row.updatedTime}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        {activeExtraColumns.map((col) => (
                          <td
                            key={col.id}
                            className="px-3 py-2.5 font-semibold text-slate-700"
                          >
                            {getExtraColumnValue(row, col)}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-bold text-slate-600">
                صفحة {currentPage} من {totalPages} (إجمالي السجلات: {filteredRows.length})
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-extrabold text-slate-700 disabled:opacity-40"
                >
                  السابق
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-extrabold text-slate-700 disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
