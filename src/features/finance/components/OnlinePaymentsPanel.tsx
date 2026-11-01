import React, { useState, useEffect, useCallback, useMemo } from "react";
import { isAxiosError } from "axios";
import {
  Smartphone, RefreshCw, Search, X, CheckCircle2, XCircle,
  Clock, AlertTriangle, Users, ImageOff, ExternalLink, CircleDashed,
  Eye, FileImage,
} from "lucide-react";
import { financeApi } from "../api/financeApi";
import type { OnlinePayment, OnlinePaymentStatus, OnlinePaymentSummary } from "./types";
import { resolveMediaUrl } from "../../../utils/constants";
import { useAuthStore } from "../../../store/useAuthStore";

// ─── Helpers ────────────────────────────────────────────────────────────────

const apiErrorDetail = (err: unknown, fallback: string) =>
  (isAxiosError(err) && err.response?.data?.detail) || fallback;

const fmt = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

const statusStyle = (s: OnlinePaymentStatus) => {
  switch (s) {
    case "verified": return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "rejected": return "bg-rose-50 text-rose-700 border-rose-100";
    default:         return "bg-amber-50 text-amber-700 border-amber-100";
  }
};

type FilterValue = OnlinePaymentStatus | "all";

// ─── Screenshot Preview Modal ────────────────────────────────────────────────

const ScreenshotModal: React.FC<{
  payment: OnlinePayment;
  tenant?: string | null;
  onClose: () => void;
  onVerify?: (payment: OnlinePayment) => void;
  onReject?: (payment: OnlinePayment) => void;
  isVerifying?: boolean;
}> = ({ payment, tenant, onClose, onVerify, onReject, isVerifying }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = resolveMediaUrl(payment.screenshot, tenant);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-silver/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-charcoal">{payment.customer_name}</h2>
              <span className="text-[10px] font-bold bg-silver/30 text-charcoal/60 px-2 py-0.5 rounded-md">
                {payment.purpose_display}
              </span>
            </div>
            <p className="text-[11px] text-charcoal/50 mt-0.5">
              {fmt(payment.amount)}
              {payment.transaction_id ? ` · UTR: ${payment.transaction_id}` : ""} · {fmtDateTime(payment.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {resolvedUrl && (
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-silver/20 hover:bg-silver/30 text-[11px] font-bold text-charcoal transition-colors"
                title="Open original image in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open full size</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-silver/20 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-charcoal/50" />
            </button>
          </div>
        </div>

        {/* Content / Screenshot Image */}
        <div className="bg-silver/10 flex-1 overflow-auto flex items-center justify-center p-4 min-h-[320px] relative">
          {resolvedUrl ? (
            <>
              {!imgLoaded && !imgError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-charcoal/40">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-[11px] font-bold">Loading payment screenshot...</span>
                </div>
              )}
              {imgError ? (
                <div className="py-10 px-4 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-charcoal">Preview could not be displayed directly</h3>
                    <p className="text-[11px] text-charcoal/50 mt-1 max-w-sm">
                      You can view or download the raw attachment file below:
                    </p>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setImgError(false);
                        setImgLoaded(false);
                      }}
                      className="px-3 py-1.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 transition-colors cursor-pointer"
                    >
                      Retry
                    </button>
                    <a
                      href={resolvedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Attachment
                    </a>
                  </div>
                </div>
              ) : (
                <img
                  src={resolvedUrl}
                  alt="Payment screenshot"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                  className={`max-w-full max-h-[65vh] object-contain rounded-xl shadow-xs transition-opacity duration-200 ${
                    imgLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </>
          ) : (
            <div className="py-20 text-xs font-bold text-charcoal/30 flex flex-col items-center gap-2">
              <ImageOff className="w-8 h-8" /> No screenshot uploaded
            </div>
          )}
        </div>

        {/* Footer with Details & Quick Actions */}
        <div className="p-4 bg-white border-t border-silver/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-charcoal/50 font-medium">Customer: </span>
            <span className="font-bold text-charcoal">
              {payment.customer_name} ({payment.customer_phone})
            </span>
            {payment.notes && (
              <span className="block text-[11px] text-charcoal/60 italic mt-0.5">
                Note: "{payment.notes}"
              </span>
            )}
          </div>
          {payment.status === "pending" && (
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onReject?.(payment);
                  onClose();
                }}
                disabled={isVerifying}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-600 rounded-xl text-xs font-black hover:bg-rose-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
              <button
                type="button"
                onClick={() => {
                  onVerify?.(payment);
                  onClose();
                }}
                disabled={isVerifying}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Verify & Approve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Reject Modal ────────────────────────────────────────────────────────────

const RejectModal: React.FC<{
  payment: OnlinePayment;
  onClose: () => void;
  onRejected: () => void;
}> = ({ payment, onClose, onRejected }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { setError("Please give a reason. The customer will see it."); return; }
    setLoading(true);
    setError(null);
    try {
      await financeApi.rejectOnlinePayment(payment.id, reason.trim());
      onRejected();
      onClose();
    } catch (err) {
      setError(apiErrorDetail(err, "Failed to reject payment. Please try again."));
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
              <XCircle className="w-4 h-4 text-rose-500" /> Reject Payment
            </h2>
            <p className="text-[11px] text-charcoal/50 mt-0.5">
              {payment.customer_name} · {fmt(payment.amount)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-silver/20 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-charcoal/50" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Reason</label>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)} rows={3} autoFocus
              placeholder="e.g. Screenshot is unclear, amount does not match..."
              className="w-full text-sm font-medium px-3 py-2 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none transition-all"
            />
          </div>
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-silver rounded-xl text-sm font-bold text-charcoal hover:bg-silver/10 transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 px-4 bg-rose-600 rounded-xl text-sm font-black text-white hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              {loading ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Panel ──────────────────────────────────────────────────────────────

interface OnlinePaymentsPanelProps {
  /** Called after a payment is verified/rejected so the parent can refresh bills & transactions */
  onChanged?: () => void;
}

const OnlinePaymentsPanel: React.FC<OnlinePaymentsPanelProps> = ({ onChanged }) => {
  const tenant = useAuthStore(s => s.tenant);
  const [summary, setSummary] = useState<OnlinePaymentSummary | null>(null);
  const [payments, setPayments] = useState<OnlinePayment[]>([]);
  const [filter, setFilter] = useState<FilterValue>("pending");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [previewPayment, setPreviewPayment] = useState<OnlinePayment | null>(null);
  const [rejectPayment, setRejectPayment] = useState<OnlinePayment | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = filter === "all" ? undefined : { status: filter };
      const [sumRes, listRes] = await Promise.all([
        financeApi.getOnlinePaymentSummary(),
        financeApi.getOnlinePayments(params),
      ]);
      setSummary(sumRes.data);
      // Tolerate both plain-list and paginated ({ results }) responses
      const data = listRes.data as OnlinePayment[] | { results?: OnlinePayment[] };
      setPayments(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      setError("Failed to load online payments.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const afterChange = async () => {
    await load();
    onChanged?.();
  };

  const handleVerify = async (payment: OnlinePayment) => {
    setVerifyingId(payment.id);
    try {
      await financeApi.verifyOnlinePayment(payment.id);
      await afterChange();
    } catch (err) {
      alert(apiErrorDetail(err, "Failed to verify payment. Please try again."));
    } finally {
      setVerifyingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return payments;
    return payments.filter(p =>
      p.customer_name.toLowerCase().includes(q) ||
      (p.customer_phone || "").includes(q) ||
      (p.transaction_id || "").toLowerCase().includes(q) ||
      (p.bill_invoice_number || "").toLowerCase().includes(q)
    );
  }, [payments, search]);

  return (
    <div className="bg-white rounded-2xl border border-silver/60 shadow-xs overflow-hidden mb-8">
      {/* Header */}
      <div className="p-5 border-b border-silver/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-charcoal flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" /> Online Payments Verification
            {summary && summary.pending.count > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {summary.pending.count} pending
              </span>
            )}
          </h2>
          <p className="text-[11px] text-charcoal/40 mt-0.5">
            Payments submitted by customers with a screenshot. Verify to credit the bill / mark the order paid.
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-silver/60 rounded-xl text-[11px] font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${isLoading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5 pb-0">
          <div className="p-4 rounded-2xl border border-silver/50 bg-silver/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Customers Paid Online
            </span>
            <div className="text-xl font-black text-charcoal mt-1">{summary.total_customers_paid_online}</div>
          </div>
          <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700/70 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Pending Verification
            </span>
            <div className="text-xl font-black text-amber-700 mt-1">{summary.pending.count}</div>
            <div className="text-[10px] text-amber-700/60 font-bold">
              {fmt(summary.pending.amount)} · {summary.pending.customers} customer{summary.pending.customers !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700/70 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
            <div className="text-xl font-black text-emerald-700 mt-1">{summary.verified.count}</div>
            <div className="text-[10px] text-emerald-700/60 font-bold">{fmt(summary.verified.amount)}</div>
          </div>
          <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-700/70 flex items-center gap-1.5">
              <XCircle className="w-3 h-3" /> Rejected
            </span>
            <div className="text-xl font-black text-rose-700 mt-1">{summary.rejected.count}</div>
            <div className="text-[10px] text-rose-700/60 font-bold">{fmt(summary.rejected.amount)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-5 pt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex items-center gap-2">
          {(["pending", "verified", "rejected", "all"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                filter === s
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-silver/10 text-charcoal/60 border-silver/50 hover:border-primary/40"
              }`}>
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, phone, UTR or invoice..."
            className="w-full text-xs font-medium pl-9 pr-4 py-2 border border-silver rounded-xl bg-silver/10 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-charcoal/30"
          />
        </div>
      </div>

      {/* List */}
      <div className="max-h-[520px] overflow-y-auto p-5 space-y-2">
        {error ? (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />{error}
          </div>
        ) : isLoading && payments.length === 0 ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-silver/20 rounded-2xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-charcoal/30 border border-dashed border-silver rounded-2xl flex flex-col items-center gap-2">
            <CircleDashed className="w-8 h-8 text-charcoal/20" />
            {filter === "pending" ? "No payments waiting for verification." : "No online payments found."}
          </div>
        ) : (
          filtered.map(p => {
            const resolvedUrl = resolveMediaUrl(p.screenshot, tenant);

            return (
              <div
                key={p.id}
                className="border border-silver/50 rounded-2xl p-3 flex items-center gap-3 hover:border-silver transition-colors"
              >
                {/* Thumbnail Preview */}
                <button
                  type="button"
                  onClick={() => setPreviewPayment(p)}
                  className="w-16 h-16 rounded-xl overflow-hidden border border-silver/50 bg-silver/10 shrink-0 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all relative group"
                  title="Click to inspect attachment"
                >
                  {resolvedUrl ? (
                    <>
                      <img
                        src={resolvedUrl}
                        alt="Proof thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.parentElement?.querySelector(".proof-fallback");
                          if (fallback) fallback.classList.remove("hidden");
                        }}
                      />
                      <div className="proof-fallback hidden flex flex-col items-center justify-center text-charcoal/40 text-[9px] font-bold p-1 text-center">
                        <FileImage className="w-5 h-5 text-primary/70 mb-0.5" />
                        <span>Proof</span>
                      </div>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-charcoal/30">
                      <ImageOff className="w-5 h-5 mb-0.5" />
                      <span className="text-[8px] font-bold">No file</span>
                    </div>
                  )}
                </button>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-charcoal truncate">{p.customer_name}</span>
                    <span className="text-[9px] font-bold bg-silver/30 text-charcoal/50 px-2 py-0.5 rounded-md">{p.purpose_display}</span>
                    {p.bill_invoice_number && (
                      <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{p.bill_invoice_number}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-charcoal/40 font-medium mt-0.5 flex flex-wrap gap-x-2">
                    <span>{p.customer_phone}</span>
                    <span>· {fmtDateTime(p.created_at)}</span>
                    {p.transaction_id && <span className="font-bold text-charcoal/50">· UTR {p.transaction_id}</span>}
                  </div>
                  {p.notes && <div className="text-[10px] italic text-charcoal/40 truncate mt-0.5">"{p.notes}"</div>}
                  {p.status === "rejected" && p.rejection_reason && (
                    <div className="text-[10px] font-bold text-rose-600 mt-0.5">Rejected: {p.rejection_reason}</div>
                  )}
                  {p.status === "verified" && p.verified_by_name && (
                    <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                      Verified by {p.verified_by_name}{p.verified_at ? ` · ${fmtDateTime(p.verified_at)}` : ""}
                    </div>
                  )}

                  {/* Prominent Action to Open Attachment */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewPayment(p)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{resolvedUrl ? "Check Payment Attachment" : "View Details"}</span>
                    </button>
                    {resolvedUrl && (
                      <a
                        href={resolvedUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-charcoal/40 hover:text-charcoal/70 transition-colors"
                        title="Open attachment in new tab"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open file</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Amount + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-black text-charcoal">{fmt(p.amount)}</div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${statusStyle(p.status)}`}>
                      {p.status_display}
                    </span>
                  </div>
                  {p.status === "pending" && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleVerify(p)}
                        disabled={verifyingId === p.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {verifyingId === p.id
                          ? <RefreshCw className="w-3 h-3 animate-spin" />
                          : <CheckCircle2 className="w-3 h-3" />}
                        Verify
                      </button>
                      <button
                        onClick={() => setRejectPayment(p)}
                        disabled={verifyingId === p.id}
                        className="flex items-center gap-1 px-3 py-1.5 border border-rose-200 text-rose-600 rounded-lg text-[10px] font-black hover:bg-rose-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {previewPayment && (
        <ScreenshotModal
          payment={previewPayment}
          tenant={tenant}
          onClose={() => setPreviewPayment(null)}
          onVerify={handleVerify}
          onReject={setRejectPayment}
          isVerifying={verifyingId === previewPayment.id}
        />
      )}
      {rejectPayment && (
        <RejectModal payment={rejectPayment} onClose={() => setRejectPayment(null)} onRejected={afterChange} />
      )}
    </div>
  );
};

export default OnlinePaymentsPanel;
