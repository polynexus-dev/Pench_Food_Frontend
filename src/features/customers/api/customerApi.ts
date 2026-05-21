import axiosInstance from "../../../api/axiosInstance";
import type { Customer, Order, CustomerProductPrice, Subscription } from "../components/types";
import type { Product } from "../../inventory/components/types";

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
  },

  /**
   * Fetch all active products
   */
  getProducts: async (): Promise<Product[]> => {
    const response = await axiosInstance.get<Product[]>("/erp/inventory/products/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch all custom price overrides for a customer
   */
  getCustomerPrices: async (customerId: string): Promise<CustomerProductPrice[]> => {
    const response = await axiosInstance.get<CustomerProductPrice[]>(
      `/erp/inventory/customer-prices/?customer=${customerId}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Create a new custom price override record
   */
  createCustomerPrice: async (
    customerId: string,
    productId: string,
    customPrice: number
  ): Promise<CustomerProductPrice> => {
    const response = await axiosInstance.post<CustomerProductPrice>(
      "/erp/inventory/customer-prices/",
      {
        customer: customerId,
        product: productId,
        custom_price: customPrice.toFixed(2),
      }
    );
    return response.data;
  },

  /**
   * Update an existing custom price override record
   */
  updateCustomerPrice: async (
    priceRecordId: string,
    customPrice: number
  ): Promise<CustomerProductPrice> => {
    const response = await axiosInstance.patch<CustomerProductPrice>(
      `/erp/inventory/customer-prices/${priceRecordId}/`,
      {
        custom_price: customPrice.toFixed(2),
      }
    );
    return response.data;
  },

  /**
   * Delete an existing custom price override record (reset to base price)
   */
  deleteCustomerPrice: async (priceRecordId: string): Promise<void> => {
    await axiosInstance.delete(`/erp/inventory/customer-prices/${priceRecordId}/`);
  },

  /**
   * Fetch all subscriptions for a customer
   */
  getSubscriptions: async (customerId: string): Promise<Subscription[]> => {
    const response = await axiosInstance.get<Subscription[]>(`/erp/subscriptions/?customer=${customerId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Pause an active subscription with a vacation start/end date
   */
  pauseSubscription: async (
    subscriptionId: string,
    pauseStart: string,
    pauseEnd: string
  ): Promise<Subscription> => {
    const response = await axiosInstance.post<Subscription>(
      `/erp/subscriptions/${subscriptionId}/pause/`,
      {
        pause_start: pauseStart,
        pause_end: pauseEnd,
      }
    );
    return response.data;
  },

  /**
   * Resume a paused subscription
   */
  resumeSubscription: async (subscriptionId: string): Promise<Subscription> => {
    const response = await axiosInstance.post<Subscription>(
      `/erp/subscriptions/${subscriptionId}/resume/`
    );
    return response.data;
  },

  /**
   * Create a new subscription for a customer
   */
  createSubscription: async (subscriptionData: any): Promise<Subscription> => {
    const response = await axiosInstance.post<Subscription>("/erp/subscriptions/", subscriptionData);
    return response.data;
  }
};

