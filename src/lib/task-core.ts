import type { Row } from "./hr-db";

export interface TaskStatus {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  color: string;
  sort_order: number;
  is_system?: boolean;
}

export interface TaskPriority {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export interface TaskCategory {
  id: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
}

export interface SubtaskItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskComment {
  id: string;
  author: string;
  text: string;
  created_at: string;
}

export const DEFAULT_TASK_STATUSES: TaskStatus[] = [
  {
    id: "status-pending",
    code: "pending",
    name_ar: "قيد الانتظار",
    name_en: "Pending",
    color: "#3b82f6",
    sort_order: 1,
    is_system: true,
  },
  {
    id: "status-in-progress",
    code: "in_progress",
    name_ar: "جاري التنفيذ",
    name_en: "In Progress",
    color: "#f59e0b",
    sort_order: 2,
    is_system: true,
  },
  {
    id: "status-under-review",
    code: "under_review",
    name_ar: "قيد المراجعة",
    name_en: "Under Review",
    color: "#8b5cf6",
    sort_order: 3,
    is_system: true,
  },
  {
    id: "status-finished",
    code: "finished",
    name_ar: "تم الإنجاز",
    name_en: "Completed",
    color: "#10b981",
    sort_order: 4,
    is_system: true,
  },
  {
    id: "status-postponed",
    code: "postponed",
    name_ar: "تم التأجيل",
    name_en: "Postponed",
    color: "#ec4899",
    sort_order: 5,
    is_system: true,
  },
  {
    id: "status-closed",
    code: "closed",
    name_ar: "مغلقة",
    name_en: "Closed",
    color: "#64748b",
    sort_order: 6,
    is_system: true,
  },
  {
    id: "status-cancelled",
    code: "cancelled",
    name_ar: "ملغاة",
    name_en: "Cancelled",
    color: "#ef4444",
    sort_order: 7,
    is_system: true,
  },
];

export const DEFAULT_TASK_PRIORITIES: TaskPriority[] = [
  {
    id: "pri-urgent",
    code: "urgent",
    name_ar: "عاجل جداً",
    name_en: "Urgent",
    color: "#ef4444",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "pri-high",
    code: "high",
    name_ar: "مرتفع",
    name_en: "High",
    color: "#f97316",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "pri-medium",
    code: "medium",
    name_ar: "متوسط",
    name_en: "Medium",
    color: "#3b82f6",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "pri-low",
    code: "low",
    name_ar: "منخفض",
    name_en: "Low",
    color: "#6b7280",
    sort_order: 4,
    is_active: true,
  },
];

export const DEFAULT_TASK_CATEGORIES: TaskCategory[] = [
  {
    id: "cat-admin",
    name_ar: "مهام إدارية عامة",
    name_en: "General Administrative",
    is_active: true,
  },
  {
    id: "cat-hr",
    name_ar: "مهام الموارد البشرية",
    name_en: "Human Resources",
    is_active: true,
  },
  {
    id: "cat-it",
    name_ar: "مهام تقنية وتطوير",
    name_en: "IT & Development",
    is_active: true,
  },
  {
    id: "cat-finance",
    name_ar: "مهام مالية ومحاسبية",
    name_en: "Finance & Accounting",
    is_active: true,
  },
  {
    id: "cat-operations",
    name_ar: "مهام تشغيلية وميدانية",
    name_en: "Operations & Fieldwork",
    is_active: true,
  },
  {
    id: "cat-compliance",
    name_ar: "مهام الجودة والامتثال",
    name_en: "Quality & Compliance",
    is_active: true,
  },
];

/** Generate next human-readable task number, e.g. TSK-00101 */
export function generateNextTaskNumber(existingTasks: Row[]): string {
  let maxSeq = 100;
  for (const t of existingTasks) {
    const raw = String(t["task_number"] ?? "");
    const match = raw.match(/\d+/);
    if (match) {
      const num = Number.parseInt(match[0], 10);
      if (!Number.isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  const nextNum = maxSeq + 1;
  return `TSK-${String(nextNum).padStart(5, "0")}`;
}

/** Calculate duration in days between two dates */
export function calculateDurationDays(
  startDate?: string | null,
  endDate?: string | null,
): number {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
}

/** Check if a task is overdue */
export function isTaskOverdue(task: Row): boolean {
  const statusCode = String(task["status_code"] ?? "");
  if (["finished", "closed", "cancelled"].includes(statusCode)) {
    return false;
  }
  const endDate = task["end_date"];
  if (!endDate) return false;
  const end = new Date(String(endDate));
  if (Number.isNaN(end.getTime())) return false;
  // End of the day comparison
  end.setHours(23, 59, 59, 999);
  return new Date().getTime() > end.getTime();
}

/** Export tasks to real XLSX file */
export async function exportTasksToExcel(
  tasks: Row[],
  statuses: TaskStatus[] = DEFAULT_TASK_STATUSES,
  priorities: TaskPriority[] = DEFAULT_TASK_PRIORITIES,
  filename = "قائمة_المهام.xlsx",
): Promise<void> {
  const XLSX = await import("xlsx");

  const statusMap = new Map(statuses.map((s) => [s.code, s.name_ar]));
  const priorityMap = new Map(priorities.map((p) => [p.id, p.name_ar]));

  const rows = tasks.map((t, idx) => {
    const code = String(t["status_code"] ?? "pending");
    const statusName = statusMap.get(code) || code;
    const priId = String(t["priority_id"] ?? "");
    const priName = String(t["priority_name"] ?? priorityMap.get(priId) ?? "—");
    const overdue = isTaskOverdue(t) ? "متأخرة" : "في الموعد";

    return {
      "م": idx + 1,
      "رقم المهمة": String(t["task_number"] ?? `TSK-${idx + 1}`),
      "عنوان المهمة": String(t["title"] ?? "—"),
      "التصنيف": String(t["category_name"] ?? "—"),
      "الأولوية": priName,
      "الحالة": statusName,
      "نسبة الإنجاز": `${Number(t["progress"] ?? 0)}%`,
      "المستلم": String(t["assignee_name"] ?? "—"),
      "الرقم الوظيفي للمستلم": String(t["assignee_emp_no"] ?? "—"),
      "الفرع": String(t["branch"] ?? "—"),
      "القسم": String(t["department"] ?? "—"),
      "تاريخ البداية": String(t["start_date"] ?? "—"),
      "تاريخ النهاية": String(t["end_date"] ?? "—"),
      "المدة (أيام)": Number(t["duration_days"] ?? 0) || "—",
      "حالة الالتزام بالوقت": overdue,
      "الوصف": String(t["description"] ?? ""),
      "ملاحظات": String(t["notes"] ?? ""),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "المهام");
  XLSX.writeFile(workbook, filename);
}

/** Print tasks formatted HTML report */
export function printTasksReport(
  tasks: Row[],
  statuses: TaskStatus[] = DEFAULT_TASK_STATUSES,
  title = "تقرير إدارة المهام",
): void {
  const statusMap = new Map(statuses.map((s) => [s.code, s.name_ar]));
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const now = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tableRowsHtml = tasks
    .map((t, idx) => {
      const code = String(t["status_code"] ?? "pending");
      const statusName = statusMap.get(code) || code;
      const overdue = isTaskOverdue(t);
      const overdueBadge = overdue
        ? '<span style="color:#dc2626;font-weight:bold;">متأخرة</span>'
        : '<span style="color:#16a34a;">في الموعد</span>';

      return `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="font-weight:bold;color:#1e40af;">${String(t["task_number"] ?? "—")}</td>
        <td style="font-weight:600;">${String(t["title"] ?? "—")}</td>
        <td>${String(t["category_name"] ?? "—")}</td>
        <td>${String(t["priority_name"] ?? "—")}</td>
        <td>${statusName}</td>
        <td style="text-align:center;">${Number(t["progress"] ?? 0)}%</td>
        <td>${String(t["assignee_name"] ?? "—")}</td>
        <td>${String(t["branch"] ?? "—")} / ${String(t["department"] ?? "—")}</td>
        <td>${String(t["start_date"] ?? "—")}</td>
        <td>${String(t["end_date"] ?? "—")}</td>
        <td style="text-align:center;">${overdueBadge}</td>
      </tr>
    `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
        h1 { margin: 0; font-size: 20px; color: #0f172a; }
        .meta { font-size: 12px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
        th { background: #f1f5f9; padding: 8px 6px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; }
        td { padding: 6px; border: 1px solid #cbd5e1; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .summary { display: flex; gap: 15px; margin-bottom: 15px; font-size: 12px; }
        .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 14px; border-radius: 8px; }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${title}</h1>
          <div class="meta">تاريخ الاستخراج: ${now} — إجمالي المهام: ${tasks.length}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>م</th>
            <th>رقم المهمة</th>
            <th>عنوان المهمة</th>
            <th>التصنيف</th>
            <th>الأولوية</th>
            <th>الحالة</th>
            <th>الإنجاز</th>
            <th>المستلم</th>
            <th>الفرع / القسم</th>
            <th>البداية</th>
            <th>النهاية</th>
            <th>الالتزام</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml || '<tr><td colspan="12" style="text-align:center;padding:20px;">لا توجد مهام</td></tr>'}
        </tbody>
      </table>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/** Print official Job Order / Task Assignment Sheet for a single task */
export function printTaskJobOrder(
  task: Row,
  statuses: TaskStatus[] = DEFAULT_TASK_STATUSES,
  priorities: TaskPriority[] = DEFAULT_TASK_PRIORITIES,
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const statusMap = new Map(statuses.map((s) => [s.code, s.name_ar]));
  const priorityMap = new Map(priorities.map((p) => [p.id, p.name_ar]));

  const statusCode = String(task["status_code"] ?? "pending");
  const statusName = statusMap.get(statusCode) || statusCode;
  const priId = String(task["priority_id"] ?? "");
  const priName = String(task["priority_name"] ?? priorityMap.get(priId) ?? "متوسط");

  let checklist: SubtaskItem[] = [];
  if (Array.isArray(task["checklist"])) {
    checklist = task["checklist"] as SubtaskItem[];
  } else if (typeof task["checklist"] === "string" && task["checklist"].startsWith("[")) {
    try {
      checklist = JSON.parse(task["checklist"]);
    } catch {}
  }

  const checklistHtml = checklist.length
    ? checklist
        .map(
          (c, idx) => `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;">
          <input type="checkbox" ${c.done ? "checked" : ""} disabled style="width:16px;height:16px;" />
          <span style="${c.done ? "text-decoration:line-through;color:#94a3b8;" : "color:#0f172a;"}">${idx + 1}. ${c.text}</span>
        </div>`,
        )
        .join("")
    : "<div style='color:#94a3b8;font-style:italic;'>لا توجد بنود فرعية مسجلة</div>";

  const todayStr = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>أمر تكليف بمهمة - ${String(task["task_number"] || "")}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: #fff; line-height: 1.6; }
        .order-box { max-width: 800px; margin: 0 auto; border: 2px solid #cbd5e1; padding: 25px; border-radius: 12px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
        .logo-title h1 { margin: 0; font-size: 20px; color: #0f172a; }
        .logo-title p { margin: 4px 0 0; font-size: 12px; color: #64748b; font-weight: bold; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
        .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 13px; }
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; }
        .info-card strong { color: #475569; font-size: 11px; display: block; margin-bottom: 2px; }
        .section-title { font-size: 14px; font-weight: bold; color: #0369a1; margin: 18px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .description-box { background: #fafafa; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; font-size: 13px; min-height: 50px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 2px dashed #cbd5e1; }
        .sign-block { text-align: center; width: 40%; font-size: 13px; font-weight: bold; }
        .sign-line { margin-top: 45px; border-bottom: 1px solid #94a3b8; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="order-box">
        <div class="header">
          <div class="logo-title">
            <h1>أمر تكليف بمهمة عمل رسمية</h1>
            <p>إدارة الموارد البشرية والعمليات</p>
          </div>
          <div style="text-align:left;">
            <span class="badge">رقم المهمة: ${String(task["task_number"] || "—")}</span>
            <div style="font-size:11px;color:#64748b;margin-top:5px;">تاريخ الإصدار: ${todayStr}</div>
          </div>
        </div>

        <div class="grid-info">
          <div class="info-card">
            <strong>الموظف المكلف بالاستلام:</strong>
            ${String(task["assignee_name"] || "غير محدد")} ${task["assignee_emp_no"] ? `(#${task["assignee_emp_no"]})` : ""}
          </div>
          <div class="info-card">
            <strong>الفرع / القسم:</strong>
            ${String(task["branch"] || "—")} / ${String(task["department"] || "—")}
          </div>
          <div class="info-card">
            <strong>عنوان المهمة:</strong>
            ${String(task["title"] || "—")}
          </div>
          <div class="info-card">
            <strong>التصنيف والأولوية:</strong>
            ${String(task["category_name"] || "—")} — ${priName}
          </div>
          <div class="info-card">
            <strong>تاريخ البداية المقرر:</strong>
            ${String(task["start_date"] || "—")}
          </div>
          <div class="info-card">
            <strong>تاريخ التسليم النهائي:</strong>
            ${String(task["end_date"] || "—")} (${Number(task["duration_days"] || 0)} يوم عمل)
          </div>
        </div>

        <div class="section-title">تفاصيل ومتطلبات المهمة</div>
        <div class="description-box">
          ${String(task["description"] || "لا توجد تفاصيل إضافية مسجلة.")}
        </div>

        ${
          checklist.length
            ? `
          <div class="section-title">قائمة بنود ومراحل التنفيذ</div>
          <div style="background:#fff;border:1px solid #e2e8f0;padding:10px 14px;border-radius:8px;">
            ${checklistHtml}
          </div>`
            : ""
        }

        ${
          task["notes"]
            ? `
          <div class="section-title">توجيهات وملاحظات المشرف</div>
          <div class="description-box">${String(task["notes"])}</div>`
            : ""
        }

        <div class="signatures">
          <div class="sign-block">
            اعتماد منشئ المهمة / المشرف
            <div class="sign-line"></div>
            التوقيع: ............................
          </div>
          <div class="sign-block">
            إقرار استلام الموظف المكلف
            <div class="sign-line"></div>
            التوقيع: ............................
          </div>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
