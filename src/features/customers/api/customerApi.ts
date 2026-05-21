import axiosInstance from "../../../api/axiosInstance";
import type { Customer, Order } from "../components/types";

/**
 * Customer API Service
 * Handles all network requests related to the customer module.
 */
export const customerApi = {
  /**
   * Fetch all customers for the current tenant
   */
  getCustomers: async (): Promise<Customer[]> => {
    const response = await axiosInstance.get<Customer[]>("/erp/customers/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch a single customer by ID
   */
  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await axiosInstance.get<Customer>(`/erp/customers/${id}/`);
    return response.data;
  },

  /**
   * Create a new customer
   */
  createCustomer: async (customerData: Partial<Customer>): Promise<Customer> => {
    const response = await axiosInstance.post<Customer>("/erp/customers/", customerData);
    return response.data;
  },

  /**
   * Update an existing customer
   */
  updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    const response = await axiosInstance.patch<Customer>(`/erp/customers/${id}/`, customerData);
    return response.data;
  },

  /**
   * Delete a customer
   */
  deleteCustomer: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/erp/customers/${id}/`);
  },

  /**
   * Toggle customer active status
   */
  toggleStatus: async (id: string, isActive: boolean): Promise<Customer> => {
    const response = await axiosInstance.patch<Customer>(`/erp/customers/${id}/`, {
      is_active: isActive,
    });
    return response.data;
  },

  /**
   * Fetch order history for a specific customer
   */
  getOrdersByCustomerId: async (customerId: string): Promise<Order[]> => {
    const response = await axiosInstance.get<Order[]>(`/erp/orders?customer=${customerId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Auto-assign zones for all active customers in the city based on location coordinates.
   */
  autoAssignZones: async (): Promise<{ message: string; scanned: number; updated: number; assignments: any[] }> => {
    const response = await axiosInstance.post("/erp/customers/auto-assign-zones/");
    return response.data;
  }
};
