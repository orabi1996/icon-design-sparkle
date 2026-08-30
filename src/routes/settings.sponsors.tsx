import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/settings/sponsors")({
  head: () => ({ meta: [{ title: "تهيئة بيانات الكفلاء والمنشآت التابعة | إعدادات النظام" }] }),
  component: SponsorsSettingsPage,
});

type SponsorItem = {
  id: string;
  code: string;
  name: string;
  sponsor_type: "شركة تابعة" | "مؤسسة فردية" | "كفيل فردي";
  id_or_cr: string;
  mol_700: string;
  phone: string;
  email: string;
  sponsored_count: number;
  status: "نشط" | "معلق";
};

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function SponsorsSettingsPage() {
  const { data: employees = [] } = useRows("employees");

  const [sponsors, setSponsors] = useState<SponsorItem[]>([
    {
      id: "sp-1",
      code: "SP-001",
      name: "شركة الحلول الخبيرة لتقنية المعلومات",
      sponsor_type: "شركة تابعة",
      id_or_cr: "1010789456",
      mol_700: "7001984251",
      phone: "0112345678",
      email: "info@expert-hr.sa",
      sponsored_count: 22,
      status: "نشط",
    },
    {
      id: "sp-2",
      code: "SP-002",
      name: "مؤسسة الحلول المتقدمة للخدمات التجارية",
      sponsor_type: "مؤسسة فردية",
      id_or_cr: "1010654321",
      mol_700: "7001889922",
      phone: "0118765432",
      email: "advanced@expert-hr.sa",
      sponsored_count: 8,
      status: "نشط",
    },
    {
      id: "sp-3",
      code: "SP-003",
      name: "مجموعة الخبراء للتشغيل والصيانة",
      sponsor_type: "شركة تابعة",
      id_or_cr: "1010332211",
      mol_700: "7001776655",
      phone: "0119988776",
      email: "maintenance@expert-hr.sa",
      sponsored_count: 5,
      status: "نشط",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [newSponsor, setNewSponsor] = useState({
    code: "",
    name: "",
    sponsor_type: "شركة تابعة" as SponsorItem["sponsor_type"],
    id_or_cr: "",
    mol_700: "",
    phone: "",
    email: "",
    status: "نشط" as "نشط" | "معلق",
  });

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return sponsors;
    const q = searchQuery.toLowerCase();
    return sponsors.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.id_or_cr.includes(q) ||
        s.mol_700.includes(q)
    );
  }, [sponsors, searchQuery]);

  const handleOpenAdd = () => {
    setEditingSponsor(null);
    setNewSponsor({
      code: `SP-00${sponsors.length + 1}`,
      name: "",
      sponsor_type: "شركة تابعة",
      id_or_cr: "",
      mol_700: "",
      phone: "",
      email: "",
      status: "نشط",
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!newSponsor.name.trim()) return;

    if (editingSponsor) {
      setSponsors((prev) =>
        prev.map((s) => (s.id === editingSponsor.id ? { ...s, ...newSponsor } : s))
      );
    } else {
      const item: SponsorItem = {
        id: `sp-${Date.now()}`,
        ...newSponsor,
        sponsored_count: 0,
      };
      setSponsors((prev) => [...prev, item]);
    }
    setIsModalOpen(false);
  };

  /* ─── Export ─── */
  const exportExcel = () => {
    const headers = ["كود الكفيل", "اسم الكفيل / المنشأة", "النوع", "السجل / الهوية", "الرقم الموحد 700", "الهاتف", "البريد", "عدد المكفولين", "الحالة"];
    const data = filtered.map((s) => [
      s.code, s.name, s.sponsor_type, s.id_or_cr, s.mol_700, s.phone, s.email, s.sponsored_count, s.status
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الكفلاء والمنشآت");
    XLSX.writeFile(wb, "دليل-الكفلاء-والمنشآت-التابعة.xlsx");
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="supervised_user_circle" size={22} className="text-[#0070c0]" />
          تهيئة بيانات الكفلاء والمنشآت التابعة
        </h1>
        <div className="text-[11px] text-slate-400">إعدادات النظام / إعدادات أخرى / تهيئة الكفلاء</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الكفلاء والمنشآت</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{sponsors.length} سجلات</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">الكفلاء النشطون</div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{sponsors.filter((s) => s.status === "نشط").length} كفيل</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي العمالة المقيدة</div>
          <div className="text-lg font-extrabold text-indigo-700 font-mono mt-1">{sponsors.reduce((sum, s) => sum + s.sponsored_count, 0)} موظف</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">الربط مع منصة قوى ومقيم</div>
          <div className="text-lg font-extrabold text-purple-700 font-mono mt-1">متزامن ومطابق</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200" dir="rtl">
        <div className="relative">
          <input
            type="text"
            placeholder="البحث بالاسم، الكود، السجل، الرقم الموحد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-72 rounded border border-slate-300 bg-white pe-7 ps-2 text-[11px] font-medium outline-none focus:border-[#0070c0]"
          />
          <MaterialIcon name="search" size={16} className="pointer-events-none absolute left-2 top-2 text-slate-400" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-1 rounded bg-[#0070c0] h-8 px-4 text-xs font-bold text-white shadow-xs hover:bg-[#005fa3] transition"
          >
            <MaterialIcon name="add" size={16} />
            إضافة كفيل جديد
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
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-right">اسم الكفيل / المنشأة</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">النوع</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">رقم السجل / الهوية</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">الرقم الموحد 700</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">الهاتف</th>
              <th className="px-3 py-2 font-extrabold border-r border-[#00385e] text-left">البريد الإلكتروني</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center bg-[#00385e]">عدد المكفولين</th>
              <th className="px-2.5 py-2 font-extrabold border-r border-[#00385e] text-center">الحالة</th>
              <th className="px-2.5 py-2 font-extrabold text-center">إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((s, idx) => (
              <tr
                key={s.id}
                className={`border-b border-slate-200 transition hover:bg-blue-50/70 ${
                  idx % 2 === 0 ? "bg-white" : "bg-[#f8fafd]"
                }`}
              >
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0]">{s.code}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-right font-bold text-slate-800">{s.name}</td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center text-slate-700">{s.sponsor_type}</td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{s.id_or_cr}</td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-700">{s.mol_700}</td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono text-slate-600">{s.phone}</td>
                <td className="px-3 py-1.5 border-r border-slate-200 text-left font-mono text-xs text-slate-600">{s.email}</td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0]">{s.sponsored_count} موظف</td>
                <td className="px-2.5 py-1.5 border-r border-slate-200 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.status === "نشط" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-2.5 py-1.5 text-center">
                  <button
                    onClick={() => {
                      setEditingSponsor(s);
                      setNewSponsor({ ...s });
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
                <MaterialIcon name="supervised_user_circle" size={18} className="text-[#0070c0]" />
                {editingSponsor ? "تعديل بيانات الكفيل" : "إضافة كفيل أو منشأة راعية جديدة"}
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
                <span className="text-xs font-bold text-slate-700">كود الكفيل *</span>
                <input
                  type="text"
                  value={newSponsor.code}
                  onChange={(e) => setNewSponsor((p) => ({ ...p, code: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">نوع الكفيل</span>
                <select
                  value={newSponsor.sponsor_type}
                  onChange={(e) => setNewSponsor((p) => ({ ...p, sponsor_type: e.target.value as any }))}
                  className={inputCls}
                >
                  <option value="شركة تابعة">شركة تابعة</option>
                  <option value="مؤسسة فردية">مؤسسة فردية</option>
                  <option value="كفيل فردي">كفيل فردي</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold text-slate-700">اسم الكفيل / المنشأة *</span>
                <input
                  type="text"
                  value={newSponsor.name}
                  onChange={(e) => setNewSponsor((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">رقم السجل / الهوية الوطنية</span>
                <input
                  type="text"
                  value={newSponsor.id_or_cr}
                  onChange={(e) => setNewSponsor((p) => ({ ...p, id_or_cr: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">الرقم الموحد (700)</span>
                <input
                  type="text"
                  value={newSponsor.mol_700}
                  onChange={(e) => setNewSponsor((p) => ({ ...p, mol_700: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">رقم الهاتف</span>
                <input
                  type="text"
                  value={newSponsor.phone}
                  onChange={(e) => setNewSponsor((p) => ({ ...p, phone: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">البريد الإلكتروني</span>
                <input
                  type="email"
                  value={newSponsor.email}
                  onChange={(e) => setNewSponsor((p) => ({ ...p, email: e.target.value }))}
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
                حفظ الكفيل
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
