import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";

type SidebarItem = {
  to: string;
  label: string;
  icon: string;
  description?: string;
};

const SIDEBAR: SidebarItem[] = [
  { to: "/tasks",             label: "المهام",         icon: "task",       description: "قائمة المهام" },
  { to: "/tasks/setup",       label: "التهيئة",        icon: "settings",   description: "التصنيفات والأولويات والحالات" },
  { to: "/tasks/permissions", label: "إدارة الصلاحيات", icon: "shield_person", description: "منشئي ومستلمي المهام" },
  { to: "/tasks/reports",     label: "التقارير",       icon: "assessment", description: "ملخص ومهام تفصيلية" },
];

export function TasksModuleShell({
  title,
  subtitle,
  icon,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mt-3 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Sub-sidebar */}
      <aside
        className="h-fit overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-3 border-b border-border bg-secondary/60 px-4 py-3.5">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <MaterialIcon name="dashboard_customize" size={22} filled />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-foreground">إدارة المهام الإضافية</h2>
            <p className="truncate text-[11px] font-semibold text-muted-foreground">
              التصنيفات · الصلاحيات · التقارير
            </p>
          </div>
        </div>
        <ul className="space-y-1 p-2">
          {SIDEBAR.map((it) => {
            const active =
              it.to === "/tasks"
                ? path === "/tasks"
                : path === it.to || path.startsWith(it.to + "/");
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  <MaterialIcon
                    name={it.icon}
                    size={19}
                    filled={active}
                    className={active ? "" : "text-primary"}
                  />
                  <span className="flex-1">
                    <span className="block">{it.label}</span>
                    {it.description && (
                      <span
                        className={`mt-0.5 block text-[10.5px] font-semibold ${
                          active ? "text-primary-foreground/75" : "text-muted-foreground"
                        }`}
                      >
                        {it.description}
                      </span>
                    )}
                  </span>
                  <MaterialIcon
                    name="chevron_left"
                    size={16}
                    className={active ? "text-primary-foreground/70" : "text-border"}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Main content */}
      <section className="min-w-0 space-y-4">
        <div
          className="flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4 text-primary-foreground"
          style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-raised)" }}
        >
          <span className="grid size-11 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <MaterialIcon name={icon} size={24} filled />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight md:text-xl">{title}</h1>
            {subtitle && (
              <p className="text-[12px] font-semibold text-white/75">{subtitle}</p>
            )}
          </div>
          {actions && <div className="ms-auto flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </section>
    </div>
  );
}

export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-card p-1.5">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/80 hover:bg-secondary"
            }`}
          >
            {t.icon && <MaterialIcon name={t.icon} size={17} filled={active} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
