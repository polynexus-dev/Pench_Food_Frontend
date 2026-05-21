import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CreditCard, TrendingUp, IndianRupee, BadgeCheck,
  Clock, AlertTriangle, RefreshCw, Search, X,
  ChevronDown, ChevronUp, Plus, Trash2, Receipt,
  CalendarDays, CheckCircle2, CircleDashed, Zap,
  Download,
} from "lucide-react";
import { financeApi } from "../api/financeApi";
import type {
  MonthlyBill, FinanceTransaction, FinanceDashboardSummary, RecordPaymentPayload
} from "../components/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const statusStyle = (s: string) => {
  switch (s) {
    case "paid":    return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "partial": return "bg-amber-50 text-amber-700 border-amber-100";
    case "unpaid":  return "bg-rose-50 text-rose-700 border-rose-100";
    default:        return "bg-silver/30 text-charcoal/60 border-silver";
  }
};

// ─── Record Payment Modal ────────────────────────────────────────────────────

const RecordPaymentModal: React.FC<{
  bill: MonthlyBill;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ bill, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(bill.remaining_amount);
  const [method, setMethod] = useState("online");
  const [txnId, setTxnId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (Number(amount) <= 0) { setError("Amount must be greater than zero."); return; }
    setLoading(true);
    try {
      const payload: RecordPaymentPayload = {
        bill: bill.id, amount: Number(amount),
        payment_method: method, transaction_id: txnId, notes,
      };
      await financeApi.recordPayment(payload);
      onSuccess();
      onClose();
    } catch {
      setError("Failed to record payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-silver/50 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-silver/50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-charcoal flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Record Payment
            </h2>
            <p className="text-[11px] text-charcoal/50 mt-0.5">Invoice: {bill.invoice_number}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-silver/20 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-charcoal/50" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-silver/10 rounded-2xl border border-silver/50 grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-charcoal/40 font-bold uppercase tracking-wider block">Customer</span>
              <span className="font-black text-charcoal">{bill.customer_name}</span>
            </div>
            <div>
              <span className="text-charcoal/40 font-bold uppercase tracking-wider block">Outstanding</span>
              <span className="font-black text-rose-600">{fmt(bill.remaining_amount)}</span>
            </div>
            <div>
              <span className="text-charcoal/40 font-bold uppercase tracking-wider block">Total Bill</span>
              <span className="font-bold text-charcoal">{fmt(bill.total_amount)}</span>
            </div>
            <div>
              <span className="text-charcoal/40 font-bold uppercase tracking-wider block">Already Paid</span>
              <span className="font-bold text-emerald-600">{fmt(bill.amount_paid)}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Amount (₹)</label>
            <input
              type="number" step="0.01" min="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} required
              className="w-full text-sm font-bold px-4 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="Enter amount..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Method</label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full text-sm font-bold px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer">
                <option value="online">Online Transfer</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Txn Reference</label>
              <input type="text" value={txnId} onChange={e => setTxnId(e.target.value)}
                placeholder="Optional ref ID..."
                className="w-full text-sm font-medium px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional payment notes..."
              className="w-full text-sm font-medium px-3 py-2 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all" />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-silver rounded-xl text-sm font-bold text-charcoal hover:bg-silver/10 transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 px-4 bg-primary rounded-xl text-sm font-black text-white hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? "Recording..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Trigger Billing Modal ───────────────────────────────────────────────────

const TriggerBillingModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setResult(null); setLoading(true);
    try {
      const res = await financeApi.triggerBillingCycle(Number(year), Number(month));
      setResult((res.data as any).detail || "Billing cycle generated successfully.");
      onSuccess();
    } catch {
      setError("Failed to trigger billing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-silver/50 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-silver/50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-charcoal flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Generate Bills
            </h2>
            <p className="text-[11px] text-charcoal/50 mt-0.5">Run billing cycle for a specific period</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-silver/20 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-charcoal/50" />
          </button>
        </div>

        <form onSubmit={handleTrigger} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Month</label>
              <select value={month} onChange={e => setMonth(e.target.value)}
                className="w-full text-sm font-bold px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer">
                {MONTHS.map((m, i) => (
                  <option key={i+1} value={String(i+1)}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Year</label>
              <input type="number" value={year} onChange={e => setYear(e.target.value)} min="2020" max="2099"
                className="w-full text-sm font-bold px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
          </div>

          {result && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />{result}
            </div>
          )}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-silver rounded-xl text-sm font-bold text-charcoal hover:bg-silver/10 transition-all cursor-pointer">
              {result ? "Close" : "Cancel"}
            </button>
            {!result && (
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 px-4 bg-amber-500 rounded-xl text-sm font-black text-white hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? "Generating..." : "Run Billing"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Finance Page ───────────────────────────────────────────────────────

const FinancePage: React.FC = () => {
  const [summary, setSummary] = useState<FinanceDashboardSummary | null>(null);
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "partial" | "paid">("all");
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [paymentBill, setPaymentBill] = useState<MonthlyBill | null>(null);
  const [showTrigger, setShowTrigger] = useState(false);
  const [deletingTxn, setDeletingTxn] = useState<string | null>(null);
  const [downloadingBillId, setDownloadingBillId] = useState<string | null>(null);

  const handleDownloadPdf = async (bill: MonthlyBill) => {
    setDownloadingBillId(bill.id);
    try {
      await financeApi.downloadInvoicePdf(bill.id, bill.invoice_number);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      alert("Failed to download invoice PDF. Please try again.");
    } finally {
      setDownloadingBillId(null);
    }
  };

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setIsForbidden(false);
    try {
      const [sumRes, billsRes, txnRes] = await Promise.all([
        financeApi.getSummary(),
        financeApi.getMonthlyBills(),
        financeApi.getTransactions(),
      ]);
      setSummary(sumRes.data);
      setBills(billsRes.data);
      setTransactions(txnRes.data);
    } catch (err: any) {
      if (err?.response?.status === 403) setIsForbidden(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filteredBills = useMemo(() => {
    const q = search.toLowerCase().trim();
    return bills.filter(b => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.customer_name.toLowerCase().includes(q) ||
        b.invoice_number.toLowerCase().includes(q)
      );
    });
  }, [bills, search, statusFilter]);

  const handleDeleteTxn = async (txnId: string) => {
    setDeletingTxn(txnId);
    try {
      await financeApi.deleteTransaction(txnId);
      await loadAll();
    } finally {
      setDeletingTxn(null);
    }
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-8xl mx-auto pb-12 animate-pulse space-y-6">
        <div className="h-10 w-64 bg-silver/40 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-silver/30 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-silver/20 rounded-2xl" />
      </div>
    );
  }

  // ─── Access restricted ─────────────────────────────────────────────────────
  if (isForbidden) {
    return (
      <div className="max-w-8xl mx-auto pb-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-black text-charcoal mb-2">Access Restricted</h2>
          <p className="text-sm text-charcoal/50 font-medium">
            The Finance & Billing module requires <strong>Accountants</strong> or <strong>ERP_Admins</strong> group membership. Contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-xs">
            <CreditCard className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-charcoal tracking-tight">Finance & Billing</h1>
            <p className="text-charcoal/50 font-medium text-xs mt-0.5">
              Track receivables, record payments, and manage monthly billing cycles.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button onClick={() => setShowTrigger(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-xs cursor-pointer">
            <Zap className="w-3.5 h-3.5" /> Generate Bills
          </button>
          <button onClick={loadAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5 text-primary" /> Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Metrics Cards ── */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* Outstanding */}
          <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-rose-300/60 transition-colors">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <AlertTriangle className="w-24 h-24 text-rose-600" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Total Outstanding</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-rose-600 tracking-tight">{fmt(summary.total_outstanding)}</span>
            </div>
            <div className="mt-1 text-[10px] text-charcoal/40 font-medium">Pending receivables</div>
          </div>

          {/* Collected Today */}
          <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-emerald-300/60 transition-colors">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <IndianRupee className="w-24 h-24 text-emerald-600" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Collected Today</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-emerald-600 tracking-tight">{fmt(summary.collected_today)}</span>
            </div>
            <div className="mt-1 text-[10px] text-charcoal/40 font-medium">Payments recorded today</div>
          </div>

          {/* Total Bills */}
          <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-colors">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <BadgeCheck className="w-24 h-24 text-primary" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Billing Cycles</span>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-2xl font-black text-charcoal tracking-tight">{summary.total_bills}</span>
              <div className="text-[10px] space-y-0.5">
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> {summary.paid_count} Paid
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <CircleDashed className="w-3 h-3" /> {summary.partial_count} Partial
                </span>
              </div>
            </div>
            <div className="mt-1 text-[10px] text-charcoal/40 font-medium">{summary.unpaid_count} invoices unpaid</div>
          </div>

          {/* Collection Rate */}
          <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-amber-400/50 transition-colors">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-24 h-24 text-amber-600" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Collection Rate</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-amber-600 tracking-tight">{summary.collection_rate}%</span>
            </div>
            <div className="mt-1.5 w-full bg-silver/30 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-700"
                style={{ width: `${Math.min(100, summary.collection_rate)}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] text-charcoal/40 font-medium">{fmt(summary.total_collected)} of {fmt(summary.total_billed)} billed</div>
          </div>
        </div>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left: Bills Ledger ── */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-silver/60 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-silver/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-charcoal flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Invoice Ledger
              </h2>
              <p className="text-[11px] text-charcoal/40 mt-0.5">Click an invoice to see transactions and record payments</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Status filter pills */}
              {(["all", "unpaid", "partial", "paid"] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    statusFilter === s
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-silver/10 text-charcoal/60 border-silver/50 hover:border-primary/40"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="px-5 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/30" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search customer or invoice number..."
                className="w-full text-xs font-medium pl-9 pr-4 py-2 border border-silver rounded-xl bg-silver/10 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-charcoal/30"
              />
            </div>
          </div>

          {/* Table */}
          <div className="max-h-[520px] overflow-y-auto px-5 pb-5 mt-2 space-y-2">
            {filteredBills.length === 0 ? (
              <div className="py-16 text-center text-xs font-bold text-charcoal/30 border border-dashed border-silver rounded-2xl flex flex-col items-center gap-2">
                <CircleDashed className="w-8 h-8 text-charcoal/20" />
                No invoices found matching your criteria.
              </div>
            ) : (
              filteredBills.map(bill => {
                const isOpen = expandedBill === bill.id;
                const billTxns = transactions.filter(t => t.bill === bill.id);
                return (
                  <div key={bill.id} className="border border-silver/50 rounded-2xl overflow-hidden hover:border-silver transition-colors">
                    {/* Bill row header */}
                    <div
                      onClick={() => setExpandedBill(isOpen ? null : bill.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-silver/5 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                          {bill.customer_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-charcoal truncate">{bill.customer_name}</span>
                            <span className="text-[9px] font-bold bg-silver/30 text-charcoal/50 px-2 py-0.5 rounded-md shrink-0">{bill.invoice_number}</span>
                          </div>
                          <div className="text-[10px] text-charcoal/40 font-medium flex items-center gap-2 mt-0.5">
                            <CalendarDays className="w-3 h-3" />
                            {fmtDate(bill.billing_month)} · Due {fmtDate(bill.due_date)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs font-black text-charcoal">{fmt(bill.total_amount)}</div>
                          {Number(bill.remaining_amount) > 0 && (
                            <div className="text-[10px] font-bold text-rose-500">{fmt(bill.remaining_amount)} due</div>
                          )}
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${statusStyle(bill.status)}`}>
                          {bill.status_display}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-charcoal/30" /> : <ChevronDown className="w-4 h-4 text-charcoal/30" />}
                      </div>
                    </div>

                    {/* Expanded transaction rows + record payment */}
                    {isOpen && (
                      <div className="border-t border-silver/40 bg-silver/5 px-4 pb-4 pt-3 animate-in fade-in duration-200 space-y-3">
                        {billTxns.length === 0 ? (
                          <p className="text-[10px] font-bold text-charcoal/30 text-center py-2">No payments recorded yet.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {billTxns.map(txn => (
                              <div key={txn.id} className="flex items-center justify-between bg-white border border-silver/50 rounded-xl px-3 py-2 text-[10px]">
                                <div>
                                  <span className="font-black text-emerald-600">{fmt(txn.amount)}</span>
                                  <span className="ml-2 text-charcoal/40 font-medium capitalize">{txn.payment_method}</span>
                                  {txn.transaction_id && <span className="ml-2 text-charcoal/30">· {txn.transaction_id}</span>}
                                  {txn.notes && <span className="ml-2 text-charcoal/40 italic">"{txn.notes}"</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-charcoal/30">{fmtDate(txn.payment_date)}</span>
                                  <button
                                    onClick={() => handleDeleteTxn(txn.id)}
                                    disabled={deletingTxn === txn.id}
                                    className="p-1 rounded-lg hover:bg-rose-50 hover:text-rose-500 text-charcoal/30 transition-colors cursor-pointer disabled:opacity-40">
                                    {deletingTxn === txn.id
                                      ? <RefreshCw className="w-3 h-3 animate-spin" />
                                      : <Trash2 className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2.5">
                          <button
                            onClick={() => handleDownloadPdf(bill)}
                            disabled={downloadingBillId === bill.id}
                            className={`${
                              bill.status === "paid" || bill.status === "cancelled" ? "w-full" : "flex-1"
                            } flex items-center justify-center gap-2 py-2 border border-silver rounded-xl text-[11px] font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50`}
                          >
                            {downloadingBillId === bill.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-primary" />
                            )}
                            {downloadingBillId === bill.id ? "Downloading..." : "Download PDF"}
                          </button>

                          {bill.status !== "paid" && bill.status !== "cancelled" && (
                            <button
                              onClick={() => setPaymentBill(bill)}
                              className="flex-1 flex items-center justify-center gap-2 py-2 border border-dashed border-primary/40 rounded-xl text-[11px] font-bold text-primary hover:bg-primary/5 active:scale-95 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Record Payment
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Recent Transactions ── */}
        <div className="bg-white rounded-2xl border border-silver/60 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-silver/50">
            <h2 className="text-xs font-black uppercase tracking-wider text-charcoal flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Recent Payments
            </h2>
            <p className="text-[11px] text-charcoal/40 mt-0.5">Chronological audit trail of all receipts</p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[560px] p-5 space-y-2">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-charcoal/30 flex flex-col items-center gap-2">
                <Receipt className="w-8 h-8 text-charcoal/20" />
                No payment transactions recorded yet.
              </div>
            ) : (
              transactions.slice(0, 40).map(txn => {
                const bill = bills.find(b => b.id === txn.bill);
                return (
                  <div key={txn.id} className="p-3 border border-silver/40 rounded-xl bg-silver/5 space-y-1 hover:border-silver transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-600">{fmt(txn.amount)}</span>
                      <span className="text-[9px] font-bold bg-silver/30 text-charcoal/50 px-2 py-0.5 rounded-md capitalize">{txn.payment_method}</span>
                    </div>
                    <div className="text-[10px] text-charcoal/60 font-medium">
                      {bill?.customer_name ?? "Customer"} · {bill?.invoice_number ?? ""}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-charcoal/30 font-medium">
                      <span>{fmtDate(txn.payment_date)}</span>
                      {txn.transaction_id && <span className="font-bold text-charcoal/40">Ref: {txn.transaction_id}</span>}
                    </div>
                    {txn.notes && (
                      <div className="text-[9px] italic text-charcoal/40 truncate">"{txn.notes}"</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {paymentBill && (
        <RecordPaymentModal
          bill={paymentBill}
          onClose={() => setPaymentBill(null)}
          onSuccess={loadAll}
        />
      )}
      {showTrigger && (
        <TriggerBillingModal
          onClose={() => setShowTrigger(false)}
          onSuccess={loadAll}
        />
      )}
    </div>
  );
};

export default FinancePage;
