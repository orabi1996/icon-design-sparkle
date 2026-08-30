import * as XLSX from "xlsx";

export type StaffBulkTemplateKey =
  "facility" | "salaries" | "documents" | "entitlement" | "deduction" | "bank";

type TemplateDefinition = {
  filename: string;
  mimeType: string;
  bookType: "biff8" | "xlsx";
  headers: string[];
};

export const STAFF_BULK_TEMPLATES: Record<StaffBulkTemplateKey, TemplateDefinition> = {
  facility: {
    filename: "تحديث بيانات المنشأة.xls",
    mimeType: "application/vnd.ms-excel",
    bookType: "biff8",
    headers: ["IdNumber", "workNumber"],
  },
  salaries: {
    filename: "تحديث بيانات رواتب الموظفين.xls",
    mimeType: "application/vnd.ms-excel",
    bookType: "biff8",
    headers: [
      "الرقم_الوظيفى",
      "رقم_الهوية",
      "اسم_الموظف",
      "الحالة",
      "الراتب_الاساسى",
      "رقم_مكتب_العمل",
    ],
  },
  documents: {
    filename: "تحديث مستندات الموظفين.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    bookType: "xlsx",
    headers: ["اسم_الموظف", "رقم_الهوية", "رقم_المستند", "التاريخ_الحالى", "التاريخ_التجديد"],
  },
  entitlement: {
    filename: "اضافة استحقاق.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    bookType: "xlsx",
    headers: ["EmpFileNum", "Vlaue"],
  },
  deduction: {
    filename: "اضافة استقطاع.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    bookType: "xlsx",
    headers: ["EmpFileNum", "Vlaue", "Notes"],
  },
  bank: {
    filename: "إضافة الحساب البنكي.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    bookType: "xlsx",
    headers: [
      "الرقم_الوظيفي",
      "رمز_البنك",
      "رقم_الحساب_البنكي",
      "حالة_الحساب_البنكي",
      "طريقة_القبض",
    ],
  },
};

export function createStaffBulkTemplateBytes(key: StaffBulkTemplateKey) {
  const template = STAFF_BULK_TEMPLATES[key];
  const worksheet = XLSX.utils.aoa_to_sheet([template.headers]);
  worksheet["!cols"] = template.headers.map((header) => ({ wch: Math.max(18, header.length + 4) }));

  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, worksheet, "البيانات");

  const bytes = XLSX.write(workbook, {
    bookType: template.bookType,
    type: "array",
    compression: true,
  });
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

export function downloadStaffBulkTemplate(key: StaffBulkTemplateKey) {
  const template = STAFF_BULK_TEMPLATES[key];
  const bytes = createStaffBulkTemplateBytes(key);
  const url = URL.createObjectURL(new Blob([bytes], { type: template.mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = template.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
