import React, { useState, useEffect, useMemo } from "react";
import { ShoppingCart, RefreshCw, PieChart, Sliders, Check, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { orderApi } from "../api/orderApi";
import type { Order } from "../components/types";
import OrderDashboardTab from "../components/OrderDashboardTab";
import OrderManageTab from "../components/OrderManageTab";
import { useAuthStore } from "../../../store/useAuthStore";

const OrderPage: React.FC = () => {
  const tenant = useAuthStore((state) => state.tenant) || "nagpur";
  const [activeTab, setActiveTab] = useState<"dashboard" | "manage" | "calendar">("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // starts in May 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const blankBoxes = Array.from({ length: firstDayOfMonth });
  const dayBoxes = Array.from({ length: daysInMonth });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

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
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${activeTab === "dashboard"
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
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${activeTab === "manage"
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

        <button
          onClick={() => setActiveTab("calendar")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${activeTab === "calendar"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
            }`}
        >
          <Calendar
            className={`w-4 h-4 ${activeTab === "calendar" ? "text-primary" : "text-charcoal/40"}`}
          />
          Delivery Calendar
          {activeTab === "calendar" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>
      </div>

      {/* 3. Tab Content */}
      {activeTab === "dashboard" && <OrderDashboardTab stats={stats} />}
      {activeTab === "manage" && (
        <OrderManageTab
          orders={filteredOrders}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onOrderCreated={() => fetchOrders(true)}
        />
      )}
      {activeTab === "calendar" && (
        <div className="bg-white p-8 rounded-3xl border border-silver/50 shadow-sm space-y-8 animate-in fade-in duration-300">
          <div className="border-b border-silver/30 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Pench Foods Global Delivery Calendar Overview
              </h2>
              <p className="text-xs text-charcoal/60 mt-1">
                Monitor all retail drops, customer vacation pauses, and distribution loads across the whole active city.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-silver/10 border border-silver/30 p-1.5 rounded-xl">
                <span className="text-xs font-bold text-charcoal/80 px-2">
                  {monthNames[month]} {year}
                </span>
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-white rounded-lg text-charcoal transition-all cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-white rounded-lg text-charcoal transition-all cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-100">
                  128 Total Delivered
                </span>
                <span className="px-3 py-1 bg-rose-50 text-rose-800 text-[10px] font-bold rounded-full border border-rose-100">
                  4 Drops Failed
                </span>
                <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded-full border border-primary/10">
                  Active Tenant: {tenant}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* The Month Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-black text-charcoal/40 uppercase tracking-wider mb-2">
                <div>Su</div>
                <div>Mo</div>
                <div>Tu</div>
                <div>We</div>
                <div>Th</div>
                <div>Fr</div>
                <div>Sa</div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {/* Empty headers matching start offset */}
                {blankBoxes.map((_, idx) => (
                  <div key={`blank-${idx}`} className="py-4 bg-transparent"></div>
                ))}
                {dayBoxes.map((_, index) => {
                  const day = index + 1;
                  let bg = "bg-silver/10 text-charcoal/30";
                  let label = "Drops Scheduled";
                  let count = "12 drops";

                  const isMay2026 = year === 2026 && month === 4;

                  if (isMay2026) {
                    if (day < 18) {
                      bg = "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25";
                      label = "Delivered Drops";
                      count = "12/12 Completed";
                    } else if (day === 18) {
                      bg = "bg-rose-500/10 text-rose-700 border border-rose-500/25";
                      label = "Unsuccessful attempts";
                      count = "10 Drops / 2 Failed";
                    } else if (day > 18 && day < 22) {
                      bg = "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25";
                      label = "Delivered Drops";
                      count = "12/12 Completed";
                    } else {
                      bg = "bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 cursor-pointer font-black";
                      label = "Scheduled Drops";
                      count = "14 scheduled";
                    }
                  } else if (year < 2026 || (year === 2026 && month < 4)) {
                    bg = "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25";
                    label = "Delivered Drops";
                    count = "12/12 Completed";
                  } else {
                    bg = "bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 cursor-pointer font-black";
                    label = "Scheduled Drops";
                    count = "14 scheduled";
                  }

                  return (
                    <div
                      key={day}
                      className={`p-1.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col justify-between items-start min-h-[48px] sm:min-h-[75px] transition-all hover:scale-[1.02] ${bg}`}
                    >
                      <span className="text-[10px] sm:text-xs font-black">{day}</span>
                      <div className="mt-1 hidden sm:block">
                        <span className="text-[8px] uppercase tracking-wider block opacity-70 leading-none">{label}</span>
                        <span className="text-[10px] font-bold block leading-normal mt-0.5">{count}</span>
                      </div>
                      <div className="sm:hidden w-1.5 h-1.5 rounded-full mt-1 bg-current self-center" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Dispatches List panel */}
            <div className="bg-silver/5 p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
              <div className="border-b border-silver/30 pb-4">
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">
                  Today's Active Drops (May 21)
                </h3>
                <p className="text-[10px] text-charcoal/50 font-bold mt-0.5">
                  Live distribution tracking and driver status updates
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="p-3.5 bg-white border border-silver/50 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-charcoal">Amit Kumar (Customer)</h4>
                    <p className="text-[10px] text-charcoal/60 mt-0.5">Full Cream Milk · 2L</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full">
                    Delivered
                  </span>
                </div>

                <div className="p-3.5 bg-white border border-silver/50 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-charcoal">Ravi Sharma (Customer)</h4>
                    <p className="text-[10px] text-charcoal/60 mt-0.5">Skimmed Milk · 1L</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full">
                    Delivered
                  </span>
                </div>

                <div className="p-3.5 bg-white border border-silver/50 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-charcoal">Priya Patel (Customer)</h4>
                    <p className="text-[10px] text-charcoal/60 mt-0.5">Organic Cow Ghee · 1 Jar</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-full animate-pulse">
                    In Transit
                  </span>
                </div>

                <div className="p-3.5 bg-white border border-silver/50 rounded-2xl flex items-center justify-between opacity-70">
                  <div>
                    <h4 className="text-xs font-black text-charcoal">Suresh Gupta (Customer)</h4>
                    <p className="text-[10px] text-charcoal/60 mt-0.5">Paneer · 1 Kg</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-silver text-charcoal text-[9px] font-bold rounded-full">
                    Vacation Paused
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
