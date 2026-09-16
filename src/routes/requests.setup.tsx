import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { supabase } from "@/integrations/supabase/client";
import { useRequestTypeSettings, useSaveRequestTypeSettings } from "@/lib/request-settings-db";
import type { RequestSettingsSnapshot } from "@/lib/request-settings.mjs";
import {
  splitApprovalChain,
  validateRequestConfig,
  type RequestTypeConfig,
} from "@/lib/request-config.mjs";

export const Route = createFileRoute("/requests/setup")({
  head: () => ({ meta: [{ title: "تهيئة الطلبات ومسارات الاعتماد | الطلبات" }] }),
  component: RequestSetupPage,
});

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function RequestSetupPage() {
  return <AppShell><RequestSettingsSession /></AppShell>;
}

function RequestSettingsSession() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    let authEventSeen = false;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventSeen = true;
      if (alive) setUserId(session?.user.id ?? null);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (alive && !authEventSeen) setUserId(data.session?.user.id ?? null);
    }).catch(() => { if (alive) setUserId(null); });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);
  // Account changes remount the editor, so drafts and snapshots cannot leak across accounts.
  return userId ? <RequestSetupEditor key={userId} userId={userId} /> : <p>جارٍ التحقق من جلسة الدخول...</p>;
}

function RequestSetupEditor({ userId }: { userId: string }) {
  const settingsQuery = useRequestTypeSettings(userId);
  const saveSettings = useSaveRequestTypeSettings(userId);
  const requestConfigs = settingsQuery.isSuccess ? settingsQuery.data.configs : [];
  const mutationInFlight = useRef(false);
  const [reloadRequired, setReloadRequired] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<RequestTypeConfig | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draftBase, setDraftBase] = useState<RequestSettingsSnapshot | null>(null);
  const [chainText, setChainText] = useState("");
  const canEdit = settingsQuery.isSuccess && !settingsQuery.isFetching && !saveSettings.isPending && !reloadRequired;

  const emptyDraft = (): Omit<RequestTypeConfig, "id"> => ({
    code: "",
    name: "",
    category: "شؤون موظفين",
    approval_chain: ["المدير المباشر", "الموارد البشرية"],
    max_sla_hours: 24,
    requires_attachment: false,
    allow_cancel: true,
    status: "نشط",
  });
  const draftFrom = (request: RequestTypeConfig): Omit<RequestTypeConfig, "id"> => ({
    code: request.code,
    name: request.name,
    category: request.category,
    approval_chain: [...request.approval_chain],
    max_sla_hours: request.max_sla_hours,
    requires_attachment: request.requires_attachment,
    allow_cancel: request.allow_cancel,
    status: request.status,
  });
  const [newReq, setNewReq] = useState<Omit<RequestTypeConfig, "id">>(() => emptyDraft());

  const handleOpenAdd = () => {
    if (!canEdit || mutationInFlight.current || !settingsQuery.data) return;
    if (requestConfigs.length >= 200) {
      setFormError("الحد الأقصى 200 نوع طلب؛ عدّل أو احذف نوعًا موجودًا أولًا.");
      return;
    }
    setEditingReq(null);
    setFormError(null);
    setNotice(null);
    setDraftBase(settingsQuery.data);
    setChainText(emptyDraft().approval_chain.join("، "));
    setNewReq({
      ...emptyDraft(),
      code: `REQ-${String(requestConfigs.length + 1).padStart(2, "0")}`,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (request: RequestTypeConfig) => {
    if (!canEdit || mutationInFlight.current || !settingsQuery.data) return;
    setEditingReq(request);
    setFormError(null);
    setNotice(null);
    setDraftBase(settingsQuery.data);
    setChainText(request.approval_chain.join("، "));
    setNewReq(draftFrom(request));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!canEdit || mutationInFlight.current || !draftBase) return;
    const candidate: RequestTypeConfig = {
      id: editingReq?.id ?? `req-${crypto.randomUUID()}`,
      ...newReq,
      approval_chain: splitApprovalChain(chainText),
    };
    const validation = validateRequestConfig(candidate);
    if (!validation.ok || !validation.value) {
      setFormError(Object.values(validation.errors)[0] ?? "راجع بيانات نوع الطلب.");
      return;
    }
    const value = validation.value;
    if (draftBase.configs.some((request) => request.code === value.code && request.id !== candidate.id)) {
      setFormError("كود الطلب مستخدم بالفعل؛ اختر كودًا مختلفًا.");
      return;
    }

    const next = editingReq
      ? draftBase.configs.map((request) => (request.id === editingReq.id ? value : request))
      : [...draftBase.configs, value];
    mutationInFlight.current = true;
    try {
      await saveSettings.mutateAsync({ configs: next, expectedValue: draftBase.expectedValue });
      setFormError(null);
      setIsModalOpen(false);
      setNotice("تم تأكيد حفظ إعدادات الطلبات بنجاح.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "تعذر تأكيد الحفظ. أعد تحميل الإعدادات.");
      setReloadRequired(true);
    } finally {
      mutationInFlight.current = false;
    }
  };

  const handleDelete = async (request: RequestTypeConfig) => {
    if (!canEdit || mutationInFlight.current || !settingsQuery.data) return;
    setNotice(null);
    if (requestConfigs.length === 1) {
      setFormError("لا يمكن حذف آخر نوع طلب؛ يجب الاحتفاظ بنوع واحد على الأقل.");
      return;
    }
    if (typeof window !== "undefined" && !window.confirm(`حذف نوع الطلب "${request.name}"؟`)) return;
    const next = requestConfigs.filter((item) => item.id !== request.id);
    mutationInFlight.current = true;
    try {
      await saveSettings.mutateAsync({ configs: next, expectedValue: settingsQuery.data.expectedValue });
      setFormError(null);
      setNotice("تم تأكيد حذف نوع الطلب.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "تعذر تأكيد الحذف. أعد تحميل الإعدادات.");
      setReloadRequired(true);
    } finally {
      mutationInFlight.current = false;
    }
  };

  const handleReload = async () => {
    if (mutationInFlight.current || settingsQuery.isFetching) return;
    if (isModalOpen && !window.confirm("إلغاء مسودة التعديل وتحميل آخر نسخة محفوظة؟")) return;
    setIsModalOpen(false);
    setDraftBase(null);
    setFormError(null);
    setNotice(null);
    const result = await settingsQuery.refetch();
    if (result.isSuccess) setReloadRequired(false);
  };

  return (
    <>
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
          <div className="text-[11px] font-bold text-slate-500">أنواع الطلبات النشطة في الإعدادات</div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{requestConfigs.filter((r) => r.status === "نشط").length} طلب نشط</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">متوسط زمن الاستجابة المستهدف (SLA)</div>
          <div className="text-lg font-extrabold text-indigo-700 font-mono mt-1">{Math.round(requestConfigs.reduce((sum, request) => sum + request.max_sla_hours, 0) / Math.max(requestConfigs.length, 1))} ساعة</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">التكامل مع الإشعارات والتطبيق</div>
          <div className="text-sm font-extrabold text-purple-700 mt-1">غير مفعّل بعد</div>
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-600">هذه الشاشة لحفظ إعدادات النظام العامة بواسطة مدير النظام؛ لا تنفّذ الموافقات أو الإشعارات ولا تعزل الإعدادات حسب الشركة بعد.</p>
      {settingsQuery.isFetching && <p role="status" className="mb-3 text-xs text-blue-800">جارٍ تحميل إعدادات أنواع الطلبات...</p>}
      {settingsQuery.error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{settingsQuery.error.message}</p>}
      {settingsQuery.data && !settingsQuery.data.exists && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">لا توجد إعدادات محفوظة بعد؛ القيم المعروضة مقترحات أولية ولا تُحفظ إلا عند التأكيد.</p>}
      {!isModalOpen && formError && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{formError}</p>}
      {notice && <p role="status" className="mb-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}
      {reloadRequired && <p role="alert" className="mb-3 text-xs text-amber-800">التعديل متوقف حتى إعادة تحميل آخر نسخة والتحقق من نتيجة العملية السابقة.</p>}
      <button type="button" onClick={() => void handleReload()} disabled={saveSettings.isPending || settingsQuery.isFetching} className="mb-3 rounded border px-3 py-2 text-xs disabled:opacity-40">إعادة تحميل الإعدادات</button>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200" dir="rtl">
        <span className="text-xs font-bold text-slate-700">دليل أنواع الطلبات وسلاسل الموافقات المعرفة في النظام</span>
        <button
          type="button"
          onClick={handleOpenAdd}
          disabled={!canEdit}
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

            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span>زمن الاستجابة: <strong className="text-slate-800 font-mono">{r.max_sla_hours} ساعة</strong></span>
                <span>المرفقات: <strong className="text-slate-800">{r.requires_attachment ? "إلزامية" : "اختيارية"}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleEdit(r)}
                  disabled={!canEdit}
                  className="text-[#0070c0] font-bold hover:underline"
                >
                  تعديل المسار
                </button>
                <button
                type="button"
                onClick={() => void handleDelete(r)}
                disabled={!canEdit}
                className="text-rose-600 font-bold hover:underline disabled:opacity-40"
              >
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" dir="rtl">
          <div role="dialog" aria-modal="true" aria-labelledby="request-settings-title" className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 id="request-settings-title" className="text-sm font-extrabold text-[#004e82] flex items-center gap-1.5">
                <MaterialIcon name="schema" size={18} className="text-[#0070c0]" />
                {editingReq ? "تعديل إعدادات نوع الطلب" : "إضافة نوع طلب ومسار اعتماد جديد"}
              </h3>
              <button type="button" aria-label="إغلاق" disabled={saveSettings.isPending} onClick={() => { setIsModalOpen(false); setFormError(null); }} className="text-slate-400 hover:text-slate-700">
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            <fieldset disabled={!canEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">كود الطلب *</span>
                <input
                  type="text"
                  value={newReq.code}
                  required
                  maxLength={32}
                  onChange={(e) => { setNewReq((p) => ({ ...p, code: e.target.value })); setFormError(null); }}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">التصنيف</span>
                <select
                  value={newReq.category}
                  onChange={(e) => setNewReq((p) => ({ ...p, category: e.target.value as RequestTypeConfig["category"] }))}
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
                  required
                  maxLength={160}
                  onChange={(e) => { setNewReq((p) => ({ ...p, name: e.target.value })); setFormError(null); }}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">أقصى وقت للاعتماد (بالساعات)</span>
                <input
                  type="number"
                  value={newReq.max_sla_hours}
                  min={1}
                  max={720}
                  step={1}
                  onChange={(e) => setNewReq((p) => ({ ...p, max_sla_hours: Number(e.target.value) }))}
                  className={`${inputCls} font-mono`}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">الحالة</span>
                <select
                  value={newReq.status}
                  onChange={(e) => setNewReq((p) => ({ ...p, status: e.target.value as RequestTypeConfig["status"] }))}
                  className={inputCls}
                >
                  <option value="نشط">نشط</option>
                  <option value="معطل">معطل</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold text-slate-700">سلسلة الموافقات * <span className="font-normal text-slate-400">(افصل بين الخطوات بفاصلة أو سطر جديد)</span></span>
                <textarea
                  value={chainText}
                  onChange={(e) => { setChainText(e.target.value); setFormError(null); }}
                  rows={2}
                  maxLength={1000}
                  className={inputCls + " min-h-16 py-2"}
                  required
                />
              </label>

              <label className="flex items-center gap-2 sm:col-span-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={newReq.requires_attachment}
                  onChange={(e) => setNewReq((p) => ({ ...p, requires_attachment: e.target.checked }))}
                />
                المرفق إلزامي مع الطلب
              </label>
              <label className="flex items-center gap-2 sm:col-span-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={newReq.allow_cancel}
                  onChange={(e) => setNewReq((p) => ({ ...p, allow_cancel: e.target.checked }))}
                />
                السماح للموظف بإلغاء الطلب قبل اعتماده
              </label>
            </fieldset>

            {formError && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-700">{formError}</p>}
            {reloadRequired && <button type="button" onClick={() => void handleReload()} disabled={settingsQuery.isFetching} className="mb-3 rounded border px-3 py-2 text-xs">تحميل آخر نسخة وإلغاء المسودة</button>}

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setFormError(null); }}
                disabled={saveSettings.isPending}
                className="px-4 h-8 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!canEdit}
                className="px-5 h-8 rounded-lg bg-[#0070c0] hover:bg-[#005fa3] text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {saveSettings.isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200 pt-4">
        جميع الحقوق محفوظة © الحلول الخبيرة
      </div>
    </>
  );
}
