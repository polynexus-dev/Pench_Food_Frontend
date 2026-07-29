import axiosInstance from "../../../api/axiosInstance";
import type { Driver, Route, BottleType, Product } from "../components/types";

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
  getRoutes: async (params?: { delivery_date?: string; date?: string; driver?: string }): Promise<Route[]> => {
    const response = await axiosInstance.get<Route[]>("/erp/orders/routes/", { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch details for a specific route including full stops and items
   */
  getRouteById: async (id: string): Promise<Route> => {
    const response = await axiosInstance.get<Route>(`/erp/orders/routes/${id}/`);
    return response.data;
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
  },

  /**
   * Automatically generate daily routes for a specific date
   */
  generateDailyRoutes: async (date?: string): Promise<any> => {
    const response = await axiosInstance.post("/erp/orders/routes/generate/", { date });
    return response.data;
  },

  /**
   * Force regenerate daily routes for a specific date (cancels incomplete routes first)
   */
  regenerateDailyRoutes: async (date?: string): Promise<any> => {
    const response = await axiosInstance.post("/erp/orders/routes/regenerate/", { date });
    return response.data;
  },

  /**
   * Refresh and merge routes for a specific date
   */
  refreshAndMergeRoutes: async (date?: string): Promise<{
    status: string;
    date: string;
    routes_merged: number;
    orders_assigned: number;
  }> => {
    const response = await axiosInstance.post("/erp/orders/routes/refresh-and-merge/", { date });
    return response.data;
  },

  /**
   * Lock a route to disable adjustments
   */
  lockRoute: async (routeId: string): Promise<any> => {
    const response = await axiosInstance.post(`/erp/orders/routes/${routeId}/lock/`);
    return response.data;
  },

  /**
   * Unlock a route to enable adjustments
   */
  unlockRoute: async (routeId: string): Promise<any> => {
    const response = await axiosInstance.post(`/erp/orders/routes/${routeId}/unlock/`);
    return response.data;
  },

  /**
   * Update route fields (e.g. driver assignment)
   */
  updateRoute: async (routeId: string, data: Partial<Route>): Promise<Route> => {
    const response = await axiosInstance.patch<Route>(`/erp/orders/routes/${routeId}/`, data);
    return response.data;
  },

  /**
   * Start a trip/route
   */
  startTrip: async (routeId: string): Promise<any> => {
    const response = await axiosInstance.post(`/erp/orders/driver/${routeId}/start-trip/`);
    return response.data;
  },

  /**
   * Complete a trip/route
   */
  completeTrip: async (routeId: string): Promise<any> => {
    const response = await axiosInstance.post(`/erp/orders/driver/${routeId}/complete-trip/`);
    return response.data;
  },

  /**
   * Update order status (e.g. delivered, undelivered, pending)
   */
  updateOrderStatus: async (orderId: string, status: string): Promise<any> => {
    const response = await axiosInstance.patch(`/erp/orders/${orderId}/`, { status });
    return response.data;
  },

  /**
   * Fetch the active route for the logged in driver
   */
  getMyRoute: async (): Promise<Route> => {
    const response = await axiosInstance.get<Route>("/erp/orders/driver/my-route/");
    return response.data;
  },

  /**
   * Fetch active bottle types
   */
  getBottleTypes: async (): Promise<BottleType[]> => {
    const response = await axiosInstance.get<BottleType[]>("/erp/inventory/bottle-types/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch products catalog
   */
  getProducts: async (): Promise<Product[]> => {
    const response = await axiosInstance.get<Product[]>("/erp/inventory/products/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Submit bottle transactions and delivery summary for a specific order
   */
  submitDelivery: async (
    orderId: string,
    payload: {
      bottle_transactions: {
        bottle_type_id: string;
        issued: number;
        returned: number;
        broken: number;
      }[];
      bottles_issued: number;
      bottles_returned: number;
    }
  ): Promise<any> => {
    const response = await axiosInstance.post(`/erp/orders/driver/${orderId}/submit-delivery/`, payload);
    return response.data;
  }
};
