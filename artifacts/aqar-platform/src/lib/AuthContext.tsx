import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi, type OfficeIdentity, type AdminIdentity } from "./auth";

// Finde targets real-estate OFFICES (who list properties) and ADMINS (who run
// the platform). Regular visitors just browse/search — no account needed.
// Office and admin each have an independent session cookie, so one person can
// be signed into both at the same time (e.g. admin in one tab, office in another).
interface AuthContextValue {
  officeUser: OfficeIdentity | null;
  officeId: number | null;
  officeLoading: boolean;
  refetchOffice: () => Promise<void>;
  logoutOffice: () => Promise<void>;

  admin: AdminIdentity | null;
  adminLoading: boolean;
  refetchAdmin: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [officeUser, setOfficeUser] = useState<OfficeIdentity | null>(null);
  const [officeId, setOfficeId] = useState<number | null>(null);
  const [officeLoading, setOfficeLoading] = useState(true);

  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  const refetchOffice = useCallback(async () => {
    setOfficeLoading(true);
    try { const r = await authApi.office.me(); setOfficeUser(r.officeUser); setOfficeId(r.officeId); }
    catch { setOfficeUser(null); setOfficeId(null); }
    finally { setOfficeLoading(false); }
  }, []);

  const refetchAdmin = useCallback(async () => {
    setAdminLoading(true);
    try { const r = await authApi.admin.me(); setAdmin(r.admin); }
    catch { setAdmin(null); }
    finally { setAdminLoading(false); }
  }, []);

  const logoutOffice = useCallback(async () => {
    try { await authApi.office.logout(); } catch {}
    setOfficeUser(null); setOfficeId(null);
  }, []);

  const logoutAdmin = useCallback(async () => {
    try { await authApi.admin.logout(); } catch {}
    setAdmin(null);
  }, []);

  useEffect(() => {
    refetchOffice();
    refetchAdmin();
  }, [refetchOffice, refetchAdmin]);

  return (
    <AuthContext.Provider
      value={{
        officeUser, officeId, officeLoading, refetchOffice, logoutOffice,
        admin, adminLoading, refetchAdmin, logoutAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuthContext() {
  return useContext(AuthContext);
}

export function useOfficeAuth() {
  const c = useAuthContext();
  return { officeUser: c.officeUser, officeId: c.officeId, isLoading: c.officeLoading, refetch: c.refetchOffice, logout: c.logoutOffice };
}

export function useAdminAuth() {
  const c = useAuthContext();
  return { admin: c.admin, isLoading: c.adminLoading, refetch: c.refetchAdmin, logout: c.logoutAdmin };
}
