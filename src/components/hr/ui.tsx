import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";

export function Breadcrumbs({ trail }: { trail: string[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium text-slate-500 mb-2">
      <Link
        to="/"
        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-slate-600 hover:bg-slate-100 hover:text-[#0b57d0] transition-colors"
      >
        <MaterialIcon name="home" size={16} />
        <span>الرئيسية</span>
      </Link>
      {trail.map((t, i) => (
        <span key={t} className="flex items-center gap-1.5">
          <MaterialIcon name="chevron_left" size={16} className="text-slate-400" />
          <span
            className={`rounded-full px-2 py-0.5 ${
              i === trail.length - 1
                ? "bg-[#e8f0fe] font-bold text-[#0b57d0]"
                : "text-slate-600"
            }`}
          >
            {t}
          </span>
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
    <div className="mt-2 flex flex-wrap items-center gap-4 rounded-3xl bg-gradient-to-l from-[#0b57d0] via-[#004e82] to-[#0842a0] p-5 text-white shadow-[0_4px_20px_0_rgba(11,87,208,0.25)]">
      <span className="grid size-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
        <MaterialIcon name={icon} size={26} filled />
      </span>
      <div className="min-w-0">
        <h1 className="text-lg font-extrabold tracking-tight md:text-xl">{title}</h1>
        {subtitle && <p className="text-[12px] font-medium text-white/80 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="ms-auto flex flex-wrap items-center gap-2">{actions}</div>}
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
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(60,64,67,0.08),0_4px_12px_0_rgba(60,64,67,0.06)] transition-shadow hover:shadow-[0_2px_6px_0_rgba(60,64,67,0.12),0_8px_24px_0_rgba(60,64,67,0.08)]">
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-[#fcfdff] px-6 py-4">
          <h2 className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
            {icon && (
              <span className="grid size-8 place-items-center rounded-full bg-[#e8f0fe] text-[#0b57d0]">
                <MaterialIcon name={icon} size={18} filled />
              </span>
            )}
            <span>{title}</span>
          </h2>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-6" : undefined}>{children}</div>
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
      <span className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-slate-700">
        {label}
        {required && <span className="text-rose-600 font-extrabold">*</span>}
      </span>
      {children ?? <Input />}
    </label>
  );
}

const control =
  "h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-[13px] font-medium text-slate-800 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-[#0b57d0] focus:ring-2 focus:ring-[#0b57d0]/20";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${props.className ?? ""}`} />;
}

export function Select({
  options = ["اختر ...."],
  value,
  onChange,
}: {
  options?: string[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`${control} appearance-none pe-9 font-medium`}
        defaultValue={value ? undefined : options[0]}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <MaterialIcon
        name="arrow_drop_down"
        size={22}
        className="pointer-events-none absolute inset-y-0 left-2.5 my-auto h-fit text-slate-500"
      />
    </div>
  );
}

export function DateInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="date" {...props} className={`${control} ${props.className ?? ""}`} />;
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
    // Google Material 3 Filled Button
    primary: "bg-[#0b57d0] text-white shadow-xs hover:bg-[#0842a0] hover:shadow-md active:bg-[#063177]",
    // Google Material 3 Tonal Button
    teal: "bg-[#d3e3fd] text-[#041e49] hover:bg-[#c2e7ff] active:bg-[#b0d8fd]",
    // Google Material 3 Surface Button
    soft: "bg-[#f0f4f9] text-[#1f1f1f] hover:bg-[#e9eef6] active:bg-[#dde3ea]",
    // Google Material 3 Outlined Button
    ghost: "border border-slate-300 bg-white text-[#0b57d0] hover:bg-[#f0f4f9] active:bg-[#e8f0fe]",
    // MD3 Header Action
    onDark: "bg-white/20 text-white ring-1 ring-white/30 hover:bg-white/30 active:bg-white/40 backdrop-blur-xs",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-[13px] font-bold transition-all ${styles[variant]}`}
    >
      {icon && <MaterialIcon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function TableToolbar({ title }: { title: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-[#fcfdff] px-5 py-3.5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <span className="grid size-7 place-items-center rounded-full bg-[#e8f0fe] text-[#0b57d0]">
          <MaterialIcon name="table_rows" size={16} filled />
        </span>
        {title}
      </h2>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Input placeholder="ابحث..." className="h-8.5 w-52 rounded-full pe-9 ps-3 text-xs bg-slate-50" />
          <MaterialIcon
            name="search"
            size={16}
            className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-slate-400"
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
            className="grid size-8.5 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-[#e8f0fe] hover:text-[#0b57d0] transition-colors"
          >
            <MaterialIcon name={b.icon} size={17} />
          </button>
        ))}
      </div>
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
      <table className="w-full min-w-max border-collapse text-right text-[12px]">
        <thead>
          <tr className="bg-[#f0f4f9] text-slate-800 border-b border-slate-200">
            {columns.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap px-4 py-3 font-bold text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  {c}
                  <MaterialIcon name="unfold_more" size={14} className="text-slate-400" />
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
                className="px-4 py-12 text-center text-sm font-medium text-slate-400"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                    <MaterialIcon name="folder_open" size={24} />
                  </span>
                  <span>{empty}</span>
                </div>
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-slate-100 transition-colors last:border-0 hover:bg-[#f8fafd]"
            >
              {columns.map((c) => (
                <td key={c} className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
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

export function Pager({
  page = 1,
  pages = 1,
  total = 0,
}: {
  page?: number;
  pages?: number;
  total?: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-[#fcfdff] px-6 py-3.5 text-[12px] font-bold">
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500 me-2">الصفوف لكل صفحة:</span>
        {[5, 10, 20].map((n) => (
          <button
            key={n}
            className={`grid size-8 place-items-center rounded-full text-xs font-bold transition-all ${
              n === 10
                ? "bg-[#0b57d0] text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="me-2 text-slate-500">
          صفحة {page} من {pages} ({total} عنصر)
        </span>
        <button className="grid size-8 place-items-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
          <MaterialIcon name="chevron_right" size={18} />
        </button>
        {Array.from({ length: Math.min(pages, 4) }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`grid size-8 place-items-center rounded-full text-xs font-bold transition-all ${
              n === page
                ? "bg-[#e8f0fe] text-[#0b57d0]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {n}
          </button>
        ))}
        <button className="grid size-8 place-items-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
          <MaterialIcon name="chevron_left" size={18} />
        </button>
      </div>
    </div>
  );
}

export function Chip({
  label,
  tone = "blue",
}: {
  label: string;
  tone?: "blue" | "green" | "amber" | "teal" | "muted";
}) {
  const tones: Record<string, string> = {
    blue: "bg-[#e8f0fe] text-[#0b57d0] border-[#c2e7ff]",
    green: "bg-[#e6f4ea] text-[#137333] border-[#ceead6]",
    amber: "bg-[#fef7e0] text-[#b06000] border-[#feefc3]",
    teal: "bg-[#e0f2f1] text-[#00695c] border-[#b2dfdb]",
    muted: "bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-[11px] font-bold ${tones[tone]}`}>
      {label}
    </span>
  );
}

export function Check({
  label,
  hint,
  defaultChecked,
}: {
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-[#0b57d0] hover:shadow-xs">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 rounded accent-[#0b57d0]"
      />
      <span>
        <span className="block text-[13px] font-bold text-slate-800">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] font-medium text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

export function Fieldset({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-[#f8fafd] p-6 shadow-2xs">
      <h3 className="mb-4 flex items-center gap-2 text-[13px] font-extrabold text-slate-800">
        <span className="grid size-6 place-items-center rounded-full bg-[#0b57d0] text-[11px] text-white">
          {index}
        </span>
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}