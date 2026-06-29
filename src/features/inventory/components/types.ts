export interface RawMaterial {
  id: string;
  name: string;
  sku: string;
  description: string;
  unit: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  unit_price: string;
  unit: string;
  is_active: boolean;
  bottle_type: string | null;
  bottle_type_name?: string | null;
  is_returnable: boolean;
  raw_material?: string | null;
  raw_material_name?: string | null;
}

export interface BottleGlobalSummary {
  bottle_type_id: string;
  bottle_type_name: string;
  total_with_customers: number;
  total_lost_broken: number;
  total_dispatched_today: number;
  total_returned_today: number;
}

export interface DriverBottleStats {
  bottle_type_id: string;
  bottle_type_name: string;
  dispatched: number;
  delivered: number;
  returned: number;
  broken: number;
  remaining_full: number;
}

export interface DriverBottleBreakdown {
  route_id: string;
  route_name: string;
  route_status: string;
  route_status_display: string;
  driver_id?: string | null;
  driver_warehouse_id?: string | null;
  driver_warehouse_name?: string | null;
  driver_name: string;
  vehicle_plate: string;
  bottles: DriverBottleStats[];
}

export interface BottleTrackingSummaryResponse {
  date: string;
  global_summary: BottleGlobalSummary[];
  driver_breakdown: DriverBottleBreakdown[];
  history_trend?: BottleTrackingHistoryEntry[];
}

export interface WarehouseDriver {
  id: string;
  name: string;
  vehicle_plate: string;
  phone: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  drivers?: WarehouseDriver[];
}

export interface CreateWarehousePayload {
  name: string;
  address: string;
  is_active?: boolean;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface BottleTrackingHistoryEntry {
  date: string;
  dispatched: number;
  returned: number;
  with_customers: number;
  lost_broken: number;
}

export interface BottleType {
  id: string;
  name: string;
  volume_ml: number;
  deposit_amount: string;
  is_active: boolean;
}

export interface CustomerBottleBalance {
  id: string;
  customer: string;
  customer_name: string;
  bottle_type: string;
  bottle_type_name: string;
  balance: number;
}
