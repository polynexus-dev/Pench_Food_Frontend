import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Smartphone,
  Sparkles,
  ChevronRight,
  PauseCircle,
  Repeat,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { financeApi } from "../../finance/api/financeApi";
import { orderApi } from "../../orders/api/orderApi";
import type { OnlinePaymentSummary } from "../../finance/components/types";
import type { SpecialOrdersSummary, TodayCustomerChangesSummary } from "../../orders/components/types";
import CustomerChangesModal from "./CustomerChangesModal";

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

/**
 * "Needs attention" row on the overview:
 * 1. Paused deliveries for today
 * 2. Extra milk / special orders scheduled for today
 * 3. Subscription changes recorded today
 * 4. Online payments waiting for admin verification
 */
const AttentionCards = () => {
  const navigate = useNavigate();
  const tenant = useAuthStore((state) => state.tenant);
  const [payments, setPayments] = useState<OnlinePaymentSummary | null>(null);
  const [special, setSpecial] = useState<SpecialOrdersSummary | null>(null);
  const [changes, setChanges] = useState<TodayCustomerChangesSummary | null>(null);
  const [modalTab, setModalTab] = useState<"paused" | "extra" | "subscriptions" | "all" | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      financeApi.getOnlinePaymentSummary(),
      orderApi.getSpecialOrdersSummary(),
      orderApi.getTodayCustomerChanges(),
    ]).then(([payRes, specialRes, changesRes]) => {
      if (!isMounted) return;
      setPayments(payRes.status === "fulfilled" ? payRes.value.data : null);
      setSpecial(specialRes.status === "fulfilled" ? specialRes.value : null);
      setChanges(changesRes.status === "fulfilled" ? changesRes.value : null);
    });
    return () => {
      isMounted = false;
    };
  }, [tenant]);

  if (!payments && !special && !changes) return null;

  const pausedCount = changes?.paused_deliveries?.count ?? 0;
  const extraCount = changes?.extra_milk_orders?.count ?? (special?.for_today ?? 0);
  const extraLitres = changes?.extra_milk_orders?.total_litres ?? 0;
  const subsCount = changes?.subscription_changes?.count ?? 0;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Paused Deliveries for Today */}
        <button
          onClick={() => {
            if (changes && pausedCount > 0) {
              setModalTab("paused");
            } else {
              navigate("/customers?tab=detail");
            }
          }}
          className={`w-full text-left p-5 rounded-2xl border shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer focus:outline-none ${
            pausedCount > 0 ? "bg-amber-50/80 border-amber-200" : "bg-white border-silver/60"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  pausedCount > 0 ? "bg-amber-100 text-amber-700" : "bg-silver/20 text-charcoal/50"
                }`}
              >
                <PauseCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-charcoal/60 text-xs font-bold uppercase tracking-wider">
                  Paused Deliveries
                </h3>
                <p className="text-xl font-black text-charcoal mt-0.5">
                  {pausedCount}
                  <span className="text-xs font-bold text-charcoal/40 ml-1.5">today</span>
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal/30" />
          </div>
          <p className="text-[11px] text-charcoal/50 font-medium mt-3">
            {pausedCount > 0
              ? `${pausedCount} customer${pausedCount !== 1 ? "s" : ""} on vacation for today`
              : "No customer pauses for today"}
          </p>
        </button>

        {/* Card 2: Extra Milk / Special Orders Today */}
        <button
          onClick={() => {
            if (changes && extraCount > 0) {
              setModalTab("extra");
            } else {
              navigate("/orders?type=additional");
            }
          }}
          className={`w-full text-left p-5 rounded-2xl border shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer focus:outline-none ${
            extraCount > 0 ? "bg-violet-50/80 border-violet-200" : "bg-white border-silver/60"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  extraCount > 0 ? "bg-violet-100 text-violet-700" : "bg-silver/20 text-charcoal/50"
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-charcoal/60 text-xs font-bold uppercase tracking-wider">
                  Extra Milk Orders
                </h3>
                <p className="text-xl font-black text-charcoal mt-0.5">
                  {extraCount}
                  {extraLitres > 0 && (
                    <span className="text-xs font-bold text-violet-700 ml-1.5">+{extraLitres}L</span>
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal/30" />
          </div>
          <p className="text-[11px] text-charcoal/50 font-medium mt-3">
            {extraCount > 0
              ? `${extraCount} extra order${extraCount !== 1 ? "s" : ""} scheduled for today`
              : "Regular subscriptions only today"}
          </p>
        </button>

        {/* Card 3: Subscription Changes Today */}
        <button
          onClick={() => {
            if (changes && subsCount > 0) {
              setModalTab("subscriptions");
            } else {
              navigate("/customers?tab=detail");
            }
          }}
          className={`w-full text-left p-5 rounded-2xl border shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer focus:outline-none ${
            subsCount > 0 ? "bg-emerald-50/80 border-emerald-200" : "bg-white border-silver/60"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  subsCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-silver/20 text-charcoal/50"
                }`}
              >
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-charcoal/60 text-xs font-bold uppercase tracking-wider">
                  Subscription Updates
                </h3>
                <p className="text-xl font-black text-charcoal mt-0.5">
                  {subsCount}
                  <span className="text-xs font-bold text-charcoal/40 ml-1.5">today</span>
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-charcoal/30" />
          </div>
          <p className="text-[11px] text-charcoal/50 font-medium mt-3">
            {subsCount > 0
              ? `${subsCount} subscription change${subsCount !== 1 ? "s" : ""} recorded today`
              : "No subscription updates today"}
          </p>
        </button>

        {/* Card 4: Online Payments Verification */}
        {payments && (
          <button
            onClick={() => navigate("/finance")}
            className={`w-full text-left p-5 rounded-2xl border shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer focus:outline-none ${
              payments.pending.count > 0 ? "bg-amber-50/80 border-amber-200" : "bg-white border-silver/60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    payments.pending.count > 0 ? "bg-amber-100 text-amber-700" : "bg-silver/20 text-charcoal/50"
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-charcoal/60 text-xs font-bold uppercase tracking-wider">
                    Payments to Verify
                  </h3>
                  <p className="text-xl font-black text-charcoal mt-0.5">
                    {payments.pending.count}
                    {payments.pending.count > 0 && (
                      <span className="text-xs font-bold text-amber-700 ml-1.5">{fmt(payments.pending.amount)}</span>
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-charcoal/30" />
            </div>
            <p className="text-[11px] text-charcoal/50 font-medium mt-3">
              {payments.pending.count > 0
                ? `${payments.pending.count} awaiting admin approval`
                : "All online payments verified"}
            </p>
          </button>
        )}
      </div>

      {modalTab && changes && (
        <CustomerChangesModal
          data={changes}
          initialTab={modalTab}
          onClose={() => setModalTab(null)}
        />
      )}
    </>
  );
};

export default AttentionCards;
