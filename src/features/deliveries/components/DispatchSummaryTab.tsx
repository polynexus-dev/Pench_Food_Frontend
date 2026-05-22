import React, { useState, useMemo } from "react";
import { Search, User, ClipboardList, Navigation, AlertCircle, ShoppingBag } from "lucide-react";
import type { Route } from "./types";

interface DispatchSummaryTabProps {
  routes: Route[];
  isLoading: boolean;
}

const DispatchSummaryTab: React.FC<DispatchSummaryTabProps> = ({ routes, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter routes that have active orders or require bottles
  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const matchesSearch = 
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.driver_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // We show routes that have stops (even if 0 bottles for completeness, but prioritize those with deliveries)
      return matchesSearch;
    });
  }, [routes, searchQuery]);

  // Calculate live totals for the filtered drivers/routes
  const totals = useMemo(() => {
    let total1L = 0;
    let total500ml = 0;
    let totalStops = 0;

    filteredRoutes.forEach((route) => {
      total1L += route.dispatch_bottles_1L || 0;
      total500ml += route.dispatch_bottles_500ml || 0;
      totalStops += route.stops?.length || 0;
    });

    return {
      total1L,
      total500ml,
      grandTotal: total1L + total500ml,
      totalStops,
    };
  }, [filteredRoutes]);

  // Helper to generate a colorful initials avatar for riders
  const getInitialsAvatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-xs font-black text-primary shadow-2xs">
        {initials || "RD"}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* 1. Filtering & Stats Header */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-5 rounded-3xl border border-silver/50 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
          <input
            type="text"
            placeholder="Search by rider or route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-silver/10 border border-silver/30 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all text-charcoal"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-primary/5 border border-primary/10 px-4 py-2 rounded-2xl flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            <span className="text-xs font-black text-charcoal/80">
              {filteredRoutes.length} Riders Listed
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Table / List Card */}
      <div className="bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-silver/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-charcoal/10 mx-auto mb-3" />
            <h3 className="text-sm font-black text-charcoal/60 mb-1">No dispatch records found</h3>
            <p className="text-xs text-charcoal/40 font-medium">
              Try adjusting your search query or verify that routes have been created for today.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-silver/40 bg-silver/5">
                  <th className="p-5 text-[10px] font-black uppercase tracking-wider text-charcoal/40">Rider</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-wider text-charcoal/40">Route</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-wider text-charcoal/40 text-center">1L Bottles</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-wider text-charcoal/40 text-center">500ml Bottles</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-wider text-charcoal/40 text-center">Total Bottles</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-wider text-charcoal/40 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/20">
                {filteredRoutes.map((route) => {
                  const b1L = route.dispatch_bottles_1L || 0;
                  const b500 = route.dispatch_bottles_500ml || 0;
                  const totalRouteBottles = b1L + b500;

                  return (
                    <tr key={route.id} className="hover:bg-silver/5 transition-colors">
                      {/* Rider Column */}
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          {getInitialsAvatar(route.driver_name)}
                          <div>
                            <h4 className="text-xs font-black text-charcoal">{route.driver_name}</h4>
                            <span className="text-[9px] text-charcoal/40 font-bold uppercase tracking-wider">
                              Rider Profile Active
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Route Column */}
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-3.5 h-3.5 text-primary opacity-60" />
                          <div>
                            <h5 className="text-xs font-bold text-charcoal">{route.name}</h5>
                            <span className="text-[10px] text-charcoal/40 font-medium">
                              {route.stops?.length || 0} stops assigned
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 1L Bottle Column */}
                      <td className="p-5 text-center">
                        {b1L > 0 ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-3xs">
                            {b1L}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-charcoal/20">—</span>
                        )}
                      </td>

                      {/* 500ml Bottle Column */}
                      <td className="p-5 text-center">
                        {b500 > 0 ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-black bg-blue-50 border border-blue-100 text-blue-700 shadow-3xs">
                            {b500}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-charcoal/20">—</span>
                        )}
                      </td>

                      {/* Total Bottle Column */}
                      <td className="p-5 text-center">
                        {totalRouteBottles > 0 ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-black bg-primary/10 border border-primary/20 text-primary">
                            {totalRouteBottles}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-charcoal/20">—</span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="p-5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          route.is_completed 
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        }`}>
                          {route.is_completed ? "Completed" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Grand Totals Summary Card */}
      {!isLoading && filteredRoutes.length > 0 && (
        <div className="bg-gradient-to-r from-primary to-primary-hover p-6 rounded-3xl text-white shadow-xl shadow-primary/20 border border-primary/20 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-base font-black flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Daily Dispatch Totals
            </h3>
            <p className="text-white/70 text-xs font-medium mt-1">
              Sum of all bottles across the {filteredRoutes.length} listed routes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-center md:justify-end">
            {/* 1L Total */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl min-w-[100px] text-center">
              <span className="block text-[9px] font-black uppercase tracking-widest text-white/60">
                Total 1L Bottles
              </span>
              <span className="text-xl font-black block mt-0.5">{totals.total1L}</span>
            </div>

            {/* 500ml Total */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl min-w-[100px] text-center">
              <span className="block text-[9px] font-black uppercase tracking-widest text-white/60">
                Total 500ml
              </span>
              <span className="text-xl font-black block mt-0.5">{totals.total500ml}</span>
            </div>

            {/* Grand Total */}
            <div className="bg-white px-6 py-3 rounded-2xl min-w-[120px] text-center shadow-lg">
              <span className="block text-[9px] font-black uppercase tracking-widest text-primary/60">
                Grand Total
              </span>
              <span className="text-xl font-black block mt-0.5 text-primary">{totals.grandTotal}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchSummaryTab;
