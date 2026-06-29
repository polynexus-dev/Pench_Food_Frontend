import React, { useState, useEffect } from "react";
import {
  Boxes,
  Truck,
  Bike,
  UserCheck,
  AlertOctagon,
  ArrowRightLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  AlertCircle,
  Warehouse,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Package,
  ArrowRight,
  BarChart3,
  Activity,
  CircleDot,
} from "lucide-react";
import type { BottleTrackingSummaryResponse, BottleTrackingHistoryEntry, BottleType } from "./types";
import { inventoryApi } from "../api/inventoryApi";
import { useNotificationStore } from "../../../store/useNotificationStore";
import { SaveBottleTypeModal } from "./modals/SaveBottleTypeModal";
import DeleteBottleTypeModal from "./modals/DeleteBottleTypeModal";

interface InventoryBottleTrackingTabProps {
  summary: BottleTrackingSummaryResponse | null;
  isLoading: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedWarehouseId: string;
  onWarehouseChange: (id: string) => void;
  onRefresh?: () => void;
  history?: BottleTrackingHistoryEntry[];
}

const InventoryBottleTrackingTab: React.FC<InventoryBottleTrackingTabProps> = ({
  summary,
  isLoading,
  selectedDate,
  onDateChange,
  selectedWarehouseId,
  onWarehouseChange,
  onRefresh,
  history = [],
}) => {
  // Container creation state
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [isUpdatingDriverId, setIsUpdatingDriverId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await inventoryApi.getWarehouses();
        setWarehouses(data.map((w) => ({ id: w.id, name: w.name })));
      } catch (err) {
        console.error("Failed to load warehouses list for filtering:", err);
      }
    };
    fetchWarehouses();
  }, []);

  const handleReassignDriverWarehouse = async (
    driverId: string,
    warehouseId: string,
  ) => {
    if (!driverId) return;
    setIsUpdatingDriverId(driverId);
    try {
      await inventoryApi.reassignDriverWarehouse(
        driverId,
        warehouseId === "none" ? null : warehouseId,
      );
      // Trigger dynamic dashboard refresh
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to reassign driver to warehouse:", err);
      alert("Failed to reassign driver to warehouse. Please try again.");
    } finally {
      setIsUpdatingDriverId(null);
    }
  };
  // Container creation/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<BottleType | null>(null);
  const [deletingContainer, setDeletingContainer] = useState<BottleType | null>(
    null,
  );

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );
  const [notification, _setNotification] = useState<{
    title: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const setNotification = React.useCallback(
    (
      val: { title: string; message: string; type: "success" | "error" } | null,
    ) => {
      _setNotification(val);
      if (val) {
        addNotification({
          title: val.title,
          message: val.message,
          type: val.type,
        });
      }
    },
    [addNotification],
  );

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  // Bottle type list for edit/delete (fetched separately from summary)
  const [bottleTypes, setBottleTypes] = useState<BottleType[]>([]);

  useEffect(() => {
    const fetchBottleTypes = async () => {
      try {
        const data = await inventoryApi.getBottleTypes();
        setBottleTypes(data);
      } catch (err) {
        console.error("Failed to load bottle types:", err);
      }
    };
    fetchBottleTypes();
  }, [summary]);

  const openCreateModal = () => {
    setEditingId(null);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (bt: BottleType) => {
    setEditingId(bt.id);
    setEditingItem(bt);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (bt: BottleType) => {
    setDeletingContainer(bt);
  };

  const [driverSearch, setDriverSearch] = useState<string>("");
  const [expandedDrivers, setExpandedDrivers] = useState<
    Record<string, boolean>
  >({});

  // Toggle driver route detail card expansion
  const toggleDriver = (routeId: string) => {
    setExpandedDrivers((prev) => ({
      ...prev,
      [routeId]: !prev[routeId],
    }));
  };

  // Compute stats totals dynamically from global summaries
  const totals = React.useMemo(() => {
    if (!summary || !summary.global_summary)
      return { customers: 0, broken: 0, dispatched: 0, returned: 0 };
    return summary.global_summary.reduce(
      (acc, item) => {
        acc.customers += item.total_with_customers;
        acc.broken += item.total_lost_broken;
        acc.dispatched += item.total_dispatched_today;
        acc.returned += item.total_returned_today;
        return acc;
      },
      { customers: 0, broken: 0, dispatched: 0, returned: 0 },
    );
  }, [summary]);

  // Compute in-transit (bottles loaded on active routes but not yet delivered)
  const inTransit = React.useMemo(() => {
    if (!summary || !summary.driver_breakdown) return 0;
    return summary.driver_breakdown.reduce((total, route) => {
      // Only count routes that are still active (not completed)
      const isActive = route.route_status === "in_progress" || route.route_status === "in_transit" || route.route_status === "pending" || route.route_status === "optimized";
      if (!isActive) return total;
      return total + route.bottles.reduce((sum, b) => sum + b.remaining_full, 0);
    }, 0);
  }, [summary]);

  // Collection rate
  const collectionRate = React.useMemo(() => {
    if (totals.dispatched === 0) return 0;
    return Math.round((totals.returned / totals.dispatched) * 100);
  }, [totals]);

  // Filter today's active driver list based on search queries
  const filteredDrivers = React.useMemo(() => {
    if (!summary || !summary.driver_breakdown) return [];
    return summary.driver_breakdown.filter(
      (drv) =>
        drv.driver_name
          .toLowerCase()
          .includes(driverSearch.toLowerCase().trim()) ||
        drv.vehicle_plate
          .toLowerCase()
          .includes(driverSearch.toLowerCase().trim()) ||
        drv.route_name
          .toLowerCase()
          .includes(driverSearch.toLowerCase().trim()),
    );
  }, [summary, driverSearch]);

  // 7-day trend chart helpers
  const chartMax = React.useMemo(() => {
    if (history.length === 0) return 10;
    const max = Math.max(...history.map(h => Math.max(h.dispatched, h.returned)));
    return max > 0 ? max : 10;
  }, [history]);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Loading Aggregates skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-5 h-28 rounded-2xl border border-silver/40 shadow-xs"
            />
          ))}
        </div>
        {/* Loading details tables */}
        <div className="bg-white p-6 h-96 rounded-2xl border border-silver/40 shadow-xs" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Premium Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-silver/30 pb-5">
        <div>
          <h2 className="text-lg font-black text-charcoal">
            Returnable Asset Analytics & Types
          </h2>
          <p className="text-xs text-charcoal/40 mt-1">
            Monitor outstanding delivery assets, track breakages, and manage
            regional glass container configurations.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs hover:bg-primary/95 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Boxes className="w-4 h-4 stroke-[3]" /> Add Container Type
        </button>
      </div>

      {/* 0. Dynamic Date & Warehouse Filters Bar */}
      <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-silver/50 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-charcoal">
              Reconciliation Filters
            </h3>
            <p className="text-[10px] text-charcoal/40 font-medium">
              Segment tracking stats and driver route collections by warehouse &
              target date
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          {/* Warehouse Dropdown */}
          <div className="flex flex-col gap-1 w-full sm:w-48">
            <span className="text-[9px] font-black uppercase tracking-wider text-charcoal/40">
              Select Warehouse
            </span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => onWarehouseChange(e.target.value)}
              className="w-full px-3 py-2 border border-silver/60 rounded-xl text-xs font-bold text-charcoal bg-silver/10 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[9px] font-black uppercase tracking-wider text-charcoal/40">
              Select Audit Date
            </span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/40 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-4 py-2 border border-silver/60 rounded-xl text-xs font-bold text-charcoal bg-silver/10 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* NEW SECTION 1: Asset Lifecycle Pipeline Visualization                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-white via-white to-primary/[0.03] p-6 rounded-2xl border border-silver/50 shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-charcoal">Asset Lifecycle Pipeline</h3>
            <p className="text-[10px] text-charcoal/40 font-medium">Real-time bottle flow from dispatch to collection</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-0 lg:gap-0">
          {/* Stage 1: Dispatched */}
          <div className="flex-1 relative group">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-2xl p-5 transition-all hover:shadow-md hover:border-amber-300/80 hover:scale-[1.02]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-amber-500/15 rounded-xl flex items-center justify-center">
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/70">Dispatched</span>
              </div>
              <div className="text-3xl font-black text-amber-700 tracking-tight">{totals.dispatched}</div>
              <div className="text-[10px] text-amber-600/60 font-semibold mt-1">Loaded on riders today</div>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="hidden lg:flex items-center justify-center w-10 shrink-0">
            <div className="flex flex-col items-center gap-0.5">
              <ArrowRight className="w-5 h-5 text-charcoal/20" />
            </div>
          </div>
          <div className="flex lg:hidden items-center justify-center h-6 shrink-0">
            <div className="w-px h-full bg-charcoal/15"></div>
          </div>

          {/* Stage 2: In Transit */}
          <div className="flex-1 relative group">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/60 rounded-2xl p-5 transition-all hover:shadow-md hover:border-blue-300/80 hover:scale-[1.02]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-500/15 rounded-xl flex items-center justify-center">
                  <Truck className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/70">In Transit</span>
                {inTransit > 0 && (
                  <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-blue-600 animate-pulse">
                    <CircleDot className="w-2.5 h-2.5" /> Live
                  </span>
                )}
              </div>
              <div className="text-3xl font-black text-blue-700 tracking-tight">{inTransit}</div>
              <div className="text-[10px] text-blue-600/60 font-semibold mt-1">On active routes now</div>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="hidden lg:flex items-center justify-center w-10 shrink-0">
            <ArrowRight className="w-5 h-5 text-charcoal/20" />
          </div>
          <div className="flex lg:hidden items-center justify-center h-6 shrink-0">
            <div className="w-px h-full bg-charcoal/15"></div>
          </div>

          {/* Stage 3: With Customers */}
          <div className="flex-1 relative group">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 transition-all hover:shadow-md hover:border-primary/40 hover:scale-[1.02]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">With Customers</span>
              </div>
              <div className="text-3xl font-black text-charcoal tracking-tight">{totals.customers}</div>
              <div className="text-[10px] text-charcoal/40 font-semibold mt-1">Pending return collection</div>
            </div>
          </div>

          {/* Arrow connector */}
          <div className="hidden lg:flex items-center justify-center w-10 shrink-0">
            <ArrowRight className="w-5 h-5 text-charcoal/20" />
          </div>
          <div className="flex lg:hidden items-center justify-center h-6 shrink-0">
            <div className="w-px h-full bg-charcoal/15"></div>
          </div>

          {/* Stage 4: Returned / Lost split */}
          <div className="flex-1 space-y-2">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 rounded-2xl p-4 transition-all hover:shadow-md hover:border-emerald-300/80 hover:scale-[1.02] group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-emerald-500/15 rounded-lg flex items-center justify-center">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Returned</span>
                </div>
                <span className="text-2xl font-black text-emerald-700 tracking-tight">{totals.returned}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/60 rounded-2xl p-4 transition-all hover:shadow-md hover:border-rose-300/80 hover:scale-[1.02] group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-rose-500/15 rounded-lg flex items-center justify-center">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600/70">Lost</span>
                </div>
                <span className="text-2xl font-black text-rose-700 tracking-tight">{totals.broken}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Rate Bar */}
        <div className="mt-5 pt-4 border-t border-silver/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-charcoal/40">Today's Collection Rate</span>
            <span className={`text-xs font-black ${collectionRate >= 80 ? 'text-emerald-600' : collectionRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
              {collectionRate}%
            </span>
          </div>
          <div className="w-full h-2 bg-silver/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                collectionRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                collectionRate >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                'bg-gradient-to-r from-rose-400 to-rose-500'
              }`}
              style={{ width: `${Math.min(collectionRate, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[9px] text-charcoal/35 font-medium">
            <span>{totals.returned} of {totals.dispatched} dispatched bottles returned</span>
            <span className="flex items-center gap-1">
              {collectionRate >= 80 ? (
                <><TrendingUp className="w-3 h-3 text-emerald-500" /> Excellent</>
              ) : collectionRate >= 50 ? (
                <><TrendingUp className="w-3 h-3 text-amber-500" /> Average</>
              ) : (
                <><TrendingDown className="w-3 h-3 text-rose-500" /> Needs Attention</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* NEW SECTION 2: 7-Day Trend Timeline Chart                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {history.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-charcoal">7-Day Asset Movement Trend</h3>
                <p className="text-[10px] text-charcoal/40 font-medium">Dispatched vs returned bottles over the last week</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-amber-400"></div>
                <span className="text-[10px] font-bold text-charcoal/50">Dispatched</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
                <span className="text-[10px] font-bold text-charcoal/50">Returned</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="relative">
            <svg viewBox="0 0 700 200" className="w-full h-48" preserveAspectRatio="xMidYMid meet">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <g key={i}>
                  <line
                    x1="40" y1={180 - ratio * 160} x2="690" y2={180 - ratio * 160}
                    stroke="#e5e5e5" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4,4"}
                  />
                  <text x="35" y={184 - ratio * 160} textAnchor="end" className="fill-charcoal/30" style={{ fontSize: '10px', fontWeight: 700 }}>
                    {Math.round(chartMax * ratio)}
                  </text>
                </g>
              ))}

              {/* Bars */}
              {history.map((entry, i) => {
                const barGroupWidth = 650 / history.length;
                const barWidth = barGroupWidth * 0.3;
                const x = 50 + i * barGroupWidth + barGroupWidth * 0.15;
                const dispatchedHeight = chartMax > 0 ? (entry.dispatched / chartMax) * 160 : 0;
                const returnedHeight = chartMax > 0 ? (entry.returned / chartMax) * 160 : 0;

                return (
                  <g key={entry.date}>
                    {/* Dispatched bar */}
                    <rect
                      x={x}
                      y={180 - dispatchedHeight}
                      width={barWidth}
                      height={dispatchedHeight}
                      rx="4"
                      className="fill-amber-400/80 hover:fill-amber-500 transition-colors"
                    >
                      <title>Dispatched: {entry.dispatched} on {entry.date}</title>
                    </rect>
                    {/* Dispatched value */}
                    {entry.dispatched > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={175 - dispatchedHeight}
                        textAnchor="middle"
                        className="fill-amber-700"
                        style={{ fontSize: '9px', fontWeight: 800 }}
                      >
                        {entry.dispatched}
                      </text>
                    )}

                    {/* Returned bar */}
                    <rect
                      x={x + barWidth + 4}
                      y={180 - returnedHeight}
                      width={barWidth}
                      height={returnedHeight}
                      rx="4"
                      className="fill-emerald-400/80 hover:fill-emerald-500 transition-colors"
                    >
                      <title>Returned: {entry.returned} on {entry.date}</title>
                    </rect>
                    {/* Returned value */}
                    {entry.returned > 0 && (
                      <text
                        x={x + barWidth + 4 + barWidth / 2}
                        y={175 - returnedHeight}
                        textAnchor="middle"
                        className="fill-emerald-700"
                        style={{ fontSize: '9px', fontWeight: 800 }}
                      >
                        {entry.returned}
                      </text>
                    )}

                    {/* Date label */}
                    <text
                      x={x + barWidth + 2}
                      y="198"
                      textAnchor="middle"
                      className="fill-charcoal/40"
                      style={{ fontSize: '9px', fontWeight: 700 }}
                    >
                      {formatDateLabel(entry.date)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom summary row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-silver/30 text-[10px]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-charcoal/50 font-bold">
                  Total Dispatched (7d): <span className="text-charcoal font-black">{history.reduce((s, h) => s + h.dispatched, 0)}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-charcoal/50 font-bold">
                  Total Returned (7d): <span className="text-charcoal font-black">{history.reduce((s, h) => s + h.returned, 0)}</span>
                </span>
              </div>
            </div>
            <div className="text-charcoal/40 font-bold">
              {(() => {
                const totalDisp = history.reduce((s, h) => s + h.dispatched, 0);
                const totalRet = history.reduce((s, h) => s + h.returned, 0);
                const weekRate = totalDisp > 0 ? Math.round((totalRet / totalDisp) * 100) : 0;
                return <span>Weekly Collection Rate: <span className={`font-black ${weekRate >= 80 ? 'text-emerald-600' : weekRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{weekRate}%</span></span>;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ORIGINAL SECTION: Real-Time Aggregate Counters Grid                    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding With Customers */}
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <UserCheck className="w-24 h-24 text-charcoal" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">
            Outstanding Assets
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-charcoal tracking-tight">
              {totals.customers}
            </span>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              At Customers
            </span>
          </div>
          <div className="mt-2 text-[10px] text-charcoal/40 font-medium">
            Pending return collection
          </div>
        </div>

        {/* Loaded / Dispatched Today */}
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <Bike className="w-24 h-24 text-amber-600" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">
            Dispatched Today
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-600 tracking-tight">
              {totals.dispatched}
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
              Rider bags (Bike)
            </span>
          </div>
          <div className="mt-2 text-[10px] text-charcoal/40 font-medium">
            Active delivery volume today
          </div>
        </div>

        {/* Empty Returns Today */}
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <ArrowRightLeft className="w-24 h-24 text-emerald-600" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">
            Collected Returns
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-600 tracking-tight">
              {totals.returned}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
              Empty Back
            </span>
          </div>
          <div className="mt-2 text-[10px] text-charcoal/40 font-medium">
            Empties collected on route
          </div>
        </div>

        {/* Broken / Lifetime Losses */}
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-rose-500/40 transition-colors">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <AlertOctagon className="w-24 h-24 text-rose-600" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-rose-600/60 block">
            Damaged / Lost
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-rose-600 tracking-tight">
              {totals.broken}
            </span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
              Write-Offs
            </span>
          </div>
          <div className="mt-2 text-[10px] text-charcoal/40 font-medium">
            Recorded breakage events
          </div>
        </div>
      </div>

      {/* 2. Breakdown Matrix Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left Side: Product wise tracking summary table */}
        <div className="bg-white p-6 rounded-2xl border border-silver/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-charcoal flex items-center gap-2">
                <Boxes className="w-4 h-4 text-primary" /> Returnable Catalog
                Varieties
              </h3>
              <Calendar className="w-4 h-4 text-charcoal/30" />
            </div>
            <p className="text-[11px] text-charcoal/50 mb-4">
              Detailed tracking balance parameters grouped by container type.
            </p>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {!summary || summary.global_summary.length === 0 ? (
                <div className="p-4 text-center text-xs text-charcoal/40 font-bold border border-dashed border-silver rounded-xl">
                  No returnable container types found.
                </div>
              ) : (
                summary.global_summary.map((item) => {
                  const btData = bottleTypes.find(
                    (bt) => bt.id === item.bottle_type_id,
                  );
                  return (
                    <div
                      key={item.bottle_type_id}
                      className="p-3 border border-silver/50 rounded-xl space-y-2 bg-silver/5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-charcoal">
                          {item.bottle_type_name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                            {item.total_with_customers} units outstanding
                          </span>
                          {btData && (
                            <>
                              <button
                                onClick={() => openEditModal(btData)}
                                className="p-1 rounded-lg hover:bg-primary/10 text-charcoal/40 hover:text-primary transition-colors cursor-pointer"
                                title="Edit container type"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(btData)}
                                className="p-1 rounded-lg hover:bg-rose-500/10 text-charcoal/40 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete container type"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-silver/40 text-[10px]">
                        <div>
                          <span className="text-charcoal/40 block font-bold uppercase tracking-wider">
                            Dispatched
                          </span>
                          <span className="text-charcoal font-black">
                            {item.total_dispatched_today}
                          </span>
                        </div>
                        <div>
                          <span className="text-charcoal/40 block font-bold uppercase tracking-wider">
                            Returned
                          </span>
                          <span className="text-emerald-600 font-black">
                            {item.total_returned_today}
                          </span>
                        </div>
                        <div>
                          <span className="text-rose-600/60 block font-bold uppercase tracking-wider">
                            Broken
                          </span>
                          <span className="text-rose-600 font-black">
                            {item.total_lost_broken}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-silver/40 flex items-center justify-between text-[11px] text-charcoal/50 font-medium">
            <span>
              Date: {summary?.date || new Date().toISOString().split("T")[0]}
            </span>
            <span className="text-primary font-bold">Synced Live</span>
          </div>
        </div>

        {/* Right Side: Driver Deliveries Breakdown desk */}
        <div className="bg-white p-6 rounded-2xl border border-silver/60 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-charcoal flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" /> Driver Deliveries &
                Reconciliations
              </h3>
              <p className="text-[11px] text-charcoal/50 mt-0.5">
                Inspect how many bottles drivers took out, handed over, and
                brought back today.
              </p>
            </div>
            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-charcoal/40" />
              </span>
              <input
                type="text"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                placeholder="Search driver, route, or vehicle..."
                className="w-full text-xs font-medium pl-9 pr-4 py-2 border border-silver rounded-xl bg-silver/10 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-charcoal/30"
              />
            </div>
          </div>

          {/* Expanded Cards View */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredDrivers.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold border border-dashed border-silver/60 rounded-xl text-charcoal/40 flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-charcoal/30" />
                No active driver trips scheduled for this date.
              </div>
            ) : (
              filteredDrivers.map((route) => {
                const isExpanded = !!expandedDrivers[route.route_id];
                const isRouteCompleted = route.route_status === "completed";
                const isRouteActive =
                  route.route_status === "in_progress" ||
                  route.route_status === "in_transit";

                return (
                  <div
                    key={route.route_id}
                    className="border border-silver/50 rounded-xl overflow-hidden shadow-xs hover:border-silver transition-colors bg-white"
                  >
                    {/* Route card header */}
                    <div
                      onClick={() => toggleDriver(route.route_id)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-silver/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Driver Profile Initials badge */}
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-xs flex items-center justify-center">
                          {route.driver_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-charcoal">
                              {route.driver_name}
                            </span>
                            <span className="text-[10px] font-bold text-charcoal/40 bg-silver/30 px-2 py-0.5 rounded-md">
                              {route.vehicle_plate}
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold text-charcoal/40 mt-0.5 flex items-center gap-1">
                            {route.route_name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* In-Transit Badge for active routes */}
                        {isRouteActive && route.bottles.reduce((s, b) => s + b.remaining_full, 0) > 0 && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border bg-blue-50 text-blue-700 border-blue-100 animate-pulse">
                            🚚 {route.bottles.reduce((s, b) => s + b.remaining_full, 0)} in transit
                          </span>
                        )}
                        {/* Status Badge */}
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                            isRouteCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : isRouteActive
                                ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                                : "bg-silver/40 text-charcoal/60 border-silver/60"
                          }`}
                        >
                          {route.route_status_display}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-charcoal/40" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-charcoal/40" />
                        )}
                      </div>
                    </div>

                    {/* Route card expansion details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-silver/30 bg-silver/5 animate-in fade-in duration-200">
                        {route.bottles.length === 0 ? (
                          <p className="text-[10px] font-bold text-charcoal/40 p-2 border border-dashed border-silver/40 rounded-lg text-center mt-2">
                            No returnable packaging loaded on this trip.
                          </p>
                        ) : (
                          <div className="overflow-x-auto mt-2">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-silver/60 text-[9px] font-black uppercase text-charcoal/40">
                                  <th className="py-2">Bottle Type</th>
                                  <th className="py-2 text-right">
                                    Took (Full)
                                  </th>
                                  <th className="py-2 text-right">Delivered</th>
                                  <th className="py-2 text-right">
                                    Returned (Empty)
                                  </th>
                                  <th className="py-2 text-right">Broken</th>
                                  <th className="py-2 text-right text-blue-700 bg-blue-50/50">In Transit</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-silver/40 text-[11px] font-semibold text-charcoal/80">
                                {route.bottles.map(bottle => (
                                  <tr key={bottle.bottle_type_id} className="hover:bg-silver/10 transition-colors">
                                    <td className="py-2.5 font-bold">{bottle.bottle_type_name}</td>
                                    <td className="py-2.5 text-right">{bottle.dispatched}</td>
                                    <td className="py-2.5 text-right text-emerald-600">{bottle.delivered}</td>
                                    <td className="py-2.5 text-right text-blue-600">{bottle.returned}</td>
                                    <td className="py-2.5 text-right text-rose-600">{bottle.broken}</td>
                                    <td className="py-2.5 text-right text-blue-800 bg-blue-50/30 font-black">
                                      {bottle.remaining_full}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Driver Warehouse Assignment flex panel */}
                        <div className="mt-4 p-3 rounded-xl border border-silver/50 bg-white flex items-center justify-between text-[11px]">
                          <div>
                            <div className="font-bold text-charcoal flex items-center gap-1.5">
                              <Warehouse className="w-3.5 h-3.5 text-primary" />{" "}
                              Driver Home Warehouse Association:
                            </div>
                            <p className="text-charcoal/40 font-medium mt-0.5">
                              Reassigning a driver permanently filters their
                              dispatches to their designated warehouse.
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-4">
                            <select
                              value={route.driver_warehouse_id || "none"}
                              disabled={isUpdatingDriverId === route.driver_id}
                              onChange={(e) => {
                                if (route.driver_id) {
                                  handleReassignDriverWarehouse(
                                    route.driver_id,
                                    e.target.value,
                                  );
                                }
                              }}
                              className="px-3 py-1.5 bg-silver/10 hover:bg-silver/20 border border-silver/60 rounded-lg text-xs font-bold text-charcoal outline-none cursor-pointer transition-colors"
                            >
                              <option value="none">
                                No Warehouse Assigned
                              </option>
                              {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Reconciliation summary text box */}
                        <div className="mt-4 p-3 rounded-xl border border-silver/50 bg-white flex items-center justify-between text-[10px]">
                          <div>
                            <div className="font-bold text-charcoal">
                              Reconciliation Summary:
                            </div>
                            <p className="text-charcoal/40 font-medium mt-0.5">
                              {isRouteCompleted
                                ? "Route completed. Please verify that outstanding full bottles and empty bottles have been checked into the warehouse."
                                : "Route in progress. Live tracking updates are active as the driver records customer transactions."}
                            </p>
                          </div>
                          {isRouteCompleted ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-black shrink-0 ml-4">
                              <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                              Reconciled
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-amber-600 font-black shrink-0 ml-4 animate-pulse">
                              ● On Road
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Save Container Type Overlay Modal */}
      <SaveBottleTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingId={editingId}
        editingItem={editingItem}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
        setNotification={setNotification}
      />

      {/* Delete Container Type Overlay Modal */}
      <DeleteBottleTypeModal
        deletingContainer={deletingContainer}
        onClose={() => setDeletingContainer(null)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
        setNotification={setNotification}
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
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
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

export default InventoryBottleTrackingTab;
