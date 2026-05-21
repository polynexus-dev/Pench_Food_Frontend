import React from "react";
import {
  Package,
  CreditCard,
  AlertCircle,
  HelpCircle,
  Clock,
} from "lucide-react";

const CustomerContainerLedger = () => {
  return (
    <div className="p-8 space-y-8 bg-milk-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-silver/50 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-3xl font-extrabold text-charcoal tracking-tight flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            My Returnable Container Ledger
          </h1>
          <p className="text-charcoal/60 mt-1 text-sm">
            Track empty glass milk bottles in your possession, security deposits paid, and refund history.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-primary/5 rounded-xl text-primary">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">Bottles in Possession</span>
            <span className="text-2xl font-black text-charcoal mt-1 block">3 Glass Bottles</span>
            <span className="text-xs text-primary font-bold mt-1 block">Please return to driver at next drop</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-500/5 rounded-xl text-emerald-500">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">Total Deposits Paid</span>
            <span className="text-2xl font-black text-charcoal mt-1 block">₹450.00</span>
            <span className="text-xs text-emerald-500 font-bold mt-1 block">₹150.00 per bottle (Fully Refundable)</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-amber-500/5 rounded-xl text-amber-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">Unreturned Bottle Penalties</span>
            <span className="text-2xl font-black text-charcoal mt-1 block">₹0.00</span>
            <span className="text-xs text-amber-500 font-bold mt-1 block">No late penalty charges active</span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
        <div className="border-b border-silver/30 pb-4">
          <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Bottle Ledger Log History
          </h2>
          <p className="text-xs text-charcoal/60 mt-1">Audit trail of daily container delivery and collections.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-silver/30 text-left">
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Transaction Date</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Delivery Driver</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider text-center">Bottles Delivered</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider text-center">Empty Bottles Collected</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider text-center">Breakages Logged</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Container Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/20">
              <tr className="hover:bg-silver/5 transition-all">
                <td className="py-4 text-xs font-bold text-charcoal">Today, 6:30 AM</td>
                <td className="py-4 text-xs text-charcoal/80">Amit Wankhede</td>
                <td className="py-4 text-xs text-center font-bold text-primary">2 Bottles</td>
                <td className="py-4 text-xs text-center font-bold text-emerald-600">1 Bottle</td>
                <td className="py-4 text-xs text-center font-bold text-rose-600">0</td>
                <td className="py-4 text-xs font-black text-charcoal">3 Bottles (+1 net)</td>
              </tr>
              <tr className="hover:bg-silver/5 transition-all">
                <td className="py-4 text-xs font-bold text-charcoal">May 20, 2026</td>
                <td className="py-4 text-xs text-charcoal/80">Amit Wankhede</td>
                <td className="py-4 text-xs text-center font-bold text-primary">2 Bottles</td>
                <td className="py-4 text-xs text-center font-bold text-emerald-600">1 Bottle</td>
                <td className="py-4 text-xs text-center font-bold text-rose-600">0</td>
                <td className="py-4 text-xs font-black text-charcoal">2 Bottles (+1 net)</td>
              </tr>
              <tr className="hover:bg-silver/5 transition-all">
                <td className="py-4 text-xs font-bold text-charcoal">May 19, 2026</td>
                <td className="py-4 text-xs text-charcoal/80">Rahul Meshram</td>
                <td className="py-4 text-xs text-center font-bold text-primary">2 Bottles</td>
                <td className="py-4 text-xs text-center font-bold text-emerald-600">2 Bottles</td>
                <td className="py-4 text-xs text-center font-bold text-rose-600">0</td>
                <td className="py-4 text-xs font-black text-charcoal">1 Bottle (+0 net)</td>
              </tr>
              <tr className="hover:bg-silver/5 transition-all">
                <td className="py-4 text-xs font-bold text-charcoal">May 18, 2026</td>
                <td className="py-4 text-xs text-charcoal/80">Rahul Meshram</td>
                <td className="py-4 text-xs text-center font-bold text-primary">2 Bottles</td>
                <td className="py-4 text-xs text-center font-bold text-emerald-600">0 Bottles</td>
                <td className="py-4 text-xs text-center font-bold text-rose-600">0</td>
                <td className="py-4 text-xs font-black text-charcoal">1 Bottle (+2 net)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerContainerLedger;
