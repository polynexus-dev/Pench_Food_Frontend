export interface Driver {
  id: string;
  user: number;
  full_name: string;
  vehicle_plate: string;
  vehicle_type: string;
  max_capacity_kg: string;
  is_available: boolean;
  avatar?: string;
  phone?: string;
  rating?: number;
}

export interface LogisticsStats {
  totalDrivers: number;
  availableDrivers: number;
  activeTrips: number;
  totalCapacity: number;
  utilizationRate: number;
}

export interface Stop {
  id: string;
  sequence_number: number;
  order: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_company?: string;
  customer_zone_name?: string;
  address: string;
  latitude: number;
  longitude: number;
  order_status?: string;
  order_notes?: string;
  order_total?: number;
  delivered_at?: string;
  pod_image?: string | null;
  product_list?: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
  }[];
  subscription_details?: {
    id: string;
    frequency: string;
    is_paused: boolean;
    special_instructions?: string;
    items: {
      product_name: string;
      quantity: number;
      unit: string;
    }[];
  } | null;
}

export interface Route {
  id: string;
  name: string;
  driver: number;
  driver_name: string;
  delivery_date: string;
  is_completed: boolean;
  is_locked?: boolean;
  route_geometry: any;
  stops: Stop[];
  status: "pending" | "started" | "in_progress" | "in_transit" | "completed" | "stopped" | "active";
  dispatch_bottles_1L?: number;
  dispatch_bottles_500ml?: number;
  started_at?: string | null;
  completed_at?: string | null;
  additional_drivers?: number[];
  additional_driver_names?: string[];
  actual_distance_km?: number;
  stoppage_duration_minutes?: number;
  actual_duration_minutes?: number;
  stoppage_history?: any[];
}

export interface BottleType {
  id: string;
  name: string;
  deposit_amount: string;
  volume_ml: number;
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
}

