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
   * Delete a driver permanently
   */
  deleteDriver: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/ems/drivers/${id}/`);
  },

  /**
   * Fetch activity and audit logs for a driver (password changes & login attempts)
   */
  getActivityLogs: async (id: string): Promise<any[]> => {
    const response = await axiosInstance.get<any[]>(`/ems/drivers/${id}/activity-logs/`);
    return Array.isArray(response.data) ? response.data : [];
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
   * Update driver credentials (username / User ID and password)
   */
  resetCredentials: async (id: string, payload: { username?: string; password?: string }): Promise<any> => {
    const response = await axiosInstance.post(`/ems/drivers/${id}/reset-credentials/`, payload);
    return response.data;
  },

  /**
   * Generate a brand-new random password for this rider and email it
   * (plaintext) to the configured admin recipients. The password is never
   * returned to or displayed in the admin panel.
   */
  sendCredentials: async (id: string, payload?: { recipient_email?: string }): Promise<{ message: string; username: string; driver_id: string }> => {
    const response = await axiosInstance.post(`/ems/drivers/${id}/send-credentials/`, payload || {});
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
