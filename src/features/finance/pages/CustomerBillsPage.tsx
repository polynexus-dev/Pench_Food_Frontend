import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";
import { financeApi, submitPayUCheckoutForm } from "../api/financeApi";
import type { MonthlyBill, BillStatus } from "../components/types";
import { BillBreakdownSection } from "../components/BillBreakdownSection";

const fmt = (n: number | string | undefined) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtMonth = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const billStatusStyle = (s: BillStatus) => {
  switch (s) {
    case "paid":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "partial":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "cancelled":
      return "bg-silver/30 text-charcoal/50 border-silver";
    default:
      return "bg-rose-100 text-rose-800 border-rose-200";
  }
};

const CustomerBillsPage: React.FC = () => {
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PayU Bill Payment Modal state
  const [payBillTarget, setPayBillTarget] = useState<MonthlyBill | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>("");
  const [isInitiatingPayU, setIsInitiatingPayU] = useState(false);

  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getMonthlyBills();
      const data = res.data as MonthlyBill[] | { results?: MonthlyBill[] };
      const list = Array.isArray(data) ? data : data.results ?? [];
      setBills(list);
      if (list.length > 0 && !expandedBillId) {
        setExpandedBillId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch monthly bills:", err);
      setErrorMsg("Could not load your monthly bills. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payStatus = params.get("status");
    const txnid = params.get("txnid");
    const msg = params.get("msg");

    const init = async () => {
      if (txnid) {
        try {
          await financeApi.getPayUStatus(txnid, true);
        } catch (err) {
          console.warn("PayU status check error:", err);
        }
      }
      if (payStatus === "success") {
        setSuccessMsg(`Bill payment successful!${txnid ? ` (Ref: ${txnid})` : ""}`);
      } else if (payStatus === "failed") {
        setErrorMsg(`Payment failed${msg ? `: ${msg}` : ""}${txnid ? ` (Ref: ${txnid})` : ""}`);
      }
      if (payStatus || txnid) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      await loadBills();
    };

    init();
  }, []);

  const totalOutstanding = useMemo(() => {
    return bills
      .filter((b) => b.status !== "cancelled" && b.status !== "paid")
      .reduce((acc, b) => acc + Number(b.remaining_amount || 0), 0);
  }, [bills]);

  const latestTransaction = useMemo(() => {
    const allTxns = bills.flatMap((b) =>
      (b.transactions || []).map((t) => ({
        ...t,
        invoice_number: b.invoice_number,
      }))
    );
    if (allTxns.length === 0) return null;
    allTxns.sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    );
    return allTxns[0];
  }, [bills]);

  const handleDownloadPdf = async (bill: MonthlyBill) => {
    setDownloadingId(bill.id);
    try {
      await financeApi.downloadInvoicePdf(bill.id, bill.invoice_number);
    } catch {
      alert("Failed to download PDF invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenPayBill = (bill: MonthlyBill) => {
    setPayBillTarget(bill);
    setPayAmountInput(Number(bill.remaining_amount || 0).toFixed(2));
  };

  const handleConfirmPayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payBillTarget) return;
    const rem = Number(payBillTarget.remaining_amount || 0);
    const amountNum = Number(payAmountInput || rem);
    if (!amountNum || amountNum <= 0 || amountNum > rem) {
      alert(`Please enter an amount between ₹1.00 and ₹${rem.toFixed(2)}.`);
      return;
    }

    setIsInitiatingPayU(true);
    try {
      const res = await financeApi.initiatePayU({
        bill_id: payBillTarget.id,
        amount: amountNum,
        frontend_redirect_url: window.location.origin + window.location.pathname,
      });
      submitPayUCheckoutForm(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to initiate PayU checkout.");
      setIsInitiatingPayU(false);
    }
  };

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
            Review monthly subscription statements, mid-month extra orders, packing & handling charges, and pay online via PayU.
          </p>
        </div>
        <button
          onClick={loadBills}
          className="px-4 py-2.5 bg-white border border-silver/60 hover:bg-silver/10 rounded-2xl text-xs font-bold text-charcoal flex items-center gap-2 self-start md:self-auto cursor-pointer transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${loading ? "animate-spin" : ""}`} />
          Refresh Statements
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Outstanding Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-primary/5 rounded-xl text-primary">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">
              Current Outstanding Balance
            </span>
            <span className="text-2xl font-black text-charcoal mt-1 block">
              {fmt(totalOutstanding)}
            </span>
            <span className={`text-xs font-bold mt-1 block ${totalOutstanding > 0 ? "text-rose-600" : "text-primary"}`}>
              {totalOutstanding > 0
                ? "Unpaid balance due — pay anytime via PayU"
                : "All invoices fully settled"}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-silver/50 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-500/5 rounded-xl text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider block">
              Last Payment Settled
            </span>
            <span className="text-2xl font-black text-charcoal mt-1 block">
              {latestTransaction ? fmt(latestTransaction.amount) : "₹0.00"}
            </span>
            <span className="text-xs text-emerald-600 font-bold mt-1 block">
              {latestTransaction
                ? `Paid via ${latestTransaction.payment_method.toUpperCase()} on ${fmtDate(latestTransaction.payment_date)}`
                : "No recent bill payments recorded"}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
        <div className="border-b border-silver/30 pb-4">
          <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Monthly Invoice Statements
          </h2>
          <p className="text-xs text-charcoal/60 mt-1">
            Click on any invoice to inspect the 4-section itemized breakdown, pay online, or download the PDF statement.
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : bills.length === 0 ? (
          <div className="py-12 text-center text-sm text-charcoal/40 font-semibold border border-dashed border-silver rounded-2xl">
            No monthly invoices generated for your account yet.
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => {
              const isExpanded = expandedBillId === bill.id;
              const remNum = Number(bill.remaining_amount || 0);
              const handlingNum = Number(bill.handling_fee || 0);
              const canPay = bill.status !== "paid" && bill.status !== "cancelled" && remNum > 0;

              return (
                <div
                  key={bill.id}
                  className="border border-silver/60 rounded-2xl overflow-hidden transition-all hover:border-primary/40"
                >
                  {/* Summary Header Row */}
                  <div
                    onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                    className="p-5 bg-white hover:bg-silver/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-primary">
                            {bill.invoice_number}
                          </span>
                          <span className="text-xs font-extrabold text-charcoal">
                            · {fmtMonth(bill.billing_month)}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full border ${billStatusStyle(
                              bill.status
                            )}`}
                          >
                            {bill.status_display}
                          </span>
                        </div>
                        <div className="text-xs text-charcoal/50 font-medium mt-1 flex flex-wrap gap-x-3">
                          <span>Due Date: {fmtDate(bill.due_date)}</span>
                          {handlingNum > 0 && (
                            <span>· Includes {fmt(handlingNum)} Packing & Handling Charges</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-silver/30">
                      <div className="text-left lg:text-right">
                        <div className="text-sm font-black text-charcoal">
                          Total: {fmt(bill.total_amount)}
                        </div>
                        {Number(bill.amount_paid || 0) > 0 && (
                          <div className="text-[11px] font-bold text-emerald-600">
                            Paid: {fmt(bill.amount_paid)}
                          </div>
                        )}
                        {remNum > 0 && (
                          <div className="text-xs font-black text-rose-600">
                            Balance Due: {fmt(remNum)}
                          </div>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canPay && (
                          <button
                            onClick={() => handleOpenPayBill(bill)}
                            className="px-3.5 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pay Bill
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadPdf(bill)}
                          disabled={downloadingId === bill.id}
                          className="px-3 py-2 text-primary hover:bg-primary/5 rounded-xl border border-primary/20 transition-all cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
                        >
                          {downloadingId === bill.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          PDF
                        </button>
                        <button
                          onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                          className="p-2 text-charcoal/50 hover:text-charcoal rounded-xl hover:bg-silver/20 cursor-pointer"
                          title="Toggle itemized breakdown"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded 4-Section Breakdown */}
                  {isExpanded && (
                    <div className="p-5 bg-silver/5 border-t border-silver/40 space-y-4">
                      <BillBreakdownSection breakdown={bill.orders_breakdown} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PayU Bill Payment Modal */}
      {payBillTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl border border-silver/50 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-silver/40 pb-3">
              <div>
                <h3 className="text-base font-black text-charcoal flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Pay Invoice {payBillTarget.invoice_number}
                </h3>
                <p className="text-[11px] text-charcoal/50 mt-0.5">
                  {fmtMonth(payBillTarget.billing_month)} · Powered by PayU
                </p>
              </div>
              <button
                onClick={() => setPayBillTarget(null)}
                className="p-1.5 rounded-xl hover:bg-silver/20 text-charcoal/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayBill} className="space-y-4">
              <div className="p-3.5 bg-silver/10 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-charcoal font-bold">
                  <span>Net Monthly Bill Total</span>
                  <span>{fmt(payBillTarget.total_amount)}</span>
                </div>
                {Number(payBillTarget.handling_fee || 0) > 0 && (
                  <div className="flex justify-between text-charcoal/60 font-medium">
                    <span>Includes Packing & Handling Charges</span>
                    <span>{fmt(payBillTarget.handling_fee)}</span>
                  </div>
                )}
                {Number(payBillTarget.amount_paid || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Already Paid</span>
                    <span>- {fmt(payBillTarget.amount_paid)}</span>
                  </div>
                )}
                <div className="flex justify-between text-primary font-black border-t border-silver/40 pt-1.5 text-sm">
                  <span>Remaining Balance Due</span>
                  <span>{fmt(payBillTarget.remaining_amount)}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-charcoal/60 block mb-1">
                  Amount to Pay Now (₹) — Full or Partial
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={Number(payBillTarget.remaining_amount || 0)}
                  required
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-silver rounded-xl text-sm font-bold text-charcoal focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPayBillTarget(null)}
                  className="flex-1 py-2.5 border border-silver rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInitiatingPayU}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isInitiatingPayU ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5" />
                  )}
                  {isInitiatingPayU
                    ? "Redirecting..."
                    : `Pay ₹${Number(payAmountInput || 0).toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerBillsPage;
