import axiosInstance from "./axiosInstance";

export interface City {
  id: number | string;
  company?: string;
  company_name?: string;
  company_code?: string;
  schema_name: string;
  name: string;
  state?: string;
  code?: string;
  boundary?: {
    type: string;
    coordinates: number[][][];
  };
  is_active: boolean;
  timezone?: string;
  created_at?: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  cities: City[];
}

export const companyApi = {
  /**
   * Fetch all companies and their associated cities
   */
  getCompanies: async (): Promise<Company[]> => {
    const response = await axiosInstance.get<Company[]>("/erp/tenants/companies");
    return Array.isArray(response.data) ? response.data : [];
  },
};
