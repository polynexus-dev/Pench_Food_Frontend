import axiosInstance from "../../../api/axiosInstance";
import type { Driver, Route } from "../components/types";

/**
 * Delivery/Logistics API Service
 */
export const deliveryApi = {
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
   * Fetch all delivery routes
   */
  getRoutes: async (): Promise<Route[]> => {
    const response = await axiosInstance.get<Route[]>("/erp/orders/routes");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Bulk-assign pending orders to drivers by zone
   */
  assignPendingOrders: async (date?: string): Promise<{
    date: string;
    total_zones_processed: number;
    created_routes: Route[];
    errors: { zone_id: string; zone_name: string; error: string }[];
  }> => {
    const response = await axiosInstance.post("/erp/orders/routes/assign-pending/", { date });
    return response.data;
  }
};
