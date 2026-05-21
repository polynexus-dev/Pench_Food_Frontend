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
  PackageOpen
} from "lucide-react";
import type { Order, OrderItem } from "./types";

interface OrderManageTabProps {
  orders: Order[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onUpdateOrderStatus: (orderId: string, status: string) => Promise<void>;
}

const OrderManageTab: React.FC<OrderManageTabProps> = ({ 
  orders, 
  isLoading, 
  searchQuery, 
  setSearchQuery,
  onUpdateOrderStatus
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
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
      case "pending":
      default:
        return "bg-amber-50 text-amber-600 border border-amber-100";
    }
  };

  // Compute unique products list
  const availableProducts = useMemo(() => {
    const products = new Set<string>();
    orders.forEach((order: Order) => {
      order.items.forEach((item: OrderItem) => {
        if (item.product_name) {
          products.add(item.product_name);
        }
      });
    });
    return Array.from(products);
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
        const hasProduct = order.items.some((item: OrderItem) => item.product_name === selectedProduct);
        if (!hasProduct) return false;
      }
      return true;
    });
  }, [orders, selectedStatus, minPrice, maxPrice, selectedProduct]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[24px] border border-silver/50 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
          <input 
            type="text"
            placeholder="Search orders, customers or statuses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-silver/5 border border-silver/30 rounded-xl text-sm font-bold focus:outline-none focus:border-primary/30 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
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

          <div className="md:col-span-3 flex justify-end gap-2 border-t border-silver/30 pt-4">
            <button
              onClick={() => {
                setMinPrice("");
                setMaxPrice("");
                setSelectedProduct("all");
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
                          {order.items.length} Product{order.items.length !== 1 ? 's' : ''}
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
                            <div className="lg:col-span-2 space-y-3 bg-white p-5 rounded-2xl border border-silver/50 shadow-xs">
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
                                    {order.items.map((it: OrderItem) => (
                                      <tr key={it.id}>
                                        <td className="py-2.5 text-charcoal font-black">{it.product_name}</td>
                                        <td className="py-2.5 text-center text-primary font-black">x{it.quantity}</td>
                                        <td className="py-2.5 text-right">₹{it.unit_price}</td>
                                        <td className="py-2.5 text-right text-charcoal">₹{it.line_total}</td>
                                      </tr>
                                    ))}
                                    <tr className="border-t-2 border-silver/50 font-black text-sm text-charcoal">
                                      <td colSpan={3} className="pt-3 text-right text-[10px] font-black uppercase text-charcoal/40 tracking-wider">Total Amount:</td>
                                      <td className="pt-3 text-right text-primary">₹{order.total}</td>
                                    </tr>
                                  </tbody>
                                </table>
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
                              </div>

                              {order.status !== "delivered" ? (
                                <div className="space-y-2 mt-4 lg:mt-0">
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
                                      onClick={() => handleStatusChange(order.id, "cancelled")}
                                      disabled={isUpdating}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" /> Cancelled
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-2 text-[10px] font-bold text-primary mt-4 lg:mt-0">
                                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span>Order has been completed and delivered.</span>
                                </div>
                              )}
                            </div>
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
    </div>
  );
};

export default OrderManageTab;
