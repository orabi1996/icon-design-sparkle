import { useState, useMemo, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/admin-forms")({
  head: () => ({ meta: [{ title: "طباعة وتصميم النماذج الإدارية | التقارير" }] }),
  component: AdminFormsReport,
});

/* ─── Available Form Templates ─── */
type FormTemplate = {
  id: string;
  name: string;
  category: string;
};

const FORM_TEMPLATES: FormTemplate[] = [
  { id: "termination", name: "نموذج إخطار بإنهاء خدمات أو انتهاء العقد", category: "إنهاء الخدمة" },
  { id: "salary_cert", name: "شهادة تعريف بالراتب وتثبيت مستحقات", category: "الرواتب والمالية" },
  { id: "work_resume", name: "إشعار مباشرة عمل بعد إجازة أو تعيين", category: "المباشرات" },
  { id: "clearance", name: "مخالصة نهائية وإبراء ذمة واستلام مستحقات", category: "إنهاء الخدمة" },
  { id: "warning", name: "خطاب إنذار ولفت نظر إداري رسمي", category: "الشؤون الإدارية" },
  { id: "transfer", name: "قرار نقل أو تكليف وظيفي داخلي", category: "الشؤون الإدارية" },
  { id: "leave_request", name: "نموذج طلب وموافقة إجازة رسمية", category: "الإجازات" },
  { id: "loan_request", name: "نموذج طلب سلفة مالية وتقسيط", category: "الرواتب والمالية" },
];

function uniq(arr: string[]) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function AdminFormsReport() {
  const [activeTab, setActiveTab] = useState<"print" | "designer">("print");

  const { data: employees = [], isLoading } = useRows("employees", {
    orderBy: "emp_no",
    ascending: true,
  });

  // Filter state for Print Tab
  const [filters, setFilters] = useState({
    branch: "",
    department: "",
    mainDepartment: "",
    sector: "",
    careerPath: "",
    employeeId: "",
    formId: "termination",
  });

  const [applied, setApplied] = useState({
    branch: "",
    department: "",
    mainDepartment: "",
    sector: "",
    careerPath: "",
    employeeId: "",
    formId: "termination",
  });

  // Zoom & Page controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const printSheetRef = useRef<HTMLDivElement>(null);

  // Designer state
  const [designerForm, setDesignerForm] = useState<string>("بيانات الموظفين");
  const [designerZoom, setDesignerZoom] = useState<number>(100);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const options = useMemo(() => ({
    branches: uniq(employees.map((e) => String(e["branch"] ?? ""))),
    departments: uniq(employees.map((e) => String(e["department"] ?? ""))),
    mainDepartments: uniq(employees.map((e) => String(e["main_department"] ?? ""))),
    sectors: uniq(employees.map((e) => String(e["sector"] ?? ""))),
    careerPaths: uniq(employees.map((e) => String(e["career_path"] ?? ""))),
  }), [employees]);

  // Currently selected employee
  const selectedEmployee = useMemo(() => {
    if (!employees.length) return null;
    if (applied.employeeId) {
      return employees.find((e) => String(e["id"]) === applied.employeeId || String(e["emp_no"]) === applied.employeeId) || employees[0];
    }
    return employees[0];
  }, [employees, applied.employeeId]);

  const selectedFormTemplate = useMemo(() => {
    return FORM_TEMPLATES.find((t) => t.id === applied.formId) || FORM_TEMPLATES[0];
  }, [applied.formId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell>
      {/* Top Header with Mode Tabs (Matching Screenshots) */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3" dir="rtl">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="description" size={22} className="text-[#0070c0]" />
          طباعة وتصميم النماذج الإدارية
        </h1>

        {/* Tab Buttons (Matching Screenshot 1 & 2) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("print")}
            className={`px-4 py-1.5 rounded-md text-xs font-extrabold transition shadow-xs ${
              activeTab === "print"
                ? "bg-[#002d5a] text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            طباعة وتصميم النماذج الإداريه
          </button>
          <button
            onClick={() => setActiveTab("designer")}
            className={`px-4 py-1.5 rounded-md text-xs font-extrabold transition shadow-xs ${
              activeTab === "designer"
                ? "bg-[#002d5a] text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            تصميم النماذج الإداريه
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: PRINT & PREVIEW MODE (Matching Screenshot 1) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "print" && (
        <div>
          {/* Filter Card */}
          <div className="mb-4 rounded-xl border border-[#b4c7e7] bg-[#f0f6ff]/70 p-4 shadow-sm" dir="rtl">
            {/* Row 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
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

              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-700 text-right">القسم الرئيسي</span>
                <select
                  value={filters.mainDepartment}
                  onChange={(e) => setFilters((p) => ({ ...p, mainDepartment: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">اختر ...</option>
                  {options.mainDepartments.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-700 text-right">القطاع</span>
                <select
                  value={filters.sector}
                  onChange={(e) => setFilters((p) => ({ ...p, sector: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">اختر ...</option>
                  {options.sectors.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-700 text-right">المسار</span>
                <select
                  value={filters.careerPath}
                  onChange={(e) => setFilters((p) => ({ ...p, careerPath: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">اختر ...</option>
                  {options.careerPaths.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-700 text-right">الموظف</span>
                <select
                  value={filters.employeeId}
                  onChange={(e) => setFilters((p) => ({ ...p, employeeId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map((e) => (
                    <option key={e["id"] || e["emp_no"]} value={e["id"] || e["emp_no"]}>
                      {e["full_name"]} ({e["emp_no"]})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-700 text-right">النماذج</span>
                <select
                  value={filters.formId}
                  onChange={(e) => setFilters((p) => ({ ...p, formId: e.target.value }))}
                  className={inputCls}
                >
                  {FORM_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Search button */}
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setApplied({ ...filters })}
                className="flex items-center gap-1 rounded bg-[#0070c0] px-8 py-1.5 text-[12px] font-extrabold text-white shadow-sm hover:bg-[#005fa3] transition"
              >
                <MaterialIcon name="search" size={16} />
                بحث
              </button>
            </div>
          </div>

          {/* Document Viewer Toolbar (Matching Screenshot 1) */}
          <div className="mb-3 flex items-center justify-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200" dir="ltr">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              title="تصغير"
              className="p-1 rounded hover:bg-slate-200 text-slate-700 text-xs"
            >
              <MaterialIcon name="zoom_out" size={17} />
            </button>
            <span className="text-xs font-mono font-bold text-slate-600">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              title="تكبير"
              className="p-1 rounded hover:bg-slate-200 text-slate-700 text-xs"
            >
              <MaterialIcon name="zoom_in" size={17} />
            </button>

            <span className="h-4 w-px bg-slate-300 mx-1" />

            <button
              onClick={() => setZoomLevel(100)}
              className="text-[11px] font-bold px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
            >
              Whole Page
            </button>

            <span className="h-4 w-px bg-slate-300 mx-1" />

            <button
              onClick={handlePrint}
              title="طباعة النموذج"
              className="flex items-center gap-1 px-3 py-1 bg-[#0070c0] text-white rounded text-xs font-bold hover:bg-[#005fa3] shadow-xs"
            >
              <MaterialIcon name="print" size={15} />
              <span>طباعة</span>
            </button>

            <button
              onClick={handlePrint}
              title="حفظ كـ PDF"
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700 shadow-xs"
            >
              <MaterialIcon name="picture_as_pdf" size={15} />
              <span>PDF</span>
            </button>

            <span className="h-4 w-px bg-slate-300 mx-1" />

            <div className="flex items-center gap-1 text-xs text-slate-600 font-bold">
              <span>of 1 1</span>
            </div>
          </div>

          {/* A4 Sheet Container */}
          <div className="flex justify-center overflow-x-auto p-4 bg-slate-200/60 rounded-xl">
            <div
              ref={printSheetRef}
              style={{
                width: "210mm",
                minHeight: "297mm",
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top center",
              }}
              className="bg-white p-12 shadow-2xl rounded-sm text-slate-900 flex flex-col justify-between"
              dir="rtl"
            >
              {/* Top Document Header */}
              <div>
                <div className="flex items-center justify-between border-b-2 border-slate-300 pb-4 mb-8">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-[#004e82]">المملكة العربية السعودية</div>
                    <div className="text-xs text-slate-600 font-bold">شركة الحلول الخبيرة المحدودة</div>
                    <div className="text-[11px] text-slate-500">إدارة الموارد البشرية والشؤون الإدارية</div>
                  </div>
                  <div className="h-14 w-14 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center">
                    <MaterialIcon name="apartment" size={32} className="text-[#0070c0]" />
                  </div>
                  <div className="text-left text-[11px] text-slate-500 font-mono">
                    <div>التاريخ: {new Date().toLocaleDateString("ar-SA")}</div>
                    <div>الرقم المرجعي: ADM-{selectedEmployee?.["emp_no"] || "101"}-2026</div>
                  </div>
                </div>

                {/* Form Title Banner */}
                <div className="my-6 text-center">
                  <h2 className="inline-block bg-slate-100 border border-slate-300 px-6 py-2 rounded text-base font-extrabold text-slate-800 shadow-xs">
                    {selectedFormTemplate.name}
                  </h2>
                </div>

                {/* Employee Info Box Table (Matching Screenshot 1) */}
                <div className="my-6">
                  <table className="w-full border-collapse text-xs border-2 border-slate-400">
                    <tbody>
                      <tr className="border-b border-slate-400">
                        <td className="w-1/4 bg-slate-100 p-2 font-extrabold text-slate-700 border-l border-slate-400 text-center">
                          اسم الموظف
                        </td>
                        <td className="w-3/4 p-2 font-bold text-slate-900 text-center text-sm" colSpan={3}>
                          {selectedEmployee?.["full_name"] || "ثريا عبد القادر بن عبدالله الشامي"}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-400">
                        <td className="w-1/4 bg-slate-100 p-2 font-extrabold text-slate-700 border-l border-slate-400 text-center">
                          الوظيفة
                        </td>
                        <td className="w-1/4 p-2 font-medium text-slate-800 border-l border-slate-400 text-center">
                          {selectedEmployee?.["job_title"] || "مديرة المرحلة"}
                        </td>
                        <td className="w-1/4 bg-slate-100 p-2 font-extrabold text-slate-700 border-l border-slate-400 text-center">
                          الرقم الوظيفي
                        </td>
                        <td className="w-1/4 p-2 font-mono font-bold text-[#0070c0] text-center">
                          {selectedEmployee?.["emp_no"] || "1"}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-1/4 bg-slate-100 p-2 font-extrabold text-slate-700 border-l border-slate-400 text-center">
                          الفرع
                        </td>
                        <td className="w-1/4 p-2 font-medium text-slate-800 border-l border-slate-400 text-center">
                          {selectedEmployee?.["branch"] || "شركة الحلول الخبيرة"}
                        </td>
                        <td className="w-1/4 bg-slate-100 p-2 font-extrabold text-slate-700 border-l border-slate-400 text-center">
                          القسم
                        </td>
                        <td className="w-1/4 p-2 font-medium text-slate-800 text-center">
                          {selectedEmployee?.["department"] || "رياض الأطفال"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Form Body Text Content based on template type (Matching Screenshot 1) */}
                {selectedFormTemplate.id === "termination" && (
                  <div className="my-10 space-y-6 text-sm leading-relaxed text-slate-800 font-medium px-4 text-justify">
                    <p className="indent-6">
                      نفيدكم بإحاطتكم بقرار الشركة بإنهاء خدماتكم ( انتهاء العقد ) بالشركة وذلك بسبب:
                    </p>
                    <div className="border-b border-dashed border-slate-400 py-3 text-slate-500 font-mono text-center">
                      ...................................................................................................................................................
                    </div>
                    <p className="mt-8 text-center font-bold">
                      وننتهز هذه الفرصة بأن نشكركم على مجهوداتكم القيمة لشركتنا ونتمنى لكم التوفيق في مساعيكم المستقبلية.
                    </p>
                  </div>
                )}

                {selectedFormTemplate.id === "salary_cert" && (
                  <div className="my-8 space-y-5 text-sm leading-relaxed text-slate-800 font-medium px-4 text-justify">
                    <p className="indent-6">
                      تشهد شركة الحلول الخبيرة بأن الموظف المذكورة بياناته أعلاه يعمل لدينا بموجب عقد عمل ساري المفعول حتى تاريخه، ويتقاضى راتباً شهرياً مفصلاً كالتالي:
                    </p>
                    <div className="grid grid-cols-2 gap-4 my-4 p-4 bg-slate-50 border border-slate-300 rounded">
                      <div>الراتب الأساسي: <span className="font-bold text-[#0070c0] font-mono">{selectedEmployee?.["basic_salary"] || "8,000"} ريال</span></div>
                      <div>بدل السكن والمواصلات: <span className="font-bold text-[#0070c0] font-mono">2,500 ريال</span></div>
                      <div>إجمالي الراتب الشهري: <span className="font-bold text-emerald-700 font-mono">{Number(selectedEmployee?.["basic_salary"] || 8000) + 2500} ريال</span></div>
                      <div>تاريخ الالتحاق بالعمل: <span className="font-bold font-mono">{selectedEmployee?.["hire_date"] || "2023/01/15"}</span></div>
                    </div>
                    <p className="text-xs text-slate-500">
                      وقد أُعطيت له هذه الشهادة بناءً على طلبه لتقديمها إلى الجهات المعنية دون أدنى مسؤولية على الشركة.
                    </p>
                  </div>
                )}

                {selectedFormTemplate.id === "work_resume" && (
                  <div className="my-8 space-y-5 text-sm leading-relaxed text-slate-800 font-medium px-4 text-justify">
                    <p className="indent-6">
                      نفيدكم بأن الموظف المذكورة بياناته أعلاه قد باشر عمله الفعلي بالشركة اعتباراً من تاريخ اليوم بعد انقضاء إجازته النظامية المقررة.
                    </p>
                    <div className="p-4 bg-slate-50 border border-slate-300 rounded text-xs space-y-2">
                      <div>تاريخ المباشرة الفعلي: <span className="font-bold font-mono">{new Date().toLocaleDateString("ar-SA")}</span></div>
                      <div>موقع العمل / الإدارة: <span className="font-bold">{selectedEmployee?.["branch"]} - {selectedEmployee?.["department"]}</span></div>
                    </div>
                  </div>
                )}

                {selectedFormTemplate.id === "clearance" && (
                  <div className="my-8 space-y-4 text-sm leading-relaxed text-slate-800 font-medium px-4 text-justify">
                    <p className="indent-6">
                      أقر أنا الموقع أدناه بأنني قد استلمت كافة مستحقاتي المالية والنظامية عن فترة عملي بالشركة حتى تاريخ إخلاء الطرف، وليس لي أي مطالبات مالية أو عينية لدى الشركة.
                    </p>
                    <div className="border border-slate-300 p-3 rounded bg-slate-50 text-xs">
                      تم تسليم العهد والأجهزة وبطاقة العمل وإلغاء كافة الصلاحيات.
                    </div>
                  </div>
                )}
              </div>

              {/* Document Signatures Footer (Official Stamp & Signatures) */}
              <div className="border-t-2 border-slate-300 pt-6 mt-12">
                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  <div>
                    <div className="font-extrabold text-slate-700 mb-10">إدارة الموارد البشرية</div>
                    <div className="text-[11px] text-slate-400">التوقيع: .....................</div>
                  </div>

                  <div>
                    <div className="font-extrabold text-slate-700 mb-10">الختم الرسمي</div>
                    <div className="h-16 w-16 mx-auto rounded-full border-2 border-dashed border-[#0070c0]/40 flex items-center justify-center text-[10px] text-[#0070c0] font-bold">
                      ختم الشركة
                    </div>
                  </div>

                  <div>
                    <div className="font-extrabold text-slate-700 mb-10">المدير العام / المفوض</div>
                    <div className="text-[11px] text-slate-400">التوقيع: .....................</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: FORM DESIGNER MODE (Matching Screenshot 2 - XtraReport Studio) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "designer" && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 overflow-hidden shadow-sm" dir="rtl">
          {/* Designer Top Bar */}
          <div className="flex items-center justify-between bg-[#004e82] text-white px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold">النماذج الافتراضية:</span>
              <select
                value={designerForm}
                onChange={(e) => setDesignerForm(e.target.value)}
                className="h-7 rounded bg-white text-slate-800 px-2 text-xs font-bold outline-none"
              >
                <option value="بيانات الموظفين">بيانات الموظفين</option>
                <option value="خطاب إنهاء خدمة">خطاب إنهاء خدمة</option>
                <option value="شهادة راتب">شهادة تعريف بالراتب</option>
                <option value="مباشرة عمل">إشعار مباشرة عمل</option>
                <option value="طلب إجازة">طلب إجازة رسمية</option>
              </select>
              <button className="flex items-center gap-1 bg-[#0070c0] hover:bg-[#005fa3] text-white px-3 py-1 rounded text-xs font-bold transition shadow-xs">
                <MaterialIcon name="visibility" size={14} />
                <span>عرض</span>
              </button>
            </div>

            <div className="flex items-center gap-2" dir="ltr">
              <button
                onClick={() => setDesignerZoom((z) => Math.max(50, z - 10))}
                className="p-1 hover:bg-white/20 rounded text-xs"
                title="تصغير"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold">{designerZoom}%</span>
              <button
                onClick={() => setDesignerZoom((z) => Math.min(150, z + 10))}
                className="p-1 hover:bg-white/20 rounded text-xs"
                title="تكبير"
              >
                +
              </button>
              <span className="h-4 w-px bg-white/30 mx-1" />
              <button className="p-1 hover:bg-white/20 rounded" title="حفظ"><MaterialIcon name="save" size={16} /></button>
              <button className="p-1 hover:bg-white/20 rounded" title="تراجع"><MaterialIcon name="undo" size={16} /></button>
              <button className="p-1 hover:bg-white/20 rounded" title="إعادة"><MaterialIcon name="redo" size={16} /></button>
            </div>
          </div>

          {/* Designer Main Studio Workspace */}
          <div className="grid grid-cols-12 min-h-[560px] bg-slate-200">
            {/* Left Column: Properties Panel (DevExpress XtraReport Style) */}
            <div className="col-span-3 bg-white border-l border-slate-300 flex flex-col text-right text-xs">
              <div className="bg-slate-100 border-b border-slate-300 p-2 flex items-center justify-between font-bold text-slate-700">
                <span>PROPERTIES</span>
                <span className="text-[10px] text-slate-400 font-mono">XtraReport</span>
              </div>

              {/* Properties Accordions */}
              <div className="p-3 space-y-3 overflow-y-auto max-h-[500px]">
                <div>
                  <div className="font-extrabold text-[#004e82] mb-1 text-[11px]">DATA</div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Data Source:</span>
                      <span className="font-bold text-slate-800 font-mono">employees_db</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Data Member:</span>
                      <span className="font-bold text-slate-800 font-mono">employees</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Filter String:</span>
                      <span className="font-bold text-slate-800 font-mono">[status] == 'نشط'</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2">
                  <div className="font-extrabold text-[#004e82] mb-1 text-[11px]">PAGE SETTINGS</div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Paper Kind:</span>
                      <span className="font-bold text-slate-800">A4</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Landscape:</span>
                      <span className="font-bold text-slate-800">False</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Margins:</span>
                      <span className="font-bold text-slate-800 font-mono">10, 10, 10, 10 mm</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2">
                  <div className="font-extrabold text-[#004e82] mb-1 text-[11px]">APPEARANCE</div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Font:</span>
                      <span className="font-bold text-slate-800 font-mono">Cairo, 10pt</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Text Alignment:</span>
                      <span className="font-bold text-slate-800">Right</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column: Design Canvas with Grid & Bands */}
            <div className="col-span-8 p-6 flex justify-center items-start overflow-auto">
              <div
                style={{
                  width: "180mm",
                  minHeight: "240mm",
                  transform: `scale(${designerZoom / 100})`,
                  transformOrigin: "top center",
                }}
                className="bg-white border-2 border-slate-400 shadow-xl relative"
              >
                {/* Top Ruler */}
                <div className="h-5 bg-amber-100/70 border-b border-slate-300 flex items-center justify-between px-2 text-[9px] font-mono text-slate-600 select-none">
                  <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
                </div>

                {/* Canvas Grid Area with Report Bands */}
                <div
                  className="p-4 min-h-[400px] flex flex-col justify-between"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                >
                  {/* Band 1: TopMargin1 */}
                  <div className="border-b-2 border-dashed border-teal-500 pb-4 mb-4 relative">
                    <span className="absolute -left-3 top-0 bg-teal-600 text-white text-[9px] font-bold px-1 py-0.5 rounded rotate-90 origin-top-left">
                      TopMargin
                    </span>
                    <div className="h-12 border border-dashed border-slate-400 rounded flex items-center justify-center text-xs text-slate-400 font-bold">
                      [ترويسة النموذج / الشعار]
                    </div>
                  </div>

                  {/* Band 2: Detail1 */}
                  <div className="border-b-2 border-dashed border-blue-500 py-6 mb-4 relative">
                    <span className="absolute -left-3 top-0 bg-blue-600 text-white text-[9px] font-bold px-1 py-0.5 rounded rotate-90 origin-top-left">
                      Detail
                    </span>
                    <div className="space-y-3">
                      <div className="h-8 border border-dashed border-[#0070c0] bg-blue-50/50 rounded flex items-center justify-center text-xs font-bold text-[#0070c0]">
                        [جدول بيانات الموظف: اسم الموظف، الرقم الوظيفي، الفرع، القسم]
                      </div>
                      <div className="h-20 border border-dashed border-slate-400 rounded p-2 text-xs text-slate-500">
                        [نص الخطاب الإداري الرسمي / المتغيرات الديناميكية]
                      </div>
                    </div>
                  </div>

                  {/* Band 3: BottomMargin1 */}
                  <div className="pt-4 relative">
                    <span className="absolute -left-3 top-0 bg-purple-600 text-white text-[9px] font-bold px-1 py-0.5 rounded rotate-90 origin-top-left">
                      BottomMargin
                    </span>
                    <div className="h-10 border border-dashed border-slate-400 rounded flex items-center justify-center text-xs text-slate-400 font-bold">
                      [التوقيعات / الأختام / التذييل]
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Toolbox Palette (Matching Screenshot 2) */}
            <div className="col-span-1 bg-white border-r border-slate-300 flex flex-col items-center py-3 gap-2 text-slate-700">
              {[
                { id: "text", icon: "title", label: "Label (A)" },
                { id: "checkbox", icon: "check_box", label: "CheckBox" },
                { id: "image", icon: "image", label: "PictureBox" },
                { id: "table", icon: "table_chart", label: "Table" },
                { id: "line", icon: "horizontal_rule", label: "Line" },
                { id: "shape", icon: "crop_square", label: "Shape" },
                { id: "barcode", icon: "qr_code", label: "BarCode" },
                { id: "chart", icon: "bar_chart", label: "Chart" },
                { id: "gauge", icon: "speed", label: "Gauge" },
                { id: "page_info", icon: "info", label: "PageInfo" },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  title={tool.label}
                  className={`h-8 w-8 rounded flex items-center justify-center transition ${
                    selectedTool === tool.id
                      ? "bg-[#0070c0] text-white shadow-xs"
                      : "hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <MaterialIcon name={tool.icon} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Designer Bottom Status Bar */}
          <div className="bg-slate-800 text-slate-300 px-4 py-1 text-[11px] font-mono flex items-center justify-between">
            <span>XtraReport Designer Studio - Administrative Forms</span>
            <span>Ready</span>
          </div>
        </div>
      )}

      {/* Copyright Footer */}
      <div className="mt-8 text-center text-xs font-bold text-slate-400 border-t border-slate-200 pt-4">
        جميع الحقوق محفوظة © الحلول الخبيرة
      </div>
    </AppShell>
  );
}
