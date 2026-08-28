import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/MaterialIcon";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول · نظام الموارد البشرية" },
      {
        name: "description",
        content: "تسجيل الدخول إلى نظام الموارد البشرية لإدارة الموظفين والرواتب والإجازات.",
      },
      { property: "og:title", content: "تسجيل الدخول · نظام الموارد البشرية" },
      {
        property: "og:description",
        content: "بوابة الدخول لنظام إدارة الموارد البشرية من الحلول الخبيرة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [accountType, setAccountType] = useState<"إداري" | "موظف">("إداري");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("تم تسجيل الدخول بنجاح");
        navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, account_type: accountType },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("تم إنشاء الحساب وتسجيل الدخول");
          navigate({ to: "/", replace: true });
        } else {
          toast.success("تم إنشاء الحساب — تفقّد بريدك لتأكيد التسجيل");
          setMode("login");
        }
      }
    } catch (err) {
      toast.error(`تعذر إتمام العملية: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    if (!email) {
      toast.error("أدخل بريدك الإلكتروني أولاً");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم إرسال رابط استعادة كلمة المرور");
  }

  return (
    <div
      dir="rtl"
      className="relative grid min-h-screen place-items-center overflow-hidden bg-secondary px-4 py-10"
    >
      <Deco className="right-[6%] top-[8%]" icon="apps" />
      <Deco className="left-[8%] top-[10%]" icon="bar_chart" />
      <Deco className="right-[10%] bottom-[10%]" icon="grid_view" />
      <Deco className="left-[9%] bottom-[12%]" icon="payments" />

      <div className="relative w-full max-w-[420px] rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-raised)]">
        <div className="flex flex-col items-center text-center">
          <span
            className="grid size-12 place-items-center rounded-2xl text-primary-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            <MaterialIcon name="diversity_3" size={26} filled />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-foreground">
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </h1>
          <p className="mt-2 text-[12.5px] font-semibold leading-6 text-muted-foreground">
            نظام متكامل يوفر تجربة شاملة للتحكم وإدارة جميع جوانب الموارد البشرية في مؤسستك بكفاءة
            عالية.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-[12px] font-bold text-foreground">اختر نوع الحساب</label>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
              {(["إداري", "موظف"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAccountType(t)}
                  className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                    accountType === t
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {mode === "signup" && (
            <Field
              label="الاسم الكامل"
              icon="person"
              value={fullName}
              onChange={setFullName}
              placeholder="مثال: أشرف العرابي"
              required
            />
          )}

          <Field
            label="البريد الإلكتروني"
            icon="mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@company.com"
            required
          />

          <div>
            <label className="mb-2 block text-[12px] font-bold text-foreground">كلمة المرور</label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
              <MaterialIcon name="lock" size={18} className="text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="h-11 w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="إظهار كلمة المرور"
              >
                <MaterialIcon name={show ? "visibility_off" : "visibility"} size={18} />
              </button>
            </div>
          </div>

          {mode === "login" && (
            <button
              type="button"
              onClick={forgotPassword}
              className="block text-[12px] font-bold text-primary hover:underline"
            >
              نسيت كلمة المرور ؟
            </button>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-primary-foreground transition-opacity disabled:opacity-60"
            style={{ background: "var(--gradient-brand)" }}
          >
            <MaterialIcon name={busy ? "progress_activity" : "login"} size={20} />
            {mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] font-semibold text-muted-foreground">
          {mode === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-bold text-primary hover:underline"
          >
            {mode === "login" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-[12px] font-bold text-foreground">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        <MaterialIcon name={icon} size={18} className="text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="h-11 w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>
    </div>
  );
}

function Deco({ className, icon }: { className: string; icon: string }) {
  return (
    <span
      className={`pointer-events-none absolute hidden size-20 place-items-center rounded-2xl border border-border/70 text-border md:grid ${className}`}
    >
      <MaterialIcon name={icon} size={30} />
    </span>
  );
}
