export interface City {
  id: number;
  schema_name: string;
  name: string;
  state: string;
  code: string;
  is_active: boolean;
  timezone: string;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  boundary: {
    type: string;
    coordinates: number[][][];
  } | null;
  assigned_driver: string | null;
  is_active: boolean;
}
