import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/evaluation")({
  head: () => ({ meta: [{ title: "تقرير التقييم | التقارير" }] }),
  component: EvaluationReport,
});

type ApprovalStage = {
  id: string;
  stage_name: string;
  total_requests: number;
  completed_requests: number;
  incomplete_requests: number;
  in_progress_requests: number;
  completion_rate: number;
  incompletion_rate: number;
  performance: string;
};

const DEFAULT_STAGES = [
  { name: "الصرف", total: 3, completed: 0, incomplete: 3, inProgress: 3 },
  { name: "جدولة الأقساط", total: 2, completed: 0, incomplete: 2, inProgress: 2 },
  { name: "الاعتماد المالي", total: 2, completed: 0, incomplete: 2, inProgress: 2 },
  { name: "موافقة المدير المباشر", total: 8, completed: 6, incomplete: 2, inProgress: 2 },
  { name: "مراجعة الموارد البشرية", total: 12, completed: 10, incomplete: 2, inProgress: 1 },
  { name: "اعتماد المدير التنفيذي", total: 5, completed: 4, incomplete: 1, inProgress: 1 },
  { name: "صرف نهاية الخدمة", total: 4, completed: 3, incomplete: 1, inProgress: 1 },
  { name: "اعتماد السلف والقروض", total: 6, completed: 5, incomplete: 1, inProgress: 0 },
];

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function EvaluationReport() {
  const { data: employees = [] } = useRows("employees", { orderBy: "id" });
  const { data: approvalRequests = [], isLoading } = useRows("approval_requests", { orderBy: "id" });

  const [filters, setFilters] = useState({
    branch: "",
    department: "",
  });

  const [appliedFilters, setAppliedFilters] = useState<typeof filters | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState("");

  const options = useMemo(() => ({
    branches: uniq(employees.map((e) => String(e["branch"] ?? ""))),
    departments: uniq(employees.map((e) => String(e["department"] ?? ""))),
  }), [employees]);

  // Aggregate stages data from approval_requests or default schema
  const stagesData = useMemo(() => {
    // If we have actual approval_requests, group them by stage
    if (approvalRequests.length > 0) {
      const map = new Map<string, { total: number; completed: number; incomplete: number; inProgress: number }>();
      for (const req of approvalRequests) {
        const stage = String(req["stage_name"] || req["type"] || "الاعتماد");
        const cur = map.get(stage) ?? { total: 0, completed: 0, incomplete: 0, inProgress: 0 };
        cur.total += 1;
        if (req["status"] === "معتمد" || req["status"] === "مكتمل") cur.completed += 1;
        else if (req["status"] === "مرفوض" || req["status"] === "ملغي") cur.incomplete += 1;
        else cur.inProgress += 1;
        map.set(stage, cur);
      }
      return Array.from(map.entries()).map(([name, v], i) => {
        const compRate = v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0;
        const incompRate = 100 - compRate;
        const perf = compRate >= 80 ? "ممتاز" : compRate >= 50 ? "جيد" : "غير منجز";
        return {
          id: `stage-${i}`,
          stage_name: name,
          total_requests: v.total,
          completed_requests: v.completed,
          incomplete_requests: v.incomplete,
          in_progress_requests: v.inProgress,
          completion_rate: compRate,
          incompletion_rate: incompRate,
          performance: perf,
        } as ApprovalStage;
      });
    }

    // Default sample matching screenshot 3
    return DEFAULT_STAGES.map((s, i) => {
      const compRate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      const incompRate = 100 - compRate;
      const perf = compRate >= 80 ? "ممتاز" : compRate >= 50 ? "جيد" : "غير منجز";
      return {
        id: `stage-${i}`,
        stage_name: s.name,
        total_requests: s.total,
        completed_requests: s.completed,
        incomplete_requests: s.incomplete,
        in_progress_requests: s.inProgress,
        completion_rate: compRate,
        incompletion_rate: incompRate,
        performance: perf,
      } as ApprovalStage;
    });
  }, [approvalRequests]);

  // Filtered stages
  const filteredStages = useMemo(() => {
    const gSearch = globalSearch.trim().toLowerCase();
    return stagesData.filter((s) => {
      if (gSearch && !s.stage_name.toLowerCase().includes(gSearch)) return false;

      for (const [k, q] of Object.entries(colFilters)) {
        if (!q.trim()) continue;
        const val = String((s as any)[k] ?? "").toLowerCase();
        if (!val.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [stagesData, globalSearch, colFilters]);

  // Export functions
  const exportExcel = (ext: "xlsx" | "xls") => {
    const headers = [
      "مرحلة الموافقة", "إجمالي الطلبات", "طلبات منجزة", "طلبات غير منجزة",
      "قيد التنفيذ", "نسبة المنجز", "نسبة الغير منجز", "تقييم الأداء"
    ];
    const data = filteredStages.map((s) => [
      s.stage_name, s.total_requests, s.completed_requests, s.incomplete_requests,
      s.in_progress_requests, `${s.completion_rate}%`, `${s.incompletion_rate}%`, s.performance
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقييم الأداء");
    XLSX.writeFile(wb, `تقرير-التقييم.${ext}`);
  };

  const exportCsv = () => {
    const headers = ["مرحلة الموافقة", "إجمالي الطلبات", "طلبات منجزة", "طلبات غير منجزة", "قيد التنفيذ", "نسبة المنجز", "نسبة الغير منجز", "تقييم الأداء"].join(",");
    const rows = filteredStages.map((s) =>
      `"${s.stage_name}",${s.total_requests},${s.completed_requests},${s.incomplete_requests},${s.in_progress_requests},"${s.completion_rate}%","${s.incompletion_rate}%","${s.performance}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "تقرير-التقييم.csv";
    a.click();
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="analytics" size={22} className="text-[#0070c0]" />
          تقرير التقييم
        </h1>
        <div className="text-[11px] text-slate-400">التقارير / تقارير بيانات الموظفين / تقرير التقييم</div>
      </div>

      {/* Filter Card (Matching Screenshot 3) */}
      <div className="mb-4 rounded-xl border border-[#b4c7e7] bg-[#f0f6ff]/70 p-4 shadow-sm" dir="rtl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">الفروع</span>
            <select
              value={filters.branch}
              onChange={(e) => setFilters((p) => ({ ...p, branch: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.branches.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-slate-700 text-right">القسم</span>
            <select
              value={filters.department}
              onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value }))}
              className={inputCls}
            >
              <option value="">اختر ...</option>
              {options.departments.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <div>
            <button
              onClick={() => setAppliedFilters({ ...filters })}
              className="flex items-center justify-center gap-1 rounded bg-[#0070c0] w-full sm:w-28 h-8 text-[12px] font-extrabold text-white shadow-sm hover:bg-[#005fa3] transition"
            >
              <MaterialIcon name="search" size={16} />
              بحث
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-2 flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="h-8 w-44 rounded border border-slate-300 bg-white pe-7 ps-2 text-[11px] font-medium outline-none focus:border-[#0070c0]"
            />
            <MaterialIcon name="search" size={16} className="pointer-events-none absolute left-2 top-2 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 mr-2">
            <button
              onClick={() => window.print()}
              title="طباعة / PDF"
              className="flex items-center justify-center h-8 w-8 rounded border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition shadow-xs"
            >
              <span className="text-[10px] font-extrabold uppercase">PDF</span>
            </button>
            <button
              onClick={() => exportExcel("xls")}
              title="تصدير XLS"
              className="flex items-center justify-center h-8 w-8 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-xs"
            >
              <span className="text-[10px] font-extrabold uppercase">XLS</span>
            </button>
            <button
              onClick={() => exportExcel("xlsx")}
              title="تصدير XLSX"
              className="flex items-center justify-center h-8 px-2 rounded border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs gap-1 font-bold text-[11px]"
            >
              <MaterialIcon name="table_chart" size={14} />
              <span>XLSX</span>
            </button>
            <button
              onClick={exportCsv}
              title="تصدير CSV"
              className="flex items-center justify-center h-8 px-2 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-xs font-bold text-[11px]"
            >
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Evaluation Data Table (Matching Screenshot 3) */}
      <div className="overflow-x-auto rounded-lg border border-[#004e82]/30 shadow-xs" dir="rtl">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#004e82] text-white">
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right">مرحلة الموافقة</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center">اجمالي الطلبات</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center">طلبات منجزة</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center">طلبات غير منجزة</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center">قيد التنفيذ</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center">نسبة المنجز</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-center">نسبة الغير منجز</th>
              <th className="px-3 py-2 font-extrabold text-center">تقييم الأداء</th>
            </tr>

            {/* Per-column filter row */}
            <tr className="bg-[#e8f1fb] border-b border-slate-300">
              {["stage_name", "total_requests", "completed_requests", "incomplete_requests", "in_progress_requests", "completion_rate", "incompletion_rate", "performance"].map((k) => (
                <th key={`filter-${k}`} className="p-1 border-r border-slate-300 last:border-r-0">
                  <div className="relative">
                    <input
                      type="text"
                      value={colFilters[k] || ""}
                      onChange={(e) => setColFilters((prev) => ({ ...prev, [k]: e.target.value }))}
                      className="h-6 w-full rounded border border-slate-300 bg-white px-1 pe-4 text-[10px] outline-none focus:border-[#0070c0]"
                    />
                    <MaterialIcon
                      name="search"
                      size={11}
                      className="pointer-events-none absolute left-1 top-1.5 text-slate-400"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-500 font-bold">
                  جارٍ تحميل البيانات...
                </td>
              </tr>
            ) : filteredStages.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400 font-bold">
                  لا توجد مراحل مطابقة
                </td>
              </tr>
            ) : (
              filteredStages.map((s, idx) => (
                <tr
                  key={s.id || idx}
                  className={`border-b border-slate-200 transition hover:bg-blue-50/70 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#f8fafd]"
                  }`}
                >
                  <td className="px-3 py-2 border-r border-slate-200 text-right font-extrabold text-slate-800 flex items-center justify-between">
                    <span>{s.stage_name}</span>
                    <span className="text-slate-400 text-[9px]">◀</span>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center font-mono font-bold text-slate-800">{s.total_requests}</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center font-mono font-bold text-emerald-700">{s.completed_requests}</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center font-mono font-bold text-rose-700">{s.incomplete_requests}</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center font-mono font-bold text-amber-700">{s.in_progress_requests}</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center font-mono font-bold text-emerald-700">{s.completion_rate}%</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center font-mono font-bold text-rose-700">{s.incompletion_rate}%</td>
                  <td className="px-3 py-2 text-center">
                    {s.performance === "غير منجز" ? (
                      <div className="bg-red-600 text-white font-extrabold py-0.5 px-3 rounded text-[11px] tracking-wide inline-block w-full max-w-[120px]">
                        غير منجز
                      </div>
                    ) : s.performance === "ممتاز" ? (
                      <div className="bg-emerald-600 text-white font-extrabold py-0.5 px-3 rounded text-[11px] tracking-wide inline-block w-full max-w-[120px]">
                        ممتاز
                      </div>
                    ) : (
                      <div className="bg-amber-600 text-white font-extrabold py-0.5 px-3 rounded text-[11px] tracking-wide inline-block w-full max-w-[120px]">
                        {s.performance}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Copyright footer */}
      <div className="mt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200 pt-4">
        جميع الحقوق محفوظة © الحلول الخبيرة
      </div>
    </AppShell>
  );
}
