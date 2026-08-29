/**
 * Facility Data (UpdateFacilityData) Excel parser.
 *
 * The template has exactly two columns:
 *   IdNumber    -> employee national ID (10 digits, starts with 1 or 2)
 *   workNumber  -> work-office/labor-office number (numeric, up to 15 digits)
 *
 * Uses the same lightweight XLSX reader pattern as `employee-excel.ts`
 * (no third-party deps).
 */

const textDecoder = new TextDecoder();

export type FacilityImportError = {
  row: number;
  column: string; // e.g. "A - IdNumber"
  key: "IdNumber" | "workNumber" | "row";
  value: string;
  message: string;
};

export type FacilityImportRow = {
  IdNumber: string;
  workNumber: string;
};

export type FacilityImportResult = {
  totalRows: number;
  validRows: FacilityImportRow[];
  errors: FacilityImportError[];
};

type ZipEntry = { method: number; compressedSize: number; dataOffset: number };

function decodeXml(v: string) {
  return v
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function columnIndex(reference: string) {
  const letters = reference.replace(/\d/g, "");
  let index = 0;
  for (const ch of letters) {
    index = index * 26 + (ch.charCodeAt(0) - 64);
  }
  return index - 1;
}

function unzipDirectory(bytes: Uint8Array): Map<string, ZipEntry> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // find End Of Central Directory
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("ملف Excel غير صالح");
  const cdCount = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);
  let cursor = cdOffset;
  const entries = new Map<string, ZipEntry>();
  for (let i = 0; i < cdCount; i++) {
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
      row[columnIndex(reference)] = String(value).trim();
    }
    rows[rowNumber - 1] = row;
  }
  return rows;
}

/* ============================== validators =============================== */

function validateIdNumber(v: string): string | null {
  if (!v) return "رقم الهوية مطلوب";
  if (!/^\d+$/.test(v)) return "رقم الهوية يجب أن يحتوي على أرقام فقط";
  if (v.length !== 10) return "رقم الهوية يجب أن يتكون من 10 أرقام";
  if (!/^[12]/.test(v)) return "رقم الهوية يجب أن يبدأ برقم 1 أو 2";
  return null;
}

function validateWorkNumber(v: string): string | null {
  if (!v) return "رقم مكتب العمل مطلوب";
  if (!/^\d+$/.test(v)) return "رقم مكتب العمل يجب أن يحتوي على أرقام فقط";
  if (v.length > 15) return "رقم مكتب العمل طويل جداً (بحد أقصى 15 رقم)";
  return null;
}

export async function parseFacilityImportFile(file: File): Promise<FacilityImportResult> {
  const lower = file.name.toLocaleLowerCase();
  if (!lower.endsWith(".xlsx")) {
    throw new Error(
      "الصيغة المدعومة هي XLSX فقط. يرجى تحويل الملف من صيغة .xls إلى .xlsx قبل الرفع أو استخدام النموذج المرفق.",
    );
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("حجم الملف يتجاوز 10 ميجابايت");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = unzipDirectory(bytes);
  const sharedXml = await readZipText(bytes, entries, "xl/sharedStrings.xml");
  const sheetXml =
    (await readZipText(bytes, entries, "xl/worksheets/sheet1.xml")) ||
    (await readZipText(bytes, entries, "xl/worksheets/Sheet1.xml"));
  if (!sheetXml) throw new Error("لم يتم العثور على ورقة البيانات الأولى داخل الملف");

  const matrix = parseWorksheet(sheetXml, parseSharedStrings(sharedXml));
  const errors: FacilityImportError[] = [];
  const validRows: FacilityImportRow[] = [];

  // Header validation
  const headerRow = matrix[0] ?? [];
  const hA = (headerRow[0] ?? "").trim();
  const hB = (headerRow[1] ?? "").trim();
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
  if (norm(hA) !== "idnumber") {
    errors.push({
      row: 1,
      column: "A",
      key: "IdNumber",
      value: hA,
      message: `عنوان العمود A يجب أن يكون IdNumber (وُجد: ${hA || "فارغ"})`,
    });
  }
  if (norm(hB) !== "worknumber") {
    errors.push({
      row: 1,
      column: "B",
      key: "workNumber",
      value: hB,
      message: `عنوان العمود B يجب أن يكون workNumber (وُجد: ${hB || "فارغ"})`,
    });
  }

  const seenIds = new Map<string, number>();
  let totalDataRows = 0;

  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i];
    if (!row) continue;
    const idNumber = (row[0] ?? "").trim();
    const workNumber = (row[1] ?? "").trim();
    if (!idNumber && !workNumber) continue; // skip fully empty rows

    totalDataRows++;
    const rowNo = i + 1;
    let rowHasError = false;

    const idErr = validateIdNumber(idNumber);
    if (idErr) {
      errors.push({
        row: rowNo,
        column: "A - IdNumber",
        key: "IdNumber",
        value: idNumber,
        message: idErr,
      });
      rowHasError = true;
    }

    const wnErr = validateWorkNumber(workNumber);
    if (wnErr) {
      errors.push({
        row: rowNo,
        column: "B - workNumber",
        key: "workNumber",
        value: workNumber,
        message: wnErr,
      });
      rowHasError = true;
    }

    // duplicate ID check
    if (!idErr) {
      const prev = seenIds.get(idNumber);
      if (prev !== undefined) {
        errors.push({
          row: rowNo,
          column: "A - IdNumber",
          key: "IdNumber",
          value: idNumber,
          message: `رقم الهوية مكرر (سبق ذكره في الصف ${prev})`,
        });
        rowHasError = true;
      } else {
        seenIds.set(idNumber, rowNo);
      }
    }

    if (!rowHasError) {
      validRows.push({ IdNumber: idNumber, workNumber: workNumber });
    }
  }

  return {
    totalRows: totalDataRows,
    validRows,
    errors,
  };
}
