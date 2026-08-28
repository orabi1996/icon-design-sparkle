import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "admin@expert-hr.sa";
const ADMIN_PASSWORD = "Admin@12345";

/** Creates (or repairs) the default system administrator account. Idempotent. */
export const bootstrapAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw listError;

  const existing = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);
  let userId = existing?.id;
  let created = false;

  if (!userId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "مدير النظام", account_type: "إداري" },
    });
    if (error) throw error;
    userId = data.user.id;
    created = true;
  } else {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
  }

  await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, full_name: "مدير النظام", account_type: "إداري" });
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  return { email: ADMIN_EMAIL, created };
});
