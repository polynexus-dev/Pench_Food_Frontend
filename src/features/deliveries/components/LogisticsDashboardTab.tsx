import React from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Users, MapPin, Activity, ShieldCheck, Zap } from "lucide-react";
import type { LogisticsStats } from "./types";

interface LogisticsDashboardTabProps {
  stats: LogisticsStats;
}

const LogisticsDashboardTab: React.FC<LogisticsDashboardTabProps> = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Fleet" 
          value={stats.totalDrivers.toString()} 
          icon={Truck} 
          bgColor="bg-primary/10"
          iconColor="text-primary"
          onClick={() => navigate("/drivers")}
        />
        <StatCard 
          label="Available Now" 
          value={stats.availableDrivers.toString()} 
          icon={Zap} 
          bgColor="bg-amber-100"
          iconColor="text-amber-600"
          onClick={() => navigate("/drivers")}
        />
        <StatCard 
          label="Active Trips" 
          value={stats.activeTrips.toString()} 
          icon={Activity} 
          bgColor="bg-indigo-100"
          iconColor="text-indigo-600"
          onClick={() => navigate("/tracking")}
        />
        <StatCard 
          label="Fleet Capacity" 
          value={`${stats.totalCapacity}kg`} 
          icon={ShieldCheck} 
          bgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          onClick={() => navigate("/drivers")}
        />
      </div>

      {/* 2. Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-silver/50 shadow-sm p-8">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-xl font-black text-charcoal">Fleet Utilization</h3>
                 <p className="text-xs font-medium text-charcoal/40">Real-time capacity and rider engagement</p>
              </div>
              <Users className="w-6 h-6 text-primary/20" />
           </div>
           
           <div className="flex flex-col items-center justify-center py-10">
              <div className="relative w-48 h-48">
                 <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-silver/20 stroke-current" strokeWidth="10" fill="transparent" r="40" cx="50" cy="50" />
                    <circle 
                       className="text-primary stroke-current transition-all duration-1000 ease-out" 
                       strokeWidth="10" 
                       strokeDasharray={`${stats.utilizationRate * 2.51}, 251`} 
                       strokeLinecap="round" 
                       fill="transparent" 
                       r="40" 
                       cx="50" 
                       cy="50" 
                       transform="rotate(-90 50 50)" 
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-charcoal">{stats.utilizationRate}%</span>
                    <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest">Utilized</span>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-12 mt-10 w-full max-w-sm">
                 <div className="text-center">
                    <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest mb-1">Engaged</p>
                    <p className="text-xl font-black text-charcoal">{stats.activeTrips} Riders</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest mb-1">Standby</p>
                    <p className="text-xl font-black text-charcoal">{stats.availableDrivers} Riders</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-gradient-to-br from-[#1a2e21] to-[#0a140d] rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
           <div className="relative z-10">
              <MapPin className="w-10 h-10 text-accent mb-6" />
              <h3 className="text-2xl font-black leading-tight">Live Route Monitor</h3>
              <p className="text-white/40 text-xs mt-2 font-medium leading-relaxed">
                 Seamlessly track every vehicle across the regional distribution network.
              </p>
              
              <div className="mt-12 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-1 h-12 bg-accent rounded-full opacity-20"></div>
                    <div>
                       <p className="text-[10px] font-black text-accent uppercase tracking-widest">Nagpur Zone A</p>
                       <p className="text-sm font-bold mt-1">4 Active Routes</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-1 h-12 bg-white rounded-full opacity-10"></div>
                    <div>
                       <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Nagpur Zone B</p>
                       <p className="text-sm font-bold mt-1">2 Active Routes</p>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
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

export default LogisticsDashboardTab;
