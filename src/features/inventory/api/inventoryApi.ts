import axiosInstance from "../../../api/axiosInstance";
import type { Product, Warehouse, CreateWarehousePayload } from "../components/types";

/**
 * Inventory API Service
 */
export const inventoryApi = {
  /**
   * Fetch all products/variants in the inventory catalog
   */
  getProducts: async (): Promise<Product[]> => {
    const response = await axiosInstance.get<Product[]>("/erp/inventory/products/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Create or provision a new product variant
   */
  createProduct: async (payload: any[]): Promise<any> => {
    const response = await axiosInstance.post("/erp/inventory/products/", payload);
    return response.data;
  },

  /**
   * Fetch all warehouses for the active tenant
   */
  getWarehouses: async (): Promise<Warehouse[]> => {
    const response = await axiosInstance.get<Warehouse[]>("/erp/inventory/warehouses");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Create or provision a new warehouse
   */
  createWarehouse: async (payload: CreateWarehousePayload): Promise<Warehouse> => {
    const response = await axiosInstance.post<Warehouse>("/erp/inventory/warehouses", payload);
    return response.data;
  },

  /**
   * Update an existing product variant
   */
  updateProduct: async (id: string, payload: { name: string; sku: string; unit_price: string }): Promise<any> => {
    const response = await axiosInstance.put(`/erp/inventory/products/${id}/`, payload);
    return response.data;
  },

  /**
   * Delete a product variant
   */
  deleteProduct: async (id: string): Promise<any> => {
    const response = await axiosInstance.delete(`/erp/inventory/products/${id}/`);
    return response.data;
  },
};
