import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Row } from "@/lib/hr-db";

// Keep permission migrations deployable independently from generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useCurrentIsAdmin() {
  return useQuery({
    queryKey: ["permissions", "current-admin"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return false;
      const { data, error } = await db
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });
}

export function useReplaceGroupMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userIds }: { groupId: string; userIds: string[] }) => {
      const { error: deleteError } = await db
        .from("permission_group_members")
        .delete()
        .eq("group_id", groupId);
      if (deleteError) throw deleteError;
      if (userIds.length) {
        const { error } = await db
          .from("permission_group_members")
          .insert(userIds.map((userId) => ({ group_id: groupId, user_id: userId })));
        if (error) throw error;
      }
      return userIds.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission_group_members"] });
      toast.success("تم تحديث مستخدمي المجموعة");
    },
    onError: (error: Error) => toast.error(`تعذر تحديث المستخدمين: ${error.message}`),
  });
}

export function useSavePermissionRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, rules }: { groupId: string; rules: Row[] }) => {
      if (!groupId) throw new Error("اختر المجموعة أولاً");
      const payload = rules.map((rule) => ({ ...rule, group_id: groupId }));
      const { error } = await db
        .from("permission_rules")
        .upsert(payload, { onConflict: "group_id,resource_key" });
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["permission_rules"] });
      toast.success(`تم حفظ صلاحيات ${count} شاشة`);
    },
    onError: (error: Error) => toast.error(`تعذر حفظ الصلاحيات: ${error.message}`),
  });
}

export function useReplacePermissionScopes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, scopes }: { groupId: string; scopes: Row[] }) => {
      if (!groupId) throw new Error("اختر المجموعة أولاً");
      const { error: deleteError } = await db
        .from("permission_scopes")
        .delete()
        .eq("group_id", groupId);
      if (deleteError) throw deleteError;
      if (scopes.length) {
        const { error } = await db
          .from("permission_scopes")
          .insert(scopes.map((scope) => ({ ...scope, group_id: groupId })));
        if (error) throw error;
      }
      return scopes.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission_scopes"] });
      toast.success("تم حفظ نطاق الفروع والأقسام");
    },
    onError: (error: Error) => toast.error(`تعذر حفظ النطاق: ${error.message}`),
  });
}

export function useSavePermissionFeatures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, features }: { groupId: string; features: Row[] }) => {
      if (!groupId) throw new Error("اختر المجموعة أولاً");
      const payload = features.map((feature) => ({ ...feature, group_id: groupId }));
      const { error } = await db
        .from("permission_features")
        .upsert(payload, { onConflict: "group_id,feature_key" });
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["permission_features"] });
      toast.success(`تم حفظ ${count} صلاحية`);
    },
    onError: (error: Error) => toast.error(`تعذر حفظ الصلاحيات: ${error.message}`),
  });
}
