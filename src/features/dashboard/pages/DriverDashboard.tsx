import React, { useState } from "react";
import {
  Calendar,
  Truck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  ClipboardList,
  User,
  Coffee,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";

const DriverDashboard = () => {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState([
    { id: 1, date: "2026-05-28", reason: "Personal work", status: "Approved" },
  ]);
  const [leaveDate, setLeaveDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState<string | null>(null);

  const stats = [
    { title: "Monthly Payout", value: "₹18,500", detail: "Active Tier A", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
    { title: "Shifts Completed", value: "24 Runs", detail: "100% On-time", icon: Clock, color: "text-primary bg-primary/5" },
    { title: "Containers Recovered", value: "84 Bottles", detail: "98% Return Rate", icon: CheckCircle2, color: "text-amber-500 bg-amber-50" },
    { title: "Average Rating", value: "4.9 / 5.0", detail: "Excellent", icon: User, color: "text-charcoal bg-silver/20" },
  ];

  const assignedRun = [
    { stop: 1, name: "Suresh Gupta", address: "Flat 402, Royal Enclave", item: "Paneer · 1 Kg", status: "Paused (Vacation)" },
    { stop: 2, name: "Amit Sharma", address: "Row House 3, Green Woods", item: "Full Cream Milk · 2L", status: "Delivered (6:30 AM)" },
    { stop: 3, name: "Rohan Verma", address: "Flat 102, Shanti Vihar", item: "Skimmed Milk · 1L", status: "Delivered (6:42 AM)" },
    { stop: 4, name: "Priya Patel", address: "Flat 506, Sunrise Towers", item: "Organic Ghee · 1 Jar", status: "Scheduled" },
  ];

  const handleRequestLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate || !reason) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newLeave = {
        id: Date.now(),
        date: leaveDate,
        reason,
        status: "Pending",
      };
      setLeaves([newLeave, ...leaves]);
      setLeaveDate("");
      setReason("");
      setIsSubmitting(false);
      setLeaveMsg("Your shift off-duty request has been submitted for distributor approval!");
      setTimeout(() => setLeaveMsg(null), 5000);
    }, 800);
  };

  return (
    <div className="p-8 space-y-8 bg-milk-white min-h-screen">
      {/* Driver Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-silver/50 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest mb-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Driver Employee Portal
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal tracking-tight">
            Welcome back, {user?.first_name || user?.username || "Delivery Hero"}!
          </h1>
          <p className="text-charcoal/60 mt-1 text-sm">
            Check your morning allocations, track monthly shift payouts, log attendance, and submit leave requests.
          </p>
        </div>
        <div className="px-5 py-3.5 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3 shrink-0">
          <Truck className="w-8 h-8 text-primary shrink-0" />
          <div>
            <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Assigned Fleet</span>
            <span className="text-sm font-black text-charcoal">MH-40-AQ-9912 (Suzuki Carry)</span>
          </div>
        </div>
      </div>

      {/* Driver Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm flex items-start gap-4 hover:shadow-md transition-all">
            <div className={`p-3 rounded-xl shrink-0 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">{stat.title}</span>
              <span className="text-2xl font-black text-charcoal mt-1 block">{stat.value}</span>
              <span className="text-xs text-charcoal/60 font-medium mt-1 block">{stat.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Active Run Allocation Sheet */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm lg:col-span-2 space-y-6">
          <div className="border-b border-silver/30 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Today's Dispatch Sheet
              </h2>
              <p className="text-xs text-charcoal/60 mt-1">
                Your assigned sequenced delivery drops for Nagpur South - Zone 3.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 text-xs font-black rounded-full uppercase tracking-wider">
              Active Run
            </span>
          </div>

          <div className="space-y-3.5">
            {assignedRun.map((stop) => {
              const isDelivered = stop.status.includes("Delivered");
              const isPaused = stop.status.includes("Paused");
              return (
                <div
                  key={stop.stop}
                  className="p-4 bg-silver/5 hover:bg-silver/10 border border-silver/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-xl bg-charcoal text-white flex items-center justify-center text-xs font-black shrink-0">
                      {stop.stop}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-charcoal">{stop.name}</h4>
                      <p className="text-xs text-charcoal/50 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                        {stop.address}
                      </p>
                      <span className="inline-block mt-2 px-2.5 py-0.5 bg-white border border-silver rounded-lg text-[10px] font-bold text-charcoal/80">
                        {stop.item}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider self-start md:self-auto ${
                      isDelivered
                        ? "bg-emerald-500/10 text-emerald-700"
                        : isPaused
                        ? "bg-silver text-charcoal/50"
                        : "bg-primary/10 text-primary animate-pulse"
                    }`}
                  >
                    {stop.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Attendance and Leave Planner */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
          <div className="border-b border-silver/30 pb-4">
            <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
              <Coffee className="w-5 h-5 text-primary" />
              Request Off-Duty Leave
            </h2>
            <p className="text-xs text-charcoal/60 mt-1">
              Submit planned leaves for scheduling dispatch coverage.
            </p>
          </div>

          {leaveMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {leaveMsg}
            </div>
          )}

          <form onSubmit={handleRequestLeave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">Date Off</label>
              <input
                type="date"
                required
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">Reason for Leave</label>
              <input
                type="text"
                required
                placeholder="e.g. Family function, health checkup..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/10"
            >
              {isSubmitting ? "Submitting..." : "Apply Leave"}
            </button>
          </form>

          {/* Leaves List */}
          <div className="space-y-2 mt-4 pt-4 border-t border-silver/30">
            <span className="text-[10px] font-black uppercase text-charcoal/30 tracking-widest ml-1">Off-Duty Logs</span>
            {leaves.length === 0 ? (
              <p className="text-xs text-charcoal/40 text-center py-4 bg-silver/5 rounded-2xl border border-dashed border-silver/50">
                No past leaves requested.
              </p>
            ) : (
              leaves.map((leave) => (
                <div key={leave.id} className="p-3 bg-silver/10 border border-silver/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-charcoal block">{leave.date}</span>
                    <span className="text-[10px] text-charcoal/50 block mt-0.5">{leave.reason}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      leave.status === "Approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800 animate-pulse"
                    }`}
                  >
                    {leave.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
