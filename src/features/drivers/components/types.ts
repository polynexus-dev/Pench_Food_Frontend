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
  zone?: string | null;
  warehouse?: string | null;
  warehouse_name?: string | null;
  is_active?: boolean;
}

export interface Zone {
  id: string;
  name: string;
  is_active?: boolean;
}

