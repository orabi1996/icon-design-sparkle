import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";

export const Route = createFileRoute("/settings/company")({
  head: () => ({ meta: [{ title: "تهيئة بيانات المنشأة والشركة | إعدادات النظام" }] }),
  component: CompanySettingsPage,
});

const inputCls =
  "h-9 w-full rounded border border-[#b4c7e7] bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function CompanySettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "address" | "officers" | "branding">("general");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    companyNameAr: "شركة الحلول الخبيرة لتقنية المعلومات",
    companyNameEn: "Expert Solutions for Information Technology Co.",
    crNumber: "1010789456",
    unified700Number: "7001984251",
    vatNumber: "310198425100003",
    gosiEstNumber: "98425167",
    molEstNumber: "12-984251",
    chamberNumber: "458792",
    activityType: "أنشطة استشارات تقنية المعلومات وتطوير البرمجيات",
    establishmentDate: "2018-04-15",
    
    // Address
    city: "الرياض",
    district: "حي الملقا",
    street: "طريق الملك فهد",
    buildingNo: "4125",
    postalCode: "13524",
    additionalNo: "8890",
    phone: "0112345678",
    email: "info@expert-hr.sa",
    website: "https://expert-hr.sa",

    // Officers
    generalManager: "أشرف عرابي",
    hrManager: "سعد بن إبراهيم القحطاني",
    financeManager: "عبدالرحمن الشمري",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="corporate_fare" size={22} className="text-[#0070c0]" />
          تهيئة وتحديث بيانات المنشأة والشركة
        </h1>
        <div className="text-[11px] text-slate-400">إعدادات النظام / تهيئة بيانات الشركات والفروع / بيانات الشركة</div>
      </div>

      {/* Success Banner */}
      {savedSuccess && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2" dir="rtl">
          <MaterialIcon name="check_circle" size={18} className="text-emerald-600" />
          تم حفظ وتحديث بيانات المنشأة بنجاح ومطابقتها مع كافة أنظمة الرواتب والمستندات!
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-4" dir="rtl">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold border-b-2 transition ${
            activeTab === "general"
              ? "border-[#0070c0] text-[#0070c0]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <MaterialIcon name="domain" size={16} />
          البيانات الأساسية والتراخيص
        </button>

        <button
          onClick={() => setActiveTab("address")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold border-b-2 transition ${
            activeTab === "address"
              ? "border-[#0070c0] text-[#0070c0]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <MaterialIcon name="pin_drop" size={16} />
          العنوان الوطني وبيانات الاتصال
        </button>

        <button
          onClick={() => setActiveTab("officers")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold border-b-2 transition ${
            activeTab === "officers"
              ? "border-[#0070c0] text-[#0070c0]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <MaterialIcon name="badge" size={16} />
          المسؤولون والمفوضون
        </button>

        <button
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold border-b-2 transition ${
            activeTab === "branding"
              ? "border-[#0070c0] text-[#0070c0]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <MaterialIcon name="palette" size={16} />
          الهوية والأختام والشعار
        </button>
      </div>

      {/* Tab Content Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs mb-4" dir="rtl">
        {activeTab === "general" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">اسم المنشأة / الشركة (عربي) *</span>
              <input
                type="text"
                value={formData.companyNameAr}
                onChange={(e) => handleChange("companyNameAr", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">اسم المنشأة / الشركة (English)</span>
              <input
                type="text"
                value={formData.companyNameEn}
                onChange={(e) => handleChange("companyNameEn", e.target.value)}
                className={`${inputCls} text-left font-sans`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">الرقم الموحد للمنشأة (700) *</span>
              <input
                type="text"
                value={formData.unified700Number}
                onChange={(e) => handleChange("unified700Number", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">رقم السجل التجاري (CR) *</span>
              <input
                type="text"
                value={formData.crNumber}
                onChange={(e) => handleChange("crNumber", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">الرقم الضريبي (VAT Number) *</span>
              <input
                type="text"
                value={formData.vatNumber}
                onChange={(e) => handleChange("vatNumber", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">رقم اشتراك التأمينات الاجتماعية (GOSI)</span>
              <input
                type="text"
                value={formData.gosiEstNumber}
                onChange={(e) => handleChange("gosiEstNumber", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">رقم المنشأة في وزارة الموارد البشرية (MOL)</span>
              <input
                type="text"
                value={formData.molEstNumber}
                onChange={(e) => handleChange("molEstNumber", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">رقم اشتراك الغرفة التجارية</span>
              <input
                type="text"
                value={formData.chamberNumber}
                onChange={(e) => handleChange("chamberNumber", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">تاريخ تأسيس المنشأة</span>
              <input
                type="date"
                value={formData.establishmentDate}
                onChange={(e) => handleChange("establishmentDate", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
              <span className="text-xs font-bold text-slate-700">النشاط التجاري الرئيسي</span>
              <input
                type="text"
                value={formData.activityType}
                onChange={(e) => handleChange("activityType", e.target.value)}
                className={inputCls}
              />
            </label>
          </div>
        )}

        {activeTab === "address" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">المدينة</span>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">الحي</span>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleChange("district", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">اسم الشارع</span>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => handleChange("street", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">رقم المبنى</span>
              <input
                type="text"
                value={formData.buildingNo}
                onChange={(e) => handleChange("buildingNo", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">الرمز البريدي</span>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">الرقم الإضافي</span>
              <input
                type="text"
                value={formData.additionalNo}
                onChange={(e) => handleChange("additionalNo", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">هاتف المنشأة الموحد</span>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">البريد الإلكتروني الرسمي</span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`${inputCls} text-left font-sans`}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">الموقع الإلكتروني</span>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                className={`${inputCls} text-left font-sans`}
              />
            </label>
          </div>
        )}

        {activeTab === "officers" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">المدير العام / الرئيس التنفيذي *</span>
              <input
                type="text"
                value={formData.generalManager}
                onChange={(e) => handleChange("generalManager", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">مدير الموارد البشرية *</span>
              <input
                type="text"
                value={formData.hrManager}
                onChange={(e) => handleChange("hrManager", e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">المدير المالي</span>
              <input
                type="text"
                value={formData.financeManager}
                onChange={(e) => handleChange("financeManager", e.target.value)}
                className={inputCls}
              />
            </label>
          </div>
        )}

        {activeTab === "branding" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center">
              <MaterialIcon name="image" size={40} className="text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700">شعار المنشأة الرسمي (Logo)</span>
              <span className="text-[11px] text-slate-400 mt-1">يظهر في ترويسة التقارير والنماذج الرسمية A4</span>
              <button className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 text-[#0070c0] font-bold text-xs hover:bg-blue-100 transition border border-blue-200">
                رفع شعار جديد
              </button>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center">
              <MaterialIcon name="verified" size={40} className="text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700">الختم والتوقيع الإلكتروني المعتمد</span>
              <span className="text-[11px] text-slate-400 mt-1">يُطبع تلقائياً على خطابات التعريف والمستندات</span>
              <button className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 text-[#0070c0] font-bold text-xs hover:bg-blue-100 transition border border-blue-200">
                رفع الختم الرسمي
              </button>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-xs text-slate-400">آخر تحديث: 2026/08/30 بواسطة مسؤول النظام</span>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-[#0070c0] hover:bg-[#005fa3] text-white px-5 h-9 font-extrabold text-xs shadow-md transition"
          >
            <MaterialIcon name="save" size={18} />
            حفظ وتحديث البيانات
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200 pt-4">
        جميع الحقوق محفوظة © الحلول الخبيرة
      </div>
    </AppShell>
  );
}
