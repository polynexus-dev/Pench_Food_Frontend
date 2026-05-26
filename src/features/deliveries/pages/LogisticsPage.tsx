import React, { useState, useEffect, useMemo } from "react";
import { Truck, RefreshCw, PieChart, Navigation, Sparkles, ClipboardList, Calendar, CheckCircle, AlertTriangle, ChevronDown } from "lucide-react";
import { deliveryApi } from "../api/deliveryApi";
import type { Driver, Route as RouteType } from "../components/types";
import LogisticsDashboardTab from "../components/LogisticsDashboardTab";
import RouteTab from "../components/RouteTab";
import DispatchSummaryTab from "../components/DispatchSummaryTab";
import AssignPendingModal from "../components/AssignPendingModal";
import { useAuthStore } from "../../../store/useAuthStore";
import { getCityWsUrl } from "../../../utils/constants";

const LogisticsPage: React.FC = () => {
  const tenant = useAuthStore((state) => state.tenant);
  const [activeTab, setActiveTab] = useState<"dashboard" | "routes" | "dispatch">("dashboard");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAssignPendingOpen, setIsAssignPendingOpen] = useState<boolean>(false);

  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [targetDate, setTargetDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isGenerateDropdownOpen, setIsGenerateDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Real-time WebSocket connection to listen for order delivery notifications
  useEffect(() => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;
    
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    
    const connect = () => {
      try {
        const wsUrl = getCityWsUrl(tenant);
        // Append JWT Token to query string for secure authentication
        const finalUrl = `${wsUrl}${wsUrl.includes("?") ? "&" : "?"}token=${accessToken}`;
        
        socket = new WebSocket(finalUrl);
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "broadcast_location" && data.notification_type === "order_delivered") {
              setNotification({
                title: data.title || "Order Delivered! 🎉",
                message: data.message,
                type: "success"
              });
              // Silently refresh route/driver status data in real-time!
              fetchLogisticsData(true);
            }
          } catch (err) {
            console.error("Failed to parse incoming WebSocket message:", err);
          }
        };
        
        socket.onclose = () => {
          // Reconnect automatically with backoff
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch (err) {
        console.error("WebSocket connection failure:", err);
      }
    };
    
    connect();
    
    return () => {
      if (socket) {
        socket.onclose = null; // Prevent reconnect loop on close
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [tenant]);

  const fetchLogisticsData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [driverData, routeData] = await Promise.all([
        deliveryApi.getDrivers(),
        deliveryApi.getRoutes(),
      ]);
      setDrivers(driverData);
      setRoutes(routeData);
    } catch (error) {
      console.error("Failed to fetch logistics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRoutes = async () => {
    setIsLoading(true);
    try {
      const res = await deliveryApi.generateDailyRoutes(targetDate);
      setNotification({
        title: "Routes Generated",
        message: `Successfully generated routes for ${targetDate}!\nCreated: ${res.routes_created} routes | ${res.orders_created} orders.`,
        type: "success"
      });
      await fetchLogisticsData(true);
    } catch (error) {
      console.error("Failed to generate routes:", error);
      setNotification({
        title: "Generation Failed",
        message: "Failed to generate daily routes. Please try again.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateRoutes = async () => {
    if (!window.confirm(`Are you sure you want to force regenerate? This will delete all ${targetDate}'s incomplete routes and recreate them!`)) return;
    setIsLoading(true);
    try {
      const res = await deliveryApi.regenerateDailyRoutes(targetDate);
      setNotification({
        title: "Routes Regenerated",
        message: `Successfully regenerated routes for ${targetDate}!\nCreated: ${res.routes_created} routes | ${res.orders_created} orders.`,
        type: "success"
      });
      await fetchLogisticsData(true);
    } catch (error) {
      console.error("Failed to regenerate routes:", error);
      setNotification({
        title: "Regeneration Failed",
        message: "Failed to regenerate daily routes. Please try again.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogisticsData();
  }, [tenant]);

  const stats = useMemo(() => {
    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter((d) => d.is_available).length;
    const activeTrips = routes.filter((r) => r.status === "active").length;
    const totalCapacity = drivers.reduce(
      (sum, d) => sum + (parseInt(d.max_capacity_kg) || 0),
      0,
    );
    const utilizationRate =
      totalDrivers > 0 ? Math.round((activeTrips / totalDrivers) * 100) : 0;

    return {
      totalDrivers,
      availableDrivers,
      activeTrips,
      totalCapacity,
      utilizationRate,
    };
  }, [drivers, routes]);

  return (
    <div className="max-w-8xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* 1. Header Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-xs">
              <Truck className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-charcoal tracking-tight flex items-center gap-2">
                Logistics & Fleet
              </h1>
              <p className="text-charcoal/50 font-medium text-xs mt-0.5">
                Manage your distribution network, vehicle capacity, and
                real-time routing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto flex-wrap">
          {/* Custom Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-silver/60 rounded-xl px-3 py-2 shadow-2xs hover:border-primary/40 transition-colors">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[10px] font-black uppercase text-charcoal/40 tracking-wider">Target Date:</span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-charcoal focus:outline-none cursor-pointer"
            />
          </div>

          {/* Combined Elegant Generate Split Button */}
          <div className="relative flex items-stretch">
            <button
              onClick={handleGenerateRoutes}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-l-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50 cursor-pointer border-r border-emerald-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Routes
            </button>
            <button
              onClick={() => setIsGenerateDropdownOpen(!isGenerateDropdownOpen)}
              disabled={isLoading}
              className="flex items-center justify-center px-2.5 bg-emerald-600 text-white rounded-r-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50 cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {isGenerateDropdownOpen && (
              <>
                {/* Backdrop overlay to click outside and close */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsGenerateDropdownOpen(false)}
                />
                
                {/* Elegant Dropdown Card */}
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-silver/50 rounded-2xl shadow-xl z-50 p-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      setIsGenerateDropdownOpen(false);
                      handleGenerateRoutes();
                    }}
                    className="w-full text-left p-3 hover:bg-silver/10 rounded-xl transition-colors flex items-start gap-3 group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-charcoal">Generate Routes (Safe Mode)</h4>
                      <p className="text-[10px] font-semibold text-charcoal/40 mt-0.5 leading-relaxed">
                        Safely creates routes for unassigned zones. Does not overwrite or affect existing routes.
                      </p>
                    </div>
                  </button>

                  <div className="h-px bg-silver/30 my-1" />

                  <button
                    onClick={() => {
                      setIsGenerateDropdownOpen(false);
                      handleRegenerateRoutes();
                    }}
                    className="w-full text-left p-3 hover:bg-rose-50 rounded-xl transition-colors flex items-start gap-3 group"
                  >
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors shrink-0">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-750">Force Regenerate (Reset Mode)</h4>
                      <p className="text-[10px] font-semibold text-rose-600/50 mt-0.5 leading-relaxed">
                        Wipes out all existing incomplete routes for this date and runs complete optimization again.
                      </p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setIsAssignPendingOpen(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 active:scale-95 transition-all shadow-md shadow-primary/10 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Bulk Assign Orders
          </button>
          <button
            onClick={() => fetchLogisticsData(false)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-primary ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh Fleet
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
          Logistics Dashboard
          {activeTab === "dashboard" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("routes")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "routes"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <Navigation
            className={`w-4 h-4 ${activeTab === "routes" ? "text-primary" : "text-charcoal/40"}`}
          />
          Route Management
          {activeTab === "routes" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("dispatch")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "dispatch"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <ClipboardList
            className={`w-4 h-4 ${activeTab === "dispatch" ? "text-primary" : "text-charcoal/40"}`}
          />
          Daily Dispatch Sheet
          {activeTab === "dispatch" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>
      </div>

      {/* 3. Tab Content */}
      {activeTab === "dashboard" && <LogisticsDashboardTab stats={stats} />}
      {activeTab === "routes" && (
        <RouteTab routes={routes} drivers={drivers} isLoading={isLoading} onRefresh={() => fetchLogisticsData(true)} />
      )}
      {activeTab === "dispatch" && (
        <DispatchSummaryTab routes={routes} drivers={drivers} isLoading={isLoading} />
      )}

      <AssignPendingModal
        isOpen={isAssignPendingOpen}
        onClose={() => setIsAssignPendingOpen(false)}
        onSuccess={() => fetchLogisticsData(false)}
      />

      {/* Dynamic Modern Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3.5 px-5 py-4.5 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-10 duration-300 max-w-sm ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-500/20 text-emerald-800"
              : "bg-rose-50 border-rose-500/20 text-rose-800"
          }`}
        >
          <div
            className={`p-2 rounded-xl shrink-0 ${
              notification.type === "success"
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-sm tracking-tight">
              {notification.title}
            </h4>
            <p className="text-[11px] font-semibold opacity-85 mt-1 whitespace-pre-line leading-relaxed">
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-[10px] font-black uppercase tracking-wider opacity-45 hover:opacity-100 transition-opacity cursor-pointer border border-charcoal/10 rounded-md px-1.5 py-0.5 bg-charcoal/5"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default LogisticsPage;
