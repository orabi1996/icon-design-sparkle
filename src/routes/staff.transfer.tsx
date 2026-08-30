import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Breadcrumbs, Btn, Card, Field, PageBanner } from "@/components/hr/ui";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/staff/transfer")({
  head: () => ({
    meta: [
      { title: "النقل والترقية | تحديث بيانات الموظف الوظيفية" },
      {
        name: "description",
        content: "مقارنة البيانات الحالية بالبيانات الجديدة لتنفيذ عمليات النقل بين الفروع والترقية الوظيفية.",
      },
      { property: "og:title", content: "النقل والترقية | تحديث بيانات الموظف الوظيفية" },
      { property: "og:description", content: "نقل الموظفين بين الأقسام والفروع وتنفيذ الترقيات مع سجل كامل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Transfer,
});

const inputCls =
  "h-9 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/25";

function Transfer() {
  const { data: employees = [], isLoading } = useRows("employees", { orderBy: "emp_no", ascending: true });

  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [transferType, setTransferType] = useState<"نقل" | "ترقية" | "نقل وترقية">("نقل وترقية");
  const [effectiveDate, setEffectiveDate] = useState("2025-06-01");
  const [isSuccess, setIsSuccess] = useState(false);

  // Current employee details
  const currentEmp = useMemo(() => {
    if (!employees.length) return null;
    if (!selectedEmpId) return employees[0];
    return employees.find((e) => String(e["id"]) === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  // Form state for new attributes
  const [newBranch, setNewBranch] = useState("شركة الحلول ٢");
  const [newDept, setNewDept] = useState("التطوير");
  const [newJobTitle, setNewJobTitle] = useState("أخصائي أول / قائد فريق");
  const [newGrade, setNewGrade] = useState("الفئة الأولى");
  const [newManager, setNewManager] = useState("أشرف محمود عرابي");
  const [newSalary, setNewSalary] = useState<number>(9500);
  const [newShift, setNewShift] = useState("دوام إداري مرن");
  const [notes, setNotes] = useState("بناءً على التقييم السنوي المتميز للأداء وتوصية الإدارة العامة.");

  const currentBasic = Number(currentEmp?.["basic_salary"] || 7500);
  const salaryDiff = newSalary - currentBasic;

  const handleExecute = () => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 4000);
  };

  return (
    <div className="mt-4" dir="rtl">
      <Breadcrumbs trail={["شؤون الموظفين", "النقل والترقية"]} />
      <PageBanner
        icon="swap_horiz"
        title="النقل والترقية الوظيفية"
        subtitle="تنفيذ ومقارنة قرارات النقل بين الفروع والأقسام والترقيات المالية والإدارية"
        actions={
          <Btn icon="history" variant="onDark" onClick={() => alert("سجل العمليات والقرارات المؤرشفة")}>
            سجل العمليات
          </Btn>
        }
      />

      {isSuccess && (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <MaterialIcon name="check_circle" size={20} className="text-emerald-600" />
            <span>تم اعتماد قرار {transferType} للموظف ({currentEmp?.["full_name"]}) بنجاح وتحديث بياناته بملف الخدمة!</span>
          </div>
          <button onClick={() => window.print()} className="underline text-emerald-900 font-extrabold">
            طباعة القرار الرسمي
          </button>
        </div>
      )}

      {/* Select Employee Card */}
      <div className="mt-4">
        <Card title="اختيار الموظف ونوع القرار" icon="person_search">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-foreground/80">اختيار الموظف *</span>
              <select
                value={selectedEmpId || String(currentEmp?.["id"] ?? "")}
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

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-foreground/80">نوع العملية *</span>
              <select
                value={transferType}
                onChange={(e) => setTransferType(e.target.value as any)}
                className={inputCls}
              >
                <option value="نقل">نقل داخلي بين الفروع/الأقسام</option>
                <option value="ترقية">ترقية وظيفية وتعديل مالي</option>
                <option value="نقل وترقية">نقل وترقية وظيفية مشتركة</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-foreground/80">تاريخ السريان والتنفيذ *</span>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold text-foreground/80">الرقم المرجعي للقرار</span>
              <input
                type="text"
                value={`DEC-2025-${currentEmp?.["emp_no"] || "01"}`}
                disabled
                className={`${inputCls} font-mono bg-slate-100 text-slate-500`}
              />
            </label>
          </div>
        </Card>
      </div>

      {/* Comparison Grid */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Current State */}
        <Card title="البيانات الوظيفية الحالية (قبل التعديل)" icon="lock_clock">
          <ul className="space-y-2.5">
            <li className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-2.5 text-[13px]">
              <span className="font-bold text-muted-foreground">الفرع الحالي</span>
              <span className="font-extrabold text-slate-800">{currentEmp?.["branch"] || "شركة الحلول الخبيرة"}</span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-2.5 text-[13px]">
              <span className="font-bold text-muted-foreground">القسم الحالي</span>
              <span className="font-extrabold text-slate-800">{currentEmp?.["department"] || "التطوير"}</span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-2.5 text-[13px]">
              <span className="font-bold text-muted-foreground">المسمى الوظيفي الحالي</span>
              <span className="font-extrabold text-slate-800">{currentEmp?.["job_title"] || "مهندس برمجيات"}</span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-2.5 text-[13px]">
              <span className="font-bold text-muted-foreground">الراتب الأساسي الحالي</span>
              <span className="font-mono font-extrabold text-slate-800">{currentBasic.toLocaleString()} ريال</span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-2.5 text-[13px]">
              <span className="font-bold text-muted-foreground">المدير المباشر</span>
              <span className="font-extrabold text-slate-800">{currentEmp?.["manager_name"] || "أشرف عرابي"}</span>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-2.5 text-[13px]">
              <span className="font-bold text-muted-foreground">مجموعة الدوام الحالية</span>
              <span className="font-extrabold text-slate-800">دوام إداري رسمي</span>
            </li>
          </ul>
        </Card>

        {/* New Target State */}
        <Card title="البيانات والامتيازات الجديدة (بعد القرار)" icon="edit_note">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-700">الفرع الجديد</span>
              <select
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                className={inputCls}
              >
                <option value="شركة الحلول الخبيرة">شركة الحلول الخبيرة - الرياض</option>
                <option value="شركة الحلول ٢">شركة الحلول ٢ - فرع جدة</option>
                <option value="فرع المنطقة الشرقية">فرع المنطقة الشرقية - الدمام</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-700">القسم الجديد</span>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className={inputCls}
              >
                <option value="التطوير">التطوير والبرمجيات</option>
                <option value="management">الإدارة العامة</option>
                <option value="قسم الدعم">الدعم الفني والتشغيل</option>
                <option value="المالية">المالية والحسابات</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-700">المسمى الوظيفي الجديد</span>
              <input
                type="text"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-700">الفئة والدرجة الوظيفية</span>
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className={inputCls}
              >
                <option value="الفئة الأولى">الفئة الأولى (قيادي / إشرافي)</option>
                <option value="الفئة الثانية">الفئة الثانية (تخصصي أول)</option>
                <option value="الفئة الثالثة">الفئة الثالثة (تنفيذي)</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-700">المدير المباشر الجديد</span>
              <input
                type="text"
                value={newManager}
                onChange={(e) => setNewManager(e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-700">الراتب الأساسي الجديد (ريال)</span>
              <input
                type="number"
                value={newSalary}
                onChange={(e) => setNewSalary(Number(e.target.value))}
                className={`${inputCls} font-mono font-bold text-emerald-800`}
              />
            </label>
          </div>

          {/* Salary Diff Banner */}
          <div className={`mt-3 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold ${
            salaryDiff > 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-700"
          }`}>
            <span>الفارق المالي الشهري على الراتب:</span>
            <span className="font-mono font-extrabold text-sm">
              {salaryDiff > 0 ? `+${salaryDiff.toLocaleString()}` : salaryDiff.toLocaleString()} ريال
            </span>
          </div>

          <label className="mt-3 block">
            <span className="mb-1 block text-[11px] font-bold text-foreground/80">مبررات وأسباب القرار</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-[12px] font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-ring/25"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <Btn icon="check_circle" variant="teal" onClick={handleExecute}>
              اعتماد وتنفيذ القرار
            </Btn>
            <Btn icon="print" variant="ghost" onClick={() => window.print()}>
              طباعة القرار الرسمي A4
            </Btn>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/8 p-4">
        <MaterialIcon name="info" size={20} className="mt-0.5 text-primary" filled />
        <p className="text-[13px] font-semibold text-foreground/80">
          سيتم إشعار الموظف ومديره المباشر بعد اعتماد القرار، ويُحدَّث ملف الموظف تلقائياً من تاريخ السريان المحدد ({effectiveDate}).
        </p>
      </div>
    </div>
  );
}
