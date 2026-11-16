import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, useSaveRow, useDeleteRow, type Row } from "@/lib/hr-db";
import { ANDALUS_BRANCHES } from "@/lib/andalus-seed";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Megaphone,
  ClipboardList,
  PhoneCall,
  Users2,
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Send,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/surveys")({
  head: () => ({
    meta: [
      { title: "الاستبيانات و التعاميم الإدارية | شؤون الموظفين" },
      {
        name: "description",
        content: "إدارة التعاميم الإدارية وتحديث بيانات التواصل والمرافقين والاستبيانات لمنسوبي شركة مدارس الأندلس التعليمية.",
      },
    ],
  }),
  component: SurveysPage,
});

type AnnouncementKind = "تعميم" | "استبيان";
type CircularType = "تحديث بيانات التواصل" | "تحديث بيانات المرافقين" | "تعميم عام";
type SurveyType = "استبيان قياس الرضا" | "استبيان بيئة العمل" | "استطلاع الاحتياجات التدريبية" | "استبيان عام";

interface AnnouncementRecord extends Row {
  id?: string;
  title: string;
  kind: AnnouncementKind | string;
  circular_type?: CircularType | SurveyType | string;
  target?: string;
  priority?: "عاجل ومهم" | "هام" | "عادي" | string;
  status?: "سارٍ ومعتمد" | "نشط" | "مكتمل ومغلق" | "مسودة" | string;
  body?: string;
  action_url?: string;
  publish_date?: string;
  expiry_date?: string;
  created_at?: string;
}

const CIRCULAR_SUB_TYPES: CircularType[] = [
  "تحديث بيانات التواصل",
  "تحديث بيانات المرافقين",
  "تعميم عام",
];

const SURVEY_SUB_TYPES: SurveyType[] = [
  "استبيان قياس الرضا",
  "استبيان بيئة العمل",
  "استطلاع الاحتياجات التدريبية",
  "استبيان عام",
];

const TARGET_OPTIONS = [
  "جميع الفروع (550 موظف)",
  "الكادر التعليمي والإداري - كافة الفروع",
  "الإدارة العامة - جدة (حي الزهراء)",
  "فرع جدة - بنين (حي الزهراء)",
  "فرع جدة - بنات (حي الحمراء)",
  "فرع جدة - المسار الدولي والعالمي",
  "فرع مكة المكرمة (بنين وبنات)",
  "فرع الرياض - بنين وبنات (حي الصحافة والياسمين)",
  "فرع الطائف - بنين وبنات",
  "فرع خميس مشيط وأبها",
  "فرع المنطقة الشرقية (الدمام والخبر)",
  "المشرفون التربويون ورؤساء الأقسام",
  "الموظفون المقيمون فقط",
  "الموظفون السعوديون فقط",
];

const TEMPLATES: Record<CircularType, { title: string; body: string; priority: string; action_url: string }> = {
  "تحديث بيانات التواصل": {
    title: "تعميم رقم (ت-ت-01): إلزامية تحديث بيانات التواصل والعنوان الوطني لجميع الموظفين",
    body: "انطلاقاً من حرص إدارة شركة مدارس الأندلس التعليمية على تحديث السجلات الوظيفية واستمرار قنوات الاتصال الفعالة مع منسوبيها، يُلزم جميع المعلمين والمعلمات والإداريين بالدخول على بوابة الموظف الذاتية ومراجعة وتحديث أرقام الجوال الحالية وهاتف الطوارئ والعنوان الوطني الموحد خلال فترة أقصاها 5 أيام عمل، تجنباً لتعطل الإشعارات الرسمية ومسيرات الرواتب.",
    priority: "عاجل ومهم",
    action_url: "/reports/employee-data",
  },
  "تحديث بيانات المرافقين": {
    title: "تعميم رقم (ت-م-02): حصر وتحديث بيانات المرافقين والتابعين لتجديد التأمين الطبي والإقامات",
    body: "حرصاً على استمرار التغطية التأمينية الطبية الشاملة لكافة منسوبي المدارس وأسرهم، وتفادياً لأي تأخير في تجديد وثائق الإقامة النظامية للتابعين، نرجو من كافة الزملاء والزميلات مراجعة قائمة المرافقين والتابعين (الزوج/الزوجة والأبناء) وتحديث صلات القرابة والبيانات المسجلة، وإرفاق صور الوثائق المحدثة عبر البوابة في موعد أقصاه نهاية الشهر الحالي.",
    priority: "هام",
    action_url: "/reports/employee-dependents",
  },
  "تعميم عام": {
    title: "تعميم إداري: تنظيم الإجراءات واللوائح المعتمدة للعام الدراسي الحالي",
    body: "نحيط جميع منسوبي شركة مدارس الأندلس التعليمية بالالتزام الكامل بالتعليمات واللوائح المنظمة لمواعيد وساعات الدوام الرسمي، وإجراءات الاستئذان والإجازات، بما يحقق أعلى معايير الجودة والانضباط الأكاديمي والإداري.",
    priority: "عادي",
    action_url: "",
  },
};

function SurveysPage() {
  const { data: rawRows = [], isLoading } = useRows("announcements", {
    orderBy: "created_at",
    ascending: false,
  });
  const saveAnnouncement = useSaveRow("announcements");
  const deleteAnnouncement = useDeleteRow("announcements");

  // Filter States
  const [activeTab, setActiveTab] = useState<"all" | "circular" | "survey">("all");
  const [circularSubFilter, setCircularSubFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<AnnouncementRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formKind, setFormKind] = useState<AnnouncementKind>("تعميم");
  const [formCircularType, setFormCircularType] = useState<string>("تحديث بيانات التواصل");
  const [formTarget, setFormTarget] = useState(TARGET_OPTIONS[0]);
  const [formPriority, setFormPriority] = useState<string>("هام");
  const [formStatus, setFormStatus] = useState<string>("سارٍ ومعتمد");
  const [formBody, setFormBody] = useState("");
  const [formActionUrl, setFormActionUrl] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Typed Rows with fallback
  const items: AnnouncementRecord[] = useMemo(() => {
    return rawRows.map((r: Row) => {
      const rawKind = String(r["kind"] ?? "").trim();
      const rawTitle = String(r["title"] ?? "");
      const rawBody = String(r["body"] ?? "");
      const isSurvey = rawKind.includes("استبيان") || rawTitle.includes("استبيان");
      const kind: AnnouncementKind = isSurvey ? "استبيان" : "تعميم";
      
      let circType = String(r["circular_type"] ?? r["category"] ?? "").trim();
      if (!circType) {
        if (isSurvey) {
          circType = "استبيان قياس الرضا";
        } else if (rawTitle.includes("تواصل") || rawBody.includes("تواصل") || rawTitle.includes("العنوان الوطني")) {
          circType = "تحديث بيانات التواصل";
        } else if (rawTitle.includes("مرافق") || rawBody.includes("مرافق") || rawBody.includes("تابعين")) {
          circType = "تحديث بيانات المرافقين";
        } else {
          circType = "تعميم عام";
        }
      }

      return {
        id: String(r["id"] ?? ""),
        title: rawTitle,
        kind,
        circular_type: circType,
        target: String(r["target"] ?? "جميع الفروع"),
        priority: String(r["priority"] ?? "عادي"),
        status: String(r["status"] ?? "سارٍ ومعتمد"),
        body: rawBody,
        action_url: String(r["action_url"] ?? ""),
        publish_date: String(r["publish_date"] ?? r["created_at"] ?? "").slice(0, 10),
        expiry_date: String(r["expiry_date"] ?? ""),
        created_at: String(r["created_at"] ?? ""),
      };
    });
  }, [rawRows]);

  // Filtered rows
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === "circular" && item.kind !== "تعميم") return false;
      if (activeTab === "survey" && item.kind !== "استبيان") return false;

      // Circular Sub filter
      if (activeTab === "circular" && circularSubFilter !== "all") {
        if (item.circular_type !== circularSubFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inBody = String(item.body).toLowerCase().includes(q);
        const inTarget = String(item.target).toLowerCase().includes(q);
        const inType = String(item.circular_type).toLowerCase().includes(q);
        if (!inTitle && !inBody && !inTarget && !inType) return false;
      }

      return true;
    });
  }, [items, activeTab, circularSubFilter, priorityFilter, searchQuery]);

  // KPI Calculations
  const totalCount = items.length;
  const circularsCount = items.filter((i) => i.kind === "تعميم").length;
  const surveysCount = items.filter((i) => i.kind === "استبيان").length;
  const contactUpdatesCount = items.filter((i) => i.circular_type === "تحديث بيانات التواصل").length;
  const dependentUpdatesCount = items.filter((i) => i.circular_type === "تحديث بيانات المرافقين").length;
  const generalCircularsCount = items.filter((i) => i.circular_type === "تعميم عام").length;

  const handleOpenAdd = (kindOverride?: AnnouncementKind, subTypeOverride?: CircularType) => {
    setEditingId(null);
    const chosenKind = kindOverride || (activeTab === "survey" ? "استبيان" : "تعميم");
    setFormKind(chosenKind);

    const chosenSubType =
      subTypeOverride ||
      (chosenKind === "تعميم" ? "تحديث بيانات التواصل" : "استبيان قياس الرضا");
    setFormCircularType(chosenSubType);

    if (chosenKind === "تعميم" && TEMPLATES[chosenSubType as CircularType]) {
      const tmpl = TEMPLATES[chosenSubType as CircularType];
      setFormTitle(tmpl.title);
      setFormBody(tmpl.body);
      setFormPriority(tmpl.priority);
      setFormActionUrl(tmpl.action_url);
    } else {
      setFormTitle("");
      setFormBody("");
      setFormPriority("عادي");
      setFormActionUrl("");
    }

    setFormTarget(TARGET_OPTIONS[0]);
    setFormStatus("سارٍ ومعتمد");
    setFormExpiryDate("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: AnnouncementRecord) => {
    setEditingId(item.id || null);
    setFormTitle(item.title);
    setFormKind((item.kind as AnnouncementKind) || "تعميم");
    setFormCircularType(item.circular_type || "تعميم عام");
    setFormTarget(item.target || TARGET_OPTIONS[0]);
    setFormPriority(item.priority || "عادي");
    setFormStatus(item.status || "سارٍ ومعتمد");
    setFormBody(item.body || "");
    setFormActionUrl(item.action_url || "");
    setFormExpiryDate(item.expiry_date || "");
    setIsFormOpen(true);
  };

  const applyTemplate = (subType: CircularType) => {
    const tmpl = TEMPLATES[subType];
    if (tmpl) {
      setFormTitle(tmpl.title);
      setFormBody(tmpl.body);
      setFormPriority(tmpl.priority);
      setFormActionUrl(tmpl.action_url);
      toast.success(`تم إدراج الصيغة النموذجية لـ (${subType}) بنجاح`);
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error("يرجى إدخال عنوان التعميم أو الاستبيان");
      return;
    }
    if (!formBody.trim()) {
      toast.error("يرجى إدخال نص التعميم أو الاستبيان");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Row = {
        title: formTitle.trim(),
        kind: formKind,
        circular_type: formCircularType,
        category: formCircularType, // redundancy for cross-compatibility
        target: formTarget,
        priority: formPriority,
        status: formStatus,
        body: formBody.trim(),
        action_url: formActionUrl.trim(),
        expiry_date: formExpiryDate || null,
      };

      if (editingId) {
        payload["id"] = editingId;
      }

      await saveAnnouncement.mutateAsync(payload);
      toast.success(
        editingId ? "تم تعديل السجل بنجاح" : "تم إنشاء وحفظ التعميم بنجاح"
      );
      setIsFormOpen(false);
    } catch {
      toast.error("حدث خطأ أثناء حفظ التعميم، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${title}"؟`)) return;
    try {
      await deleteAnnouncement.mutateAsync(id);
      toast.success("تم الحذف بنجاح");
      if (previewItem?.id === id) setPreviewItem(null);
    } catch {
      toast.error("فشل حذف السجل");
    }
  };

  return (
    <AppShell>
      <div className="mt-4 space-y-5" dir="rtl">
        <Breadcrumbs trail={["شؤون الموظفين", "الاستبيانات والتعاميم الإدارية"]} />

        <PageBanner
          icon="campaign"
          title="الاستبيانات والتعاميم الإدارية"
          subtitle="إصدار وإدارة التعاميم الرسمية، وحملات تحديث بيانات التواصل والمرافقين، واستطلاعات قياس الرضا لمدارس الأندلس"
        />

        {/* Top KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: إجمالي التعاميم */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500">إجمالي التعاميم الإدارية</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{circularsCount}</span>
                <span className="text-xs font-semibold text-sky-700">تعاميم معتمدة</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-[#0070c0]">
              <Megaphone className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: تعاميم تحديث بيانات التواصل */}
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs transition hover:shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-800">تحديث بيانات التواصل</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-900">{contactUpdatesCount}</span>
                <span className="text-xs font-semibold text-emerald-700">حملات نشطة</span>
              </div>
              <Link
                to="/reports/employee-data"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
              >
                فتح تقرير بيانات التواصل
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <PhoneCall className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: تعاميم تحديث بيانات المرافقين */}
          <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs transition hover:shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-800">تحديث بيانات المرافقين</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-900">{dependentUpdatesCount}</span>
                <span className="text-xs font-semibold text-amber-700">حملات نشطة</span>
              </div>
              <Link
                to="/reports/employee-dependents"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
              >
                فتح تقرير المرافقين والتابعين
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Users2 className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: الاستبيانات */}
          <div className="flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50/40 p-4 shadow-xs transition hover:shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-purple-800">استبيانات الرأي والتقييم</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-900">{surveysCount}</span>
                <span className="text-xs font-semibold text-purple-700">استبيان</span>
              </div>
              <Link
                to="/reports/surveys-report"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:underline"
              >
                تقرير الاستبيانات الإحصائي
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          {/* Header Controls: Navigation Tabs & Create Buttons */}
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
            {/* Primary Distinction Tabs: الكل vs التعاميم vs الاستبيانات */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setCircularSubFilter("all");
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === "all"
                    ? "bg-[#0070c0] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>الكل ({totalCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("circular");
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === "circular"
                    ? "bg-[#0070c0] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Megaphone className="h-4 w-4" />
                <span>التعاميم الإدارية ({circularsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("survey");
                  setCircularSubFilter("all");
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === "survey"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                <span>الاستبيانات ({surveysCount})</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAdd("تعميم", "تحديث بيانات التواصل")}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition cursor-pointer"
              >
                <PhoneCall className="h-4 w-4" />
                <span>تعميم تحديث تواصل</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAdd("تعميم", "تحديث بيانات المرافقين")}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 shadow-2xs hover:bg-amber-100 transition cursor-pointer"
              >
                <Users2 className="h-4 w-4" />
                <span>تعميم تحديث مرافقين</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAdd("تعميم")}
                className="flex items-center gap-2 rounded-xl bg-[#0070c0] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005a9e] transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة تعميم / استبيان</span>
              </button>
            </div>
          </div>

          {/* Sub-Filters: If viewing Circulars, show sub-category filter pills */}
          {activeTab === "circular" && (
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 py-3 bg-slate-50/70 -mx-5 px-5">
              <span className="text-xs font-bold text-slate-500">تصنيف التعميم:</span>
              {[
                { key: "all", label: `كل التعاميم (${circularsCount})`, icon: Megaphone },
                {
                  key: "تحديث بيانات التواصل",
                  label: `تحديث بيانات التواصل (${contactUpdatesCount})`,
                  icon: PhoneCall,
                  color: "emerald",
                },
                {
                  key: "تحديث بيانات المرافقين",
                  label: `تحديث بيانات المرافقين (${dependentUpdatesCount})`,
                  icon: Users2,
                  color: "amber",
                },
                {
                  key: "تعميم عام",
                  label: `تعميم عام (${generalCircularsCount})`,
                  icon: FileText,
                  color: "sky",
                },
              ].map((sub) => {
                const Icon = sub.icon;
                const active = circularSubFilter === sub.key;
                return (
                  <button
                    key={sub.key}
                    type="button"
                    onClick={() => setCircularSubFilter(sub.key)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? "bg-[#0070c0] text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في العنوان، نص التعميم، الجهة المستهدفة، أو التصنيف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-9 pl-4 text-xs font-medium text-slate-800 outline-none transition focus:border-[#0070c0] focus:ring-2 focus:ring-[#0070c0]/15"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">الأولوية:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#0070c0]"
                >
                  <option value="all">جميع الأولويات</option>
                  <option value="عاجل ومهم">عاجل ومهم</option>
                  <option value="هام">هام</option>
                  <option value="عادي">عادي</option>
                </select>
              </div>

              {searchQuery || priorityFilter !== "all" || circularSubFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPriorityFilter("all");
                    setCircularSubFilter("all");
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إعادة ضبط
                </button>
              ) : null}
            </div>
          </div>

          {/* Main Data Table */}
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#f1f5f9] font-extrabold text-slate-700">
                    <th className="px-3 py-3 w-12 text-center">#</th>
                    <th className="px-4 py-3 min-w-[260px]">العنوان والموضوع</th>
                    <th className="px-3 py-3 min-w-[110px] text-center">النوع الرئيسي</th>
                    {/* The requested new column placed immediately after the circular/type */}
                    <th className="px-3 py-3 min-w-[190px] text-center bg-sky-50/60 font-black text-[#0070c0] border-x border-sky-100">
                      نوع التعميم / الغرض الإجرائي
                    </th>
                    <th className="px-3 py-3 min-w-[170px]">الجهة المستهدفة</th>
                    <th className="px-3 py-3 min-w-[90px] text-center">الأولوية</th>
                    <th className="px-3 py-3 min-w-[100px] text-center">تاريخ النشر</th>
                    <th className="px-3 py-3 min-w-[100px] text-center">الحالة</th>
                    <th className="px-3 py-3 min-w-[130px] text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center font-bold text-slate-500">
                        جاري تحميل التعاميم والاستبيانات...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center font-bold text-slate-500">
                        لا توجد تعاميم أو استبيانات مطابقة للشروط المحددة.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => {
                      const isContact = item.circular_type === "تحديث بيانات التواصل";
                      const isDependents = item.circular_type === "تحديث بيانات المرافقين";
                      const isGeneral = item.circular_type === "تعميم عام";

                      return (
                        <tr
                          key={item.id || index}
                          className="hover:bg-slate-50/80 transition group"
                        >
                          <td className="px-3 py-3.5 text-center font-bold text-slate-400">
                            {index + 1}
                          </td>

                          {/* Title & snippet */}
                          <td className="px-4 py-3.5">
                            <div className="font-extrabold text-slate-900 line-clamp-1 group-hover:text-[#0070c0] transition">
                              {item.title}
                            </div>
                            {item.body && (
                              <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                                {item.body}
                              </div>
                            )}
                          </td>

                          {/* Main Type */}
                          <td className="px-3 py-3.5 text-center">
                            {item.kind === "تعميم" ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0070c0]">
                                <Megaphone className="h-3 w-3" />
                                تعميم
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
                                <ClipboardList className="h-3 w-3" />
                                استبيان
                              </span>
                            )}
                          </td>

                          {/* THE REQUESTED EXTRA COLUMN: نوع التعميم / الغرض الإجرائي */}
                          <td className="px-3 py-3.5 text-center bg-sky-50/20 border-x border-sky-100">
                            {item.kind === "تعميم" ? (
                              isContact ? (
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 shadow-2xs">
                                    <PhoneCall className="h-3.5 w-3.5" />
                                    تحديث بيانات التواصل
                                  </span>
                                  <Link
                                    to="/reports/employee-data"
                                    className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                                  >
                                    تقرير التواصل <ExternalLink className="h-2.5 w-2.5" />
                                  </Link>
                                </div>
                              ) : isDependents ? (
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 shadow-2xs">
                                    <Users2 className="h-3.5 w-3.5" />
                                    تحديث بيانات المرافقين
                                  </span>
                                  <Link
                                    to="/reports/employee-dependents"
                                    className="text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-0.5"
                                  >
                                    تقرير المرافقين <ExternalLink className="h-2.5 w-2.5" />
                                  </Link>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                                  <FileText className="h-3.5 w-3.5" />
                                  تعميم عام
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700">
                                <ClipboardList className="h-3.5 w-3.5" />
                                {item.circular_type || "استبيان رأي"}
                              </span>
                            )}
                          </td>

                          {/* Target */}
                          <td className="px-3 py-3.5 text-slate-700">
                            <div className="flex items-center gap-1 font-semibold">
                              <Building className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="line-clamp-1">{item.target}</span>
                            </div>
                          </td>

                          {/* Priority */}
                          <td className="px-3 py-3.5 text-center">
                            {item.priority === "عاجل ومهم" ? (
                              <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800">
                                عاجل ومهم
                              </span>
                            ) : item.priority === "هام" ? (
                              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                                هام
                              </span>
                            ) : (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                عادي
                              </span>
                            )}
                          </td>

                          {/* Publish Date */}
                          <td className="px-3 py-3.5 text-center font-mono text-[11px] text-slate-600">
                            {item.publish_date || "—"}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              {item.status || "سارٍ ومعتمد"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                title="معاينة التعميم"
                                onClick={() => setPreviewItem(item)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#0070c0] transition cursor-pointer"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title="تعديل التعميم"
                                onClick={() => handleOpenEdit(item)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition cursor-pointer"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title="حذف"
                                onClick={() => item.id && handleDelete(item.id, item.title)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-600">
              <span className="font-bold">
                إجمالي السجلات المعروضة: {filteredItems.length} من أصل {items.length}
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  تحديث تواصل ({contactUpdatesCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  تحديث مرافقين ({dependentUpdatesCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  تعاميم عامة ({generalCircularsCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  استبيانات ({surveysCount})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-base font-extrabold text-slate-900 flex items-center gap-2">
                {formKind === "تعميم" ? (
                  <Megaphone className="h-5 w-5 text-[#0070c0]" />
                ) : (
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                )}
                {editingId ? "تعديل التعميم / الاستبيان" : "إضافة تعميم إداري أو استبيان جديد"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Step 1: Kind Selector (تعميم vs استبيان) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  النوع الأساسي للسجل:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormKind("تعميم");
                      if (!CIRCULAR_SUB_TYPES.includes(formCircularType as CircularType)) {
                        setFormCircularType("تحديث بيانات التواصل");
                      }
                    }}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-right transition cursor-pointer ${
                      formKind === "تعميم"
                        ? "border-[#0070c0] bg-sky-50/70 ring-2 ring-[#0070c0]/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        formKind === "تعميم" ? "bg-[#0070c0] text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">تعميم إداري رسمي</div>
                      <div className="text-[11px] text-slate-500">
                        توجيهات، تحديث بيانات التواصل أو المرافقين، لوائح وقرارات ملزمة
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormKind("استبيان");
                      if (!SURVEY_SUB_TYPES.includes(formCircularType as SurveyType)) {
                        setFormCircularType("استبيان قياس الرضا");
                      }
                    }}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-right transition cursor-pointer ${
                      formKind === "استبيان"
                        ? "border-purple-600 bg-purple-50/70 ring-2 ring-purple-600/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        formKind === "استبيان" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">استبيان واستطلاع رأي</div>
                      <div className="text-[11px] text-slate-500">
                        قياس الرضا الوظيفي، تقييم بيئة العمل، واستطلاع الاحتياجات
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: CONDITIONAL COLUMN: نوع التعميم / الغرض الإجرائي */}
              {formKind === "تعميم" ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#0070c0] flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      نوع التعميم / الغرض الإجرائي (القائمة المخصصة):
                    </label>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      يحدد التصنيف والإجراء التلقائي المرتبط
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {CIRCULAR_SUB_TYPES.map((subType) => {
                      const selected = formCircularType === subType;
                      return (
                        <button
                          key={subType}
                          type="button"
                          onClick={() => {
                            setFormCircularType(subType);
                          }}
                          className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 text-xs font-bold transition cursor-pointer ${
                            selected
                              ? subType === "تحديث بيانات التواصل"
                                ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                                : subType === "تحديث بيانات المرافقين"
                                ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                                : "border-[#0070c0] bg-white text-[#0070c0] ring-2 ring-[#0070c0]/20"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {subType === "تحديث بيانات التواصل" ? (
                              <PhoneCall className="h-4 w-4 text-emerald-700" />
                            ) : subType === "تحديث بيانات المرافقين" ? (
                              <Users2 className="h-4 w-4 text-amber-700" />
                            ) : (
                              <FileText className="h-4 w-4 text-[#0070c0]" />
                            )}
                            <span>{subType}</span>
                          </div>
                          {selected && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* One-click template applicator */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-sky-100 text-[11px]">
                    <span className="text-slate-600 font-semibold">
                      صيغ رسمية جاهزة لمنسوبي مدارس الأندلس:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setFormCircularType("تحديث بيانات التواصل");
                          applyTemplate("تحديث بيانات التواصل");
                        }}
                        className="rounded-md border border-emerald-300 bg-white px-2 py-1 font-bold text-emerald-800 hover:bg-emerald-50"
                      >
                        قالب تعميم التواصل
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormCircularType("تحديث بيانات المرافقين");
                          applyTemplate("تحديث بيانات المرافقين");
                        }}
                        className="rounded-md border border-amber-300 bg-white px-2 py-1 font-bold text-amber-800 hover:bg-amber-50"
                      >
                        قالب تعميم المرافقين
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 space-y-2">
                  <label className="text-xs font-black text-purple-800">
                    نوع الاستبيان واستطلاع الرأي:
                  </label>
                  <select
                    value={formCircularType}
                    onChange={(e) => setFormCircularType(e.target.value)}
                    className="h-10 w-full rounded-xl border border-purple-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-purple-600"
                  >
                    {SURVEY_SUB_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان {formKind === "تعميم" ? "التعميم الإداري" : "الاستبيان"} <span className="text-rose-600">*</span>:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: تعميم رقم (ت-ت-01): إلزامية تحديث بيانات التواصل..."
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0070c0] focus:ring-2 focus:ring-[#0070c0]/15"
                />
              </div>

              {/* Target & Priority Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الجهة والفروع المستهدفة:
                  </label>
                  <select
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#0070c0]"
                  >
                    {TARGET_OPTIONS.map((tgt) => (
                      <option key={tgt} value={tgt}>
                        {tgt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الأولوية:</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#0070c0]"
                    >
                      <option value="عاجل ومهم">عاجل ومهم</option>
                      <option value="هام">هام</option>
                      <option value="عادي">عادي</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الحالة:</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#0070c0]"
                    >
                      <option value="سارٍ ومعتمد">سارٍ ومعتمد</option>
                      <option value="نشط">نشط</option>
                      <option value="مسودة">مسودة</option>
                      <option value="مكتمل ومغلق">مكتمل ومغلق</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Body Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نص {formKind === "تعميم" ? "التعميم والتعليمات" : "مقدمة وأسئلة الاستبيان"} <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  rows={4}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="أدخل النص التفصيلي هنا..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-900 outline-none focus:border-[#0070c0] focus:ring-2 focus:ring-[#0070c0]/15"
                />
              </div>

              {/* Action Link & Expiry Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رابط الشاشة ذات الصلة (اختياري):
                  </label>
                  <input
                    type="text"
                    value={formActionUrl}
                    onChange={(e) => setFormActionUrl(e.target.value)}
                    placeholder="مثال: /reports/employee-data أو /reports/employee-dependents"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-[#0070c0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ انتهاء الفاعلية / الإغلاق:
                  </label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-[#0070c0]"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-xl bg-[#0070c0] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005a9e] disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSaving ? "جارٍ الحفظ..." : "حفظ واعتماد النشر"}</span>
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Official Preview Dialog */}
        <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-base font-extrabold text-slate-900">
                معاينة التعميم الرسمي
              </DialogTitle>
            </DialogHeader>

            {previewItem && (
              <div className="space-y-4 py-2 text-right">
                {/* Official Header */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <div className="text-xs font-black text-[#0070c0]">شركة مدارس الأندلس التعليمية</div>
                      <div className="text-[11px] text-slate-500">الإدارة العامة للموارد البشرية والشؤون الإدارية</div>
                    </div>
                    <div className="text-left font-mono text-[11px] text-slate-500">
                      <div>التاريخ: {previewItem.publish_date || "2026/11/01"}</div>
                      <div>الحالة: {previewItem.status}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-black text-slate-950">{previewItem.title}</div>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="font-bold text-slate-600">المستهدفون:</span>
                      <span className="rounded bg-white px-2 py-0.5 font-bold text-slate-800 border border-slate-200">
                        {previewItem.target}
                      </span>
                      <span className="font-bold text-slate-600 mr-2">التصنيف الإجرائي:</span>
                      <span className="rounded bg-sky-100 px-2 py-0.5 font-extrabold text-[#0070c0]">
                        {previewItem.circular_type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 leading-7 text-xs text-slate-800 whitespace-pre-wrap">
                  {previewItem.body}
                </div>

                {/* Quick Action Link inside preview if applicable */}
                {previewItem.action_url && (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                    <div className="text-xs font-bold text-emerald-900">
                      هذا التعميم مرتبط بإجراء مباشر للموظفين (
                      {previewItem.circular_type === "تحديث بيانات التواصل"
                        ? "تقرير وشاشة بيانات التواصل"
                        : previewItem.circular_type === "تحديث بيانات المرافقين"
                        ? "تقرير وشاشة المرافقين"
                        : "شاشة النظام"}
                      )
                    </div>
                    <Link
                      to={previewItem.action_url as any}
                      className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition"
                    >
                      <span>الانتقال للشاشة</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                إغلاق
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <Printer className="h-4 w-4" />
                  <span>طباعة رسمية</span>
                </button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
