import axiosInstance from "../../../api/axiosInstance";
import type { Order } from "../components/types";

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
