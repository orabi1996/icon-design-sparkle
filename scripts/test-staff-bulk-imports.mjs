import assert from "node:assert/strict";
import { File } from "node:buffer";
import { createServer } from "vite";

const TEST_EMPLOYEE = Object.freeze({
  id: "00000000-0000-0000-0000-000000000001",
  empNo: "TEST-EMP-001",
  nationalId: "1000000000",
  name: "موظف اختبار آلي",
});
const TEST_WORK_NUMBER = "900001";
const TEST_BASIC_SALARY = "1.00";
const TEST_BANK_ACCOUNT = "TESTACCOUNT0001";
const definitions = [
  ["facility", "تحديث بيانات المنشأة.xls", {}],
  ["salaries", "تحديث بيانات رواتب الموظفين.xls", {}],
  ["documents", "تحديث مستندات الموظفين.xlsx", { documentType: "الإقامة" }],
  [
    "entitlement",
    "اضافة استحقاق.xlsx",
    {
      year: 2026,
      month: 8,
      definitionId: "10000000-0000-0000-0000-000000000001",
      definitionName: "بدل سكن",
    },
  ],
  [
    "deduction",
    "اضافة استقطاع.xlsx",
    {
      year: 2026,
      month: 8,
      definitionId: "20000000-0000-0000-0000-000000000001",
      definitionName: "خصم خاص",
    },
  ],
  ["bank", "إضافة الحساب البنكي.xlsx", {}],
];

const server = await createServer({
  root: process.cwd(),
  appType: "custom",
  server: { middlewareMode: true },
});

try {
  const excel = await server.ssrLoadModule("/src/lib/staff-bulk-excel.ts");
  const templates = await server.ssrLoadModule("/src/lib/staff-bulk-templates.ts");
  const references = { employees: [TEST_EMPLOYEE] };

  const validMatrices = {
    facility: [
      ["IdNumber", "workNumber"],
      [TEST_EMPLOYEE.nationalId, TEST_WORK_NUMBER],
    ],
    salaries: [
      ["الرقم_الوظيفى", "رقم_الهوية", "اسم_الموظف", "الحالة", "الراتب_الاساسى", "رقم_مكتب_العمل"],
      [
        TEST_EMPLOYEE.empNo,
        TEST_EMPLOYEE.nationalId,
        TEST_EMPLOYEE.name,
        "نشط",
        TEST_BASIC_SALARY,
        TEST_WORK_NUMBER,
      ],
    ],
    documents: [
      ["اسم_الموظف", "رقم_الهوية", "رقم_المستند", "التاريخ_الحالى", "التاريخ_التجديد"],
      [TEST_EMPLOYEE.name, TEST_EMPLOYEE.nationalId, "TEST-DOC-1", "2026/08/01", "2027/08/01"],
    ],
    entitlement: [
      ["EmpFileNum", "Vlaue"],
      [TEST_EMPLOYEE.empNo, "1"],
    ],
    deduction: [
      ["EmpFileNum", "Vlaue", "Notes"],
      [TEST_EMPLOYEE.empNo, "1", "بيانات اختبار آلي"],
    ],
    bank: [
      ["الرقم_الوظيفي", "رمز_البنك", "رقم_الحساب_البنكي", "حالة_الحساب_البنكي", "طريقة_القبض"],
      [TEST_EMPLOYEE.empNo, "TESTBANK", TEST_BANK_ACCOUNT, "فعال", "تحويل بنكي"],
    ],
  };

  for (const [kind, , context] of definitions) {
    const result = excel.parseStaffBulkMatrix(kind, validMatrices[kind], references, context);
    assert.equal(result.errors.length, 0, `${kind} should accept its valid matrix`);
    assert.equal(result.validRecords.length, 1, `${kind} should produce one payload`);
    assert.equal(result.validRecords[0].payload.source_row, 2);
  }

  const invalidSalary = excel.parseStaffBulkMatrix(
    "salaries",
    [validMatrices.salaries[0], [TEST_EMPLOYEE.empNo, "12", "اسم خاطئ", "", "12A", "XYZ"]],
    references,
  );
  assert.equal(invalidSalary.validRecords.length, 0);
  for (const cell of ["B2", "C2", "E2", "F2"]) {
    assert.ok(
      invalidSalary.errors.some((error) => error.cell === cell),
      `missing ${cell}`,
    );
  }

  const templateResults = {};
  for (const [kind, filename, context] of definitions) {
    const bytes = templates.createStaffBulkTemplateBytes(kind);
    const file = new File([bytes], filename);
    const parsed = await excel.parseStaffBulkFile(kind, file, { employees: [] }, context);
    assert.ok(
      !parsed.errors.some((error) => error.row === 1),
      `${kind} headers must match exactly`,
    );
    assert.equal(parsed.totalRows, 0, `${kind} template must not include employee data`);
    assert.equal(parsed.errors.length, 1, `${kind} empty template should only request a data row`);
    assert.equal(parsed.errors[0].cell, "A2");
    templateResults[kind] = { rows: parsed.totalRows, errors: parsed.errors.length };
  }

  console.log(JSON.stringify({ validKinds: Object.keys(validMatrices), templateResults }));
} finally {
  await server.close();
}
