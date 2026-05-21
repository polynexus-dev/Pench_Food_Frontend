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
  status: "pending" | "confirmed" | "cancelled" | "delivered" | "shipped" | "in_transit";
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
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  statusBreakdown: Record<string, number>;
}
