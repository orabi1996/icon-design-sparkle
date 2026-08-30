import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  FilterCard,
  ReportPageHeader,
  EmptySearchState,
  type FilterState,
} from "@/components/hr/AttendanceReportShell";
import { useRows } from "@/lib/hr-db";

export const Route = createFileRoute("/reports/absence-late-comparison")({
  head: () => ({ meta: [{ title: "مقارنة الغياب والتأخير للفروع والأقسام | تقارير البصمة" }] }),
  component: AbsenceLateComparisonReport,
});

function AbsenceLateComparisonReport() {
  const [f, setF] = useState<FilterState>({ groupBy: "branch", year: String(new Date().getFullYear()) });
  const [applied, setApplied] = useState<FilterState | null>(null);

  const { data: attendance = [] } = useRows("attendance_records", { orderBy: "work_date" });

  const chart = useMemo(() => {
    if (!applied) return [] as { label: string; absence: number; late: number }[];
    const groupKey = applied["groupBy"] === "department" ? "department" : "branch";
    const y = String(applied["year"] ?? "");
    const m = String(applied["month"] ?? "");
    const prefix = y ? (m ? `${y}-${m}` : y) : "";
    const map = new Map<string, { absence: number; late: number; total: number }>();
    for (const r of attendance) {
      const wd = String(r["work_date"] ?? "");
      if (prefix && !wd.startsWith(prefix)) continue;
      const label = String(r[groupKey] ?? "غير محدد");
      const cur = map.get(label) ?? { absence: 0, late: 0, total: 0 };
      cur.total += 1;
      if (!r["check_in"]) cur.absence += 1;
      if (Number(r["late_minutes"] ?? 0) > 0) cur.late += 1;
      map.set(label, cur);
    }
    return Array.from(map.entries()).map(([label, v]) => ({
      label,
      absence: v.total ? Math.round((v.absence / v.total) * 100) : 0,
      late: v.total ? Math.round((v.late / v.total) * 100) : 0,
    }));
  }, [attendance, applied]);

  const maxVal = Math.max(1, ...chart.flatMap((c) => [c.absence, c.late]));

  return (
    <AppShell>
      <ReportPageHeader icon="bar_chart" title="مقارنة الغياب والتأخير للفروع والأقسام" trail={["التقارير", "تقارير البصمة", "مقارنة الغياب والتأخير"]} />
      <FilterCard
        fields={["branch", "department", "employee", "year", "month", "groupBy"]}
        values={f}
        onChange={(p) => setF({ ...f, ...p })}
        onSearch={() => setApplied(f)}
        onReset={() => { setF({ groupBy: "branch" }); setApplied(null); }}
      />
      {!applied ? (
        <EmptySearchState />
      ) : (
        <div
          className="mt-4 overflow-hidden rounded-2xl border border-border bg-card p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
              <MaterialIcon name="stacked_bar_chart" size={19} className="text-primary" filled />
              مقارنة نسب الغياب والتأخير حسب {applied["groupBy"] === "department" ? "القسم" : "الفرع"}
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold">
              <span className="size-3 rounded-sm bg-rose-500" /> غياب
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold">
              <span className="size-3 rounded-sm bg-amber-500" /> تأخير
            </span>
          </div>

          {chart.length === 0 ? (
            <p className="py-10 text-center text-sm font-semibold text-muted-foreground">
              لا توجد بيانات مطابقة للفلاتر
            </p>
          ) : (
            <div className="space-y-4">
              {chart.map((c) => (
                <div key={c.label}>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-bold">
                    <span>{c.label}</span>
                    <span dir="ltr" className="font-mono text-muted-foreground">
                      غياب {c.absence}% · تأخير {c.late}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[10px] font-bold text-rose-600">غياب</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-rose-500 transition-all"
                          style={{ width: `${(c.absence / maxVal) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[10px] font-bold text-amber-600">تأخير</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all"
                          style={{ width: `${(c.late / maxVal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
