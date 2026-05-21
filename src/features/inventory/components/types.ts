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
  driver_name: string;
  vehicle_plate: string;
  bottles: DriverBottleStats[];
}

export interface BottleTrackingSummaryResponse {
  date: string;
  global_summary: BottleGlobalSummary[];
  driver_breakdown: DriverBottleBreakdown[];
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
}

export interface CreateWarehousePayload {
  name: string;
  address: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

