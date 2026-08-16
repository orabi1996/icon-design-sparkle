import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";

export type MegaColumn = { title: string; items: string[] };
export type NavItem = { label: string; icon: string; columns?: MegaColumn[] };

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
      <nav className="bg-brand-muted/95 backdrop-blur">
        <ul className="flex items-center gap-1 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] md:px-5">
          {items.map((item) => {
            const isOpen = open === item.label;
            return (
              <li key={item.label}>
                <button
                  onMouseEnter={() => item.columns && setOpen(item.label)}
                  onClick={() => setOpen(isOpen ? null : item.columns ? item.label : null)}
                  aria-expanded={isOpen}
                  className={`group flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                    isOpen
                      ? "bg-brand-foreground/15 text-brand-foreground"
                      : "text-brand-foreground/70 hover:bg-brand-foreground/10 hover:text-brand-foreground"
                  }`}
                >
                  <MaterialIcon
                    name={item.icon}
                    size={18}
                    filled={isOpen}
                    className={isOpen ? "text-teal" : "text-brand-foreground/60 group-hover:text-teal"}
                  />
                  {item.label}
                  {item.columns && (
                    <MaterialIcon
                      name="expand_more"
                      size={16}
                      className={`text-brand-foreground/50 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </button>
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
                  <p
                    className="px-4 py-2.5 text-[12px] font-bold text-brand-foreground"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    {col.title}
                  </p>
                  <ul className="max-h-[52vh] overflow-y-auto p-2">
                    {col.items.map((it) => (
                      <li key={it}>
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-[13px] font-semibold text-foreground/85 transition-colors hover:bg-accent hover:text-accent-foreground">
                          <MaterialIcon
                            name="chevron_left"
                            size={16}
                            className="shrink-0 text-teal-foreground/50"
                          />
                          <span className="flex-1 text-right">{it}</span>
                        </button>
                      </li>
                    ))}
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