import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";

export type MegaLink = { label: string; to: string };
export type MegaColumn = { title: string; items: (string | MegaLink)[] };
export type NavItem = { label: string; icon: string; to?: string; columns?: MegaColumn[] };

export function MegaMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
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

  const active = items.find((i) => i.label === open);

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
          <div
            className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white/98 shadow-[0_8px_32px_0_rgba(0,0,0,0.14)] backdrop-blur-md"
          >
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
          </div>
        </div>
      )}
    </div>
  );
}
