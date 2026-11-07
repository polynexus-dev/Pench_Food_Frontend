import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  PlusCircle,
  CheckCircle2,
  Trash2,
  CreditCard,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { orderApi } from "../api/orderApi";
import { financeApi, submitPayUCheckoutForm } from "../../finance/api/financeApi";
import type { Order } from "../components/types";
import { getPaymentStatusLabel, getPaymentStatusStyle } from "../components/paymentStatus";
import CreateOrderModal from "../components/modals/CreateOrderModal";

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PayU Order Payment Modal state
  const [payOrderTarget, setPayOrderTarget] = useState<Order | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>("");
  const [isInitiatingPayU, setIsInitiatingPayU] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedOrders = await orderApi.getOrders();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payStatus = params.get("status");
    const txnid = params.get("txnid");
    const msg = params.get("msg");

    const checkCallbackAndLoad = async () => {
      if (txnid) {
        try {
          await financeApi.getPayUStatus(txnid, true);
        } catch (err) {
          console.warn("PayU status check error:", err);
        }
      }
      if (payStatus === "success") {
        setSuccessMsg(
          `Payment successful!${txnid ? ` (Txn ID: ${txnid})` : ""}`
        );
      } else if (payStatus === "failed") {
        setErrorMsg(
          `Payment failed${msg ? `: ${msg}` : ""}${txnid ? ` (Txn ID: ${txnid})` : ""}`
        );
      }
      if (payStatus || txnid) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      await loadData();
    };

    checkCallbackAndLoad();
  }, []);

  const handleOrderSuccess = (msg: string) => {
    setSuccessMsg(msg);
    loadData();
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await orderApi.deleteOrder(orderId);
      setSuccessMsg("Order cancelled successfully!");
      loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (error: any) {
      alert(error.response?.data?.detail || error.message || "Failed to cancel order");
    }
  };

  const handleOpenPayModal = (order: Order) => {
    const rem = Number(
      order.remaining_amount ??
        Math.max(0, Number(order.total || 0) - Number(order.amount_collected || 0))
    );
    setPayOrderTarget(order);
    setPayAmountInput(rem.toFixed(2));
  };

  const handleConfirmPayU = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payOrderTarget) return;
    const rem = Number(
      payOrderTarget.remaining_amount ??
        Math.max(0, Number(payOrderTarget.total || 0) - Number(payOrderTarget.amount_collected || 0))
    );
    const amountNum = Number(payAmountInput || rem);
    if (!amountNum || amountNum <= 0 || amountNum > rem) {
      alert(`Please enter a valid payment amount between ₹1.00 and ₹${rem.toFixed(2)}.`);
      return;
    }

    setIsInitiatingPayU(true);
    try {
      const res = await financeApi.initiatePayU({
        order_id: payOrderTarget.id,
        amount: amountNum,
        frontend_redirect_url: window.location.origin + window.location.pathname,
      });
      submitPayUCheckoutForm(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to initiate PayU payment. Please try again.");
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
            <ShoppingCart className="w-8 h-8 text-primary" />
            My Orders
          </h1>
          <p className="text-charcoal/60 mt-1 text-sm">
            Place one-off quick delivery requests, buy dairy products, and view past drops.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3.5 bg-primary text-white hover:bg-primary/95 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/15 transition-all active:scale-[0.98] cursor-pointer shrink-0 ml-auto"
        >
          <PlusCircle className="w-5 h-5" />
          Place New Order
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

      {/* Orders List */}
      <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
        <div className="border-b border-silver/30 pb-4">
          <h2 className="text-xl font-bold text-charcoal tracking-tight">Order Logs</h2>
          <p className="text-xs text-charcoal/60 mt-1">Review transaction status, packing & handling fees, and drop fulfillment details.</p>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-silver/30 text-left">
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Order ID</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Date</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Item Details</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Total Price</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Payment</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Delivery Status</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/20">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-charcoal/40">
                      No orders found. Click "Place New Order" to request a delivery.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const isCancelable = order.status === "pending" || order.status === "confirmed";
                    const handlingFeeNum = Number(order.handling_fee || 0);
                    const totalNum = Number(order.total || 0);
                    const collectedNum = Number(order.amount_collected || 0);
                    const remainingNum = Number(
                      order.remaining_amount ?? Math.max(0, totalNum - collectedNum)
                    );
                    const isOnAccount = order.payment_method === "on_account";
                    const canPayNow =
                      order.status !== "cancelled" &&
                      order.payment_status !== "paid" &&
                      remainingNum > 0;

                    return (
                      <tr key={order.id} className="hover:bg-silver/5 transition-all">
                        <td className="py-4 text-xs font-black text-primary">#{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-4 text-xs font-bold text-charcoal">
                          {new Date(order.scheduled_delivery_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 text-xs text-charcoal/80">
                          {(order.items || []).map((it) => `${it.product_name} (${it.quantity})`).join(", ")}
                        </td>
                        <td className="py-4">
                          <div className="text-xs font-bold text-charcoal">₹{totalNum.toFixed(2)}</div>
                          {handlingFeeNum > 0 && (
                            <div className="text-[10px] text-charcoal/50 font-medium">
                              incl. ₹{handlingFeeNum.toFixed(2)} handling
                            </div>
                          )}
                          {collectedNum > 0 && remainingNum > 0 && (
                            <div className="text-[10px] text-indigo-700 font-bold mt-0.5">
                              Paid ₹{collectedNum.toFixed(2)} · Due ₹{remainingNum.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getPaymentStatusStyle(order.payment_status)}`}>
                              {isOnAccount && order.payment_status === "pending"
                                ? "Added to Monthly Bill"
                                : getPaymentStatusLabel(order.payment_status)}
                            </span>
                            {order.payment_transaction_id && (
                              <span className="text-[9px] text-charcoal/40 font-semibold">
                                Ref: {order.payment_transaction_id}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            order.status === "delivered" 
                              ? "bg-emerald-500/10 text-emerald-700" 
                              : isCancelable 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-primary/10 text-primary"
                          }`}>
                            {order.status_display}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            {canPayNow && (
                              <button
                                onClick={() => handleOpenPayModal(order)}
                                className="px-2.5 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-lg transition-all active:scale-95 inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer shadow-xs"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                {collectedNum > 0 ? `Pay ₹${remainingNum.toFixed(0)}` : "Pay Now"}
                              </button>
                            )}
                            {isCancelable && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-lg transition-all active:scale-95 inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PayU Order Payment Modal (Full or Partial) */}
      {payOrderTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl border border-silver/50 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-silver/40 pb-3">
              <div>
                <h3 className="text-base font-black text-charcoal flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Pay Order #{payOrderTarget.id.slice(0, 8).toUpperCase()}
                </h3>
                <p className="text-[11px] text-charcoal/50 mt-0.5">
                  Secure checkout powered by PayU Payment Gateway
                </p>
              </div>
              <button
                onClick={() => setPayOrderTarget(null)}
                className="p-1.5 rounded-xl hover:bg-silver/20 text-charcoal/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayU} className="space-y-4">
              <div className="p-3.5 bg-silver/10 rounded-2xl space-y-1.5 text-xs">
                {Number(payOrderTarget.items_subtotal || 0) > 0 && (
                  <div className="flex justify-between text-charcoal/70 font-medium">
                    <span>Items Subtotal</span>
                    <span>₹{Number(payOrderTarget.items_subtotal).toFixed(2)}</span>
                  </div>
                )}
                {Number(payOrderTarget.handling_fee || 0) > 0 && (
                  <div className="flex justify-between text-charcoal/70 font-medium">
                    <span>(+) Packing & Handling Charges</span>
                    <span>₹{Number(payOrderTarget.handling_fee).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-charcoal font-bold">
                  <span>Order Total</span>
                  <span>₹{Number(payOrderTarget.total).toFixed(2)}</span>
                </div>
                {Number(payOrderTarget.amount_collected || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Already Paid</span>
                    <span>- ₹{Number(payOrderTarget.amount_collected).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-primary font-black border-t border-silver/40 pt-1.5 text-sm">
                  <span>Remaining Balance</span>
                  <span>
                    ₹
                    {Number(
                      payOrderTarget.remaining_amount ??
                        Math.max(
                          0,
                          Number(payOrderTarget.total || 0) - Number(payOrderTarget.amount_collected || 0)
                        )
                    ).toFixed(2)}
                  </span>
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
                  max={Number(
                    payOrderTarget.remaining_amount ??
                      Math.max(
                        0,
                        Number(payOrderTarget.total || 0) - Number(payOrderTarget.amount_collected || 0)
                      )
                  )}
                  required
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-silver rounded-xl text-sm font-bold text-charcoal focus:outline-none focus:border-primary"
                />
                <p className="text-[10px] text-charcoal/40 mt-1">
                  You can pay the full balance or a partial amount now; any remaining balance will reflect on your Monthly Bill.
                </p>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPayOrderTarget(null)}
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
                  {isInitiatingPayU ? "Redirecting..." : `Pay ₹${Number(payAmountInput || 0).toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Place Order Checkout Modal */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleOrderSuccess}
      />
    </div>
  );
};

export default CustomerOrdersPage;
