import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/MaterialIcon";
import { MegaMenu } from "@/components/MegaMenu";
import { nav } from "@/components/hr/nav-data";
import { supabase } from "@/integrations/supabase/client";
import { CompanyWorkspaceProvider, useCompanyWorkspace } from "@/components/hr/CompanyWorkspace";
import { ScreenDirectory } from "@/components/hr/ScreenDirectory";
import { useRows } from "@/lib/hr-db";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ShellContext = createContext(false);
function CompanyName() {
  const { selectedCompany } = useCompanyWorkspace();
  return <>{selectedCompany?.display_name || "نظام الموارد البشرية"}</>;
}

function QuickEmployeeSearch() {
  const { data: employees = [] } = useRows("employees") as { data?: any[] };
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = q
    ? employees
        .filter(
          (emp) =>
            String(emp.full_name || "").toLowerCase().includes(q) ||
            String(emp.emp_no || "").toLowerCase().includes(q) ||
            String(emp.national_id || "").toLowerCase().includes(q),
        )
        .slice(0, 8)
    : [];

  return (
    <div ref={containerRef} className="relative hidden md:block w-64 lg:w-72">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="اسم، هوية، رقم وظيفي..."
          className="h-9 w-full rounded-full border border-white/20 bg-white/10 pe-9 ps-4 text-xs font-semibold text-white placeholder:text-white/60 outline-none transition focus:border-white/40 focus:bg-white/20"
        />
        <MaterialIcon
          name="search"
          size={17}
          className="pointer-events-none absolute left-3 text-white/75"
        />
      </div>

      {open && q.length > 0 && (
        <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-xl">
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-center text-xs text-slate-400">
              لا توجد نتائج مطابقة
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {matches.map((emp) => (
                <button
                  key={String(emp.id || emp.emp_no)}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    navigate({
                      to: "/staff/$employeeId",
                      params: { employeeId: String(emp.id || emp.emp_no) },
                    });
                  }}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-right text-xs transition hover:bg-blue-50"
                >
                  <div>
                    <div className="font-extrabold text-slate-900">
                      {String(emp.full_name || "—")}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {String(emp.job_title || emp.department || "موظف")}
                    </div>
                  </div>
                  <div className="text-left font-mono text-[11px] font-bold text-blue-600">
                    #{String(emp.emp_no || "—")}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function useSession() {
  const [state, setState] = useState<{ ready: boolean; email: string | null }>({
    ready: false,
    email: null,
  });
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) =>
      setState({ ready: true, email: data.session?.user.email ?? null }),
    );
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setState({ ready: true, email: session?.user.email ?? null }),
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  return state;
}

export function AppShell({ children }: { children: ReactNode }) {
  const nested = useContext(ShellContext);
  if (nested) return <>{children}</>;
  return <ShellContext.Provider value={true}><AuthenticatedShell>{children}</AuthenticatedShell></ShellContext.Provider>;
}

function AuthenticatedShell({ children }: { children: ReactNode }) {
  const [directoryOpen, setDirectoryOpen] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("screens") === "all") setDirectoryOpen(true);
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setDirectoryOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { ready, email } = useSession();

  useEffect(() => {
    if (ready && !email) navigate({ to: "/auth", replace: true });
  }, [ready, email, navigate]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!ready || !email) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center bg-[#f8fafd]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-12 rounded-full border-4 border-[#0b57d0]/20 border-t-[#0b57d0] animate-spin" />
          <span className="text-xs font-bold text-slate-500 font-mono">جاري تحميل نظام الموارد البشرية...</span>
        </div>
      </div>
    );
  }

  return (
    <CompanyWorkspaceProvider>
    <div dir="rtl" className="min-h-screen bg-[#f8fafd] text-slate-900 font-sans antialiased">
      <header className="sticky top-0 z-40 shadow-xs">
        {/* Google Workspace Style Top App Bar */}
        <div className="flex h-16 items-center gap-4 border-b border-topbar-border bg-topbar px-4 text-topbar-foreground md:px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="grid size-10 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-md transition-transform group-hover:scale-105">
              <MaterialIcon name="diversity_3" size={22} filled className="text-white" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-tight">نظام الموارد البشرية</span>
              <span className="block text-[11px] font-medium text-topbar-muted">
                <CompanyName />
              </span>
            </span>
          </Link>

          {/* Top Actions, Quick Employee Search & Profile */}
          <div className="ms-auto flex items-center gap-2">
            <QuickEmployeeSearch />

            <TopAction icon="notifications" title="التعميمات وإشعارات الطلبات" to="/request-notifications" />
            <TopAction icon="task_alt" title="المهام والطلبات" to="/tasks" />
            <TopAction icon="badge" title="بوابة الموظف" to="/portal" />

            <div className="mx-2 hidden h-7 w-px bg-white/20 sm:block" />

            {/* Shadcn Profile Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-full bg-white/10 py-1 pe-3 ps-1 ring-1 ring-white/15 transition hover:bg-white/20 focus:outline-none cursor-pointer"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-[#0b57d0] text-xs font-black text-white">
                      {email ? email.slice(0, 2).toUpperCase() : "HR"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-right leading-tight sm:block">
                    <span className="block text-xs font-bold text-white">مرحباً بك</span>
                    <span className="block max-w-[130px] truncate text-[10px] font-medium text-topbar-muted">
                      {email}
                    </span>
                  </span>
                  <MaterialIcon name="arrow_drop_down" size={18} className="text-topbar-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-xl border-border bg-card">
                <DropdownMenuLabel className="px-3 py-2 text-right">
                  <span className="block text-xs font-bold text-foreground">الحساب النشط</span>
                  <span className="block truncate text-[11px] font-mono text-muted-foreground">{email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings/general" className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer">
                    <span className="flex items-center gap-2">
                      <MaterialIcon name="settings" size={17} className="text-muted-foreground" />
                      <span>إعدادات النظام</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/request-notifications" className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer">
                    <span className="flex items-center gap-2">
                      <MaterialIcon name="notifications" size={17} className="text-muted-foreground" />
                      <span>الإشعارات والتعميمات</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/portal" className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer bg-blue-50/70 text-[#0070c0]">
                    <span className="flex items-center gap-2">
                      <MaterialIcon name="badge" size={17} className="text-[#0070c0]" />
                      <span>بوابة الموظف (حسابي)</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/requests/data-update" className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer">
                    <span className="flex items-center gap-2">
                      <MaterialIcon name="manage_accounts" size={17} className="text-muted-foreground" />
                      <span>طلبات تحديث البيانات</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tasks" className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer">
                    <span className="flex items-center gap-2">
                      <MaterialIcon name="task_alt" size={17} className="text-muted-foreground" />
                      <span>المهام والطلبات</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <MaterialIcon name="logout" size={17} />
                    <span>تسجيل الخروج</span>
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <MegaMenu items={nav} />
      </header>

      <main className="min-w-0 px-4 py-6 md:px-8 max-w-[1720px] mx-auto">
        {children}

        <footer className="mt-12 mb-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-5 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>نظام إدارة الموارد البشرية · تطوير الوظائف على مراحل</span>
          </div>
          <div>
            جميع الحقوق محفوظة © <span className="text-[#0b57d0] font-bold"><CompanyName /></span> {new Date().getFullYear()}
          </div>
        </footer>
      </main>

      <ScreenDirectory open={directoryOpen} onOpenChange={setDirectoryOpen} />
    </div>
    </CompanyWorkspaceProvider>
  );
}

function TopAction({ icon, title, to }: { icon: string; title: string; to: string }) {
  return (
    <Link to={to as never} title={title} aria-label={title} className="relative grid size-9.5 place-items-center rounded-full text-topbar-muted transition-colors hover:bg-white/15 hover:text-white">
      <MaterialIcon name={icon} size={20} />
    </Link>
  );
}
