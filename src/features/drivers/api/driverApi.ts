import axiosInstance from "../../../api/axiosInstance";
import type { Driver } from "../components/types";

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
  }
};
