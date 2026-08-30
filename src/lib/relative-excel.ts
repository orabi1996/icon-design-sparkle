import {
  excelColumnLetter,
  normalizeExcelText,
  parseExcelDate,
  readXlsxMatrix,
} from "@/lib/employee-excel";

export const RELATIVE_EXCEL_COLUMNS = [
  { key: "Name", label: "اسم القريب بالعربية", required: true },
  { key: "NameEn", label: "اسم القريب بالإنجليزية", required: false },
  { key: "Relationship", label: "صلة القرابة", required: true },
  { key: "IDNumber", label: "رقم هوية القريب", required: true },
  { key: "Nationality", label: "الجنسية", required: true },
  { key: "Gender", label: "الجنس", required: true },
  { key: "Job", label: "الوظيفة", required: false },
  { key: "PassExpDate", label: "تاريخ انتهاء الجواز", required: false },
  { key: "PassportNumber", label: "رقم الجواز", required: false },
  { key: "DateOfBirth", label: "تاريخ الميلاد", required: true },
  { key: "EmpIDNumber", label: "رقم هوية الموظف", required: true },
] as const;

type RelativeColumnKey = (typeof RELATIVE_EXCEL_COLUMNS)[number]["key"];

export type RelativeImportError = {
  row: number;
  cell: string;
  column: string;
  key: string;
  value: string;
  message: string;
};

export type RelativeImportEmployee = {
  id: string;
  nationalId: string;
  employeeNumber: string;
  name: string;
};

export type ExistingRelative = {
  idNumber: string;
  employeeNationalId: string;
};

export type RelativeImportReferences = {
  employees: RelativeImportEmployee[];
  existingRelatives: ExistingRelative[];
  nationalities: string[];
  relationships: string[];
};

export type RelativeImportRecord = {
  rowNumber: number;
  raw: Record<RelativeColumnKey, string>;
  payload: Record<string, string | null>;
};

export type RelativeImportResult = {
  records: RelativeImportRecord[];
  validRecords: RelativeImportRecord[];
  errors: RelativeImportError[];
  totalRows: number;
};

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function identifier(value: string) {
  return value.replace(/[\s\u200E\u200F]/g, "").toUpperCase();
}

function resolveReference(value: string, values: string[]) {
  const normalized = normalizeExcelText(value);
  return values.find((candidate) => normalizeExcelText(candidate) === normalized) ?? null;
}

function normalizeGender(value: string) {
  const normalized = normalizeExcelText(value);
  if (["ذكر", "male", "m", "1"].includes(normalized)) return "ذكر";
  if (["انثي", "انثى", "female", "f", "2"].includes(normalized)) return "أنثى";
  return null;
}

function isIdentifier(value: string, min = 5, max = 30) {
  return new RegExp(`^[\\p{L}\\p{N}][\\p{L}\\p{N}\\-/]{${min - 1},${max - 1}}$`, "u").test(
    identifier(value),
  );
}

function dateAge(date: string, today: string) {
  const from = new Date(`${date}T00:00:00Z`);
  const to = new Date(`${today}T00:00:00Z`);
  let years = to.getUTCFullYear() - from.getUTCFullYear();
  const monthDelta = to.getUTCMonth() - from.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && to.getUTCDate() < from.getUTCDate())) years -= 1;
  return years;
}

export function parseRelativeImportMatrix(
  matrix: string[][],
  references: RelativeImportReferences,
  today = new Date().toISOString().slice(0, 10),
): RelativeImportResult {
  if (matrix.length === 0) throw new Error("ملف Excel فارغ");

  const errors: RelativeImportError[] = [];
  const records: RelativeImportRecord[] = [];
  const header = matrix[0] ?? [];

  const addError = (row: number, columnIndex: number, value: unknown, message: string) => {
    const column = RELATIVE_EXCEL_COLUMNS[columnIndex];
    const letter = excelColumnLetter(columnIndex);
    errors.push({
      row,
      cell: `${letter}${row}`,
      column: column ? `${letter} - ${column.key} (${column.label})` : letter,
      key: column?.key ?? "",
      value: text(value),
      message,
    });
  };

  RELATIVE_EXCEL_COLUMNS.forEach((column, index) => {
    if (normalizeExcelText(text(header[index])) !== normalizeExcelText(column.key)) {
      addError(
        1,
        index,
        header[index],
        `عنوان العمود يجب أن يكون ${column.key} كما هو في النموذج المعتمد`,
      );
    }
  });
  header.slice(RELATIVE_EXCEL_COLUMNS.length).forEach((value, offset) => {
    if (text(value)) {
      addError(
        1,
        RELATIVE_EXCEL_COLUMNS.length + offset,
        value,
        "يوجد عمود زائد غير موجود في النموذج المعتمد",
      );
    }
  });

  const dataRows = matrix
    .slice(1)
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => row.some((value) => text(value)));

  if (dataRows.length === 0) {
    throw new Error("النموذج لا يحتوي على بيانات أقارب. أضف البيانات ابتداءً من الصف 2");
  }

  if (errors.some((error) => error.row === 1)) {
    return { records, validRecords: [], errors, totalRows: dataRows.length };
  }

  const employeeByNationalId = new Map(
    references.employees.map((employee) => [identifier(employee.nationalId), employee]),
  );
  const existingOwnerByRelativeId = new Map(
    references.existingRelatives.map((relative) => [
      identifier(relative.idNumber),
      identifier(relative.employeeNationalId),
    ]),
  );
  const seenKeys = new Map<string, number>();
  for (const { row, rowNumber } of dataRows) {
    const beforeErrors = errors.length;
    const raw = Object.fromEntries(
      RELATIVE_EXCEL_COLUMNS.map((column, index) => [column.key, text(row[index])]),
    ) as Record<RelativeColumnKey, string>;

    RELATIVE_EXCEL_COLUMNS.forEach((column, index) => {
      if (column.required && !raw[column.key]) {
        addError(rowNumber, index, "", `حقل ${column.label} مطلوب`);
      }
    });

    if (raw.Name && raw.Name.length < 2) {
      addError(rowNumber, 0, raw.Name, "اسم القريب قصير أو غير صالح");
    }

    const employeeNationalId = identifier(raw.EmpIDNumber);
    const employee = employeeByNationalId.get(employeeNationalId);
    if (raw.EmpIDNumber && !employee) {
      addError(
        rowNumber,
        10,
        raw.EmpIDNumber,
        "رقم هوية الموظف غير موجود في بيانات الموظفين بالنظام",
      );
    }

    const relativeId = identifier(raw.IDNumber);
    if (raw.IDNumber && !isIdentifier(raw.IDNumber)) {
      addError(
        rowNumber,
        3,
        raw.IDNumber,
        "رقم هوية القريب يجب أن يكون من 5 إلى 30 حرفًا أو رقمًا دون مسافات",
      );
    }

    if (relativeId && employeeNationalId) {
      const rowKey = `${employeeNationalId}|${relativeId}`;
      const firstRow = seenKeys.get(rowKey);
      if (firstRow) {
        addError(
          rowNumber,
          3,
          raw.IDNumber,
          `بيانات هذا القريب مكررة داخل الملف؛ أول ظهور كان في الصف ${firstRow}`,
        );
      } else {
        seenKeys.set(rowKey, rowNumber);
      }

      const existingOwner = existingOwnerByRelativeId.get(relativeId);
      if (existingOwner && existingOwner !== employeeNationalId) {
        addError(rowNumber, 3, raw.IDNumber, "رقم هوية القريب مرتبط بموظف آخر داخل النظام");
      }
    }

    let nationality = raw.Nationality;
    if (raw.Nationality && references.nationalities.length > 0) {
      const resolved = resolveReference(raw.Nationality, references.nationalities);
      if (!resolved) {
        addError(
          rowNumber,
          4,
          raw.Nationality,
          "الجنسية غير موجودة في قائمة الجنسيات المهيأة بالنظام",
        );
      } else {
        nationality = resolved;
      }
    }

    let relationship = raw.Relationship;
    if (raw.Relationship && references.relationships.length > 0) {
      const resolved = resolveReference(raw.Relationship, references.relationships);
      if (!resolved) {
        addError(
          rowNumber,
          2,
          raw.Relationship,
          "صلة القرابة غير موجودة في قائمة صلات القرابة المهيأة بالنظام",
        );
      } else {
        relationship = resolved;
      }
    }

    const gender = raw.Gender ? normalizeGender(raw.Gender) : null;
    if (raw.Gender && !gender) {
      addError(rowNumber, 5, raw.Gender, "القيمة المقبولة للجنس هي ذكر أو أنثى");
    }

    const dateOfBirth = raw.DateOfBirth ? parseExcelDate(raw.DateOfBirth) : null;
    if (raw.DateOfBirth && !dateOfBirth) {
      addError(
        rowNumber,
        9,
        raw.DateOfBirth,
        "تاريخ الميلاد غير صالح؛ استخدم تاريخ Excel أو الصيغة YYYY-MM-DD",
      );
    } else if (dateOfBirth && (dateOfBirth > today || dateAge(dateOfBirth, today) > 120)) {
      addError(rowNumber, 9, raw.DateOfBirth, "تاريخ الميلاد خارج النطاق المقبول");
    }

    const passportExpiry = raw.PassExpDate ? parseExcelDate(raw.PassExpDate) : null;
    if (raw.PassExpDate && !passportExpiry) {
      addError(
        rowNumber,
        7,
        raw.PassExpDate,
        "تاريخ انتهاء الجواز غير صالح؛ استخدم تاريخ Excel أو الصيغة YYYY-MM-DD",
      );
    } else if (passportExpiry && passportExpiry < today) {
      addError(rowNumber, 7, raw.PassExpDate, "جواز السفر منتهي الصلاحية");
    }

    if (raw.PassportNumber && !raw.PassExpDate) {
      addError(rowNumber, 7, "", "تاريخ انتهاء الجواز مطلوب عند إدخال رقم الجواز");
    }
    if (raw.PassExpDate && !raw.PassportNumber) {
      addError(rowNumber, 8, "", "رقم الجواز مطلوب عند إدخال تاريخ انتهاء الجواز");
    }
    if (raw.PassportNumber && !isIdentifier(raw.PassportNumber, 5, 25)) {
      addError(
        rowNumber,
        8,
        raw.PassportNumber,
        "رقم الجواز يجب أن يكون من 5 إلى 25 حرفًا أو رقمًا دون مسافات",
      );
    }

    const record: RelativeImportRecord = {
      rowNumber,
      raw,
      payload: {
        employee_id: employee?.id ?? null,
        employee_national_id: raw.EmpIDNumber ? employeeNationalId : null,
        employee_emp_no: employee?.employeeNumber ?? null,
        employee_name: employee?.name ?? null,
        name: raw.Name || null,
        name_en: raw.NameEn || null,
        relationship: relationship || null,
        id_number: relativeId || null,
        nationality: nationality || null,
        gender,
        job: raw.Job || null,
        passport_expiry_date: passportExpiry,
        passport_number: raw.PassportNumber ? identifier(raw.PassportNumber) : null,
        date_of_birth: dateOfBirth,
      },
    };
    records.push(record);

    if (errors.length > beforeErrors) continue;
  }

  const invalidRows = new Set(errors.map((error) => error.row));
  return {
    records,
    validRecords: records.filter((record) => !invalidRows.has(record.rowNumber)),
    errors,
    totalRows: dataRows.length,
  };
}

export async function parseRelativeImportFile(
  file: File,
  references: RelativeImportReferences,
): Promise<RelativeImportResult> {
  return parseRelativeImportMatrix(await readXlsxMatrix(file), references);
}
