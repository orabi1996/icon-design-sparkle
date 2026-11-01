import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyDirectory, type CompanyDirectoryEntry } from "@/lib/company-db";

type CompanyWorkspaceValue = {
  companies: CompanyDirectoryEntry[];
  selectedCompany: CompanyDirectoryEntry | null;
  selectCompany: (id: string) => void;
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
};
const CompanyWorkspaceContext = createContext<CompanyWorkspaceValue | null>(null);

const DEFAULT_ANDALUS_COMPANY: CompanyDirectoryEntry = {
  id: "comp-andalus-01",
  tenant_id: "tenant-andalus-01",
  tenant_name: "مجموعة الأندلس التعليمية",
  display_name: "شركة مدارس الأندلس التعليمية",
  display_name_en: "Al-Andalus Educational Schools Co.",
  country_code: "SA",
  version: 1,
  updated_at: "2026-11-01T08:00:00Z",
  can_manage: true,
};

export function CompanyWorkspaceProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [preferredId, setPreferredId] = useState("");
  const directory = useCompanyDirectory(userId);

  useEffect(() => {
    let active = true;
    const previousUserId = { current: undefined as string | null | undefined };
    const applyUser = (id: string | null) => {
      if (!active) return;
      // Auth emits token refresh events for the same user; do not reset a
      // manually selected company or cause a visible context jump on refresh.
      if (previousUserId.current === id) {
        setUserId(id);
        return;
      }
      previousUserId.current = id;
      setUserId(id);
      try { setPreferredId(id ? localStorage.getItem("hr-company:" + id) ?? "" : ""); }
      catch { setPreferredId(""); }
    };
    void supabase.auth.getSession().then(({ data }) => applyUser(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user.id ?? null));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const companies = directory.data && directory.data.length > 0 ? directory.data : [DEFAULT_ANDALUS_COMPANY];
  const selectedCompany = companies.find((company) => company.id === preferredId) ?? companies[0] ?? DEFAULT_ANDALUS_COMPANY;
  const selectCompany = (id: string) => {
    setPreferredId(id);
    try { if (userId) localStorage.setItem("hr-company:" + userId, id); } catch { /* storage may be disabled */ }
  };
  return (
    <CompanyWorkspaceContext.Provider value={{
      companies, selectedCompany, selectCompany,
      isLoading: directory.isFetching, error: directory.error,
      reload: () => { void directory.refetch(); },
    }}>
      {children}
    </CompanyWorkspaceContext.Provider>
  );
}

export function useCompanyWorkspace() {
  const context = useContext(CompanyWorkspaceContext);
  if (!context) throw new Error("CompanyWorkspaceProvider is required");
  return context;
}
