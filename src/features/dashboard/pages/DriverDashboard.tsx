import React, { useState, useEffect } from "react";
import {
  Calendar,
  Truck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  ClipboardList,
  User,
  Coffee,
  Phone,
  Package,
  Layers,
  Map,
  X
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { deliveryApi } from "../../deliveries/api/deliveryApi";
import type { Route as RouteType, Stop } from "../../deliveries/components/types";

const getStatusBadgeStyle = (status?: string) => {
  const normalised = status?.toLowerCase();
  switch (normalised) {
    case "delivered":
      return "bg-emerald-50 border-emerald-500/20 text-emerald-700";
    case "undelivered":
      return "bg-rose-50 border-rose-500/20 text-rose-700";
    case "in_transit":
    case "dispatched":
      return "bg-amber-50 border-amber-500/20 text-amber-700 animate-pulse";
    case "pending":
    case "confirmed":
      return "bg-slate-100 border-slate-500/10 text-slate-600";
    case "scheduled":
      return "bg-blue-50 border-blue-500/20 text-blue-700";
    case "vacation":
      return "bg-orange-50 border-orange-500/20 text-orange-700";
    case "skipped":
      return "bg-zinc-200 border-zinc-500/30 text-zinc-800";
    case "off_day":
      return "bg-zinc-50 border-zinc-500/10 text-zinc-400";
    default:
      return "bg-slate-100 border-slate-500/10 text-slate-500";
  }
};

const DriverDashboard = () => {
  const { user } = useAuthStore();
  const [route, setRoute] = useState<RouteType | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(true);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Leave Planner state
  const [leaves, setLeaves] = useState([
    { id: 1, date: "2026-05-28", reason: "Personal work", status: "Approved" },
  ]);
  const [leaveDate, setLeaveDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState<string | null>(null);

  // Selected stop details inspector modal state
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  // Fetch driver's active route
  const fetchActiveRoute = async (silent = false) => {
    if (!silent) {
      setIsLoadingRoute(true);
    }
    setRouteError(null);
    try {
      const data = await deliveryApi.getMyRoute();
      setRoute(data);
    } catch (err: any) {
      console.warn("Failed to fetch active driver route:", err);
      setRoute(null);
      if (err.response?.status === 404) {
        setRouteError("No active delivery route has been assigned to your account today.");
      } else {
        setRouteError("Failed to synchronize active route details. Please check connection.");
      }
    } finally {
      setIsLoadingRoute(false);
    }
  };

  useEffect(() => {
    fetchActiveRoute();
  }, []);

  // Trip Start / Stop trigger
  const handleToggleTrip = async () => {
    if (!route) return;
    const isStarted = route.status === "started" || route.status === "in_progress" || route.status === "in_transit" || route.status === "active";
    try {
      setIsLoadingRoute(true);
      if (isStarted) {
        await deliveryApi.completeTrip(route.id);
      } else {
        await deliveryApi.startTrip(route.id);
      }
      await fetchActiveRoute(true);
    } catch (err) {
      console.error("Failed to toggle trip status:", err);
      alert("Failed to toggle trip status. Please check connection.");
      setIsLoadingRoute(false);
    }
  };

  // Log Stop Status (Delivered vs Undelivered)
  const handleUpdateStopStatus = async (orderId: string, status: "delivered" | "undelivered") => {
    try {
      await deliveryApi.updateOrderStatus(orderId, status);
      // Automatically refresh route details in background to sync state
      await fetchActiveRoute(true);
      if (selectedStop && selectedStop.order === orderId) {
        // Update currently inspected stop state in real-time
        setSelectedStop(prev => prev ? { ...prev, order_status: status } : null);
      }
    } catch (err) {
      console.error("Failed to update stop status:", err);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleRequestLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate || !reason) return;

    setIsSubmittingLeave(true);
    setTimeout(() => {
      const newLeave = {
        id: Date.now(),
        date: leaveDate,
        reason,
        status: "Pending",
      };
      setLeaves([newLeave, ...leaves]);
      setLeaveDate("");
      setReason("");
      setIsSubmittingLeave(false);
      setLeaveMsg("Your shift off-duty request has been submitted for distributor approval!");
      setTimeout(() => setLeaveMsg(null), 5000);
    }, 800);
  };

  // Compute calculated metrics
  const completedStops = route?.stops.filter(s => s.order_status === "delivered" || s.order_status === "undelivered").length || 0;
  const totalStops = route?.stops.length || 0;
  const returnRate = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  const stats = [
    { title: "Monthly Payout", value: "₹18,500", detail: "Active Tier A", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
    { title: "Today's Progress", value: route ? `${completedStops} / ${totalStops}` : "0 Stops", detail: route ? `${returnRate}% Completed` : "Offline", icon: Clock, color: "text-primary bg-primary/5" },
    { title: "Containers Recovered", value: "84 Bottles", detail: "98% Return Rate", icon: CheckCircle2, color: "text-amber-500 bg-amber-50" },
    { title: "Average Rating", value: "4.9 / 5.0", detail: "Excellent Team Player", icon: User, color: "text-charcoal bg-silver/20" },
  ];

  // Format Schema City Name Beautifully
  const formatCityName = (schema: string | null) => {
    if (!schema) return "Nagpur";
    return schema
      .replace(/^(an_|tst2_|pench_)/, "")
      .replace(/_/, " ")
      .toUpperCase();
  };

  return (
    <div className="p-8 space-y-8 bg-milk-white min-h-screen">
      {/* 1. Driver Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-silver/50 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest mb-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Driver Employee Portal
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal tracking-tight">
            Welcome back, {user?.first_name || user?.username || "Delivery Hero"}!
          </h1>
          <p className="text-charcoal/60 mt-1.5 text-sm flex flex-wrap items-center gap-2 font-medium">
            <span>Logged in for:</span>
            <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-md font-bold text-xs uppercase tracking-wider">
              {user?.company_name || "Pench Foods"}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-silver"></span>
            <span className="px-2.5 py-0.5 bg-sage/20 text-emerald-800 rounded-md font-bold text-xs">
              {formatCityName(user?.tenant_schema)}
            </span>
          </p>
        </div>
        <div className="px-5 py-3.5 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3 shrink-0">
          <Truck className="w-8 h-8 text-primary shrink-0" />
          <div>
            <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Assigned vehicle</span>
            <span className="text-xs font-black text-charcoal truncate">
              {route?.name ? "MH-40-AQ-9912 (Suzuki Carry)" : "Standard Logistics Fleet"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Performance Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm flex items-start gap-4 hover:shadow-md transition-all">
            <div className={`p-3 rounded-xl shrink-0 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">{stat.title}</span>
              <span className="text-2xl font-black text-charcoal mt-1 block">{stat.value}</span>
              <span className="text-xs text-charcoal/60 font-medium mt-1 block">{stat.detail}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Core Operational Views Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Route Run Drop Sheet */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-silver/30 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Today's Dispatch stops
                </h2>
                <p className="text-xs text-charcoal/60 mt-1">
                  {route ? `Assigned dispatch sheet: ${route.name}` : "Check yourMorning schedule allocation below."}
                </p>
              </div>

              {route && (
                <button
                  onClick={handleToggleTrip}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm active:scale-95 transition-all ${
                    route.status === "started" || route.status === "in_progress" || route.status === "in_transit" || route.status === "active"
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {route.status === "started" || route.status === "in_progress" || route.status === "in_transit" || route.status === "active" ? "End active trip" : "Start Dispatch Run"}
                </button>
              )}
            </div>

            {isLoadingRoute ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-charcoal/60">Fetching morning dispatch allocations...</p>
              </div>
            ) : routeError || !route ? (
              <div className="py-16 text-center px-4 space-y-3">
                <AlertCircle className="w-12 h-12 text-charcoal/20 mx-auto" />
                <h3 className="text-base font-black text-charcoal">No Dispatch Run Assigned</h3>
                <p className="text-xs text-charcoal/50 max-w-sm mx-auto font-medium">
                  {routeError || "You have no incomplete delivery routes assigned to your account today. Please contact your dispatch coordinator."}
                </p>
              </div>
            ) : (
              <div className="space-y-4 mt-6">
                {route.stops.map((stop) => {
                  const isDelivered = stop.order_status === "delivered";
                  const isUndelivered = stop.order_status === "undelivered";
                  const isPending = !isDelivered && !isUndelivered;

                  return (
                    <div
                      key={stop.id}
                      onClick={() => setSelectedStop(stop)}
                      className="p-4 bg-silver/5 hover:bg-silver/10 border border-silver/30 hover:border-silver rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group"
                    >
                      <div className="flex gap-4 items-start min-w-0">
                        {/* Sequence circle */}
                        <div className="w-8 h-8 rounded-xl bg-charcoal text-white flex items-center justify-center text-xs font-black shrink-0 group-hover:bg-primary transition-colors">
                          {stop.sequence_number}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-charcoal truncate">{stop.customer_name}</h4>
                          <p className="text-xs text-charcoal/50 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                            {stop.address}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {stop.product_list?.map((p, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-white border border-silver/50 rounded-md text-[10px] font-bold text-charcoal/80">
                                {p.product_name} × {p.quantity} {p.unit}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 shrink-0 self-start sm:self-auto">
                        <span
                          className={`px-2.5 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider border ${getStatusBadgeStyle(stop.order_status)}`}
                        >
                          {stop.order_status || "Pending"}
                        </span>
                        
                        {/* Micro action toggles visible if trip is active */}
                        {(route.status === "started" || route.status === "in_progress" || route.status === "in_transit" || route.status === "active") && isPending && (
                          <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleUpdateStopStatus(stop.order, "delivered")}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                            >
                              Deliver
                            </button>
                            <button
                              onClick={() => handleUpdateStopStatus(stop.order, "undelivered")}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                            >
                              Fail
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Leave planner request tab */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
          <div className="border-b border-silver/30 pb-4">
            <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
              <Coffee className="w-5 h-5 text-primary" />
              Request Off-Duty Leave
            </h2>
            <p className="text-xs text-charcoal/60 mt-1">
              Submit planned leaves for scheduling dispatch coverage.
            </p>
          </div>

          {leaveMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {leaveMsg}
            </div>
          )}

          <form onSubmit={handleRequestLeave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">Date Off</label>
              <input
                type="date"
                required
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">Reason for Leave</label>
              <input
                type="text"
                required
                placeholder="e.g. Family function, health checkup..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingLeave}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/10"
            >
              {isSubmittingLeave ? "Submitting..." : "Apply Leave"}
            </button>
          </form>

          {/* Past Leaves List */}
          <div className="space-y-2 mt-4 pt-4 border-t border-silver/30">
            <span className="text-[10px] font-black uppercase text-charcoal/30 tracking-widest ml-1">Off-Duty Logs</span>
            {leaves.length === 0 ? (
              <p className="text-xs text-charcoal/40 text-center py-4 bg-silver/5 rounded-2xl border border-dashed border-silver/50">
                No past leaves requested.
              </p>
            ) : (
              leaves.map((leave) => (
                <div key={leave.id} className="p-3 bg-silver/10 border border-silver/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-charcoal block">{leave.date}</span>
                    <span className="text-[10px] text-charcoal/50 block mt-0.5">{leave.reason}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      leave.status === "Approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800 animate-pulse"
                    }`}
                  >
                    {leave.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Single Stop Detail Inspector Modal */}
      {selectedStop && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-silver/60 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary/90 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70 block">Stop Sequence #{selectedStop.sequence_number}</span>
                <h3 className="font-black text-lg tracking-tight mt-0.5">{selectedStop.customer_name}</h3>
              </div>
              <button
                onClick={() => setSelectedStop(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal stops contents */}
            <div className="p-6 space-y-5">
              {/* Address details */}
              <div className="flex gap-3.5 items-start">
                <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Address Coordinates</span>
                  <span className="text-xs font-bold text-charcoal block mt-0.5">{selectedStop.address}</span>
                  {(selectedStop.latitude && selectedStop.longitude) && (
                    <span className="text-[10px] font-mono text-charcoal/40 block mt-1">
                      Coordinates: {selectedStop.latitude.toFixed(6)}, {selectedStop.longitude.toFixed(6)}
                    </span>
                  )}
                </div>
              </div>

              {/* Contacts */}
              <div className="flex gap-3.5 items-start pt-4 border-t border-silver/30">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Customer Contact</span>
                  <a
                    href={`tel:${selectedStop.customer_phone || ""}`}
                    className="text-xs font-bold text-primary block mt-0.5 hover:underline"
                  >
                    {selectedStop.customer_phone || "Not provided"}
                  </a>
                  {selectedStop.customer_email && (
                    <span className="text-[10px] text-charcoal/50 block mt-0.5">{selectedStop.customer_email}</span>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="pt-4 border-t border-silver/30 space-y-2">
                <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Allocated Products</span>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {selectedStop.product_list?.map((p, idx) => (
                    <div key={idx} className="p-2.5 bg-silver/10 rounded-xl flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-charcoal/40" />
                        <span className="text-charcoal">{p.product_name}</span>
                      </div>
                      <span className="text-primary font-black">× {p.quantity} {p.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special instructions / Notes */}
              {selectedStop.order_notes && (
                <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 block">Rider Dispatch Notes:</span>
                    <p className="text-amber-800/80 mt-0.5">{selectedStop.order_notes}</p>
                  </div>
                </div>
              )}

              {/* Interactive bottom controls */}
              <div className="pt-5 border-t border-silver/30 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-charcoal/40 block">Trip status</span>
                  <span
                    className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadgeStyle(selectedStop.order_status)}`}
                  >
                    {selectedStop.order_status || "Pending"}
                  </span>
                </div>

                {route && (route.status === "started" || route.status === "in_progress" || route.status === "in_transit" || route.status === "active") && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStopStatus(selectedStop.order, "delivered")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-xs"
                    >
                      Deliver
                    </button>
                    <button
                      onClick={() => handleUpdateStopStatus(selectedStop.order, "undelivered")}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-xs"
                    >
                      Undelivered
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
