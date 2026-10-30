import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";

export type MegaLink = { label: string; to: string };
export type MegaGroup = { title: string; items: MegaLink[] };
export type MegaColumn = {
  title: string;
  items: (string | MegaLink)[];
  groups?: MegaGroup[];
};
export type NavItem = {
  label: string;
  icon: string;
  to?: string;
  columns?: MegaColumn[];
};

export function MegaMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Reset search when switching menus
  useEffect(() => {
    setSearchQuery("");
  }, [open]);

  const active = items.find((i) => i.label === open);
  const hasGroupedColumns = Boolean(active?.columns?.some((c) => c.groups && c.groups.length > 0));

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const q = searchQuery.trim().toLowerCase();

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setOpen(null)}>
      <nav className="border-b border-topbar-border bg-topbar shadow-xs">
        <ul className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] md:px-6">
          {items.map((item) => {
            const isOpen = open === item.label;
            const className = `group flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-all ${
              isOpen
                ? "bg-white/20 text-white shadow-xs backdrop-blur-xs ring-1 ring-white/30"
                : "text-topbar-muted hover:bg-white/10 hover:text-white"
            }`;
            const content = (
              <>
                <MaterialIcon
                  name={item.icon}
                  size={18}
                  filled={isOpen}
                  className={
                    isOpen
                      ? "text-topbar-accent"
                      : "text-topbar-muted group-hover:text-topbar-accent transition-colors"
                  }
                />
                <span>{item.label}</span>
                {item.columns && (
                  <MaterialIcon
                    name="arrow_drop_down"
                    size={20}
                    className={`text-topbar-muted/80 transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : ""}`}
                  />
                )}
              </>
            );
            return (
              <li key={item.label}>
                {item.to ? (
                  <Link to={item.to} className={className} onClick={() => setOpen(null)}>
                    {content}
                  </Link>
                ) : (
                  <button
                    onMouseEnter={() => item.columns && setOpen(item.label)}
                    onClick={() => setOpen(isOpen ? null : item.columns ? item.label : null)}
                    aria-expanded={isOpen}
                    className={className}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {active?.columns && (
        <div
          className="absolute inset-x-0 top-full z-40 origin-top animate-in fade-in slide-in-from-top-1 px-4 pt-2 duration-150 md:px-6"
          role="menu"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_36px_0_rgba(15,23,42,0.14)] backdrop-blur-md">
            {/* Grouped Reports MegaMenu Layout (Matches Screenshot + Interactive Expansion) */}
            {hasGroupedColumns ? (
              <div>
                {/* Top Search & Expand Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/50 px-4 py-2.5">
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن تقرير..."
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white pe-9 ps-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#0b57d0] focus:ring-2 focus:ring-[#0b57d0]/15"
                    />
                    <MaterialIcon
                      name="search"
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandAll((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0b57d0]"
                  >
                    <MaterialIcon
                      name={expandAll ? "unfold_less" : "unfold_more"}
                      size={15}
                    />
                    <span>{expandAll ? "طي جميع المجموعات" : "عرض جميع التقارير"}</span>
                  </button>
                </div>

                {/* 5 Columns Grid */}
                <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-x-reverse lg:divide-y-0">
                  {active.columns.map((col) => {
                    const groups = col.groups ?? [];
                    const filteredGroups = groups
                      .map((grp) => {
                        if (!q) return grp;
                        const groupMatches = grp.title.toLowerCase().includes(q);
                        const matchingItems = grp.items.filter((it) =>
                          it.label.toLowerCase().includes(q),
                        );
                        if (groupMatches) return grp;
                        return { ...grp, items: matchingItems };
                      })
                      .filter((grp) => grp.items.length > 0);

                    const totalReports = groups.reduce(
                      (acc, g) => acc + g.items.length,
                      0,
                    );

                    return (
                      <div key={col.title} className="flex flex-col bg-white">
                        {/* Column Header */}
                        <div className="border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 text-right">
                          <div className="text-[13px] font-extrabold text-slate-800">
                            {col.title}
                          </div>
                          <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                            {groups.length} مجموعات · {totalReports} تقرير
                          </div>
                        </div>

                        {/* Groups List */}
                        <div className="max-h-[60vh] flex-1 space-y-1 overflow-y-auto p-2.5 [scrollbar-width:thin]">
                          {filteredGroups.length === 0 ? (
                            <div className="py-6 text-center text-[11px] text-slate-400">
                              لا توجد تقارير مطابقة
                            </div>
                          ) : (
                            filteredGroups.map((grp) => {
                              const grpKey = `${col.title}::${grp.title}`;
                              const isExpanded =
                                Boolean(q) || expandAll || Boolean(expandedGroups[grpKey]);

                              return (
                                <div key={grp.title} className="rounded-xl">
                                  <button
                                    type="button"
                                    onClick={() => toggleGroup(grpKey)}
                                    className={`group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-right text-[12px] font-bold transition ${
                                      isExpanded
                                        ? "bg-blue-50/80 text-[#0b57d0]"
                                        : "text-slate-700 hover:bg-slate-50 hover:text-[#0b57d0]"
                                    }`}
                                  >
                                    <span className="truncate">{grp.title}</span>
                                    <span className="flex shrink-0 items-center gap-1.5">
                                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e8f0fe] px-1.5 font-mono text-[10px] font-extrabold text-[#0b57d0]">
                                        {grp.items.length}
                                      </span>
                                      <MaterialIcon
                                        name="chevron_left"
                                        size={16}
                                        className={`text-slate-400 transition-transform duration-200 group-hover:text-[#0b57d0] ${
                                          isExpanded ? "-rotate-90 text-[#0b57d0]" : ""
                                        }`}
                                      />
                                    </span>
                                  </button>

                                  {isExpanded && (
                                    <ul className="mt-1 mr-2.5 space-y-0.5 border-r-2 border-blue-100 pr-2 pb-1">
                                      {grp.items.map((rep) => (
                                        <li key={`${grp.title}-${rep.to}-${rep.label}`}>
                                          <Link
                                            to={rep.to}
                                            onClick={() => setOpen(null)}
                                            className="group flex items-center justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-right text-[11.5px] font-semibold text-slate-600 transition hover:bg-[#e8f0fe]/70 hover:text-[#0b57d0]"
                                          >
                                            <span className="flex-1">{rep.label}</span>
                                            <MaterialIcon
                                              name="arrow_back"
                                              size={13}
                                              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-[#0b57d0]"
                                            />
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Standard Columns Layout for Other Menus */
              <div
                className={`grid gap-px bg-slate-100 ${
                  active.columns.length >= 4
                    ? "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                    : active.columns.length === 3
                      ? "sm:grid-cols-2 lg:grid-cols-3"
                      : "sm:grid-cols-2"
                }`}
              >
                {active.columns.map((col) => (
                  <div key={col.title} className="bg-white p-3">
                    <div className="mb-2 flex items-center gap-2 rounded-xl bg-[#f0f4f9] px-3.5 py-2 text-[12px] font-extrabold text-[#004e82]">
                      <span className="size-1.5 rounded-full bg-[#0b57d0]" />
                      {col.title}
                    </div>
                    <ul className="max-h-[55vh] space-y-0.5 overflow-y-auto p-1 [scrollbar-width:thin]">
                      {col.items.map((it) => {
                        const label = typeof it === "string" ? it : it.label;
                        const cls =
                          "group flex w-full items-center gap-2 rounded-full px-3.5 py-2 text-right text-[12px] font-medium text-slate-700 transition-all hover:bg-[#e8f0fe] hover:text-[#0b57d0] hover:ps-4";
                        const inner = (
                          <>
                            <MaterialIcon
                              name="chevron_left"
                              size={16}
                              className="shrink-0 text-slate-400 group-hover:text-[#0b57d0] transition-transform group-hover:-translate-x-0.5"
                            />
                            <span className="flex-1 text-right font-medium">{label}</span>
                          </>
                        );
                        return (
                          <li key={label}>
                            {typeof it === "string" ? (
                              <button className={cls}>{inner}</button>
                            ) : (
                              <Link to={it.to} className={cls} onClick={() => setOpen(null)}>
                                {inner}
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
