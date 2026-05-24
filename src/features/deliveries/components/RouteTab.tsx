import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Navigation,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Search,
  User,
  Lock,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
  ShoppingBag,
  Layers,
  ChevronRight,
  TrendingUp,
  Activity,
  Image as ImageIcon,
  Plus,
  Minus,
  X,
  Boxes
} from "lucide-react";
import type { Route, Stop, Driver } from "./types";
import { deliveryApi } from "../api/deliveryApi";
import { useAuthStore } from "../../../store/useAuthStore";
import axiosInstance from "../../../api/axiosInstance";

interface RouteTabProps {
  routes: Route[];
  drivers: Driver[];
  isLoading: boolean;
  onRefresh?: () => void;
}

const RouteTab: React.FC<RouteTabProps> = ({ routes, drivers, isLoading, onRefresh }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [isEditingDriver, setIsEditingDriver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [bottlesIssued, setBottlesIssued] = useState(0);
  const [bottlesReturned, setBottlesReturned] = useState(0);

  const openDeliveryForm = (stop: Stop) => {
    let defaultQty = 0;
    if (stop.product_list) {
      stop.product_list.forEach((item) => {
        defaultQty += item.quantity;
      });
    }
    if (defaultQty === 0) {
      defaultQty = 1;
    }
    
    setBottlesIssued(defaultQty);
    setBottlesReturned(defaultQty);
    setShowDeliveryModal(true);
  };

  const handleSubmitDelivery = async () => {
    if (!selectedStop) return;
    setIsSubmittingDelivery(true);
    try {
      // 1. Submit Delivery to the submit-delivery endpoint
      await axiosInstance.post(`/erp/orders/driver/${selectedStop.order}/submit-delivery/`, {
        bottles_issued: bottlesIssued,
        bottles_returned: bottlesReturned
      });

      // 2. Clean up and refresh
      setShowDeliveryModal(false);
      onRefresh?.();
    } catch (err) {
      alert("Failed to submit delivery details: " + (err as any).message);
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const user = useAuthStore((state) => state.user);
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    return (
      user.groups.includes("Logistics_Managers") || 
      user.groups.includes("ERP_Admins") || 
      user.role === "SuperAdmin"
    );
  }, [user]);

  // Selected Route & Stop Memo helpers

  const selectedRoute = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || null;
  }, [routes, selectedRouteId]);

  const selectedStop = useMemo(() => {
    if (!selectedRoute) return null;
    return selectedRoute.stops.find((s) => s.id === selectedStopId) || null;
  }, [selectedRoute, selectedStopId]);

  // Reset selected stop when switching routes
  useEffect(() => {
    setSelectedStopId(null);
    setIsEditingDriver(false);
  }, [selectedRouteId]);

  // Map State
  const [zoom, setZoom] = useState<number>(13);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 21.1458,
    lng: 79.0882,
  });
  const [isManualPan, setIsManualPan] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Sync map center with selected stop or selected route
  useEffect(() => {
    if (selectedStop) {
      setMapCenter({ lat: selectedStop.latitude, lng: selectedStop.longitude });
    } else if (selectedRoute && selectedRoute.stops.length > 0 && !isManualPan) {
      // Calculate center of stops
      const lats = selectedRoute.stops.map(s => s.latitude);
      const lngs = selectedRoute.stops.map(s => s.longitude);
      const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
    } else if (!selectedRouteId && routes.length > 0 && !isManualPan) {
      // Default to first route center
      const firstRoute = routes[0];
      if (firstRoute && firstRoute.stops.length > 0) {
        const lats = firstRoute.stops.map(s => s.latitude);
        const lngs = firstRoute.stops.map(s => s.longitude);
        setMapCenter({ 
          lat: lats.reduce((a, b) => a + b, 0) / lats.length, 
          lng: lngs.reduce((a, b) => a + b, 0) / lngs.length 
        });
      }
    }
  }, [selectedRouteId, selectedRoute, selectedStop, isManualPan, routes]);

  const mapRef = useRef<HTMLDivElement>(null);
  const [mapContainerNode, setMapContainerNode] = useState<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!mapContainerNode) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((z) => Math.min(18, z + 1));
      } else if (e.deltaY > 0) {
        setZoom((z) => Math.max(10, z - 1));
      }
    };

    mapContainerNode.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      mapContainerNode.removeEventListener("wheel", handleNativeWheel);
    };
  }, [mapContainerNode]);

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 600,
        });
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  const VIEWPORT_W = dimensions.width;
  const VIEWPORT_H = dimensions.height;

  const centerTxFloat = useMemo(() => {
    return ((mapCenter.lng + 180) / 360) * Math.pow(2, zoom);
  }, [mapCenter.lng, zoom]);

  const centerTyFloat = useMemo(() => {
    const latRad = (mapCenter.lat * Math.PI) / 180;
    return (
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
    );
  }, [mapCenter.lat, zoom]);

  const getOsmSvgPixel = (targetLat: number, targetLng: number) => {
    const tx = ((targetLng + 180) / 360) * Math.pow(2, zoom);
    const latRad = (targetLat * Math.PI) / 180;
    const ty =
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom);

    const px = VIEWPORT_W / 2 + (tx - centerTxFloat) * 256;
    const py = VIEWPORT_H / 2 + (ty - centerTyFloat) * 256;
    return { x: px, y: py };
  };

  const osmTiles = useMemo(() => {
    const baseTx = Math.floor(centerTxFloat);
    const baseTy = Math.floor(centerTyFloat);
    const maxTile = Math.pow(2, zoom);

    const tilesArr = [];
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const tx = baseTx + dx;
        const ty = baseTy + dy;
        if (ty >= 0 && ty < maxTile) {
          const wrappedTx = ((tx % maxTile) + maxTile) % maxTile;
          const leftPx = VIEWPORT_W / 2 + (tx - centerTxFloat) * 256;
          const topPx = VIEWPORT_H / 2 + (ty - centerTyFloat) * 256;
          tilesArr.push({
            key: `${zoom}-${wrappedTx}-${ty}`,
            left: leftPx,
            top: topPx,
            url: `https://tile.openstreetmap.org/${zoom}/${wrappedTx}/${ty}.png`,
          });
        }
      }
    }
    return tilesArr;
  }, [centerTxFloat, centerTyFloat, zoom, VIEWPORT_W, VIEWPORT_H]);

  // Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsManualPan(true);
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    const getTileCount = (z: number) => Math.pow(2, z);
    const currentTx = ((mapCenter.lng + 180) / 360) * getTileCount(zoom);
    const latRad = (mapCenter.lat * Math.PI) / 180;
    const currentTy = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * getTileCount(zoom);

    const newTx = currentTx - deltaX / 256;
    const newTy = currentTy - deltaY / 256;
    const newLng = (newTx / getTileCount(zoom)) * 360 - 180;
    const M = Math.PI * (1 - (2 * newTy) / getTileCount(zoom));
    const newLat = (Math.atan(0.5 * (Math.exp(M) - Math.exp(-M))) * 180) / Math.PI;

    setMapCenter({ lat: newLat, lng: newLng });
  };

  const handleMouseUp = () => setIsDragging(false);

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      return (
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.driver_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [routes, searchQuery]);

  const sortedRoutes = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return [...filteredRoutes].sort((a, b) => {
      if (a.delivery_date === todayStr && b.delivery_date !== todayStr) {
        return -1;
      }
      if (b.delivery_date === todayStr && a.delivery_date !== todayStr) {
        return 1;
      }

      const aIsFuture = a.delivery_date > todayStr;
      const bIsFuture = b.delivery_date > todayStr;

      if (aIsFuture && !bIsFuture) {
        return -1;
      }
      if (!aIsFuture && bIsFuture) {
        return 1;
      }

      if (aIsFuture && bIsFuture) {
        return a.delivery_date.localeCompare(b.delivery_date);
      } else {
        return b.delivery_date.localeCompare(a.delivery_date);
      }
    });
  }, [filteredRoutes]);

  const getFriendlyDateLabel = (dateStr: string) => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const todayStr = formatDate(today);
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    if (dateStr === todayStr) return "Today";
    if (dateStr === tomorrowStr) return "Tomorrow";
    if (dateStr === yesterdayStr) return "Yesterday";
    
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const getFriendlyDateStyle = (dateStr: string) => {
    const label = getFriendlyDateLabel(dateStr);
    switch (label) {
      case "Today":
        return "bg-amber-50 border-amber-500/25 text-amber-800 font-black shadow-2xs";
      case "Tomorrow":
        return "bg-emerald-50 border-emerald-500/25 text-emerald-800 font-black shadow-2xs";
      case "Yesterday":
        return "bg-silver/10 border-silver/30 text-charcoal/50 font-bold";
      default:
        return "bg-primary/5 border-primary/20 text-primary font-bold";
    }
  };

  // Helper for delivery status badge colors
  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-50 border-emerald-500/20 text-emerald-700";
      case "pending":
      case "confirmed":
        return "bg-amber-50 border-amber-500/20 text-amber-700 animate-pulse";
      case "dispatched":
      case "in_transit":
        return "bg-blue-50 border-blue-500/20 text-blue-700";
      case "cancelled":
        return "bg-rose-50 border-rose-500/20 text-rose-700";
      default:
        return "bg-silver/10 border-silver/30 text-charcoal/50";
    }
  };

  // Helper for route trip status
  const getTripStatusLabel = (route: Route) => {
    if (route.is_completed || route.status === "completed") {
      return { text: "Trip Ended", style: "bg-emerald-100 border-emerald-300 text-emerald-800" };
    }
    switch (route.status) {
      case "in_progress":
      case "started":
        return { text: "Trip In Progress", style: "bg-amber-100 border-amber-300 text-amber-800 animate-pulse" };
      case "stopped":
        return { text: "Trip Stopped", style: "bg-rose-100 border-rose-300 text-rose-800" };
      default:
        return { text: "Not Started", style: "bg-silver/20 border-silver/30 text-charcoal/50" };
    }
  };

  // Calculate cargo item quantities for a selected stop
  const stopTotalCargoCount = (stop: Stop) => {
    if (!stop.product_list) return 0;
    return stop.product_list.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] animate-in fade-in duration-500 text-left">
      
      {/* 1. Sidebar: Routes List OR Sequential Stops */}
      <div className="w-full lg:w-[380px] flex flex-col gap-4 shrink-0">
        
        {/* Render Stops sidebar when a Route is selected */}
        {selectedRoute ? (
          <div className="bg-white p-5 rounded-3xl border border-silver/50 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Stops Header */}
            <div className="flex items-center justify-between mb-4 border-b border-silver/30 pb-3">
              <div>
                <h3 className="text-base font-black text-charcoal tracking-tight">
                  Stops Sequence
                </h3>
                <p className="text-[10px] text-charcoal/40 font-bold uppercase mt-0.5">
                  Route: {selectedRoute.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedRouteId(null)}
                className="text-[10px] font-black text-primary hover:underline uppercase tracking-wide cursor-pointer"
              >
                Back to Routes
              </button>
            </div>

            {/* Assigned Driver Card */}
            <div className="bg-silver/10 border border-silver/35 p-3.5 rounded-2xl mb-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-charcoal/45 tracking-wider">
                  Assigned Driver
                </span>
                {isAuthorized && (
                  <button
                    onClick={() => setIsEditingDriver(!isEditingDriver)}
                    className="text-[10px] font-black text-primary hover:underline uppercase tracking-wide cursor-pointer"
                  >
                    {isEditingDriver ? "Cancel" : "Change"}
                  </button>
                )}
              </div>
              
              {isEditingDriver ? (
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-[10px] font-bold text-charcoal/50">Primary Driver:</span>
                  <select
                    value={selectedRoute.driver || ""}
                    onChange={async (e) => {
                      const newDriverUserId = e.target.value ? parseInt(e.target.value) : null;
                      if (!newDriverUserId) return;
                      try {
                        await deliveryApi.updateRoute(selectedRoute.id, { driver: newDriverUserId });
                        onRefresh?.();
                      } catch (err) {
                        alert("Failed to update driver: " + (err as any).message);
                      }
                    }}
                    className="w-full bg-white border border-silver/60 rounded-xl px-3 py-2 text-xs font-bold text-charcoal focus:outline-none focus:border-primary/40 transition-colors"
                  >
                    <option value="" disabled>Select a driver...</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.user}>
                        {d.full_name} ({d.vehicle_type} - {d.vehicle_plate})
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-col gap-1.5 mt-2 border-t border-silver/30 pt-2">
                    <span className="text-[10px] font-bold text-charcoal/50">Backup Drivers (Emergency):</span>
                    <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                      {drivers
                        .filter((d) => d.user !== selectedRoute.driver)
                        .map((d) => {
                          const isChecked = selectedRoute.additional_drivers?.includes(d.user) || false;
                          return (
                            <label key={d.id} className="flex items-center gap-2 text-xs font-semibold text-charcoal cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={async (e) => {
                                  let newAdditional = [...(selectedRoute.additional_drivers || [])];
                                  if (e.target.checked) {
                                    newAdditional.push(d.user);
                                  } else {
                                    newAdditional = newAdditional.filter((id) => id !== d.user);
                                  }
                                  try {
                                    await deliveryApi.updateRoute(selectedRoute.id, { additional_drivers: newAdditional });
                                    onRefresh?.();
                                  } catch (err) {
                                    alert("Failed to update backup drivers: " + (err as any).message);
                                  }
                                }}
                                className="rounded text-primary focus:ring-primary/30 w-3.5 h-3.5 border-silver/60"
                              />
                              <span>{d.full_name}</span>
                            </label>
                          );
                        })}
                      {drivers.filter((d) => d.user !== selectedRoute.driver).length === 0 && (
                        <span className="text-[10px] text-charcoal/40 font-medium">No backup drivers available</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-charcoal">
                        {selectedRoute.driver_name || "Unassigned"}
                      </div>
                      {(() => {
                        const drvObj = drivers.find((d) => d.user === selectedRoute.driver);
                        if (drvObj) {
                          return (
                            <div className="text-[10px] font-semibold text-charcoal/50 mt-0.5">
                              {drvObj.vehicle_type} — {drvObj.vehicle_plate}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {selectedRoute.additional_driver_names && selectedRoute.additional_driver_names.length > 0 && (
                    <div className="mt-2 border-t border-silver/30 pt-2">
                      <span className="text-[9px] font-black uppercase text-charcoal/45 tracking-wider block mb-1">
                        Backup Drivers
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedRoute.additional_driver_names.map((name, i) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[10px] font-bold rounded-lg flex items-center gap-1">
                            <User className="w-2.5 h-2.5 text-amber-600" />
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trip status banner */}
            <div className={`p-4 border rounded-2xl mb-4 flex flex-col gap-1.5 ${getTripStatusLabel(selectedRoute).style}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  {getTripStatusLabel(selectedRoute).text}
                </span>
                <span className="text-[9px] opacity-75 font-semibold">
                  {selectedRoute.stops.length} Stops
                </span>
              </div>
              
              {/* Trip Time Audit Details */}
              <div className="text-[10px] font-semibold opacity-85 space-y-0.5 mt-1 border-t border-current/15 pt-2">
                {selectedRoute.started_at ? (
                  <div>Started: {new Date(selectedRoute.started_at).toLocaleTimeString()}</div>
                ) : (
                  <div>Rider has not tapped Start Trip yet.</div>
                )}
                {selectedRoute.completed_at && (
                  <div>Ended: {new Date(selectedRoute.completed_at).toLocaleTimeString()}</div>
                )}
              </div>

              {/* Admin Trip Actions */}
              <div className="mt-3 pt-2 border-t border-current/15 flex gap-2">
                {!(selectedRoute.status === "started" || selectedRoute.status === "in_progress") ? (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await deliveryApi.startTrip(selectedRoute.id);
                        onRefresh?.();
                      } catch (err) {
                        alert("Failed to start trip: " + (err as any).message);
                      }
                    }}
                    className="flex-1 bg-white hover:bg-silver/10 text-charcoal py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-current/25 shadow-2xs cursor-pointer text-center"
                  >
                    Start Trip
                  </button>
                ) : (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await deliveryApi.completeTrip(selectedRoute.id);
                        onRefresh?.();
                      } catch (err) {
                        alert("Failed to complete trip: " + (err as any).message);
                      }
                    }}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-2xs cursor-pointer text-center border border-rose-700"
                  >
                    End Trip
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable list of stops */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
              {selectedRoute.stops.map((stop) => {
                const isSelected = selectedStopId === stop.id;
                const isDelivered = stop.order_status === "delivered";
                
                return (
                  <div
                    key={stop.id}
                    onClick={() => {
                      setSelectedStopId(stop.id);
                      setIsManualPan(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center gap-3 ${
                      isSelected
                        ? "bg-primary border-primary text-white shadow-md shadow-primary/10"
                        : "bg-silver/5 border-silver/45 hover:bg-silver/10"
                    }`}
                  >
                    {/* Index circle */}
                    <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : isDelivered
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-silver/40 text-charcoal/50"
                    }`}>
                      {stop.sequence_number}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold truncate">
                          {stop.customer_name}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border shrink-0 ${
                          isSelected 
                            ? "bg-white/20 border-white/10 text-white" 
                            : getStatusBadgeStyle(stop.order_status)
                        }`}>
                          {stop.order_status || "Pending"}
                        </span>
                      </div>
                      <p className={`text-[10px] font-semibold mt-0.5 truncate ${
                        isSelected ? "text-white/70" : "text-charcoal/45"
                      }`}>
                        {stop.address}
                      </p>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? "translate-x-0.5" : "text-charcoal/30"
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Render standard Route List sidebar when no Route is selected */
          <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
            {/* Search Header */}
            <div className="bg-white p-4 rounded-3xl border border-silver/50 shadow-sm shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
                <input
                  type="text"
                  placeholder="Search routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-silver/10 border border-silver/30 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all text-charcoal"
                />
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-white rounded-3xl border border-silver/50 animate-pulse"></div>
                ))
              ) : sortedRoutes.map(route => (
                <div 
                  key={route.id} 
                  onClick={() => {
                    setSelectedRouteId(route.id);
                    setIsManualPan(false);
                  }}
                  className="p-5 rounded-3xl border transition-all cursor-pointer bg-white border-silver/50 shadow-sm hover:border-primary/30 group/item text-left"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-xl bg-primary/5 group-hover/item:bg-primary/10 transition-colors">
                      <Navigation className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {/* Premium Date Card/Badge */}
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                        getFriendlyDateStyle(route.delivery_date)
                      }`}>
                        {getFriendlyDateLabel(route.delivery_date)}
                      </span>

                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                        getTripStatusLabel(route).style
                      }`}>
                        {getTripStatusLabel(route).text}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black truncate flex-1 text-charcoal">{route.name}</h4>
                    {route.is_locked && (
                      <Lock className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5 opacity-60">
                       <User className="w-3 h-3" />
                       <span className="text-[10px] font-bold text-charcoal">{route.driver_name}</span>
                    </div>
                    <div className="w-1 h-1 bg-charcoal opacity-20 rounded-full"></div>
                    <span className="text-[10px] font-bold text-charcoal/60">{route.stops.length} Stops</span>
                  </div>
                  
                  {/* Bottle dispatch requirements */}
                  {((route.dispatch_bottles_1L && route.dispatch_bottles_1L > 0) || 
                    (route.dispatch_bottles_500ml && route.dispatch_bottles_500ml > 0)) && (
                    <div className="mt-3 pt-3 border-t border-silver/40 flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-charcoal/40 mr-1">
                        To Carry:
                      </span>
                      {route.dispatch_bottles_1L && route.dispatch_bottles_1L > 0 && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-xl border bg-emerald-50 border-emerald-100/50 text-emerald-700 shadow-3xs">
                          1L Bottle: {route.dispatch_bottles_1L}
                        </span>
                      )}
                      {route.dispatch_bottles_500ml && route.dispatch_bottles_500ml > 0 && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-xl border bg-blue-50 border-blue-100/50 text-blue-700 shadow-3xs">
                          500ml Bottle: {route.dispatch_bottles_500ml}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {!isLoading && filteredRoutes.length === 0 && (
                <div className="p-8 text-center bg-white rounded-3xl border border-silver/50 shadow-sm">
                   <Navigation className="w-10 h-10 text-charcoal/10 mx-auto mb-2" />
                   <p className="text-xs font-bold text-charcoal/30">No routes found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Area: Interactive Map + Sliding Detailed Stop Inspector Card */}
      <div 
        ref={mapRef}
        className="flex-1 bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden relative group/map flex flex-col md:flex-row min-w-0"
      >
        <div
          ref={setMapContainerNode}
          className={`flex-1 min-w-0 relative bg-[#EAE8E3] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Tile Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
             <div style={{ width: VIEWPORT_W, height: VIEWPORT_H, position: 'relative' }}>
                {osmTiles.map(tile => (
                  <img 
                    key={tile.key} 
                    src={tile.url} 
                    alt="" 
                    className="absolute w-[256px] h-[256px] object-cover transition-opacity duration-300 select-none"
                    style={{ left: tile.left, top: tile.top }}
                  />
                ))}
             </div>
          </div>

          {/* SVG Overlay for Routes & Markers */}
          <div className="absolute inset-0 pointer-events-none">
            <svg width={VIEWPORT_W} height={VIEWPORT_H} viewBox={`0 0 ${VIEWPORT_W} ${VIEWPORT_H}`} className="pointer-events-none">
              {/* Draw Selected Route Path */}
              {selectedRoute && selectedRoute.stops.length > 1 && (
                <polyline
                  points={selectedRoute.stops.map(s => {
                    const pt = getOsmSvgPixel(s.latitude, s.longitude);
                    return `${pt.x},${pt.y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8,8"
                  className="opacity-60"
                />
              )}

              {/* Draw All Stops */}
              {selectedRoute?.stops.map((stop) => {
                const pt = getOsmSvgPixel(stop.latitude, stop.longitude);
                const isDelivered = stop.order_status === "delivered";
                const isCurrentStop = selectedStopId === stop.id;
                const markerColor = isDelivered ? "#10B981" : "#F59E0B";
                
                return (
                  <g 
                    key={stop.id} 
                    className="transition-all duration-300 cursor-pointer pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStopId(stop.id);
                      setIsManualPan(false);
                    }}
                  >
                    {/* Pulsing ring for current sequence */}
                    <circle cx={pt.x} cy={pt.y} r={isCurrentStop ? "16" : "12"} fill={markerColor} className={`opacity-20 ${isDelivered ? "" : "animate-pulse"}`} />
                    
                    {/* Stop Pin */}
                    <circle cx={pt.x} cy={pt.y} r={isCurrentStop ? "10" : "8"} fill="white" stroke={markerColor} strokeWidth={isCurrentStop ? "3.5" : "2"} className="shadow-md" />
                    
                    {/* Sequence Number */}
                    <text x={pt.x} y={pt.y + 3} textAnchor="middle" fontSize={isCurrentStop ? "9" : "8"} fontWeight="900" fill={markerColor}>
                      {stop.sequence_number}
                    </text>
 
                    {/* Tooltip */}
                    <foreignObject x={pt.x + 12} y={pt.y - 12} width="140" height="24" className="pointer-events-none">
                       <div className={`text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg border w-fit whitespace-nowrap ${
                         isCurrentStop 
                           ? "bg-primary border-primary/20 scale-105" 
                           : isDelivered 
                           ? "bg-emerald-600 border-emerald-500" 
                           : "bg-charcoal border-white/10"
                       }`}>
                          {stop.customer_name} {isDelivered && "✓"}
                       </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <div className="flex flex-col bg-white/90 backdrop-blur-md border border-silver/60 rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => setZoom((z) => Math.min(18, z + 1))}
              className="p-2.5 hover:bg-silver/20 transition-colors border-b border-silver/30 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4 text-charcoal" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(10, z - 1))}
              className="p-2.5 hover:bg-silver/20 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4 text-charcoal" />
            </button>
          </div>
          
          {isManualPan && (
             <button 
                onClick={() => setIsManualPan(false)}
                className="p-2.5 bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center cursor-pointer"
                title="Recenter to active route"
             >
                <CheckCircle2 className="w-4 h-4" />
             </button>
          )}
        </div>

        {/* Sliding Stop Details Panel (Inspector) */}
        {selectedStop && (
          <div className="w-full md:w-[360px] bg-white border-t md:border-t-0 md:border-l border-silver/50 flex flex-col shrink-0 min-h-0 overflow-hidden relative z-20 animate-in slide-in-from-right-10 duration-300">
            {/* Stop Header Info */}
            <div className="p-5 border-b border-silver/30 flex justify-between items-start bg-silver/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-primary to-sage text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">
                  {selectedStop.customer_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-charcoal leading-none">
                    {selectedStop.customer_name}
                  </h3>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-charcoal/40 block mt-1">
                    Stop #{selectedStop.sequence_number}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStopId(null)}
                className="p-1.5 hover:bg-silver/20 rounded-xl transition-colors cursor-pointer text-charcoal/40"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scrollable details wrapper */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
              
              {/* Contact attributes */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">
                  Customer Contacts
                </h4>
                
                {selectedStop.customer_phone && (
                  <a
                    href={`tel:${selectedStop.customer_phone}`}
                    className="flex items-center gap-3 p-3 bg-silver/5 border border-silver/45 rounded-2xl hover:bg-silver/10 transition-colors text-xs font-bold text-charcoal"
                  >
                    <Phone className="w-4 h-4 text-primary/60 shrink-0" />
                    <span>{selectedStop.customer_phone}</span>
                  </a>
                )}

                {selectedStop.customer_email && (
                  <a
                    href={`mailto:${selectedStop.customer_email}`}
                    className="flex items-center gap-3 p-3 bg-silver/5 border border-silver/45 rounded-2xl hover:bg-silver/10 transition-colors text-xs font-bold text-charcoal"
                  >
                    <Mail className="w-4 h-4 text-primary/60 shrink-0" />
                    <span className="truncate">{selectedStop.customer_email}</span>
                  </a>
                )}

                {selectedStop.customer_company && (
                  <div className="flex items-center gap-3 p-3 bg-silver/5 border border-silver/45 rounded-2xl text-xs font-bold text-charcoal">
                    <Building2 className="w-4 h-4 text-primary/60 shrink-0" />
                    <span>{selectedStop.customer_company}</span>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-silver/5 border border-silver/45 rounded-2xl text-xs font-bold text-charcoal">
                  <MapPin className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
                  <div>
                    <span className="block leading-tight">{selectedStop.address}</span>
                    {selectedStop.customer_zone_name && (
                      <span className="inline-block mt-1 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                        Zone: {selectedStop.customer_zone_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Progress details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">
                  Delivery Details
                </h4>

                <div className="p-4 bg-silver/10 border border-silver/40 rounded-3xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider">
                      Status:
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      getStatusBadgeStyle(selectedStop.order_status)
                    }`}>
                      {selectedStop.order_status || "Pending"}
                    </span>
                  </div>

                  {/* Admin Order Status Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-silver/20">
                    <button
                      onClick={() => openDeliveryForm(selectedStop)}
                      disabled={selectedStop.order_status === "delivered"}
                      className={`py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer border ${
                        selectedStop.order_status === "delivered"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600/50 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-3xs border-emerald-700"
                      }`}
                    >
                      Delivered
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deliveryApi.updateOrderStatus(selectedStop.order, "undelivered");
                          onRefresh?.();
                        } catch (err) {
                          alert("Failed to mark as undelivered: " + (err as any).message);
                        }
                      }}
                      disabled={selectedStop.order_status === "undelivered"}
                      className={`py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer border ${
                        selectedStop.order_status === "undelivered"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-600/50 cursor-not-allowed"
                          : "bg-rose-600 hover:bg-rose-700 text-white shadow-3xs border-rose-700"
                      }`}
                    >
                      Undelivered
                    </button>
                  </div>

                  {selectedStop.delivered_at && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider">
                        Delivered At:
                      </span>
                      <span className="font-bold text-charcoal">
                        {new Date(selectedStop.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {selectedStop.order_notes && (
                    <div className="space-y-1.5 border-t border-silver/35 pt-3 text-xs">
                      <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">
                        Driver Special Notes:
                      </span>
                      <p className="text-charcoal/60 font-semibold italic bg-white p-2.5 rounded-xl border border-silver/40">
                        "{selectedStop.order_notes}"
                      </p>
                    </div>
                  )}

                  {/* Proof of Delivery Image (POD) */}
                  {selectedStop.pod_image && (
                    <div className="space-y-2 border-t border-silver/35 pt-3">
                      <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">
                        Proof of Delivery (POD):
                      </span>
                      <div 
                        onClick={() => selectedStop.pod_image && setZoomImage(selectedStop.pod_image)}
                        className="w-full h-32 bg-charcoal/5 border border-silver/45 rounded-2xl overflow-hidden relative cursor-zoom-in group/pod"
                      >
                        <img 
                          src={selectedStop.pod_image} 
                          alt="POD Upload" 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-350"
                        />
                        <div className="absolute inset-0 bg-charcoal/40 flex items-center justify-center opacity-0 group-hover/pod:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Zoom Image
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items list */}
              {selectedStop.product_list && selectedStop.product_list.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-0.5">
                    <h4 className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">
                      Cargo Items ({stopTotalCargoCount(selectedStop)} Units)
                    </h4>
                    {selectedStop.order_total && (
                      <span className="text-xs font-black text-primary">
                        Total: ₹{selectedStop.order_total}
                      </span>
                    )}
                  </div>

                  <div className="bg-white border border-silver/45 rounded-3xl overflow-hidden shadow-2xs">
                    {selectedStop.product_list.map((item, idx) => (
                      <div 
                        key={item.product_id}
                        className={`p-3 flex items-center justify-between text-xs font-bold text-charcoal ${
                          idx > 0 ? "border-t border-silver/30" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="truncate block">{item.product_name}</span>
                          <span className="text-[10px] font-bold text-charcoal/30">
                            Rate: ₹{item.unit_price} / {item.unit}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg border border-primary/10">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subscription items */}
              {selectedStop.subscription_details ? (
                <div className="space-y-3 border-t border-silver/30 pt-5">
                  <div className="flex items-center gap-2 px-0.5">
                    <Layers className="w-4 h-4 text-primary" />
                    <h4 className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">
                      Subscribed Packages
                    </h4>
                  </div>

                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-3xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] font-black text-primary/70 uppercase">Frequency:</span>
                      <span className="font-black text-primary uppercase tracking-wider text-[10px]">
                        {selectedStop.subscription_details.frequency}
                      </span>
                    </div>

                    {selectedStop.subscription_details.special_instructions && (
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] font-black text-primary/70 uppercase block">Instructions:</span>
                        <p className="text-charcoal/70 font-semibold italic text-[11px]">
                          "{selectedStop.subscription_details.special_instructions}"
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 border-t border-primary/10 pt-3">
                      <span className="text-[10px] font-black text-primary/70 uppercase block">Scheduled Repeat Items:</span>
                      <div className="space-y-1.5">
                        {selectedStop.subscription_details.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs font-bold text-charcoal">
                            <span>{item.product_name}</span>
                            <span className="text-charcoal/50 text-[10px]">Qty: {item.quantity} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/70 border border-amber-200/50 text-amber-800 text-[10px] font-semibold rounded-2xl flex items-center gap-2 border-t border-silver/30 pt-4">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>One-time / Ad-hoc customer order (no recurring subscription).</span>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Proof of Delivery image zoom overlay modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-charcoal/75 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative max-w-4xl max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 p-2 bg-charcoal/60 hover:bg-charcoal/80 text-white rounded-full transition-colors cursor-pointer border border-white/10 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={zoomImage} 
              alt="Zoomed POD" 
              className="w-full h-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Bottle Reconciliation Modal */}
      {showDeliveryModal && selectedStop && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-charcoal/75 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-6 relative animate-in zoom-in-95 duration-300 border border-silver/40 flex flex-col gap-5 text-left">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-silver/30 pb-3">
              <div>
                <h3 className="text-base font-black text-charcoal tracking-tight flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-primary" />
                  Confirm Delivery & Bottles
                </h3>
                <p className="text-[10px] text-charcoal/40 font-bold uppercase mt-0.5">
                  Stop #{selectedStop.sequence_number} — {selectedStop.customer_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeliveryModal(false)}
                className="p-1.5 hover:bg-silver/20 text-charcoal/50 hover:text-charcoal rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold text-charcoal/60">
                Please confirm the quantity of returnable assets issued and empty bottles collected for this stop:
              </p>

              {/* Delivered (Full Bottle) */}
              <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Delivered (Full)</span>
                  <span className="text-[10px] font-bold text-charcoal/40">Total bottles handed over</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBottlesIssued(val => Math.max(0, val - 1))}
                    className="p-1 bg-white hover:bg-emerald-50 border border-silver/45 rounded-lg text-charcoal shadow-3xs transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-black text-charcoal min-w-[20px] text-center">{bottlesIssued}</span>
                  <button
                    type="button"
                    onClick={() => setBottlesIssued(val => val + 1)}
                    className="p-1 bg-white hover:bg-emerald-50 border border-silver/45 rounded-lg text-charcoal shadow-3xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Returned (Empty Bottle) */}
              <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">Returned (Empty)</span>
                  <span className="text-[10px] font-bold text-charcoal/40">Empty bottles collected</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBottlesReturned(val => Math.max(0, val - 1))}
                    className="p-1 bg-white hover:bg-blue-50 border border-silver/45 rounded-lg text-charcoal shadow-3xs transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-black text-charcoal min-w-[20px] text-center">{bottlesReturned}</span>
                  <button
                    type="button"
                    onClick={() => setBottlesReturned(val => val + 1)}
                    className="p-1 bg-white hover:bg-blue-50 border border-silver/45 rounded-lg text-charcoal shadow-3xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 border-t border-silver/30 pt-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowDeliveryModal(false)}
                className="flex-1 py-2 px-3 border border-silver/45 hover:bg-silver/10 rounded-xl text-xs font-black uppercase tracking-wider text-charcoal transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDelivery}
                disabled={isSubmittingDelivery}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all border border-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
              >
                {isSubmittingDelivery ? "Submitting..." : "Submit Delivery"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default RouteTab;
