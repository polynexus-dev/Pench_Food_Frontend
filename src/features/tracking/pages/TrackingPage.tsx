import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveTracking } from "../context/TrackingContext";
import TrackingDashboardTab from "../components/TrackingDashboardTab";
import TrackingHistoryTab from "../components/TrackingHistoryTab";
import { Radio, Maximize2, Sparkles, Navigation } from "lucide-react";

const TrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "history">("dashboard");
  const { isConnected, isSimulating, toggleSimulation } = useLiveTracking();

  return (
    <div className="max-w-8xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Top Banner and Navigation Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/20 rounded-2xl text-accent border border-accent/30 shadow-inner">
              <Radio className="w-8 h-8 animate-pulse text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-charcoal tracking-tight flex items-center gap-3">
                Live Fleet Tracking
                {activeTab === "dashboard" && (
                  <span className="text-xs font-black px-3 py-1 bg-primary/10 text-primary rounded-full tracking-widest uppercase flex items-center gap-1.5 border border-primary/20">
                    <span
                      className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                    ></span>
                    {isConnected ? "Live Broadcast" : "Offline"}
                  </span>
                )}
              </h1>
              <p className="text-charcoal/50 font-medium mt-1">
                Real-time WebSocket rider monitoring & historical GPS route logs tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Global Connection Statistics Controls */}
        <div className="flex items-center gap-3">
          <Link
            to="/tracking/map"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm border bg-primary text-white border-primary/90 hover:bg-primary/90 shadow-primary/20 text-xs cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            Fullscreen Map
          </Link>
          {activeTab === "dashboard" && (
            <button
              onClick={toggleSimulation}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm border text-xs cursor-pointer ${
                isSimulating
                  ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                  : "bg-white text-charcoal border-silver/50 hover:bg-silver/10"
              }`}
            >
              <Sparkles
                className={`w-4 h-4 ${isSimulating ? "text-amber-600 animate-spin" : "text-accent"}`}
              />
              {isSimulating ? "Stop Simulation" : "Simulate Live Broadcast"}
            </button>
          )}
        </div>
      </div>

      {/* Top-level Navigation Tabs */}
      <div className="border-b border-silver/60 mb-8 flex items-center gap-8 px-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "dashboard"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <Navigation className={`w-4 h-4 ${activeTab === "dashboard" ? "text-primary" : "text-charcoal/40"}`} />
          Live Monitoring Dashboard
          {activeTab === "dashboard" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "history"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <span className="text-base">🕒</span>
          Track Route History
          {activeTab === "history" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>
      </div>

      {/* Active Tab Component */}
      {activeTab === "dashboard" ? (
        <TrackingDashboardTab />
      ) : (
        <TrackingHistoryTab />
      )}
    </div>
  );
};

export default TrackingPage;
