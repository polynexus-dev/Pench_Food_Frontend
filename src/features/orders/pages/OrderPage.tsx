import React, { useState, useEffect, useMemo } from "react";
import { ShoppingCart, RefreshCw, PieChart, Sliders } from "lucide-react";
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

  const fetchOrders = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await orderApi.getOrders();
      setOrders(data);
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
    return orders.filter(order => 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.status_display.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
            onClick={() => fetchOrders(false)}
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
