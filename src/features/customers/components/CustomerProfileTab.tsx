import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  CreditCard,
  Layers,
  Percent,
  Check,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserMinus,
  Briefcase,
  Globe,
  Truck,
} from "lucide-react";
import type { Customer, Order, Subscription, PaymentHistory } from "./types";
import { customerApi } from "../api/customerApi";
import axiosInstance from "../../../api/axiosInstance";

interface CustomerProfileTabProps {
  customer: Customer;
  onBack: () => void;
  onUpdateCustomer: (updatedCustomer: Customer) => void;
}

const CustomerProfileTab: React.FC<CustomerProfileTabProps> = ({
  customer,
  onBack,
  onUpdateCustomer,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "orders" | "subscriptions" | "payments" | "discounts"
  >("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Available zones for manual assignment
  const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isUpdatingZone, setIsUpdatingZone] = useState(false);

  // Fetch zones for assignment
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setIsLoadingZones(true);
        const response = await axiosInstance.get("/ems/zones/");
        setZones(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to fetch zones:", error);
      } finally {
        setIsLoadingZones(false);
      }
    };
    fetchZones();
  }, []);

  // Subscriptions Mock Data (Scoped dynamically to customer ID for realism)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  // Payments Mock Data
  const [payments, setPayments] = useState<PaymentHistory[]>([]);

  // Discount form state
  const [discountRate, setDiscountRate] = useState<string>(
    customer.discount_rate !== undefined
      ? customer.discount_rate.toString()
      : "0",
  );
  const [discountType, setDiscountType] = useState<"percentage" | "flat">(
    "percentage",
  );
  const [discountScope, setDiscountScope] = useState<
    "all" | "milk" | "cheese" | "butter"
  >("all");
  const [discountNotes, setDiscountNotes] = useState("");
  const [discountSuccessMessage, setDiscountSuccessMessage] = useState("");
  const [isDiscountSaving, setIsDiscountSaving] = useState(false);

  // Generate deterministic mock subscriptions and payments based on customer ID
  useEffect(() => {
    const custSeed =
      customer.id.charCodeAt(0) +
      customer.id.charCodeAt(customer.id.length - 1);

    // Subscriptions
    const subTemplates = [
      {
        product_name: "Fresh Whole Milk (1L)",
        price: 65,
        frequency: "daily" as const,
        freqLabel: "Daily",
      },
      {
        product_name: "Premium Buffalo Milk (1L)",
        price: 82,
        frequency: "daily" as const,
        freqLabel: "Daily",
      },
      {
        product_name: "Organic Cow Ghee (500ml)",
        price: 420,
        frequency: "custom" as const,
        freqLabel: "Every Sunday",
      },
      {
        product_name: "Fresh Paneer (250g)",
        price: 110,
        frequency: "alternate_days" as const,
        freqLabel: "Alternate Days",
      },
    ];

    const count = (custSeed % 3) + 1; // 1 to 3 subscriptions
    const subList: Subscription[] = [];
    for (let i = 0; i < count; i++) {
      const template = subTemplates[(custSeed + i) % subTemplates.length];
      subList.push({
        id: `sub-${customer.id}-${i}`,
        customer: customer.id,
        product_name: template.product_name,
        quantity: (custSeed % 2) + 1,
        frequency: template.frequency,
        frequency_display: template.freqLabel,
        status: i === 2 ? "paused" : "active",
        start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * (30 * (i + 1)))
          .toISOString()
          .split("T")[0],
        price_per_unit: template.price,
      });
    }
    setSubscriptions(subList);

    // Payments
    const payList: PaymentHistory[] = [];
    const payCount = (custSeed % 4) + 3; // 3 to 6 payment history records
    for (let i = 0; i < payCount; i++) {
      const payAmount = ((custSeed * (i + 1) * 123) % 1500) + 350;
      payList.push({
        id: `tx-${customer.id.substring(0, 4)}-${1000 + i}`,
        customer: customer.id,
        amount: payAmount.toFixed(2),
        payment_date: new Date(
          Date.now() - 1000 * 60 * 60 * 24 * (12 * (i + 1)),
        )
          .toISOString()
          .split("T")[0],
        payment_method:
          (custSeed + i) % 3 === 0
            ? "UPI"
            : (custSeed + i) % 3 === 1
              ? "Cash"
              : "Wallet",
        transaction_id: `TXN${90281489 + custSeed * i}`,
        status: i === 0 && custSeed % 5 === 0 ? "pending" : "completed",
      });
    }
    setPayments(payList);
  }, [customer.id]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setIsOrdersLoading(true);
      try {
        const data = await customerApi.getOrdersByCustomerId(customer.id);
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setIsOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [customer.id]);

  // Toggle active status
  const handleToggleStatus = async () => {
    setIsStatusUpdating(true);
    try {
      const updated = await customerApi.toggleStatus(
        customer.id,
        !customer.is_active,
      );
      onUpdateCustomer({
        ...customer,
        ...updated,
        is_active:
          updated.is_active !== undefined
            ? updated.is_active
            : !customer.is_active,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Save custom discount
  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDiscountSaving(true);
    setDiscountSuccessMessage("");
    try {
      const numericDiscount = parseFloat(discountRate);
      if (
        isNaN(numericDiscount) ||
        numericDiscount < 0 ||
        numericDiscount > 100
      ) {
        throw new Error("Invalid discount rate");
      }

      // Update custom discount via API updateCustomer patch
      const updated = await customerApi.updateCustomer(customer.id, {
        discount_rate: numericDiscount,
      });
      onUpdateCustomer({
        ...customer,
        ...updated,
        discount_rate: numericDiscount,
      });
      setDiscountSuccessMessage(
        `Successfully updated custom discount rate to ${numericDiscount}%!`,
      );

      // Auto clear toast after 4s
      setTimeout(() => {
        setDiscountSuccessMessage("");
      }, 4000);
    } catch (error) {
      console.error("Failed to save discount:", error);
    } finally {
      setIsDiscountSaving(false);
    }
  };

  const activeSubscriptionsCount = subscriptions.filter(
    (s) => s.status === "active",
  ).length;
  const totalOrdersCount =
    orders.length || customer.dashboard?.total_orders || 0;
  const pendingBalance = customer.dashboard?.pending_balance || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
      {/* Back Header Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-silver/50 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          Back to Customers
        </button>

        <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em]">
          Profile Management Panel
        </span>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden">
        {/* Banner with gradient accent */}
        <div className="h-28 bg-gradient-to-r from-primary/10 via-primary/5 to-cream/20 border-b border-silver/30 relative">
          <div className="absolute top-4 right-6 flex gap-2">
            <span className="px-3 py-1 bg-white/80 backdrop-blur-xs border border-silver/50 rounded-full text-[9px] font-black text-charcoal/50 uppercase tracking-widest">
              ID: {customer.id}
            </span>
          </div>
        </div>

        {/* Profile Details Area */}
        <div className="px-8 pb-8 pt-0 -mt-10 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-5">
              {/* Huge Avatar with premium gradient border */}
              <div className="w-24 h-24 bg-gradient-to-tr from-primary to-sage text-white rounded-3xl flex items-center justify-center font-black text-4xl shadow-xl shadow-primary/15 border-4 border-white relative z-10">
                {customer.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-black text-charcoal tracking-tight">
                    {customer.name}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      customer.is_active
                        ? "bg-sage/10 text-primary border-primary/10"
                        : "bg-red-50 text-red-500 border-red-100"
                    }`}
                  >
                    {customer.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs font-bold text-charcoal/40 uppercase tracking-widest flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary/40" />
                  {customer.company || "Private Partner"}
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleToggleStatus}
                disabled={isStatusUpdating}
                className={`flex items-center gap-2 px-5 py-3 border rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs ${
                  customer.is_active
                    ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100/50"
                    : "bg-sage/10 border-primary/15 text-primary hover:bg-primary/10"
                }`}
              >
                {customer.is_active ? (
                  <>
                    <UserMinus className="w-4 h-4" /> Deactivate Account
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" /> Activate Account
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-6 border-t border-silver/30">
            <div className="flex items-center gap-3.5 p-3.5 bg-silver/5 hover:bg-silver/10 rounded-2xl border border-silver/30 transition-colors">
              <div className="p-2 bg-white rounded-lg border border-silver/50 text-primary shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-charcoal/30 uppercase tracking-wider">
                  Email Address
                </p>
                <p className="text-xs font-bold text-charcoal truncate">
                  {customer.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-silver/5 hover:bg-silver/10 rounded-2xl border border-silver/30 transition-colors">
              <div className="p-2 bg-white rounded-lg border border-silver/50 text-primary shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-charcoal/30 uppercase tracking-wider">
                  Phone Number
                </p>
                <p className="text-xs font-bold text-charcoal truncate">
                  {customer.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-silver/5 hover:bg-silver/10 rounded-2xl border border-silver/30 transition-colors">
              <div className="p-2 bg-white rounded-lg border border-silver/50 text-primary flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-charcoal/30 uppercase tracking-wider">
                  Delivery Address
                </p>
                <p
                  className="text-xs font-bold text-charcoal truncate"
                  title={customer.address}
                >
                  {customer.address || "No address specified"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-silver/5 hover:bg-silver/10 rounded-2xl border border-silver/30 transition-colors">
              <div className="p-2 bg-white rounded-lg border border-silver/50 text-primary flex-shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-charcoal/30 uppercase tracking-wider">
                  Assigned Zone
                </p>
                {isLoadingZones ? (
                  <p className="text-xs font-bold text-charcoal/40 animate-pulse">Loading...</p>
                ) : (
                  <div className="relative flex items-center">
                    <select
                      value={customer.zone || ""}
                      disabled={isUpdatingZone}
                      onChange={async (e) => {
                        const val = e.target.value;
                        setIsUpdatingZone(true);
                        try {
                          const updated = await customerApi.updateCustomer(customer.id, {
                            zone: val || null,
                          });
                          onUpdateCustomer({
                            ...customer,
                            ...updated,
                            zone: updated.zone,
                            zone_name: updated.zone_name,
                          });
                        } catch (error) {
                          console.error("Failed to update customer zone:", error);
                        } finally {
                          setIsUpdatingZone(false);
                        }
                      }}
                      className="text-xs font-bold text-charcoal bg-transparent border-none outline-none p-0 cursor-pointer w-full focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-silver/50 shadow-xs flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">
              Total Orders
            </p>
            <p className="text-2xl font-black text-charcoal">
              {totalOrdersCount}
            </p>
          </div>
          <div className="p-3.5 bg-primary/5 rounded-2xl text-primary group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-silver/50 shadow-xs flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">
              Subscriptions
            </p>
            <p className="text-2xl font-black text-charcoal">
              {activeSubscriptionsCount}{" "}
              <span className="text-xs font-bold text-charcoal/30">Active</span>
            </p>
          </div>
          <div className="p-3.5 bg-primary/5 rounded-2xl text-primary group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-silver/50 shadow-xs flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">
              Pending Balance
            </p>
            <p className="text-2xl font-black text-red-600">
              ₹{pendingBalance}
            </p>
          </div>
          <div className="p-3.5 bg-red-50 rounded-2xl text-red-600 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-silver/50 shadow-xs flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">
              Applied Discount
            </p>
            <p className="text-2xl font-black text-amber-600">
              {customer.discount_rate || 0}%
            </p>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-105 transition-transform">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Detail Sections Tab Control */}
      <div className="bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {/* Navigation Tabs Header */}
        <div className="px-6 border-b border-silver/30 bg-silver/5 flex items-center gap-6 overflow-x-auto no-scrollbar">
          {[
            {
              id: "orders",
              label: "Orders History",
              count: orders.length,
              icon: ShoppingBag,
            },
            {
              id: "subscriptions",
              label: "Subscriptions",
              count: subscriptions.length,
              icon: Layers,
            },
            {
              id: "payments",
              label: "Payment History",
              count: payments.length,
              icon: CreditCard,
            },
            {
              id: "discounts",
              label: "Custom Discount",
              count: customer.discount_rate ? 1 : 0,
              icon: Percent,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeSubTab === tab.id
                  ? "text-primary"
                  : "text-charcoal/40 hover:text-charcoal"
              }`}
            >
              <tab.icon
                className={`w-4 h-4 ${activeSubTab === tab.id ? "text-primary" : "text-charcoal/30"}`}
              />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold ${
                    activeSubTab === tab.id
                      ? "bg-primary text-white"
                      : "bg-silver/40 text-charcoal/50"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {activeSubTab === tab.id && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Body Contents */}
        <div className="p-6 flex-1">
          {/* 1. ORDERS HISTORY TAB */}
          {activeSubTab === "orders" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {isOrdersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-silver/10 rounded-2xl animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[9px] uppercase tracking-wider text-charcoal/40 font-black border-b border-silver/30 pb-3">
                      <tr>
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Delivery Date</th>
                        <th className="pb-3">Items Summary</th>
                        <th className="pb-3">Driver</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-silver/30">
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-silver/5 transition-colors"
                        >
                          <td className="py-4 font-black text-xs text-charcoal">
                            #{order.id.split("-")[0].toUpperCase()}
                          </td>
                          <td className="py-4 text-xs font-bold text-charcoal/60">
                            {new Date(
                              order.scheduled_delivery_date,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                              {order.items.map((it) => (
                                <span
                                  key={it.id}
                                  className="px-2 py-0.5 bg-silver/10 border border-silver/30 rounded-lg text-[9px] font-bold text-charcoal/60 whitespace-nowrap"
                                >
                                  {it.product_name}{" "}
                                  <strong className="text-primary font-bold">
                                    x{it.quantity}
                                  </strong>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 text-xs font-bold text-charcoal/60">
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{order.driver_name || "Unassigned"}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                                order.status === "confirmed" ||
                                order.status === "delivered"
                                  ? "bg-sage/10 text-primary border-primary/10"
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}
                            >
                              {order.status_display}
                            </span>
                          </td>
                          <td className="py-4 text-right font-black text-xs text-primary">
                            ₹{order.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 bg-silver/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-6 h-6 text-charcoal/20" />
                  </div>
                  <h4 className="text-sm font-bold text-charcoal">
                    No Orders Placed Yet
                  </h4>
                  <p className="text-xs text-charcoal/40 mt-1">
                    There are no recorded deliveries for this customer partner.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. SUBSCRIPTIONS TAB */}
          {activeSubTab === "subscriptions" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {subscriptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-5 bg-white border border-silver/50 rounded-2xl hover:border-primary/20 transition-all shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-charcoal text-sm leading-snug">
                            {sub.product_name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-charcoal/40 uppercase">
                              Qty: {sub.quantity}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-silver"></span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                              {sub.frequency_display}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                            sub.status === "active"
                              ? "bg-sage/10 text-primary border-primary/10"
                              : "bg-amber-50 text-amber-500 border-amber-100"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>

                      <div className="mt-5 pt-4 border-t border-silver/30 flex justify-between items-center text-[10px]">
                        <span className="font-bold text-charcoal/40">
                          Started:{" "}
                          {new Date(sub.start_date).toLocaleDateString(
                            "en-IN",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                        <span className="font-black text-charcoal">
                          ₹{sub.price_per_unit} / unit
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 bg-silver/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Layers className="w-6 h-6 text-charcoal/20" />
                  </div>
                  <h4 className="text-sm font-bold text-charcoal">
                    No Subscriptions Found
                  </h4>
                  <p className="text-xs text-charcoal/40 mt-1">
                    This customer has no active product subscription schedules.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. PAYMENT HISTORY TAB */}
          {activeSubTab === "payments" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[9px] uppercase tracking-wider text-charcoal/40 font-black border-b border-silver/30 pb-3">
                      <tr>
                        <th className="pb-3">Transaction ID</th>
                        <th className="pb-3">Payment Date</th>
                        <th className="pb-3">Payment Method</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-silver/30">
                      {payments.map((pay) => (
                        <tr
                          key={pay.id}
                          className="hover:bg-silver/5 transition-colors"
                        >
                          <td className="py-4 font-black text-xs text-charcoal">
                            {pay.transaction_id}
                          </td>
                          <td className="py-4 text-xs font-bold text-charcoal/60">
                            {new Date(pay.payment_date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="py-4 text-xs font-bold text-charcoal/60">
                            {pay.payment_method}
                          </td>
                          <td className="py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                                pay.status === "completed"
                                  ? "bg-sage/10 text-primary border-primary/10"
                                  : "bg-amber-50 text-amber-500 border-amber-100"
                              }`}
                            >
                              {pay.status}
                            </span>
                          </td>
                          <td className="py-4 text-right font-black text-xs text-primary">
                            ₹{pay.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 bg-silver/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-charcoal/20" />
                  </div>
                  <h4 className="text-sm font-bold text-charcoal">
                    No Payment Records
                  </h4>
                  <p className="text-xs text-charcoal/40 mt-1">
                    There are no processed invoice payments found for this
                    customer.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4. CUSTOM DISCOUNT TAB */}
          {activeSubTab === "discounts" && (
            <div className="max-w-2xl animate-in fade-in duration-300 space-y-6">
              <div>
                <h3 className="text-lg font-black text-charcoal">
                  Configure Partner Discount Rules
                </h3>
                <p className="text-xs text-charcoal/40 mt-1">
                  Apply a persistent custom discount percentage to this
                  customer. This rate is subtracted from checkout totals.
                </p>
              </div>

              {discountSuccessMessage && (
                <div className="flex items-center gap-3 p-4 bg-sage/10 border border-primary/10 rounded-2xl text-primary animate-in slide-in-from-top-4 duration-300">
                  <Check className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold">{discountSuccessMessage}</p>
                </div>
              )}

              <form onSubmit={handleSaveDiscount} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Rate Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                      Discount Rate (%)
                    </label>
                    <div className="relative group">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={discountRate}
                        onChange={(e) => setDiscountRate(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-sm"
                        placeholder="e.g. 5"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 font-bold text-sm">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Mode Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                      Adjustment Type
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full px-4 py-3 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-sm appearance-none cursor-pointer"
                    >
                      <option value="percentage">Percentage Offset (%)</option>
                      <option value="flat" disabled>
                        Flat Deductible (Coming Soon)
                      </option>
                    </select>
                  </div>

                  {/* Category Scope */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                      Applicable Products Scope
                    </label>
                    <select
                      value={discountScope}
                      onChange={(e) => setDiscountScope(e.target.value as any)}
                      className="w-full px-4 py-3 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-sm appearance-none cursor-pointer"
                    >
                      <option value="all">
                        Apply to All Products (Global)
                      </option>
                      <option value="milk">Milk Only</option>
                      <option value="cheese">Cheese Only</option>
                      <option value="butter">Butter Only</option>
                    </select>
                  </div>

                  {/* Audit Notes */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                      Internal Approval Notes / Rationale
                    </label>
                    <textarea
                      value={discountNotes}
                      onChange={(e) => setDiscountNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-medium text-xs leading-relaxed"
                      placeholder="Explain why this custom rate is applied (e.g. bulk buying agreement, promotion campaign)..."
                    />
                  </div>
                </div>

                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex gap-3 text-amber-700">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                  <p className="text-[11px] font-semibold leading-relaxed">
                    Custom discounts are applied immediately to all newly
                    scheduled orders. Existing active orders/subscriptions will
                    remain unchanged unless updated manually.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isDiscountSaving}
                    className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isDiscountSaving ? "Saving..." : "Apply Custom Discount"}
                  </button>
                  {customer.discount_rate !== undefined &&
                    customer.discount_rate > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          setIsDiscountSaving(true);
                          try {
                            const updated = await customerApi.updateCustomer(
                              customer.id,
                              {
                                discount_rate: 0,
                              },
                            );
                            onUpdateCustomer(updated);
                            setDiscountRate("0");
                            setDiscountSuccessMessage(
                              "Custom discount cleared successfully.",
                            );
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setIsDiscountSaving(false);
                          }
                        }}
                        className="px-5 py-3 bg-white border border-silver/50 text-charcoal hover:bg-silver/10 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        Clear Discount
                      </button>
                    )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfileTab;
