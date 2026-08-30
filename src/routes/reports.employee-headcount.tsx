import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/employee-headcount")({
  head: () => ({ meta: [{ title: "تقرير أعداد وإحصائيات الموظفين | التقارير الإحصائية" }] }),
  component: EmployeeHeadcountReport,
});

const COLORS = ["#0070c0", "#00b050", "#ffc000", "#7030a0", "#ed7d31", "#4472c4"];

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function EmployeeHeadcountReport() {
  const { data: employees = [], isLoading } = useRows("employees", { orderBy: "emp_no", ascending: true });

  const [selectedBranch, setSelectedBranch] = useState("");

  const branches = useMemo(() => uniq(employees.map((e) => String(e["branch"] ?? ""))), [employees]);

  // Headcount by Department
  const deptStats = useMemo(() => {
    const counts: Record<string, { total: number; saudi: number; nonSaudi: number; male: number; female: number }> = {};

    employees.forEach((e) => {
      const b = String(e["branch"] ?? "");
      if (selectedBranch && b !== selectedBranch) return;

      const dept = String(e["department"] || "غير محدد");
      if (!counts[dept]) {
        counts[dept] = { total: 0, saudi: 0, nonSaudi: 0, male: 0, female: 0 };
      }
      counts[dept].total += 1;
      if (e["nationality"] === "سعودي") counts[dept].saudi += 1;
      else counts[dept].nonSaudi += 1;

      if (e["gender"] === "أنثى") counts[dept].female += 1;
      else counts[dept].male += 1;
    });

    return Object.entries(counts).map(([dept, data]) => ({
      department: dept,
      ...data,
      saudizationRate: data.total > 0 ? ((data.saudi / data.total) * 100).toFixed(1) : "0",
    }));
  }, [employees, selectedBranch]);

  // Overall KPI counts
  const overall = useMemo(() => {
    const list = selectedBranch ? employees.filter((e) => e["branch"] === selectedBranch) : employees;
    const total = list.length;
    const saudi = list.filter((e) => e["nationality"] === "سعودي").length;
    const nonSaudi = total - saudi;
    const female = list.filter((e) => e["gender"] === "أنثى").length;
    const male = total - female;
    const saudization = total > 0 ? ((saudi / total) * 100).toFixed(1) : "0";

    return { total, saudi, nonSaudi, female, male, saudization };
  }, [employees, selectedBranch]);

  // Nationality Distribution Pie Data
  const nationalityPie = useMemo(() => {
    return [
      { name: "سعودي", value: overall.saudi },
      { name: "غير سعودي (مقيم)", value: overall.nonSaudi },
    ];
  }, [overall]);

  /* ─── Export ─── */
  const exportExcel = () => {
    const headers = ["القسم", "إجمالي الموظفين", "سعودي", "غير سعودي", "ذكور", "إناث", "نسبة التوطين (%)"];
    const data = deptStats.map((d) => [
      d.department, d.total, d.saudi, d.nonSaudi, d.male, d.female, `${d.saudizationRate}%`
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "إحصائيات أعداد الموظفين");
    XLSX.writeFile(wb, "تقرير-إحصائيات-أعداد-الموظفين.xlsx");
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="groups" size={22} className="text-[#0070c0]" />
          تقرير أعداد وإحصائيات القوى العاملة والتوطين
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير إحصائية / أعداد الموظفين</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي القوى العاملة</div>
          <div className="text-2xl font-extrabold text-[#0070c0] font-mono mt-1">{overall.total} موظف</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">نسبة التوطين (السعودة)</div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">{overall.saudization}%</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">المواطنون السعوديون</div>
          <div className="text-2xl font-extrabold text-indigo-700 font-mono mt-1">{overall.saudi} موظف</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">الموظفات (الكوادر النسائية)</div>
          <div className="text-2xl font-extrabold text-purple-700 font-mono mt-1">{overall.female} موظفة</div>
        </div>
      </div>

      {/* Filter and Export Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200" dir="rtl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">تصفية حسب الفرع:</span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="h-8 rounded border border-slate-300 bg-white px-3 text-xs font-medium outline-none focus:border-[#0070c0]"
          >
            <option value="">جميع الفروع</option>
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1 rounded bg-[#0070c0] h-8 px-3 text-xs font-bold text-white shadow-xs hover:bg-[#005fa3] transition"
          >
            <MaterialIcon name="print" size={15} />
            طباعة التقرير
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center justify-center gap-1 rounded bg-emerald-600 h-8 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <MaterialIcon name="table_chart" size={15} />
            تصدير Excel
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4" dir="rtl">
        {/* Department Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <h3 className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-1.5">
            <MaterialIcon name="bar_chart" size={16} className="text-[#0070c0]" />
            توزيع أعداد الموظفين حسب الأقسام
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptStats} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", direction: "rtl" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="saudi" name="سعودي" fill="#0070c0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonSaudi" name="مقيم" fill="#00b050" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Nationality Pie Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col items-center justify-center">
          <h3 className="text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-1.5 self-start">
            <MaterialIcon name="pie_chart" size={16} className="text-[#0070c0]" />
            نسبة السعودة والتوطين
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={nationalityPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {nationalityPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", direction: "rtl" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Headcount Breakdown Table */}
      <div className="overflow-x-auto rounded-lg border border-[#004e82]/30 shadow-xs" dir="rtl">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#004e82] text-white">
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right">القسم / الإدارة</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center bg-[#00385e]">إجمالي الموظفين</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">سعودي</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">مقيم</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">ذكور</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">إناث</th>
              <th className="px-3 py-2 font-extrabold text-center bg-[#185e2b]">نسبة التوطين (%)</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500 font-bold">
                  جارٍ إعداد الإحصائيات...
                </td>
              </tr>
            ) : (
              deptStats.map((d, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-slate-200 transition hover:bg-blue-50/70 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#f8fafd]"
                  }`}
                >
                  <td className="px-3 py-2 border-r border-slate-200 text-right font-bold text-slate-800">{d.department}</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center font-mono font-extrabold text-[#0070c0] bg-blue-50/40 text-xs">
                    {d.total} موظف
                  </td>
                  <td className="px-2.5 py-2 border-r border-slate-200 text-center font-mono font-bold text-slate-700">{d.saudi}</td>
                  <td className="px-2.5 py-2 border-r border-slate-200 text-center font-mono font-bold text-slate-700">{d.nonSaudi}</td>
                  <td className="px-2.5 py-2 border-r border-slate-200 text-center font-mono text-slate-600">{d.male}</td>
                  <td className="px-2.5 py-2 border-r border-slate-200 text-center font-mono text-slate-600">{d.female}</td>
                  <td className="px-3 py-2 text-center font-mono font-extrabold text-emerald-800 bg-emerald-50/60 text-xs">
                    {d.saudizationRate}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200 pt-4">
        جميع الحقوق محفوظة © الحلول الخبيرة
      </div>
    </AppShell>
  );
}
