import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_erp_user: boolean;
  is_driver: boolean;
  is_customer: boolean;
  portal: string;
  phone: string;
  tenant_schema: string | null;
  company_id?: string | null;
  company_name?: string | null;
  groups: string[];
  role: string;
  is_superuser?: boolean;
  is_staff?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tenant: string | null; // e.g., 'nagpur', 'pune'
  companyId: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, access: string, refresh: string) => void;
  setTenant: (tenant: string) => void;
  setCompanyId: (companyId: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenant: null,
      companyId: null,
      isAuthenticated: false,
      setAuth: (user, access, refresh) => 
        set({ 
          user, 
          accessToken: access, 
          refreshToken: refresh, 
          isAuthenticated: true,
          tenant: user.tenant_schema || null,
          companyId: user.company_id || null
        }),
      setTenant: (tenant) => set({ tenant }),
      setCompanyId: (companyId) => set({ companyId }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, tenant: null, companyId: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
