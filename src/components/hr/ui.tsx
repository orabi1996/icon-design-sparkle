import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";

export function Breadcrumbs({ trail }: { trail: string[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
      <Link to="/" className="flex items-center gap-1 transition-colors hover:text-primary">
        <MaterialIcon name="home" size={15} />
        الرئيسية
      </Link>
      {trail.map((t, i) => (
        <span key={t} className="flex items-center gap-1.5">
          <MaterialIcon name="chevron_left" size={15} className="text-border" />
          <span className={i === trail.length - 1 ? "text-primary" : undefined}>{t}</span>
        </span>
      ))}
    </nav>
  );
}

export function PageBanner({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4 text-primary-foreground"
      style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-raised)" }}
    >
      <span className="grid size-11 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
        <MaterialIcon name={icon} size={24} filled />
      </span>
      <div className="min-w-0">
        <h1 className="text-lg font-extrabold tracking-tight md:text-xl">{title}</h1>
        {subtitle && <p className="text-[12px] font-semibold text-white/75">{subtitle}</p>}
      </div>
      {actions && <div className="ms-auto flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  icon,
  actions,
  children,
  padded = true,
}: {
  title?: string;
  icon?: string;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-card"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {title && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            {icon && <MaterialIcon name={icon} size={19} className="text-primary" filled />}
            {title}
          </h2>
          {actions && <div className="ms-auto flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-foreground/80">
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
      {children ?? <Input />}
    </label>
  );
}

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/25";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${props.className ?? ""}`} />;
}

export function Select({ options = ["اختر ...."] }: { options?: string[] }) {
  return (
    <div className="relative">
      <select className={`${control} appearance-none pe-9`} defaultValue={options[0]}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <MaterialIcon
        name="expand_more"
        size={18}
        className="pointer-events-none absolute inset-y-0 left-2.5 my-auto h-fit text-muted-foreground"
      />
    </div>
  );
}

export function DateInput() {
  return <input type="date" className={control} />;
}

export function Btn({
  children,
  icon,
  variant = "primary",
  onClick,
  type = "button",
}: {
  children?: ReactNode;
  icon?: string;
  variant?: "primary" | "ghost" | "soft" | "teal" | "onDark";
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const styles: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    teal: "bg-teal text-primary-foreground hover:opacity-90",
    soft: "bg-secondary text-secondary-foreground hover:bg-accent",
    ghost: "border border-border bg-card text-foreground hover:bg-secondary",
    onDark: "bg-white/15 text-primary-foreground ring-1 ring-white/25 hover:bg-white/25",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors ${styles[variant]}`}
    >
      {icon && <MaterialIcon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function TableToolbar({ title }: { title: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
      <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
        <MaterialIcon name="table_rows" size={19} className="text-primary" filled />
        {title}
      </h2>
      <div className="relative">
        <Input placeholder="ابحث..." className="h-9 w-48 pe-9" />
        <MaterialIcon
          name="search"
          size={17}
          className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
        />
      </div>
      {[
        { icon: "picture_as_pdf", label: "PDF" },
        { icon: "table_view", label: "Excel" },
        { icon: "print", label: "طباعة" },
      ].map((b) => (
        <button
          key={b.label}
          title={b.label}
          className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-primary transition-colors hover:bg-accent"
        >
          <MaterialIcon name={b.icon} size={18} />
        </button>
      ))}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  render,
  empty = "لا توجد بيانات",
}: {
  columns: string[];
  rows: Record<string, ReactNode>[];
  render?: (row: Record<string, ReactNode>, col: string) => ReactNode;
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-right">
        <thead>
          <tr className="bg-secondary">
            {columns.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap border-b border-border px-4 py-3 text-[12px] font-extrabold text-secondary-foreground"
              >
                <span className="flex items-center gap-1.5">
                  {c}
                  <MaterialIcon name="filter_list" size={14} className="text-primary/50" />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-14 text-center text-sm font-semibold text-muted-foreground"
              >
                {empty}
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-border transition-colors last:border-0 odd:bg-secondary/35 hover:bg-accent/50"
            >
              {columns.map((c) => (
                <td key={c} className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold">
                  {render ? render(r, c) : r[c]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ page = 1, pages = 1, total = 0 }: { page?: number; pages?: number; total?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 text-[12px] font-bold">
      <div className="flex items-center gap-1">
        {[5, 10, 20].map((n) => (
          <button
            key={n}
            className={`grid size-8 place-items-center rounded-lg transition-colors ${
              n === 10 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="ms-auto flex items-center gap-1">
        <span className="me-2 text-muted-foreground">
          صفحة {page} من {pages} ({total} عنصر)
        </span>
        <button className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary">
          <MaterialIcon name="chevron_right" size={18} />
        </button>
        {Array.from({ length: Math.min(pages, 4) }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`grid size-8 place-items-center rounded-lg transition-colors ${
              n === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {n}
          </button>
        ))}
        <button className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary">
          <MaterialIcon name="chevron_left" size={18} />
        </button>
      </div>
    </div>
  );
}

export function Chip({ label, tone = "blue" }: { label: string; tone?: "blue" | "green" | "amber" | "teal" | "muted" }) {
  const tones: Record<string, string> = {
    blue: "bg-gblue/10 text-gblue border-gblue/25",
    green: "bg-ggreen/12 text-ggreen border-ggreen/30",
    amber: "bg-gyellow/15 text-gold border-gyellow/35",
    teal: "bg-teal/12 text-teal border-teal/30",
    muted: "bg-secondary text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>
      {label}
    </span>
  );
}

export function Check({ label, hint, defaultChecked }: { label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-[var(--primary)]"
      />
      <span>
        <span className="block text-[13px] font-bold">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] font-semibold text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function Fieldset({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-secondary/40 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-[13px] font-extrabold">
        <span className="grid size-6 place-items-center rounded-lg bg-primary text-[11px] text-primary-foreground">
          {index}
        </span>
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}