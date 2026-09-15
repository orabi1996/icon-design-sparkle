import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { loadRequestTypeSettings, saveRequestTypeSettings, type RequestSettingsRpc } from "./request-settings.mjs";
import type { RequestTypeConfig } from "./request-config.mjs";

// RPC types can be regenerated after the additive migration is deployed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const rpc: RequestSettingsRpc = (name, args) => db.rpc(name, args);
const queryKey = (userId: string) => ["request-type-settings", userId] as const;

export function useRequestTypeSettings(userId: string) {
  return useQuery({
    queryKey: queryKey(userId),
    queryFn: () => loadRequestTypeSettings(rpc),
    retry: false,
    // Explicit reload prevents replacing the snapshot underneath an open draft.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 0,
  });
}

export function useSaveRequestTypeSettings(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { configs: RequestTypeConfig[]; expectedValue: string | null }) =>
      saveRequestTypeSettings(rpc, input.configs, input.expectedValue),
    retry: false,
    onSuccess: (snapshot) => { queryClient.setQueryData(queryKey(userId), snapshot); },
  });
}
