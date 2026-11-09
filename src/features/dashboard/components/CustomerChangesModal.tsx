import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  PauseCircle,
  Sparkles,
  Repeat,
  Package,
  Phone,
  MapPin,
  ExternalLink,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type {
  TodayCustomerChangesSummary,
  PausedDeliveryItem,
  ExtraMilkOrderItem,
  SubscriptionChangeItem,
} from "../../orders/components/types";

interface CustomerChangesModalProps {
  data: TodayCustomerChangesSummary;
  initialTab?: "paused" | "extra" | "subscriptions" | "all";
  onClose: () => void;
}

const fmtCurrency = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const CustomerChangesModal: React.FC<CustomerChangesModalProps> = ({
  data,
  initialTab = "all",
  onClose,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"paused" | "extra" | "subscriptions" | "all">(initialTab);

  const pausedCount = data.paused_deliveries?.count || 0;
  const extraCount = data.extra_milk_orders?.count || 0;
  const subsCount = data.subscription_changes?.count || 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-silver/50 flex items-center justify-between bg-silver/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-charcoal">
                Today's Customer Changes
              </h2>
              <p className="text-xs text-charcoal/50 font-medium mt-0.5">
                Current-day updates submitted by customers (Pause, Extra Milk, Subscriptions)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-silver/20 text-charcoal/40 hover:text-charcoal transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="px-5 pt-3 border-b border-silver/40 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-charcoal/50 hover:text-charcoal"
            }`}
          >
            All Changes ({data.total_today_changes})
          </button>
          <button
            onClick={() => setActiveTab("paused")}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "paused"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-charcoal/50 hover:text-charcoal"
            }`}
          >
            <PauseCircle className="w-3.5 h-3.5" />
            Paused Deliveries ({pausedCount})
          </button>
          <button
            onClick={() => setActiveTab("extra")}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "extra"
                ? "border-violet-500 text-violet-600"
                : "border-transparent text-charcoal/50 hover:text-charcoal"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Extra Milk / Orders ({extraCount})
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "subscriptions"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-charcoal/50 hover:text-charcoal"
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            Subscriptions ({subsCount})
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* Section: Paused Deliveries */}
          {(activeTab === "all" || activeTab === "paused") && (
            <div>
              {activeTab === "all" && pausedCount > 0 && (
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-700/70 mb-2 flex items-center gap-1.5">
                  <PauseCircle className="w-3.5 h-3.5" /> Paused Deliveries For Today ({pausedCount})
                </div>
              )}
              {data.paused_deliveries?.items.map((item, idx) => (
                <div
                  key={`paused-${item.subscription_id}-${idx}`}
                  className="mb-2 p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-charcoal">{item.customer_name}</span>
                      <span className="text-[9px] font-black bg-amber-200/60 text-amber-800 px-2 py-0.5 rounded-md">
                        {item.pause_display}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-amber-900/80 mt-1">
                      Paused: {item.items_summary}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-charcoal/50 font-medium mt-1">
                      {item.customer_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {item.customer_phone}
                        </span>
                      )}
                      {item.delivery_address && (
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <MapPin className="w-3 h-3 shrink-0" /> {item.delivery_address}
                        </span>
                      )}
                    </div>
                    {item.reason && (
                      <div className="text-[10px] italic text-charcoal/50 mt-1">
                        Reason: "{item.reason}"
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/customers?tab=detail&customer=${item.customer_id}`);
                    }}
                    className="self-end sm:self-center shrink-0 px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-xl text-[10px] font-bold hover:bg-amber-100 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <span>View Customer</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {activeTab === "paused" && pausedCount === 0 && (
                <div className="py-12 text-center text-xs font-bold text-charcoal/40 flex flex-col items-center gap-2 border border-dashed border-silver/50 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                  No deliveries paused for today.
                </div>
              )}
            </div>
          )}

          {/* Section: Extra Milk / Orders */}
          {(activeTab === "all" || activeTab === "extra") && (
            <div className={activeTab === "all" && pausedCount > 0 ? "pt-2" : ""}>
              {activeTab === "all" && extraCount > 0 && (
                <div className="text-[10px] font-black uppercase tracking-wider text-violet-700/70 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Extra Milk / Special Orders For Today ({extraCount})
                  {data.extra_milk_orders.total_litres > 0 && (
                    <span className="text-[10px] bg-violet-100 text-violet-800 px-2 py-0.2 rounded-full font-bold ml-1">
                      Total: {data.extra_milk_orders.total_litres}L
                    </span>
                  )}
                </div>
              )}
              {data.extra_milk_orders?.items.map((item) => (
                <div
                  key={`extra-${item.order_id}`}
                  className="mb-2 p-3.5 rounded-2xl border border-violet-200 bg-violet-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-violet-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-charcoal">{item.customer_name}</span>
                      <span className="text-[9px] font-black bg-violet-200/60 text-violet-800 px-2 py-0.5 rounded-md">
                        Extra Order
                      </span>
                      {item.milk_litres > 0 && (
                        <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                          +{item.milk_litres}L Milk
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-violet-900 mt-1">
                      Items: {item.items_summary}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-charcoal/50 font-medium mt-1">
                      <span>Total: {fmtCurrency(item.total)}</span>
                      {item.customer_phone && <span>· {item.customer_phone}</span>}
                      <span className="capitalize">· Status: {item.status}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate("/orders?type=additional");
                    }}
                    className="self-end sm:self-center shrink-0 px-3 py-1.5 bg-white border border-violet-300 text-violet-800 rounded-xl text-[10px] font-bold hover:bg-violet-100 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Manage Orders</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {activeTab === "extra" && extraCount === 0 && (
                <div className="py-12 text-center text-xs font-bold text-charcoal/40 flex flex-col items-center gap-2 border border-dashed border-silver/50 rounded-2xl">
                  <Package className="w-8 h-8 text-charcoal/20" />
                  No extra milk or special orders for today.
                </div>
              )}
            </div>
          )}

          {/* Section: Subscription Changes */}
          {(activeTab === "all" || activeTab === "subscriptions") && (
            <div className={activeTab === "all" && (pausedCount > 0 || extraCount > 0) ? "pt-2" : ""}>
              {activeTab === "all" && subsCount > 0 && (
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700/70 mb-2 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" /> Subscriptions Created / Changed Today ({subsCount})
                </div>
              )}
              {data.subscription_changes?.items.map((item, idx) => (
                <div
                  key={`sub-${item.subscription_id}-${idx}`}
                  className="mb-2 p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-charcoal">{item.customer_name}</span>
                      <span className="text-[9px] font-black bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-md">
                        {item.change_type}
                      </span>
                      <span className="text-[9px] font-bold bg-silver/30 text-charcoal/50 px-2 py-0.5 rounded-md capitalize">
                        {item.frequency}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-950 mt-1">
                      {item.items_summary}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-charcoal/50 font-medium mt-1">
                      {item.customer_phone && <span>{item.customer_phone}</span>}
                      <span>Updated: {new Date(item.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/customers?tab=detail&customer=${item.customer_id}`);
                    }}
                    className="self-end sm:self-center shrink-0 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-xl text-[10px] font-bold hover:bg-emerald-100 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <span>View Subscription</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {activeTab === "subscriptions" && subsCount === 0 && (
                <div className="py-12 text-center text-xs font-bold text-charcoal/40 flex flex-col items-center gap-2 border border-dashed border-silver/50 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                  No subscription changes made today.
                </div>
              )}
            </div>
          )}

          {data.total_today_changes === 0 && (
            <div className="py-14 text-center text-xs font-bold text-charcoal/40 flex flex-col items-center gap-2 border border-dashed border-silver/60 rounded-3xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/60" />
              <span>All clear! No pause delivery requests, extra milk orders, or subscription updates for today.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-silver/50 flex items-center justify-between">
          <div className="text-[11px] text-charcoal/50 font-medium">
            Showing records specifically for <span className="font-bold text-charcoal">{data.date}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-charcoal text-white rounded-xl text-xs font-bold hover:bg-charcoal/90 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default CustomerChangesModal;

