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
  discount_rate?: number;
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

export interface Subscription {
  id: string;
  customer: string;
  product_name: string;
  quantity: number;
  frequency: "daily" | "alternate_days" | "custom";
  frequency_display: string;
  status: "active" | "paused" | "cancelled";
  start_date: string;
  end_date?: string;
  price_per_unit: number;
}

export interface PaymentHistory {
  id: string;
  customer: string;
  amount: string;
  payment_date: string;
  payment_method: "UPI" | "Cash" | "Wallet" | "Card";
  transaction_id: string;
  status: "completed" | "pending" | "failed";
}
