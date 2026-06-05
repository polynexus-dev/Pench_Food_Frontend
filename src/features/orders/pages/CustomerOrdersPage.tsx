import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  PlusCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { orderApi } from "../api/orderApi";
import type { Order } from "../components/types";
import CreateOrderModal from "../components/modals/CreateOrderModal";

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    loadData();
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold rounded-2xl flex items-center gap-3 animate-pulse shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
        <div className="border-b border-silver/30 pb-4">
          <h2 className="text-xl font-bold text-charcoal tracking-tight">Order Logs</h2>
          <p className="text-xs text-charcoal/60 mt-1">Review transaction status and drop fulfillment details.</p>
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
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Total price</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Delivery Status</th>
                  <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/20">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-charcoal/40">
                      No orders found. Click "Place New Order" to request a delivery.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const isCancelable = order.status === "pending" || order.status === "confirmed";
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
                          {order.items.map((it) => `${it.product_name} (${it.quantity})`).join(", ")}
                        </td>
                        <td className="py-4 text-xs font-bold text-charcoal">₹{order.total}</td>
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
                          {isCancelable && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-lg transition-all active:scale-95 inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          )}
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
