import axiosInstance from "../../../api/axiosInstance";
import type { Order, OrdersOverview, OrdersSummary, SpecialOrdersSummary } from "../components/types";

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
   * Fetch orders for the current tenant. Pass a date filter: without one the
   * API returns every order, which is very slow on large tenants.
   */
  getOrders: async (params?: Record<string, any>): Promise<Order[]> => {
    const response = await axiosInstance.get<Order[]>("/erp/orders/", { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Order counts and revenue computed on the server
   */
  getOrdersSummary: async (params?: Record<string, any>): Promise<OrdersSummary> => {
    const response = await axiosInstance.get<OrdersSummary>("/erp/orders/summary/", { params });
    return response.data;
  },

  /**
   * Totals, per-product quantities and latest orders for the home dashboard
   */
  getOrdersOverview: async (params?: Record<string, any>): Promise<OrdersOverview> => {
    const response = await axiosInstance.get<OrdersOverview>("/erp/orders/overview/", { params });
    return response.data;
  },

  /**
   * Counts of additional (non-subscription) orders for the admin dashboard
   */
  getSpecialOrdersSummary: async (): Promise<SpecialOrdersSummary> => {
    const response = await axiosInstance.get<SpecialOrdersSummary>("/erp/orders/special-summary/");
    return response.data;
  },

  /**
   * Create a new order
   */
  createOrder: async (payload: {
    customer?: string;
    scheduled_delivery_date: string;
    payment_method?: "payu" | "on_account" | "upi" | "cash";
    items: { product: string; quantity: number }[];
  }): Promise<Order> => {
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
