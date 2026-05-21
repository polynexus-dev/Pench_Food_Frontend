import React from "react";
import { Search, Globe, MapPin, MoreVertical, Plus } from "lucide-react";
import type { City } from "./types";

interface TenantListTabProps {
  cities: City[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onAddClick: () => void;
}

const TenantListTab: React.FC<TenantListTabProps> = ({
  cities,
  isLoading,
  searchQuery,
  setSearchQuery,
  onAddClick
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Search & Actions Bar with Compact Padding */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-silver/50 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all shadow-xs"
          />
        </div>

        <button 
          onClick={onAddClick}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add New City
        </button>
      </div>

      {/* Table with optimized padding */}
      <div className="bg-white rounded-2xl border border-silver/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-silver/5 text-[10px] uppercase tracking-[0.15em] text-charcoal/40 font-black border-b border-silver/30">
              <tr>
                <th className="px-6 py-4">City Instance</th>
                <th className="px-4 py-4">Schema / Domain</th>
                <th className="px-4 py-4">Location</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/20">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6 bg-silver/5"></td>
                  </tr>
                ))
              ) : cities.map((city) => (
                <tr key={city.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cream rounded-xl flex items-center justify-center font-black text-xs text-primary border border-primary/10 group-hover:scale-105 transition-transform">
                        {city.code}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-charcoal leading-tight">{city.name}</p>
                        <p className="text-[10px] text-charcoal/40 font-bold uppercase">ID: #{city.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary font-mono">{city.schema_name}</span>
                      <span className="text-[9px] text-charcoal/30 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" />
                        {city.schema_name}.pench.api
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-charcoal/70">
                      <MapPin className="w-3.5 h-3.5 text-primary/40" />
                      {city.state}, India
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      city.is_active ? "bg-sage/10 text-primary border border-primary/10" : "bg-red-50 text-red-500 border border-red-100"
                    }`}>
                      {city.is_active ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button className="p-1.5 text-charcoal/20 hover:text-charcoal hover:bg-silver/20 rounded-lg transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TenantListTab;
