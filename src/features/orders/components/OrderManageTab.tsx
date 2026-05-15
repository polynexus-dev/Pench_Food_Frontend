import React from "react";
import { Search, Filter, Eye, MoreHorizontal, Calendar, User, MapPin } from "lucide-react";
import type { Order } from "./types";

interface OrderManageTabProps {
  orders: Order[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const OrderManageTab: React.FC<OrderManageTabProps> = ({ 
  orders, 
  isLoading, 
  searchQuery, 
  setSearchQuery 
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[24px] border border-silver/50 shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
          <input 
            type="text"
            placeholder="Search orders, customers or IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-silver/5 border border-silver/30 rounded-xl text-sm font-bold focus:outline-none focus:border-primary/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-3 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 transition-all">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Advanced Filters
           </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[32px] border border-silver/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-silver/5 border-b border-silver/30">
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Order Info</th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Customer</th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Delivery Date</th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">Total</th>
                <th className="px-6 py-5 text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/20">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-silver/5"></td>
                  </tr>
                ))
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-silver/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-charcoal">#{order.id.split('-')[0].toUpperCase()}</p>
                    <p className="text-[10px] text-charcoal/40 font-bold mt-1 uppercase">Retail Order</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-cream rounded-lg flex items-center justify-center text-[10px] font-black text-primary border border-primary/5">
                          {order.customer_name.charAt(0)}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-charcoal leading-tight">{order.customer_name}</p>
                          <div className="flex items-center gap-1 text-[10px] text-charcoal/40 mt-1">
                             <MapPin className="w-3 h-3" />
                             <span className="truncate max-w-[150px]">{order.delivery_address || 'No address'}</span>
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      order.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-silver/10 text-charcoal/40 border-silver/20'
                    }`}>
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
                       <button className="p-2 hover:bg-primary/10 rounded-xl transition-all text-charcoal/20 hover:text-primary">
                          <Eye className="w-4 h-4" />
                       </button>
                       <button className="p-2 hover:bg-silver/20 rounded-xl transition-all text-charcoal/20 hover:text-charcoal">
                          <MoreHorizontal className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
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
