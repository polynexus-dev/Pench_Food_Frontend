import React, { useState, useEffect, useMemo } from "react";
import { Truck, RefreshCw, PieChart, Navigation, Sparkles, ClipboardList } from "lucide-react";
import { deliveryApi } from "../api/deliveryApi";
import type { Driver, Route as RouteType } from "../components/types";
import LogisticsDashboardTab from "../components/LogisticsDashboardTab";
import RouteTab from "../components/RouteTab";
import DispatchSummaryTab from "../components/DispatchSummaryTab";
import AssignPendingModal from "../components/AssignPendingModal";
import { useAuthStore } from "../../../store/useAuthStore";

const LogisticsPage: React.FC = () => {
  const tenant = useAuthStore((state) => state.tenant);
  const [activeTab, setActiveTab] = useState<"dashboard" | "routes" | "dispatch">("dashboard");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAssignPendingOpen, setIsAssignPendingOpen] = useState<boolean>(false);

  const [routes, setRoutes] = useState<RouteType[]>([]);

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

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setIsAssignPendingOpen(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 active:scale-95 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Bulk Assign Orders
          </button>
          <button
            onClick={() => fetchLogisticsData(false)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs disabled:opacity-50"
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
        <RouteTab routes={routes} isLoading={isLoading} />
      )}
      {activeTab === "dispatch" && (
        <DispatchSummaryTab routes={routes} isLoading={isLoading} />
      )}

      <AssignPendingModal
        isOpen={isAssignPendingOpen}
        onClose={() => setIsAssignPendingOpen(false)}
        onSuccess={() => fetchLogisticsData(false)}
      />
    </div>
  );
};

export default LogisticsPage;
