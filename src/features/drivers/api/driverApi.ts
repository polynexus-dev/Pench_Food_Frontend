import axiosInstance from "../../../api/axiosInstance";
import type { Driver, Zone } from "../components/types";

/**
 * Driver API Service
 */
export const driverApi = {
  /**
   * Fetch all drivers
   */
  getDrivers: async (): Promise<Driver[]> => {
    const response = await axiosInstance.get<Driver[]>("/ems/drivers/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch a single driver by ID
   */
  getDriverById: async (id: string): Promise<Driver> => {
    const response = await axiosInstance.get<Driver>(`/ems/drivers/${id}/`);
    return response.data;
  },

  /**
   * Register a new driver
   */
  createDriver: async (driverData: any): Promise<Driver> => {
    const response = await axiosInstance.post<Driver>("/ems/drivers/", driverData);
    return response.data;
  },

  /**
   * Update driver profile details (e.g. zone assignment)
   */
  updateDriver: async (id: string, driverData: Partial<Driver>): Promise<Driver> => {
    const response = await axiosInstance.patch<Driver>(`/ems/drivers/${id}/`, driverData);
    return response.data;
  },

  /**
   * Fetch all zones
   */
  getZones: async (): Promise<Zone[]> => {
    const response = await axiosInstance.get<Zone[]>("/ems/zones/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Register a new rider / driver user account
   */
  registerDriver: async (payload: any): Promise<any> => {
    const response = await axiosInstance.post("/accounts/register/", [payload]);
    return response.data;
  },

  /**
   * Register multiple rider / driver user accounts in one request (bulk Excel import)
   */
  bulkRegisterDrivers: async (payloads: any[]): Promise<any> => {
    const response = await axiosInstance.post("/accounts/register/", payloads);
    return response.data;
  }
};
