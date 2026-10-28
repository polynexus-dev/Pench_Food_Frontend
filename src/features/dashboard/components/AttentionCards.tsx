import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, Sparkles, ChevronRight } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { financeApi } from "../../finance/api/financeApi";
import { orderApi } from "../../orders/api/orderApi";
import type { OnlinePaymentSummary } from "../../finance/components/types";
import type { SpecialOrdersSummary } from "../../orders/components/types";

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

/**
 * "Needs attention" row on the overview: online payments waiting for admin
 * verification, and new additional (non-subscription) orders.
 * Each card loads independently; a card is hidden if its endpoint is not accessible.
 */
const AttentionCards = () => {
  const navigate = useNavigate();
  const tenant = useAuthStore((state) => state.tenant);
  const [payments, setPayments] = useState<OnlinePaymentSummary | null>(null);
  const [special, setSpecial] = useState<SpecialOrdersSummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      financeApi.getOnlinePaymentSummary(),
      orderApi.getSpecialOrdersSummary(),
    ]).then(([payRes, specialRes]) => {
      if (!isMounted) return;
      setPayments(payRes.status === "fulfilled" ? payRes.value.data : null);
      setSpecial(specialRes.status === "fulfilled" ? specialRes.value : null);
    });
    return () => { isMounted = false; };
  }, [tenant]);

  if (!payments && !special) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {payments && (
        <button
          onClick={() => navigate("/finance")}
          className={`w-full text-left p-6 rounded-2xl border shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer focus:outline-none ${
            payments.pending.count > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-silver"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-charcoal/60 text-sm font-medium">Online Payments to Verify</h3>
                <p className="text-2xl font-bold text-charcoal mt-0.5">
                  {payments.pending.count}
                  {payments.pending.count > 0 && (
                    <span className="text-sm font-bold text-amber-700 ml-2">{fmt(payments.pending.amount)}</span>
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-charcoal/30" />
          </div>
          <p className="text-xs text-charcoal/50 font-medium mt-3">
            {payments.total_customers_paid_online} customer{payments.total_customers_paid_online !== 1 ? "s" : ""} paid online
            {" · "}{payments.verified.count} verified · {payments.rejected.count} rejected
          </p>
        </button>
      )}

      {special && (
        <button
          onClick={() => navigate("/orders?type=additional")}
          className={`w-full text-left p-6 rounded-2xl border shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer focus:outline-none ${
            special.new_pending > 0 ? "bg-violet-50 border-violet-200" : "bg-white border-silver"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-violet-100 text-violet-700">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-charcoal/60 text-sm font-medium">New Additional Orders</h3>
                <p className="text-2xl font-bold text-charcoal mt-0.5">
                  {special.new_pending}
                  {special.placed_last_24h > 0 && (
                    <span className="text-sm font-bold text-violet-700 ml-2">+{special.placed_last_24h} in last 24h</span>
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-charcoal/30" />
          </div>
          <p className="text-xs text-charcoal/50 font-medium mt-3">
            Apart from regular subscriptions · {special.for_today} for today · {special.upcoming} upcoming
            {special.payment_pending_verification > 0 && ` · ${special.payment_pending_verification} awaiting payment check`}
          </p>
        </button>
      )}
    </div>
  );
};

export default AttentionCards;
