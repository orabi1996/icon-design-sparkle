import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/settings/branch-quotas")({
  head: () => ({ meta: [{ title: "تحديد أعداد ومستهدفات الموظفين في الفروع | إعدادات النظام" }] }),
  component: BranchQuotasPage,
});

type QuotaItem = {
  id: string;
  branch_name: string;
  max_headcount: number;
  min_headcount: number;
  actual_headcount: number;
  target_saudization: number;
  actual_saudization: number;
  max_monthly_budget: number;
  actual_monthly_cost: number;
};

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function BranchQuotasPage() {
  const { data: employees = [] } = useRows("employees");

  const [quotas, setQuotas] = useState<QuotaItem[]>([
    {
      id: "q-1",
      branch_name: "شركة الحلول الخبيرة - المقر الرئيسي",
      max_headcount: 35,
      min_headcount: 15,
      actual_headcount: 24,
      target_saudization: 50.0,
      actual_saudization: 54.2,
      max_monthly_budget: 350000,
      actual_monthly_cost: 265000,
    },
    {
      id: "q-2",
      branch_name: "شركة الحلول ٢ - فرع المنطقة الغربية (جدة)",
      max_headcount: 15,
      min_headcount: 5,
      actual_headcount: 8,
      target_saudization: 40.0,
      actual_saudization: 37.5,
      max_monthly_budget: 120000,
      actual_monthly_cost: 78000,
    },
    {
      id: "q-3",
      branch_name: "فرع المنطقة الشرقية (الدمام)",
      max_headcount: 10,
      min_headcount: 3,
      actual_headcount: 5,
      target_saudization: 40.0,
      actual_saudization: 40.0,
      max_monthly_budget: 80000,
      actual_monthly_cost: 46000,
    },
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUpdate = (id: string, field: keyof QuotaItem, value: any) => {
    setQuotas((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  /* ─── Export ─── */
  const exportExcel = () => {
    const headers = ["الفرع", "الحد الأقصى للموظفين", "الحد الأدنى", "الفعلي القائم", "التوطين المستهدف %", "التوطين الفعلي %", "سقف الموازنة الشهرية", "التكلفة الفعلية"];
    const data = quotas.map((q) => [
      q.branch_name, q.max_headcount, q.min_headcount, q.actual_headcount, `${q.target_saudization}%`, `${q.actual_saudization}%`, q.max_monthly_budget, q.actual_monthly_cost
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "مستهدفات الفروع");
    XLSX.writeFile(wb, "مستهدفات-وأعداد-موظفي-الفروع.xlsx");
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="tune" size={22} className="text-[#0070c0]" />
          تحديد أعداد ومستهدفات وسقوف الموظفين في الفروع
        </h1>
        <div className="text-[11px] text-slate-400">إعدادات النظام / إعدادات أخرى / تحديد أعداد الفروع</div>
      </div>

      {savedSuccess && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2" dir="rtl">
          <MaterialIcon name="check_circle" size={18} className="text-emerald-600" />
          تم حفظ سقوف ومستهدفات القوى العاملة بنجاح!
        </div>
      )}

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الطاقة الاستيعابية القصوى</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{quotas.reduce((s, q) => s + q.max_headcount, 0)} موظف</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي القوى العاملة الفعلية</div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{quotas.reduce((s, q) => s + q.actual_headcount, 0)} موظف</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">سقف الموازنة الشهرية الإجمالي</div>
          <div className="text-lg font-extrabold text-indigo-700 font-mono mt-1">{quotas.reduce((s, q) => s + q.max_monthly_budget, 0).toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">التكلفة الفعلية للرواتب شهرياً</div>
          <div className="text-lg font-extrabold text-purple-700 font-mono mt-1">{quotas.reduce((s, q) => s + q.actual_monthly_cost, 0).toLocaleString()} ريال</div>
        </div>
      </div>

      {/* Quotas Configuration Cards */}
      <div className="space-y-4 mb-4" dir="rtl">
        {quotas.map((q) => (
          <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <span className="text-xs font-extrabold text-[#004e82] flex items-center gap-1.5">
                <MaterialIcon name="domain" size={18} className="text-[#0070c0]" />
                {q.branch_name}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                الفعلي الحالي: {q.actual_headcount} موظف
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-700">الحد الأقصى للموظفين (سقف الفرع)</span>
                <input
                  type="number"
                  value={q.max_headcount}
                  onChange={(e) => handleUpdate(q.id, "max_headcount", Number(e.target.value))}
                  className={`${inputCls} font-mono font-bold`}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-700">الحد الأدنى لتشغيل الفرع</span>
                <input
                  type="number"
                  value={q.min_headcount}
                  onChange={(e) => handleUpdate(q.id, "min_headcount", Number(e.target.value))}
                  className={`${inputCls} font-mono`}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-700">نسبة التوطين المستهدفة (%)</span>
                <input
                  type="number"
                  value={q.target_saudization}
                  onChange={(e) => handleUpdate(q.id, "target_saudization", Number(e.target.value))}
                  className={`${inputCls} font-mono`}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-slate-700">سقف الموازنة الشهرية للرواتب (ريال)</span>
                <input
                  type="number"
                  value={q.max_monthly_budget}
                  onChange={(e) => handleUpdate(q.id, "max_monthly_budget", Number(e.target.value))}
                  className={`${inputCls} font-mono`}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Save & Export Footer Bar */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200" dir="rtl">
        <button
          onClick={exportExcel}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 h-9 font-extrabold text-xs shadow-xs transition"
        >
          <MaterialIcon name="table_chart" size={16} />
          تصدير التقرير Excel
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg bg-[#0070c0] hover:bg-[#005fa3] text-white px-6 h-9 font-extrabold text-xs shadow-md transition"
        >
          <MaterialIcon name="save" size={18} />
          حفظ التعديلات
        </button>
      </div>

      <div className="mt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200 pt-4">
        جميع الحقوق محفوظة © الحلول الخبيرة
      </div>
    </AppShell>
  );
}
