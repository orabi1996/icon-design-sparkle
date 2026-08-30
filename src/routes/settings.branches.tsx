import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/settings/branches")({
  head: () => ({ meta: [{ title: "تهيئة بيانات الفروع | إعدادات النظام" }] }),
  component: BranchesSettingsPage,
});

type BranchItem = {
  id: string;
  code: string;
  name: string;
  city: string;
  district: string;
  manager_name: string;
  phone: string;
  email: string;
  employee_count: number;
  status: "نشط" | "غير نشط";
};

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function BranchesSettingsPage() {
  const { data: employees = [] } = useRows("employees");

  const [branches, setBranches] = useState<BranchItem[]>([
    {
      id: "br-1",
      code: "BR-01",
      name: "شركة الحلول الخبيرة - المقر الرئيسي",
      city: "الرياض",
      district: "حي الملقا",
      manager_name: "أشرف عرابي",
      phone: "0112345678",
      email: "riyadh@expert-hr.sa",
      employee_count: 24,
      status: "نشط",
    },
    {
      id: "br-2",
      code: "BR-02",
      name: "شركة الحلول ٢ - فرع المنطقة الغربية",
      city: "جدة",
      district: "حي الروضة",
      manager_name: "م. حسام الشريف",
      phone: "0123456789",
      email: "jeddah@expert-hr.sa",
      employee_count: 8,
      status: "نشط",
    },
    {
      id: "br-3",
      code: "BR-03",
      name: "فرع المنطقة الشرقية",
      city: "الدمام",
      district: "حي الشاطئ",
      manager_name: "أ. فيصل الدوسري",
      phone: "0134567890",
      email: "dammam@expert-hr.sa",
      employee_count: 5,
      status: "نشط",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [newBranch, setNewBranch] = useState({
    code: "",
    name: "",
    city: "الرياض",
    district: "",
    manager_name: "",
    phone: "",
    email: "",
    status: "نشط" as "نشط" | "غير نشط",
  });

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return branches;
    const q = searchQuery.toLowerCase();
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.manager_name.toLowerCase().includes(q)
    );
  }, [branches, searchQuery]);

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setNewBranch({
      code: `BR-0${branches.length + 1}`,
      name: "",
      city: "الرياض",
      district: "",
      manager_name: "",
      phone: "",
      email: "",
      status: "نشط",
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!newBranch.name.trim()) return;

    if (editingBranch) {
      setBranches((prev) =>
        prev.map((b) => (b.id === editingBranch.id ? { ...b, ...newBranch } : b))
      );
    } else {
      const item: BranchItem = {
        id: `br-${Date.now()}`,
        ...newBranch,
        employee_count: 0,
      };
      setBranches((prev) => [...prev, item]);
    }
    setIsModalOpen(false);
  };

  /* ─── Export ─── */
  const exportExcel = () => {
    const headers = ["كود الفرع", "اسم الفرع", "المدينة", "الحي", "مدير الفرع", "الهاتف", "البريد الإلكتروني", "عدد الموظفين", "الحالة"];
    const data = filtered.map((b) => [
      b.code, b.name, b.city, b.district, b.manager_name, b.phone, b.email, b.employee_count, b.status
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "فروع الشركة");
    XLSX.writeFile(wb, "دليل-فروع-الشركة.xlsx");
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="store" size={22} className="text-[#0070c0]" />
          تهيئة وإدارة بيانات فروع المنشأة
        </h1>
        <div className="text-[11px] text-slate-400">إعدادات النظام / تهيئة بيانات الشركات والفروع / بيانات الفروع</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الفروع المسجلة</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{branches.length} فروع</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">الفروع النشطة العاملة</div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{branches.filter((b) => b.status === "نشط").length} فرع</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">تغطية المدن والمناطق</div>
          <div className="text-lg font-extrabold text-indigo-700 font-mono mt-1">3 مدن رئيسية</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي موظفي الفروع</div>
          <div className="text-lg font-extrabold text-purple-700 font-mono mt-1">{employees.length || 37} موظف</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200" dir="rtl">
        <div className="relative">
          <input
            type="text"
            placeholder="البحث بالاسم، الكود، المدينة، المدير..."
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
            إضافة فرع جديد
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

      {/* Branches Table */}
      <div className="overflow-x-auto rounded-lg border border-[#004e82]/30 shadow-xs" dir="rtl">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#004e82] text-white">
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">كود الفرع</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right">اسم الفرع</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-right">المدينة والحي</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right">مدير الفرع</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">هاتف الفرع</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-left">البريد الإلكتروني</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center bg-[#00385e]">الموظفين</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">الحالة</th>
              <th className="px-2.5 py-2 font-extrabold text-center">إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((b, idx) => (
              <tr
                key={b.id}
                className={`border-b border-slate-200 transition hover:bg-blue-50/70 ${
                  idx % 2 === 0 ? "bg-white" : "bg-[#f8fafd]"
                }`}
              >
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0]">{b.code}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-right font-bold text-slate-800">{b.name}</td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-right text-slate-700">{b.city} - {b.district}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-right font-medium text-slate-800">{b.manager_name}</td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-600">{b.phone}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-left font-mono text-xs text-slate-600">{b.email}</td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0]">{b.employee_count} موظف</td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    b.status === "نشط" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-2.5 py-1.5 text-center">
                  <button
                    onClick={() => {
                      setEditingBranch(b);
                      setNewBranch({ ...b });
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
                <MaterialIcon name="store" size={18} className="text-[#0070c0]" />
                {editingBranch ? "تعديل بيانات الفرع" : "إضافة فرع جديد للمنشأة"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">كود الفرع *</span>
                <input
                  type="text"
                  value={newBranch.code}
                  onChange={(e) => setNewBranch((p) => ({ ...p, code: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">اسم الفرع *</span>
                <input
                  type="text"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">المدينة</span>
                <input
                  type="text"
                  value={newBranch.city}
                  onChange={(e) => setNewBranch((p) => ({ ...p, city: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">الحي والشارع</span>
                <input
                  type="text"
                  value={newBranch.district}
                  onChange={(e) => setNewBranch((p) => ({ ...p, district: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">مدير الفرع</span>
                <input
                  type="text"
                  value={newBranch.manager_name}
                  onChange={(e) => setNewBranch((p) => ({ ...p, manager_name: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">هاتف الفرع</span>
                <input
                  type="text"
                  value={newBranch.phone}
                  onChange={(e) => setNewBranch((p) => ({ ...p, phone: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold text-slate-700">البريد الإلكتروني للفرع</span>
                <input
                  type="email"
                  value={newBranch.email}
                  onChange={(e) => setNewBranch((p) => ({ ...p, email: e.target.value }))}
                  className={`${inputCls} text-left`}
                />
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
                حفظ الفرع
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
