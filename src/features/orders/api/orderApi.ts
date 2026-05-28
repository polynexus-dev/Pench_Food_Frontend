import axiosInstance from "../../../api/axiosInstance";
import type { Order } from "../components/types";

interface SyncOrdersResponse {
  orders: Order[];
  sync_summary: {
    customers_zone_updated: number;
    routes_created: number;
    route_errors: { zone: string; error: string }[];
  };
}

/**
 * Order API Service
 */
export const orderApi = {
  /**
   * Fetch all orders for the current tenant
   */
  getOrders: async (): Promise<Order[]> => {
    const response = await axiosInstance.get<Order[]>("/erp/orders/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Create a new order
   */
  createOrder: async (payload: { scheduled_delivery_date: string; items: { product: string; quantity: number }[] }): Promise<Order> => {
    const response = await axiosInstance.post<Order>("/erp/orders/", payload);
    return response.data;
  },

  /**
   * Sync orders: auto-assign zones to customers, create routes for
   * pending orders, and return the refreshed order list.
   */
  syncOrders: async (): Promise<SyncOrdersResponse> => {
    const response = await axiosInstance.post<SyncOrdersResponse>("/erp/orders/sync/");
    return response.data;
  },

  /**
   * Fetch a single order by ID
   */
  getOrderById: async (id: string): Promise<Order> => {
    const response = await axiosInstance.get<Order>(`/erp/orders/${id}/`);
    return response.data;
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const response = await axiosInstance.patch<Order>(`/erp/orders/${id}/`, {
      status: status,
    });
    return response.data;
  },

  /**
   * Delete an order
   */
  deleteOrder: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/erp/orders/${id}/`);
  }
};
