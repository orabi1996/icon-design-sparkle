import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { MegaMenu } from "@/components/MegaMenu";
import { nav } from "@/components/hr/nav-data";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30">
        <div className="flex h-16 items-center gap-4 border-b border-topbar-border bg-topbar px-4 text-topbar-foreground md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <MaterialIcon name="diversity_3" size={22} filled />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-extrabold">الموارد البشرية</span>
              <span className="block text-[11px] font-semibold text-topbar-muted">
                الحلول الخبيرة · V1.0.3
              </span>
            </span>
          </Link>

          <div className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-xl bg-white/8 px-3 py-2 ring-1 ring-white/15 focus-within:ring-topbar-accent lg:flex">
            <MaterialIcon name="search" size={20} className="text-topbar-muted" />
            <input
              placeholder="ابحث بالاسم، الهوية، أو الرقم الوظيفي"
              className="w-full bg-transparent text-sm text-topbar-foreground placeholder:text-topbar-muted focus:outline-none"
            />
            <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-topbar-muted ring-1 ring-white/15">
              ⌘K
            </kbd>
          </div>

          <div className="ms-auto flex items-center gap-1">
            <TopAction icon="notifications" count="٦" />
            <TopAction icon="content_paste" count="٠" />
            <TopAction icon="language" />
            <div className="mx-2 hidden h-8 w-px bg-white/15 sm:block" />
            <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-topbar-hover">
              <span className="grid size-9 place-items-center rounded-full bg-topbar-accent text-sm font-bold text-topbar">
                SY
              </span>
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-xs font-bold">مرحباً، مدير النظام</span>
                <span className="block text-[11px] font-semibold text-topbar-muted">
                  system@system.com
                </span>
              </span>
              <MaterialIcon name="expand_more" size={18} className="text-topbar-muted" />
            </button>
          </div>
        </div>

        <MegaMenu items={nav} />
      </header>

      <main className="min-w-0 px-4 py-6 md:px-8">
          {children}

          <footer className="mt-8 flex flex-wrap items-center justify-center gap-1 border-t border-border pt-5 text-xs font-semibold text-muted-foreground">
            جميع الحقوق محفوظة © <span className="text-primary">الحلول الخبيرة</span>
          </footer>
      </main>

      <button
        className="fixed bottom-6 left-6 grid size-14 place-items-center rounded-full text-primary-foreground"
        style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-raised)" }}
        aria-label="التنبيهات"
      >
        <MaterialIcon name="notifications_active" size={24} filled />
      </button>
    </div>
  );
}

function TopAction({ icon, count }: { icon: string; count?: string }) {
  return (
    <button className="relative grid size-10 place-items-center rounded-xl text-topbar-muted transition-colors hover:bg-topbar-hover hover:text-topbar-foreground">
      <MaterialIcon name={icon} size={22} />
      {count && (
        <span className="absolute -top-0.5 left-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {count}
        </span>
      )}
    </button>
  );
}