import { excelColumnLetter, normalizeExcelText, parseExcelDate } from "@/lib/employee-excel";
import { STAFF_BULK_TEMPLATES, type StaffBulkTemplateKey } from "@/lib/staff-bulk-templates";

export type StaffBulkImportError = {
  row: number;
  cell: string;
  column: string;
  key: string;
  value: string;
  message: string;
};

export type StaffBulkEmployeeReference = {
  id: string;
  empNo: string;
  nationalId: string;
  name: string;
};

export type StaffBulkDefinitionReference = {
  id: string;
  name: string;
};

export type StaffBulkReferences = {
  employees: StaffBulkEmployeeReference[];
  statuses?: string[];
  entitlements?: StaffBulkDefinitionReference[];
  deductions?: StaffBulkDefinitionReference[];
};

export type StaffBulkContext = {
  documentType?: string;
  year?: number;
  month?: number;
  definitionId?: string;
  definitionName?: string;
  isDefault?: boolean;
};

export type StaffBulkValidRecord = {
  row: number;
  values: string[];
  payload: Record<string, unknown>;
};

export type StaffBulkImportResult = {
  totalRows: number;
  validRecords: StaffBulkValidRecord[];
  errors: StaffBulkImportError[];
};

type ImportSpec = {
  headers: string[];
  labels: string[];
};

export const STAFF_BULK_IMPORT_SPECS: Record<StaffBulkTemplateKey, ImportSpec> = {
  facility: {
    headers: STAFF_BULK_TEMPLATES.facility.headers,
    labels: ["رقم الهوية", "رقم مكتب العمل"],
  },
  salaries: {
    headers: STAFF_BULK_TEMPLATES.salaries.headers,
    labels: [
      "الرقم الوظيفي",
      "رقم الهوية",
      "اسم الموظف",
      "الحالة",
      "الراتب الأساسي",
      "رقم مكتب العمل",
    ],
  },
  documents: {
    headers: STAFF_BULK_TEMPLATES.documents.headers,
    labels: ["اسم الموظف", "رقم الهوية", "رقم المستند", "التاريخ الحالي", "تاريخ التجديد"],
  },
  entitlement: {
    headers: STAFF_BULK_TEMPLATES.entitlement.headers,
    labels: ["الرقم الوظيفي", "القيمة"],
  },
  deduction: {
    headers: STAFF_BULK_TEMPLATES.deduction.headers,
    labels: ["الرقم الوظيفي", "القيمة", "ملاحظات"],
  },
  bank: {
    headers: STAFF_BULK_TEMPLATES.bank.headers,
    labels: ["الرقم الوظيفي", "رمز البنك", "رقم الحساب البنكي", "حالة الحساب", "طريقة القبض"],
  },
};

function text(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function identifier(value: unknown) {
  const clean = text(value).replace(/\.0+$/, "");
  return clean.replace(/\s+/g, "");
}

function numeric(value: string) {
  const normalized = value.replace(/[٬,]/g, "").replace("٫", ".");
  if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function paymentMethod(value: string) {
  const normalized = normalizeExcelText(value);
  if (["a", "cash", "نقدي"].includes(normalized)) return "نقدي";
  if (["b", "bank", "تحويل", "تحويل بنكي", "بنك"].includes(normalized)) {
    return "تحويل بنكي";
  }
  if (["c", "cheque", "check", "شيك"].includes(normalized)) return "شيك";
  return null;
}

function validNationalId(value: string) {
  return /^\d{10}$/.test(value) && /^[12]/.test(value);
}

function addError(
  errors: StaffBulkImportError[],
  row: number,
  columnIndex: number,
  spec: ImportSpec,
  value: string,
  message: string,
) {
  const letter = excelColumnLetter(columnIndex);
  errors.push({
    row,
    cell: `${letter}${row}`,
    column: spec.labels[columnIndex] ?? spec.headers[columnIndex] ?? `العمود ${letter}`,
    key: spec.headers[columnIndex] ?? "row",
    value,
    message,
  });
}

function findEmployeeByNumber(references: StaffBulkReferences, empNo: string) {
  return references.employees.find((employee) => identifier(employee.empNo) === empNo);
}

function findEmployeeByNationalId(references: StaffBulkReferences, nationalId: string) {
  return references.employees.find((employee) => identifier(employee.nationalId) === nationalId);
}

function validateHeaders(matrix: string[][], spec: ImportSpec, errors: StaffBulkImportError[]) {
  const actual = matrix[0] ?? [];
  spec.headers.forEach((expected, index) => {
    const value = text(actual[index]);
    if (value !== expected) {
      addError(
        errors,
        1,
        index,
        spec,
        value,
        `عنوان العمود يجب أن يكون «${expected}» كما هو في النموذج المعتمد`,
      );
    }
  });
  for (let index = spec.headers.length; index < actual.length; index += 1) {
    const value = text(actual[index]);
    if (value) {
      addError(errors, 1, index, spec, value, "يوجد عمود زائد غير موجود في النموذج المعتمد");
    }
  }
}

function validateContext(kind: StaffBulkTemplateKey, context: StaffBulkContext) {
  if (kind === "documents" && !context.documentType) return "يرجى اختيار اسم المستند أولاً";
  if (["entitlement", "deduction"].includes(kind)) {
    if (!context.year || !context.month) return "يرجى اختيار السنة والشهر أولاً";
    if (!context.definitionId || !context.definitionName) {
      return kind === "entitlement" ? "يرجى اختيار الاستحقاق أولاً" : "يرجى اختيار الاستقطاع أولاً";
    }
  }
  return null;
}

function validateFacilityRow(
  raw: string[],
  row: number,
  references: StaffBulkReferences,
  errors: StaffBulkImportError[],
  seen: Map<string, number>,
) {
  const spec = STAFF_BULK_IMPORT_SPECS.facility;
  const nationalId = identifier(raw[0]);
  const workNumber = identifier(raw[1]);
  let invalid = false;
  if (!validNationalId(nationalId)) {
    addError(
      errors,
      row,
      0,
      spec,
      nationalId,
      "رقم الهوية مطلوب ويجب أن يتكون من 10 أرقام ويبدأ بـ 1 أو 2",
    );
    invalid = true;
  }
  if (!/^\d{1,15}$/.test(workNumber)) {
    addError(
      errors,
      row,
      1,
      spec,
      workNumber,
      "رقم مكتب العمل مطلوب ويتكون من أرقام فقط بحد أقصى 15 رقمًا",
    );
    invalid = true;
  }
  const previous = seen.get(nationalId);
  if (nationalId && previous) {
    addError(errors, row, 0, spec, nationalId, `رقم الهوية مكرر؛ سبق إدخاله في الصف ${previous}`);
    invalid = true;
  } else if (nationalId) seen.set(nationalId, row);
  const employee = findEmployeeByNationalId(references, nationalId);
  if (validNationalId(nationalId) && !employee) {
    addError(errors, row, 0, spec, nationalId, "لا يوجد موظف مسجل بهذا الرقم القومي/رقم الهوية");
    invalid = true;
  }
  return invalid || !employee
    ? null
    : {
        row,
        values: [nationalId, workNumber],
        payload: {
          source_row: row,
          employee_id: employee.id,
          national_id: nationalId,
          work_number: workNumber,
        },
      };
}

function validateSalaryRow(
  raw: string[],
  row: number,
  references: StaffBulkReferences,
  errors: StaffBulkImportError[],
  seen: Map<string, number>,
) {
  const spec = STAFF_BULK_IMPORT_SPECS.salaries;
  const empNo = identifier(raw[0]);
  const nationalId = identifier(raw[1]);
  const employeeName = text(raw[2]);
  const status = text(raw[3]);
  const salaryText = text(raw[4]);
  const workNumber = identifier(raw[5]);
  const salary = numeric(salaryText);
  let invalid = false;
  if (!empNo) {
    addError(errors, row, 0, spec, empNo, "الرقم الوظيفي مطلوب");
    invalid = true;
  }
  const previous = seen.get(empNo);
  if (empNo && previous) {
    addError(errors, row, 0, spec, empNo, `الرقم الوظيفي مكرر؛ سبق إدخاله في الصف ${previous}`);
    invalid = true;
  } else if (empNo) seen.set(empNo, row);
  const employee = findEmployeeByNumber(references, empNo);
  if (empNo && !employee) {
    addError(errors, row, 0, spec, empNo, "الرقم الوظيفي غير موجود في النظام");
    invalid = true;
  }
  if (!validNationalId(nationalId)) {
    addError(
      errors,
      row,
      1,
      spec,
      nationalId,
      "رقم الهوية مطلوب ويجب أن يتكون من 10 أرقام ويبدأ بـ 1 أو 2",
    );
    invalid = true;
  } else if (employee?.nationalId && identifier(employee.nationalId) !== nationalId) {
    addError(errors, row, 1, spec, nationalId, `رقم الهوية لا يطابق الموظف رقم ${empNo}`);
    invalid = true;
  }
  if (!employeeName) {
    addError(errors, row, 2, spec, employeeName, "اسم الموظف مطلوب");
    invalid = true;
  } else if (
    employee?.name &&
    normalizeExcelText(employee.name) !== normalizeExcelText(employeeName)
  ) {
    addError(errors, row, 2, spec, employeeName, `اسم الموظف لا يطابق الرقم الوظيفي ${empNo}`);
    invalid = true;
  }
  if (status) {
    const allowedStatuses = new Set(
      ["نشط", "موقوف", "متوقف", "غير نشط", "منتهي الخدمة", ...(references.statuses ?? [])].map(
        normalizeExcelText,
      ),
    );
    if (!allowedStatuses.has(normalizeExcelText(status))) {
      addError(errors, row, 3, spec, status, "حالة الموظف غير معرّفة في النظام");
      invalid = true;
    }
  }
  if (salary == null || salary < 0) {
    addError(
      errors,
      row,
      4,
      spec,
      salaryText,
      "الراتب الأساسي مطلوب ويجب أن يكون رقمًا صحيحًا أو عشريًا غير سالب",
    );
    invalid = true;
  }
  if (workNumber && !/^\d{1,15}$/.test(workNumber)) {
    addError(
      errors,
      row,
      5,
      spec,
      workNumber,
      "رقم مكتب العمل يجب أن يتكون من أرقام فقط بحد أقصى 15 رقمًا",
    );
    invalid = true;
  }
  return invalid || !employee || salary == null
    ? null
    : {
        row,
        values: [empNo, nationalId, employeeName, status, String(salary), workNumber],
        payload: {
          source_row: row,
          employee_id: employee.id,
          emp_no: empNo,
          basic_salary: salary,
          status: status || null,
          work_number: workNumber || null,
        },
      };
}

function validateDocumentRow(
  raw: string[],
  row: number,
  references: StaffBulkReferences,
  context: StaffBulkContext,
  errors: StaffBulkImportError[],
  seen: Map<string, number>,
) {
  const spec = STAFF_BULK_IMPORT_SPECS.documents;
  const employeeName = text(raw[0]);
  const nationalId = identifier(raw[1]);
  const documentNumber = identifier(raw[2]);
  const documentDate = parseExcelDate(text(raw[3]));
  const renewalDate = parseExcelDate(text(raw[4]));
  let invalid = false;
  if (!employeeName) {
    addError(errors, row, 0, spec, employeeName, "اسم الموظف مطلوب");
    invalid = true;
  }
  if (!validNationalId(nationalId)) {
    addError(
      errors,
      row,
      1,
      spec,
      nationalId,
      "رقم الهوية مطلوب ويجب أن يتكون من 10 أرقام ويبدأ بـ 1 أو 2",
    );
    invalid = true;
  }
  const employee = findEmployeeByNationalId(references, nationalId);
  if (validNationalId(nationalId) && !employee) {
    addError(errors, row, 1, spec, nationalId, "رقم الهوية غير موجود في النظام");
    invalid = true;
  } else if (
    employee?.name &&
    normalizeExcelText(employee.name) !== normalizeExcelText(employeeName)
  ) {
    addError(errors, row, 0, spec, employeeName, "اسم الموظف لا يطابق رقم الهوية في هذا الصف");
    invalid = true;
  }
  if (!documentNumber) {
    addError(errors, row, 2, spec, documentNumber, "رقم المستند مطلوب");
    invalid = true;
  }
  if (!documentDate) {
    addError(errors, row, 3, spec, text(raw[3]), "التاريخ الحالي غير صحيح؛ استخدم YYYY/MM/DD");
    invalid = true;
  }
  if (!renewalDate) {
    addError(errors, row, 4, spec, text(raw[4]), "تاريخ التجديد غير صحيح؛ استخدم YYYY/MM/DD");
    invalid = true;
  } else if (documentDate && renewalDate < documentDate) {
    addError(errors, row, 4, spec, text(raw[4]), "تاريخ التجديد لا يمكن أن يسبق التاريخ الحالي");
    invalid = true;
  }
  const duplicateKey = `${nationalId}|${context.documentType}`;
  const previous = seen.get(duplicateKey);
  if (nationalId && previous) {
    addError(
      errors,
      row,
      1,
      spec,
      nationalId,
      `الموظف مكرر لنفس المستند؛ سبق إدخاله في الصف ${previous}`,
    );
    invalid = true;
  } else if (nationalId) seen.set(duplicateKey, row);
  return invalid || !employee || !documentDate || !renewalDate
    ? null
    : {
        row,
        values: [employeeName, nationalId, documentNumber, documentDate, renewalDate],
        payload: {
          source_row: row,
          employee_id: employee.id,
          document_type: context.documentType,
          document_number: documentNumber,
          document_date: documentDate,
          renewal_date: renewalDate,
        },
      };
}

function validateAmountRow(
  kind: "entitlement" | "deduction",
  raw: string[],
  row: number,
  references: StaffBulkReferences,
  context: StaffBulkContext,
  errors: StaffBulkImportError[],
  seen: Map<string, number>,
) {
  const spec = STAFF_BULK_IMPORT_SPECS[kind];
  const empNo = identifier(raw[0]);
  const valueText = text(raw[1]);
  const notes = text(raw[2]);
  const amount = numeric(valueText);
  let invalid = false;
  if (!empNo) {
    addError(errors, row, 0, spec, empNo, "الرقم الوظيفي مطلوب");
    invalid = true;
  }
  const employee = findEmployeeByNumber(references, empNo);
  if (empNo && !employee) {
    addError(errors, row, 0, spec, empNo, "الرقم الوظيفي غير موجود في النظام");
    invalid = true;
  }
  const previous = seen.get(empNo);
  if (empNo && previous) {
    addError(errors, row, 0, spec, empNo, `الرقم الوظيفي مكرر؛ سبق إدخاله في الصف ${previous}`);
    invalid = true;
  } else if (empNo) seen.set(empNo, row);
  if (amount == null || amount <= 0) {
    addError(errors, row, 1, spec, valueText, "القيمة مطلوبة ويجب أن تكون رقمًا أكبر من صفر");
    invalid = true;
  }
  if (notes.length > 500) {
    addError(errors, row, 2, spec, notes, "الملاحظات تتجاوز 500 حرف");
    invalid = true;
  }
  return invalid || !employee || amount == null
    ? null
    : {
        row,
        values: kind === "deduction" ? [empNo, String(amount), notes] : [empNo, String(amount)],
        payload: {
          source_row: row,
          employee_id: employee.id,
          definition_id: context.definitionId,
          definition_name: context.definitionName,
          year: context.year,
          month: context.month,
          amount,
          is_default: context.isDefault === true,
          notes: notes || null,
        },
      };
}

function validateBankRow(
  raw: string[],
  row: number,
  references: StaffBulkReferences,
  errors: StaffBulkImportError[],
  seen: Map<string, number>,
) {
  const spec = STAFF_BULK_IMPORT_SPECS.bank;
  const empNo = identifier(raw[0]);
  const bankCode = identifier(raw[1]).toUpperCase();
  const accountNumber = identifier(raw[2]).toUpperCase();
  const accountStatus = text(raw[3]);
  const methodRaw = text(raw[4]);
  const method = paymentMethod(methodRaw);
  let invalid = false;
  const employee = findEmployeeByNumber(references, empNo);
  if (!empNo) {
    addError(errors, row, 0, spec, empNo, "الرقم الوظيفي مطلوب");
    invalid = true;
  } else if (!employee) {
    addError(errors, row, 0, spec, empNo, "الرقم الوظيفي غير موجود في النظام");
    invalid = true;
  }
  const previous = seen.get(empNo);
  if (empNo && previous) {
    addError(errors, row, 0, spec, empNo, `الرقم الوظيفي مكرر؛ سبق إدخاله في الصف ${previous}`);
    invalid = true;
  } else if (empNo) seen.set(empNo, row);
  if (!/^[A-Z0-9]{2,20}$/.test(bankCode)) {
    addError(
      errors,
      row,
      1,
      spec,
      bankCode,
      "رمز البنك مطلوب ويقبل الحروف الإنجليزية والأرقام من 2 إلى 20 خانة",
    );
    invalid = true;
  }
  if (!/^[A-Z0-9]{8,34}$/.test(accountNumber)) {
    addError(
      errors,
      row,
      2,
      spec,
      accountNumber,
      "رقم الحساب مطلوب ويقبل الحروف الإنجليزية والأرقام من 8 إلى 34 خانة دون مسافات",
    );
    invalid = true;
  }
  if (!accountStatus || accountStatus.length > 50) {
    addError(errors, row, 3, spec, accountStatus, "حالة الحساب البنكي مطلوبة وبحد أقصى 50 حرفًا");
    invalid = true;
  }
  if (!method) {
    addError(errors, row, 4, spec, methodRaw, "طريقة القبض يجب أن تكون: نقدي أو تحويل بنكي أو شيك");
    invalid = true;
  }
  return invalid || !employee || !method
    ? null
    : {
        row,
        values: [empNo, bankCode, accountNumber, accountStatus, method],
        payload: {
          source_row: row,
          employee_id: employee.id,
          bank_code: bankCode,
          bank_account_no: accountNumber,
          bank_account_status: accountStatus,
          payment_method: method,
        },
      };
}

export function parseStaffBulkMatrix(
  kind: StaffBulkTemplateKey,
  matrix: unknown[][],
  references: StaffBulkReferences,
  context: StaffBulkContext = {},
): StaffBulkImportResult {
  const spec = STAFF_BULK_IMPORT_SPECS[kind];
  const rows = matrix.map((row) => row.map(text));
  const errors: StaffBulkImportError[] = [];
  const validRecords: StaffBulkValidRecord[] = [];
  validateHeaders(rows, spec, errors);
  const contextError = validateContext(kind, context);
  if (contextError) {
    errors.push({
      row: 0,
      cell: "الإعدادات",
      column: "إعدادات عملية الرفع",
      key: "context",
      value: "",
      message: contextError,
    });
  }
  const seen = new Map<string, number>();
  let totalRows = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const raw = rows[index] ?? [];
    if (raw.every((value) => !value)) continue;
    totalRows += 1;
    const row = index + 1;
    const errorsBeforeRow = errors.length;
    for (let columnIndex = spec.headers.length; columnIndex < raw.length; columnIndex += 1) {
      if (raw[columnIndex]) {
        addError(
          errors,
          row,
          columnIndex,
          spec,
          raw[columnIndex],
          "توجد قيمة في عمود زائد غير موجود في النموذج المعتمد",
        );
      }
    }
    let record: StaffBulkValidRecord | null = null;
    if (kind === "facility") record = validateFacilityRow(raw, row, references, errors, seen);
    if (kind === "salaries") record = validateSalaryRow(raw, row, references, errors, seen);
    if (kind === "documents") {
      record = validateDocumentRow(raw, row, references, context, errors, seen);
    }
    if (kind === "entitlement" || kind === "deduction") {
      record = validateAmountRow(kind, raw, row, references, context, errors, seen);
    }
    if (kind === "bank") record = validateBankRow(raw, row, references, errors, seen);
    if (record && errors.length === errorsBeforeRow) validRecords.push(record);
  }
  if (totalRows === 0) {
    errors.push({
      row: 2,
      cell: "A2",
      column: spec.labels[0] ?? "البيانات",
      key: spec.headers[0] ?? "row",
      value: "",
      message: "الملف لا يحتوي على صفوف بيانات",
    });
  }
  return { totalRows, validRecords, errors };
}

export async function parseStaffBulkFile(
  kind: StaffBulkTemplateKey,
  file: File,
  references: StaffBulkReferences,
  context: StaffBulkContext = {},
) {
  const extension = file.name.toLocaleLowerCase();
  if (!extension.endsWith(".xls") && !extension.endsWith(".xlsx")) {
    throw new Error("الصيغ المدعومة هي XLS وXLSX فقط");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("حجم الملف يتجاوز 10 ميجابايت");
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: false,
    cellText: true,
  });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error("لم يتم العثور على ورقة بيانات داخل الملف");
  const worksheet = workbook.Sheets[firstSheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: true,
  });
  return parseStaffBulkMatrix(kind, matrix, references, context);
}
