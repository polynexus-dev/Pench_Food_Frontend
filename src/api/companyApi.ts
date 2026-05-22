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
  getCompanies: async (): Promise<Company[]> => {
    const response = await axiosInstance.get<Company[]>("/erp/tenants/companies/");
    return Array.isArray(response.data) ? response.data : [];
  },
  createCompany: async (name: string, code: string): Promise<Company> => {
    const response = await axiosInstance.post<Company>("/erp/tenants/companies/", { name, code });
    return response.data;
  },
  updateCompany: async (
    id: string,
    name: string,
    code: string,
    is_active: boolean,
    cities: City[]
  ): Promise<Company> => {
    const response = await axiosInstance.put<Company>(`/erp/tenants/companies/${id}/`, {
      name,
      code,
      is_active,
      cities,
    });
    return response.data;
  },
  deleteCompany: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/erp/tenants/companies/${id}/`);
  },
};
