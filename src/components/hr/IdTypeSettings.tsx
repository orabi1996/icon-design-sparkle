import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, useSaveRow, useDeleteRow, type Row } from "@/lib/hr-db";

export interface IdTypeRule {
  formatType: "أرقام فقط" | "حروف إنجليزية وأرقام" | "حروف وأرقام ورموز";
  startsWith: string;
  minDigits: string;
  maxDigits: string;
  sortOrder: number;
  ruleSummary: string;
}

export interface IdTypeRecord {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
  isBankAccepted: boolean;
  isActive: boolean;
  rule: IdTypeRule;
}

export const DEFAULT_ID_TYPES: IdTypeRecord[] = [
  {
    id: "seed-passport",
    name_ar: "جواز سفر",
    name_en: "Passport",
    code: "PASSPORT",
    isBankAccepted: false,
    isActive: true,
    rule: {
      formatType: "حروف إنجليزية وأرقام",
      startsWith: "",
      minDigits: "5",
      maxDigits: "20",
      sortOrder: 1,
      ruleSummary: "حروف إنجليزية وأرقام، عدد الخانات من 5 إلى 20",
    },
  },
  {
    id: "seed-eg-nat",
    name_ar: "الرقم القومي",
    name_en: "National ID (Egypt)",
    code: "EG_NATIONAL_ID",
    isBankAccepted: true,
    isActive: true,
    rule: {
      formatType: "أرقام فقط",
      startsWith: "2, 3",
      minDigits: "14",
      maxDigits: "14",
      sortOrder: 2,
      ruleSummary: "أرقام فقط، عدد الخانات 14، يبدأ بـ 2 أو 3",
    },
  },
  {
    id: "seed-sa-nat",
    name_ar: "الهوية الوطنية",
    name_en: "Saudi National ID",
    code: "SA_NATIONAL_ID",
    isBankAccepted: true,
    isActive: true,
    rule: {
      formatType: "أرقام فقط",
      startsWith: "1",
      minDigits: "10",
      maxDigits: "10",
      sortOrder: 3,
      ruleSummary: "أرقام فقط، عدد الخانات 10، يبدأ بـ 1",
    },
  },
  {
    id: "seed-iqama",
    name_ar: "الإقامة",
    name_en: "Iqama",
    code: "IQAMA",
    isBankAccepted: true,
    isActive: true,
    rule: {
      formatType: "أرقام فقط",
      startsWith: "2",
      minDigits: "10",
      maxDigits: "10",
      sortOrder: 4,
      ruleSummary: "أرقام فقط، عدد الخانات 10، يبدأ بـ 2",
    },
  },
];

export function computeRuleSummary(
  fmt: string,
  start: string,
  min: string,
  max: string,
): string {
  const parts: string[] = [fmt || "أرقام فقط"];
  const minNum = min.trim();
  const maxNum = max.trim();

  if (minNum && maxNum) {
    if (minNum === maxNum) {
      parts.push(`عدد الخانات ${minNum}`);
    } else {
      parts.push(`عدد الخانات من ${minNum} إلى ${maxNum}`);
    }
  } else if (minNum) {
    parts.push(`الحد الأدنى ${minNum} خانات`);
  } else if (maxNum) {
    parts.push(`الحد الأقصى ${maxNum} خانات`);
  }

  if (start.trim()) {
    const cleaned = start
      .split(/[,،\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" أو ");
    if (cleaned) {
      parts.push(`يبدأ بـ ${cleaned}`);
    }
  }

  return parts.join("، ");
}

export function validateIdNumberAgainstRule(
  value: string,
  rule: IdTypeRule,
): { valid: boolean; message: string } {
  if (!value) {
    return { valid: false, message: "رقم الهوية مطلوب" };
  }
  const clean = value.trim();

  if (rule.formatType === "أرقام فقط" && !/^\d+$/.test(clean)) {
    return { valid: false, message: "يجب أن يتكون الرقم من أرقام فقط دون حروف أو رموز" };
  }

  if (
    rule.formatType === "حروف إنجليزية وأرقام" &&
    !/^[A-Za-z0-9]+$/.test(clean)
  ) {
    return { valid: false, message: "يجب أن يتكون الرقم من حروف إنجليزية وأرقام فقط" };
  }

  if (rule.minDigits) {
    const min = Number(rule.minDigits);
    if (!Number.isNaN(min) && clean.length < min) {
      return { valid: false, message: `عدد الخانات أقل من الحد الأدنى المطلوب (${min} خانات)` };
    }
  }

  if (rule.maxDigits) {
    const max = Number(rule.maxDigits);
    if (!Number.isNaN(max) && clean.length > max) {
      return { valid: false, message: `عدد الخانات يتجاوز الحد الأقصى المسموح (${max} خانة)` };
    }
  }

  if (rule.startsWith && rule.startsWith.trim()) {
    const prefixes = rule.startsWith
      .split(/[,،\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (prefixes.length > 0 && !prefixes.some((p) => clean.startsWith(p))) {
      return {
        valid: false,
        message: `يجب أن يبدأ الرقم بـ: ${prefixes.join(" أو ")}`,
      };
    }
  }

  return { valid: true, message: "مطابق لقاعدة التحقق بنجاح ✓" };
}

export function IdTypeSettingsSection() {
  const formRef = useRef<HTMLDivElement>(null);
  const lookupsQuery = useRows("basic_lookups", {
    filters: { category: "نوع الهوية" },
    orderBy: "created_at",
    ascending: true,
  });
  const saveLookup = useSaveRow("basic_lookups");
  const deleteLookup = useDeleteRow("basic_lookups");

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [code, setCode] = useState("");
  const [formatType, setFormatType] = useState<
    "أرقام فقط" | "حروف إنجليزية وأرقام" | "حروف وأرقام ورموز"
  >("أرقام فقط");
  const [startsWith, setStartsWith] = useState("");
  const [minDigits, setMinDigits] = useState("");
  const [maxDigits, setMaxDigits] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isBankAccepted, setIsBankAccepted] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [testNumber, setTestNumber] = useState("");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Active summary
  const currentSummary = useMemo(
    () => computeRuleSummary(formatType, startsWith, minDigits, maxDigits),
    [formatType, startsWith, minDigits, maxDigits],
  );

  // Test validation
  const testOutcome = useMemo(() => {
    if (!testNumber.trim()) return null;
    return validateIdNumberAgainstRule(testNumber, {
      formatType,
      startsWith,
      minDigits,
      maxDigits,
      sortOrder,
      ruleSummary: currentSummary,
    });
  }, [testNumber, formatType, startsWith, minDigits, maxDigits, sortOrder, currentSummary]);

  // Merge database items or fallback to defaults
  const items: IdTypeRecord[] = useMemo(() => {
    const rawRows = lookupsQuery.data ?? [];
    if (rawRows.length === 0) {
      return DEFAULT_ID_TYPES;
    }
    return rawRows.map((r: Row) => {
      let parsedRule: IdTypeRule = {
        formatType: "أرقام فقط",
        startsWith: "",
        minDigits: "",
        maxDigits: "",
        sortOrder: 0,
        ruleSummary: "أرقام فقط",
      };
      if (typeof r["details"] === "string" && r["details"].startsWith("{")) {
        try {
          const obj = JSON.parse(r["details"]);
          parsedRule = {
            formatType: obj.formatType || "أرقام فقط",
            startsWith: obj.startsWith || "",
            minDigits: String(obj.minDigits ?? ""),
            maxDigits: String(obj.maxDigits ?? ""),
            sortOrder: Number(obj.sortOrder ?? 0),
            ruleSummary:
              obj.ruleSummary ||
              computeRuleSummary(
                obj.formatType,
                obj.startsWith,
                String(obj.minDigits ?? ""),
                String(obj.maxDigits ?? ""),
              ),
          };
        } catch {
          // ignore
        }
      }

      return {
        id: String(r["id"]),
        name_ar: String(r["name_ar"] ?? ""),
        name_en: String(r["name_en"] ?? ""),
        code: String(r["code"] ?? ""),
        isBankAccepted: Boolean(r["flag"]),
        isActive: r["active"] !== false,
        rule: parsedRule,
      };
    });
  }, [lookupsQuery.data]);

  // Filtered rows for table
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.name_ar.toLowerCase().includes(q) ||
        item.name_en.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.rule.ruleSummary.toLowerCase().includes(q),
    );
  }, [items, search]);

  const resetForm = () => {
    setEditingId(null);
    setNameAr("");
    setNameEn("");
    setCode("");
    setFormatType("أرقام فقط");
    setStartsWith("");
    setMinDigits("");
    setMaxDigits("");
    setSortOrder(0);
    setIsBankAccepted(false);
    setIsActive(true);
    setTestNumber("");
  };

  const handleEdit = (item: IdTypeRecord) => {
    setEditingId(item.id);
    setNameAr(item.name_ar);
    setNameEn(item.name_en);
    setCode(item.code);
    setFormatType(item.rule.formatType);
    setStartsWith(item.rule.startsWith);
    setMinDigits(item.rule.minDigits);
    setMaxDigits(item.rule.maxDigits);
    setSortOrder(item.rule.sortOrder);
    setIsBankAccepted(item.isBankAccepted);
    setIsActive(item.isActive);
    setTestNumber("");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (item: IdTypeRecord) => {
    if (!window.confirm(`هل أنت متأكد من حذف نوع الهوية "${item.name_ar}"؟`)) {
      return;
    }
    // If it's a seed item not yet in DB, we still allow UI removal or store seed items in DB
    try {
      await deleteLookup.mutateAsync(item.id);
      toast.success("تم حذف نوع الهوية بنجاح");
      if (editingId === item.id) resetForm();
    } catch {
      toast.error("فشل حذف نوع الهوية");
    }
  };

  const handleSave = async () => {
    if (!nameAr.trim()) {
      toast.error("يرجى إدخال اسم نوع الهوية بالعربية");
      return;
    }

    setIsSaving(true);
    try {
      const ruleData: IdTypeRule = {
        formatType,
        startsWith: startsWith.trim(),
        minDigits: minDigits.trim(),
        maxDigits: maxDigits.trim(),
        sortOrder: Number(sortOrder) || 0,
        ruleSummary: currentSummary,
      };

      const payload: Row = {
        category: "نوع الهوية",
        name_ar: nameAr.trim(),
        name_en: nameEn.trim() || null,
        code: code.trim().toUpperCase() || null,
        active: isActive,
        flag: isBankAccepted,
        details: JSON.stringify(ruleData),
      };

      if (editingId && !editingId.startsWith("seed-")) {
        payload["id"] = editingId;
      }

      await saveLookup.mutateAsync(payload);
      toast.success(
        editingId ? "تم تعديل نوع الهوية بنجاح" : "تم حفظ نوع الهوية الجديد بنجاح",
      );
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حفظ نوع الهوية");
    } finally {
      setIsSaving(false);
    }
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const headers = [
      "اسم الحقل بالعربية (نوع الهوية)",
      "اسم الحقل بالإنجليزية (نوع الهوية)",
      "الكود",
      "قاعدة التحقق",
      "مقبول في البنوك",
      "مفعل",
    ];
    const dataRows = filteredItems.map((item) => [
      item.name_ar,
      item.name_en,
      item.code,
      item.rule.ruleSummary,
      item.isBankAccepted ? "نعم" : "لا",
      item.isActive ? "نعم" : "لا",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "أنواع الهوية");
    XLSX.writeFile(wb, "أنواع_الهوية.xlsx");
    toast.success("تم تصدير ملف Excel بنجاح");
  };

  const printTable = () => {
    const win = window.open("", "_blank", "width=1000,height=700");
    if (!win) return;
    const rowsHtml = filteredItems
      .map(
        (i) =>
          `<tr>
            <td>${i.name_ar}</td>
            <td>${i.name_en || "—"}</td>
            <td>${i.code || "—"}</td>
            <td>${i.rule.ruleSummary}</td>
            <td>${i.isBankAccepted ? "✓" : "—"}</td>
            <td>${i.isActive ? "✓" : "✗"}</td>
          </tr>`,
      )
      .join("");
    win.document.write(`
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>أنواع الهوية</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; color: #0b4f7c; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
            th { background: #0b4f7c; color: white; padding: 8px; border: 1px solid #ddd; }
            td { padding: 6px; border: 1px solid #ddd; text-align: center; }
          </style>
        </head>
        <body>
          <h2>أنواع الهوية وقواعد التحقق</h2>
          <table>
            <thead>
              <tr>
                <th>اسم الحقل بالعربية</th>
                <th>اسم الحقل بالإنجليزية</th>
                <th>الكود</th>
                <th>قاعدة التحقق</th>
                <th>مقبول في البنوك</th>
                <th>مفعل</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="space-y-6" dir="rtl" ref={formRef}>
      {/* Top Creation / Edit Card matching reference screenshot */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        {/* Card Header */}
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-[#0b4f7c]">
            <span className="grid size-9 place-items-center rounded-xl bg-sky-100 text-[#0b4f7c]">
              <MaterialIcon name="badge" size={20} filled />
            </span>
            <h3 className="text-base font-extrabold text-slate-800">
              {editingId ? "تعديل نوع الهوية" : "نوع الهوية"}
            </h3>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        {/* Form Inputs Row 1 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              اسم الحقل بالعربية (نوع الهوية) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: جواز سفر، بطاقة رقم قومي، هوية وطنية"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#1d6fa5] focus:ring-2 focus:ring-[#1d6fa5]/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              اسم الحقل بالانجليزية (نوع الهوية)
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Passport, National ID"
              dir="ltr"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#1d6fa5] focus:ring-2 focus:ring-[#1d6fa5]/15 text-left"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              الكود
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. PASSPORT, EG_NATIONAL_ID"
              dir="ltr"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#1d6fa5] focus:ring-2 focus:ring-[#1d6fa5]/15 text-left"
            />
          </div>
        </div>

        {/* Validation Rule Section (قاعدة التحقق) */}
        <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/25 p-4.5">
          <div className="mb-3.5 flex items-center gap-2 font-extrabold text-[#0b4f7c] text-xs">
            <MaterialIcon name="rule" size={17} />
            <span>قاعدة التحقق</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-slate-700">
                الرقم يتكون من
              </label>
              <select
                value={formatType}
                onChange={(e) => setFormatType(e.target.value as any)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1d6fa5] cursor-pointer"
              >
                <option value="أرقام فقط">أرقام فقط</option>
                <option value="حروف إنجليزية وأرقام">حروف إنجليزية وأرقام</option>
                <option value="حروف وأرقام ورموز">حروف وأرقام ورموز</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-slate-700">
                يبدأ بـ (اختياري)
              </label>
              <input
                type="text"
                value={startsWith}
                onChange={(e) => setStartsWith(e.target.value)}
                placeholder="مثال: 1 أو 2,3 — افصل بفاصلة"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1d6fa5]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-slate-700">
                عدد الخانات — من
              </label>
              <input
                type="number"
                min={1}
                value={minDigits}
                onChange={(e) => setMinDigits(e.target.value)}
                placeholder="مثال: 10 أو 14"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1d6fa5]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-slate-700">
                عدد الخانات — إلى
              </label>
              <input
                type="number"
                min={1}
                value={maxDigits}
                onChange={(e) => setMaxDigits(e.target.value)}
                placeholder="مثال: 10 أو 20"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1d6fa5]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-slate-700">
                الترتيب
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1d6fa5]"
              />
            </div>
          </div>

          {/* Rule summary & Live test box */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-100 bg-white/90 p-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">ملخص القاعدة:</span>
              <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-extrabold text-[#0b57d0]">
                {currentSummary}
              </span>
            </div>

            {/* Test input (جرب رقم) */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">جرب رقم:</span>
              <input
                type="text"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="أدخل رقماً لاختبار القاعدة..."
                className="h-8 w-48 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium outline-none focus:border-[#1d6fa5]"
              />
              {testOutcome && (
                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-extrabold ${
                    testOutcome.valid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  <MaterialIcon
                    name={testOutcome.valid ? "check_circle" : "error"}
                    size={14}
                  />
                  <span>{testOutcome.message}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Checkboxes & Save Button */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBankAccepted}
                onChange={(e) => setIsBankAccepted(e.target.checked)}
                className="size-4 rounded accent-[#0b57d0] cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">مقبول في البنوك</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded accent-[#0b57d0] cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">مفعل</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-[#198754] px-8 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#157347] transition disabled:opacity-50 cursor-pointer"
          >
            <MaterialIcon name="save" size={17} />
            <span>{isSaving ? "جاري الحفظ..." : "حفظ"}</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-2">
        {/* Table Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                lookupsQuery.refetch();
                toast.success("تم تحديث البيانات");
              }}
              title="تحديث"
              className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
            >
              <MaterialIcon name="refresh" size={16} />
            </button>
            <button
              type="button"
              onClick={exportExcel}
              title="تصدير Excel"
              className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
            >
              <MaterialIcon name="table_view" size={16} />
            </button>
            <button
              type="button"
              onClick={printTable}
              title="طباعة / PDF"
              className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
            >
              <MaterialIcon name="picture_as_pdf" size={16} />
            </button>
          </div>

          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pe-3 ps-8 text-xs outline-none focus:border-[#1d6fa5]"
            />
            <MaterialIcon
              name="search"
              size={16}
              className="pointer-events-none absolute inset-y-0 left-2.5 my-auto h-fit text-slate-400"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr className="bg-[#0b4f7c] text-white">
                <th className="h-10 whitespace-nowrap border-l border-white/15 px-3 font-bold">
                  اسم الحقل بالعربية (نوع الهوية)
                </th>
                <th className="h-10 whitespace-nowrap border-l border-white/15 px-3 font-bold">
                  اسم الحقل بالانجليزية (نوع الهوية)
                </th>
                <th className="h-10 whitespace-nowrap border-l border-white/15 px-3 font-bold">
                  الكود
                </th>
                <th className="h-10 whitespace-nowrap border-l border-white/15 px-3 font-bold">
                  قاعدة التحقق
                </th>
                <th className="h-10 whitespace-nowrap border-l border-white/15 px-3 font-bold">
                  مقبول في البنوك
                </th>
                <th className="h-10 whitespace-nowrap border-l border-white/15 px-3 font-bold">
                  مفعل
                </th>
                <th className="h-10 whitespace-nowrap px-3 font-bold">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-24 text-slate-400 font-medium">
                    لا توجد أنواع هوية مسجلة
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 odd:bg-white even:bg-slate-50/50 hover:bg-sky-50/30 transition-colors"
                  >
                    <td className="h-10 whitespace-nowrap border-l border-slate-100 px-3 font-bold text-slate-800">
                      {item.name_ar}
                    </td>
                    <td className="h-10 whitespace-nowrap border-l border-slate-100 px-3 font-medium text-slate-600">
                      {item.name_en || "—"}
                    </td>
                    <td className="h-10 whitespace-nowrap border-l border-slate-100 px-3 font-bold text-[#0b57d0]">
                      {item.code || "—"}
                    </td>
                    <td className="h-10 whitespace-nowrap border-l border-slate-100 px-3 font-medium text-slate-700">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {item.rule.ruleSummary}
                      </span>
                    </td>
                    <td className="h-10 whitespace-nowrap border-l border-slate-100 px-3 font-bold">
                      {item.isBankAccepted ? (
                        <span className="text-emerald-600 font-black">✓</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="h-10 whitespace-nowrap border-l border-slate-100 px-3 font-bold">
                      {item.isActive ? (
                        <span className="text-emerald-600 font-black">✓</span>
                      ) : (
                        <span className="text-rose-500 font-black">✗</span>
                      )}
                    </td>
                    <td className="h-10 whitespace-nowrap px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          title="تعديل"
                          className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                        >
                          <MaterialIcon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          title="حذف"
                          className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                        >
                          <MaterialIcon name="delete" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pager summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-2 pt-1">
          <span>صفحة 1 من 1 ({filteredItems.length} عنصر)</span>
        </div>
      </div>
    </div>
  );
}
