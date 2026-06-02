import axiosInstance from "../../../api/axiosInstance";
import type { Product, RawMaterial, Warehouse, CreateWarehousePayload, BottleType, BottleTrackingSummaryResponse } from "../components/types";

/**
 * Inventory API Service
 */
export const inventoryApi = {
  /**
   * Fetch all raw materials
   */
  getRawMaterials: async (): Promise<RawMaterial[]> => {
    const response = await axiosInstance.get<RawMaterial[]>("/erp/inventory/raw-materials/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Create a new raw material
   */
  createRawMaterial: async (payload: { name: string; sku: string; description?: string; unit: string }): Promise<RawMaterial> => {
    const response = await axiosInstance.post<RawMaterial>("/erp/inventory/raw-materials/", payload);
    return response.data;
  },

  /**
   * Update an existing raw material
   */
  updateRawMaterial: async (id: string, payload: { name: string; sku: string; description?: string; unit: string }): Promise<RawMaterial> => {
    const response = await axiosInstance.put<RawMaterial>(`/erp/inventory/raw-materials/${id}/`, payload);
    return response.data;
  },

  /**
   * Delete a raw material
   */
  deleteRawMaterial: async (id: string): Promise<any> => {
    const response = await axiosInstance.delete(`/erp/inventory/raw-materials/${id}/`);
    return response.data;
  },

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
    const response = await axiosInstance.get<Warehouse[]>("/erp/inventory/warehouses/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch a single warehouse by ID
   */
  getWarehouseById: async (id: string): Promise<Warehouse> => {
    const response = await axiosInstance.get<Warehouse>(`/erp/inventory/warehouses/${id}/`);
    return response.data;
  },

  /**
   * Create or provision a new warehouse
   */
  createWarehouse: async (payload: CreateWarehousePayload): Promise<Warehouse> => {
    const response = await axiosInstance.post<Warehouse>("/erp/inventory/warehouses/", payload);
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

  /**
   * Fetch inventory stock level forecast and replenishment need
   */
  getWarehouseForecast: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`/erp/inventory/warehouses/${id}/forecast/`);
    return response.data;
  },

  /**
   * Fetch historical stock ledger movements
   */
  getWarehouseHistory: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`/erp/inventory/warehouses/${id}/history/`);
    return response.data;
  },

  /**
   * Record manual adjustments or inbound supplier replenishments
   */
  adjustWarehouseStock: async (
    id: string,
    data: {
      product: string;
      quantity: number;
      movement_type: "inbound" | "adjustment";
      reference?: string;
      notes?: string;
    }
  ): Promise<any> => {
    const response = await axiosInstance.post(`/erp/inventory/warehouses/${id}/adjust-stock/`, data);
    return response.data;
  },

  /**
   * Fetch all bottle types
   */
  getBottleTypes: async (): Promise<BottleType[]> => {
    const response = await axiosInstance.get<BottleType[]>("/erp/inventory/bottle-types/");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Create a new bottle type
   */
  createBottleType: async (payload: Omit<BottleType, "id">): Promise<BottleType> => {
    const response = await axiosInstance.post<BottleType>("/erp/inventory/bottle-types/", payload);
    return response.data;
  },

  /**
   * Update an existing bottle type
   */
  updateBottleType: async (id: string, payload: Partial<BottleType>): Promise<BottleType> => {
    const response = await axiosInstance.put<BottleType>(`/erp/inventory/bottle-types/${id}/`, payload);
    return response.data;
  },

  /**
   * Delete a bottle type
   */
  deleteBottleType: async (id: string): Promise<any> => {
    const response = await axiosInstance.delete(`/erp/inventory/bottle-types/${id}/`);
    return response.data;
  },

  /**
   * Reassign driver to a warehouse
   */
  reassignDriverWarehouse: async (driverId: string, warehouseId: string | null): Promise<any> => {
    const response = await axiosInstance.patch(`/erp/routing/drivers/${driverId}/`, {
      warehouse: warehouseId
    });
    return response.data;
  },

  /**
   * Fetch returnable bottle tracking summary
   */
  getBottleSummary: async (date?: string, warehouseId?: string): Promise<BottleTrackingSummaryResponse> => {
    let url = "/erp/inventory/bottle-transactions/summary/";
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (warehouseId && warehouseId !== "all") params.append("warehouse", warehouseId);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await axiosInstance.get<BottleTrackingSummaryResponse>(url);
    return response.data;
  }
};

