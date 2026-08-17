import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { AppShell } from "@/components/hr/AppShell";

export const Route = createFileRoute("/staff")({
  component: StaffLayout,
});

const tabs: { to: "/staff" | "/staff/add" | "/staff/transfer" | "/staff/contracts"; label: string; icon: string; exact?: boolean }[] = [
  { to: "/staff", label: "شؤون الموظفين", icon: "badge", exact: true },
  { to: "/staff/add", label: "إضافة موظف", icon: "person_add" },
  { to: "/staff/transfer", label: "النقل والترقية", icon: "swap_horiz" },
  { to: "/staff/contracts", label: "تجديد العقود", icon: "description" },
];

function StaffLayout() {
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
