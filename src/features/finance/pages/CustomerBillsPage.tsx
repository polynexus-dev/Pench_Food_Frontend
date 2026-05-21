import React from "react";
import {
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

const CustomerBillsPage = () => {
  const invoices = [
    { id: "INV-2026-004", period: "May 1 - May 15, 2026", total: "₹1,950.00", status: "Paid", datePaid: "2026-05-16" },
    { id: "INV-2026-003", period: "Apr 16 - Apr 30, 2026", total: "₹2,100.00", status: "Paid", datePaid: "2026-05-01" },
    { id: "INV-2026-002", period: "Apr 1 - Apr 15, 2026", total: "₹1,800.00", status: "Paid", datePaid: "2026-04-16" },
  ];

  return (
    <div className="p-8 space-y-8 bg-milk-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-silver/50 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-3xl font-extrabold text-charcoal tracking-tight flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-primary" />
            My Bills & Invoices
          </h1>
          <p className="text-charcoal/60 mt-1 text-sm">
            Monitor active balances, review recurring dairy transaction receipts, and download invoices.
          </p>
        </div>
      </div>

      {/* Outstanding Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-primary/5 rounded-xl text-primary">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">Current Outstanding Balance</span>
            <span className="text-2xl font-black text-charcoal mt-1 block">₹0.00</span>
            <span className="text-xs text-primary font-bold mt-1 block">All invoices fully settled</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-500/5 rounded-xl text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">Last Payment Settled</span>
            <span className="text-2xl font-black text-charcoal mt-1 block">₹1,950.00</span>
            <span className="text-xs text-emerald-500 font-bold mt-1 block">Paid via UPI on May 16, 2026</span>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
        <div className="border-b border-silver/30 pb-4">
          <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Invoice Statements
          </h2>
          <p className="text-xs text-charcoal/60 mt-1">Select and download pdf copy of previous bills.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-silver/30 text-left">
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Invoice No.</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Billing Period</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Total Charge</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Payment Status</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Settled On</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/20">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-silver/5 transition-all">
                  <td className="py-4 text-xs font-black text-primary">{inv.id}</td>
                  <td className="py-4 text-xs font-bold text-charcoal">{inv.period}</td>
                  <td className="py-4 text-xs font-bold text-charcoal">{inv.total}</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-charcoal/60 font-semibold">{inv.datePaid}</td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => alert(`Downloading pdf statement for invoice ${inv.id}...`)}
                      className="p-2 text-primary hover:bg-primary/5 rounded-xl border border-primary/10 transition-all cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
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

export default CustomerBillsPage;
