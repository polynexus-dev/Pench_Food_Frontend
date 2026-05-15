import axiosInstance from "../../../api/axiosInstance";
import type { City } from "../components/types";

/**
 * Tenant / City API Service
 */
export const tenantApi = {
  /**
   * Fetch all city instances
   */
  getCities: async (): Promise<City[]> => {
    const response = await axiosInstance.get<City[]>("/erp/tenants/cities/");
    // Filter out 'public' schema as it's the master tenant
    return Array.isArray(response.data) 
      ? response.data.filter((city: City) => city.schema_name !== "public")
      : [];
  },

  /**
   * Register a new city/tenant
   */
  createCity: async (cityData: any): Promise<City> => {
    const response = await axiosInstance.post<City>("/erp/tenants/cities/", cityData);
    return response.data;
  },

  /**
   * Fetch all operational zones
   */
  getZones: async (): Promise<Zone[]> => {
    const response = await axiosInstance.get<Zone[]>("/ems/zones");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Create a new operational zone with GeoJSON boundary
   */
  createZone: async (zoneData: { name: string; description: string; boundary: any }): Promise<Zone> => {
    const response = await axiosInstance.post<Zone>("/ems/zones/", zoneData);
    return response.data;
  }
};
