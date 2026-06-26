import axiosInstance from "../../../api/axiosInstance";
import type { Customer, Order, CustomerProductPrice, Subscription, MonthlyBill, BottleType, CustomerBottleBalance, BottleTransaction } from "../components/types";
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
   * Fetch new/trial customers waiting for approval
   */
  getNewCustomers: async (): Promise<Customer[]> => {
    const response = await axiosInstance.get<Customer[]>("/erp/customers/new-customers/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Approve a trial customer
   */
  approveCustomer: async (id: string): Promise<Customer> => {
    const response = await axiosInstance.post<Customer>(`/erp/customers/${id}/approve/`);
    return response.data;
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
   * Create multiple customers in a single batch request
   */
  bulkCreateCustomers: async (customersData: Partial<Customer>[]): Promise<Customer[]> => {
    const response = await axiosInstance.post<Customer[]>("/erp/customers/", customersData);
    return Array.isArray(response.data) ? response.data : [];
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
    const response = await axiosInstance.get<Order[]>(`/erp/orders/?customer=${customerId}`);
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
   * Synchronize Customers and Users in both directions.
   */
  syncRefreshCustomers: async (dryRun: boolean = false): Promise<{
    message: string;
    dry_run: boolean;
    tenant_schema: string;
    customer_to_user: {
      checked: number;
      already_linked: number;
      linked_existing_user: number;
      created_new_user: number;
      details: any[];
    };
    user_to_customer: {
      checked: number;
      already_linked: number;
      linked_existing_customer: number;
      created_new_customer: number;
      details: any[];
    };
    duplicates_cleaned?: {
      merged: number;
    };
  }> => {
    const response = await axiosInstance.post("/erp/customers/sync-refresh-customers/", {
      dry_run: dryRun
    });
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
  },

  /**
   * Update an existing subscription (partial patch)
   */
  updateSubscription: async (subscriptionId: string, data: Omit<Partial<Subscription>, 'items'> & { items?: { product: string; quantity: number }[] }): Promise<Subscription> => {
    const response = await axiosInstance.patch<Subscription>(`/erp/subscriptions/${subscriptionId}/`, data);
    return response.data;
  },

  /**
   * Delete a subscription permanently
   */
  deleteSubscription: async (subscriptionId: string): Promise<void> => {
    await axiosInstance.delete(`/erp/subscriptions/${subscriptionId}/`);
  },

  /**
   * Fetch list of available subscription frequencies (value and label choices)
   */
  getSubscriptionFrequencies: async (): Promise<{ value: string; label: string }[]> => {
    const response = await axiosInstance.get<{ value: string; label: string }[]>("/erp/subscriptions/frequencies/");
    return Array.isArray(response.data) ? response.data : [];
  },


  /**
   * Fetch all monthly bills for a specific customer
   */
  getMonthlyBills: async (customerId: string): Promise<MonthlyBill[]> => {
    const response = await axiosInstance.get<MonthlyBill[]>(`/erp/finance/bills/?customer=${customerId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch all active bottle types
   */
  getBottleTypes: async (): Promise<BottleType[]> => {
    const response = await axiosInstance.get<BottleType[]>("/erp/inventory/bottle-types/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch customer bottle balance records
   */
  getCustomerBottleBalances: async (customerId: string): Promise<CustomerBottleBalance[]> => {
    const response = await axiosInstance.get<CustomerBottleBalance[]>(
      `/erp/inventory/bottle-balances/?customer=${customerId}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch customer bottle transaction records
   */
  getBottleTransactions: async (customerId: string): Promise<BottleTransaction[]> => {
    const response = await axiosInstance.get<BottleTransaction[]>(
      `/erp/inventory/bottle-transactions/?customer=${customerId}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Record a new bottle movement transaction (issued, returned, broken, etc.)
   */
  createBottleTransaction: async (
    transactionData: Partial<BottleTransaction>
  ): Promise<BottleTransaction> => {
    const response = await axiosInstance.post<BottleTransaction>(
      "/erp/inventory/bottle-transactions/",
      transactionData
    );
    return response.data;
  },

  /**
   * Bulk download customer QR codes
   */
  bulkDownloadQr: async (customerIds?: string[]): Promise<void> => {
    const params: Record<string, string> = {};
    if (customerIds && customerIds.length > 0) {
      params.customer_ids = customerIds.join(",");
      params.ids = customerIds.join(",");
    }
    const response = await axiosInstance.get("/erp/customers/bulk-download-qr/", {
      params,
      responseType: "blob",
    });
    
    // Create download link for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    // Set download file name. If there are selected customers, call it selected_qrs.zip/pdf, else all_qrs.zip/pdf
    link.setAttribute("download", customerIds && customerIds.length > 0 ? "selected_customer_qrs.zip" : "all_customer_qrs.zip");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },

  /**
   * Fetch QR sticker label image as a Blob URL for display
   */
  viewQrImage: async (id: string): Promise<string> => {
    const response = await axiosInstance.get(`/erp/customers/${id}/view-qr/`, {
      responseType: "blob"
    });
    return URL.createObjectURL(response.data);
  },

  /**
   * Download individual customer QR sticker PDF
   */
  downloadIndividualQrPdf: async (id: string, name: string): Promise<void> => {
    const response = await axiosInstance.get(`/erp/customers/${id}/download-qr/`, {
      responseType: "blob"
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `qr_sticker_${name.replace(/\s+/g, "_")}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  }
};

