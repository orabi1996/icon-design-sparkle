import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة · الموارد البشرية" },
      {
        name: "description",
        content: "صفحة تعيين كلمة مرور جديدة لحسابك في نظام الموارد البشرية.",
      },
      { property: "og:title", content: "تعيين كلمة مرور جديدة" },
      { property: "og:description", content: "استعادة الوصول إلى حسابك في نظام الموارد البشرية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم تحديث كلمة المرور");
    navigate({ to: "/", replace: true });
  }

  return (
    <div dir="rtl" className="grid min-h-screen place-items-center bg-secondary px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[400px] rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-raised)]"
      >
        <h1 className="text-xl font-extrabold text-foreground">تعيين كلمة مرور جديدة</h1>
        <p className="mt-2 text-[12.5px] font-semibold text-muted-foreground">
          أدخل كلمة المرور الجديدة لحسابك.
        </p>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3">
          <MaterialIcon name="lock" size={18} className="text-muted-foreground" />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 w-full bg-transparent text-sm font-semibold outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-5 h-12 w-full rounded-xl text-sm font-extrabold text-primary-foreground disabled:opacity-60"
          style={{ background: "var(--gradient-brand)" }}
        >
          حفظ كلمة المرور
        </button>
      </form>
    </div>
  );
}
