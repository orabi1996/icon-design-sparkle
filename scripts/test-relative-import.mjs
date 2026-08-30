import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { File } from "node:buffer";
import { createServer } from "vite";

const server = await createServer({
  root: process.cwd(),
  appType: "custom",
  server: { middlewareMode: true },
});

try {
  const { RELATIVE_EXCEL_COLUMNS, parseRelativeImportFile, parseRelativeImportMatrix } =
    await server.ssrLoadModule("/src/lib/relative-excel.ts");

  const headers = RELATIVE_EXCEL_COLUMNS.map((column) => column.key);
  const references = {
    employees: [
      {
        id: "00000000-0000-0000-0000-000000000001",
        nationalId: "1045871236",
        employeeNumber: "1001",
        name: "سعد العتيبي",
      },
    ],
    existingRelatives: [],
    nationalities: ["سعودي"],
    relationships: [],
  };

  const valid = parseRelativeImportMatrix(
    [
      headers,
      [
        "محمد سعد العتيبي",
        "Mohammed Saad Alotaibi",
        "ابن",
        "2055871236",
        "سعودي",
        "ذكر",
        "طالب",
        "2030-12-31",
        "P123456",
        "2015-05-20",
        "1045871236",
      ],
    ],
    references,
    "2026-08-29",
  );
  assert.equal(valid.errors.length, 0);
  assert.equal(valid.validRecords.length, 1);
  assert.equal(valid.validRecords[0].payload.employee_emp_no, "1001");
  assert.equal(valid.validRecords[0].payload.date_of_birth, "2015-05-20");

  const invalid = parseRelativeImportMatrix(
    [
      headers,
      ["", "", "ابن", "12", "مريخي", "غير محدد", "", "2020-01-01", "", "2030-01-01", "9999999999"],
    ],
    references,
    "2026-08-29",
  );
  assert.equal(invalid.validRecords.length, 0);
  assert.ok(invalid.errors.some((error) => error.cell === "A2" && error.key === "Name"));
  assert.ok(invalid.errors.some((error) => error.cell === "D2" && error.key === "IDNumber"));
  assert.ok(invalid.errors.some((error) => error.cell === "K2" && error.key === "EmpIDNumber"));
  assert.ok(invalid.errors.some((error) => error.cell === "J2" && error.key === "DateOfBirth"));

  const templateBytes = await readFile(
    "/workspace/scratch/1226ab375fb3/upload/بيانات المرافقين.xlsx",
  );
  const template = new File([templateBytes], "بيانات المرافقين.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  await assert.rejects(
    parseRelativeImportFile(template, references),
    /النموذج لا يحتوي على بيانات أقارب/,
  );

  console.log(
    JSON.stringify({
      validRows: valid.validRecords.length,
      invalidErrors: invalid.errors.length,
      locatedCells: [...new Set(invalid.errors.map((error) => error.cell))],
      templateHeaders: headers,
    }),
  );
} finally {
  await server.close();
}
