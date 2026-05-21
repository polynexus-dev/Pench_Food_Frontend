import React from "react";
import {
  Layers,
  CheckCircle2,
  RotateCcw,
  IndianRupee,
  TrendingUp,
  BarChart3,
  Sparkles,
} from "lucide-react";

interface InventoryDashboardTabProps {
  stats: {
    total: number;
    activeCount: number;
    returnableCount: number;
    avgPrice: string;
    packageTypes: Record<string, number>;
  };
  onSimulateOptimization: () => void;
  isOptimizing: boolean;
}

const InventoryDashboardTab: React.FC<InventoryDashboardTabProps> = ({
  stats,
  onSimulateOptimization,
  isOptimizing,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Premium Live Metrics Counter Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Variants Card */}
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <Layers className="w-24 h-24 text-charcoal" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Total Catalog SKUs</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-charcoal tracking-tight">{stats.total}</span>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">Variants</span>
          </div>
          <div className="mt-2 text-[10px] text-charcoal/40 font-medium">Synced item parameters</div>
        </div>

        {/* Active Products Card */}
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <CheckCircle2 className="w-24 h-24 text-emerald-600" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Active Status</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-600 tracking-tight">{stats.activeCount}</span>
            <span className="text-xs font-bold text-charcoal/40">/ {stats.total}</span>
          </div>
          <div className="w-full bg-silver/30 rounded-full h-1 mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${stats.total > 0 ? (stats.activeCount / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Returnable Items Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <RotateCcw className="w-24 h-24 text-amber-600" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Returnable Packaging</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-600 tracking-tight">{stats.returnableCount}</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
              Bottles/Pots
            </span>
          </div>
          <div className="mt-2 text-[10px] text-charcoal/40 font-medium">Deposit enabled items</div>
        </div>

        {/* Average Unit Price */}
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <IndianRupee className="w-24 h-24 text-primary" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Mean Base Pricing</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-base font-bold text-charcoal/40">₹</span>
            <span className="text-3xl font-black text-charcoal tracking-tight">{stats.avgPrice}</span>
          </div>
          <div className="mt-2 text-[10px] text-primary font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Retail index average
          </div>
        </div>
      </div>

      {/* Deep Insights Breakdown Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Packaging Readiness Proportion Chart */}
        <div className="bg-white p-6 rounded-2xl border border-silver/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-charcoal">Packaging Readiness Split</h3>
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-[11px] text-charcoal/50 mb-4">Proportion of SKU variant formats across primary dairy distributions.</p>

            <div className="space-y-3">
              {Object.entries(stats.packageTypes).map(([label, count]) => {
                const ratio = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={label} className="text-xs">
                    <div className="flex justify-between items-center mb-1 font-bold">
                      <span className="text-charcoal/80">{label}</span>
                      <span className="text-charcoal">{count} SKU ({ratio.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-silver/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          label.includes("Bottle") ? "bg-primary" : label.includes("Pot") ? "bg-amber-500" : "bg-sage"
                        }`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-silver/40 flex items-center justify-between text-[11px] text-charcoal/50 font-medium">
            <span>Active SKU count: {stats.activeCount}</span>
            <span className="text-primary font-bold">Live Synced</span>
          </div>
        </div>

        {/* Quick Calibration Action Desk */}
        <div className="bg-gradient-to-br from-[#1a2e21] to-[#0a140d] text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden lg:col-span-2">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
            <Sparkles className="w-64 h-64 text-accent" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-white/10 rounded-md text-accent border border-white/5 inline-block mb-3">
              System Autopricing
            </span>
            <h3 className="text-xl font-black tracking-tight text-white">Dynamic Pricing Calibration Desk</h3>
            <p className="text-xs text-white/70 max-w-md mt-1.5 leading-relaxed font-medium">
              Review regional distribution weights and optimize localized base parameters automatically according to dynamic wholesale stock levels and returnable crate buffer deposits.
            </p>

            {/* Sub-metrics inside dark header */}
            <div className="grid grid-cols-2 gap-4 mt-6 max-w-sm">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-black">Returns Deposit Ratio</div>
                <div className="text-base font-black text-accent mt-0.5">
                  {stats.total > 0 ? ((stats.returnableCount / stats.total) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-white/40 uppercase font-black">Variant Integrity</div>
                <div className="text-base font-black text-emerald-400 mt-0.5">Optimal</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] text-white/50 font-medium">
              Last automated pass: <span className="text-white/80 font-bold">Today, 04:00 AM</span>
            </span>
            <button
              onClick={onSimulateOptimization}
              disabled={isOptimizing}
              className="px-4 py-2.5 bg-accent text-primary font-black text-xs rounded-xl hover:bg-accent/90 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isOptimizing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Calibrating Indices...
                </>
              ) : (
                <>Simulate Automatic Calibration</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboardTab;
