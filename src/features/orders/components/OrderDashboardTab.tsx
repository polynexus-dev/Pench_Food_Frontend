import React from "react";
import { useNavigate } from "react-router-dom";
import type { OrderStats } from "./types";
import { CheckCircle2, Clock, IndianRupee, ShoppingCart, TrendingUp, Truck } from "lucide-react";

interface OrderDashboardTabProps {
  stats: OrderStats;
}

const OrderDashboardTab: React.FC<OrderDashboardTabProps> = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Orders" 
          value={stats.totalOrders.toString()} 
          icon={ShoppingCart} 
          bgColor="bg-primary/10"
          iconColor="text-primary"
          onClick={() => navigate("/orders")}
        />
        <StatCard 
          label="Pending Dispatch" 
          value={stats.pendingOrders.toString()} 
          icon={Clock} 
          bgColor="bg-amber-100"
          iconColor="text-amber-600"
          onClick={() => navigate("/orders")}
        />
        <StatCard 
          label="Completed" 
          value={stats.deliveredOrders.toString()} 
          icon={CheckCircle2} 
          bgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          onClick={() => navigate("/orders")}
        />
        <StatCard 
          label="Revenue" 
          value={`₹${stats.totalRevenue.toLocaleString()}`} 
          icon={IndianRupee} 
          bgColor="bg-indigo-100"
          iconColor="text-indigo-600"
          onClick={() => navigate("/finance")}
        />
      </div>

      {/* 2. Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-silver/50 shadow-sm p-8">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-xl font-black text-charcoal">Order Volume</h3>
                 <p className="text-xs font-medium text-charcoal/40">Distribution of orders across statuses</p>
              </div>
              <TrendingUp className="w-6 h-6 text-primary/20" />
           </div>
           
           <div className="space-y-6">
              {Object.entries(stats.statusBreakdown).map(([status, count]) => {
                const percentage = (count / stats.totalOrders) * 100 || 0;
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-charcoal/60">
                      <span>{status}</span>
                      <span>{count} orders ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-silver/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-[#013D21] rounded-[32px] p-8 text-white shadow-xl flex flex-col justify-between">
           <div>
              <Truck className="w-10 h-10 text-accent mb-6" />
              <h3 className="text-2xl font-black leading-tight">Logistics Overview</h3>
              <p className="text-white/60 text-xs mt-2 font-medium leading-relaxed">
                 All orders are being synced in real-time with driver handheld units.
              </p>
           </div>
           
           <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex justify-between items-end">
                 <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-accent">Active Dispatch</p>
                    <p className="text-3xl font-black mt-1">{stats.confirmedOrders}</p>
                 </div>
                 <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                    Track Fleet &rarr;
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, bgColor, iconColor, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full text-left bg-white p-6 rounded-[28px] border border-silver/50 shadow-xs flex items-center gap-5 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all group cursor-pointer focus:outline-none"
  >
    <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
      <Icon className={`w-7 h-7 ${iconColor}`} />
    </div>
    <div>
      <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-charcoal mt-0.5">{value}</p>
    </div>
  </button>
);

export default OrderDashboardTab;
