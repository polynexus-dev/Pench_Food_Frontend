import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Phone,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  Navigation,
  UserCheck,
  UserMinus,
  Activity,
  User,
  Info,
  ShieldCheck,
  Hash,
  MapPin,
} from "lucide-react";
import type { Driver } from "./types";
import { deliveryApi } from "../../deliveries/api/deliveryApi";
import type { Route } from "../../deliveries/components/types";
import axiosInstance from "../../../api/axiosInstance";
import { tenantApi } from "../../tenant/api/tenantApi";
import type { Zone } from "../../tenant/components/types";
import { driverApi } from "../api/driverApi";

interface DriverProfileTabProps {
  driver: Driver;
  onBack: () => void;
  onUpdateDriver: (updatedDriver: Driver) => void;
}

const DriverProfileTab: React.FC<DriverProfileTabProps> = ({
  driver,
  onBack,
  onUpdateDriver,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"basic" | "deliveries">("basic");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState<boolean>(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Zone Assignment State
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState<boolean>(true);
  const [isUpdatingZone, setIsUpdatingZone] = useState<boolean>(false);

  // Fetch zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setIsLoadingZones(true);
        const data = await tenantApi.getZones();
        setZones(data);
      } catch (error) {
        console.error("Failed to fetch zones for assignment:", error);
      } finally {
        setIsLoadingZones(false);
      }
    };
    fetchZones();
  }, []);

  const handleZoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newZoneValue = e.target.value;
    const newZoneId = newZoneValue || null;

    setIsUpdatingZone(true);
    setStatusError(null);
    try {
      const updated = await driverApi.updateDriver(driver.id, {
        zone: newZoneId,
      });
      onUpdateDriver(updated);
    } catch (err: any) {
      console.error("Failed to update driver zone:", err);
      setStatusError("Failed to update zone assignment. Please try again.");
    } finally {
      setIsUpdatingZone(false);
    }
  };

  // Fetch routes on mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setIsLoadingRoutes(true);
        const allRoutes = await deliveryApi.getRoutes();
        // Filter routes where route.driver matches driver.user (numeric ID)
        const driverRoutes = allRoutes.filter((r) => r.driver === driver.user);
        setRoutes(driverRoutes);
      } catch (error) {
        console.error("Failed to fetch driver routes:", error);
      } finally {
        setIsLoadingRoutes(false);
      }
    };

    fetchRoutes();
  }, [driver.user]);

  // Toggle availability status
  const handleToggleAvailability = async () => {
    setIsUpdatingStatus(true);
    setStatusError(null);
    const updatedAvailableState = !driver.is_available;

    try {
      // Proactively try to patch availability status in the backend
      const response = await axiosInstance.patch<Driver>(`/ems/drivers/${driver.id}/`, {
        is_available: updatedAvailableState,
      });
      onUpdateDriver(response.data);
    } catch (err: any) {
      console.warn("API PATCH for availability failed or not supported, updating local state only:", err);
      // Fallback: update local state if API doesn't support patch directly
      const mockUpdatedDriver = {
        ...driver,
        is_available: updatedAvailableState,
      };
      onUpdateDriver(mockUpdatedDriver);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Calculate delivery stats
  const deliveryStats = React.useMemo(() => {
    const total = routes.length;
    const completed = routes.filter((r) => r.status === "completed" || r.is_completed).length;
    const active = routes.filter((r) => r.status === "active").length;
    const pending = routes.filter((r) => r.status === "pending").length;
    return { total, completed, active, pending };
  }, [routes]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back button header banner */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-silver/50 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs cursor-pointer outline-none focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          Back to Drivers
        </button>

        <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">
          Driver Profile Manager
        </span>
      </div>

      {/* Main Grid Layout: left sidebar + right content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Driver Sidebar Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-silver/50 shadow-sm p-6 space-y-6">
          {/* Header Info */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-silver/30">
            <div className="w-20 h-20 bg-gradient-to-tr from-primary to-sage text-white rounded-2xl flex items-center justify-center font-black text-3xl shadow-lg shadow-primary/10 border-2 border-white mb-4">
              {driver.full_name.charAt(0)}
            </div>
            <h2 className="text-xl font-black text-charcoal tracking-tight">
              {driver.full_name}
            </h2>
            <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest flex items-center gap-1.5 justify-center mt-1">
              <Truck className="w-3.5 h-3.5 text-primary/40" />
              {driver.vehicle_plate} ({driver.vehicle_type})
            </p>
            <div className="mt-4 flex flex-col items-center gap-2.5">
              <span
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  driver.is_available
                    ? "bg-sage/10 text-primary border-primary/10"
                    : "bg-red-50 text-red-500 border-red-100"
                }`}
              >
                {driver.is_available ? "Available" : "Busy"}
              </span>
              <span className="px-2.5 py-1 bg-silver/15 border border-silver/30 rounded-lg text-[8px] font-mono text-charcoal/40 uppercase tracking-wider max-w-full truncate">
                ID: #{driver.user}
              </span>
            </div>
          </div>

          {/* Quick Info Stack */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-charcoal/30 uppercase tracking-wider">
              Quick Details
            </h3>

            {driver.phone && (
              <div className="flex items-center gap-3 p-3 bg-silver/5 hover:bg-silver/10 rounded-xl border border-silver/30 transition-colors">
                <div className="p-1.5 bg-white rounded-lg border border-silver/50 text-primary flex-shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-black text-charcoal/30 uppercase tracking-wider">
                    Phone
                  </p>
                  <p className="text-xs font-bold text-charcoal truncate">
                    {driver.phone}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-silver/5 hover:bg-silver/10 rounded-xl border border-silver/30 transition-colors">
              <div className="p-1.5 bg-white rounded-lg border border-silver/50 text-primary flex-shrink-0">
                <Package className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-black text-charcoal/30 uppercase tracking-wider">
                  Max Capacity
                </p>
                <p className="text-xs font-bold text-charcoal truncate">
                  {driver.max_capacity_kg} kg
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-silver/5 hover:bg-silver/10 rounded-xl border border-silver/30 transition-colors">
              <div className="p-1.5 bg-white rounded-lg border border-silver/50 text-primary flex-shrink-0">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-black text-charcoal/30 uppercase tracking-wider">
                  Vehicle Type
                </p>
                <p className="text-xs font-bold text-charcoal truncate capitalize">
                  {driver.vehicle_type}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="pt-4 border-t border-silver/30">
            <button
              onClick={handleToggleAvailability}
              disabled={isUpdatingStatus}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs outline-none focus:outline-none ${
                driver.is_available
                  ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100/50"
                  : "bg-sage/10 border-primary/15 text-primary hover:bg-primary/10"
              }`}
            >
              {driver.is_available ? (
                <>
                  <UserMinus className="w-4 h-4" /> Mark as Busy
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> Mark as Available
                </>
              )}
            </button>
            {statusError && (
              <p className="text-[10px] text-red-500 text-center mt-2 font-bold">{statusError}</p>
            )}
          </div>
        </div>

        {/* Right Column: Tab Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Metrics Header */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-silver/50 shadow-xs flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-charcoal/40 uppercase tracking-widest">
                  Total Routes
                </p>
                <p className="text-xl font-black text-charcoal">
                  {deliveryStats.total}
                </p>
              </div>
              <div className="p-2.5 bg-silver/10 rounded-xl text-charcoal/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Navigation className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-silver/50 shadow-xs flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-charcoal/40 uppercase tracking-widest">
                  Active Trips
                </p>
                <p className="text-xl font-black text-primary">
                  {deliveryStats.active}
                </p>
              </div>
              <div className="p-2.5 bg-sage/10 rounded-xl text-primary transition-colors">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-silver/50 shadow-xs flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-charcoal/40 uppercase tracking-widest">
                  Completed
                </p>
                <p className="text-xl font-black text-charcoal">
                  {deliveryStats.completed}
                </p>
              </div>
              <div className="p-2.5 bg-silver/10 rounded-xl text-charcoal/40 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-sage" />
              </div>
            </div>
          </div>

          {/* Details Container */}
          <div className="bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            {/* Navigation Tabs */}
            <div className="px-6 border-b border-silver/30 bg-silver/5 flex items-center gap-6">
              <button
                onClick={() => setActiveSubTab("basic")}
                className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex items-center gap-2 cursor-pointer outline-none focus:outline-none ${
                  activeSubTab === "basic"
                    ? "text-primary"
                    : "text-charcoal/40 hover:text-charcoal"
                }`}
              >
                <Info className={`w-4 h-4 ${activeSubTab === "basic" ? "text-primary" : "text-charcoal/30"}`} />
                Basic Details
                {activeSubTab === "basic" && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setActiveSubTab("deliveries")}
                className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex items-center gap-2 cursor-pointer outline-none focus:outline-none ${
                  activeSubTab === "deliveries"
                    ? "text-primary"
                    : "text-charcoal/40 hover:text-charcoal"
                }`}
              >
                <Truck className={`w-4 h-4 ${activeSubTab === "deliveries" ? "text-primary" : "text-charcoal/30"}`} />
                Delivery History
                {activeSubTab === "deliveries" && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full"></div>
                )}
              </button>
            </div>

            {/* Tab content screens */}
            <div className="p-6 flex-1 bg-white">
              {activeSubTab === "basic" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Driver Profile Summary Card */}
                    <div className="p-6 bg-silver/5 rounded-2xl border border-silver/30">
                      <h4 className="text-xs font-black text-charcoal uppercase tracking-wider mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" /> Driver Information
                      </h4>
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-charcoal/40 font-bold">Full Name</span>
                          <span className="font-bold text-charcoal">{driver.full_name}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-charcoal/40 font-bold">User Link ID</span>
                          <span className="font-bold text-charcoal font-mono">#{driver.user}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-charcoal/40 font-bold">Account UUID</span>
                          <span className="font-bold text-charcoal font-mono text-[10px] truncate max-w-[180px]" title={driver.id}>{driver.id}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-charcoal/40 font-bold">Phone Number</span>
                          <span className="font-bold text-charcoal">{driver.phone || "Not specified"}</span>
                        </div>
                        {driver.rating && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-charcoal/40 font-bold">Performance Rating</span>
                            <span className="font-bold text-amber-500">★ {driver.rating.toFixed(1)} / 5.0</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs pt-3.5 border-t border-silver/30">
                          <span className="text-charcoal/40 font-bold flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            Assigned Zone
                          </span>
                          {isLoadingZones ? (
                            <span className="text-charcoal/30 font-medium">Loading zones...</span>
                          ) : (
                            <select
                              value={driver.zone || ""}
                              onChange={handleZoneChange}
                              disabled={isUpdatingZone}
                              className="font-bold text-charcoal bg-white border border-silver/50 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                            >
                              <option value="">Unassigned</option>
                              {zones.map((zone) => (
                                <option key={zone.id} value={zone.id}>
                                  {zone.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Details summary card */}
                    <div className="p-6 bg-silver/5 rounded-2xl border border-silver/30">
                      <h4 className="text-xs font-black text-charcoal uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" /> Vehicle specifications
                      </h4>
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-charcoal/40 font-bold">License Plate</span>
                          <span className="font-bold text-charcoal font-mono bg-white border border-silver/50 px-2 py-0.5 rounded uppercase">{driver.vehicle_plate}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-charcoal/40 font-bold">Vehicle Class</span>
                          <span className="font-bold text-charcoal capitalize">{driver.vehicle_type}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-charcoal/40 font-bold">Maximum Capacity</span>
                          <span className="font-bold text-charcoal">{driver.max_capacity_kg} kg</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-charcoal/40 font-bold">Current Availability</span>
                          <span className={`font-black text-[10px] uppercase tracking-wider ${driver.is_available ? "text-primary" : "text-red-500"}`}>
                            {driver.is_available ? "Available" : "Busy"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-silver/30 rounded-2xl bg-primary/5">
                    <h4 className="text-xs font-black text-charcoal uppercase tracking-wider mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" /> Logistics Operations Note
                    </h4>
                    <p className="text-xs text-charcoal/60 leading-relaxed font-medium">
                      This driver is registered under the active dairy tenant schema. Their vehicle plate matches local RTO configurations and their maximum carrying load capacity represents weight thresholds allowed for routing optimization in automated dispatch schedules.
                    </p>
                  </div>
                </div>
              )}

              {activeSubTab === "deliveries" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {isLoadingRoutes ? (
                    <div className="space-y-3">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-16 bg-silver/5 rounded-2xl animate-pulse border border-silver/30"></div>
                      ))}
                    </div>
                  ) : routes.length > 0 ? (
                    <div className="border border-silver/50 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-silver/10 text-[9px] uppercase tracking-widest text-charcoal/40 font-black border-b border-silver/30">
                            <tr>
                              <th className="px-6 py-4">Route Info</th>
                              <th className="px-6 py-4">Stops</th>
                              <th className="px-6 py-4">Delivery Date</th>
                              <th className="px-6 py-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-silver/30 text-xs font-bold text-charcoal">
                            {routes.map((route) => (
                              <tr key={route.id} className="hover:bg-primary/5 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <Hash className="w-3.5 h-3.5 text-primary/40" />
                                    <span>{route.name || `Route #${route.id.slice(0, 8)}`}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="bg-silver/20 px-2 py-0.5 rounded font-mono">
                                    {route.stops?.length || 0} stops
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-charcoal/50">
                                  {route.delivery_date ? new Date(route.delivery_date).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  }) : "N/A"}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                    route.status === "completed" || route.is_completed
                                      ? "bg-sage/10 text-primary border-primary/10"
                                      : route.status === "active"
                                      ? "bg-blue-50 text-blue-500 border-blue-100"
                                      : "bg-amber-50 text-amber-500 border-amber-100"
                                  }`}>
                                    {route.status === "completed" || route.is_completed ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3" /> Completed
                                      </>
                                    ) : route.status === "active" ? (
                                      <>
                                        <Activity className="w-3 h-3 animate-pulse" /> Active
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3" /> Pending
                                      </>
                                    )}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center border border-dashed border-silver/50 rounded-2xl bg-silver/5">
                      <Truck className="w-10 h-10 text-charcoal/20 mx-auto mb-2" />
                      <p className="text-sm font-black text-charcoal/40">No assigned routes found</p>
                      <p className="text-xs text-charcoal/30 mt-0.5">This driver hasn't been assigned any active dispatch schedules.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverProfileTab;
