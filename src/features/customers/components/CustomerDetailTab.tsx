import React, { useState, useMemo, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Search,
  Navigation,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Calendar,
  List as ListIcon,
  Truck,
} from "lucide-react";
import type { Customer } from "./types";

interface CustomerDetailTabProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  onBack: () => void;
  onManageProfile: (id: string) => void;
}

import { customerApi } from "../api/customerApi";
import type { Order } from "./types";

const CustomerDetailTab: React.FC<CustomerDetailTabProps> = ({
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  onManageProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalTab, setModalTab] = useState<"info" | "calendar" | "order">(
    "info",
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // Map State
  const [zoom, setZoom] = useState<number>(14);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 21.1458,
    lng: 79.0882,
  });
  const [isManualPan, setIsManualPan] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filtered customers for the list
  const filteredCustomers = useMemo(() => {
    const searchLower = (searchQuery || "").toLowerCase().trim();
    const digitQuery = (searchQuery || "").replace(/\D/g, "");
    return (customers || []).filter((c) => {
      if (!c) return false;
      const nameMatch = c.name ? c.name.toLowerCase().includes(searchLower) : false;
      const emailMatch = c.email ? c.email.toLowerCase().includes(searchLower) : false;

      const rawPhone = c.phone ? String(c.phone) : "";
      const cleanPhone = rawPhone.replace(/\D/g, "");
      const phoneMatch =
        rawPhone.toLowerCase().includes(searchLower) ||
        (digitQuery.length > 0 && cleanPhone.includes(digitQuery));

      return nameMatch || emailMatch || phoneMatch;
    });
  }, [customers, searchQuery]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Fetch orders when tab changes to 'order' or 'calendar'
  useEffect(() => {
    if (
      (modalTab === "order" || modalTab === "calendar") &&
      selectedCustomerId
    ) {
      const fetchOrders = async () => {
        setIsOrdersLoading(true);
        try {
          const data =
            await customerApi.getOrdersByCustomerId(selectedCustomerId);
          setOrders(data);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        } finally {
          setIsOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [modalTab, selectedCustomerId]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      delivered: "#10B981", // Green
      undelivered: "#EF4444", // Red
      in_transit: "#F59E0B", // Yellow/Amber
      pending: "#94A3B8", // Grey
      scheduled: "#3B82F6", // Blue
      vacation: "#F97316", // Orange
      skipped: "#4B5563", // Dark grey
      off_day: "#E5E7EB", // Light grey
    };
    // fallback for API statuses like 'confirmed'
    if (status === "confirmed") return map.scheduled;
    return map[status] || map.pending;
  };

  // Sync map center with selected customer
  useEffect(() => {
    if (
      selectedCustomer &&
      selectedCustomer.latitude &&
      selectedCustomer.longitude &&
      !isManualPan
    ) {
      setMapCenter({
        lat: selectedCustomer.latitude,
        lng: selectedCustomer.longitude,
      });
    } else if (!selectedCustomerId && customers.length > 0 && !isManualPan) {
      // Default to first customer with coordinates if none selected
      const firstWithCoords = customers.find((c) => c.latitude && c.longitude);
      if (firstWithCoords) {
        setMapCenter({
          lat: firstWithCoords.latitude!,
          lng: firstWithCoords.longitude!,
        });
      }
    }
  }, [selectedCustomerId, selectedCustomer, isManualPan, customers]);

  const mapRef = React.useRef<HTMLDivElement>(null);
  const hasMovedDuringDragRef = React.useRef(false);
  const [mapContainerNode, setMapContainerNode] = useState<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  React.useEffect(() => {
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
          width: entry.contentRect.width,
          height: entry.contentRect.height,
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
  }, [centerTxFloat, centerTyFloat, zoom]);

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasMovedDuringDragRef.current = false;
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsManualPan(true);

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      hasMovedDuringDragRef.current = true;
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });

    const getTileCount = (z: number) => Math.pow(2, z);
    const currentTx = ((mapCenter.lng + 180) / 360) * getTileCount(zoom);
    const latRad = (mapCenter.lat * Math.PI) / 180;
    const currentTy =
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      getTileCount(zoom);

    const newTx = currentTx - deltaX / 256;
    const newTy = currentTy - deltaY / 256;

    const newLng = (newTx / getTileCount(zoom)) * 360 - 180;
    const M = Math.PI * (1 - (2 * newTy) / getTileCount(zoom));
    const newLat =
      (Math.atan(0.5 * (Math.exp(M) - Math.exp(-M))) * 180) / Math.PI;

    setMapCenter({ lat: newLat, lng: newLng });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] lg:h-[calc(100vh-280px)] min-h-[700px] lg:min-h-[600px] animate-in fade-in duration-500">
      {/* Left Sidebar: Customer List */}
      <div className="w-full lg:w-1/4 xl:w-1/5 h-[300px] lg:h-full flex flex-col bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b border-silver/30 bg-silver/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-silver/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {filteredCustomers.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCustomerId(c.id);
                setIsManualPan(false);
              }}
              className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between group ${
                selectedCustomerId === c.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "hover:bg-silver/10 text-charcoal"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                    selectedCustomerId === c.id
                      ? "bg-white/20 text-white"
                      : "bg-cream text-primary border border-primary/5"
                  }`}
                >
                  {c.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">{c.name}</p>
                  <p
                    className={`text-[10px] font-medium uppercase tracking-wider ${
                      selectedCustomerId === c.id
                        ? "text-white/60"
                        : "text-charcoal/40"
                    }`}
                  >
                    {c.phone}
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${selectedCustomerId === c.id ? "translate-x-1" : "opacity-0 group-hover:opacity-40"}`}
              />
            </button>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center">
              <User className="w-10 h-10 text-charcoal/10 mx-auto mb-2" />
              <p className="text-sm font-bold text-charcoal/30">
                No customers found
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        ref={mapRef}
        className="flex-1 bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden relative group/map"
      >
        {/* Map Container */}
        <div
          ref={setMapContainerNode}
          className={`absolute inset-0 bg-[#EAE8E3] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => {
            if (!hasMovedDuringDragRef.current) {
              setSelectedCustomerId(null);
            }
          }}
        >
          {/* Tiles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            <div
              style={{
                width: VIEWPORT_W,
                height: VIEWPORT_H,
                position: "relative",
              }}
            >
              {osmTiles.map((tile) => (
                <img
                  key={tile.key}
                  src={tile.url}
                  alt=""
                  className="absolute w-[256px] h-[256px] object-cover transition-opacity duration-300 select-none"
                  style={{ left: `${tile.left}px`, top: `${tile.top}px` }}
                />
              ))}
            </div>
          </div>

          {/* SVG Overlays (Pins) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            <svg
              width={VIEWPORT_W}
              height={VIEWPORT_H}
              viewBox={`0 0 ${VIEWPORT_W} ${VIEWPORT_H}`}
              className="pointer-events-none"
            >
              {customers.map((c) => {
                if (!c.latitude || !c.longitude) return null;
                const pt = getOsmSvgPixel(c.latitude, c.longitude);
                const isSelected = c.id === selectedCustomerId;

                return (
                  <g
                    key={c.id}
                    className="cursor-pointer pointer-events-auto transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCustomerId(c.id);
                      setIsManualPan(false);
                    }}
                  >
                    {/* Ring animation for selected */}
                    {isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="24"
                        fill="#F59E0B"
                        className="opacity-20 animate-ping"
                        style={{
                          transformOrigin: "center",
                          transformBox: "fill-box",
                        }}
                      />
                    )}

                    {/* Pin Shadow */}
                    <circle
                      cx={pt.x}
                      cy={pt.y + 2}
                      r={isSelected ? "12" : "8"}
                      fill="black"
                      className="opacity-10"
                    />

                    {/* Pin Body */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? "10" : "7"}
                      fill={
                        isSelected
                          ? "#F59E0B"
                          : c.is_active
                            ? "#10B981"
                            : "#94A3B8"
                      }
                      stroke="white"
                      strokeWidth="2"
                    />

                    {/* Tooltip on hover/selected */}
                    {isSelected && (
                      <foreignObject
                        x={pt.x + 15}
                        y={pt.y - 20}
                        width="160"
                        height="40"
                      >
                        <div className="bg-charcoal text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl border border-white/10 w-fit whitespace-nowrap">
                          {c.name}
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <div className="flex flex-col bg-white/90 backdrop-blur-md border border-silver/60 rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => setZoom((z) => Math.min(18, z + 1))}
              className="p-2.5 hover:bg-silver/20 transition-colors border-b border-silver/30"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-charcoal" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(10, z - 1))}
              className="p-2.5 hover:bg-silver/20 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-charcoal" />
            </button>
          </div>

          {isManualPan && (
            <button
              onClick={() => setIsManualPan(false)}
              className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all animate-in fade-in slide-in-from-right-4"
              title="Recenter"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom Banner */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 shadow-sm w-fit mx-auto text-[10px] font-black text-charcoal/40 uppercase tracking-widest flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Active
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#94A3B8]"></div> Inactive
            </div>
            <div className="w-px h-3 bg-silver/50"></div>
            <span>
              {customers.filter((c) => c.latitude && c.longitude).length} mapped
              houses
            </span>
          </div>
        </div>

        {/* Detailed Info Modal (Bottom Right) */}
        {selectedCustomer && (
          <div className="absolute bottom-6 right-6 w-[360px] max-w-[calc(100%-48px)] bg-white/95 backdrop-blur-xl rounded-[32px] border border-silver/50 shadow-2xl z-30 animate-in slide-in-from-right-8 duration-500 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-cream rounded-2xl flex items-center justify-center font-black text-2xl text-primary border border-primary/10 shadow-sm">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-charcoal text-lg leading-tight">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mt-1">
                    {selectedCustomer.company || "Private Partner"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-2 hover:bg-silver/20 rounded-xl transition-all text-charcoal/20 hover:text-charcoal"
              >
                <Navigation className="w-5 h-5 rotate-45" />{" "}
                {/* Close-like icon */}
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 flex items-center gap-6 border-b border-silver/30 overflow-x-auto no-scrollbar">
              {[
                { id: "info", label: "Basic Info", icon: User },
                { id: "calendar", label: "Calendar", icon: Calendar },
                { id: "order", label: "Orders", icon: ListIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id as any)}
                  className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex items-center gap-2 ${
                    modalTab === tab.id
                      ? "text-primary"
                      : "text-charcoal/40 hover:text-charcoal"
                  }`}
                >
                  <tab.icon
                    className={`w-3.5 h-3.5 ${modalTab === tab.id ? "text-primary" : "text-charcoal/30"}`}
                  />
                  {tab.label}
                  {modalTab === tab.id && (
                    <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6 overflow-y-auto custom-scrollbar max-h-[400px]">
              {modalTab === "info" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Status Badge */}
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        selectedCustomer.is_active
                          ? "bg-sage/10 text-primary border-primary/10"
                          : "bg-red-50 text-red-500 border-red-100"
                      }`}
                    >
                      {selectedCustomer.is_active
                        ? "Active Member"
                        : "Inactive Account"}
                    </span>
                    <span className="px-3 py-1 bg-silver/10 border border-silver/30 rounded-full text-[9px] font-black text-charcoal/40 uppercase tracking-widest">
                      ID: {selectedCustomer.id.split("-")[0]}...
                    </span>
                  </div>

                  {/* Information Sections */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-silver/5 rounded-2xl border border-silver/30">
                      <h4 className="text-[9px] font-black text-charcoal/30 uppercase tracking-[0.2em] mb-3">
                        Contact Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-primary/40" />
                          <span className="text-xs font-bold text-charcoal">
                            {selectedCustomer.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-primary/40" />
                          <span className="text-xs font-bold text-charcoal">
                            {selectedCustomer.phone}
                          </span>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-primary/40 mt-0.5" />
                          <span className="text-xs font-bold text-charcoal leading-relaxed">
                            {selectedCustomer.address || "No address provided"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedCustomer.dashboard && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                          <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest mb-1">
                            Subscriptions
                          </p>
                          <p className="text-xl font-black text-primary">
                            {selectedCustomer.dashboard.active_subscriptions}
                          </p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                          <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest mb-1">
                            Balance
                          </p>
                          <p className="text-xl font-black text-amber-600">
                            ₹{selectedCustomer.dashboard.pending_balance}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-silver/30 flex items-center justify-between">
                    <div className="text-[9px] font-bold text-charcoal/40 uppercase">
                      Member Since{" "}
                      {new Date(selectedCustomer.created_at).toLocaleDateString(
                        "en-IN",
                        { month: "short", year: "numeric" },
                      )}
                    </div>
                    <button
                      onClick={() => onManageProfile(selectedCustomer.id)}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline cursor-pointer"
                    >
                      Manage Profile &rarr;
                    </button>
                  </div>
                </div>
              )}

              {modalTab === "calendar" && (
                <div className="animate-in fade-in duration-300">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-charcoal">
                      {currentMonth.toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentMonth(
                            new Date(
                              currentMonth.setMonth(
                                currentMonth.getMonth() - 1,
                              ),
                            ),
                          )
                        }
                        className="p-1.5 hover:bg-silver/20 rounded-lg text-charcoal/40 hover:text-charcoal transition-all"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentMonth(
                            new Date(
                              currentMonth.setMonth(
                                currentMonth.getMonth() + 1,
                              ),
                            ),
                          )
                        }
                        className="p-1.5 hover:bg-silver/20 rounded-lg text-charcoal/40 hover:text-charcoal transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-6">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                      <div
                        key={day}
                        className="text-[10px] font-black text-charcoal/30 pb-2"
                      >
                        {day}
                      </div>
                    ))}
                    {(() => {
                      const days = [];
                      const start = new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        1,
                      );
                      const end = new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        0,
                      );

                      // Padding for start of month
                      for (let i = 0; i < start.getDay(); i++) {
                        days.push(
                          <div key={`pad-${i}`} className="h-10"></div>,
                        );
                      }

                      for (let d = 1; d <= end.getDate(); d++) {
                        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                        const order = orders.find(
                          (o) => o.scheduled_delivery_date === dateStr,
                        );
                        const isToday =
                          new Date().toDateString() ===
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth(),
                            d,
                          ).toDateString();
                        const statusColor = order
                          ? getStatusColor(order.status)
                          : null;

                        days.push(
                          <div
                            key={d}
                            className="h-10 flex items-center justify-center relative rounded-lg"
                            style={
                              statusColor
                                ? { backgroundColor: `${statusColor}15` }
                                : {}
                            }
                          >
                            <span
                              className={`text-[11px] font-bold z-10 ${isToday ? "bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full shadow-xs" : ""}`}
                              style={
                                !isToday && statusColor
                                  ? { color: statusColor }
                                  : {}
                              }
                            >
                              {d}
                            </span>
                          </div>,
                        );
                      }
                      return days;
                    })()}
                  </div>

                  {/* Legend */}
                  <div className="p-4 bg-silver/5 rounded-2xl border border-silver/30">
                    <h5 className="text-[9px] font-black text-charcoal/30 uppercase tracking-widest mb-3 text-center">
                      Status Legend
                    </h5>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      {[
                        { label: "Delivered", color: "#10B981" },
                        { label: "Undelivered", color: "#EF4444" },
                        { label: "In Transit", color: "#F59E0B" },
                        { label: "Pending", color: "#94A3B8" },
                        { label: "Scheduled", color: "#3B82F6" },
                        { label: "Vacation", color: "#F97316" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-[10px] font-bold text-charcoal/60">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {modalTab === "order" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">
                      Recent Transactions
                    </h4>
                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg">
                      {orders.length} Orders
                    </span>
                  </div>

                  {isOrdersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-24 bg-silver/10 rounded-2xl animate-pulse"
                        ></div>
                      ))}
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 bg-white border border-silver/50 rounded-2xl shadow-sm hover:border-primary/20 transition-all group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-xs font-black text-charcoal tracking-tight">
                                Order #{order.id.split("-")[0].toUpperCase()}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    order.status === "confirmed"
                                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                      : order.status === "pending"
                                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                                        : "bg-silver/10 text-charcoal/40 border border-silver/20"
                                  }`}
                                >
                                  {order.status_display}
                                </span>
                                <span className="text-[9px] font-bold text-charcoal/30 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />{" "}
                                  {new Date(
                                    order.scheduled_delivery_date,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </span>
                                <span className="text-[9px] font-bold text-charcoal/30 flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-primary" />{" "}
                                  {order.driver_name || "Unassigned"}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm font-black text-primary">
                              ₹{order.total}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            {(order.items || []).map((item) => (
                              <div
                                key={item.id}
                                className="px-2 py-1 bg-silver/5 rounded-lg border border-silver/30 text-[9px] font-bold text-charcoal/60 whitespace-nowrap"
                              >
                                {item.product_name}{" "}
                                <span className="text-primary">
                                  x{item.quantity}
                                </span>
                              </div>
                            ))}
                            {(order.items || []).length === 0 && (
                              <span className="text-[9px] font-medium text-charcoal/30 italic">
                                No items listed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-silver/5 rounded-3xl border border-dashed border-silver/50">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <ListIcon className="w-6 h-6 text-charcoal/10" />
                      </div>
                      <p className="text-xs font-bold text-charcoal/40">
                        No orders found for this customer
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailTab;
