import React, { useState, useEffect, useMemo } from "react";
import { ShoppingCart, RefreshCw, PieChart, Sliders, Check, X } from "lucide-react";
import { orderApi } from "../api/orderApi";
import type { Order } from "../components/types";
import OrderDashboardTab from "../components/OrderDashboardTab";
import OrderManageTab from "../components/OrderManageTab";
import { useAuthStore } from "../../../store/useAuthStore";

const OrderPage: React.FC = () => {
  const tenant = useAuthStore((state) => state.tenant) || "nagpur";
  const [activeTab, setActiveTab] = useState<"dashboard" | "manage">("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [syncSummary, setSyncSummary] = useState<string | null>(null);

  const fetchOrders = async (silent = false, sync = false) => {
    if (!silent) setIsLoading(true);
    setSyncSummary(null);
    try {
      if (sync) {
        const result = await orderApi.syncOrders();
        setOrders(Array.isArray(result.orders) ? result.orders : []);
        const s = result.sync_summary;
        const parts: string[] = [];
        if (s.customers_zone_updated > 0) parts.push(`${s.customers_zone_updated} customer zone(s) updated`);
        if (s.routes_created > 0) parts.push(`${s.routes_created} route(s) created`);
        if (s.route_errors.length > 0) parts.push(`${s.route_errors.length} zone(s) had errors`);
        setSyncSummary(parts.length > 0 ? parts.join(' · ') : 'Everything is up to date.');
      } else {
        const data = await orderApi.getOrders();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [tenant]);

  // Filtered orders for manage tab
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return orders;

    return orders.filter(order => {
      const formattedDate = order.scheduled_delivery_date
        ? new Date(order.scheduled_delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toLowerCase()
        : "";
      return (
        order.id.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.status_display.toLowerCase().includes(q) ||
        (order.driver_name && order.driver_name.toLowerCase().includes(q)) ||
        (order.zone_name && order.zone_name.toLowerCase().includes(q)) ||
        (order.scheduled_delivery_date && order.scheduled_delivery_date.toLowerCase().includes(q)) ||
        formattedDate.includes(q)
      );
    });
  }, [orders, searchQuery]);

  // Aggregate stats for dashboard
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    
    const statusBreakdown: Record<string, number> = {};
    orders.forEach(o => {
      statusBreakdown[o.status_display] = (statusBreakdown[o.status_display] || 0) + 1;
    });

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      totalRevenue,
      statusBreakdown
    };
  }, [orders]);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const updatedOrder = await orderApi.updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: updatedOrder.status, status_display: updatedOrder.status_display }
            : o
        )
      );
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  return (
    <div className="max-w-8xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* 1. Header Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-xs">
              <ShoppingCart className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-charcoal tracking-tight flex items-center gap-2">
                Order Management
              </h1>
              <p className="text-charcoal/50 font-medium text-xs mt-0.5">
                Track real-time transactions, dispatch statuses, and revenue metrics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button
            onClick={() => fetchOrders(false, true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-primary ${isLoading ? "animate-spin" : ""}`}
            />
            Sync Orders
          </button>
        </div>
      </div>

      {/* Sync Summary Toast */}
      {syncSummary && (
        <div className="mb-4 px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-xs font-bold text-primary flex items-center gap-2">
            <Check className="w-4 h-4 text-primary shrink-0" />
            {syncSummary}
          </p>
          <button
            onClick={() => setSyncSummary(null)}
            className="p-1 hover:bg-primary/10 rounded-lg text-primary/50 hover:text-primary transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Top-level Nested Section Tabs */}
      <div className="border-b border-silver/60 mb-8 flex items-center gap-8 px-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "dashboard"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <PieChart
            className={`w-4 h-4 ${activeTab === "dashboard" ? "text-primary" : "text-charcoal/40"}`}
          />
          Orders Dashboard
          {activeTab === "dashboard" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("manage")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "manage"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <Sliders
            className={`w-4 h-4 ${activeTab === "manage" ? "text-primary" : "text-charcoal/40"}`}
          />
          View All Orders
          {activeTab === "manage" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>
      </div>

      {/* 3. Tab Content */}
      {activeTab === "dashboard" ? (
        <OrderDashboardTab stats={stats} />
      ) : (
        <OrderManageTab 
          orders={filteredOrders} 
          isLoading={isLoading} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onUpdateOrderStatus={handleUpdateOrderStatus}
        />
      )}
    </div>
  );
};

export default OrderPage;
