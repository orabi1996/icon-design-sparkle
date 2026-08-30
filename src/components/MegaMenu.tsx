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
      <nav className="border-b border-topbar-border bg-topbar">
        <ul className="flex items-center gap-1 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] md:px-5">
          {items.map((item) => {
            const isOpen = open === item.label;
            const className = `group flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
              isOpen
                ? "bg-white/12 text-topbar-foreground"
                : "text-topbar-muted hover:bg-topbar-hover hover:text-topbar-foreground"
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
                      : "text-topbar-muted/80 group-hover:text-topbar-accent"
                  }
                />
                {item.label}
                {item.columns && (
                  <MaterialIcon
                    name="expand_more"
                    size={16}
                    className={`text-topbar-muted/70 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
          className="absolute inset-x-0 top-full z-40 origin-top animate-in fade-in slide-in-from-top-1 px-3 pt-2 duration-150 md:px-5"
          role="menu"
        >
          <div
            className="overflow-hidden rounded-2xl border border-border bg-card/98 backdrop-blur"
            style={{ boxShadow: "var(--shadow-raised)" }}
          >
            <div
              className={`grid gap-px bg-border ${
                active.columns.length >= 4
                  ? "sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                  : active.columns.length === 3
                    ? "sm:grid-cols-2 lg:grid-cols-3"
                    : "sm:grid-cols-2"
              }`}
            >
              {active.columns.map((col) => (
                <div key={col.title} className="bg-card">
                  <p className="bg-secondary px-4 py-2.5 text-[12px] font-bold text-primary">
                    {col.title}
                  </p>
                  <ul className="max-h-[52vh] overflow-y-auto p-2">
                    {col.items.map((it) => {
                      const label = typeof it === "string" ? it : it.label;
                      const cls =
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-[13px] font-semibold text-foreground/85 transition-colors hover:bg-accent hover:text-accent-foreground";
                      const inner = (
                        <>
                          <MaterialIcon
                            name="chevron_left"
                            size={16}
                            className="shrink-0 text-primary/50"
                          />
                          <span className="flex-1 text-right">{label}</span>
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
