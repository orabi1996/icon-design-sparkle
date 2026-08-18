import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";

export const Route = createFileRoute("/regulations")({
  component: RegulationsLayout,
});

function RegulationsLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
