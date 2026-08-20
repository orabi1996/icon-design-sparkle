import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}