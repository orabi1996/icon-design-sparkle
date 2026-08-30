import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Breadcrumbs } from "@/components/hr/ui";
import { useSaveSettings, useSettings } from "@/lib/hr-db";

export const Route = createFileRoute("/settings/calendar")({
  head: () => ({
    meta: [
      { title: "تهيئة السنوات والشهور | نظام الموارد البشرية" },
      {
        name: "description",
        content: "إدارة سنوات النظام وتواريخ بداية ونهاية شهور كل سنة.",
      },
      { property: "og:title", content: "تهيئة السنوات والشهور" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CalendarSetup,
});

type MonthPeriod = {
  month: number;
  startDate: string;
  endDate: string;
};

type CalendarYear = {
  year: number;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  months: MonthPeriod[];
};

const currentYear = new Date().getFullYear();
const pageSizes = [5, 10, 20];
const controlClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-[13px] font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20";

const dateValue = (year: number, monthIndex: number, day: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const createMonths = (year: number): MonthPeriod[] =>
  Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    startDate: dateValue(year, index, 1),
    endDate: dateValue(year, index, new Date(year, index + 1, 0).getDate()),
  }));

const createYear = (year: number, isOpen = false): CalendarYear => ({
  year,
  startDate: `${year}-01-01`,
  endDate: `${year}-12-31`,
  isOpen,
  months: createMonths(year),
});

const fallbackYears = Array.from({ length: 10 }, (_, index) => {
  const year = 2018 + index;
  return createYear(year, year === currentYear);
});

const parseYears = (value?: string): CalendarYear[] => {
  if (!value) return fallbackYears;
  try {
    const parsed = JSON.parse(value) as CalendarYear[];
    if (!Array.isArray(parsed) || parsed.length === 0) return fallbackYears;
    return parsed
      .filter((item) => Number.isInteger(item.year))
      .map((item) => ({
        ...createYear(item.year, Boolean(item.isOpen)),
        ...item,
        months:
          Array.isArray(item.months) && item.months.length === 12
            ? item.months
            : createMonths(item.year),
      }))
      .sort((a, b) => a.year - b.year);
  } catch {
    return fallbackYears;
  }
};

const displayDate = (value: string) => value.replaceAll("-", "/");

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const download = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

function CalendarSetup() {
  const { data: settings = {}, isLoading } = useSettings("calendar_setup");
  const saveSettings = useSaveSettings("calendar_setup");
  const [years, setYears] = useState<CalendarYear[]>(fallbackYears);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [monthYear, setMonthYear] = useState<CalendarYear | null>(null);
  const [newYearOpen, setNewYearOpen] = useState(false);
  const [newYearValue, setNewYearValue] = useState(currentYear + 1);

  useEffect(() => {
    if (!isLoading) setYears(parseYears(settings["years"]));
  }, [isLoading, settings["years"]]);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const filteredYears = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ar");
    if (!normalized) return years;
    return years.filter((item) =>
      [
        item.year,
        displayDate(item.startDate),
        displayDate(item.endDate),
        item.isOpen ? "مفعل" : "غير مفعل",
      ]
        .join(" ")
        .toLocaleLowerCase("ar")
        .includes(normalized),
    );
  }, [query, years]);

  const pageCount = Math.max(1, Math.ceil(filteredYears.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filteredYears.slice((safePage - 1) * pageSize, safePage * pageSize);

  const persist = (next: CalendarYear[]) => {
    const sorted = [...next].sort((a, b) => a.year - b.year);
    setYears(sorted);
    saveSettings.mutate({ years: JSON.stringify(sorted) });
  };

  const activateYear = (year: number) => {
    const current = years.find((item) => item.year === year);
    const nextValue = !current?.isOpen;
    persist(years.map((item) => ({ ...item, isOpen: item.year === year ? nextValue : false })));
  };

  const addYear = () => {
    const year = Number(newYearValue);
    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      toast.error("برجاء إدخال سنة صحيحة بين 1900 و2200");
      return;
    }
    if (years.some((item) => item.year === year)) {
      toast.error("هذه السنة مضافة بالفعل");
      return;
    }
    persist([...years, createYear(year)]);
    setNewYearOpen(false);
    setNewYearValue(Math.max(year + 1, currentYear + 1));
  };

  const updateMonths = () => {
    if (!monthYear) return;
    const hasInvalidPeriod = monthYear.months.some(
      (month) => !month.startDate || !month.endDate || month.startDate > month.endDate,
    );
    if (hasInvalidPeriod) {
      toast.error("تاريخ بداية الشهر يجب أن يسبق تاريخ النهاية");
      return;
    }
    const next = years.map((item) =>
      item.year === monthYear.year
        ? {
            ...monthYear,
            startDate: monthYear.months[0]!.startDate,
            endDate: monthYear.months[11]!.endDate,
          }
        : item,
    );
    persist(next);
    setMonthYear(null);
  };

  const exportCsv = () => {
    const rows = filteredYears.map((item) =>
      [
        item.year,
        displayDate(item.startDate),
        displayDate(item.endDate),
        item.isOpen ? "مفعل" : "غير مفعل",
      ]
        .map(csvCell)
        .join(","),
    );
    download(
      "calendar-years.csv",
      `\uFEFF${["السنة", "تاريخ البداية", "تاريخ النهاية", "فتح السنة"].map(csvCell).join(",")}\n${rows.join("\n")}`,
      "text/csv;charset=utf-8",
    );
  };

  const exportJson = () =>
    download("calendar-years.json", JSON.stringify(filteredYears, null, 2), "application/json");

  const printTable = () => {
    const popup = window.open("", "_blank", "width=1000,height=700");
    if (!popup) return;
    const rows = filteredYears
      .map(
        (item) =>
          `<tr><td>${item.year}</td><td>${displayDate(item.startDate)}</td><td>${displayDate(item.endDate)}</td><td>${item.isOpen ? "مفعل" : "غير مفعل"}</td></tr>`,
      )
      .join("");
    popup.document.write(
      `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>تهيئة السنوات والشهور</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th{background:#064b73;color:white}th,td{border:1px solid #ccc;padding:9px;text-align:center}h1{text-align:center;font-size:20px}</style></head><body><h1>تهيئة السنوات والشهور</h1><table><thead><tr><th>السنة</th><th>تاريخ البداية</th><th>تاريخ النهاية</th><th>فتح السنة</th></tr></thead><tbody>${rows}</tbody></table></body></html>`,
    );
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <div className="mt-4 space-y-4" dir="rtl">
      <Breadcrumbs trail={["إعدادات النظام", "تهيئة السنوات والشهور"]} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h1 className="text-xl font-extrabold">تهيئة السنوات والشهور</h1>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            إدارة السنوات المالية وضبط تواريخ بداية ونهاية كل شهر
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewYearOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-extrabold text-primary-foreground shadow-md transition hover:opacity-90"
        >
          <MaterialIcon name="add" size={20} />
          إضافة سنة جديدة
        </button>
      </div>

      <section className="min-h-[520px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 px-5 py-4">
          <div className="relative me-auto w-full max-w-[240px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث..."
              className={`${controlClass} pe-10`}
            />
            <MaterialIcon
              name="search"
              size={18}
              className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={printTable}
            title="طباعة / PDF"
            className="grid size-9 place-items-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600"
          >
            <MaterialIcon name="picture_as_pdf" size={19} />
          </button>
          <button
            type="button"
            onClick={exportCsv}
            title="تصدير Excel"
            className="grid size-9 place-items-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600"
          >
            <MaterialIcon name="table_view" size={19} />
          </button>
          <button
            type="button"
            onClick={exportJson}
            title="نسخة بيانات"
            className="grid size-9 place-items-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600"
          >
            <MaterialIcon name="database" size={19} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-center text-[13px]">
            <thead>
              <tr className="bg-[#064b73] text-white">
                {[
                  ["السنة", "calendar_today"],
                  ["تاريخ البداية", "event"],
                  ["تاريخ النهاية", "event_available"],
                  ["فتح السنة", "toggle_on"],
                  ["الشهور", "date_range"],
                ].map(([label, icon]) => (
                  <th key={label} className="border-e border-white/20 px-4 py-3 font-extrabold">
                    <span className="flex items-center justify-center gap-2">
                      <MaterialIcon name={icon} size={17} />
                      {label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="h-40 text-muted-foreground">
                    جاري تحميل السنوات...
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-40 text-muted-foreground">
                    لا توجد سنوات مطابقة
                  </td>
                </tr>
              ) : (
                pageRows.map((item) => (
                  <tr
                    key={item.year}
                    className={`border-b border-border transition hover:bg-primary/5 ${item.isOpen ? "bg-sky-50/70 dark:bg-sky-950/20" : "odd:bg-muted/25"}`}
                  >
                    <td className="px-4 py-3 font-extrabold">{item.year}</td>
                    <td className="px-4 py-3" dir="ltr">
                      {displayDate(item.startDate)}
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {displayDate(item.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.isOpen}
                        onClick={() => activateYear(item.year)}
                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${item.isOpen ? "bg-sky-500" : "bg-slate-400"}`}
                      >
                        <span
                          className={`inline-block size-5 rounded-full bg-white shadow transition ${item.isOpen ? "translate-x-[-1.55rem]" : "translate-x-[-0.15rem]"}`}
                        />
                        <span className="sr-only">{item.isOpen ? "مفعل" : "غير مفعل"}</span>
                      </button>
                      <div
                        className={`mt-1 text-[10px] font-bold ${item.isOpen ? "text-sky-600" : "text-muted-foreground"}`}
                      >
                        {item.isOpen ? "مفعل" : "غير مفعل"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setMonthYear(structuredClone(item))}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        <MaterialIcon name="edit_calendar" size={17} />
                        شهور سنة
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4 text-xs font-semibold text-muted-foreground">
          <span>
            صفحة {safePage} من {pageCount} ({filteredYears.length} سنة)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="grid size-8 place-items-center rounded-lg border border-border disabled:opacity-35"
            >
              <MaterialIcon name="chevron_right" size={18} />
            </button>
            {Array.from({ length: Math.min(pageCount, 5) }, (_, index) => index + 1).map(
              (number) => (
                <button
                  type="button"
                  key={number}
                  onClick={() => setPage(number)}
                  className={`size-8 rounded-lg ${safePage === number ? "bg-primary text-primary-foreground" : "border border-border"}`}
                >
                  {number}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={safePage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              className="grid size-8 place-items-center rounded-lg border border-border disabled:opacity-35"
            >
              <MaterialIcon name="chevron_left" size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span>عدد الصفوف</span>
            {pageSizes.map((size) => (
              <button
                type="button"
                key={size}
                onClick={() => setPageSize(size)}
                className={`size-8 rounded-lg ${pageSize === size ? "bg-muted text-foreground" : "hover:bg-muted/60"}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </section>

      {newYearOpen && (
        <Modal title="إضافة سنة جديدة" onClose={() => setNewYearOpen(false)}>
          <label className="block text-right">
            <span className="mb-2 block text-xs font-extrabold">السنة</span>
            <input
              type="number"
              min={1900}
              max={2200}
              value={newYearValue}
              onChange={(event) => setNewYearValue(Number(event.target.value))}
              className={controlClass}
              autoFocus
            />
          </label>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={addYear}
              disabled={saveSettings.isPending}
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground disabled:opacity-50"
            >
              <MaterialIcon name="add" size={18} />
              إضافة السنة
            </button>
          </div>
        </Modal>
      )}

      {monthYear && (
        <Modal title={`شهور سنة ${monthYear.year}`} onClose={() => setMonthYear(null)} wide>
          <div className="max-h-[60vh] overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[480px] border-collapse text-center text-xs">
              <thead className="sticky top-0 bg-[#064b73] text-white">
                <tr>
                  <th className="border-e border-white/20 px-3 py-2">الشهر</th>
                  <th className="border-e border-white/20 px-3 py-2">تاريخ البداية</th>
                  <th className="px-3 py-2">تاريخ النهاية</th>
                </tr>
              </thead>
              <tbody>
                {monthYear.months.map((month, index) => (
                  <tr
                    key={month.month}
                    className="border-b border-border last:border-0 odd:bg-muted/25"
                  >
                    <td className="px-3 py-2 font-extrabold">{month.month}</td>
                    <td className="px-2 py-1.5">
                      <input
                        type="date"
                        value={month.startDate}
                        onChange={(event) =>
                          setMonthYear((current) => {
                            if (!current) return current;
                            const months = current.months.map((item, monthIndex) =>
                              monthIndex === index
                                ? { ...item, startDate: event.target.value }
                                : item,
                            );
                            return { ...current, months };
                          })
                        }
                        className={controlClass}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="date"
                        value={month.endDate}
                        onChange={(event) =>
                          setMonthYear((current) => {
                            if (!current) return current;
                            const months = current.months.map((item, monthIndex) =>
                              monthIndex === index
                                ? { ...item, endDate: event.target.value }
                                : item,
                            );
                            return { ...current, months };
                          })
                        }
                        className={controlClass}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={updateMonths}
              disabled={saveSettings.isPending}
              className="inline-flex min-w-40 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-extrabold text-primary-foreground disabled:opacity-50"
            >
              <MaterialIcon name="save" size={18} />
              تعديل
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  wide = false,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-white/75 p-4 backdrop-blur-[1px] dark:bg-black/70"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full overflow-hidden rounded-xl border border-primary/60 bg-card shadow-2xl ${wide ? "max-w-2xl" : "max-w-md"}`}
      >
        <header className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <h2 className="text-sm font-extrabold text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg bg-red-500 text-white transition hover:bg-red-600"
            aria-label="إغلاق"
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
