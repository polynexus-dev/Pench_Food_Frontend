import { create } from 'zustand';
import { companyApi } from '../api/companyApi';
import type { Company } from '../api/companyApi';

interface CompanyState {
  companies: Company[];
  isLoading: boolean;
  lastFetchedAt: number | null;
  fetchCompanies: (selectCompanyId?: string) => Promise<Company[]>;
}

// Cache duration: 30 seconds — prevents duplicate fetches during mount cascades
const CACHE_TTL_MS = 30_000;

// In-flight deduplication: if a fetch is already running, reuse its promise
let inFlightPromise: Promise<Company[]> | null = null;

export const useCompanyStore = create<CompanyState>()((set, get) => ({
  companies: [],
  isLoading: false,
  lastFetchedAt: null,

  fetchCompanies: async (selectCompanyId?: string) => {
    const { lastFetchedAt, companies } = get();
    const now = Date.now();

    // Return cached data if fresh enough and not requesting a specific company
    if (lastFetchedAt && (now - lastFetchedAt) < CACHE_TTL_MS && companies.length > 0 && !selectCompanyId) {
      return companies;
    }

    // Deduplicate in-flight requests
    if (inFlightPromise && !selectCompanyId) {
      return inFlightPromise;
    }

    const fetchPromise = (async () => {
      set({ isLoading: true });
      try {
        console.log("useCompanyStore: Fetching companies from API...");
        const data = await companyApi.getCompanies();
        console.log("useCompanyStore: Fetched companies successfully! Data:", data);
        set({ companies: data, lastFetchedAt: Date.now() });
        return data;
      } catch (error) {
        console.error("useCompanyStore: Failed to fetch companies:", error);
        return get().companies;
      } finally {
        set({ isLoading: false });
        inFlightPromise = null;
      }
    })();

    if (!selectCompanyId) {
      inFlightPromise = fetchPromise;
    }

    return fetchPromise;
  },
}));
