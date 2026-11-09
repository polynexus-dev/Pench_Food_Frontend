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
  items_subtotal?: string;
  handling_fee?: string;
  total: string;
  remaining_amount?: string;
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
  payment_status?: OrderPaymentStatus;
  /** True for additional (non-subscription) orders */
  is_special?: boolean;
  subscription?: string | null;
  latest_payment?: OrderPaymentProof | null;
}

export type OrderPaymentStatus = "pending" | "verification_pending" | "partial" | "paid" | "failed";

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

export interface OrdersSummary {
  total_orders: number;
  total_revenue: number;
  status_counts: Record<string, { label: string; count: number }>;
}

export interface OrdersOverview extends OrdersSummary {
  product_quantities: { product_name: string; quantity: number }[];
  recent_orders: Order[];
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  statusBreakdown: Record<string, number>;
}


export interface PausedDeliveryItem {
  subscription_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  pause_start: string | null;
  pause_end: string | null;
  pause_display: string;
  items_summary: string;
  type: "vacation" | "skip_date";
  reason?: string;
}

export interface ExtraMilkOrderItem {
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  total: number;
  items_summary: string;
  milk_litres: number;
  created_at: string;
}

export interface SubscriptionChangeItem {
  subscription_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  change_type: string;
  status: string;
  frequency: string;
  items_summary: string;
  updated_at: string;
}

export interface NewOrderTodayItem {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  scheduled_date: string;
  is_special: boolean;
  total: number;
  items_summary: string;
  created_at: string;
}

export interface TodayCustomerChangesSummary {
  date: string;
  total_today_changes: number;
  paused_deliveries: {
    count: number;
    items: PausedDeliveryItem[];
  };
  extra_milk_orders: {
    count: number;
    total_litres: number;
    items: ExtraMilkOrderItem[];
  };
  subscription_changes: {
    count: number;
    items: SubscriptionChangeItem[];
  };
  new_orders_today: {
    count: number;
    items: NewOrderTodayItem[];
  };
}
