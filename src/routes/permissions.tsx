import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, Btn, Card, Chip, PageBanner } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  ADMIN_FORM_FEATURES,
  DASHBOARD_FEATURES,
  DATA_UPDATE_FEATURES,
  PERMISSION_RESOURCES,
  type PermissionFeature,
} from "@/lib/permission-catalog";
import {
  listSystemUsers,
  saveSystemUser,
  type SystemUser,
  type SystemUserRole,
} from "@/lib/permissions.functions";
import {
  useCurrentIsAdmin,
  useReplaceGroupMembers,
  useReplacePermissionScopes,
  useSavePermissionFeatures,
  useSavePermissionRules,
} from "@/lib/permissions-db";
import { useDeleteRow, useRows, useSaveRow, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/permissions")({
  head: () => ({
    meta: [
      { title: "الصلاحيات | نظام الموارد البشرية" },
      {
        name: "description",
        content:
          "إدارة مستخدمي النظام والمجموعات وصلاحيات الشاشات والفروع وتحديث البيانات والنماذج ولوحة المعلومات.",
      },
    ],
  }),
  component: PermissionsPage,
});

type TabId = "users" | "groups" | "screens" | "scopes" | "updates" | "forms" | "dashboard";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "users", label: "المستخدمون", icon: "manage_accounts" },
  { id: "groups", label: "المجموعات", icon: "group_work" },
  { id: "screens", label: "صلاحيات الشاشات", icon: "grid_view" },
  { id: "scopes", label: "الفروع والأقسام", icon: "account_tree" },
  { id: "updates", label: "تفعيل تحديث البيانات", icon: "upload_file" },
  { id: "forms", label: "طباعة النماذج الإدارية", icon: "print" },
  { id: "dashboard", label: "صلاحيات لوحة المعلومات", icon: "dashboard" },
];

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/25";

const roleLabels: Record<SystemUserRole, string> = {
  admin: "مدير النظام",
  manager: "مدير",
  employee: "مستخدم",
};

function PermissionsPage() {
  const [tab, setTab] = useState<TabId>("users");
  const admin = useCurrentIsAdmin();

  return (
    <AppShell>
      <Breadcrumbs trail={["الصلاحيات"]} />
      <PageBanner
        icon="shield_person"
        title="مركز الصلاحيات"
        subtitle="إدارة المستخدمين والمجموعات وتحديد ما يمكن لكل مجموعة عرضه أو تنفيذه"
      />

      <div
        className="mt-4 flex gap-1.5 overflow-x-auto rounded-2xl border border-border bg-card p-2 [scrollbar-width:thin]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-[12px] font-bold transition-colors ${
              tab === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <MaterialIcon name={item.icon} size={17} filled={tab === item.id} />
            {item.label}
          </button>
        ))}
      </div>

      {admin.isLoading ? (
        <StateMessage icon="progress_activity" text="جارٍ التحقق من صلاحية الإدارة..." spin />
      ) : admin.error ? (
        <StateMessage
          icon="error"
          text="تعذر التحقق من الصلاحية. تأكد من تطبيق تحديث قاعدة البيانات."
        />
      ) : !admin.data ? (
        <StateMessage icon="lock" text="هذه الصفحة متاحة لمديري النظام فقط." />
      ) : (
        <div className="mt-4">
          {tab === "users" && <UsersPanel />}
          {tab === "groups" && <GroupsPanel />}
          {tab === "screens" && <ScreenPermissionsPanel />}
          {tab === "scopes" && <ScopesPanel />}
          {tab === "updates" && (
            <FeaturePermissionsPanel
              category="data_update"
              title="تفعيل تحديث البيانات"
              description="حدد نماذج الاستيراد والتحديث الجماعي المسموح بها لكل مجموعة"
              icon="upload_file"
              features={DATA_UPDATE_FEATURES}
            />
          )}
          {tab === "forms" && (
            <FeaturePermissionsPanel
              category="admin_forms"
              title="صلاحيات طباعة النماذج الإدارية"
              description="حدد النماذج التي يمكن لمستخدمي المجموعة طباعتها أو إصدارها"
              icon="print"
              features={ADMIN_FORM_FEATURES}
            />
          )}
          {tab === "dashboard" && (
            <FeaturePermissionsPanel
              category="dashboard"
              title="صلاحيات لوحة المعلومات"
              description="تحكم في البطاقات والمؤشرات والرسومات الظاهرة لكل مجموعة"
              icon="dashboard"
              features={DASHBOARD_FEATURES}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}

function StateMessage({
  icon,
  text,
  spin = false,
}: {
  icon: string;
  text: string;
  spin?: boolean;
}) {
  return (
    <div className="mt-4 grid min-h-64 place-items-center rounded-2xl border border-border bg-card p-8 text-center">
      <div>
        <MaterialIcon
          name={icon}
          size={38}
          className={`mx-auto text-primary ${spin ? "animate-spin" : ""}`}
          filled
        />
        <p className="mt-3 text-sm font-bold text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function useSystemUsers() {
  return useQuery({
    queryKey: ["permissions", "users"],
    queryFn: () => listSystemUsers(),
  });
}

function Toolbar({
  term,
  onTerm,
  count,
  exportRows,
}: {
  term: string;
  onTerm: (value: string) => void;
  count: number;
  exportRows: (string | number | boolean)[][];
}) {
  const exportCsv = () => {
    const csv = exportRows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "permissions-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
      <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-extrabold text-primary">
        {count} سجل
      </span>
      <div className="relative ms-auto">
        <input
          value={term}
          onChange={(event) => onTerm(event.target.value)}
          placeholder="ابحث..."
          className={`${control} h-9 w-52 pe-9`}
        />
        <MaterialIcon
          name="search"
          size={17}
          className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
        />
      </div>
      <ToolButton icon="table_view" label="Excel" onClick={exportCsv} />
      <ToolButton icon="picture_as_pdf" label="PDF" onClick={() => window.print()} />
      <ToolButton icon="print" label="طباعة" onClick={() => window.print()} />
    </div>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-xl bg-teal text-white transition-opacity hover:opacity-90"
    >
      <MaterialIcon name={icon} size={18} />
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-teal" : "bg-muted"}`}
    >
      <span
        className={`absolute top-1 size-4 rounded-full bg-white shadow transition-all ${checked ? "right-6" : "right-1"}`}
      />
    </button>
  );
}

function UsersPanel() {
  const queryClient = useQueryClient();
  const usersQuery = useSystemUsers();
  const [term, setTerm] = useState("");
  const [role, setRole] = useState("");
  const [empNo, setEmpNo] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [draft, setDraft] = useState<(Partial<SystemUser> & { password?: string }) | null>(null);

  const save = useMutation({
    mutationFn: (value: NonNullable<typeof draft>) =>
      saveSystemUser({
        data: {
          ...(value.id ? { id: value.id } : {}),
          fullName: value.fullName ?? "",
          email: value.email ?? "",
          password: value.password ?? "",
          accountType: value.accountType ?? "إداري",
          empNo: value.empNo ?? "",
          nationalId: value.nationalId ?? "",
          role: value.role ?? "employee",
          isActive: value.isActive ?? true,
        },
      }),
    onSuccess: (_saved, value) => {
      queryClient.invalidateQueries({ queryKey: ["permissions", "users"] });
      toast.success(value.id ? "تم تحديث المستخدم" : "تمت إضافة المستخدم");
      setDraft(null);
    },
    onError: (error: Error) => toast.error(`تعذر حفظ المستخدم: ${error.message}`),
  });

  const filtered = useMemo(() => {
    const users = usersQuery.data ?? [];
    const search = term.trim().toLowerCase();
    return users.filter(
      (user) =>
        (!role || user.role === role) &&
        (!empNo.trim() || user.empNo.includes(empNo.trim())) &&
        (!nationalId.trim() || user.nationalId.includes(nationalId.trim())) &&
        (!search ||
          [user.fullName, user.email, user.accountType, user.empNo, user.nationalId].some((value) =>
            value.toLowerCase().includes(search),
          )),
    );
  }, [usersQuery.data, role, empNo, nationalId, term]);

  return (
    <>
      <Card title="البحث عن المستخدمين" icon="manage_search">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="mb-1.5 block text-[12px] font-bold">نوع المستخدم</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className={control}
            >
              <option value="">كل المستخدمين</option>
              <option value="admin">مدير النظام</option>
              <option value="manager">مدير</option>
              <option value="employee">مستخدم</option>
            </select>
          </label>
          <LabeledInput label="الرقم الوظيفي" value={empNo} onChange={setEmpNo} />
          <LabeledInput label="رقم الهوية" value={nationalId} onChange={setNationalId} />
          <div className="flex items-end">
            <Btn icon="search" onClick={() => undefined}>
              بحث
            </Btn>
          </div>
        </div>
      </Card>

      <div
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <MaterialIcon name="group" size={19} className="text-primary" filled />
            المستخدمون
          </h2>
          <div className="ms-auto">
            <Btn
              icon="person_add"
              onClick={() =>
                setDraft({
                  fullName: "",
                  email: "",
                  password: "",
                  accountType: "إداري",
                  empNo: "",
                  nationalId: "",
                  role: "employee",
                  isActive: true,
                })
              }
            >
              إضافة مستخدم
            </Btn>
          </div>
        </div>
        <Toolbar
          term={term}
          onTerm={setTerm}
          count={filtered.length}
          exportRows={[
            [
              "اسم المستخدم",
              "نوع المستخدم",
              "البريد الإلكتروني",
              "الرقم الوظيفي",
              "رقم الهوية",
              "الحالة",
            ],
            ...filtered.map((user) => [
              user.fullName,
              roleLabels[user.role],
              user.email,
              user.empNo,
              user.nationalId,
              user.isActive ? "مفعل" : "موقوف",
            ]),
          ]}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-right">
            <thead className="bg-secondary text-[12px] font-extrabold">
              <tr>
                {[
                  "اسم المستخدم",
                  "نوع المستخدم",
                  "البريد الإلكتروني",
                  "الرقم الوظيفي",
                  "رقم الهوية",
                  "آخر دخول",
                  "تعديل",
                  "تفعيل / إيقاف",
                ].map((heading) => (
                  <th key={heading} className="border-b border-border px-4 py-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(usersQuery.isLoading || usersQuery.error || filtered.length === 0) && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-sm font-bold text-muted-foreground"
                  >
                    {usersQuery.isLoading
                      ? "جارٍ تحميل المستخدمين..."
                      : usersQuery.error
                        ? "تعذر تحميل المستخدمين"
                        : "لا توجد بيانات"}
                  </td>
                </tr>
              )}
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border odd:bg-secondary/35 hover:bg-accent/40"
                >
                  <td className="px-4 py-3 text-[13px] font-bold">{user.fullName || "—"}</td>
                  <td className="px-4 py-3">
                    <Chip
                      label={roleLabels[user.role]}
                      tone={
                        user.role === "admin" ? "blue" : user.role === "manager" ? "teal" : "muted"
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-[12px] font-semibold" dir="ltr">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-[12px] font-semibold">{user.empNo || "—"}</td>
                  <td className="px-4 py-3 text-[12px] font-semibold">{user.nationalId || "—"}</td>
                  <td className="px-4 py-3 text-[11px] font-semibold text-muted-foreground">
                    {user.lastSignInAt
                      ? new Date(user.lastSignInAt).toLocaleString("ar-SA")
                      : "لم يسجل الدخول"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDraft({ ...user, password: "" })}
                      className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"
                      title="تعديل"
                    >
                      <MaterialIcon name="edit" size={17} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Toggle
                      checked={user.isActive}
                      label={`تفعيل ${user.fullName}`}
                      onChange={(value) => save.mutate({ ...user, password: "", isActive: value })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <UserDialog
          draft={draft}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={() => save.mutate(draft)}
          saving={save.isPending}
        />
      )}
    </>
  );
}

function UserDialog({
  draft,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  draft: Partial<SystemUser> & { password?: string };
  onChange: (value: Partial<SystemUser> & { password?: string }) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = (key: string, value: string | boolean) => onChange({ ...draft, [key]: value });
  return (
    <Dialog
      title={draft.id ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
      icon="person_add"
      onClose={onClose}
    >
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <LabeledInput
          label="اسم المستخدم"
          value={draft.fullName ?? ""}
          onChange={(value) => set("fullName", value)}
          required
        />
        <LabeledInput
          label="البريد الإلكتروني"
          type="email"
          value={draft.email ?? ""}
          onChange={(value) => set("email", value)}
          required
        />
        <LabeledInput
          label={draft.id ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}
          type="password"
          value={draft.password ?? ""}
          onChange={(value) => set("password", value)}
          required={!draft.id}
        />
        <LabeledInput
          label="نوع المستخدم"
          value={draft.accountType ?? ""}
          onChange={(value) => set("accountType", value)}
          required
        />
        <LabeledInput
          label="الرقم الوظيفي"
          value={draft.empNo ?? ""}
          onChange={(value) => set("empNo", value)}
        />
        <LabeledInput
          label="رقم الهوية"
          value={draft.nationalId ?? ""}
          onChange={(value) => set("nationalId", value)}
        />
        <label>
          <span className="mb-1.5 block text-[12px] font-bold">الدور الأساسي</span>
          <select
            value={draft.role ?? "employee"}
            onChange={(event) => set("role", event.target.value)}
            className={control}
          >
            <option value="admin">مدير النظام</option>
            <option value="manager">مدير</option>
            <option value="employee">مستخدم</option>
          </select>
        </label>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 sm:self-end">
          <Toggle
            checked={draft.isActive ?? true}
            onChange={(value) => set("isActive", value)}
            label="حالة المستخدم"
          />
          <span className="text-[12px] font-bold">
            {(draft.isActive ?? true) ? "المستخدم مفعل" : "المستخدم موقوف"}
          </span>
        </div>
      </div>
      <DialogActions onClose={onClose} onSave={onSave} saving={saving} />
    </Dialog>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[12px] font-bold">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={control}
      />
    </label>
  );
}

function GroupsPanel() {
  const { data: groups = [], isLoading } = useRows("permission_groups", {
    orderBy: "name",
    ascending: true,
  });
  const { data: members = [] } = useRows("permission_group_members");
  const usersQuery = useSystemUsers();
  const save = useSaveRow("permission_groups");
  const del = useDeleteRow("permission_groups");
  const replaceMembers = useReplaceGroupMembers();
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [draft, setDraft] = useState<Row | null>(null);
  const [memberGroup, setMemberGroup] = useState<Row | null>(null);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());

  const filtered = groups.filter((group) =>
    String(group["name"] ?? "")
      .toLowerCase()
      .includes(term.toLowerCase()),
  );
  const memberCount = (groupId: string) =>
    members.filter((member) => member["group_id"] === groupId).length;

  const openMembers = (group: Row) => {
    setMemberGroup(group);
    setMemberIds(
      new Set(
        members
          .filter((member) => member["group_id"] === group["id"])
          .map((member) => String(member["user_id"])),
      ),
    );
  };

  return (
    <>
      <Card title="إضافة مجموعة صلاحيات" icon="group_add">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <LabeledInput label="اسم المجموعة" value={name} onChange={setName} required />
          </div>
          <Btn
            icon="save"
            onClick={async () => {
              if (!name.trim()) {
                toast.error("أدخل اسم المجموعة");
                return;
              }
              await save.mutateAsync({ name: name.trim(), is_active: true, is_system: false });
              setName("");
            }}
          >
            حفظ
          </Btn>
        </div>
      </Card>
      <div
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <Toolbar
          term={term}
          onTerm={setTerm}
          count={filtered.length}
          exportRows={[
            ["اسم المجموعة", "عدد المستخدمين", "الحالة"],
            ...filtered.map((group) => [
              String(group["name"]),
              memberCount(String(group["id"])),
              group["is_active"] ? "مفعل" : "موقوف",
            ]),
          ]}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-right">
            <thead className="bg-secondary text-[12px] font-extrabold">
              <tr>
                {[
                  "اسم المجموعة",
                  "عدد المستخدمين",
                  "إضافة مستخدمين للمجموعة",
                  "تعديل",
                  "حذف",
                  "تفعيل / إيقاف",
                ].map((heading) => (
                  <th key={heading} className="border-b border-border px-4 py-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(isLoading || filtered.length === 0) && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-14 text-center text-sm font-bold text-muted-foreground"
                  >
                    {isLoading ? "جارٍ التحميل..." : "لا توجد مجموعات"}
                  </td>
                </tr>
              )}
              {filtered.map((group) => (
                <tr
                  key={String(group["id"])}
                  className="border-b border-border odd:bg-secondary/35 hover:bg-accent/40"
                >
                  <td className="px-4 py-3 text-[13px] font-bold">
                    <span className="flex items-center gap-2">
                      <MaterialIcon name="group_work" size={18} className="text-primary" filled />
                      {String(group["name"])}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] font-bold">
                    {memberCount(String(group["id"]))}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openMembers(group)}
                      className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-2 text-[12px] font-bold text-white"
                    >
                      <MaterialIcon name="person_add" size={16} />
                      إضافة المستخدمين
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDraft({ ...group })}
                      className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"
                    >
                      <MaterialIcon name="edit" size={17} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {!group["is_system"] && (
                      <button
                        onClick={() =>
                          confirm("هل تريد حذف المجموعة؟") && del.mutate(String(group["id"]))
                        }
                        className="grid size-8 place-items-center rounded-lg bg-destructive/10 text-destructive"
                      >
                        <MaterialIcon name="delete" size={17} />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Toggle
                      checked={Boolean(group["is_active"])}
                      onChange={(value) => save.mutate({ ...group, is_active: value })}
                      label="حالة المجموعة"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <Dialog title="تعديل المجموعة" icon="edit" onClose={() => setDraft(null)}>
          <div className="grid gap-4 p-5">
            <LabeledInput
              label="اسم المجموعة"
              value={String(draft["name"] ?? "")}
              onChange={(value) => setDraft({ ...draft, name: value })}
              required
            />
            <LabeledInput
              label="الوصف"
              value={String(draft["description"] ?? "")}
              onChange={(value) => setDraft({ ...draft, description: value })}
            />
          </div>
          <DialogActions
            onClose={() => setDraft(null)}
            onSave={async () => {
              await save.mutateAsync(draft);
              setDraft(null);
            }}
            saving={save.isPending}
          />
        </Dialog>
      )}

      {memberGroup && (
        <Dialog
          title={`مستخدمو مجموعة ${String(memberGroup["name"])}`}
          icon="group_add"
          onClose={() => setMemberGroup(null)}
        >
          <div className="max-h-[55vh] space-y-2 overflow-y-auto p-5">
            {usersQuery.isLoading && (
              <p className="py-8 text-center text-sm font-bold text-muted-foreground">
                جارٍ تحميل المستخدمين...
              </p>
            )}
            {(usersQuery.data ?? []).map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-secondary/50"
              >
                <input
                  type="checkbox"
                  checked={memberIds.has(user.id)}
                  onChange={(event) => {
                    const next = new Set(memberIds);
                    if (event.target.checked) next.add(user.id);
                    else next.delete(user.id);
                    setMemberIds(next);
                  }}
                  className="size-4 accent-primary"
                />
                <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                  <MaterialIcon name="person" size={18} filled />
                </span>
                <span>
                  <span className="block text-[13px] font-bold">{user.fullName || user.email}</span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {user.email} · {roleLabels[user.role]}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <DialogActions
            onClose={() => setMemberGroup(null)}
            onSave={async () => {
              await replaceMembers.mutateAsync({
                groupId: String(memberGroup["id"]),
                userIds: Array.from(memberIds),
              });
              setMemberGroup(null);
            }}
            saving={replaceMembers.isPending}
          />
        </Dialog>
      )}
    </>
  );
}

type RuleField = "is_enabled" | "can_read" | "can_create" | "can_update" | "can_delete";
type RuleState = Record<string, Record<RuleField, boolean>>;

function ScreenPermissionsPanel() {
  const { data: groups = [] } = useRows("permission_groups", { orderBy: "name", ascending: true });
  const [groupId, setGroupId] = useState("");
  const { data: storedRules = [] } = useRows("permission_rules", {
    filters: { group_id: groupId || "00000000-0000-0000-0000-000000000000" },
    orderBy: "resource_name",
    ascending: true,
  });
  const save = useSavePermissionRules();
  const [rules, setRules] = useState<RuleState>({});
  const [term, setTerm] = useState("");
  const [section, setSection] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const selectedGroup = groups.find((group) => group["id"] === groupId);
  const selectedGroupName = String(selectedGroup?.["name"] ?? "");

  useEffect(() => {
    const stored = new Map(storedRules.map((rule) => [String(rule["resource_key"]), rule]));
    const adminDefaults = selectedGroupName.toLowerCase() === "admin";
    const next: RuleState = {};
    for (const resource of PERMISSION_RESOURCES) {
      const row = stored.get(resource.key);
      next[resource.key] = {
        is_enabled: row ? Boolean(row["is_enabled"]) : adminDefaults,
        can_read: row ? Boolean(row["can_read"]) : adminDefaults,
        can_create: row ? Boolean(row["can_create"]) : adminDefaults,
        can_update: row ? Boolean(row["can_update"]) : adminDefaults,
        can_delete: row ? Boolean(row["can_delete"]) : adminDefaults,
      };
    }
    setRules(next);
  }, [storedRules, groupId, selectedGroupName]);

  useEffect(() => setPage(1), [term, section, groupId]);
  const sections = Array.from(new Set(PERMISSION_RESOURCES.map((resource) => resource.section)));
  const filtered = PERMISSION_RESOURCES.filter(
    (resource) =>
      (!section || resource.section === section) &&
      (!term.trim() || resource.name.includes(term.trim())),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const update = (key: string, field: RuleField, value: boolean) =>
    setRules((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? {
          is_enabled: false,
          can_read: false,
          can_create: false,
          can_update: false,
          can_delete: false,
        }),
        [field]: value,
      },
    }));
  const toggleAll = (field: RuleField, value: boolean) =>
    setRules((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, rule]) => [key, { ...rule, [field]: value }]),
      ),
    );

  const saveRules = () =>
    save.mutate({
      groupId,
      rules: PERMISSION_RESOURCES.map((resource) => ({
        resource_key: resource.key,
        resource_name: resource.name,
        resource_section: resource.section,
        ...(rules[resource.key] ?? {}),
      })),
    });

  return (
    <>
      <Card title="صلاحيات الشاشات" icon="grid_view">
        <div className="flex flex-wrap items-end gap-3">
          <GroupSelect groups={groups} value={groupId} onChange={setGroupId} />
          <label className="min-w-56">
            <span className="mb-1.5 block text-[12px] font-bold">القسم</span>
            <select
              value={section}
              onChange={(event) => setSection(event.target.value)}
              className={control}
            >
              <option value="">كل أقسام النظام</option>
              {sections.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <Btn icon="save" onClick={saveRules}>
            {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </Btn>
        </div>
      </Card>
      <div
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <Toolbar
          term={term}
          onTerm={setTerm}
          count={filtered.length}
          exportRows={[
            ["اسم الشاشة", "قراءة", "إدخال", "تعديل", "حذف"],
            ...filtered.map((resource) => [
              resource.name,
              rules[resource.key]?.can_read ?? false,
              rules[resource.key]?.can_create ?? false,
              rules[resource.key]?.can_update ?? false,
              rules[resource.key]?.can_delete ?? false,
            ]),
          ]}
        />
        {!groupId ? (
          <StateMessage icon="group_work" text="اختر المجموعة لعرض صلاحيات الشاشات" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-right">
              <thead className="bg-primary text-primary-foreground text-[12px] font-extrabold">
                <tr>
                  <th className="px-4 py-3">تفعيل</th>
                  <th className="min-w-[460px] px-4 py-3">اسم الشاشة</th>
                  {(["can_read", "can_create", "can_update", "can_delete"] as RuleField[]).map(
                    (field, index) => (
                      <th key={field} className="px-4 py-3 text-center">
                        <span className="flex items-center justify-center gap-2">
                          <input
                            type="checkbox"
                            onChange={(event) => toggleAll(field, event.target.checked)}
                            className="size-4 accent-teal"
                          />
                          {["قراءة", "إدخال", "تعديل", "حذف"][index]}
                        </span>
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((resource) => {
                  const rule = rules[resource.key];
                  return (
                    <tr
                      key={resource.key}
                      className="border-b border-border odd:bg-secondary/35 hover:bg-accent/40"
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={rule?.is_enabled ?? false}
                          onChange={(event) =>
                            update(resource.key, "is_enabled", event.target.checked)
                          }
                          className="size-4 accent-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="block text-[12.5px] font-bold">{resource.name}</span>
                        <span className="text-[10.5px] font-semibold text-muted-foreground">
                          {resource.section} · {resource.key}
                        </span>
                      </td>
                      {(["can_read", "can_create", "can_update", "can_delete"] as RuleField[]).map(
                        (field) => (
                          <td key={field} className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={rule?.[field] ?? false}
                              disabled={!rule?.is_enabled}
                              onChange={(event) =>
                                update(resource.key, field, event.target.checked)
                              }
                              className="size-4 accent-primary disabled:opacity-40"
                            />
                          </td>
                        ),
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {groupId && <Pagination page={page} pages={pages} onPage={setPage} />}
      </div>
    </>
  );
}

function ScopesPanel() {
  const { data: groups = [] } = useRows("permission_groups", { orderBy: "name", ascending: true });
  const { data: employees = [] } = useRows("employees", { limit: 5000 });
  const [groupId, setGroupId] = useState("");
  const { data: stored = [] } = useRows("permission_scopes", {
    filters: { group_id: groupId || "00000000-0000-0000-0000-000000000000" },
  });
  const save = useReplacePermissionScopes();
  const [branches, setBranches] = useState<Set<string>>(new Set());
  const [departments, setDepartments] = useState<Set<string>>(new Set());
  const branchOptions = useMemo(
    () =>
      Array.from(
        new Set(employees.map((row) => String(row["branch"] ?? "").trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "ar")),
    [employees],
  );
  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(employees.map((row) => String(row["department"] ?? "").trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "ar")),
    [employees],
  );

  useEffect(() => {
    setBranches(
      new Set(
        stored
          .filter((row) => row["scope_type"] === "branch")
          .map((row) => String(row["scope_value"])),
      ),
    );
    setDepartments(
      new Set(
        stored
          .filter((row) => row["scope_type"] === "department")
          .map((row) => String(row["scope_value"])),
      ),
    );
  }, [stored, groupId]);

  const toggleSet = (
    source: Set<string>,
    setSource: (next: Set<string>) => void,
    value: string,
  ) => {
    const next = new Set(source);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSource(next);
  };
  const saveScopes = () =>
    save.mutate({
      groupId,
      scopes: [
        ...Array.from(branches).map((value) => ({ scope_type: "branch", scope_value: value })),
        ...Array.from(departments).map((value) => ({
          scope_type: "department",
          scope_value: value,
        })),
      ],
    });

  return (
    <>
      <Card title="الفروع والأقسام" icon="account_tree">
        <div className="flex flex-wrap items-end gap-3">
          <GroupSelect groups={groups} value={groupId} onChange={setGroupId} />
          <Btn icon="save" onClick={saveScopes}>
            {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </Btn>
        </div>
      </Card>
      {!groupId ? (
        <StateMessage icon="group_work" text="اختر المجموعة لتحديد نطاق الفروع والأقسام" />
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChecklistCard
            title="الفروع المسموح بها"
            icon="corporate_fare"
            options={branchOptions}
            selected={branches}
            onToggle={(value) => toggleSet(branches, setBranches, value)}
            onAll={(checked) => setBranches(checked ? new Set(branchOptions) : new Set())}
          />
          <ChecklistCard
            title="الأقسام المسموح بها"
            icon="account_tree"
            options={departmentOptions}
            selected={departments}
            onToggle={(value) => toggleSet(departments, setDepartments, value)}
            onAll={(checked) => setDepartments(checked ? new Set(departmentOptions) : new Set())}
          />
        </div>
      )}
    </>
  );
}

function ChecklistCard({
  title,
  icon,
  options,
  selected,
  onToggle,
  onAll,
}: {
  title: string;
  icon: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onAll: (checked: boolean) => void;
}) {
  return (
    <Card
      title={title}
      icon={icon}
      actions={
        <label className="flex items-center gap-2 text-[11px] font-bold">
          <input
            type="checkbox"
            checked={options.length > 0 && selected.size === options.length}
            onChange={(event) => onAll(event.target.checked)}
            className="size-4 accent-primary"
          />
          تحديد الكل
        </label>
      }
    >
      <div className="max-h-[420px] space-y-2 overflow-y-auto">
        {options.length === 0 && (
          <p className="py-10 text-center text-sm font-bold text-muted-foreground">
            لا توجد بيانات مهيأة
          </p>
        )}
        {options.map((value) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-secondary/50"
          >
            <input
              type="checkbox"
              checked={selected.has(value)}
              onChange={() => onToggle(value)}
              className="size-4 accent-primary"
            />
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <MaterialIcon name={icon} size={17} filled />
            </span>
            <span className="text-[12.5px] font-bold">{value}</span>
          </label>
        ))}
      </div>
    </Card>
  );
}

function FeaturePermissionsPanel({
  category,
  title,
  description,
  icon,
  features,
}: {
  category: "data_update" | "admin_forms" | "dashboard";
  title: string;
  description: string;
  icon: string;
  features: PermissionFeature[];
}) {
  const { data: groups = [] } = useRows("permission_groups", { orderBy: "name", ascending: true });
  const [groupId, setGroupId] = useState("");
  const { data: stored = [] } = useRows("permission_features", {
    filters: {
      group_id: groupId || "00000000-0000-0000-0000-000000000000",
      feature_category: category,
    },
  });
  const save = useSavePermissionFeatures();
  const [allowed, setAllowed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const selectedGroup = groups.find((group) => group["id"] === groupId);
    const adminDefaults =
      String(selectedGroup?.["name"] ?? "").toLowerCase() === "admin" && stored.length === 0;
    setAllowed(
      new Set(
        adminDefaults
          ? features.map((feature) => feature.key)
          : stored.filter((row) => row["is_allowed"]).map((row) => String(row["feature_key"])),
      ),
    );
  }, [stored, groupId, groups, features]);

  const toggle = (key: string) =>
    setAllowed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const saveFeatures = () =>
    save.mutate({
      groupId,
      features: features.map((feature) => ({
        feature_category: category,
        feature_key: feature.key,
        feature_name: feature.name,
        is_allowed: allowed.has(feature.key),
      })),
    });

  return (
    <>
      <Card title={title} icon={icon}>
        <p className="mb-4 text-[12px] font-semibold text-muted-foreground">{description}</p>
        <div className="flex flex-wrap items-end gap-3">
          <GroupSelect groups={groups} value={groupId} onChange={setGroupId} />
          <Btn icon="save" onClick={saveFeatures}>
            {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </Btn>
        </div>
      </Card>
      {!groupId ? (
        <StateMessage icon="group_work" text="اختر المجموعة لعرض الصلاحيات" />
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.key}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-right transition-colors ${allowed.has(feature.key) ? "border-teal bg-teal/8" : "border-border bg-card hover:bg-secondary/50"}`}
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-xl ${allowed.has(feature.key) ? "bg-teal text-white" : "bg-secondary text-muted-foreground"}`}
              >
                <MaterialIcon name={icon} size={21} filled />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-extrabold">{feature.name}</span>
                <span className="mt-1 block text-[11px] font-semibold leading-5 text-muted-foreground">
                  {feature.description}
                </span>
              </span>
              <Toggle
                checked={allowed.has(feature.key)}
                onChange={() => toggle(feature.key)}
                label={feature.name}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function GroupSelect({
  groups,
  value,
  onChange,
}: {
  groups: Row[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-72 flex-1">
      <span className="mb-1.5 block text-[12px] font-bold">
        اسم المجموعة <span className="text-destructive">*</span>
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={control}>
        <option value="">اختر المجموعة...</option>
        {groups
          .filter((group) => group["is_active"])
          .map((group) => (
            <option key={String(group["id"])} value={String(group["id"])}>
              {String(group["name"])}
            </option>
          ))}
      </select>
    </label>
  );
}

function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-t border-border px-4 py-3">
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="grid size-8 place-items-center rounded-lg hover:bg-secondary disabled:opacity-30"
      >
        <MaterialIcon name="chevron_right" size={18} />
      </button>
      {Array.from(
        { length: Math.min(pages, 7) },
        (_, index) => Math.min(Math.max(1, page - 3), Math.max(1, pages - 6)) + index,
      )
        .filter((value) => value <= pages)
        .map((value) => (
          <button
            key={value}
            onClick={() => onPage(value)}
            className={`grid size-8 place-items-center rounded-lg text-[12px] font-bold ${value === page ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
          >
            {value}
          </button>
        ))}
      <button
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="grid size-8 place-items-center rounded-lg hover:bg-secondary disabled:opacity-30"
      >
        <MaterialIcon name="chevron_left" size={18} />
      </button>
      <span className="ms-auto text-[11px] font-bold text-muted-foreground">
        صفحة {page} من {pages}
      </span>
    </div>
  );
}

function Dialog({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-topbar/55 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <MaterialIcon name={icon} size={20} className="text-primary" filled />
          <h3 className="text-sm font-extrabold">{title}</h3>
          <button onClick={onClose} className="ms-auto text-muted-foreground hover:text-foreground">
            <MaterialIcon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DialogActions({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
      <Btn variant="ghost" onClick={onClose}>
        إلغاء
      </Btn>
      <Btn icon="save" onClick={onSave}>
        {saving ? "جارٍ الحفظ..." : "حفظ"}
      </Btn>
    </div>
  );
}
