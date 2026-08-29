export const EMPLOYEE_EXCEL_COLUMNS = [
  { key: "empFileNum", label: "الرقم الوظيفى", required: true },
  { key: "EmployeeName", label: "اسم الموظف", required: true },
  { key: "DateOfBirth", label: "تاريخ الميلاد", required: true },
  { key: "SectionName", label: "القسم", required: true },
  { key: "BranchName", label: "الفرع", required: true },
  { key: "GenderName", label: "النوع", required: true },
  { key: "IDNumber", label: "رقم الهوية", required: true },
  { key: "StartDate", label: "تاريخ المباشرة", required: true },
  { key: "JobName", label: "الفئة الوظيفية", required: true },
  { key: "IsActive", label: "مفعل", required: true },
  { key: "IsHumanResources", label: "موظف موارد بشرية", required: false },
  { key: "IsExcluded", label: "مستثنى من البصمة", required: false },
  { key: "ShowInFingerReports", label: "العرض في تقارير البصمة", required: false },
  { key: "OnTheJob", label: "على راس العمل", required: true },
  { key: "NationalityName", label: "الجنسية", required: true },
  { key: "ReligionName", label: "الديانه", required: true },
  { key: "MaritalStatusName", label: "الحالة الاجتماعية", required: true },
  { key: "PlaceOfBirth", label: "مكان الميلاد", required: false },
  { key: "SpecializationName", label: "الوظيفة الحالية", required: true },
  { key: "Mobile", label: "الجوال", required: true },
  { key: "Email", label: "الايميل", required: true },
  { key: "CashType", label: "طريقة الدفع", required: true },
  { key: "FingerprintID", label: "رقم البصمة", required: false },
  { key: "IsStoped", label: "موقوف", required: false },
  { key: "EmploymentDate", label: "تاريخ التعين", required: true },
  { key: "JobLevelName", label: "المستوى الوظيفى", required: true },
  { key: "SponsorName", label: "اسم الكفيل", required: false },
  { key: "WorkOfficeNumber", label: "رقم مكتب العمل", required: false },
  { key: "PlacementDate", label: "تاريخ احتساب الاجازاه السنويه", required: true },
  { key: "ShortAddress", label: "العنوان المختصر", required: false },
  { key: "Street", label: "الشارع", required: false },
  { key: "City", label: "المدينة", required: false },
  { key: "Region", label: "المنطقة", required: false },
  { key: "UnitNumber", label: "رقم الوحدة", required: false },
  { key: "AddressNotes", label: "ملاحظات العنوان", required: false },
] as const;

type ColumnKey = (typeof EMPLOYEE_EXCEL_COLUMNS)[number]["key"];

export type EmployeeImportError = {
  row: number;
  column: string;
  key: string;
  value: string;
  message: string;
};

export type EmployeeImportRecord = {
  rowNumber: number;
  raw: Record<ColumnKey, string>;
  payload: Record<string, string | number | boolean | null>;
};

export type EmployeeImportReferences = {
  departments: string[];
  branches: string[];
  jobCategories: string[];
  jobTitles: string[];
  jobLevels: string[];
  nationalities: string[];
  religions: string[];
  socialStatuses: string[];
  existingEmployeeNumbers: string[];
  existingNationalIds: string[];
  existingFingerprintIds: string[];
};

export type EmployeeImportResult = {
  records: EmployeeImportRecord[];
  validRecords: EmployeeImportRecord[];
  errors: EmployeeImportError[];
  totalRows: number;
};

type ZipEntry = {
  method: number;
  compressedSize: number;
  dataOffset: number;
};

const textDecoder = new TextDecoder("utf-8");

function columnLetter(index: number) {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function columnIndex(reference: string) {
  const letters = reference.match(/[A-Z]+/i)?.[0]?.toUpperCase() ?? "";
  let result = 0;
  for (const letter of letters) result = result * 26 + letter.charCodeAt(0) - 64;
  return Math.max(0, result - 1);
}

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ar")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ");
}

function decodeXml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function unzipDirectory(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let endOffset = bytes.length - 22;
  while (endOffset >= Math.max(0, bytes.length - 65557)) {
    if (view.getUint32(endOffset, true) === 0x06054b50) break;
    endOffset -= 1;
  }
  if (endOffset < 0) throw new Error("الملف ليس ملف XLSX صالحًا");

  const entryCount = view.getUint16(endOffset + 10, true);
  let cursor = view.getUint32(endOffset + 16, true);
  const entries = new Map<string, ZipEntry>();

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) {
      throw new Error("تعذر قراءة محتويات ملف Excel");
    }
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);
    const fileName = textDecoder.decode(bytes.subarray(cursor + 46, cursor + 46 + fileNameLength));
    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    entries.set(fileName, {
      method,
      compressedSize,
      dataOffset: localHeaderOffset + 30 + localNameLength + localExtraLength,
    });
    cursor += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

async function readZipText(bytes: Uint8Array, entries: Map<string, ZipEntry>, path: string) {
  const entry = entries.get(path);
  if (!entry) return "";
  const compressed = bytes.slice(entry.dataOffset, entry.dataOffset + entry.compressedSize);
  if (entry.method === 0) return textDecoder.decode(compressed);
  if (entry.method !== 8) throw new Error(`نوع ضغط غير مدعوم داخل ملف Excel: ${entry.method}`);
  const stream = new Blob([compressed.buffer as ArrayBuffer])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return textDecoder.decode(await new Response(stream).arrayBuffer());
}

function parseSharedStrings(xml: string) {
  const values: string[] = [];
  for (const match of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    const text = [...match[1]!.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((part) => decodeXml(part[1] ?? ""))
      .join("");
    values.push(text);
  }
  return values;
}

function parseWorksheet(xml: string, sharedStrings: string[]) {
  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(rowMatch[1]!.match(/\br="(\d+)"/)?.[1] ?? rows.length + 1);
    const row: string[] = [];
    for (const cellMatch of rowMatch[2]!.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1] ?? "";
      const contents = cellMatch[2] ?? "";
      const reference = attributes.match(/\br="([^"]+)"/)?.[1] ?? "A1";
      const type = attributes.match(/\bt="([^"]+)"/)?.[1] ?? "";
      const rawValue =
        contents.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] ??
        [...contents.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((part) => part[1] ?? "").join("");
      let value = decodeXml(rawValue);
      if (type === "s") value = sharedStrings[Number(rawValue)] ?? "";
      if (type === "b") value = rawValue === "1" ? "TRUE" : "FALSE";
      row[columnIndex(reference)] = value.trim();
    }
    rows[rowNumber - 1] = row;
  }
  return rows;
}

function parseBoolean(value: string) {
  const normalized = normalize(value);
  if (["true", "1", "yes", "y", "نعم", "صح"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "لا", "خطا", "خطأ"].includes(normalized)) return false;
  return null;
}

function parseDate(value: string) {
  const clean = value.trim();
  if (!clean) return null;
  if (/^\d+(\.\d+)?$/.test(clean)) {
    const serial = Number(clean);
    if (serial >= 1 && serial <= 150000) {
      return new Date(Math.round((serial - 25569) * 86400000)).toISOString().slice(0, 10);
    }
  }
  let match = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  let year: number;
  let month: number;
  let day: number;
  if (match) {
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    match = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (!match) return null;
    month = Number(match[1]);
    day = Number(match[2]);
    year = Number(match[3]);
    if (month > 12 && day <= 12) [month, day] = [day, month];
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function valueSet(values: string[]) {
  return new Set(values.filter(Boolean).map(normalize));
}

function paymentMethod(value: string) {
  const normalized = normalize(value);
  if (["a", "cash", "نقدي"].includes(normalized)) return "نقدي";
  if (["b", "bank", "تحويل بنكي", "تحويل"].includes(normalized)) return "تحويل بنكي";
  if (["c", "check", "cheque", "شيك"].includes(normalized)) return "شيك";
  return null;
}

function genderValue(value: string) {
  const normalized = normalize(value);
  if (["ذكر", "male", "m"].includes(normalized)) return "ذكر";
  if (["انثي", "انثى", "female", "f"].includes(normalized)) return "أنثى";
  return null;
}

function addError(
  errors: EmployeeImportError[],
  row: number,
  columnIndexValue: number,
  value: string,
  message: string,
) {
  const spec = EMPLOYEE_EXCEL_COLUMNS[columnIndexValue];
  errors.push({
    row,
    column: `${columnLetter(columnIndexValue)} - ${spec?.label ?? "غير معروف"}`,
    key: spec?.key ?? "",
    value,
    message,
  });
}

export async function parseEmployeeImportFile(
  file: File,
  references: EmployeeImportReferences,
): Promise<EmployeeImportResult> {
  if (!file.name.toLocaleLowerCase().endsWith(".xlsx")) {
    throw new Error("الصيغة المدعومة لهذا النموذج هي XLSX فقط");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("حجم الملف يتجاوز 10 ميجابايت");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = unzipDirectory(bytes);
  const sharedXml = await readZipText(bytes, entries, "xl/sharedStrings.xml");
  const sheetXml = await readZipText(bytes, entries, "xl/worksheets/sheet1.xml");
  if (!sheetXml) throw new Error("لم يتم العثور على ورقة البيانات الأولى داخل الملف");
  const matrix = parseWorksheet(sheetXml, parseSharedStrings(sharedXml));
  const errors: EmployeeImportError[] = [];

  EMPLOYEE_EXCEL_COLUMNS.forEach((column, index) => {
    const keyValue = matrix[0]?.[index]?.trim() ?? "";
    const labelValue = matrix[1]?.[index]?.trim() ?? "";
    if (keyValue !== column.key) {
      addError(errors, 1, index, keyValue, `العنوان التقني يجب أن يكون: ${column.key}`);
    }
    if (normalize(labelValue) !== normalize(column.label)) {
      addError(errors, 2, index, labelValue, `العنوان العربي يجب أن يكون: ${column.label}`);
    }
  });

  const departments = valueSet(references.departments);
  const branches = valueSet(references.branches);
  const jobCategories = valueSet(references.jobCategories);
  const jobTitles = valueSet(references.jobTitles);
  const jobLevels = valueSet(references.jobLevels);
  const nationalities = valueSet(references.nationalities);
  const religions = valueSet(references.religions);
  const socialStatuses = valueSet(references.socialStatuses);
  const existingEmployeeNumbers = valueSet(references.existingEmployeeNumbers);
  const existingNationalIds = valueSet(references.existingNationalIds);
  const existingFingerprintIds = valueSet(references.existingFingerprintIds);
  const seenEmployeeNumbers = new Map<string, number>();
  const seenNationalIds = new Map<string, number>();
  const seenFingerprintIds = new Map<string, number>();

  const records: EmployeeImportRecord[] = [];
  for (let matrixIndex = 2; matrixIndex < matrix.length; matrixIndex += 1) {
    const cells = matrix[matrixIndex] ?? [];
    if (!cells.some((value) => String(value ?? "").trim())) continue;
    const rowNumber = matrixIndex + 1;
    const raw = Object.fromEntries(
      EMPLOYEE_EXCEL_COLUMNS.map((column, index) => [
        column.key,
        String(cells[index] ?? "").trim(),
      ]),
    ) as Record<ColumnKey, string>;

    EMPLOYEE_EXCEL_COLUMNS.forEach((column, index) => {
      if (column.required && !raw[column.key]) {
        addError(errors, rowNumber, index, "", "هذا الحقل مطلوب");
      }
    });

    const birthDate = parseDate(raw.DateOfBirth);
    const startDate = parseDate(raw.StartDate);
    const employmentDate = parseDate(raw.EmploymentDate);
    const placementDate = parseDate(raw.PlacementDate);
    (
      [
        ["DateOfBirth", birthDate],
        ["StartDate", startDate],
        ["EmploymentDate", employmentDate],
        ["PlacementDate", placementDate],
      ] as [ColumnKey, string | null][]
    ).forEach(([key, parsed]) => {
      const index = EMPLOYEE_EXCEL_COLUMNS.findIndex((column) => column.key === key);
      if (raw[key] && !parsed)
        addError(errors, rowNumber, index, raw[key], "صيغة التاريخ غير صحيحة");
    });
    if (birthDate && birthDate > new Date().toISOString().slice(0, 10)) {
      addError(errors, rowNumber, 2, raw.DateOfBirth, "تاريخ الميلاد لا يمكن أن يكون في المستقبل");
    }
    if (birthDate && employmentDate && employmentDate <= birthDate) {
      addError(errors, rowNumber, 24, raw.EmploymentDate, "تاريخ التعيين يجب أن يلي تاريخ الميلاد");
    }
    if (employmentDate && startDate && startDate < employmentDate) {
      addError(errors, rowNumber, 7, raw.StartDate, "تاريخ المباشرة لا يمكن أن يسبق تاريخ التعيين");
    }

    const booleanKeys: ColumnKey[] = [
      "IsActive",
      "IsHumanResources",
      "IsExcluded",
      "ShowInFingerReports",
      "OnTheJob",
      "IsStoped",
    ];
    const booleans = Object.fromEntries(
      booleanKeys.map((key) => [key, raw[key] ? parseBoolean(raw[key]) : false]),
    ) as Record<ColumnKey, boolean | null>;
    booleanKeys.forEach((key) => {
      if (raw[key] && booleans[key] === null) {
        const index = EMPLOYEE_EXCEL_COLUMNS.findIndex((column) => column.key === key);
        addError(errors, rowNumber, index, raw[key], "استخدم TRUE أو FALSE فقط");
      }
    });

    const gender = genderValue(raw.GenderName);
    if (raw.GenderName && !gender) {
      addError(errors, rowNumber, 5, raw.GenderName, "القيمة المسموحة: ذكر أو أنثى");
    }
    const payment = paymentMethod(raw.CashType);
    if (raw.CashType && !payment) {
      addError(
        errors,
        rowNumber,
        21,
        raw.CashType,
        "القيم المسموحة: A/نقدي أو B/تحويل بنكي أو C/شيك",
      );
    }
    if (raw.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.Email)) {
      addError(errors, rowNumber, 20, raw.Email, "صيغة البريد الإلكتروني غير صحيحة");
    }
    if (raw.Mobile && !/^\+?[0-9\s-]{5,20}$/.test(raw.Mobile)) {
      addError(errors, rowNumber, 19, raw.Mobile, "رقم الجوال يجب أن يحتوي على أرقام فقط");
    }
    if (raw.IDNumber && !/^[0-9]{1,20}$/.test(raw.IDNumber)) {
      addError(errors, rowNumber, 6, raw.IDNumber, "رقم الهوية يجب أن يحتوي على أرقام فقط");
    }

    const lookupChecks: [ColumnKey, Set<string>, string][] = [
      ["SectionName", departments, "القسم غير موجود في بيانات النظام"],
      ["BranchName", branches, "الفرع غير موجود في بيانات النظام"],
      ["JobName", jobCategories, "الفئة الوظيفية غير موجودة في التهيئة"],
      ["SpecializationName", jobTitles, "الوظيفة الحالية غير موجودة في التهيئة"],
      ["JobLevelName", jobLevels, "المستوى الوظيفي غير موجود في التهيئة"],
      ["NationalityName", nationalities, "الجنسية غير موجودة في التهيئة"],
      ["ReligionName", religions, "الديانة غير موجودة في التهيئة"],
      ["MaritalStatusName", socialStatuses, "الحالة الاجتماعية غير موجودة في التهيئة"],
    ];
    lookupChecks.forEach(([key, allowed, message]) => {
      if (raw[key] && allowed.size > 0 && !allowed.has(normalize(raw[key]))) {
        const index = EMPLOYEE_EXCEL_COLUMNS.findIndex((column) => column.key === key);
        addError(errors, rowNumber, index, raw[key], message);
      }
    });

    const uniqueChecks: [ColumnKey, Set<string>, Map<string, number>, string][] = [
      ["empFileNum", existingEmployeeNumbers, seenEmployeeNumbers, "الرقم الوظيفي مستخدم بالفعل"],
      ["IDNumber", existingNationalIds, seenNationalIds, "رقم الهوية مستخدم بالفعل"],
      ["FingerprintID", existingFingerprintIds, seenFingerprintIds, "رقم البصمة مستخدم بالفعل"],
    ];
    uniqueChecks.forEach(([key, existing, seen, databaseMessage]) => {
      if (!raw[key]) return;
      const normalizedValue = normalize(raw[key]);
      const index = EMPLOYEE_EXCEL_COLUMNS.findIndex((column) => column.key === key);
      if (existing.has(normalizedValue)) {
        addError(errors, rowNumber, index, raw[key], databaseMessage);
      }
      const firstRow = seen.get(normalizedValue);
      if (firstRow) {
        addError(
          errors,
          rowNumber,
          index,
          raw[key],
          `قيمة مكررة داخل الملف (أول ظهور في الصف ${firstRow})`,
        );
      } else {
        seen.set(normalizedValue, rowNumber);
      }
    });

    const isStopped = booleans.IsStoped === true;
    const isActive = booleans.IsActive !== false;
    const onTheJob = booleans.OnTheJob !== false;
    const payload: EmployeeImportRecord["payload"] = {
      emp_no: raw.empFileNum,
      full_name: raw.EmployeeName,
      birth_date: birthDate,
      department: raw.SectionName || null,
      branch: raw.BranchName || null,
      gender: gender,
      national_id: raw.IDNumber || null,
      start_date: startDate,
      employment_category: raw.JobName || null,
      is_human_resources: booleans.IsHumanResources === true,
      fingerprint_deduction_exempt: booleans.IsExcluded === true,
      show_in_fingerprint_reports: booleans.ShowInFingerReports !== false,
      on_duty: onTheJob,
      nationality: raw.NationalityName || null,
      religion: raw.ReligionName || null,
      social_status: raw.MaritalStatusName || null,
      birth_place: raw.PlaceOfBirth || null,
      job_title: raw.SpecializationName || null,
      phone: raw.Mobile || null,
      email: raw.Email || null,
      payment_method: payment,
      fingerprint_no: raw.FingerprintID || null,
      status: isStopped || !isActive || !onTheJob ? "موقوف" : "نشط",
      hire_date: employmentDate,
      job_level: raw.JobLevelName || null,
      sponsor_name: raw.SponsorName || null,
      labor_office_no: raw.WorkOfficeNumber || null,
      annual_leave_calc_date: placementDate,
      short_address: raw.ShortAddress || null,
      street: raw.Street || null,
      city: raw.City || null,
      region: raw.Region || null,
      address_region: raw.Region || null,
      unit_no: raw.UnitNumber || null,
      address_notes: raw.AddressNotes || null,
    };
    records.push({ rowNumber, raw, payload });
  }

  if (records.length === 0) {
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
  return {
    records,
    validRecords: hasHeaderErrors
      ? []
      : records.filter((record) => !invalidRows.has(record.rowNumber)),
    errors,
    totalRows: records.length,
  };
}
