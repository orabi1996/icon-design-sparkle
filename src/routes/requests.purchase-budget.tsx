import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";

export const Route = createFileRoute("/requests/purchase-budget")({
  head: () => ({ meta: [{ title: "ميزانية الشراء والتعاميد المالية | الطلبات" }] }),
  component: PurchaseBudgetPage,
});

type BudgetItem = {
  id: string;
  department: string;
  category: string;
  allocated_budget: number;
  spent_amount: number;
  committed_amount: number;
  remaining_budget: number;
  utilization_rate: number;
  fiscal_year: string;
  status: "متاح" | "قارب على النفاد" | "تجاوز الميزانية";
};

type PurchaseRequestItem = {
  id: string;
  po_no: string;
  department: string;
  item_desc: string;
  vendor: string;
  amount: number;
  requester: string;
  request_date: string;
  status: "معتمد ومصروف" | "تحت الاعتماد" | "مرفوض";
};

const inputCls =
  "h-8 w-full rounded border border-[#b4c7e7] bg-white px-2.5 text-[12px] font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-1 focus:ring-[#0070c0]/20";

function PurchaseBudgetPage() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([
    {
      id: "bgt-1",
      department: "التطوير والبرمجيات",
      category: "تراخيص برمجية وسيرفرات سحابية",
      allocated_budget: 150000,
      spent_amount: 95000,
      committed_amount: 20000,
      remaining_budget: 35000,
      utilization_rate: 76.6,
      fiscal_year: "2025",
      status: "متاح",
    },
    {
      id: "bgt-2",
      department: "إدارة الموارد البشرية",
      category: "برامج تدريبية وتطوير كوادر",
      allocated_budget: 80000,
      spent_amount: 68000,
      committed_amount: 8000,
      remaining_budget: 4000,
      utilization_rate: 95.0,
      fiscal_year: "2025",
      status: "قارب على النفاد",
    },
    {
      id: "bgt-3",
      department: "الخدمات المساندة والمشتريات",
      category: "قرطاسية وأجهزة مكتبية وضيافة",
      allocated_budget: 60000,
      spent_amount: 32000,
      committed_amount: 5000,
      remaining_budget: 23000,
      utilization_rate: 61.6,
      fiscal_year: "2025",
      status: "متاح",
    },
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseRequestItem[]>([
    {
      id: "po-1",
      po_no: "PO-2025-0101",
      department: "التطوير والبرمجيات",
      item_desc: "تجديد اشتراك سيرفرات Cloudflare السنوية",
      vendor: "Cloudflare Inc.",
      amount: 18500,
      requester: "م. سعد الشمري",
      request_date: "2025/05/10",
      status: "معتمد ومصروف",
    },
    {
      id: "po-2",
      po_no: "PO-2025-0102",
      department: "إدارة الموارد البشرية",
      item_desc: "حجز قاعة تدريبية لبرنامج القيادة الاحترافية",
      vendor: "فندق ماريوت الرياض",
      amount: 12000,
      requester: "سارة العتيبي",
      request_date: "2025/05/15",
      status: "تحت الاعتماد",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPO, setNewPO] = useState({
    department: "التطوير والبرمجيات",
    item_desc: "",
    vendor: "",
    amount: 0,
    requester: "أشرف عرابي",
  });

  const totals = useMemo(() => {
    return budgets.reduce(
      (acc, b) => {
        acc.allocated += b.allocated_budget;
        acc.spent += b.spent_amount;
        acc.remaining += b.remaining_budget;
        return acc;
      },
      { allocated: 0, spent: 0, remaining: 0 }
    );
  }, [budgets]);

  const handleSavePO = () => {
    if (!newPO.item_desc.trim() || newPO.amount <= 0) return;

    const item: PurchaseRequestItem = {
      id: `po-${Date.now()}`,
      po_no: `PO-2025-0${purchaseOrders.length + 101}`,
      ...newPO,
      request_date: new Date().toISOString().slice(0, 10).replace(/-/g, "/"),
      status: "تحت الاعتماد",
    };

    setPurchaseOrders((prev) => [item, ...prev]);
    setIsModalOpen(false);
  };

  /* ─── Export ─── */
  const exportExcel = () => {
    const headers = ["القسم", "بند المشتريات", "الموازنة المعتمدة", "المصروف الفعلي", "المحجوز", "المتبقي", "نسبة الاستهلاك %", "الحالة"];
    const data = budgets.map((b) => [
      b.department, b.category, b.allocated_budget, b.spent_amount, b.committed_amount, b.remaining_budget, `${b.utilization_rate}%`, b.status
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (!ws["!views"]) ws["!views"] = [];
    ws["!views"].push({ rightToLeft: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ميزانيات الشراء");
    XLSX.writeFile(wb, "ميزانية-الشراء-والتعاميد-المالية.xlsx");
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="text-[16px] font-extrabold text-[#004e82] flex items-center gap-2">
          <MaterialIcon name="shopping_cart_checkout" size={22} className="text-[#0070c0]" />
          ميزانية الشراء والتعاميد المالية للإدارات
        </h1>
        <div className="text-[11px] text-slate-400">الطلبات / الموافقة على الطلبات / ميزانية الشراء</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" dir="rtl">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي الموازنة المعتمدة</div>
          <div className="text-lg font-extrabold text-[#0070c0] font-mono mt-1">{totals.allocated.toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">إجمالي المصروفات المنفذة</div>
          <div className="text-lg font-extrabold text-rose-700 font-mono mt-1">{totals.spent.toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">المتبقي المتاح للصرف</div>
          <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{totals.remaining.toLocaleString()} ريال</div>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">نسبة الاستهلاك الكلية</div>
          <div className="text-lg font-extrabold text-purple-700 font-mono mt-1">
            {((totals.spent / totals.allocated) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Department Budget Breakdown */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs" dir="rtl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <span className="text-xs font-extrabold text-[#004e82] flex items-center gap-1.5">
            <MaterialIcon name="account_balance_wallet" size={18} className="text-[#0070c0]" />
            موازنات الإدارات والأقسام المعتمدة لعام 2025
          </span>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded hover:bg-emerald-100 transition"
          >
            <MaterialIcon name="table_chart" size={14} />
            تصدير Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold">
                <th className="p-2 text-right border-r border-slate-200">القسم / الإدارة</th>
                <th className="p-2 text-right border-r border-slate-200">بند الشراء</th>
                <th className="p-2 text-center border-r border-slate-200">الموازنة السنوية</th>
                <th className="p-2 text-center border-r border-slate-200">المصروف الفعلي</th>
                <th className="p-2 text-center border-r border-slate-200">المحجوز والتعاميد</th>
                <th className="p-2 text-center border-r border-slate-200 bg-emerald-50 text-emerald-800">المتبقي المتاح</th>
                <th className="p-2 text-center border-r border-slate-200">نسبة الاستهلاك</th>
                <th className="p-2 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => (
                <tr key={b.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-2 border-r border-slate-200 font-bold text-slate-800">{b.department}</td>
                  <td className="p-2 border-r border-slate-200 text-slate-700">{b.category}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-700">{b.allocated_budget.toLocaleString()}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-rose-700">{b.spent_amount.toLocaleString()}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono text-amber-700">{b.committed_amount.toLocaleString()}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono font-extrabold text-emerald-800 bg-emerald-50/60">
                    {b.remaining_budget.toLocaleString()} ريال
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-700">{b.utilization_rate}%</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === "متاح" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Requests Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs" dir="rtl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <span className="text-xs font-extrabold text-[#004e82] flex items-center gap-1.5">
            <MaterialIcon name="receipt_long" size={18} className="text-[#0070c0]" />
            طلبات الشراء والتعاميد المالية الأخيرة (Purchase Orders)
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 rounded bg-[#0070c0] hover:bg-[#005fa3] text-white px-3 py-1 text-xs font-bold transition shadow-xs"
          >
            <MaterialIcon name="add" size={15} />
            طلب شراء جديد
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold">
                <th className="p-2 text-center border-r border-slate-200">رقم الطلب (PO)</th>
                <th className="p-2 text-right border-r border-slate-200">القسم</th>
                <th className="p-2 text-right border-r border-slate-200">بيان ووصف المشتريات</th>
                <th className="p-2 text-right border-r border-slate-200">المورد / الجهة</th>
                <th className="p-2 text-center border-r border-slate-200">المبلغ</th>
                <th className="p-2 text-right border-r border-slate-200">مقدم الطلب</th>
                <th className="p-2 text-center border-r border-slate-200">تاريخ الطلب</th>
                <th className="p-2 text-center">حالة الاعتماد</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-[#0070c0]">{po.po_no}</td>
                  <td className="p-2 border-r border-slate-200 text-right text-slate-700">{po.department}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-bold text-slate-800">{po.item_desc}</td>
                  <td className="p-2 border-r border-slate-200 text-right text-slate-700">{po.vendor}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono font-extrabold text-emerald-800">{po.amount.toLocaleString()} ريال</td>
                  <td className="p-2 border-r border-slate-200 text-right text-slate-700">{po.requester}</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600">{po.request_date}</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      po.status === "معتمد ومصروف" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-[#004e82] flex items-center gap-1.5">
                <MaterialIcon name="shopping_cart" size={18} className="text-[#0070c0]" />
                إنشاء طلب شراء وتعليق مالي جديد
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <MaterialIcon name="close" size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">القسم الطالب *</span>
                <select
                  value={newPO.department}
                  onChange={(e) => setNewPO((p) => ({ ...p, department: e.target.value }))}
                  className={inputCls}
                >
                  <option value="التطوير والبرمجيات">التطوير والبرمجيات</option>
                  <option value="إدارة الموارد البشرية">إدارة الموارد البشرية</option>
                  <option value="الخدمات المساندة والمشتريات">الخدمات المساندة والمشتريات</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">بيان ووصف المشتريات والمواصفات *</span>
                <input
                  type="text"
                  value={newPO.item_desc}
                  onChange={(e) => setNewPO((p) => ({ ...p, item_desc: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">المورد / مقدم العرض</span>
                <input
                  type="text"
                  value={newPO.vendor}
                  onChange={(e) => setNewPO((p) => ({ ...p, vendor: e.target.value }))}
                  className={inputCls}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">المبلغ التقديري (ريال) *</span>
                <input
                  type="number"
                  value={newPO.amount}
                  onChange={(e) => setNewPO((p) => ({ ...p, amount: Number(e.target.value) }))}
                  className={`${inputCls} font-mono`}
                />
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
                onClick={handleSavePO}
                className="px-5 h-8 rounded-lg bg-[#0070c0] hover:bg-[#005fa3] text-white text-xs font-bold shadow-xs"
              >
                إرسال الطلب للاعتماد
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
