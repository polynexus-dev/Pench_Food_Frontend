export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  qr_code_id: string;
  created_at: string;
  dashboard?: {
    active_subscriptions: number;
    pending_balance: number;
    total_orders: number;
  };
}

export interface OrderItem {
  id: string;
  product: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: number;
}

export interface Order {
  id: string;
  customer: string;
  customer_name: string;
  status: "pending" | "confirmed" | "cancelled" | "delivered";
  status_display: string;
  scheduled_delivery_date: string;
  total: string;
  items: OrderItem[];
  delivery_address: string;
  latitude: number;
  longitude: number;
}
