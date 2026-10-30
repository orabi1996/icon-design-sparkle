import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Card,
  DataTable,
  Field,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";
import { useRows, useSaveRow } from "@/lib/hr-db";

export const Route = createFileRoute("/staff/manager")({
  head: () => ({
    meta: [
      { title: "تغيير المدير المباشر | شؤون الموظفين" },
      {
        name: "description",
        content:
          "إضافة أو تغيير أو إزالة المدير المباشر للموظفين، مع الرفع الجماعي عبر ملف إكسل وأرشيف تغييرات المدير المباشر.",
      },
      { property: "og:title", content: "تغيير المدير المباشر | شؤون الموظفين" },
      { property: "og:description", content: "إدارة المدير المباشر للموظفين والرفع الجماعي وأرشيف التغييرات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerPage,
});

const opts = {
  branch: ["اختر ....", "شركة الحلول الخبيرة", "فرع جدة", "فرع الدمام"],
  dept: ["اختر ....", "management", "قسم الدعم", "التطوير"],
  main: ["اختر ....", "الإدارة العامة", "العمليات", "التقنية"],
  path: ["اختر ....", "المسار الإداري", "المسار التقني"],
  sector: ["اختر ....", "قطاع الأعمال", "قطاع الخدمات"],
  emp: ["اختر ....", "أشرف محمود عرابي", "خالد عبدالعزيز حسن", "عاصم خالد عاصم"],
  mgr: ["اختر ....", "محمد شعبان عبدالحميد", "رضوى مصطفى عبدالعزيز", "جوليا حسين سيد"],
};

const archive = [
  { n: "أشرف محمود عرابي", o: "—", m: "محمد شعبان عبدالحميد", t: "٢٠٢٥/٠٥/٠٦" },
  { n: "خالد عبدالعزيز حسن", o: "محمد شعبان عبدالحميد", m: "رضوى مصطفى عبدالعزيز", t: "٢٠٢٥/٠٧/٢٣" },
  { n: "عاصم خالد عاصم", o: "رضوى مصطفى عبدالعزيز", m: "جوليا حسين سيد", t: "٢٠٢٦/٠٥/١٧" },
];

const views = [
  { key: "add", label: "إضافة مدير مباشر للموظف", icon: "person_add" },
  { key: "change", label: "تغيير المدير المباشر", icon: "edit_square" },
];

function Panel({ title, children, open = true }: { title: string; children?: React.ReactNode; open?: boolean }) {
  const [on, setOn] = useState(open);
  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-card"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <button
        onClick={() => setOn(!on)}
        className="flex w-full items-center gap-3 bg-primary px-5 py-3.5 text-primary-foreground"
      >
        <span className="text-sm font-extrabold">{title}</span>
        <MaterialIcon name={on ? "expand_less" : "expand_more"} size={20} className="ms-auto" />
      </button>
      {on && <div className="p-5">{children}</div>}
    </section>
  );
}

function ManagerPage() {
  const [view, setView] = useState("add");
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedMgr, setSelectedMgr] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const employeesQuery = useRows("employees", { limit: 5000 });
  const saveEmployee = useSaveRow("employees");

  const employees = employeesQuery.data ?? [];
  const empOptions = ["اختر ....", ...employees.map((e) => String(e["full_name"] || e["emp_no"]))];
  const mgrOptions = ["اختر ....", ...employees.map((e) => String(e["full_name"] || e["emp_no"]))];

  const handleSaveDirect = async () => {
    if (!selectedEmp || selectedEmp === "اختر ....") {
      toast.error("يرجى اختيار الموظف");
      return;
    }
    const emp = employees.find(
      (e) => String(e["full_name"] || e["emp_no"]) === selectedEmp,
    );
    if (!emp) return;

    const mgr = selectedMgr === "اختر ...." ? "" : selectedMgr;
    await saveEmployee.mutateAsync({
      id: emp["id"],
      emp_no: emp["emp_no"],
      manager_name: mgr,
    });
    toast.success(mgr ? `تم تعيين ${mgr} كمدير مباشر بنجاح` : "تم إزالة المدير المباشر");
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const headers = ["الرقم الوظيفي للموظف", "اسم الموظف", "الرقم الوظيفي للمدير", "اسم المدير المباشر"];
    const sampleRows = employees.slice(0, 5).map((e, idx) => [
      e["emp_no"] || "",
      e["full_name"] || "",
      employees[idx + 1]?.["emp_no"] || "",
      employees[idx + 1]?.["full_name"] || "",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المدير المباشر");
    XLSX.writeFile(wb, "نموذج_تحديث_المدير_المباشر.xlsx");
    toast.success("تم تنزيل نموذج المدير المباشر بنجاح");
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0] || ""];
      if (!sheet) throw new Error("لم يتم العثور على ورقة بيانات");
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
      if (matrix.length < 2) throw new Error("الملف لا يحتوي على بيانات صالحة");
      const dataRows = matrix.slice(1).filter((r) => r.some((c) => String(c).trim()));

      const empByNo = new Map(employees.map((e) => [String(e["emp_no"] || "").trim(), e]));
      const empByName = new Map(employees.map((e) => [String(e["full_name"] || "").trim(), e]));

      let updatedCount = 0;
      for (const row of dataRows) {
        const empNo = String(row[0] || "").trim();
        const empName = String(row[1] || "").trim();
        const mgrName = String(row[3] || row[2] || "").trim();

        const emp = empByNo.get(empNo) || empByName.get(empName);
        if (emp && mgrName) {
          await saveEmployee.mutateAsync({
            id: emp["id"],
            emp_no: emp["emp_no"],
            manager_name: mgrName,
          });
          updatedCount++;
        }
      }
      toast.success(`تم استيراد الملف وتحديث المدير المباشر لـ ${updatedCount} موظف بنجاح`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل استيراد الملف");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["عمليات شؤون الموظفين", "شؤون الموظفين", "تغيير المدير المباشر"]} />
      <PageBanner
        icon="supervisor_account"
        title="تغيير المدير المباشر"
        subtitle="ربط الموظفين بمديريهم المباشرين وتحديث الهيكل التنظيمي"
        actions={
          <Btn icon="account_tree" variant="onDark">
            الهيكل التنظيمي
          </Btn>
        }
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-4">
          <Panel title={view === "add" ? "إضافة مدير مباشر من النظام" : "تغيير المدير المباشر"}>
            <div className="rounded-2xl border border-border bg-secondary/40 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-[13px] font-extrabold">
                <MaterialIcon name="badge" size={18} className="text-primary" filled />
                بيانات الموظف التنظيمية
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="اسم الموظف" required>
                  <select
                    value={selectedEmp}
                    onChange={(e) => setSelectedEmp(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-[12px] font-semibold outline-none focus:border-primary"
                  >
                    {empOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="المدير المباشر" required={view === "add"}>
                  <select
                    value={selectedMgr}
                    onChange={(e) => setSelectedMgr(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-[12px] font-semibold outline-none focus:border-primary"
                  >
                    {mgrOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Btn
                  icon={view === "add" ? "person_add" : "sync"}
                  variant="teal"
                  onClick={handleSaveDirect}
                >
                  {view === "add" ? "إضافة مدير مباشر للموظف" : "تغيير المدير المباشر"}
                </Btn>
                {view === "change" && (
                  <button
                    onClick={() => {
                      setSelectedMgr("");
                      handleSaveDirect();
                    }}
                    className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-2.5 text-[13px] font-bold text-destructive transition-colors hover:bg-destructive/15 cursor-pointer"
                  >
                    <MaterialIcon name="close" size={18} />
                    إزالة المدير المباشر
                  </button>
                )}
              </div>
            </div>
          </Panel>

          {view === "add" ? (
            <Panel title="إضافة مدير مباشر عن طريق ملف إكسل" open={false}>
              <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-card/70 px-4 py-8 transition-colors hover:border-primary/60 hover:bg-card">
                  <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                    <MaterialIcon name="cloud_upload" size={24} filled />
                  </span>
                  <span className="text-[13px] font-bold">
                    {uploading ? "جاري معالجة الملف..." : "اسحب ملف الإكسل هنا أو اضغط للاختيار"}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    الصيغ المدعومة: XLSX · XLS · CSV — حتى ١٠ ميجابايت
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f);
                    }}
                  />
                </label>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Btn
                    icon="upload"
                    variant="teal"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    رفع ملف إكسل
                  </Btn>
                  <Btn
                    icon="download"
                    variant="ghost"
                    onClick={handleDownloadTemplate}
                  >
                    تحميل نموذج إكسل
                  </Btn>
                </div>
              </div>
            </Panel>
          ) : (
            <Panel title="أرشيف المدير المباشر" open={false}>
              <div className="overflow-hidden rounded-2xl border border-border">
                <TableToolbar title="سجل التغييرات" />
                <DataTable
                  columns={["اسم الموظف", "المدير السابق", "المدير الجديد", "تاريخ التغيير", "اسم المستخدم"]}
                  rows={archive.map((r) => ({
                    "اسم الموظف": r.n,
                    "المدير السابق": r.o,
                    "المدير الجديد": r.m,
                    "تاريخ التغيير": r.t,
                    "اسم المستخدم": "System Admin",
                  }))}
                />
                <Pager page={1} pages={1} total={archive.length} />
              </div>
            </Panel>
          )}
        </div>

        <aside
          className="h-fit overflow-hidden rounded-2xl border border-border bg-card lg:sticky lg:top-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="flex items-center gap-2 border-b border-border px-4 py-3.5 text-sm font-bold">
            <MaterialIcon name="supervisor_account" size={19} className="text-primary" filled />
            تغيير المدير المباشر
          </h2>
          <nav className="space-y-1 p-2">
            {views.map((v) => {
              const on = v.key === view;
              return (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-bold transition-colors ${
                    on ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  <MaterialIcon name={v.icon} size={18} filled={on} className={on ? "" : "text-primary"} />
                  <span className="text-start">{v.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}
