export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  unit_price: string;
  unit: string;
  is_active: boolean;
  bottle_type: string | null;
  is_returnable: boolean;
}
