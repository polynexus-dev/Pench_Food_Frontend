import React, { useState } from "react";
import {
  Calendar,
  CreditCard,
  Package,
  CalendarRange,
  PlusCircle,
  Clock,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  MapPin,
  Gift,
  Copy,
  Check,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import CreateOrderModal from "../../orders/components/modals/CreateOrderModal";

const CustomerDashboard = () => {
  const { user } = useAuthStore();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [leaves, setLeaves] = useState([
    { id: 1, startDate: "2026-06-01", endDate: "2026-06-05", status: "Approved" },
  ]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledMessage, setScheduledMessage] = useState<string | null>(null);

  // Delivery instruction states
  const [bellSilent, setBellSilent] = useState(false);
  const [dropoffLoc, setDropoffLoc] = useState("Doorstep");
  const [specialInstruction, setSpecialInstruction] = useState("");
  const [prefSaveMsg, setPrefSaveMsg] = useState(false);

  // Referral states
  const [copied, setCopied] = useState(false);
  const refCode = "PENCH-CRM-99NAG";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSaveMsg(true);
    setTimeout(() => setPrefSaveMsg(false), 3000);
  };

  const handleScheduleLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setIsScheduling(true);
    setTimeout(() => {
      const newLeave = {
        id: Date.now(),
        startDate,
        endDate,
        status: "Approved",
      };
      setLeaves([newLeave, ...leaves]);
      setStartDate("");
      setEndDate("");
      setIsScheduling(false);
      setScheduledMessage("Your vacation leave has been scheduled and deliveries will pause automatically!");
      setTimeout(() => setScheduledMessage(null), 5000);
    }, 800);
  };

  return (
    <div className="p-8 space-y-8 bg-milk-white min-h-screen">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-silver/50 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest mb-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Customer Portal
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal tracking-tight">
            Hello, {user?.first_name || user?.username || "Valued Customer"}!
          </h1>
          <p className="text-charcoal/60 mt-1 text-sm">
            Manage your daily milk subscriptions, pause deliveries for vacation, and track returnable bottles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="px-5 py-3.5 bg-primary text-white hover:bg-primary/95 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/15 transition-all active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            Place New Order
          </button>
          <div className="px-5 py-3 bg-primary/5 border border-primary/10 rounded-2xl flex flex-col items-center justify-center text-center shrink-0">
            <span className="text-[10px] font-black uppercase text-primary tracking-wider">Account Balance</span>
            <span className="text-2xl font-black text-primary mt-1">₹0.00</span>
          </div>
        </div>
      </div>

      {orderSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold rounded-2xl flex items-center gap-3 animate-pulse shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {orderSuccessMsg}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
          <div className="p-3 bg-primary/5 rounded-xl text-primary">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">Active Plan</span>
            <span className="text-lg font-black text-charcoal mt-1 block">2L Full Cream Milk</span>
            <span className="text-xs text-primary font-bold mt-1 block">Delivered Daily</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
          <div className="p-3 bg-amber-500/5 rounded-xl text-amber-500">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">Bottles in Possession</span>
            <span className="text-2xl font-black text-charcoal mt-1 block">3 Bottles</span>
            <span className="text-xs text-amber-500 font-bold mt-1 block">No Outstanding Penalty</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
          <div className="p-3 bg-emerald-500/5 rounded-xl text-emerald-500">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">Outstanding Deposits</span>
            <span className="text-2xl font-black text-charcoal mt-1 block">₹450.00</span>
            <span className="text-xs text-emerald-500 font-bold mt-1 block">Fully Refundable</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
          <div className="p-3 bg-rose-500/5 rounded-xl text-rose-500">
            <CalendarRange className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">Vacation / Pause Days</span>
            <span className="text-2xl font-black text-charcoal mt-1 block">{leaves.length > 0 ? "5 Days Scheduled" : "No Leaves"}</span>
            <span className="text-xs text-rose-500 font-bold mt-1 block">Deliveries Paused</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Schedule Vacation Leave */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
          <div className="border-b border-silver/30 pb-4">
            <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-primary" />
              Schedule Vacation Leave
            </h2>
            <p className="text-xs text-charcoal/60 mt-1">
              Pausing deliveries stops billing and milk dropping automatically.
            </p>
          </div>

          {scheduledMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {scheduledMessage}
            </div>
          )}

          <form onSubmit={handleScheduleLeave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/45 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/45 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isScheduling}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/10"
            >
              {isScheduling ? "Scheduling..." : "Schedule Delivery Pause"}
            </button>
          </form>

          {/* Leaves List */}
          <div className="space-y-2 mt-4">
            <span className="text-[10px] font-black uppercase text-charcoal/30 tracking-widest ml-1">Upcoming Suspensions</span>
            {leaves.length === 0 ? (
              <p className="text-xs text-charcoal/40 text-center py-4 bg-silver/5 rounded-2xl border border-dashed border-silver/50">
                No active or scheduled vacation leaves found.
              </p>
            ) : (
              leaves.map((leave) => (
                <div key={leave.id} className="p-3 bg-silver/10 border border-silver/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-charcoal">
                      {leave.startDate} to {leave.endDate}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {leave.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Delivery Drops & Orders */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm lg:col-span-2 space-y-6">
          <div className="border-b border-silver/30 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Recent Subscriptions Drops
              </h2>
              <p className="text-xs text-charcoal/60 mt-1">
                Your past 5 delivery logs across Pench Foods network.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-silver/30 text-left">
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Date</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Item Drop</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Volume</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider text-center">Containers</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/20">
                <tr className="hover:bg-silver/5">
                  <td className="py-4 text-xs font-bold text-charcoal">Today, 6:30 AM</td>
                  <td className="py-4 text-xs text-charcoal/80">Full Cream Fresh Milk</td>
                  <td className="py-4 text-xs font-bold text-charcoal">2 Liters</td>
                  <td className="py-4 text-xs text-center text-charcoal/60 font-semibold">1 Returned</td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold rounded-full">
                      Delivered
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-silver/5">
                  <td className="py-4 text-xs font-bold text-charcoal">Yesterday, 6:40 AM</td>
                  <td className="py-4 text-xs text-charcoal/80">Full Cream Fresh Milk</td>
                  <td className="py-4 text-xs font-bold text-charcoal">2 Liters</td>
                  <td className="py-4 text-xs text-center text-charcoal/60 font-semibold">1 Returned</td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold rounded-full">
                      Delivered
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-silver/5">
                  <td className="py-4 text-xs font-bold text-charcoal">May 20, 2026</td>
                  <td className="py-4 text-xs text-charcoal/80">Full Cream Fresh Milk</td>
                  <td className="py-4 text-xs font-bold text-charcoal">2 Liters</td>
                  <td className="py-4 text-xs text-center text-charcoal/60 font-semibold">1 Returned</td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold rounded-full">
                      Delivered
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-silver/5">
                  <td className="py-4 text-xs font-bold text-charcoal">May 19, 2026</td>
                  <td className="py-4 text-xs text-charcoal/80">Full Cream Fresh Milk</td>
                  <td className="py-4 text-xs font-bold text-charcoal">2 Liters</td>
                  <td className="py-4 text-xs text-center text-charcoal/60 font-semibold">2 Returned</td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold rounded-full">
                      Delivered
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-silver/5">
                  <td className="py-4 text-xs font-bold text-charcoal">May 18, 2026</td>
                  <td className="py-4 text-xs text-charcoal/80">Full Cream Fresh Milk</td>
                  <td className="py-4 text-xs font-bold text-charcoal">2 Liters</td>
                  <td className="py-4 text-xs text-center text-charcoal/60 font-semibold">0 Returned</td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 bg-rose-500/10 text-rose-700 text-[10px] font-bold rounded-full">
                      Not At Home
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NEW: Bottom features: Delivery Preferences & Referral Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Delivery Instructions Card */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
          <div className="border-b border-silver/30 pb-4">
            <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Delivery Instruction Preferences
            </h2>
            <p className="text-xs text-charcoal/60 mt-1">
              Customize drop-off location and morning alert protocols for our riders.
            </p>
          </div>

          {prefSaveMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Rider drop instructions updated successfully!
            </div>
          )}

          <form onSubmit={handleSavePreferences} className="space-y-5">
            {/* Morning Bell Toggle */}
            <div className="p-4 bg-silver/5 border border-silver/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${bellSilent ? "bg-amber-100 text-amber-700" : "bg-primary/5 text-primary"}`}>
                  {bellSilent ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-charcoal">Silent Morning Drop</h4>
                  <p className="text-[10px] text-charcoal/50 font-bold mt-0.5">Do not ring the doorbell before 7:30 AM</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBellSilent(!bellSilent)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                  bellSilent ? "bg-amber-500 justify-end" : "bg-silver/40 justify-start"
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-xs" />
              </button>
            </div>

            {/* Drop Location */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">Drop Location</label>
              <div className="grid grid-cols-3 gap-3">
                {["Doorstep", "Guard Room", "Delivery Box"].map((loc) => {
                  const isSel = dropoffLoc === loc;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setDropoffLoc(loc)}
                      className={`py-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        isSel
                          ? "bg-primary/10 border-primary text-primary shadow-xs"
                          : "bg-white border-silver/50 text-charcoal/60 hover:bg-silver/5"
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Driver Instruction Text */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">Rider Note</label>
              <textarea
                value={specialInstruction}
                onChange={(e) => setSpecialInstruction(e.target.value)}
                placeholder="e.g. Please leave the bottles inside the insulated bag near the gate planter..."
                className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all h-20 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-charcoal text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-charcoal/95 active:scale-[0.98] transition-all cursor-pointer"
            >
              Save Rider Preferences
            </button>
          </form>
        </div>

        {/* Right: Referral rewards cockpit */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="border-b border-silver/30 pb-4">
            <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Refer & Earn Rewards
            </h2>
            <p className="text-xs text-charcoal/60 mt-1">
              Invite friends to Pench Foods. You both get ₹100 added to your wallets!
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-primary/5 to-amber-500/5 border border-primary/10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-primary/70 tracking-widest">Your Referral Code</span>
              <div className="text-xl font-black text-charcoal tracking-wider mt-1">{refCode}</div>
            </div>
            <button
              onClick={handleCopyCode}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                copied ? "bg-emerald-500 text-white" : "bg-primary text-white hover:bg-primary/95"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>

          <div className="space-y-3.5">
            <span className="text-[10px] font-black uppercase text-charcoal/30 tracking-widest block ml-1">Referral History</span>
            
            <div className="space-y-2">
              <div className="p-3 bg-silver/10 border border-silver/30 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-charcoal">Amit Sharma</h4>
                  <p className="text-[9px] text-charcoal/50 mt-0.5">Joined May 19, 2026</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  + ₹100 Received
                </span>
              </div>

              <div className="p-3 bg-silver/10 border border-silver/30 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-charcoal">Rohan Verma</h4>
                  <p className="text-[9px] text-charcoal/50 mt-0.5">Joined May 15, 2026</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  + ₹100 Received
                </span>
              </div>
          </div>
        </div>
      </div>
      </div>
      <CreateOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={(msg) => {
          setOrderSuccessMsg(msg);
          setTimeout(() => setOrderSuccessMsg(null), 5000);
        }}
      />
    </div>
  );
};

export default CustomerDashboard;
