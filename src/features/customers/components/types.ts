export interface ProductRate {
  product_id: string;
  product_name: string;
  mrp: number;
  discount: number;
  final_amount: number;
}

export interface CustomerProductPrice {
  id: string;
  customer: string;
  customer_name?: string;
  product: string;
  product_name?: string;
  custom_price: string;
}

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
  product_rates?: ProductRate[];
  dashboard?: {
    active_subscriptions: number;
    pending_balance: number;
    total_orders: number;
  };
  zone?: string | null;
  zone_name?: string | null;
  is_new?: boolean;
  trial_approved?: boolean;
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
  driver_name?: string | null;
  zone_name?: string | null;
}

export interface SubscriptionItem {
  id: string;
  product: string;
  product_name: string;
  quantity: number;
}

export interface Subscription {
  id: string;
  customer: string;
  customer_name?: string;
  status: "active" | "paused" | "cancelled" | "expired";
  status_display: string;
  frequency: "daily" | "alternate" | "weekdays" | "weekends" | "custom";
  frequency_display: string;
  custom_days: number[];
  start_date: string;
  end_date?: string | null;
  is_paused: boolean;
  pause_start?: string | null;
  pause_end?: string | null;
  pause_updated_by?: string | null;
  pause_updated_by_name?: string | null;
  delivery_address?: string;
  special_instructions?: string;
  items: SubscriptionItem[];
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

export interface FinanceTransaction {
  id: string;
  bill: string;
  amount: string;
  payment_method: string;
  transaction_id: string;
  payment_date: string;
}

export interface MonthlyBill {
  id: string;
  customer: string;
  customer_name: string;
  billing_month: string;
  total_amount: string;
  amount_paid: string;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  status_display: string;
  due_date: string;
  invoice_number: string;
  remaining_amount: number;
  transactions: FinanceTransaction[];
}

export interface BottleType {
  id: string;
  name: string;
  deposit_amount: string;
  volume_ml: number;
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

export interface BottleTransaction {
  id: string;
  bottle_type: string;
  bottle_type_name: string;
  customer?: string | null;
  customer_name?: string;
  order?: string | null;
  transaction_type: "issued" | "returned" | "broken" | "refilled";
  transaction_type_display: string;
  quantity: number;
  notes?: string;
  recorded_by?: string | null;
  created_at: string;
}
