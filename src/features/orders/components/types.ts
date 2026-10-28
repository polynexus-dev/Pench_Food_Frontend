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
  status: "pending" | "confirmed" | "cancelled" | "delivered" | "shipped" | "in_transit" | "undelivered" | "dispatched";
  status_display: string;
  scheduled_delivery_date: string;
  total: string;
  items: OrderItem[];
  delivery_address: string;
  latitude: number | null;
  longitude: number | null;
  created_at?: string;
  driver_name?: string | null;
  zone_name?: string | null;
  pod_image?: string | null;
  pod_latitude?: number | string | null;
  pod_longitude?: number | string | null;
  delivered_at?: string | null;
  payment_method?: string;
  amount_collected?: string;
  payment_transaction_id?: string;
  payment_status?: string;
  /** True for additional (non-subscription) orders */
  is_special?: boolean;
  subscription?: string | null;
  latest_payment?: OrderPaymentProof | null;
}

export interface OrderPaymentProof {
  id: string;
  amount: number;
  status: "pending" | "verified" | "rejected";
  screenshot: string | null;
  created_at: string;
}

export interface SpecialOrdersSummary {
  new_pending: number;
  placed_last_24h: number;
  for_today: number;
  upcoming: number;
  payment_pending_verification: number;
  recent_new_orders: Order[];
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  statusBreakdown: Record<string, number>;
}
