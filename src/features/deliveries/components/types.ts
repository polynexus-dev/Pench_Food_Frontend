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
  address: string;
  latitude: number;
  longitude: number;
  order_status?: string;
}

export interface Route {
  id: string;
  name: string;
  driver: number;
  driver_name: string;
  delivery_date: string;
  is_completed: boolean;
  route_geometry: any;
  stops: Stop[];
  status: "active" | "completed" | "pending";
}
