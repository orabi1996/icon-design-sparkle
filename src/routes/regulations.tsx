import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { AppShell } from "@/components/hr/AppShell";

export const Route = createFileRoute("/regulations")({
  component: RegulationsLayout,
});

const tabs: {
  to:
    | "/regulations"
    | "/regulations/deductions"
    | "/regulations/bank-fees"
    | "/regulations/vacations"
    | "/regulations/shifts"
    | "/regulations/loans";
  label: string;
  icon: string;
  exact?: boolean;
}[] = [
  { to: "/regulations", label: "لائحة الإستحقاقات", icon: "add_circle", exact: true },
  { to: "/regulations/deductions", label: "لائحة الإستقطاعات", icon: "remove_circle" },
  { to: "/regulations/bank-fees", label: "تهيئة العمولات البنكية", icon: "account_balance" },
  { to: "/regulations/vacations", label: "تهيئة الاجازات", icon: "beach_access" },
  { to: "/regulations/shifts", label: "تهيئة مجموعات الدوام", icon: "schedule" },
  { to: "/regulations/loans", label: "تهيئة السلف", icon: "request_quote" },
];

function RegulationsLayout() {
  return (
    <AppShell>
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-card p-2"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.exact ?? false }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-muted-foreground transition-colors hover:bg-secondary"
            activeProps={{
              className:
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold bg-primary text-primary-foreground",
            }}
          >
            <MaterialIcon name={t.icon} size={18} />
            {t.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </AppShell>
  );
}
