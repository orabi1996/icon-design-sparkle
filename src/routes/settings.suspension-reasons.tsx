import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";

export const Route = createFileRoute("/settings/suspension-reasons")({
  head: () => ({ meta: [{ title: "تهيئة أسباب إيقاف الموظفين وتعليق الصرف | إعدادات النظام" }] }),
  component: SuspensionReasonsPage,
});

type SuspensionReasonItem = {
  id: string;
  code: string;
  name: string;
  payroll_action: "إيقاف صرف الراتب كاملاً" | "إيقاف البدلات فقط" | "صرف نصف الراتب";
  fingerprint_action: "حظر تسجيل البصمة" | "السماح بالبصمة مع التنبيه" | "عادي";
  system_action: "تجميد الحساب والطلبات" | "نشط للقراءة فقط";
  requires_legal_doc: boolean;
  status: "نشط" | "معطل";
};

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function SuspensionReasonsPage() {
  const [reasons, setReasons] = useState<SuspensionReasonItem[]>([
    {
      id: "sr-1",
      code: "SUSP-01",
      name: "انقطاع وتغيب عن العمل بدون إذن رسمي (أكثر من 15 يوم متصلة)",
      payroll_action: "إيقاف صرف الراتب كاملاً",
      fingerprint_action: "حظر تسجيل البصمة",
      system_action: "تجميد الحساب والطلبات",
      requires_legal_doc: true,
      status: "نشط",
    },
    {
      id: "sr-2",
      code: "SUSP-02",
      name: "إحالة إلى التحقيق الإداري / القانوني الداخلي",
      payroll_action: "صرف نصف الراتب",
      fingerprint_action: "السماح بالبصمة مع التنبيه",
      system_action: "نشط للقراءة فقط",
      requires_legal_doc: true,
      status: "نشط",
    },
    {
      id: "sr-3",
      code: "SUSP-03",
      name: "إجازة استثنائية بدون راتب",
      payroll_action: "إيقاف صرف الراتب كاملاً",
      fingerprint_action: "حظر تسجيل البصمة",
      system_action: "تجميد الحساب والطلبات",
      requires_legal_doc: false,
      status: "نشط",
    },
    {
      id: "sr-4",
      code: "SUSP-04",
      name: "انتهاء الإقامة / رخصة العمل بدون تجديد",
      payroll_action: "إيقاف صرف الراتب كاملاً",
      fingerprint_action: "السماح بالبصمة مع التنبيه",
      system_action: "تجميد الحساب والطلبات",
      requires_legal_doc: false,
      status: "نشط",
    },
    {
      id: "sr-5",
      code: "SUSP-05",
      name: "إيقاف خدمات أو أمر قضائي رسمي",
      payroll_action: "إيقاف صرف الراتب كاملاً",
      fingerprint_action: "حظر تسجيل البصمة",
      system_action: "تجميد الحساب والطلبات",
      requires_legal_doc: true,
      status: "نشط",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<SuspensionReasonItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [newReason, setNewReason] = useState({
    code: "",
    name: "",
    payroll_action: "إيقاف صرف الراتب كاملاً" as SuspensionReasonItem["payroll_action"],
    fingerprint_action: "حظر تسجيل البصمة" as SuspensionReasonItem["fingerprint_action"],
    system_action: "تجميد الحساب والطلبات" as SuspensionReasonItem["system_action"],
    requires_legal_doc: true,
    status: "نشط" as "نشط" | "معطل",
  });

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return reasons;
    const q = searchQuery.toLowerCase();
    return reasons.filter(
      (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
    );
  }, [reasons, searchQuery]);

  const handleOpenAdd = () => {
    setEditingReason(null);
    setNewReason({
      code: `SUSP-0${reasons.length + 1}`,
      name: "",
      payroll_action: "إيقاف صرف الراتب كاملاً",
      fingerprint_action: "حظر تسجيل البصمة",
      system_action: "تجميد الحساب والطلبات",
      requires_legal_doc: true,
      status: "نشط",
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!newReason.name.trim()) return;

    if (editingReason) {
      setReasons((prev) =>
        prev.map((r) => (r.id === editingReason.id ? { ...r, ...newReason } : r))
      );
    } else {
      const item: SuspensionReasonItem = {
        id: `sr-${Date.now()}`,
        ...newReason,
      };
      setReasons((prev) => [...prev, item]);
    }
    setIsModalOpen(false);
  };

  /* ─── Export ─── */
  const exportExcel = () => {
    const headers = ["الكود", "سبب الإيقاف والتعليق", "أثر الإيقاف على الراتب", "أثر الإيقاف على البصمة", "إجراء النظام", "يتطلب مستند قانوني", "الحالة"];
    const data = filtered.map((r) => [
      r.code, r.name, r.payroll_action, r.fingerprint_action, r.system_action, r.requires_legal_doc ? "نعم" : "لا", r.status
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "أسباب الإيقاف");
    XLSX.writeFile(wb, "دليل-أسباب-إيقاف-الموظفين.xlsx");
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="block" size={22} className="text-[#0070c0]" />
          تهيئة أسباب إيقاف الموظفين وتعليق الرواتب
        </h1>
        <div className="text-[11px] text-slate-400">إعدادات النظام / إعدادات أخرى / تهيئة أسباب الإيقاف</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الأسباب المعرفة</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{reasons.length} أسباب</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">أسباب إيقاف الراتب الكامل</div>
          <div className="text-lg font-extrabold text-rose-700 font-mono mt-1">{reasons.filter((r) => r.payroll_action === "إيقاف صرف الراتب كاملاً").length} حالات</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">تتطلب قراراً إدارياً / قانونياً</div>
          <div className="text-lg font-extrabold text-amber-700 font-mono mt-1">{reasons.filter((r) => r.requires_legal_doc).length} أسباب</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">التكامل مع مسير الرواتب</div>
          <div className="text-lg font-extrabold text-purple-700 font-mono mt-1">تلقائي وآلي</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200" dir="rtl">
        <div className="relative">
          <input
            type="text"
            placeholder="البحث بالاسم أو الكود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-64 rounded border border-slate-300 bg-white pe-7 ps-2 text-[11px] font-medium outline-none focus:border-[#0070c0]"
          />
          <MaterialIcon name="search" size={16} className="pointer-events-none absolute left-2 top-2 text-slate-400" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-1 rounded bg-[#0070c0] h-8 px-4 text-xs font-bold text-white shadow-xs hover:bg-[#005fa3] transition"
          >
            <MaterialIcon name="add" size={16} />
            إضافة سبب إيقاف جديد
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center justify-center gap-1 rounded bg-emerald-600 h-8 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <MaterialIcon name="table_chart" size={15} />
            Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#004e82]/30 shadow-xs" dir="rtl">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#004e82] text-white">
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">الكود</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right">سبب الإيقاف ومبرره</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right">أثر الإيقاف على الراتب</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right">أثر الإيقاف على البصمة</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right">إجراء النظام</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">مستند رسمي</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">الحالة</th>
              <th className="px-2.5 py-2 font-extrabold text-center">إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r, idx) => (
              <tr
                key={r.id}
                className={`border-b border-slate-200 transition hover:bg-blue-50/70 ${
                  idx % 2 === 0 ? "bg-white" : "bg-[#f8fafd]"
                }`}
              >
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0]">{r.code}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-right font-bold text-slate-800">{r.name}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-right text-rose-700 font-bold">{r.payroll_action}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-right text-slate-700">{r.fingerprint_action}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-right text-slate-700">{r.system_action}</td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.requires_legal_doc ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {r.requires_legal_doc ? "إلزامي" : "اختياري"}
                  </span>
                </td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {r.status}
                  </span>
                </td>
                <td className="px-2.5 py-1.5 text-center">
                  <button
                    onClick={() => {
                      setEditingReason(r);
                      setNewReason({ ...r });
                      setIsModalOpen(true);
                    }}
                    className="p-1 text-slate-600 hover:text-[#0070c0] transition rounded hover:bg-slate-100"
                  >
                    <MaterialIcon name="edit" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-[#004e82] flex items-center gap-1.5">
                <MaterialIcon name="block" size={18} className="text-[#0070c0]" />
                {editingReason ? "تعديل سبب الإيقاف" : "إضافة سبب إيقاف وتعليق جديد"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">كود السبب *</span>
                <input
                  type="text"
                  value={newReason.code}
                  onChange={(e) => setNewReason((p) => ({ ...p, code: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">اسم ووصف سبب الإيقاف *</span>
                <input
                  type="text"
                  value={newReason.name}
                  onChange={(e) => setNewReason((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">أثر الإيقاف على مسير الرواتب</span>
                <select
                  value={newReason.payroll_action}
                  onChange={(e) => setNewReason((p) => ({ ...p, payroll_action: e.target.value as any }))}
                  className={inputCls}
                >
                  <option value="إيقاف صرف الراتب كاملاً">إيقاف صرف الراتب كاملاً</option>
                  <option value="صرف نصف الراتب">صرف نصف الراتب</option>
                  <option value="إيقاف البدلات فقط">إيقاف البدلات فقط</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">أثر الإيقاف على جهاز البصمة</span>
                <select
                  value={newReason.fingerprint_action}
                  onChange={(e) => setNewReason((p) => ({ ...p, fingerprint_action: e.target.value as any }))}
                  className={inputCls}
                >
                  <option value="حظر تسجيل البصمة">حظر تسجيل البصمة (منع تسجيل الحضور)</option>
                  <option value="السماح بالبصمة مع التنبيه">السماح بالبصمة مع تسجيل تنبيه إداري</option>
                  <option value="عادي">عادي بدون قيود</option>
                </select>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 h-8 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="px-5 h-8 rounded-lg bg-[#0070c0] hover:bg-[#005fa3] text-white text-xs font-bold shadow-xs transition"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200 pt-4">
        جميع الحقوق محفوظة © الحلول الخبيرة
      </div>
    </AppShell>
  );
}
