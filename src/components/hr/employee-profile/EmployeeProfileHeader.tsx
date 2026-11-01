import React, { useRef } from "react";
import {
  Hash,
  Fingerprint,
  IdCard,
  Banknote,
  TrendingDown,
  Wallet,
  CheckCircle2,
  XCircle,
  Camera,
  ArrowRight,
  FileEdit,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatNumber } from "./shared";

interface EmployeeProfileHeaderProps {
  employee: any;
  totalSalary: number;
  totalDeductions: number;
  netSalary: number;
  statusFlags: {
    onDuty: boolean;
    mawaridRegistered: boolean;
    exemptFromFingerprintDeductions: boolean;
    showInFingerprintReports: boolean;
  };
  onToggleFlag: (key: keyof EmployeeProfileHeaderProps["statusFlags"]) => void;
  onAvatarChange: (dataUrl: string) => void;
  onRequestDataUpdate?: () => void;
}

export function EmployeeProfileHeader({
  employee,
  totalSalary,
  totalDeductions,
  netSalary,
  statusFlags,
  onToggleFlag,
  onAvatarChange,
  onRequestDataUpdate,
}: EmployeeProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onAvatarChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const isActive = (employee.status || "active") === "active";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Main Hero Row */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        {/* Right Side (RTL): Avatar + Name + Status */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/40 px-6 py-4 lg:w-64 shrink-0">
          <div className="relative mb-2.5">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#a3e635] bg-gradient-to-b from-slate-100 to-slate-200 shadow-md">
              {employee.avatar_url ? (
                <img
                  src={employee.avatar_url}
                  alt={employee.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  viewBox="0 0 100 100"
                  className="h-20 w-20 text-slate-500"
                  fill="currentColor"
                >
                  <circle cx="50" cy="36" r="18" fill="#475569" />
                  <path
                    d="M20 88 C20 64, 80 64, 80 88 Z"
                    fill="#334155"
                  />
                </svg>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="تغيير الصورة الشخصية"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-blue-600 whitespace-nowrap"
            >
              <Camera className="h-2.5 w-2.5" />
              اختر ملف
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          <h2 className="mt-1 text-center text-base font-extrabold text-slate-900">
            {employee.full_name || "—"}
          </h2>

          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-0.5 text-xs font-bold text-amber-800">
            <span
              className={`h-2 w-2 rounded-full ${
                isActive ? "bg-amber-500" : "bg-rose-500"
              }`}
            />
            {isActive ? "مفعل" : "غير مفعل"}
          </div>

          {onRequestDataUpdate && (
            <button
              type="button"
              onClick={onRequestDataUpdate}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/90 px-3.5 py-1.5 text-xs font-bold text-[#0070c0] hover:bg-blue-100 hover:text-[#005fa3] transition shadow-2xs cursor-pointer"
            >
              <FileEdit className="h-3.5 w-3.5" />
              طلب تحديث بيانات
            </button>
          )}
        </div>

        {/* Left Side: 2 Rows of 3 Summary Cards */}
        <div className="flex-1 space-y-3">
          {/* Row 1: Identification Numbers */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* الرقم الوظيفي */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Hash className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-400">
                  الرقم الوظيفي
                </p>
                <p className="text-lg font-extrabold text-slate-800" dir="ltr">
                  {employee.emp_no || "—"}
                </p>
              </div>
            </div>

            {/* رقم البصمه */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-400">
                  رقم البصمه
                </p>
                <p className="text-lg font-extrabold text-slate-800" dir="ltr">
                  {employee.fingerprint_no || employee.emp_no || "—"}
                </p>
              </div>
            </div>

            {/* رقم الهويه */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <IdCard className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-400">
                  رقم الهويه
                </p>
                <p className="text-lg font-extrabold text-slate-800" dir="ltr">
                  {employee.national_id || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Financial Totals */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* اجمالى الراتب */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-emerald-700">
                  اجمالى الراتب
                </p>
                <p
                  className="text-xl font-extrabold text-emerald-800"
                  dir="ltr"
                >
                  {formatNumber(totalSalary)}
                </p>
              </div>
            </div>

            {/* اجمالى الاستقطاعات */}
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-amber-700">
                  اجمالى الاستقطاعات
                </p>
                <p className="text-xl font-extrabold text-amber-800" dir="ltr">
                  {formatNumber(totalDeductions)}
                </p>
              </div>
            </div>

            {/* الصافى */}
            <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-blue-700">الصافى</p>
                <p className="text-xl font-extrabold text-blue-800" dir="ltr">
                  {formatNumber(netSalary)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: 4 Interactive Status Pills */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            key: "onDuty" as const,
            label: "على راس العمل",
            active: statusFlags.onDuty,
          },
          {
            key: "mawaridRegistered" as const,
            label: "مقيد موارد",
            active: statusFlags.mawaridRegistered,
          },
          {
            key: "exemptFromFingerprintDeductions" as const,
            label: "مستثنى من خصومات البصمة",
            active: statusFlags.exemptFromFingerprintDeductions,
          },
          {
            key: "showInFingerprintReports" as const,
            label: "عرض في تقارير البصمه",
            active: statusFlags.showInFingerprintReports,
          },
        ].map((pill) => (
          <button
            key={pill.key}
            type="button"
            onClick={() => onToggleFlag(pill.key)}
            className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95 ${
              pill.active
                ? "bg-gradient-to-l from-blue-600 to-blue-700"
                : "bg-gradient-to-l from-rose-500 to-red-600"
            }`}
          >
            <span>{pill.label}</span>
            {pill.active ? (
              <CheckCircle2 className="h-4 w-4 text-white/90" />
            ) : (
              <XCircle className="h-4 w-4 text-white/90" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
