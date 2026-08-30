import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";

export const Route = createFileRoute("/requests/setup")({
  head: () => ({ meta: [{ title: "تهيئة الطلبات ومسارات الاعتماد | الطلبات" }] }),
  component: RequestSetupPage,
});

type RequestTypeConfig = {
  id: string;
  code: string;
  name: string;
  category: "شؤون موظفين" | "مالية" | "إدارية" | "عمليات";
  approval_chain: string[];
  max_sla_hours: number;
  requires_attachment: boolean;
  allow_cancel: boolean;
  status: "نشط" | "معطل";
};

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function RequestSetupPage() {
  const [requestConfigs, setRequestConfigs] = useState<RequestTypeConfig[]>([
    {
      id: "req-1",
      code: "REQ-LV",
      name: "طلب إجازة اعتيادية / مرضية",
      category: "شؤون موظفين",
      approval_chain: ["المدير المباشر", "مسؤول الموارد البشرية"],
      max_sla_hours: 24,
      requires_attachment: false,
      allow_cancel: true,
      status: "نشط",
    },
    {
      id: "req-2",
      code: "REQ-LN",
      name: "طلب سلفة مالية على الراتب",
      category: "مالية",
      approval_chain: ["المدير المباشر", "الموارد البشرية", "المدير المالي"],
      max_sla_hours: 48,
      requires_attachment: false,
      allow_cancel: true,
      status: "نشط",
    },
    {
      id: "req-3",
      code: "REQ-PRM",
      name: "طلب إذن وخروج مؤقت أثناء الدوام",
      category: "عمليات",
      approval_chain: ["المدير المباشر"],
      max_sla_hours: 4,
      requires_attachment: false,
      allow_cancel: true,
      status: "نشط",
    },
    {
      id: "req-4",
      code: "REQ-LTR",
      name: "طلب خطاب تعريف بالراتب موجه لجهة رسمية",
      category: "إدارية",
      approval_chain: ["مسؤول الموارد البشرية"],
      max_sla_hours: 12,
      requires_attachment: false,
      allow_cancel: false,
      status: "نشط",
    },
    {
      id: "req-5",
      code: "REQ-EOS",
      name: "طلب تصفية نهاية الخدمة والاستقالة",
      category: "شؤون موظفين",
      approval_chain: ["المدير المباشر", "الموارد البشرية", "المدير المالي", "المدير العام"],
      max_sla_hours: 72,
      requires_attachment: true,
      allow_cancel: true,
      status: "نشط",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<RequestTypeConfig | null>(null);

  const [newReq, setNewReq] = useState({
    code: "",
    name: "",
    category: "شؤون موظفين" as RequestTypeConfig["category"],
    max_sla_hours: 24,
    requires_attachment: false,
    allow_cancel: true,
    status: "نشط" as "نشط" | "معطل",
  });

  const handleOpenAdd = () => {
    setEditingReq(null);
    setNewReq({
      code: `REQ-0${requestConfigs.length + 1}`,
      name: "",
      category: "شؤون موظفين",
      max_sla_hours: 24,
      requires_attachment: false,
      allow_cancel: true,
      status: "نشط",
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!newReq.name.trim()) return;

    if (editingReq) {
      setRequestConfigs((prev) =>
        prev.map((r) => (r.id === editingReq.id ? { ...r, ...newReq } : r))
      );
    } else {
      const item: RequestTypeConfig = {
        id: `req-${Date.now()}`,
        ...newReq,
        approval_chain: ["المدير المباشر", "الموارد البشرية"],
      };
      setRequestConfigs((prev) => [...prev, item]);
    }
    setIsModalOpen(false);
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="schema" size={22} className="text-[#0070c0]" />
          تهيئة أنواع الطلبات ومسارات سلاسل الاعتماد
        </h1>
        <div className="text-[11px] text-slate-400">الطلبات / الموافقة على الطلبات / تهيئة الطلبات</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">أنواع الطلبات المعرفة</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{requestConfigs.length} أنواع</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">الطلبات المتاحة للخدمة الذاتية</div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{requestConfigs.filter((r) => r.status === "نشط").length} طلب نشط</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">متوسط زمن الاستجابة المستهدف (SLA)</div>
          <div className="text-lg font-extrabold text-indigo-700 font-mono mt-1">24 ساعة</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">التكامل مع الإشعارات والتطبيق</div>
          <div className="text-lg font-extrabold text-purple-700 font-mono mt-1">فوري (Realtime)</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200" dir="rtl">
        <span className="text-xs font-bold text-slate-700">دليل أنواع الطلبات وسلاسل الموافقات المعرفة في النظام</span>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1 rounded bg-[#0070c0] h-8 px-4 text-xs font-bold text-white shadow-xs hover:bg-[#005fa3] transition"
        >
          <MaterialIcon name="add" size={16} />
          إضافة نوع طلب جديد
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" dir="rtl">
        {requestConfigs.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-[#0070c0] transition">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-[#0070c0] bg-blue-50 px-2 py-0.5 rounded">{r.code}</span>
                <span className="font-extrabold text-slate-800 text-xs">{r.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                r.status === "نشط" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
              }`}>
                {r.status}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5">سلسلة مسار الموافقات:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {r.approval_chain.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[11px] font-bold text-slate-700 border border-slate-200">
                      {idx + 1}. {step}
                    </span>
                    {idx < r.approval_chain.length - 1 && (
                      <MaterialIcon name="arrow_back" size={14} className="text-slate-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <div className="flex items-center gap-3">
                <span>زمن الاستجابة: <strong className="text-slate-800 font-mono">{r.max_sla_hours} ساعة</strong></span>
                <span>المرفقات: <strong className="text-slate-800">{r.requires_attachment ? "إلزامية" : "اختيارية"}</strong></span>
              </div>
              <button
                onClick={() => {
                  setEditingReq(r);
                  setNewReq({ ...r });
                  setIsModalOpen(true);
                }}
                className="text-[#0070c0] font-bold hover:underline"
              >
                تعديل المسار
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-[#004e82] flex items-center gap-1.5">
                <MaterialIcon name="schema" size={18} className="text-[#0070c0]" />
                {editingReq ? "تعديل إعدادات نوع الطلب" : "إضافة نوع طلب ومسار اعتماد جديد"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">كود الطلب *</span>
                <input
                  type="text"
                  value={newReq.code}
                  onChange={(e) => setNewReq((p) => ({ ...p, code: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">التصنيف</span>
                <select
                  value={newReq.category}
                  onChange={(e) => setNewReq((p) => ({ ...p, category: e.target.value as any }))}
                  className={inputCls}
                >
                  <option value="شؤون موظفين">شؤون موظفين</option>
                  <option value="مالية">مالية</option>
                  <option value="إدارية">إدارية</option>
                  <option value="عمليات">عمليات</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold text-slate-700">اسم الطلب *</span>
                <input
                  type="text"
                  value={newReq.name}
                  onChange={(e) => setNewReq((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">أقصى وقت للاعتماد (بالساعات)</span>
                <input
                  type="number"
                  value={newReq.max_sla_hours}
                  onChange={(e) => setNewReq((p) => ({ ...p, max_sla_hours: Number(e.target.value) }))}
                  className={`${inputCls} font-mono`}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">الحالة</span>
                <select
                  value={newReq.status}
                  onChange={(e) => setNewReq((p) => ({ ...p, status: e.target.value as any }))}
                  className={inputCls}
                >
                  <option value="نشط">نشط</option>
                  <option value="معطل">معطل</option>
                </select>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 h-8 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="px-5 h-8 rounded-lg bg-[#0070c0] hover:bg-[#005fa3] text-white text-xs font-bold shadow-xs"
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
