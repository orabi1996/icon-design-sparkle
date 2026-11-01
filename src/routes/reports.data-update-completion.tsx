import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
      { title: "تقرير إنجاز تحديث بيانات الموظفين | التقارير" },
      {
        name: "description",
        content:
          "تقرير إنجاز تحديث بيانات الموظفين: متابعة المنجز وغير المنجز، تفصيل القيمة السابقة والقيمة الجديدة لكل بيان في أعمدة مستقلة، مع التواريخ وتصدير Excel و PDF.",
      },
    ],
  }),
  component: DataUpdateCompletionReportPage,
});

const inputCls =
  "h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-[12px] font-bold text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-2 focus:ring-[#0070c0]/15";

export interface BreakdownFieldCol {
  fieldKey: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_BREAKDOWN_FIELDS: BreakdownFieldCol[] = [
  { fieldKey: "phone", label: "رقم الجوال", enabled: true },
  { fieldKey: "email", label: "البريد الإلكتروني", enabled: true },
  { fieldKey: "short_address", label: "العنوان الوطني", enabled: true },
  { fieldKey: "postal_code", label: "بريد السكن", enabled: true },
  { fieldKey: "building_no", label: "رقم المبنى", enabled: true },
  { fieldKey: "iqama_expiry", label: "بيانات الإقامة", enabled: true },
];

export interface ExtraReportColumn {
  id: string;
  label: string;
  fieldKey: string;
  enabled: boolean;
}

const DEFAULT_EXTRA_COLUMNS: ExtraReportColumn[] = [
  { id: "col_job_title", label: "المسمى الوظيفي", fieldKey: "job_title", enabled: false },
  { id: "col_national_id", label: "رقم الهوية / الإقامة", fieldKey: "national_id", enabled: false },
  { id: "col_nationality", label: "الجنسية", fieldKey: "nationality", enabled: false },
  { id: "col_direct_manager", label: "المدير المباشر", fieldKey: "manager_name", enabled: false },
  { id: "col_approver", label: "حالة الاعتماد / الإقرار", fieldKey: "_approver_info", enabled: true },
];

export interface DetailedEmployeeReportRow {
  rowId: string;
  empId: string;
  empNo: string;
  employeeName: string;
  branch: string;
  department: string;
  completionStatus: "completed" | "not_completed" | "pending";
  completionLabel: string;
  requestNumber: string;
  updatedDate: string;
  updatedTime: string;
  decisionDate: string;
  approverInfo: string;
  oldValuesByField: Record<string, string>;
  newValuesByField: Record<string, string>;
  changedFieldKeys: Set<string>;
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
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Sub-columns under "القيمة السابقة" and "القيمة الجديدة"
  const [breakdownFields, setBreakdownFields] =
    useState<BreakdownFieldCol[]>(DEFAULT_BREAKDOWN_FIELDS);

  // Extra general columns
  const [extraColumns, setExtraColumns] = useState<ExtraReportColumn[]>(DEFAULT_EXTRA_COLUMNS);
  const [showColumnBuilder, setShowColumnBuilder] = useState<boolean>(false);
  const [newBreakdownFieldKey, setNewBreakdownFieldKey] = useState<string>("social_status");
  const [newBreakdownLabel, setNewBreakdownLabel] = useState<string>("");

  // Pagination
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Branch & Department Options
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

  // Active sub-columns under "القيمة السابقة" and "القيمة الجديدة"
  const activeValueFields = useMemo(() => {
    if (fieldFilter !== "all") {
      const found = breakdownFields.find((b) => b.fieldKey === fieldFilter);
      if (found) return [found];
      const def = allFields.find((f) => f.key === fieldFilter);
      return [{ fieldKey: fieldFilter, label: def?.label || fieldFilter, enabled: true }];
    }
    const enabledList = breakdownFields.filter((b) => b.enabled);
    return enabledList.length > 0 ? enabledList : DEFAULT_BREAKDOWN_FIELDS.slice(0, 1);
  }, [breakdownFields, fieldFilter, allFields]);

  const activeExtraColumns = useMemo(
    () => extraColumns.filter((c) => c.enabled),
    [extraColumns],
  );

  // Build Detailed Rows per Employee (with separate old & new values per fieldKey)
  const allReportRows = useMemo<DetailedEmployeeReportRow[]>(() => {
    const rows: DetailedEmployeeReportRow[] = [];

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
        // الموظف لم يقم بتحديث بياناته بعد (غير منجز)
        const oldValuesByField: Record<string, string> = {};
        const newValuesByField: Record<string, string> = {};
        for (const bf of breakdownFields) {
          const curVal = getEmployeeFieldValue(emp, bf.fieldKey);
          oldValuesByField[bf.fieldKey] = curVal && curVal !== "غير محدد" ? curVal : "—";
          newValuesByField[bf.fieldKey] = "—";
        }

        rows.push({
          rowId: `uncompleted-${empId || empNo}`,
          empId,
          empNo,
          employeeName,
          branch,
          department,
          completionStatus: "not_completed",
          completionLabel: "غير منجز",
          requestNumber: "—",
          updatedDate: "—",
          updatedTime: "—",
          decisionDate: "—",
          approverInfo: "لم يقم بالتحديث بعد",
          oldValuesByField,
          newValuesByField,
          changedFieldKeys: new Set<string>(),
          employeeRecord: emp,
        });
      } else {
        // دمج أو عرض طلبات التحديث الخاصة بالموظف بحيث يظهر كل بيان في عموده المخصص تحت القيمة السابقة والقيمة الجديدة
        for (const req of empReqs) {
          const status: "completed" | "not_completed" | "pending" =
            req.status === "approved"
              ? "completed"
              : req.status === "pending"
                ? "pending"
                : "not_completed";

          const statusLabel =
            req.status === "approved"
              ? "منجز ✓"
              : req.status === "pending"
                ? "قيد الموافقة"
                : "غير منجز";

          const datePart = req.createdAt ? req.createdAt.slice(0, 10) : "2026-11-01";
          const timePart =
            req.createdAt && req.createdAt.includes("T")
              ? req.createdAt.slice(11, 16)
              : "09:30";
          const decisionDatePart = req.decisionAt ? req.decisionAt.slice(0, 10) : datePart;

          const approverInfo =
            req.status === "approved"
              ? req.updateMode === "direct"
                ? "تحديث مباشر بإقرار الموظف ✓"
                : `معتمد (${req.decisionBy || "سلسلة الموافقة"})`
              : req.awaitingText || "بانتظار الاعتماد";

          const oldValuesByField: Record<string, string> = {};
          const newValuesByField: Record<string, string> = {};
          const changedFieldKeys = new Set<string>();

          // نملأ القيم الافتراضية أولاً
          for (const bf of breakdownFields) {
            const curVal = getEmployeeFieldValue(emp, bf.fieldKey);
            oldValuesByField[bf.fieldKey] = curVal && curVal !== "غير محدد" ? curVal : "—";
            newValuesByField[bf.fieldKey] = "—";
          }

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

          for (const ch of changes) {
            if (!ch.fieldKey) continue;
            oldValuesByField[ch.fieldKey] = ch.oldValue || "—";
            newValuesByField[ch.fieldKey] = ch.newValue || "—";
            changedFieldKeys.add(ch.fieldKey);
          }

          rows.push({
            rowId: req.id,
            empId,
            empNo,
            employeeName,
            branch: req.branch || branch,
            department: req.department || department,
            completionStatus: status,
            completionLabel: statusLabel,
            requestNumber: req.requestNumber,
            updatedDate: datePart,
            updatedTime: timePart,
            decisionDate: decisionDatePart,
            approverInfo,
            oldValuesByField,
            newValuesByField,
            changedFieldKeys,
            employeeRecord: emp,
          });
        }
      }
    }

    return rows;
  }, [employees, requestsByEmployee, breakdownFields]);

  // Filter Rows
  const filteredRows = useMemo(() => {
    return allReportRows.filter((row) => {
      if (branchFilter !== "all" && row.branch !== branchFilter) return false;
      if (departmentFilter !== "all" && row.department !== departmentFilter) return false;

      if (completionFilter === "completed" && row.completionStatus !== "completed") return false;
      if (completionFilter === "not_completed" && row.completionStatus !== "not_completed")
        return false;
      if (completionFilter === "pending" && row.completionStatus !== "pending") return false;

      if (fieldFilter !== "all") {
        if (row.completionStatus === "not_completed") return false;
        if (!row.changedFieldKeys.has(fieldFilter)) return false;
      }

      if (dateFrom && row.updatedDate !== "—" && row.updatedDate < dateFrom) return false;
      if (dateTo && row.updatedDate !== "—" && row.updatedDate > dateTo) return false;
      if ((dateFrom || dateTo) && row.updatedDate === "—") return false;

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const oldNewText = [
          ...Object.values(row.oldValuesByField),
          ...Object.values(row.newValuesByField),
        ].join(" ");
        const hay = [
          row.empNo,
          row.employeeName,
          row.branch,
          row.department,
          row.requestNumber,
          oldNewText,
          String(row.employeeRecord["national_id"] || ""),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    allReportRows,
    branchFilter,
    departmentFilter,
    completionFilter,
    fieldFilter,
    dateFrom,
    dateTo,
    searchTerm,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    branchFilter,
    departmentFilter,
    completionFilter,
    fieldFilter,
    dateFrom,
    dateTo,
    searchTerm,
  ]);

  // KPIs Summary
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

  const getExtraColumnValue = (row: DetailedEmployeeReportRow, col: ExtraReportColumn): string => {
    if (col.fieldKey === "_approver_info") return row.approverInfo;
    const val = getEmployeeFieldValue(row.employeeRecord, col.fieldKey);
    return val || "—";
  };

  const toggleBreakdownField = (fieldKey: string) => {
    setBreakdownFields((prev) =>
      prev.map((f) => (f.fieldKey === fieldKey ? { ...f, enabled: !f.enabled } : f)),
    );
  };

  const toggleExtraColumn = (colId: string) => {
    setExtraColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, enabled: !c.enabled } : c)),
    );
  };

  const handleAddBreakdownField = () => {
    const def = allFields.find((f) => f.key === newBreakdownFieldKey);
    const label = newBreakdownLabel.trim() || def?.label || newBreakdownFieldKey;
    if (!label) return;

    setBreakdownFields((prev) => {
      if (prev.some((x) => x.fieldKey === newBreakdownFieldKey)) {
        return prev.map((x) =>
          x.fieldKey === newBreakdownFieldKey ? { ...x, label, enabled: true } : x,
        );
      }
      return [...prev, { fieldKey: newBreakdownFieldKey, label, enabled: true }];
    });
    setNewBreakdownLabel("");
    toast.success(`تمت إضافة بيان «${label}» تحت القيمة السابقة والقيمة الجديدة`);
  };

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // ─── Export to Excel (.xlsx) with 2-Row Split Headers for Old & New Values ───
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      toast.error("لا توجد بيانات مطابقة للفلاتر الحالية لتصديرها");
      return;
    }

    const fixedLeftHeaders = [
      "م",
      "الرقم الوظيفي",
      "اسم الموظف",
      "الفرع",
      "القسم",
      "حالة الإنجاز",
    ];
    const vfCount = activeValueFields.length;

    // Row 1: Group headers
    const headerRow1: string[] = [
      ...fixedLeftHeaders,
      ...activeValueFields.map((_, idx) => (idx === 0 ? "القيمة السابقة (قبل التحديث)" : "")),
      ...activeValueFields.map((_, idx) => (idx === 0 ? "القيمة الجديدة (بعد التحديث)" : "")),
      "تاريخ التحديث",
      "وقت التحديث",
      ...activeExtraColumns.map((c) => c.label),
    ];

    // Row 2: Detailed field headers under Old Value & New Value
    const headerRow2: string[] = [
      ...fixedLeftHeaders.map(() => ""),
      ...activeValueFields.map((vf) => vf.label),
      ...activeValueFields.map((vf) => vf.label),
      "",
      "",
      ...activeExtraColumns.map(() => ""),
    ];

    // Data rows
    const dataRows = filteredRows.map((r, index) => [
      index + 1,
      r.empNo,
      r.employeeName,
      r.branch,
      r.department,
      r.completionLabel,
      ...activeValueFields.map((vf) => r.oldValuesByField[vf.fieldKey] || "—"),
      ...activeValueFields.map((vf) => r.newValuesByField[vf.fieldKey] || "—"),
      r.updatedDate,
      r.updatedTime,
      ...activeExtraColumns.map((c) => getExtraColumnValue(r, c)),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...dataRows]);
    ws["!views"] = [{ rightToLeft: true }];

    // Build Excel cell merges so Row 1 groups "القيمة السابقة" and "القيمة الجديدة" cleanly
    const merges: XLSX.Range[] = [];
    // Vertical merges for left fixed columns
    for (let c = 0; c < fixedLeftHeaders.length; c++) {
      merges.push({ s: { r: 0, c }, e: { r: 1, c } });
    }
    // Horizontal merge for "القيمة السابقة"
    const oldStartCol = fixedLeftHeaders.length;
    if (vfCount > 1) {
      merges.push({
        s: { r: 0, c: oldStartCol },
        e: { r: 0, c: oldStartCol + vfCount - 1 },
      });
    }
    // Horizontal merge for "القيمة الجديدة"
    const newStartCol = oldStartCol + vfCount;
    if (vfCount > 1) {
      merges.push({
        s: { r: 0, c: newStartCol },
        e: { r: 0, c: newStartCol + vfCount - 1 },
      });
    }
    // Vertical merges for right columns (Date, Time, Extra columns)
    const rightStartCol = newStartCol + vfCount;
    const totalCols = headerRow1.length;
    for (let c = rightStartCol; c < totalCols; c++) {
      merges.push({ s: { r: 0, c }, e: { r: 1, c } });
    }
    ws["!merges"] = merges;

    ws["!cols"] = headerRow1.map((_, idx) => ({
      wch: idx === 2 || idx === 3 ? 28 : 16,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير إنجاز تحديث البيانات");
    XLSX.writeFile(
      wb,
      `تقرير_إنجاز_تحديث_بيانات_الموظفين_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    toast.success(`تم تصدير ${filteredRows.length} سجل إلى ملف Excel بنجاح`);
  };

  // ─── Export to Official RTL PDF with 2-Row Split Headers ───
  const handleExportPDF = () => {
    if (filteredRows.length === 0) {
      toast.error("لا توجد بيانات مطابقة للفلاتر الحالية لتصديرها إلى PDF");
      return;
    }

    const printWin = window.open("", "_blank", "width=1360,height=900");
    if (!printWin) {
      window.print();
      return;
    }

    const oldSubHeadersHtml = activeValueFields
      .map((vf) => `<th class="sub-th-old">${vf.label}</th>`)
      .join("");
    const newSubHeadersHtml = activeValueFields
      .map((vf) => `<th class="sub-th-new">${vf.label}</th>`)
      .join("");
    const extraHeadersHtml = activeExtraColumns
      .map((c) => `<th rowspan="2">${c.label}</th>`)
      .join("");

    const rowsHtml = filteredRows
      .map((r, idx) => {
        const statusBadgeStyle =
          r.completionStatus === "completed"
            ? "background:#dcfce7;color:#166534;border:1px solid #86efac;"
            : r.completionStatus === "pending"
              ? "background:#fef3c7;color:#92400e;border:1px solid #fcd34d;"
              : "background:#ffe4e6;color:#9f1239;border:1px solid #fda4af;";

        const oldCellsHtml = activeValueFields
          .map((vf) => {
            const val = r.oldValuesByField[vf.fieldKey] || "—";
            return `<td class="cell-old">${val}</td>`;
          })
          .join("");

        const newCellsHtml = activeValueFields
          .map((vf) => {
            const val = r.newValuesByField[vf.fieldKey] || "—";
            const isChanged = r.changedFieldKeys.has(vf.fieldKey) && val !== "—";
            return `<td class="${isChanged ? "cell-new-active" : "cell-new-empty"}">${val}</td>`;
          })
          .join("");

        const extraCellsHtml = activeExtraColumns
          .map((c) => `<td>${getExtraColumnValue(r, c)}</td>`)
          .join("");

        return `
          <tr>
            <td style="text-align:center;font-weight:700;">${idx + 1}</td>
            <td style="text-align:center;font-family:monospace;font-weight:700;color:#004e82;">${r.empNo}</td>
            <td style="font-weight:700;white-space:nowrap;">${r.employeeName}</td>
            <td>${r.branch}</td>
            <td>${r.department}</td>
            <td style="text-align:center;">
              <span style="display:inline-block;padding:2px 7px;border-radius:999px;font-size:9.5px;font-weight:800;white-space:nowrap;${statusBadgeStyle}">
                ${r.completionLabel}
              </span>
            </td>
            ${oldCellsHtml}
            ${newCellsHtml}
            <td style="text-align:center;font-family:monospace;white-space:nowrap;">${r.updatedDate}${r.updatedTime !== "—" ? `<br/><span style="font-size:8.5px;color:#64748b;">${r.updatedTime}</span>` : ""}</td>
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
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 10px;
      background: #ffffff;
      color: #0f172a;
      direction: rtl;
      font-size: 10px;
    }
    .report-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #0f3560;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .company-box h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 800;
      color: #0f3560;
    }
    .company-box p {
      margin: 2px 0 0;
      font-size: 10.5px;
      color: #475569;
      font-weight: 600;
    }
    .title-box {
      text-align: center;
    }
    .title-box h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      color: #0070c0;
    }
    .title-box span {
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
    }
    .meta-box {
      text-align: left;
      font-size: 10px;
      color: #334155;
      font-weight: 700;
    }
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px 10px;
      background: #f8fafc;
    }
    .kpi-card .label {
      font-size: 9.5px;
      color: #475569;
      font-weight: 700;
    }
    .kpi-card .val {
      font-size: 14px;
      font-weight: 800;
      color: #0f3560;
      margin-top: 2px;
    }
    .filters-bar {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 10px;
      margin-bottom: 8px;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    th {
      background: #0f3560 !important;
      color: #ffffff !important;
      padding: 5px 5px;
      border: 1px solid #cbd5e1;
      text-align: center;
      font-weight: 800;
    }
    th.group-old {
      background: #334155 !important;
      color: #f8fafc !important;
    }
    th.group-new {
      background: #047857 !important;
      color: #ffffff !important;
    }
    th.sub-th-old {
      background: #475569 !important;
      color: #ffffff !important;
      font-size: 8.5px;
    }
    th.sub-th-new {
      background: #059669 !important;
      color: #ffffff !important;
      font-size: 8.5px;
    }
    td {
      padding: 4px 5px;
      border: 1px solid #cbd5e1;
      vertical-align: middle;
    }
    td.cell-old {
      background: #f8fafc;
      color: #475569;
      text-align: center;
      font-family: monospace;
    }
    td.cell-new-active {
      background: #ecfdf5 !important;
      color: #065f46;
      font-weight: 800;
      text-align: center;
      font-family: monospace;
    }
    td.cell-new-empty {
      color: #94a3b8;
      text-align: center;
    }
    .footer-sign {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      font-weight: 700;
      color: #334155;
      border-top: 1px dashed #94a3b8;
      padding-top: 8px;
    }
    .no-print-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f3560;
      color: #fff;
      padding: 8px 14px;
      border-radius: 8px;
      margin-bottom: 10px;
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
    <span>معاينة التقرير الرسمي الجاهز للتصدير بصيغة PDF (${filteredRows.length} سجل)</span>
    <div style="display:flex;gap:8px;">
      <button onclick="window.print()">حفظ كملف PDF / طباعة الآن</button>
      <button onclick="window.close()" style="background:#64748b;">إغلاق</button>
    </div>
  </div>

  <div class="report-header">
    <div class="company-box">
      <h1>شركة مدارس الأندلس التعليمية</h1>
      <p>الإدارة العامة للموارد البشرية وشؤون الموظفين</p>
    </div>
    <div class="title-box">
      <h2>تقرير إنجاز تحديث بيانات الموظفين</h2>
      <span>بيان تفصيلي بالقيم السابقة والقيم الجديدة لكل بيان على حدة والتواريخ</span>
    </div>
    <div class="meta-box">
      <div>تاريخ التقرير: ${new Date().toISOString().slice(0, 10)}</div>
      <div>عدد السجلات: ${filteredRows.length} سجل</div>
    </div>
  </div>

  <div class="kpi-strip">
    <div class="kpi-card">
      <div class="label">إجمالي الموظفين</div>
      <div class="val">${scopeStats.totalEmployeesInScope} موظف</div>
    </div>
    <div class="kpi-card">
      <div class="label">إجمالي التحديثات التي تمت</div>
      <div class="val" style="color:#047857;">${scopeStats.totalCompletedUpdates} طلب (${scopeStats.totalFieldChangesCount} بيان)</div>
    </div>
    <div class="kpi-card">
      <div class="label">المنجز (حدثوا بياناتهم)</div>
      <div class="val" style="color:#047857;">${scopeStats.completedEmployeesCount} موظف (${scopeStats.completionRate}%)</div>
    </div>
    <div class="kpi-card">
      <div class="label">غير المنجز (لم يحدثوا بعد)</div>
      <div class="val" style="color:#be123c;">${scopeStats.notCompletedEmployeesCount} موظف</div>
    </div>
    <div class="kpi-card">
      <div class="label">قيد المراجعة والاعتماد</div>
      <div class="val" style="color:#b45309;">${scopeStats.pendingEmployeesCount} طلب</div>
    </div>
  </div>

  <div class="filters-bar">
    <span>الفرع: ${branchFilter === "all" ? "جميع الفروع" : branchFilter}</span>
    <span>القسم: ${departmentFilter === "all" ? "جميع الأقسام" : departmentFilter}</span>
    <span>الحالة: ${
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
        <th rowspan="2" style="width:28px;">م</th>
        <th rowspan="2" style="width:55px;">الرقم الوظيفي</th>
        <th rowspan="2">اسم الموظف</th>
        <th rowspan="2">الفرع</th>
        <th rowspan="2">القسم</th>
        <th rowspan="2" style="width:65px;">حالة الإنجاز</th>
        <th colspan="${activeValueFields.length}" class="group-old">القيمة السابقة (قبل التحديث)</th>
        <th colspan="${activeValueFields.length}" class="group-new">القيمة الجديدة (بعد التحديث)</th>
        <th rowspan="2" style="width:70px;">تاريخ التحديث</th>
        ${extraHeadersHtml}
      </tr>
      <tr>
        ${oldSubHeadersHtml}
        ${newSubHeadersHtml}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer-sign">
    <div>إعداد: قسم عمليات الموارد البشرية</div>
    <div>مراجعة: إدارة شؤون الموظفين</div>
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
        {/* Top Standalone Report Header (No links to setup/regulations) */}
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
                  شركة مدارس الأندلس التعليمية ({employees.length} موظف)
                </span>
              </div>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                عرض تفصيلي لإجمالي التحديثات، المنجز وغير المنجز، مع تفصيل القيمة السابقة والقيمة الجديدة لكل بيان في أعمدة مستقلة بالتواريخ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowColumnBuilder((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition cursor-pointer ${
                showColumnBuilder
                  ? "border-[#0070c0] bg-[#0070c0] text-white"
                  : "border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100"
              }`}
            >
              <MaterialIcon name="view_column" size={17} />
              <span>تخصيص وإضافة أعمدة التقرير</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-emerald-700 cursor-pointer"
            >
              <MaterialIcon name="table_view" size={17} />
              <span>تصدير Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-rose-700 cursor-pointer"
            >
              <MaterialIcon name="picture_as_pdf" size={17} />
              <span>تصدير PDF</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => setCompletionFilter("all")}
            className={`text-right rounded-2xl border p-4 transition cursor-pointer ${
              completionFilter === "all"
                ? "border-[#0070c0] bg-blue-50/70 ring-2 ring-[#0070c0]/20"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-600">
                إجمالي الموظفين المشمولين
              </span>
              <MaterialIcon name="groups" size={22} className="text-[#0070c0]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#0f3560] font-mono">
              {scopeStats.totalEmployeesInScope}
            </div>
            <p className="mt-1 text-[11px] font-bold text-slate-500">
              اضغط لعرض الكل (المنجز وغير المنجز)
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
            className={`text-right rounded-2xl border p-4 transition cursor-pointer ${
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
            className={`text-right rounded-2xl border p-4 transition cursor-pointer ${
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
            className={`text-right rounded-2xl border p-4 transition cursor-pointer ${
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

        {/* Column Customizer Panel */}
        {showColumnBuilder && (
          <div className="rounded-2xl border-2 border-[#0070c0]/30 bg-blue-50/40 p-4 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MaterialIcon name="view_column" size={20} className="text-[#0070c0]" />
                <h3 className="text-xs font-black text-[#0f3560]">
                  تخصيص الحقول المتفصلة تحت (القيمة السابقة / القيمة الجديدة) والأعمدة الإضافية (تظهر في الجدول وفي Excel و PDF)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowColumnBuilder(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>

            {/* 1. Breakdown fields under Old Value & New Value */}
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold text-slate-700">
                أولاً: البيانات المتفصلة في الصف الثاني تحت «القيمة السابقة» و«القيمة الجديدة»:
              </div>
              <div className="flex flex-wrap gap-2">
                {breakdownFields.map((bf) => (
                  <button
                    key={bf.fieldKey}
                    type="button"
                    onClick={() => toggleBreakdownField(bf.fieldKey)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                      bf.enabled
                        ? "border-emerald-700 bg-emerald-700 text-white shadow-2xs"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <MaterialIcon
                      name={bf.enabled ? "check_box" : "check_box_outline_blank"}
                      size={16}
                    />
                    <span>{bf.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. General Extra Columns */}
            <div className="space-y-2 border-t border-blue-200/60 pt-3">
              <div className="text-[11px] font-extrabold text-slate-700">
                ثانياً: أعمدة عامة إضافية في التقرير:
              </div>
              <div className="flex flex-wrap gap-2">
                {extraColumns.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => toggleExtraColumn(col.id)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition cursor-pointer ${
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
            </div>

            {/* 3. Add any other field into Old/New Value Breakdown */}
            <div className="flex flex-wrap items-end gap-2 border-t border-blue-200/60 pt-3">
              <div className="w-60">
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  إضافة بيان آخر تحت القيمة السابقة والجديدة
                </label>
                <select
                  value={newBreakdownFieldKey}
                  onChange={(e) => setNewBreakdownFieldKey(e.target.value)}
                  className={inputCls}
                >
                  {allFields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-60">
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                  اسم العمود الفرعي (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: الحالة الاجتماعية / المؤهل..."
                  value={newBreakdownLabel}
                  onChange={(e) => setNewBreakdownLabel(e.target.value)}
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                onClick={handleAddBreakdownField}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-[#0f3560] px-4 text-xs font-extrabold text-white hover:bg-[#1a4b84] cursor-pointer"
              >
                <MaterialIcon name="add" size={16} />
                <span>إضافة للجدول</span>
              </button>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MaterialIcon name="filter_alt" size={19} className="text-[#0070c0]" />
              <span className="text-xs font-black text-[#0f3560]">
                فلاتر التقرير (الفرع • القسم • الحالة: المنجز وغير المنجز • البيان • التاريخ)
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setBranchFilter("all");
                setDepartmentFilter("all");
                setCompletionFilter("all");
                setFieldFilter("all");
                setDateFrom("");
                setDateTo("");
                setSearchTerm("");
              }}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <MaterialIcon name="restart_alt" size={15} />
              إعادة ضبط الفلاتر
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {/* 1. فلتر الفرع */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                1. الفرع
              </label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className={inputCls}
              >
                <option value="all">جميع الفروع ({branchOptions.length})</option>
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
                2. القسم
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
                <option value="completed">المنجز فقط (حدثوا بياناتهم ✓)</option>
                <option value="not_completed">غير المنجز فقط (لم يحدثوا ✗)</option>
                <option value="pending">قيد الموافقة والاعتماد ⏳</option>
              </select>
            </div>

            {/* 4. فلتر البيان المحدث */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                4. البيان المحدث
              </label>
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className={inputCls}
              >
                <option value="all">جميع البيانات المتفصلة ({activeValueFields.length})</option>
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

        {/* Main Report Table with 2-Row Header under Old Value & New Value */}
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
                <option value={500}>عرض الكل (500)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right text-[11px]">
              <thead>
                {/* ─── ROW 1: Main Headers + Grouped "القيمة السابقة" & "القيمة الجديدة" ─── */}
                <tr className="bg-[#0f3560] text-white font-extrabold">
                  <th rowSpan={2} className="border border-slate-600/60 px-2.5 py-2.5 text-center w-9">
                    #
                  </th>
                  <th rowSpan={2} className="border border-slate-600/60 px-2.5 py-2.5 text-center">
                    الرقم الوظيفي
                  </th>
                  <th rowSpan={2} className="border border-slate-600/60 px-3 py-2.5">
                    اسم الموظف
                  </th>
                  <th rowSpan={2} className="border border-slate-600/60 px-3 py-2.5">
                    الفرع
                  </th>
                  <th rowSpan={2} className="border border-slate-600/60 px-2.5 py-2.5">
                    القسم
                  </th>
                  <th rowSpan={2} className="border border-slate-600/60 px-2.5 py-2.5 text-center">
                    حالة الإنجاز
                  </th>

                  {/* القيمة السابقة وتحتها صف ثانٍ متفصل لكل بيان */}
                  <th
                    colSpan={activeValueFields.length}
                    className="border-2 border-slate-400 bg-slate-700 px-3 py-2 text-center text-xs font-black text-amber-200"
                  >
                    القيمة السابقة (قبل التحديث)
                  </th>

                  {/* القيمة الجديدة وتحتها صف ثانٍ متفصل لكل بيان */}
                  <th
                    colSpan={activeValueFields.length}
                    className="border-2 border-emerald-400 bg-emerald-800 px-3 py-2 text-center text-xs font-black text-white"
                  >
                    القيمة الجديدة (بعد التحديث)
                  </th>

                  <th rowSpan={2} className="border border-slate-600/60 px-2.5 py-2.5 text-center">
                    تاريخ ووقت التحديث
                  </th>

                  {activeExtraColumns.map((col) => (
                    <th
                      key={col.id}
                      rowSpan={2}
                      className="border border-slate-600/60 bg-[#16467d] px-2.5 py-2.5 text-center"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>

                {/* ─── ROW 2: Sub-Row Splitting Each Field into its Own Column ─── */}
                <tr className="text-white font-extrabold text-[10.5px]">
                  {activeValueFields.map((vf) => (
                    <th
                      key={`old-head-${vf.fieldKey}`}
                      className="border border-slate-500 bg-slate-600 px-2.5 py-2 text-center whitespace-nowrap"
                    >
                      {vf.label}
                    </th>
                  ))}
                  {activeValueFields.map((vf) => (
                    <th
                      key={`new-head-${vf.fieldKey}`}
                      className="border border-emerald-600 bg-emerald-700 px-2.5 py-2 text-center whitespace-nowrap"
                    >
                      {vf.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7 + activeValueFields.length * 2 + activeExtraColumns.length}
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
                              : "bg-slate-50/40"
                        }`}
                      >
                        <td className="border border-slate-200 px-2 py-2 text-center font-mono font-bold text-slate-400">
                          {serial}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 text-center font-mono font-black text-[#0070c0]">
                          {row.empNo}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 font-extrabold text-slate-900 whitespace-nowrap">
                          {row.employeeName}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-semibold text-slate-800">
                          {row.branch}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 font-semibold text-slate-600 whitespace-nowrap">
                          {row.department}
                        </td>
                        <td className="border border-slate-200 px-2.5 py-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                              row.completionStatus === "completed"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : row.completionStatus === "pending"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {row.completionLabel}
                          </span>
                        </td>

                        {/* خلايا القيمة السابقة المتفصلة (كل بيان في مربع مستقل لوحده) */}
                        {activeValueFields.map((vf) => {
                          const oldVal = row.oldValuesByField[vf.fieldKey] || "—";
                          return (
                            <td
                              key={`old-cell-${row.rowId}-${vf.fieldKey}`}
                              className="border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-center font-mono text-[11px] font-semibold text-slate-600 whitespace-nowrap"
                            >
                              {oldVal}
                            </td>
                          );
                        })}

                        {/* خلايا القيمة الجديدة المتفصلة (كل بيان في مربع مستقل لوحده) */}
                        {activeValueFields.map((vf) => {
                          const newVal = row.newValuesByField[vf.fieldKey] || "—";
                          const isUpdated =
                            row.changedFieldKeys.has(vf.fieldKey) && newVal !== "—";
                          return (
                            <td
                              key={`new-cell-${row.rowId}-${vf.fieldKey}`}
                              className={`border border-slate-200 px-2.5 py-2 text-center font-mono text-[11px] whitespace-nowrap ${
                                isUpdated
                                  ? "bg-emerald-50/90 font-black text-emerald-800"
                                  : "text-slate-400"
                              }`}
                            >
                              {newVal}
                            </td>
                          );
                        })}

                        <td className="border border-slate-200 px-2.5 py-2 text-center font-mono text-[10.5px] font-bold text-slate-700 whitespace-nowrap">
                          {row.updatedDate !== "—" ? (
                            <div>
                              <div>{row.updatedDate}</div>
                              <div className="text-[9.5px] text-slate-400">
                                {row.updatedTime}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {activeExtraColumns.map((col) => (
                          <td
                            key={`extra-cell-${row.rowId}-${col.id}`}
                            className="border border-slate-200 px-2.5 py-2 text-center font-semibold text-slate-700 whitespace-nowrap"
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
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-extrabold text-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  السابق
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-extrabold text-slate-700 disabled:opacity-40 cursor-pointer"
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
