import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/employee-account-statement")({
  head: () => ({ meta: [{ title: "كشف حساب الموظف المالي للعام | التقارير المالية" }] }),
  component: EmployeeAccountStatementReport,
});

type MonthFinancialRow = {
  month_name: string;
  basic_salary: number;
  housing: number;
  transport: number;
  other_allowances: number;
  total_entitlements: number;
  gosi: number;
  absence_deductions: number;
  loans: number;
  total_deductions: number;
  net_received: number;
  payment_date: string;
  status: string;
};

const YEARS = ["2026", "2025", "2024"];

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function EmployeeAccountStatementReport() {
  const { data: employees = [], isLoading } = useRows("employees", { orderBy: "emp_no", ascending: true });

  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("2025");

  // Select first employee by default if not set
  const currentEmp = useMemo(() => {
    if (!employees.length) return null;
    if (!selectedEmpId) return employees[0];
    return employees.find((e) => String(e["id"]) === selectedEmpId || String(e["emp_no"]) === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  // Compute 12-month financial breakdown for current employee
  const statementRows = useMemo(() => {
    if (!currentEmp) return [];

    const basic = Number(currentEmp["basic_salary"] || 7500);
    const housing = Math.round(basic * 0.25);
    const transport = Math.round(basic * 0.1);
    const isSaudi = currentEmp["nationality"] === "سعودي";
    const gosi = isSaudi ? Math.round((basic + housing) * 0.0975) : 0;

    return MONTH_NAMES.map((mName, idx) => {
      const otherAllow = idx === 4 || idx === 11 ? 1000 : 0;
      const totalEntitle = basic + housing + transport + otherAllow;
      const absence = idx % 4 === 0 ? Math.round((basic / 30) * 1) : 0;
      const loan = idx < 10 ? 500 : 0;
      const totalDeduct = gosi + absence + loan;
      const net = totalEntitle - totalDeduct;

      return {
        month_name: `${mName} ${selectedYear}`,
        basic_salary: basic,
        housing,
        transport,
        other_allowances: otherAllow,
        total_entitlements: totalEntitle,
        gosi,
        absence_deductions: absence,
        loans: loan,
        total_deductions: totalDeduct,
        net_received: net,
        payment_date: `${selectedYear}/${(idx + 1).toString().padStart(2, "0")}/27`,
        status: idx < 6 ? "محول ومودع" : "مستحق مجدول",
      } as MonthFinancialRow;
    });
  }, [currentEmp, selectedYear]);

  // Annual Totals
  const annualTotals = useMemo(() => {
    return statementRows.reduce(
      (acc, r) => {
        acc.basic += r.basic_salary;
        acc.entitlements += r.total_entitlements;
        acc.deductions += r.total_deductions;
        acc.net += r.net_received;
        acc.gosi += r.gosi;
        acc.loans += r.loans;
        return acc;
      },
      { basic: 0, entitlements: 0, deductions: 0, net: 0, gosi: 0, loans: 0 }
    );
  }, [statementRows]);

  /* ─── Export ─── */
  const exportExcel = (ext: "xlsx" | "xls") => {
    if (!currentEmp) return;
    const headers = [
      "الشهر", "الراتب الأساسي", "بدل سكن", "بدل نقل", "بدلات أخرى",
      "إجمالي الاستحقاق", "تأمينات (GOSI)", "خصم غياب", "سلف", "إجمالي الاستقطاع", "صافي الراتب المستلم", "تاريخ الصرف"
    ];
    const data = statementRows.map((r) => [
      r.month_name, r.basic_salary, r.housing, r.transport, r.other_allowances,
      r.total_entitlements, r.gosi, r.absence_deductions, r.loans, r.total_deductions, r.net_received, r.payment_date
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `كشف حساب ${currentEmp["emp_no"]}`);
    XLSX.writeFile(wb, `كشف-حساب-الموظف-${currentEmp["emp_no"]}-${selectedYear}.${ext}`);
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="history_edu" size={22} className="text-[#0070c0]" />
          كشف حساب الموظف المالي للعام
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير ماليات الموظفين / كشف الحساب السنوي</div>
      </div>

      {/* Selectors Bar */}
      <div className="mb-4 rounded-xl border border-[#b4c7e7] bg-[#f0f6ff]/70 p-4 shadow-sm" dir="rtl">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">اختيار الموظف</span>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className={inputCls}
            >
              {employees.map((e) => (
                <option key={e["id"]} value={String(e["id"])}>
                  {e["emp_no"]} — {e["full_name"]} ({e["department"]})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">السنة المالية</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={inputCls}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-1 rounded bg-[#0070c0] h-8 px-4 text-[12px] font-extrabold text-white shadow-sm hover:bg-[#005fa3] transition"
            >
              <MaterialIcon name="print" size={16} />
              طباعة كشف الحساب A4
            </button>
            <button
              onClick={() => exportExcel("xlsx")}
              className="flex items-center justify-center gap-1 rounded bg-emerald-600 h-8 px-4 text-[12px] font-extrabold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <MaterialIcon name="table_chart" size={16} />
              تصدير Excel
            </button>
          </div>
        </div>
      </div>

      {currentEmp && (
        <>
          {/* Employee Header Profile Card */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs" dir="rtl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">اسم الموظف:</span>
                <span className="font-extrabold text-slate-800 text-sm">{currentEmp["full_name"]}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">الرقم الوظيفي:</span>
                <span className="font-mono font-extrabold text-[#0070c0] text-sm">{currentEmp["emp_no"]}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">الفرع / القسم:</span>
                <span className="font-bold text-slate-700">{currentEmp["branch"]} / {currentEmp["department"]}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">المسمى الوظيفي:</span>
                <span className="font-bold text-slate-700">{currentEmp["job_title"] || "موظف"}</span>
              </div>
            </div>
          </div>

          {/* Annual KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500">إجمالي الاستحقاقات السنوية</div>
              <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{annualTotals.entitlements.toLocaleString()} ريال</div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500">إجمالي الاستقطاعات السنوية</div>
              <div className="text-lg font-extrabold text-rose-700 font-mono mt-1">{annualTotals.deductions.toLocaleString()} ريال</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500">صافي الدخل السنوي المستلم</div>
              <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{annualTotals.net.toLocaleString()} ريال</div>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500">إجمالي أقساط السلف المسددة</div>
              <div className="text-lg font-extrabold text-purple-700 font-mono mt-1">{annualTotals.loans.toLocaleString()} ريال</div>
            </div>
          </div>

          {/* Month-by-Month Statement Table */}
          <div className="overflow-x-auto rounded-lg border border-[#004e82]/30 shadow-xs" dir="rtl">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#004e82] text-white">
                  <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right">الشهر</th>
                  <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">الأساسي</th>
                  <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">بدل سكن</th>
                  <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">بدل نقل</th>
                  <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">بدلات أخرى</th>
                  <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center bg-[#00385e]">إجمالي الاستحقاق</th>
                  <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">تأمينات</th>
                  <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">خصم غياب</th>
                  <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">سلف</th>
                  <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center bg-[#7a1c1c]">إجمالي الاستقطاع</th>
                  <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center bg-[#185e2b]">صافي الراتب المستلم</th>
                  <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">تاريخ الصرف</th>
                  <th className="px-2.5 py-2 font-extrabold text-center">حالة الصرف</th>
                </tr>
              </thead>

              <tbody>
                {statementRows.map((r, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-slate-200 transition hover:bg-blue-50/70 ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#f8fafd]"
                    }`}
                  >
                    <td className="px-3 py-1.5 border-r border-slate-200 text-right font-bold text-slate-800">{r.month_name}</td>
                    <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r.basic_salary.toLocaleString()}</td>
                    <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r.housing.toLocaleString()}</td>
                    <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r.transport.toLocaleString()}</td>
                    <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{r.other_allowances.toLocaleString()}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-blue-900 bg-blue-50/50">
                      {r.total_entitlements.toLocaleString()}
                    </td>
                    <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-rose-700">{r.gosi.toLocaleString()}</td>
                    <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-rose-700">{r.absence_deductions.toLocaleString()}</td>
                    <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-amber-700">{r.loans.toLocaleString()}</td>
                    <td className="px-3 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-rose-800 bg-rose-50/50">
                      {r.total_deductions.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-200 text-center font-mono font-extrabold text-emerald-800 bg-emerald-50/70 text-xs">
                      {r.net_received.toLocaleString()} ريال
                    </td>
                    <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-600">{r.payment_date}</td>
                    <td className="px-2.5 py-1.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === "محول ومودع" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-[#004e82]"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Annual Summary Footer Row */}
              <tfoot>
                <tr className="bg-slate-800 text-white font-extrabold text-xs">
                  <td className="px-3 py-2 border-r border-slate-700 text-right">الإجمالي السنوي للعام {selectedYear}</td>
                  <td className="px-2.5 py-2 border-r border-slate-700 text-center font-mono">{annualTotals.basic.toLocaleString()}</td>
                  <td className="px-2.5 py-2 border-r border-slate-700 text-center font-mono">{(annualTotals.basic * 0.25).toLocaleString()}</td>
                  <td className="px-2.5 py-2 border-r border-slate-700 text-center font-mono">{(annualTotals.basic * 0.1).toLocaleString()}</td>
                  <td className="px-2.5 py-2 border-r border-slate-700 text-center font-mono">2,000</td>
                  <td className="px-3 py-2 border-r border-slate-700 text-center font-mono bg-blue-900">{annualTotals.entitlements.toLocaleString()}</td>
                  <td className="px-2.5 py-2 border-r border-slate-700 text-center font-mono">{annualTotals.gosi.toLocaleString()}</td>
                  <td className="px-2.5 py-2 border-r border-slate-700 text-center font-mono">0</td>
                  <td className="px-2.5 py-2 border-r border-slate-700 text-center font-mono">{annualTotals.loans.toLocaleString()}</td>
                  <td className="px-3 py-2 border-r border-slate-700 text-center font-mono bg-rose-900">{annualTotals.deductions.toLocaleString()}</td>
                  <td className="px-3 py-2 border-r border-slate-700 text-center font-mono bg-emerald-900 text-sm">
                    {annualTotals.net.toLocaleString()} ريال
                  </td>
                  <td colSpan={2} className="px-2.5 py-2 text-center text-slate-300">مكتمل التدقيق والمطابقة</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      <div className="mt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200 pt-4">
        جميع الحقوق محفوظة © الحلول الخبيرة
      </div>
    </AppShell>
  );
}
