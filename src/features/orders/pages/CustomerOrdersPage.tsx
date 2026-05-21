import React, { useState } from "react";
import {
  ShoppingCart,
  PlusCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  CreditCard,
} from "lucide-react";

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([
    { id: "ORD-9842", date: "Today", item: "Full Cream Fresh Milk", quantity: "2 Liters", total: "₹260.00", paymentStatus: "Paid", deliveryStatus: "Delivered" },
    { id: "ORD-9751", date: "May 19, 2026", item: "Organic Cow Ghee (Bulk)", quantity: "1 Jar", total: "₹650.00", paymentStatus: "Paid", deliveryStatus: "Delivered" },
    { id: "ORD-9611", date: "May 15, 2026", item: "Fresh Paneer (Bulk)", quantity: "1 Kg", total: "₹450.00", paymentStatus: "Paid", deliveryStatus: "Delivered" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [product, setProduct] = useState("Full Cream Milk");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const productPrices: { [key: string]: number } = {
    "Full Cream Milk": 130,
    "Skimmed Milk": 110,
    "Fresh Paneer": 450,
    "Organic Ghee": 650,
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !quantity || !date) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const pricePerUnit = productPrices[product] || 100;
      const totalCost = pricePerUnit * Number(quantity);

      const newOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        date,
        item: product,
        quantity: `${quantity} ${product.includes("Milk") ? "Liters" : product.includes("Ghee") ? "Jar" : "Kg"}`,
        total: `₹${totalCost.toFixed(2)}`,
        paymentStatus: "Pending",
        deliveryStatus: "Scheduled",
      };

      setOrders([newOrder, ...orders]);
      setIsSubmitting(false);
      setIsModalOpen(false);
      setSuccessMsg(`Order ${newOrder.id} placed successfully for delivery on ${date}!`);
      setTimeout(() => setSuccessMsg(null), 5000);
    }, 1000);
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-silver/30 text-left">
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Order ID</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Date</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Item Details</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Quantity</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Total price</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Payment</th>
                <th className="pb-3 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/20">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-silver/5 transition-all">
                  <td className="py-4 text-xs font-black text-primary">{order.id}</td>
                  <td className="py-4 text-xs font-bold text-charcoal">{order.date}</td>
                  <td className="py-4 text-xs text-charcoal/80">{order.item}</td>
                  <td className="py-4 text-xs text-charcoal font-semibold">{order.quantity}</td>
                  <td className="py-4 text-xs font-bold text-charcoal">{order.total}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      order.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse"
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      order.deliveryStatus === "Delivered" ? "bg-emerald-500/10 text-emerald-700" : "bg-primary/10 text-primary animate-pulse"
                    }`}>
                      {order.deliveryStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Place Order Checkout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl border border-silver/50 shadow-2xl p-6 relative animate-in zoom-in-95 duration-250">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-charcoal/40 hover:text-charcoal hover:bg-silver/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-silver/30 pb-4 mb-6">
              <h3 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Place New One-Off Order
              </h3>
              <p className="text-xs text-charcoal/60 mt-1">Request an additional drop scheduled immediately.</p>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">Product</label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Full Cream Milk">Full Cream Milk (₹130/L)</option>
                  <option value="Skimmed Milk">Skimmed Milk (₹110/L)</option>
                  <option value="Fresh Paneer">Fresh Paneer (₹450/Kg)</option>
                  <option value="Organic Ghee">Organic Ghee (₹650/Jar)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">Delivery Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all"
                />
              </div>

              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex justify-between items-center mt-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-charcoal/60">Estimated Total Cost</span>
                </div>
                <span className="text-lg font-black text-primary">
                  ₹{(productPrices[product] * (Number(quantity) || 1)).toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/10 mt-6"
              >
                {isSubmitting ? "Processing Order..." : "Confirm & Book Delivery"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersPage;
