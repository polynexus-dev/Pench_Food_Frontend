import React from "react";
import { CalendarDays, ShoppingBag, ArrowDownCircle, Calculator } from "lucide-react";
import type { MonthlyBillBreakdown } from "./types";

const fmt = (n: number | string | undefined) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface BillBreakdownSectionProps {
  breakdown?: MonthlyBillBreakdown;
}

export const BillBreakdownSection: React.FC<BillBreakdownSectionProps> = ({ breakdown }) => {
  if (!breakdown) return null;

  const {
    subscription_summary: sub,
    extra_orders_summary: extra,
    deductions_and_credits: ded,
    final_calculation: fin,
  } = breakdown;

  return (
    <div className="space-y-4 pt-2">
      {/* 1. Subscription Weekly Summary */}
      <div className="bg-white border border-silver/50 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between border-b border-silver/30 pb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            1. Subscription Attendance Summary
          </span>
          <span className="text-[11px] font-bold text-charcoal/60">
            {sub.total_delivered_days}/{sub.total_scheduled_days} Delivered Days
            {sub.total_skipped_days > 0 ? ` (${sub.total_skipped_days} Skipped)` : ""}
          </span>
        </div>

        {sub.weeks && sub.weeks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-charcoal/40 font-bold border-b border-silver/20">
                  <th className="pb-1.5">Period</th>
                  <th className="pb-1.5 text-center">Scheduled</th>
                  <th className="pb-1.5 text-center">Skipped</th>
                  <th className="pb-1.5 text-center">Delivered</th>
                  <th className="pb-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/15">
                {sub.weeks.map((w) => (
                  <tr key={w.week_number}>
                    <td className="py-1.5 font-semibold text-charcoal">{w.label}</td>
                    <td className="py-1.5 text-center text-charcoal/70">{w.scheduled_days}d</td>
                    <td className="py-1.5 text-center text-rose-600 font-semibold">
                      {w.skipped_days > 0 ? `${w.skipped_days}d` : "-"}
                    </td>
                    <td className="py-1.5 text-center text-emerald-700 font-bold">{w.delivered_days}d</td>
                    <td className="py-1.5 text-right font-bold text-charcoal">{fmt(w.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[11px] text-charcoal/40 italic">No subscription deliveries in this period.</p>
        )}
      </div>

      {/* 2. Mid-Month Additional Orders */}
      {extra && extra.count > 0 && (
        <div className="bg-white border border-silver/50 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-silver/30 pb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              2. Mid-Month Additional Orders ({extra.count})
            </span>
            <span className="text-[11px] font-bold text-charcoal">
              Total: {fmt(extra.gross_total)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-charcoal/40 font-bold border-b border-silver/20">
                  <th className="pb-1.5">Order</th>
                  <th className="pb-1.5">Items</th>
                  <th className="pb-1.5 text-right">Total</th>
                  <th className="pb-1.5 text-right">Paid</th>
                  <th className="pb-1.5 text-right">On Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/15">
                {extra.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-1.5 font-bold text-charcoal">
                      #{o.order_number}
                      <span className="block text-[9px] text-charcoal/40 font-medium">{o.date}</span>
                    </td>
                    <td className="py-1.5 text-charcoal/80">
                      {o.items_summary}
                      <span className="block text-[9px] text-primary font-semibold">{o.billing_mode_label}</span>
                    </td>
                    <td className="py-1.5 text-right font-semibold text-charcoal">
                      {fmt(o.total)}
                      {Number(o.handling_fee) > 0 && (
                        <span className="block text-[9px] text-charcoal/40">
                          incl. {fmt(o.handling_fee)} fee
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right text-emerald-700 font-bold">
                      {Number(o.amount_collected) > 0 ? fmt(o.amount_collected) : "-"}
                    </td>
                    <td className="py-1.5 text-right text-rose-600 font-bold">
                      {Number(o.remaining_amount) > 0 ? fmt(o.remaining_amount) : "₹0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Less: Deductions & Credits */}
      {ded && ded.items && ded.items.length > 0 && (
        <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between border-b border-emerald-200/50 pb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <ArrowDownCircle className="w-3.5 h-3.5" />
              3. Less: Prepaid & Mid-Month Payments
            </span>
            <span className="text-[11px] font-black text-emerald-700">
              - {fmt(ded.total_deductions)}
            </span>
          </div>
          <div className="space-y-1 text-[11px]">
            {ded.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-emerald-900/80 font-medium">
                <span>{item.label}</span>
                <span className="font-bold text-emerald-700">- {fmt(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Final Bill Calculation */}
      {fin && (
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-3.5 space-y-1.5 text-xs">
          <div className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5 pb-1 border-b border-primary/10">
            <Calculator className="w-3.5 h-3.5" />
            4. Final Bill Calculation
          </div>
          <div className="flex justify-between text-charcoal/70 font-medium">
            <span>Subscription Charges</span>
            <span>{fmt(fin.subscription_charges)}</span>
          </div>
          {Number(fin.extra_orders_charges) > 0 && (
            <div className="flex justify-between text-charcoal/70 font-medium">
              <span>(+) Mid-Month Extra Orders</span>
              <span>{fmt(fin.extra_orders_charges)}</span>
            </div>
          )}
          {Number(fin.less_prepaid_and_collected) > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>(-) Less: Prepaid / Mid-Month Paid</span>
              <span>- {fmt(fin.less_prepaid_and_collected)}</span>
            </div>
          )}
          <div className="flex justify-between text-charcoal font-bold border-t border-primary/10 pt-1">
            <span>Unpaid Bill Subtotal</span>
            <span>{fmt(fin.unpaid_bill_subtotal)}</span>
          </div>
          <div className="flex justify-between text-charcoal/80 font-semibold">
            <span>(+) Packing & Handling Charges</span>
            <span>{fmt(fin.handling_fee)}</span>
          </div>
          <div className="flex justify-between text-charcoal font-black border-t border-primary/15 pt-1.5">
            <span>Net Monthly Bill Total</span>
            <span>{fmt(fin.net_bill_total)}</span>
          </div>
          {Number(fin.bill_payments_received) > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>(-) Bill Payments Received</span>
              <span>- {fmt(fin.bill_payments_received)}</span>
            </div>
          )}
          <div className="flex justify-between text-primary font-black text-sm border-t border-primary/20 pt-1.5">
            <span>Final Payable Balance</span>
            <span>{fmt(fin.final_payable_amount)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

