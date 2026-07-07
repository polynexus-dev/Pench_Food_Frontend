import React, { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  MapPin, 
  Clock, 
  Check, 
  Truck, 
  X, 
  ShoppingBag, 
  PackageOpen,
  Camera,
  ExternalLink,
  Image as ImageIcon,
  PlusCircle
} from "lucide-react";
import type { Order, OrderItem } from "./types";
import { useAuthStore } from "../../../store/useAuthStore";
import { getCityUrl } from "../../../utils/constants";
import CreateOrderModal from "./modals/CreateOrderModal";


interface OrderManageTabProps {
  orders: Order[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onUpdateOrderStatus: (orderId: string, status: string) => Promise<void>;
  onOrderCreated: () => void;
}

const OrderManageTab: React.FC<OrderManageTabProps> = ({ 
  orders, 
  isLoading, 
  searchQuery, 
  setSearchQuery,
  onUpdateOrderStatus,
  onOrderCreated
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const getPodImageUrl = (podPath: string | null | undefined) => {
    if (!podPath) return "";
    if (podPath.startsWith("http://") || podPath.startsWith("https://")) {
      return podPath;
    }
    const tenant = useAuthStore.getState().tenant || "nagpur";
    const cityUrl = getCityUrl(tenant);
    const baseHost = cityUrl.replace(/\/api\/?$/, ""); // Get base URL
    return `${baseHost}${podPath.startsWith("/") ? "" : "/"}${podPath}`;
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await onUpdateOrderStatus(orderId, newStatus);
    } catch (e) {
      console.error("Failed to update status:", e);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "in_transit":
        return "bg-blue-50 text-blue-600 border border-blue-100";
      case "delivered":
        return "bg-sage/10 text-primary border border-primary/10";
      case "cancelled":
        return "bg-red-50 text-red-500 border border-red-100";
      case "undelivered":
        return "bg-rose-50 text-rose-600 border border-rose-100";
      case "pending":
      default:
        return "bg-amber-50 text-amber-600 border border-amber-100";
    }
  };

  // Compute unique products list
  const availableProducts = useMemo(() => {
    const products = new Set<string>();
    orders.forEach((order: Order) => {
      (order.items || []).forEach((item: OrderItem) => {
        if (item.product_name) {
          products.add(item.product_name);
        }
      });
    });
    return Array.from(products);
  }, [orders]);

  // Compute unique zones list
  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    orders.forEach((order: Order) => {
      if (order.zone_name) {
        zones.add(order.zone_name);
      }
    });
    return Array.from(zones).sort();
  }, [orders]);

  // Compute unique drivers list
  const availableDrivers = useMemo(() => {
    const drivers = new Set<string>();
    orders.forEach((order: Order) => {
      if (order.driver_name) {
        drivers.add(order.driver_name);
      }
    });
    return Array.from(drivers).sort();
  }, [orders]);

  // Compute unique customers list
  const availableCustomers = useMemo(() => {
    const customers = new Set<string>();
    orders.forEach((order: Order) => {
      if (order.customer_name) {
        customers.add(order.customer_name);
      }
    });
    return Array.from(customers).sort();
  }, [orders]);

  // Compute stats for essential filters
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o: Order) => o.status === "pending").length,
      confirmed: orders.filter((o: Order) => o.status === "confirmed").length,
      in_transit: orders.filter((o: Order) => o.status === "in_transit").length,
      delivered: orders.filter((o: Order) => o.status === "delivered").length,
      cancelled: orders.filter((o: Order) => o.status === "cancelled").length,
      undelivered: orders.filter((o: Order) => o.status === "undelivered").length,
    };
  }, [orders]);

  // Apply all filters
  const finalFilteredOrders = useMemo(() => {
    return orders.filter((order: Order) => {
      if (selectedStatus !== "all" && order.status !== selectedStatus) {
        return false;
      }
      if (minPrice && parseFloat(order.total) < parseFloat(minPrice)) {
        return false;
      }
      if (maxPrice && parseFloat(order.total) > parseFloat(maxPrice)) {
        return false;
      }
      if (selectedProduct !== "all") {
        const hasProduct = (order.items || []).some((item: OrderItem) => item.product_name === selectedProduct);
        if (!hasProduct) return false;
      }
      if (selectedZone !== "all" && order.zone_name !== selectedZone) {
        return false;
      }
      if (selectedDriver !== "all" && order.driver_name !== selectedDriver) {
        return false;
      }
      if (selectedCustomer !== "all" && order.customer_name !== selectedCustomer) {
        return false;
      }
      if (selectedDate && order.scheduled_delivery_date !== selectedDate) {
        return false;
      }
      return true;
    });
  }, [orders, selectedStatus, minPrice, maxPrice, selectedProduct, selectedZone, selectedDriver, selectedCustomer, selectedDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-xs font-bold text-primary flex items-center gap-2">
            <Check className="w-4 h-4 text-primary shrink-0" />
            {successMsg}
          </p>
          <button
            onClick={() => setSuccessMsg(null)}
            className="p-1 hover:bg-primary/10 rounded-lg text-primary/50 hover:text-primary transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[24px] border border-silver/50 shadow-sm">
        <div className="relative w-full md:flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
          <input 
            type="text"
            placeholder="Search orders, customers or statuses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-silver/5 border border-silver/30 rounded-xl text-sm font-bold focus:outline-none focus:border-primary/30 transition-all outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
           <button 
             onClick={() => setIsAdvancedOpen(prev => !prev)}
             className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
               isAdvancedOpen 
                 ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                 : "bg-white border-silver/60 text-charcoal hover:bg-silver/10"
             }`}
           >
              <Filter className="w-3.5 h-3.5" />
              Advanced Filters
           </button>
           <button
             onClick={() => setIsCreateModalOpen(true)}
             className="flex items-center gap-2 px-4 py-3 bg-primary text-white hover:bg-primary/95 border border-primary rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-primary/10 active:scale-95 whitespace-nowrap"
           >
             <PlusCircle className="w-3.5 h-3.5" />
             Create Order
           </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isAdvancedOpen && (
        <div className="bg-white p-6 rounded-[24px] border border-silver/50 shadow-sm animate-in slide-in-from-top-4 duration-300 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Min Total (₹)</label>
            <input
              type="number"
              placeholder="Min value..."
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-4 py-3 bg-silver/5 border border-silver/30 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Max Total (₹)</label>
            <input
              type="number"
              placeholder="Max value..."
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-4 py-3 bg-silver/5 border border-silver/30 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Product Included</label>
            <div className="relative">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-silver/5 border border-silver/30 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Products</option>
                {availableProducts.map((prod: string) => (
                  <option key={prod} value={prod}>{prod}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Zone</label>
            <div className="relative">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-silver/5 border border-silver/30 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Zones</option>
                {availableZones.map((zone: string) => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Driver</label>
            <div className="relative">
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-silver/5 border border-silver/30 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Drivers</option>
                {availableDrivers.map((driver: string) => (
                  <option key={driver} value={driver}>{driver}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Customer</label>
            <div className="relative">
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-silver/5 border border-silver/30 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="all">All Customers</option>
                {availableCustomers.map((cust: string) => (
                  <option key={cust} value={cust}>{cust}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Delivery Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 bg-silver/5 border border-silver/30 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all outline-none cursor-pointer"
            />
          </div>

          <div className="md:col-span-3 flex justify-end gap-2 border-t border-silver/30 pt-4">
            <button
              onClick={() => {
                setMinPrice("");
                setMaxPrice("");
                setSelectedProduct("all");
                setSelectedZone("all");
                setSelectedDriver("all");
                setSelectedCustomer("all");
                setSelectedDate("");
              }}
              className="px-4 py-2 border border-silver/60 text-charcoal hover:bg-silver/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Clear Advanced
            </button>
          </div>
        </div>
      )}

      {/* Essential Filters: Status Pills */}
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { id: "all", label: "All Orders", count: statusCounts.all, color: "bg-charcoal/5 border-charcoal/10 text-charcoal" },
          { id: "pending", label: "Pending", count: statusCounts.pending, color: "bg-amber-500/10 border-amber-500/20 text-amber-600" },
          { id: "confirmed", label: "Confirmed", count: statusCounts.confirmed, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" },
          { id: "in_transit", label: "In Transit", count: statusCounts.in_transit, color: "bg-blue-500/10 border-blue-500/20 text-blue-600" },
          { id: "delivered", label: "Delivered", count: statusCounts.delivered, color: "bg-sage/10 border-primary/10 text-primary" },
          { id: "undelivered", label: "Undelivered", count: statusCounts.undelivered, color: "bg-rose-500/10 border-rose-500/20 text-rose-600" },
          { id: "cancelled", label: "Cancelled", count: statusCounts.cancelled, color: "bg-red-500/10 border-red-500/20 text-red-600" }
        ].map(pill => (
          <button
            key={pill.id}
            onClick={() => setSelectedStatus(pill.id)}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2 ${
              selectedStatus === pill.id
                ? "bg-primary border-primary text-white shadow-md shadow-primary/10"
                : `${pill.color} hover:bg-opacity-80`
            }`}
          >
            {pill.label}
            <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black ${
              selectedStatus === pill.id ? "bg-white/20 text-white" : "bg-black/5 text-current"
            }`}>
              {pill.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[32px] border border-silver/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-silver/5 border-b border-silver/30">
                <th className="w-12 px-6 py-5"></th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Order Info</th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Customer</th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Driver</th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Delivery Date</th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Total Price</th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/20">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4 h-16 bg-silver/5"></td>
                  </tr>
                ))
              ) : finalFilteredOrders.map((order: Order) => {
                const isExpanded = expandedOrderId === order.id;
                const isUpdating = updatingOrderId === order.id;
                
                return (
                  <React.Fragment key={order.id}>
                    <tr className={`hover:bg-silver/5 transition-colors group ${isExpanded ? "bg-silver/10" : ""}`}>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleExpandOrder(order.id)}
                          className="p-1 hover:bg-silver/20 rounded-lg text-charcoal/50 hover:text-charcoal transition-all cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 cursor-pointer" onClick={() => toggleExpandOrder(order.id)}>
                        <p className="text-sm font-black text-charcoal">#{order.id.split('-')[0].toUpperCase()}</p>
                        <p className="text-[9px] text-charcoal/40 font-bold mt-1 uppercase flex items-center gap-1">
                          <ShoppingBag className="w-2.5 h-2.5 text-primary/40" />
                          {(order.items || []).length} Product{(order.items || []).length !== 1 ? 's' : ''}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-cream rounded-lg flex items-center justify-center text-[10px] font-black text-primary border border-primary/5">
                              {order.customer_name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-charcoal leading-tight">{order.customer_name}</p>
                              <div className="flex items-center gap-1 text-[10px] text-charcoal/40 mt-1">
                                 <MapPin className="w-3 h-3 flex-shrink-0" />
                                 <span className="truncate max-w-[150px]">{order.delivery_address || 'No address'}</span>
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-silver/10 rounded-lg text-charcoal/50">
                            <Truck className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-charcoal leading-none">
                              {order.driver_name || "Unassigned"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                          {order.status_display}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2 text-xs font-bold text-charcoal/60">
                            <Calendar className="w-3.5 h-3.5 text-primary/40" />
                            {new Date(order.scheduled_delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-primary">₹{order.total}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => toggleExpandOrder(order.id)}
                             className={`p-2 rounded-xl transition-all ${isExpanded ? "bg-primary text-white" : "hover:bg-primary/10 text-charcoal/20 hover:text-primary"} cursor-pointer`}
                             title="View Order Details"
                           >
                              <Eye className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>

                    {/* Collapsible Expanded Line Items & Management Actions */}
                    {isExpanded && (
                      <tr className="bg-silver/5">
                        <td></td>
                        <td colSpan={6} className="px-8 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                            {/* Product Items Table List */}
                            <div className={`${order.pod_image ? "lg:col-span-1" : "lg:col-span-2"} space-y-3 bg-white p-5 rounded-2xl border border-silver/50 shadow-xs flex flex-col justify-between`}>
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <PackageOpen className="w-4 h-4 text-primary/40" />
                                  Order Products Summary
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="border-b border-silver/30 text-[9px] uppercase tracking-wider text-charcoal/40 font-black">
                                        <th className="pb-2">Product Name</th>
                                        <th className="pb-2 text-center">Quantity</th>
                                        <th className="pb-2 text-right">Unit Price</th>
                                        <th className="pb-2 text-right">Line Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-silver/20 text-xs font-bold text-charcoal/70">
                                      {(order.items || []).map((it: OrderItem) => (
                                        <tr key={it.id}>
                                          <td className="py-2.5 text-charcoal font-black">{it.product_name}</td>
                                          <td className="py-2.5 text-center text-primary font-black">x{it.quantity}</td>
                                          <td className="py-2.5 text-right">₹{it.unit_price}</td>
                                          <td className="py-2.5 text-right text-charcoal">₹{it.line_total}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              <div className="border-t border-silver/30 pt-3 flex justify-between items-center font-black text-sm text-charcoal mt-4">
                                <span className="text-[10px] font-black uppercase text-charcoal/40 tracking-wider">Total Amount:</span>
                                <span className="text-primary text-base">₹{order.total}</span>
                              </div>
                            </div>

                            {/* Status and Action Panel */}
                            <div className="space-y-4 bg-white p-5 rounded-2xl border border-silver/50 shadow-xs flex flex-col justify-between">
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-primary/40" />
                                  Manage Delivery Status
                                </h4>
                                <div className="p-3.5 bg-silver/5 rounded-xl border border-silver/30 space-y-1">
                                  <p className="text-[9px] font-bold text-charcoal/40 uppercase">Current Status</p>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                                      {order.status_display}
                                    </span>
                                    {isUpdating && <span className="text-[9px] text-charcoal/40 font-bold animate-pulse">Updating...</span>}
                                  </div>
                                </div>
                                {(order.status === "delivered" || order.status === "undelivered" || order.delivered_at) && (
                                  <div className="p-3.5 bg-silver/5 rounded-xl border border-silver/30 space-y-1">
                                    <p className="text-[9px] font-bold text-charcoal/40 uppercase flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                                      {order.status === "undelivered" ? "Attempted Time" : "Actual Completion Time"}
                                    </p>
                                    <p className="text-xs font-bold text-charcoal">
                                      {order.delivered_at ? (
                                        new Date(order.delivered_at).toLocaleString('en-IN', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        })
                                      ) : (
                                        `${new Date(order.scheduled_delivery_date).toLocaleDateString('en-IN', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric'
                                        })} (Scheduled Date)`
                                      )}
                                    </p>
                                  </div>
                                )}
                                <div className="p-3.5 bg-silver/5 rounded-xl border border-silver/30 space-y-1 mt-2">
                                  <p className="text-[9px] font-bold text-charcoal/40 uppercase">
                                    Payment Details
                                  </p>
                                  <div className="text-xs font-bold text-charcoal space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-charcoal/40 text-[10px]">Method:</span>
                                      <span className="capitalize">{(order.payment_method || "on_account").replace('_', ' ')}</span>
                                    </div>
                                    {(order.payment_method || "on_account") !== "on_account" && (
                                      <div className="flex justify-between">
                                        <span className="text-charcoal/40 text-[10px]">Collected:</span>
                                        <span className="text-primary font-black">₹{order.amount_collected || "0.00"}</span>
                                      </div>
                                    )}
                                    {order.payment_transaction_id && (
                                      <div className="flex flex-col pt-1 border-t border-silver/20">
                                        <span className="text-charcoal/40 text-[9px] uppercase">Transaction ID / UTR</span>
                                        <span className="font-mono text-[10px] truncate">{order.payment_transaction_id}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between pt-1 border-t border-silver/20">
                                      <span className="text-charcoal/40 text-[10px]">Payment Status:</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                        order.payment_status === "paid"
                                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                          : "bg-amber-50 text-amber-600 border border-amber-100"
                                      }`}>
                                        {order.payment_status || "Pending"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {order.status !== "delivered" ? (
                                <div className="space-y-2 mt-4">
                                  <p className="text-[9px] font-black text-charcoal/40 uppercase tracking-widest mb-2">Update status to:</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => handleStatusChange(order.id, "confirmed")}
                                      disabled={isUpdating}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" /> Confirmed
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(order.id, "in_transit")}
                                      disabled={isUpdating}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                      <Truck className="w-3 h-3" /> In Transit
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(order.id, "delivered")}
                                      disabled={isUpdating}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 border border-primary/20 hover:bg-green-100 text-primary rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" /> Delivered
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(order.id, "undelivered")}
                                      disabled={isUpdating}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" /> Undelivered
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(order.id, "cancelled")}
                                      disabled={isUpdating}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer col-span-2"
                                    >
                                      <X className="w-3 h-3" /> Cancelled
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-2 text-[10px] font-bold text-primary mt-4">
                                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span>Order has been completed and delivered.</span>
                                </div>
                              )}
                            </div>

                            {/* Proof of Delivery / Undelivery (POD) Photo & GPS */}
                            {order.pod_image && (
                              <div className="space-y-4 bg-white p-5 rounded-2xl border border-silver/50 shadow-xs flex flex-col justify-between">
                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-primary/40" />
                                    {order.status === "undelivered" ? "Delivery Exception (POD)" : "Proof of Delivery (POD)"}
                                  </h4>
                                  
                                  {/* Beautiful Image Container */}
                                  <div className="relative rounded-xl overflow-hidden border border-silver/40 bg-silver/5 aspect-video flex items-center justify-center group/pod">
                                    <img 
                                      src={getPodImageUrl(order.pod_image)} 
                                      alt="Proof of Delivery" 
                                      className="w-full h-full object-cover group-hover/pod:scale-105 transition-all duration-500 cursor-zoom-in"
                                      onClick={() => window.open(getPodImageUrl(order.pod_image), "_blank")}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pod:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                      <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <ExternalLink className="w-3.5 h-3.5" /> View Fullscreen
                                      </span>
                                    </div>
                                  </div>

                                  {/* Delivered At timestamp */}
                                  {order.delivered_at && (
                                    <div className="flex items-center gap-2 text-[10px] text-charcoal/50 font-bold bg-silver/5 p-2.5 rounded-lg border border-silver/20">
                                      <Clock className="w-3.5 h-3.5 text-primary/40" />
                                      <span>
                                        Uploaded: {new Date(order.delivered_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* GPS Capture coordinates */}
                                {(order.pod_latitude || order.pod_longitude) ? (
                                  <div className="space-y-2 mt-4">
                                    <div className="flex items-center gap-1 text-[9px] font-black uppercase text-charcoal/40 tracking-wider">
                                      <MapPin className="w-3.5 h-3.5 text-primary/40" /> Captured Coordinates
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-charcoal/60 bg-silver/5 p-2.5 rounded-lg border border-silver/20">
                                      <div>Lat: <span className="font-mono">{Number(order.pod_latitude).toFixed(6)}</span></div>
                                      <div>Lng: <span className="font-mono">{Number(order.pod_longitude).toFixed(6)}</span></div>
                                    </div>
                                    <button
                                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${order.pod_latitude},${order.pod_longitude}`, "_blank")}
                                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-silver/10 border border-silver/30 hover:bg-silver/20 text-charcoal rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer mt-1"
                                    >
                                      <ExternalLink className="w-3 h-3 text-primary" /> View on Google Maps
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-charcoal/40 font-bold italic mt-4">No GPS tag available for this proof.</div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {!isLoading && finalFilteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm font-bold text-charcoal/30 italic">No orders matching your criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessMsg(msg);
          onOrderCreated();
          setTimeout(() => setSuccessMsg(null), 5000);
        }}
      />
    </div>
  );
};

export default OrderManageTab;
