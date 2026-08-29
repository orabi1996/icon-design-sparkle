import {
  excelColumnLetter,
  normalizeExcelText,
  parseExcelDate,
  readXlsxMatrix,
} from "@/lib/employee-excel";

export const EMPLOYEE_UPDATE_EXCEL_COLUMNS = [
  { key: "empFileNum", label: "الرقم الوظيفى", field: "emp_no", kind: "identifier" },
  { key: "EmployeeName", label: "اسم الموظف", field: "full_name", kind: "text" },
  {
    key: "EmployeeNameEnglish",
    label: "اسم الموظف بالإنجليزية",
    field: "employee_name_en",
    kind: "text",
  },
  { key: "DateOfBirth", label: "تاريخ الميلاد", field: "birth_date", kind: "date" },
  { key: "GenderName", label: "النوع", field: "gender", kind: "gender" },
  { key: "IDNumber", label: "رقم الهوية", field: "national_id", kind: "nationalId" },
  { key: "StartDate", label: "تاريخ المباشرة", field: "start_date", kind: "date" },
  {
    key: "NationalityName",
    label: "الجنسية",
    field: "nationality",
    kind: "nationality",
  },
  { key: "ReligionName", label: "الديانة", field: "religion", kind: "religion" },
  {
    key: "MaritalStatusName",
    label: "الحالة الاجتماعية",
    field: "social_status",
    kind: "socialStatus",
  },
  { key: "PlaceOfBirth", label: "مكان الميلاد", field: "birth_place", kind: "text" },
  {
    key: "SpecializationName",
    label: "الوظيفة الحالية",
    field: "job_title",
    kind: "jobTitle",
  },
  { key: "Mobile", label: "الجوال", field: "phone", kind: "phone" },
  { key: "Email", label: "الإيميل", field: "email", kind: "email" },
  { key: "EmploymentDate", label: "تاريخ التعيين", field: "hire_date", kind: "date" },
  { key: "SponsorName", label: "اسم الكفيل", field: "sponsor_name", kind: "text" },
  {
    key: "PlacementDate",
    label: "تاريخ احتساب الإجازة السنوية",
    field: "annual_leave_calc_date",
    kind: "date",
  },
  {
    key: "AddressInsideKingdom",
    label: "العنوان داخل المملكة",
    field: "current_address",
    kind: "text",
  },
  {
    key: "AddressOutsideKingdom",
    label: "العنوان خارج المملكة",
    field: "home_country_address",
    kind: "text",
  },
  {
    key: "NumberOutsideKingdom",
    label: "الجوال خارج المملكة",
    field: "home_country_mobile",
    kind: "phone",
  },
  { key: "CountryCode", label: "مفتاح الدولة", field: "country_code", kind: "countryCode" },
  { key: "ContractType", label: "نوع العقد", field: "contract_type", kind: "contractType" },
  { key: "SectorName", label: "القطاع", field: "sector", kind: "sector" },
  { key: "MainSectionName", label: "المسار", field: "career_path", kind: "careerPath" },
  {
    key: "CareerName",
    label: "المسمى الوظيفي",
    field: "job_designation",
    kind: "jobDesignation",
  },
  {
    key: "ManagementName",
    label: "القسم الرئيسي",
    field: "main_department",
    kind: "mainDepartment",
  },
  { key: "ShortAddress", label: "العنوان المختصر", field: "short_address", kind: "text" },
  { key: "Street", label: "الشارع", field: "street", kind: "text" },
  { key: "City", label: "المدينة", field: "city", kind: "text" },
  { key: "Region", label: "المنطقة", field: "address_region", kind: "text" },
  { key: "UnitNumber", label: "رقم الوحدة", field: "unit_no", kind: "text" },
  { key: "AddressNotes", label: "ملاحظات العنوان", field: "address_notes", kind: "text" },
] as const;

type ColumnSpec = (typeof EMPLOYEE_UPDATE_EXCEL_COLUMNS)[number];
type ColumnKey = ColumnSpec["key"];
type ReferenceKey = Exclude<
  ColumnSpec["kind"],
  "identifier" | "text" | "date" | "gender" | "nationalId" | "phone" | "email" | "countryCode"
>;

export type EmployeeUpdateError = {
  row: number;
  column: string;
  key: string;
  value: string;
  message: string;
};

export type EmployeeUpdateChange = {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
};

export type EmployeeUpdateRecord = {
  rowNumber: number;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  raw: Record<ColumnKey, string>;
  payload: Record<string, unknown>;
  changes: EmployeeUpdateChange[];
};

export type EmployeeUpdateReferences = {
  employees: Record<string, unknown>[];
  nationality: string[];
  religion: string[];
  socialStatus: string[];
  jobTitle: string[];
  contractType: string[];
  sector: string[];
  careerPath: string[];
  jobDesignation: string[];
  mainDepartment: string[];
};

export type EmployeeUpdateResult = {
  records: EmployeeUpdateRecord[];
  validRecords: EmployeeUpdateRecord[];
  errors: EmployeeUpdateError[];
  totalRows: number;
  totalChanges: number;
};

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function normalizedSet(values: string[]) {
  return new Set(values.filter(Boolean).map(normalizeExcelText));
}

function addError(
  errors: EmployeeUpdateError[],
  row: number,
  columnIndex: number,
  value: string,
  message: string,
) {
  const spec = EMPLOYEE_UPDATE_EXCEL_COLUMNS[columnIndex];
  errors.push({
    row,
    column: `${excelColumnLetter(columnIndex)} - ${spec?.label ?? "عمود إضافي"}`,
    key: spec?.key ?? "",
    value,
    message,
  });
}

function genderValue(value: string) {
  const normalized = normalizeExcelText(value);
  if (["ذكر", "male", "m"].includes(normalized)) return "ذكر";
  if (["انثي", "انثى", "female", "f"].includes(normalized)) return "أنثى";
  return null;
}

function parsedValue(spec: ColumnSpec, rawValue: string) {
  if (spec.kind === "date") return parseExcelDate(rawValue);
  if (spec.kind === "gender") return genderValue(rawValue);
  return rawValue;
}

function displayValue(value: unknown) {
  if (value == null || value === "") return "—";
  return String(value);
}

export async function parseEmployeeUpdateFile(
  file: File,
  references: EmployeeUpdateReferences,
): Promise<EmployeeUpdateResult> {
  const matrix = await readXlsxMatrix(file);
  const errors: EmployeeUpdateError[] = [];

  EMPLOYEE_UPDATE_EXCEL_COLUMNS.forEach((column, index) => {
    const keyValue = text(matrix[0]?.[index]);
    const labelValue = text(matrix[1]?.[index]);
    if (keyValue !== column.key) {
      addError(errors, 1, index, keyValue, `العنوان التقني يجب أن يكون: ${column.key}`);
    }
    if (normalizeExcelText(labelValue) !== normalizeExcelText(column.label)) {
      addError(errors, 2, index, labelValue, `العنوان العربي يجب أن يكون: ${column.label}`);
    }
  });

  const extraHeaderIndex = Math.max(
    EMPLOYEE_UPDATE_EXCEL_COLUMNS.length,
    matrix[0]?.findIndex(
      (value, index) => index >= EMPLOYEE_UPDATE_EXCEL_COLUMNS.length && text(value),
    ) ?? -1,
    matrix[1]?.findIndex(
      (value, index) => index >= EMPLOYEE_UPDATE_EXCEL_COLUMNS.length && text(value),
    ) ?? -1,
  );
  const extraHeaderValue = text(matrix[0]?.[extraHeaderIndex] ?? matrix[1]?.[extraHeaderIndex]);
  if (extraHeaderValue) {
    addError(
      errors,
      matrix[0]?.[extraHeaderIndex] ? 1 : 2,
      extraHeaderIndex,
      extraHeaderValue,
      "النموذج يحتوي على عمود إضافي غير معتمد",
    );
  }

  const employeesByNumber = new Map(
    references.employees
      .map((employee) => [normalizeExcelText(text(employee["emp_no"])), employee] as const)
      .filter(([number]) => Boolean(number)),
  );
  const nationalIdOwner = new Map(
    references.employees
      .map(
        (employee) =>
          [normalizeExcelText(text(employee["national_id"])), text(employee["emp_no"])] as const,
      )
      .filter(([nationalId]) => Boolean(nationalId)),
  );
  const allowedValues = {
    nationality: normalizedSet(references.nationality),
    religion: normalizedSet(references.religion),
    socialStatus: normalizedSet(references.socialStatus),
    jobTitle: normalizedSet(references.jobTitle),
    contractType: normalizedSet(references.contractType),
    sector: normalizedSet(references.sector),
    careerPath: normalizedSet(references.careerPath),
    jobDesignation: normalizedSet(references.jobDesignation),
    mainDepartment: normalizedSet(references.mainDepartment),
  } satisfies Record<ReferenceKey, Set<string>>;
  const referenceMessages: Record<ReferenceKey, string> = {
    nationality: "الجنسية غير موجودة في التهيئة",
    religion: "الديانة غير موجودة في التهيئة",
    socialStatus: "الحالة الاجتماعية غير موجودة في التهيئة",
    jobTitle: "الوظيفة الحالية غير موجودة في التهيئة",
    contractType: "نوع العقد غير موجود في التهيئة",
    sector: "القطاع غير موجود في التهيئة",
    careerPath: "المسار غير موجود في التهيئة",
    jobDesignation: "المسمى الوظيفي غير موجود في التهيئة",
    mainDepartment: "القسم الرئيسي غير موجود في التهيئة",
  };
  const seenEmployeeNumbers = new Map<string, number>();
  const seenNationalIds = new Map<string, { row: number; employeeNumber: string }>();
  const records: EmployeeUpdateRecord[] = [];

  for (let matrixIndex = 2; matrixIndex < matrix.length; matrixIndex += 1) {
    const cells = matrix[matrixIndex] ?? [];
    if (!cells.some((value) => text(value))) continue;
    const rowNumber = matrixIndex + 1;
    const raw = Object.fromEntries(
      EMPLOYEE_UPDATE_EXCEL_COLUMNS.map((column, index) => [column.key, text(cells[index])]),
    ) as Record<ColumnKey, string>;
    const employeeNumber = raw.empFileNum;
    const normalizedEmployeeNumber = normalizeExcelText(employeeNumber);
    if (!employeeNumber) {
      addError(errors, rowNumber, 0, "", "الرقم الوظيفي مطلوب لتحديد الموظف المراد تحديثه");
      continue;
    }

    const firstEmployeeRow = seenEmployeeNumbers.get(normalizedEmployeeNumber);
    if (firstEmployeeRow) {
      addError(
        errors,
        rowNumber,
        0,
        employeeNumber,
        `الرقم الوظيفي مكرر داخل الملف (أول ظهور في الصف ${firstEmployeeRow})`,
      );
    } else {
      seenEmployeeNumbers.set(normalizedEmployeeNumber, rowNumber);
    }

    const employee = employeesByNumber.get(normalizedEmployeeNumber);
    if (!employee) {
      addError(errors, rowNumber, 0, employeeNumber, "الرقم الوظيفي غير موجود في النظام");
      continue;
    }

    EMPLOYEE_UPDATE_EXCEL_COLUMNS.forEach((spec, index) => {
      const value = raw[spec.key];
      if (!value || spec.kind === "identifier" || spec.kind === "text") return;
      if (spec.kind === "date" && !parseExcelDate(value)) {
        addError(errors, rowNumber, index, value, "صيغة التاريخ غير صحيحة");
      } else if (spec.kind === "gender" && !genderValue(value)) {
        addError(errors, rowNumber, index, value, "القيمة المسموحة: ذكر أو أنثى");
      } else if (spec.kind === "nationalId" && !/^[0-9]{1,20}$/.test(value)) {
        addError(errors, rowNumber, index, value, "رقم الهوية يجب أن يحتوي على أرقام فقط");
      } else if (spec.kind === "phone" && !/^\+?[0-9\s-]{5,20}$/.test(value)) {
        addError(errors, rowNumber, index, value, "رقم الجوال يجب أن يحتوي على أرقام فقط");
      } else if (spec.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        addError(errors, rowNumber, index, value, "صيغة البريد الإلكتروني غير صحيحة");
      } else if (spec.kind === "countryCode" && !/^\+?[0-9]{1,5}$/.test(value)) {
        addError(errors, rowNumber, index, value, "مفتاح الدولة يجب أن يكون أرقامًا مثل +966");
      } else if (spec.kind in allowedValues) {
        const allowed = allowedValues[spec.kind as ReferenceKey];
        if (allowed.size > 0 && !allowed.has(normalizeExcelText(value))) {
          addError(errors, rowNumber, index, value, referenceMessages[spec.kind as ReferenceKey]);
        }
      }
    });

    if (raw.IDNumber) {
      const normalizedNationalId = normalizeExcelText(raw.IDNumber);
      const databaseOwner = nationalIdOwner.get(normalizedNationalId);
      if (databaseOwner && normalizeExcelText(databaseOwner) !== normalizedEmployeeNumber) {
        addError(
          errors,
          rowNumber,
          5,
          raw.IDNumber,
          `رقم الهوية مستخدم لموظف آخر (${databaseOwner})`,
        );
      }
      const fileOwner = seenNationalIds.get(normalizedNationalId);
      if (fileOwner && fileOwner.employeeNumber !== normalizedEmployeeNumber) {
        addError(
          errors,
          rowNumber,
          5,
          raw.IDNumber,
          `رقم الهوية مكرر داخل الملف (أول ظهور في الصف ${fileOwner.row})`,
        );
      } else {
        seenNationalIds.set(normalizedNationalId, {
          row: rowNumber,
          employeeNumber: normalizedEmployeeNumber,
        });
      }
    }

    const parsedDates = {
      birth_date: raw.DateOfBirth ? parseExcelDate(raw.DateOfBirth) : text(employee["birth_date"]),
      start_date: raw.StartDate ? parseExcelDate(raw.StartDate) : text(employee["start_date"]),
      hire_date: raw.EmploymentDate
        ? parseExcelDate(raw.EmploymentDate)
        : text(employee["hire_date"]),
      annual_leave_calc_date: raw.PlacementDate
        ? parseExcelDate(raw.PlacementDate)
        : text(employee["annual_leave_calc_date"]),
    };
    const today = new Date().toISOString().slice(0, 10);
    if (parsedDates.birth_date && parsedDates.birth_date > today) {
      addError(errors, rowNumber, 3, raw.DateOfBirth, "تاريخ الميلاد لا يمكن أن يكون في المستقبل");
    }
    if (
      parsedDates.birth_date &&
      parsedDates.hire_date &&
      parsedDates.hire_date <= parsedDates.birth_date
    ) {
      addError(errors, rowNumber, 14, raw.EmploymentDate, "تاريخ التعيين يجب أن يلي تاريخ الميلاد");
    }
    if (
      parsedDates.hire_date &&
      parsedDates.start_date &&
      parsedDates.start_date < parsedDates.hire_date
    ) {
      addError(errors, rowNumber, 6, raw.StartDate, "تاريخ المباشرة لا يمكن أن يسبق تاريخ التعيين");
    }

    const changes: EmployeeUpdateChange[] = [];
    const payload: Record<string, unknown> = { emp_no: employeeNumber };
    EMPLOYEE_UPDATE_EXCEL_COLUMNS.slice(1).forEach((spec) => {
      const oldValue = employee[spec.field];
      const rawValue = raw[spec.key];
      const nextValue = rawValue ? parsedValue(spec, rawValue) : (oldValue ?? null);
      payload[spec.field] = nextValue;
      if (rawValue && text(oldValue) !== text(nextValue)) {
        changes.push({
          field: spec.field,
          label: spec.label,
          oldValue: displayValue(oldValue),
          newValue: displayValue(nextValue),
        });
      }
    });
    if (changes.length === 0) {
      addError(errors, rowNumber, 0, employeeNumber, "لا توجد قيم جديدة لتحديث هذا الموظف");
    }
    records.push({
      rowNumber,
      employeeId: text(employee["id"]),
      employeeNumber,
      employeeName: text(employee["full_name"]),
      raw,
      payload,
      changes,
    });
  }

  if (records.length === 0 && !errors.some((error) => error.row >= 3)) {
    errors.push({
      row: 3,
      column: "—",
      key: "",
      value: "",
      message: "لا توجد صفوف موظفين داخل الملف",
    });
  }
  const invalidRows = new Set(errors.filter((error) => error.row >= 3).map((error) => error.row));
  const hasHeaderErrors = errors.some((error) => error.row < 3);
  const validRecords = hasHeaderErrors
    ? []
    : records.filter((record) => !invalidRows.has(record.rowNumber));
  return {
    records,
    validRecords,
    errors,
    totalRows: records.length,
    totalChanges: validRecords.reduce((total, record) => total + record.changes.length, 0),
  };
}
