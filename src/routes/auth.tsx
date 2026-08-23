import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MaterialIcon } from "@/components/MaterialIcon";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | نظام الموارد البشرية" },
      {
        name: "description",
        content: "تسجيل الدخول إلى نظام الموارد البشرية لإدارة الموظفين والرواتب والأجازات.",
      },
      { property: "og:title", content: "تسجيل الدخول | نظام الموارد البشرية" },
      { property: "og:description", content: "الدخول الآمن إلى نظام الموارد البشرية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("تم تسجيل الدخول");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب، تحقق من بريدك لتأكيد التسجيل");
      }
    } catch (err) {
      toast.error(`تعذر إكمال العملية: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const control =
    "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div dir="rtl" className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <MaterialIcon name="diversity_3" size={26} filled />
          </span>
          <h1 className="text-lg font-extrabold text-foreground">نظام الموارد البشرية</h1>
          <p className="text-xs font-semibold text-muted-foreground">
            {mode === "in" ? "سجّل الدخول للوصول إلى بيانات النظام" : "إنشاء حساب جديد"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
              البريد الإلكتروني
            </span>
            <input
              className={control}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
              كلمة المرور
            </span>
            <input
              className={control}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "جارٍ المعالجة..." : mode === "in" ? "تسجيل الدخول" : "إنشاء حساب"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 w-full text-center text-xs font-bold text-primary hover:underline"
        >
          {mode === "in" ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب؟ تسجيل الدخول"}
        </button>
      </div>
    </div>
  );
}
