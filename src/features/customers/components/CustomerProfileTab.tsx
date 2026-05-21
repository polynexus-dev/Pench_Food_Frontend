import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  CreditCard,
  Calendar,
  Layers,
  Percent,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserMinus,
  Briefcase,
  Globe,
  Truck,
  Search,
  Tag,
  RotateCcw,
  CheckCircle,
  Plus,
  Trash2,
  Package,
  Download,
  RefreshCw,
  IndianRupee,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Customer, Order, Subscription, CustomerProductPrice, MonthlyBill, BottleType, CustomerBottleBalance, BottleTransaction } from "./types";
import { customerApi } from "../api/customerApi";
import { financeApi } from "../../finance/api/financeApi";
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
    "orders" | "subscriptions" | "payments" | "discounts" | "containers" | "calendar"
  >("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // starts in May 2026

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

  // Subscriptions Database-Backed State
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isSubscriptionsLoading, setIsSubscriptionsLoading] = useState(false);
  const [hasFetchedSubs, setHasFetchedSubs] = useState(false);
  const [selectedSubToPause, setSelectedSubToPause] = useState<Subscription | null>(null);
  const [pauseStart, setPauseStart] = useState("");
  const [pauseEnd, setPauseEnd] = useState("");
  const [isPauseSubmitLoading, setIsPauseSubmitLoading] = useState(false);

  // Create Subscription Form State
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);
  const [addSubFrequency, setAddSubFrequency] = useState<
    "daily" | "alternate" | "weekdays" | "weekends" | "custom"
  >("daily");
  const [addSubCustomDays, setAddSubCustomDays] = useState<number[]>([]);
  const [addSubStartDate, setAddSubStartDate] = useState("");
  const [addSubEndDate, setAddSubEndDate] = useState("");
  const [addSubDeliveryAddress, setAddSubDeliveryAddress] = useState("");
  const [addSubSpecialInstructions, setAddSubSpecialInstructions] = useState("");
  const [addSubItems, setAddSubItems] = useState<{ product: string; quantity: number }[]>([
    { product: "", quantity: 1 },
  ]);
  const [isAddSubSubmitLoading, setIsAddSubSubmitLoading] = useState(false);

  // Real Payments and Billing States
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([]);
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null);
  const [isBillsLoading, setIsBillsLoading] = useState(false);
  const [billsError, setBillsError] = useState<string | null>(null);
  const [downloadingBillId, setDownloadingBillId] = useState<string | null>(null);

  const handleDownloadInvoicePdf = async (billId: string, invoiceNumber: string) => {
    setDownloadingBillId(billId);
    try {
      await financeApi.downloadInvoicePdf(billId, invoiceNumber);
    } catch (error) {
      console.error("Failed to download invoice PDF:", error);
      alert("Failed to download invoice PDF. Please try again.");
    } finally {
      setDownloadingBillId(null);
    }
  };

  // Returnable Containers tracking States
  const [bottleBalances, setBottleBalances] = useState<CustomerBottleBalance[]>([]);
  const [bottleTransactions, setBottleTransactions] = useState<BottleTransaction[]>([]);
  const [bottleTypes, setBottleTypes] = useState<BottleType[]>([]);
  const [isBottleLoading, setIsBottleLoading] = useState(false);

  const containerStats = React.useMemo(() => {
    let totalPossession = 0;
    let totalLiability = 0;
    let totalBreakages = 0;
    let historicalDepositsCollected = 0;
    let historicalDepositsRefunded = 0;

    bottleBalances.forEach((bal) => {
      const bType = bottleTypes.find((t) => t.id === bal.bottle_type);
      const depositAmt = bType ? parseFloat(bType.deposit_amount) : 0;
      totalPossession += bal.balance;
      totalLiability += bal.balance * depositAmt;
    });

    bottleTransactions.forEach((tx) => {
      const bType = bottleTypes.find((t) => t.id === tx.bottle_type);
      const depositAmt = bType ? parseFloat(bType.deposit_amount) : 0;
      const value = tx.quantity * depositAmt;

      if (tx.transaction_type === "issued") {
        historicalDepositsCollected += value;
      } else if (tx.transaction_type === "returned") {
        historicalDepositsRefunded += value;
      } else if (tx.transaction_type === "broken") {
        totalBreakages += tx.quantity;
      }
    });

    return {
      totalPossession,
      totalLiability,
      totalBreakages,
      historicalDepositsCollected,
      historicalDepositsRefunded,
    };
  }, [bottleBalances, bottleTransactions, bottleTypes]);

  // Log Bottle Event Modal State
  const [isAddBottleTransModalOpen, setIsAddBottleTransModalOpen] = useState(false);
  const [selectedBottleType, setSelectedBottleType] = useState("");
  const [bottleTransType, setBottleTransType] = useState<"issued" | "returned" | "broken" | "refilled">("returned");
  const [bottleTransQty, setBottleTransQty] = useState(1);
  const [bottleTransNotes, setBottleTransNotes] = useState("");
  const [isBottleTransSubmitLoading, setIsBottleTransSubmitLoading] = useState(false);

  // Custom price override state
  const [productsList, setProductsList] = useState<any[]>([]);
  const [customPricesList, setCustomPricesList] = useState<CustomerProductPrice[]>([]);
  const [isPricesLoading, setIsPricesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceInputs, setPriceInputs] = useState<Record<string, { customPrice: string; discountPct: string }>>({});
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [priceSuccessMessages, setPriceSuccessMessages] = useState<Record<string, string>>({});

  // Fetch real monthly bills from backend
  const fetchCustomerBills = async () => {
    setIsBillsLoading(true);
    setBillsError(null);
    try {
      const bills = await customerApi.getMonthlyBills(customer.id);
      setMonthlyBills(bills);
      if (bills.length > 0) {
        setSelectedBill(bills[0]);
      } else {
        setSelectedBill(null);
      }
    } catch (error: any) {
      console.error("Failed to fetch monthly bills:", error);
      if (error.response?.status === 403) {
        setBillsError(
          "Access Restricted: Viewing billing invoices and payments requires Accountant or ERP_Admins group membership."
        );
      } else {
        setBillsError("Failed to fetch billing history. Please try again later.");
      }
    } finally {
      setIsBillsLoading(false);
    }
  };

  // Fetch real bottle balances and transactions
  const fetchCustomerBottles = async () => {
    setIsBottleLoading(true);
    try {
      const [balances, transactions, types] = await Promise.all([
        customerApi.getCustomerBottleBalances(customer.id),
        customerApi.getBottleTransactions(customer.id),
        customerApi.getBottleTypes(),
      ]);
      setBottleBalances(balances);
      
      // Sort transactions by date descending
      const sortedTransactions = [...transactions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setBottleTransactions(sortedTransactions);
      
      const activeTypes = types.filter((t) => t.is_active);
      setBottleTypes(activeTypes);
      if (activeTypes.length > 0) {
        setSelectedBottleType(activeTypes[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch customer bottle details:", error);
    } finally {
      setIsBottleLoading(false);
    }
  };

  // Log bottle event submit handler
  const handleBottleTransSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBottleType) {
      alert("Please select a container type.");
      return;
    }
    if (bottleTransQty <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    setIsBottleTransSubmitLoading(true);
    try {
      await customerApi.createBottleTransaction({
        customer: customer.id,
        bottle_type: selectedBottleType,
        transaction_type: bottleTransType,
        quantity: bottleTransQty,
        notes: bottleTransNotes,
      });

      // Refresh data
      await fetchCustomerBottles();

      // Close modal & reset form
      setIsAddBottleTransModalOpen(false);
      setBottleTransQty(1);
      setBottleTransNotes("");
    } catch (error) {
      console.error("Failed to log container transaction:", error);
      alert("Failed to submit container transaction. Please try again.");
    } finally {
      setIsBottleTransSubmitLoading(false);
    }
  };

  // Trigger billing fetch on tab switch
  useEffect(() => {
    if (activeSubTab === "payments") {
      fetchCustomerBills();
    }
  }, [activeSubTab, customer.id]);

  // Trigger bottle fetch on tab switch
  useEffect(() => {
    if (activeSubTab === "containers") {
      fetchCustomerBottles();
    }
  }, [activeSubTab, customer.id]);

  // Fetch real subscriptions from database
  const fetchCustomerSubscriptions = async () => {
    setIsSubscriptionsLoading(true);
    try {
      const [subs, prods, cp] = await Promise.all([
        customerApi.getSubscriptions(customer.id),
        productsList.length > 0 ? Promise.resolve(productsList) : customerApi.getProducts(),
        customPricesList.length > 0 ? Promise.resolve(customPricesList) : customerApi.getCustomerPrices(customer.id),
      ]);
      setSubscriptions(subs);
      if (productsList.length === 0) setProductsList(prods);
      if (customPricesList.length === 0) setCustomPricesList(cp);
      setHasFetchedSubs(true);
    } catch (error) {
      console.error("Failed to fetch customer subscriptions:", error);
    } finally {
      setIsSubscriptionsLoading(false);
    }
  };

  useEffect(() => {
    setHasFetchedSubs(false);
    setSubscriptions([]);
  }, [customer.id]);

  useEffect(() => {
    if (activeSubTab === "subscriptions") {
      fetchCustomerSubscriptions();
    }
  }, [activeSubTab, customer.id]);

  // Get price for a product (custom discount override or mrp)
  const getProductPrice = (productId: string) => {
    const override = customPricesList.find((o) => o.product === productId);
    if (override) {
      return parseFloat(override.custom_price);
    }
    const prod = productsList.find((p) => p.id === productId);
    if (prod) {
      return parseFloat(prod.unit_price);
    }
    return 0;
  };

  // Pause submit handler
  const handlePauseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubToPause) return;
    if (!pauseStart || !pauseEnd) {
      alert("Please select both start and end dates.");
      return;
    }
    if (new Date(pauseEnd) < new Date(pauseStart)) {
      alert("End date cannot be before start date.");
      return;
    }

    setIsPauseSubmitLoading(true);
    try {
      await customerApi.pauseSubscription(selectedSubToPause.id, pauseStart, pauseEnd);
      await fetchCustomerSubscriptions();
      
      // Update parent-level customer list
      const updatedCust = await customerApi.getCustomerById(customer.id);
      onUpdateCustomer(updatedCust);

      setSelectedSubToPause(null);
      setPauseStart("");
      setPauseEnd("");
    } catch (error) {
      console.error("Failed to pause subscription:", error);
      alert("Failed to pause subscription. Please check dates and try again.");
    } finally {
      setIsPauseSubmitLoading(false);
    }
  };

  // Resume handler
  const handleResumeSub = async (subId: string) => {
    if (!confirm("Are you sure you want to resume this subscription?")) return;
    
    try {
      await customerApi.resumeSubscription(subId);
      await fetchCustomerSubscriptions();

      // Update parent-level customer list
      const updatedCust = await customerApi.getCustomerById(customer.id);
      onUpdateCustomer(updatedCust);
    } catch (error) {
      console.error("Failed to resume subscription:", error);
      alert("Failed to resume subscription. Please try again.");
    }
  };

  // Add Subscription Action Handlers
  const handleOpenAddSubModal = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    setAddSubStartDate(todayStr);
    setAddSubEndDate("");
    setAddSubFrequency("daily");
    setAddSubCustomDays([]);
    setAddSubDeliveryAddress(customer.address || "");
    setAddSubSpecialInstructions("");
    setAddSubItems([{ product: "", quantity: 1 }]);
    setIsAddSubModalOpen(true);
  };

  const handleAddSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addSubStartDate) {
      alert("Please select a start date.");
      return;
    }

    if (addSubEndDate && new Date(addSubEndDate) < new Date(addSubStartDate)) {
      alert("End date cannot be before start date.");
      return;
    }

    if (addSubFrequency === "custom" && addSubCustomDays.length === 0) {
      alert("Please select at least one day for custom frequency.");
      return;
    }

    const validItems = addSubItems.filter((item) => item.product && item.quantity > 0);
    if (validItems.length === 0) {
      alert("Please add at least one valid product with quantity greater than 0.");
      return;
    }

    const productIds = validItems.map((item) => item.product);
    const hasDuplicates = productIds.some((val, i) => productIds.indexOf(val) !== i);
    if (hasDuplicates) {
      alert("You have duplicate product selections. Please combine them or select different products.");
      return;
    }

    setIsAddSubSubmitLoading(true);
    try {
      const payload = {
        customer: customer.id,
        frequency: addSubFrequency,
        custom_days: addSubFrequency === "custom" ? addSubCustomDays : [],
        start_date: addSubStartDate,
        end_date: addSubEndDate || null,
        delivery_address: addSubDeliveryAddress,
        special_instructions: addSubSpecialInstructions,
        items: validItems.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
      };

      await customerApi.createSubscription(payload);
      await fetchCustomerSubscriptions();

      // Update parent-level customer stats
      const updatedCust = await customerApi.getCustomerById(customer.id);
      onUpdateCustomer(updatedCust);

      setIsAddSubModalOpen(false);
    } catch (error) {
      console.error("Failed to create subscription:", error);
      alert("Failed to create subscription. Please verify inputs and try again.");
    } finally {
      setIsAddSubSubmitLoading(false);
    }
  };

  const handleAddSubItemRow = () => {
    setAddSubItems([...addSubItems, { product: "", quantity: 1 }]);
  };

  const handleRemoveSubItemRow = (index: number) => {
    const updated = [...addSubItems];
    updated.splice(index, 1);
    setAddSubItems(updated);
  };

  const handleUpdateSubItemRow = (index: number, field: "product" | "quantity", value: any) => {
    const updated = [...addSubItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setAddSubItems(updated);
  };

  const handleToggleCustomDay = (dayIndex: number) => {
    if (addSubCustomDays.includes(dayIndex)) {
      setAddSubCustomDays(addSubCustomDays.filter((d) => d !== dayIndex));
    } else {
      setAddSubCustomDays([...addSubCustomDays, dayIndex].sort());
    }
  };

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

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

  const fetchCustomerPricing = async () => {
    try {
      setIsPricesLoading(true);
      const [prods, cp] = await Promise.all([
        customerApi.getProducts(),
        customerApi.getCustomerPrices(customer.id),
      ]);
      setProductsList(prods);
      setCustomPricesList(cp);

      // Initialize inputs from the active custom prices or default MRP
      const initialInputs: Record<string, { customPrice: string; discountPct: string }> = {};
      prods.forEach((p: any) => {
        const override = cp.find((o) => o.product === p.id);
        const mrp = parseFloat(p.unit_price);
        if (override) {
          const customPriceNum = parseFloat(override.custom_price);
          const discountPctVal = mrp > 0 ? ((mrp - customPriceNum) / mrp) * 100 : 0;
          initialInputs[p.id] = {
            customPrice: customPriceNum.toFixed(2),
            discountPct: discountPctVal.toFixed(1),
          };
        } else {
          initialInputs[p.id] = {
            customPrice: mrp.toFixed(2),
            discountPct: "0.0",
          };
        }
      });
      setPriceInputs(initialInputs);
    } catch (error) {
      console.error("Failed to load customer pricing catalog:", error);
    } finally {
      setIsPricesLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "discounts") {
      fetchCustomerPricing();
    }
  }, [activeSubTab, customer.id]);

  const handlePriceChange = (productId: string, value: string, mrp: number) => {
    const numericVal = parseFloat(value);
    let discountPctVal = "0.0";
    if (!isNaN(numericVal) && mrp > 0) {
      const clampedPrice = Math.min(Math.max(numericVal, 0), mrp);
      discountPctVal = (((mrp - clampedPrice) / mrp) * 100).toFixed(1);
    }
    setPriceInputs((prev) => ({
      ...prev,
      [productId]: {
        customPrice: value,
        discountPct: discountPctVal,
      },
    }));
  };

  const handleDiscountChange = (productId: string, value: string, mrp: number) => {
    const numericVal = parseFloat(value);
    let customPriceVal = mrp.toFixed(2);
    if (!isNaN(numericVal)) {
      const clampedDiscount = Math.min(Math.max(numericVal, 0), 100);
      customPriceVal = (mrp - (mrp * clampedDiscount) / 100).toFixed(2);
    }
    setPriceInputs((prev) => ({
      ...prev,
      [productId]: {
        customPrice: customPriceVal,
        discountPct: value,
      },
    }));
  };

  const handleSavePriceOverride = async (productId: string, mrp: number) => {
    const inputs = priceInputs[productId];
    if (!inputs) return;

    const customPriceNum = parseFloat(inputs.customPrice);
    if (isNaN(customPriceNum) || customPriceNum < 0 || customPriceNum > mrp) {
      alert(`Invalid custom price. Must be between ₹0.00 and the base MRP of ₹${mrp.toFixed(2)}.`);
      return;
    }

    setSavingProductId(productId);
    setPriceSuccessMessages((prev) => ({ ...prev, [productId]: "" }));

    try {
      const override = customPricesList.find((o) => o.product === productId);
      const discount = mrp - customPriceNum;

      if (discount <= 0) {
        if (override) {
          await customerApi.deleteCustomerPrice(override.id);
        }
      } else {
        if (override) {
          await customerApi.updateCustomerPrice(override.id, customPriceNum);
        } else {
          await customerApi.createCustomerPrice(customer.id, productId, customPriceNum);
        }
      }

      const cp = await customerApi.getCustomerPrices(customer.id);
      setCustomPricesList(cp);

      const updatedCust = await customerApi.getCustomerById(customer.id);
      onUpdateCustomer(updatedCust);

      setPriceSuccessMessages((prev) => ({
        ...prev,
        [productId]: discount <= 0 ? "Reset to MRP!" : "Saved override!",
      }));

      setTimeout(() => {
        setPriceSuccessMessages((prev) => ({ ...prev, [productId]: "" }));
      }, 3000);
    } catch (error) {
      console.error("Failed to save price override:", error);
      alert("Failed to save custom price. Please try again.");
    } finally {
      setSavingProductId(null);
    }
  };

  const handleResetToMrp = async (productId: string, mrp: number) => {
    const override = customPricesList.find((o) => o.product === productId);
    if (!override) return;

    setSavingProductId(productId);
    try {
      await customerApi.deleteCustomerPrice(override.id);

      const cp = await customerApi.getCustomerPrices(customer.id);
      setCustomPricesList(cp);

      const updatedCust = await customerApi.getCustomerById(customer.id);
      onUpdateCustomer(updatedCust);

      setPriceInputs((prev) => ({
        ...prev,
        [productId]: {
          customPrice: mrp.toFixed(2),
          discountPct: "0.0",
        },
      }));

      setPriceSuccessMessages((prev) => ({
        ...prev,
        [productId]: "Reset to MRP!",
      }));

      setTimeout(() => {
        setPriceSuccessMessages((prev) => ({ ...prev, [productId]: "" }));
      }, 3000);
    } catch (error) {
      console.error("Failed to delete price override:", error);
      alert("Failed to reset price. Please try again.");
    } finally {
      setSavingProductId(null);
    }
  };

  const activeSubscriptionsCount = hasFetchedSubs
    ? subscriptions.filter((s) => s.status === "active" && !s.is_paused).length
    : (customer.dashboard?.active_subscriptions || 0);
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
              Custom Prices
            </p>
            <p className="text-2xl font-black text-amber-600">
              {customer.product_rates?.filter(r => r.discount > 0).length || 0}
              <span className="text-xs font-bold text-charcoal/30"> Active</span>
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
              count: hasFetchedSubs ? subscriptions.length : (customer.dashboard?.active_subscriptions || 0),
              icon: Layers,
            },
            {
              id: "payments",
              label: "Payment History",
              count: monthlyBills.length,
              icon: CreditCard,
            },
            {
              id: "containers",
              label: "Containers Tracking",
              count: bottleBalances.reduce((acc, b) => acc + (b.balance > 0 ? b.balance : 0), 0),
              icon: Package,
            },
            {
              id: "discounts",
              label: "Custom Prices",
              count: customer.product_rates?.filter(r => r.discount > 0).length || 0,
              icon: Percent,
            },
            {
              id: "calendar",
              label: "Delivery Calendar",
              count: 0,
              icon: Calendar,
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
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Subscription Tab Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-silver/30 pb-5">
                <div>
                  <h3 className="text-lg font-black text-charcoal">
                    Subscription Schedules
                  </h3>
                  <p className="text-xs text-charcoal/40 mt-1">
                    Manage recurring delivery schedules, pause vacations, and set active routes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddSubModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Subscription
                </button>
              </div>

              {isSubscriptionsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-5 bg-white border border-silver/50 rounded-2xl animate-pulse min-h-[180px] space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 w-2/3">
                          <div className="h-4 bg-silver/20 rounded-lg w-3/4"></div>
                          <div className="h-3 bg-silver/20 rounded-lg w-1/2"></div>
                        </div>
                        <div className="h-5 bg-silver/20 rounded-full w-16"></div>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-silver/30">
                        <div className="h-3 bg-silver/20 rounded-lg w-5/6"></div>
                        <div className="h-3 bg-silver/20 rounded-lg w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : subscriptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subscriptions.map((sub) => {
                    const subTotal = sub.items?.reduce((acc, item) => acc + item.quantity * getProductPrice(item.product), 0) || 0;

                    return (
                      <div
                        key={sub.id}
                        className={`p-5 bg-white border rounded-2xl transition-all shadow-xs flex flex-col justify-between min-h-[220px] ${
                          sub.is_paused
                            ? "border-amber-200 bg-amber-50/[0.01]"
                            : "border-silver/50 hover:border-primary/20"
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-black text-charcoal text-xs uppercase tracking-widest bg-silver/10 px-2.5 py-1 rounded-lg inline-block">
                                ID: #{sub.id.substring(0, 8).toUpperCase()}
                              </h4>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md">
                                  {sub.frequency_display}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border shrink-0 ${
                                sub.is_paused
                                  ? "bg-amber-50 text-amber-600 border-amber-100"
                                  : sub.status === "active"
                                    ? "bg-sage/10 text-primary border-primary/10"
                                    : "bg-red-50 text-red-500 border-red-100"
                              }`}
                            >
                              {sub.is_paused ? "Paused / Vacation" : sub.status_display || sub.status}
                            </span>
                          </div>

                          {/* List of items inside this subscription */}
                          {sub.items && sub.items.length > 0 ? (
                            <div className="space-y-2">
                              {sub.items.map((item) => {
                                const price = getProductPrice(item.product);
                                return (
                                  <div key={item.id} className="flex justify-between items-center bg-silver/5 p-2.5 rounded-xl border border-silver/20">
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-charcoal truncate">{item.product_name}</p>
                                      <p className="text-[10px] text-charcoal/40 font-semibold">Qty: {item.quantity} × ₹{price.toFixed(2)}</p>
                                    </div>
                                    <p className="text-xs font-black text-charcoal shrink-0">₹{(item.quantity * price).toFixed(2)}</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-charcoal/40 italic">No items in this subscription</p>
                          )}

                          {/* Vacation pause range banner */}
                          {sub.is_paused && (
                            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-[10px] text-amber-800 space-y-1">
                              <p className="font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                Vacation Pause Active
                              </p>
                              <p className="font-semibold text-charcoal/60">
                                Range: {formatDate(sub.pause_start)} to {formatDate(sub.pause_end)}
                              </p>
                              {sub.pause_updated_by_name && (
                                <p className="text-[9px] text-charcoal/40 font-medium">
                                  Paused by: {sub.pause_updated_by_name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-5 pt-4 border-t border-silver/30 flex flex-col gap-3">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-charcoal/40">
                              Started: {formatDate(sub.start_date)}
                            </span>
                            <span className="font-black text-primary">
                              Total: ₹{subTotal.toFixed(2)}
                            </span>
                          </div>

                          {sub.status === "active" && (
                            <div className="flex items-center gap-2 mt-1">
                              {sub.is_paused ? (
                                <button
                                  type="button"
                                  onClick={() => handleResumeSub(sub.id)}
                                  className="w-full py-2 px-3 bg-primary text-white hover:bg-primary/90 rounded-xl text-[10px] font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                  Resume Subscription
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSubToPause(sub);
                                    const today = new Date().toISOString().split("T")[0];
                                    setPauseStart(today);
                                    setPauseEnd(today);
                                  }}
                                  className="w-full py-2 px-3 border border-amber-200 bg-amber-50 hover:bg-amber-100/50 text-amber-700 rounded-xl text-[10px] font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                  Pause / Vacation
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Billing Header */}
              <div className="border-b border-silver/30 pb-5">
                <h3 className="text-lg font-black text-charcoal">
                  Invoices & Payments History
                </h3>
                <p className="text-xs text-charcoal/40 mt-1">
                  Track monthly aggregate billings, current outstanding balances, and logged payment receipts.
                </p>
              </div>

              {/* Error State / 403 Restricted Permissions Banner */}
              {billsError ? (
                <div className="p-6 bg-red-50/50 border border-red-100 rounded-3xl flex gap-4 max-w-2xl mx-auto my-6">
                  <div className="p-3 bg-red-100/50 rounded-2xl text-red-600 shrink-0 h-fit">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-red-800 uppercase tracking-wider">
                      Access Restricted
                    </h4>
                    <p className="text-xs font-semibold text-charcoal/60 leading-relaxed">
                      {billsError}
                    </p>
                    <p className="text-[10px] font-medium text-charcoal/40">
                      Standard security protocols isolate financial ledgers to authorized accounting personnel.
                    </p>
                  </div>
                </div>
              ) : isBillsLoading ? (
                /* Loading Skeleton Grid */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-silver/10 border border-silver/30 rounded-2xl animate-pulse"></div>
                    ))}
                  </div>
                  <div className="lg:col-span-2 h-72 bg-silver/10 border border-silver/30 rounded-3xl animate-pulse"></div>
                </div>
              ) : monthlyBills.length > 0 ? (
                /* Main Dual-Pane Billing UI */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Pane: Invoices Ledger */}
                  <div className="lg:col-span-1 space-y-3.5 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                    <p className="text-[9px] font-black text-charcoal/40 uppercase tracking-widest px-1">
                      Billing Statements ({monthlyBills.length})
                    </p>
                    
                    {monthlyBills.map((bill) => {
                      const isSelected = selectedBill?.id === bill.id;
                      
                      // Format "YYYY-MM" to readable "Month YYYY"
                      let monthDisplay = bill.billing_month;
                      try {
                        const [yr, mn] = bill.billing_month.split("-");
                        const dateObj = new Date(parseInt(yr), parseInt(mn) - 1, 1);
                        monthDisplay = dateObj.toLocaleDateString("en-IN", {
                          month: "long",
                          year: "numeric",
                        });
                      } catch (e) {
                        // fallback
                      }

                      return (
                        <div
                          key={bill.id}
                          onClick={() => setSelectedBill(bill)}
                          className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between hover:scale-[1.01] ${
                            isSelected
                              ? "bg-white border-primary shadow-md shadow-primary/5"
                              : "bg-silver/5 border-silver/50 hover:bg-silver/10"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="text-xs font-black text-charcoal truncate max-w-[120px]">
                                {bill.invoice_number || "Invoice"}
                              </h4>
                              <p className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wider mt-0.5">
                                {monthDisplay}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border shrink-0 ${
                                bill.status === "paid"
                                  ? "bg-sage/10 text-primary border-primary/10"
                                  : bill.status === "partial"
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-red-50 text-red-500 border-red-100"
                              }`}
                            >
                              {bill.status_display || bill.status}
                            </span>
                          </div>

                          <div className="flex justify-between items-end mt-4 pt-3 border-t border-silver/20">
                            <div>
                              <p className="text-[8px] font-black text-charcoal/30 uppercase tracking-widest">
                                Due Date
                              </p>
                              <p className="text-[10px] font-bold text-charcoal/60">
                                {new Date(bill.due_date).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-black text-charcoal/30 uppercase tracking-widest">
                                Remaining
                              </p>
                              <p className={`text-xs font-black ${bill.remaining_amount > 0 ? "text-red-600" : "text-primary"}`}>
                                ₹{parseFloat(bill.total_amount) - parseFloat(bill.amount_paid) <= 0 ? "0.00" : (parseFloat(bill.total_amount) - parseFloat(bill.amount_paid)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Pane: Selected Invoice Detailed Receipts Ledger */}
                  <div className="lg:col-span-2 bg-silver/5 border border-silver/50 rounded-3xl p-6 flex flex-col min-h-[300px]">
                    {selectedBill ? (
                      <div className="space-y-6 flex-1 flex flex-col justify-between">
                        
                        {/* Selected Invoice Details Section */}
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-silver/30 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  Invoice Details
                                </span>
                                <span className="text-[10px] font-bold text-charcoal/40">
                                  Statement No: {selectedBill.invoice_number}
                                </span>
                              </div>
                              <h4 className="text-base font-black text-charcoal mt-1">
                                Monthly Statement for {(() => {
                                  try {
                                    const [yr, mn] = selectedBill.billing_month.split("-");
                                    return new Date(parseInt(yr), parseInt(mn) - 1, 1).toLocaleDateString("en-IN", {
                                      month: "long",
                                      year: "numeric",
                                    });
                                  } catch (e) {
                                    return selectedBill.billing_month;
                                  }
                                })()}
                              </h4>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDownloadInvoicePdf(selectedBill.id, selectedBill.invoice_number)}
                                disabled={downloadingBillId === selectedBill.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-silver/60 rounded-xl text-[10px] font-black text-charcoal hover:bg-silver/10 hover:border-primary/40 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                {downloadingBillId === selectedBill.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                                ) : (
                                  <Download className="w-3.5 h-3.5 text-primary" />
                                )}
                                {downloadingBillId === selectedBill.id ? "Downloading..." : "Download PDF"}
                              </button>
                              <div className="text-right">
                                <span className="text-[9px] font-black text-charcoal/30 uppercase tracking-widest block">
                                  Total Bill Value
                                </span>
                                <span className="text-xl font-black text-charcoal">
                                  ₹{parseFloat(selectedBill.total_amount).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white rounded-2xl border border-silver/30">
                            <div>
                              <span className="text-[8px] font-black text-charcoal/30 uppercase tracking-widest block">
                                Amount Invoiced
                              </span>
                              <span className="text-xs font-black text-charcoal">
                                ₹{parseFloat(selectedBill.total_amount).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black text-charcoal/30 uppercase tracking-widest block">
                                Total Payments Received
                              </span>
                              <span className="text-xs font-black text-primary">
                                ₹{parseFloat(selectedBill.amount_paid).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black text-charcoal/30 uppercase tracking-widest block">
                                Outstanding Dues
                              </span>
                              <span className={`text-xs font-black ${parseFloat(selectedBill.total_amount) - parseFloat(selectedBill.amount_paid) > 0 ? "text-red-600" : "text-primary"}`}>
                                ₹{Math.max(0, parseFloat(selectedBill.total_amount) - parseFloat(selectedBill.amount_paid)).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8px] font-black text-charcoal/30 uppercase tracking-widest block">
                                Due Date Limit
                              </span>
                              <span className="text-xs font-bold text-charcoal/60">
                                {new Date(selectedBill.due_date).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Receipts List */}
                        <div className="space-y-3.5 pt-4 flex-1">
                          <p className="text-[9px] font-black text-charcoal/40 uppercase tracking-widest">
                            Transaction Payments Logs ({selectedBill.transactions?.length || 0})
                          </p>

                          {selectedBill.transactions && selectedBill.transactions.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead className="text-[8px] uppercase tracking-wider text-charcoal/40 font-black border-b border-silver/30 pb-2">
                                  <tr>
                                    <th className="pb-2">Receipt ID</th>
                                    <th className="pb-2">Recorded Date</th>
                                    <th className="pb-2">Payment Method</th>
                                    <th className="pb-2 text-right">Value Settled</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-silver/30">
                                  {selectedBill.transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-silver/5">
                                      <td className="py-2.5 font-black text-xs text-charcoal max-w-[120px] truncate" title={tx.transaction_id || tx.id}>
                                        {tx.transaction_id || tx.id.substring(0, 10).toUpperCase()}
                                      </td>
                                      <td className="py-2.5 text-[11px] font-bold text-charcoal/60">
                                        {new Date(tx.payment_date).toLocaleDateString("en-IN", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </td>
                                      <td className="py-2.5 text-[11px] font-bold text-charcoal/60 uppercase">
                                        {tx.payment_method}
                                      </td>
                                      <td className="py-2.5 text-right font-black text-xs text-primary">
                                        ₹{parseFloat(tx.amount).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="py-8 bg-white border border-silver/30 rounded-2xl text-center">
                              <CreditCard className="w-5 h-5 text-charcoal/20 mx-auto mb-1.5" />
                              <p className="text-xs font-bold text-charcoal/50">No payments captured</p>
                              <p className="text-[10px] text-charcoal/30 mt-0.5">No offset transaction files exist for this invoice period.</p>
                            </div>
                          )}
                        </div>

                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-14 h-14 bg-white border border-silver/50 rounded-full flex items-center justify-center mb-3 text-primary shadow-xs">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-charcoal">Select Billing Cycle</h4>
                        <p className="text-xs text-charcoal/40 mt-1">Select an invoice statement from the ledger to view receipt logs.</p>
                      </div>
                    )}
                  </div>
                  
                </div>
              ) : (
                <div className="py-12 bg-silver/5 border border-silver/50 rounded-3xl text-center">
                  <div className="w-14 h-14 bg-silver/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-charcoal/20" />
                  </div>
                  <h4 className="text-sm font-bold text-charcoal">
                    No Billing Records Found
                  </h4>
                  <p className="text-xs text-charcoal/40 mt-1">
                    There are no recorded monthly bills or invoice cycles for this customer partner.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3.5. CONTAINERS TRACKING TAB */}
          {activeSubTab === "containers" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Containers Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-silver/30 pb-5">
                <div>
                  <h3 className="text-lg font-black text-charcoal">
                    Containers & Returnable Bottles Tracking
                  </h3>
                  <p className="text-xs text-charcoal/40 mt-1">
                    Monitor customer container balances, compute outstanding deposit liabilities, and manage container returns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddBottleTransModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Log Container Event
                </button>
              </div>

              {/* Container Financial Summary Dashboard Card Deck */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
                {/* 1. Outstanding Liability */}
                <div className="p-5 bg-white border border-silver/50 rounded-2xl shadow-xs relative overflow-hidden group hover:border-primary/40 transition-colors">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <IndianRupee className="w-20 h-20 text-charcoal" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 block">Outstanding Deposit</span>
                  <span className="text-2xl font-black text-primary tracking-tight mt-1.5 block">
                    ₹{containerStats.totalLiability.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-bold text-charcoal/40 mt-1 block">Active deposit liabilities</span>
                </div>

                {/* 2. Total Possession */}
                <div className="p-5 bg-white border border-silver/50 rounded-2xl shadow-xs relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <Package className="w-20 h-20 text-indigo-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 block">In Possession</span>
                  <span className="text-2xl font-black text-indigo-600 tracking-tight mt-1.5 block">
                    {containerStats.totalPossession} <span className="text-[10px] text-charcoal/40 font-bold uppercase">Units</span>
                  </span>
                  <span className="text-[9px] font-bold text-charcoal/40 mt-1 block">Bottles with customer</span>
                </div>

                {/* 3. Deposit Cashflow */}
                <div className="p-5 bg-white border border-silver/50 rounded-2xl shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <CreditCard className="w-20 h-20 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 block">Deposits Activity</span>
                  <div className="mt-1 flex flex-col justify-center">
                    <div className="flex justify-between text-[10px] font-bold text-charcoal/60">
                      <span>Collected:</span>
                      <span className="text-primary">₹{containerStats.historicalDepositsCollected.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-charcoal/60 mt-0.5">
                      <span>Refunded:</span>
                      <span className="text-emerald-600">₹{containerStats.historicalDepositsRefunded.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Broken Logged */}
                <div className="p-5 bg-white border border-silver/50 rounded-2xl shadow-xs relative overflow-hidden group hover:border-red-500/40 transition-colors">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <AlertTriangle className="w-20 h-20 text-red-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 block">Damaged / Broken</span>
                  <span className="text-2xl font-black text-red-500 tracking-tight mt-1.5 block">
                    {containerStats.totalBreakages} <span className="text-[10px] text-charcoal/40 font-bold uppercase">Units</span>
                  </span>
                  <span className="text-[9px] font-bold text-charcoal/40 mt-1 block">Container breakages</span>
                </div>
              </div>

              {isBottleLoading ? (
                /* Skeleton Loader */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-28 bg-silver/10 border border-silver/30 rounded-2xl animate-pulse"></div>
                    ))}
                  </div>
                  <div className="h-48 bg-silver/10 border border-silver/30 rounded-3xl animate-pulse"></div>
                </div>
              ) : (
                <>
                  {/* Bottle Balances Grid */}
                  <div className="space-y-3.5">
                    <p className="text-[9px] font-black text-charcoal/40 uppercase tracking-widest animate-in fade-in duration-300">
                      Current Balances in Possession
                    </p>
                    
                    {bottleBalances.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                        {bottleBalances.map((bal) => {
                          const bType = bottleTypes.find((t) => t.id === bal.bottle_type);
                          const depositAmt = bType ? parseFloat(bType.deposit_amount) : 0;
                          const liability = bal.balance * depositAmt;

                          return (
                            <div
                              key={bal.id}
                              className="p-5 bg-white border border-silver/50 rounded-2xl shadow-xs hover:border-primary/20 transition-all flex justify-between items-center group"
                            >
                              <div className="space-y-2">
                                <div>
                                  <h4 className="font-black text-charcoal text-xs uppercase tracking-wider">
                                    {bal.bottle_type_name}
                                  </h4>
                                  <p className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wider mt-0.5">
                                    Deposit Value: ₹{depositAmt.toFixed(2)} / unit
                                  </p>
                                </div>

                                <div className="pt-2">
                                  <span className="text-[8px] font-black text-charcoal/30 uppercase tracking-widest block">
                                    Total Liabilities Outstanding
                                  </span>
                                  <span className={`text-sm font-black ${liability > 0 ? "text-primary" : "text-charcoal/40"}`}>
                                    ₹{liability.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[8px] font-black text-charcoal/30 uppercase tracking-widest block">
                                  In Possession
                                </span>
                                <span className="text-2xl font-black text-charcoal group-hover:text-primary transition-colors">
                                  {bal.balance}
                                </span>
                                <span className="text-[10px] font-bold text-charcoal/40 ml-1">units</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5 bg-silver/5 border border-silver/30 rounded-2xl text-center text-xs font-bold text-charcoal/40 animate-in fade-in duration-300">
                        No outstanding bottle container balances are currently mapped to this customer account.
                      </div>
                    )}
                  </div>

                  {/* Audit Trail Log */}
                  <div className="space-y-3.5 pt-4">
                    <p className="text-[9px] font-black text-charcoal/40 uppercase tracking-widest">
                      Container Movement Audit Trail ({bottleTransactions.length} logs)
                    </p>

                    {bottleTransactions.length > 0 ? (
                      <div className="bg-white border border-silver/50 rounded-3xl overflow-hidden shadow-xs animate-in fade-in duration-300">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="text-[9px] uppercase tracking-wider text-charcoal/40 bg-silver/5 font-black border-b border-silver/30">
                              <tr>
                                <th className="py-3 px-5">Timestamp</th>
                                <th className="py-3 px-5">Bottle Type</th>
                                <th className="py-3 px-5">Movement Event</th>
                                <th className="py-3 px-5">Quantity</th>
                                <th className="py-3 px-5">Recorded By</th>
                                <th className="py-3 px-5">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-silver/30">
                              {bottleTransactions.map((tx) => (
                                <tr
                                  key={tx.id}
                                  className="hover:bg-silver/5 transition-colors text-xs text-charcoal/80 font-bold"
                                >
                                  <td className="py-3.5 px-5 font-semibold text-charcoal/50 whitespace-nowrap">
                                    {new Date(tx.created_at).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}{" "}
                                    {new Date(tx.created_at).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </td>
                                  <td className="py-3.5 px-5 text-charcoal font-black">
                                    {tx.bottle_type_name}
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border whitespace-nowrap ${
                                        tx.transaction_type === "returned"
                                          ? "bg-sage/10 text-primary border-primary/10"
                                          : tx.transaction_type === "issued"
                                            ? "bg-blue-50 text-blue-600 border-blue-100"
                                            : tx.transaction_type === "broken"
                                              ? "bg-red-50 text-red-500 border-red-100"
                                              : "bg-amber-50 text-amber-600 border-amber-100"
                                      }`}
                                    >
                                      {tx.transaction_type_display || tx.transaction_type}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5 text-primary font-black">
                                    {tx.quantity} units
                                  </td>
                                  <td className="py-3.5 px-5 text-charcoal/50 font-semibold whitespace-nowrap">
                                    {tx.recorded_by || "System Driver"}
                                  </td>
                                  <td className="py-3.5 px-5 text-charcoal/60 font-semibold max-w-[200px] truncate" title={tx.notes}>
                                    {tx.notes || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 bg-silver/5 border border-silver/50 rounded-3xl text-center animate-in fade-in duration-300">
                        <Package className="w-6 h-6 text-charcoal/20 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-charcoal">No Container Events</h4>
                        <p className="text-xs text-charcoal/40 mt-1">There are no movement logs on file for this account.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 4. CUSTOM DISCOUNT TAB */}
          {activeSubTab === "discounts" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header with Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-silver/30 pb-5">
                <div>
                  <h3 className="text-lg font-black text-charcoal">
                    Customer Product Prices
                  </h3>
                  <p className="text-xs text-charcoal/40 mt-1">
                    Manage per-product custom pricing. Changes are persisted in the central inventory schema immediately.
                  </p>
                </div>
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search catalog by name or SKU..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                  />
                  <Search className="w-4 h-4 text-charcoal/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Loader Skeleton */}
              {isPricesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-44 bg-silver/10 border border-silver/30 rounded-3xl animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Products Grid */}
                  {(() => {
                    const filtered = productsList.filter(
                      (p) =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="py-12 text-center bg-silver/5 rounded-3xl border border-dashed border-silver/50">
                          <div className="w-14 h-14 bg-silver/10 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Search className="w-6 h-6 text-charcoal/20" />
                          </div>
                          <h4 className="text-sm font-bold text-charcoal">
                            No Products Found
                          </h4>
                          <p className="text-xs text-charcoal/40 mt-1">
                            No active products matched "{searchQuery}".
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {filtered.map((p) => {
                          const override = customPricesList.find((o) => o.product === p.id);
                          const mrp = parseFloat(p.unit_price);
                          const input = priceInputs[p.id] || { customPrice: mrp.toFixed(2), discountPct: "0.0" };
                          const isCustomized = !!override;
                          const isSaving = savingProductId === p.id;
                          const successMsg = priceSuccessMessages[p.id];

                          return (
                            <div
                              key={p.id}
                              className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between min-h-[170px] bg-white ${
                                isCustomized
                                  ? "border-primary/30 shadow-md shadow-primary/5 bg-primary/[0.01]"
                                  : "border-silver/50 shadow-xs hover:border-silver"
                              }`}
                            >
                              {/* Product Header */}
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full text-center min-w-[70px] inline-block">
                                    {p.sku}
                                  </span>
                                  <h4 className="font-black text-charcoal text-sm pt-2">
                                    {p.name}
                                  </h4>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">
                                    Base MRP
                                  </p>
                                  <p className="text-sm font-black text-charcoal">
                                    ₹{mrp.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {/* Pricing Inputs */}
                              <div className="grid grid-cols-2 gap-4 mt-5">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-charcoal/50 uppercase tracking-wider block">
                                    Custom Price (₹)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={mrp}
                                    step="0.01"
                                    value={input.customPrice}
                                    onChange={(e) => handlePriceChange(p.id, e.target.value, mrp)}
                                    className="w-full px-3 py-2 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-charcoal/50 uppercase tracking-wider block">
                                    Discount (%)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={input.discountPct}
                                    onChange={(e) => handleDiscountChange(p.id, e.target.value, mrp)}
                                    className="w-full px-3 py-2 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                                  />
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center justify-between gap-4 mt-5 pt-4 border-t border-silver/30">
                                <div className="flex items-center gap-2">
                                  {isCustomized ? (
                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-primary bg-sage/15 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                      <Tag className="w-3.5 h-3.5" />
                                      Customized
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider">
                                      Standard Price
                                    </span>
                                  )}
                                  {successMsg && (
                                    <span className="text-[10px] font-black text-primary animate-in fade-in duration-300 flex items-center gap-1">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      {successMsg}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isCustomized && (
                                    <button
                                      type="button"
                                      disabled={isSaving}
                                      onClick={() => handleResetToMrp(p.id, mrp)}
                                      className="px-3 py-2 border border-silver/50 hover:bg-silver/10 rounded-xl text-[10px] font-bold text-charcoal active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                      title="Reset to MRP"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-charcoal/50" />
                                      Reset
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleSavePriceOverride(p.id, mrp)}
                                    className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black hover:bg-primary/90 transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                                  >
                                    {isSaving ? "Saving..." : "Save Price"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* 6. DELIVERY CALENDAR TAB */}
          {activeSubTab === "calendar" && (() => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const monthNames = [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ];
            const blankBoxes = Array.from({ length: firstDayOfMonth });
            const dayBoxes = Array.from({ length: daysInMonth });

            const handlePrevMonth = () => {
              setCurrentDate(new Date(year, month - 1, 1));
            };

            const handleNextMonth = () => {
              setCurrentDate(new Date(year, month + 1, 1));
            };

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-silver/30 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-charcoal tracking-tight flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Delivery Calendar & Dropped Logs Audit
                    </h3>
                    <p className="text-xs text-charcoal/60 mt-1">
                      Day-by-day drop status mapping and vacation paused timelines for {customer.name}.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-silver/10 border border-silver/30 p-1.5 rounded-xl shrink-0">
                    <span className="text-xs font-bold text-charcoal/80 px-2">
                      {monthNames[month]} {year}
                    </span>
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-white rounded-lg text-charcoal transition-all cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-white rounded-lg text-charcoal transition-all cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grid Calendar */}
                <div className="max-w-md mx-auto bg-silver/5 p-6 rounded-3xl border border-silver/50 shadow-sm">
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black text-charcoal/40 uppercase tracking-wider mb-3">
                    <div>Su</div>
                    <div>Mo</div>
                    <div>Tu</div>
                    <div>We</div>
                    <div>Th</div>
                    <div>Fr</div>
                    <div>Sa</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {/* Empty headers matching start offset */}
                    {blankBoxes.map((_, idx) => (
                      <div key={`blank-${idx}`} className="py-3 bg-transparent"></div>
                    ))}
                    {dayBoxes.map((_, index) => {
                      const day = index + 1;
                      let bg = "bg-silver/10 text-charcoal/30";
                      let title = "Scheduled";

                      const isMay2026 = year === 2026 && month === 4;

                      if (isMay2026) {
                        if (day < 18) {
                          bg = "bg-emerald-500/15 text-emerald-700 font-extrabold border border-emerald-500/20";
                          title = "Delivered";
                        } else if (day === 18) {
                          bg = "bg-rose-500/15 text-rose-700 font-extrabold border border-rose-500/20";
                          title = "Not At Home / Failed Drop";
                        } else if (day > 18 && day < 22) {
                          bg = "bg-emerald-500/15 text-emerald-700 font-extrabold border border-emerald-500/20";
                          title = "Delivered";
                        } else {
                          bg = "bg-primary/5 text-primary font-bold border border-primary/20 hover:bg-primary/10 cursor-pointer";
                          title = "Scheduled Drop";
                        }
                      } else if (year < 2026 || (year === 2026 && month < 4)) {
                        bg = "bg-emerald-500/15 text-emerald-700 font-extrabold border border-emerald-500/20";
                        title = "Delivered";
                      } else {
                        bg = "bg-primary/5 text-primary font-bold border border-primary/20 hover:bg-primary/10 cursor-pointer";
                        title = "Scheduled Drop";
                      }

                      return (
                        <div
                          key={day}
                          title={title}
                          className={`py-2 text-xs rounded-lg flex flex-col items-center justify-center transition-all ${bg}`}
                        >
                          <span className="text-[11px]">{day}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2 mt-6 border-t border-silver/30 pt-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-3.5 h-3.5 rounded bg-emerald-500/15 border border-emerald-500/20 block" />
                      <span className="text-charcoal/60">Delivered Drops</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-3.5 h-3.5 rounded bg-rose-500/15 border border-rose-500/20 block" />
                      <span className="text-charcoal/60">Failed Delivery Attempts</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-3.5 h-3.5 rounded bg-primary/5 border border-primary/20 block" />
                      <span className="text-charcoal/60">Upcoming scheduled Drops</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Vacation Pause Modal */}
      {selectedSubToPause && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-silver/50 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-primary/10 via-primary/5 to-cream/20 border-b border-silver/30 flex justify-between items-center">
              <div>
                <h3 className="font-black text-charcoal text-sm uppercase tracking-wider">
                  Pause Subscription / Vacation
                </h3>
                <p className="text-[10px] font-bold text-charcoal/40 uppercase mt-0.5">
                  Set date range for vacation pause
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubToPause(null)}
                className="w-7 h-7 bg-white hover:bg-silver/10 border border-silver/50 rounded-lg flex items-center justify-center text-charcoal/50 hover:text-charcoal transition-colors cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handlePauseSubmit} className="p-6 space-y-5">
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-3 text-xs text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Important Notice</p>
                  <p className="text-[11px] font-semibold text-charcoal/60 leading-relaxed">
                    No deliveries will be scheduled or charged during this period. The subscription will automatically resume after the end date.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={pauseStart}
                    onChange={(e) => setPauseStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={pauseEnd}
                    onChange={(e) => setPauseEnd(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-silver/30">
                <button
                  type="button"
                  onClick={() => setSelectedSubToPause(null)}
                  className="px-4 py-2.5 border border-silver/50 hover:bg-silver/10 rounded-xl text-xs font-bold text-charcoal active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPauseSubmitLoading}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-black hover:bg-amber-700 transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isPauseSubmitLoading ? "Pausing..." : "Confirm Pause"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Subscription Modal */}
      {isAddSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-silver/50 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-primary/10 via-primary/5 to-cream/20 border-b border-silver/30 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-black text-charcoal text-sm uppercase tracking-wider">
                  Create New Subscription
                </h3>
                <p className="text-[10px] font-bold text-charcoal/40 uppercase mt-0.5">
                  Configure recurring delivery schedules and items for {customer.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubModalOpen(false)}
                className="w-7 h-7 bg-white hover:bg-silver/10 border border-silver/50 rounded-lg flex items-center justify-center text-charcoal/50 hover:text-charcoal transition-colors cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddSubSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* 1. Schedule Configuration */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-charcoal uppercase tracking-wider border-b border-silver/20 pb-2">
                    1. Scheduling & Frequency
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                        Delivery Frequency
                      </label>
                      <select
                        value={addSubFrequency}
                        onChange={(e) => setAddSubFrequency(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                      >
                        <option value="daily">Daily Delivery</option>
                        <option value="alternate">Alternate Days</option>
                        <option value="weekdays">Mon - Fri (Weekdays)</option>
                        <option value="weekends">Sat - Sun (Weekends)</option>
                        <option value="custom">Custom Days of Week</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                          Start Date
                        </label>
                        <input
                          type="date"
                          required
                          value={addSubStartDate}
                          onChange={(e) => setAddSubStartDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                          End Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={addSubEndDate}
                          onChange={(e) => setAddSubEndDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom Days Grid (rendered only when custom selected) */}
                  {addSubFrequency === "custom" && (
                    <div className="space-y-2 p-4 bg-silver/5 border border-silver/30 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                        Select Days of Delivery
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { val: 0, label: "Mon" },
                          { val: 1, label: "Tue" },
                          { val: 2, label: "Wed" },
                          { val: 3, label: "Thu" },
                          { val: 4, label: "Fri" },
                          { val: 5, label: "Sat" },
                          { val: 6, label: "Sun" },
                        ].map((day) => {
                          const isSelected = addSubCustomDays.includes(day.val);
                          return (
                            <button
                              key={day.val}
                              type="button"
                              onClick={() => handleToggleCustomDay(day.val)}
                              className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                isSelected
                                  ? "bg-primary text-white border-primary shadow-xs"
                                  : "bg-white text-charcoal border-silver/50 hover:bg-silver/10"
                              }`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Items configuration */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center border-b border-silver/20 pb-2">
                    <h4 className="text-xs font-black text-charcoal uppercase tracking-wider">
                      2. Subscription Items
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddSubItemRow}
                      className="flex items-center gap-1 text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-wider cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {addSubItems.map((item, index) => {
                      return (
                        <div
                          key={index}
                          className="flex items-end gap-3 p-3 bg-silver/5 border border-silver/30 rounded-2xl hover:border-silver/60 transition-colors animate-in fade-in duration-200"
                        >
                          <div className="flex-1 space-y-1.5">
                            <label className="text-[9px] font-black text-charcoal/40 uppercase tracking-wider">
                              Product Selection
                            </label>
                            <select
                              required
                              value={item.product}
                              onChange={(e) =>
                                handleUpdateSubItemRow(index, "product", e.target.value)
                              }
                              className="w-full px-3 py-2 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                            >
                              <option value="">Select a product...</option>
                              {productsList.map((p) => {
                                const price = getProductPrice(p.id);
                                const isAlreadySelected = addSubItems.some(
                                  (it, idx) => it.product === p.id && idx !== index
                                );
                                return (
                                  <option
                                    key={p.id}
                                    value={p.id}
                                    disabled={isAlreadySelected}
                                  >
                                    {p.name} - ₹{price.toFixed(2)}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="w-24 space-y-1.5 shrink-0">
                            <label className="text-[9px] font-black text-charcoal/40 uppercase tracking-wider block">
                              Quantity
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateSubItemRow(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-3 py-2 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                            />
                          </div>

                          {addSubItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSubItemRow(index)}
                              className="p-2.5 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl transition-colors cursor-pointer shrink-0"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Delivery Details */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-black text-charcoal uppercase tracking-wider border-b border-silver/20 pb-2">
                    3. Delivery Details & Notes
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                        Delivery Address Override
                      </label>
                      <textarea
                        value={addSubDeliveryAddress}
                        onChange={(e) => setAddSubDeliveryAddress(e.target.value)}
                        rows={2}
                        placeholder="Default customer address is used if blank..."
                        className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                        Special Instructions
                      </label>
                      <textarea
                        value={addSubSpecialInstructions}
                        onChange={(e) => setAddSubSpecialInstructions(e.target.value)}
                        rows={2}
                        placeholder="e.g. Leave at door, call before delivery..."
                        className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer / Summary */}
              <div className="px-6 py-5 bg-silver/5 border-t border-silver/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                  <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider">
                    Estimated Cost per Delivery
                  </p>
                  <p className="text-lg font-black text-primary">
                    ₹
                    {addSubItems
                      .reduce((acc, item) => {
                        const price = getProductPrice(item.product);
                        return acc + (item.quantity || 0) * price;
                      }, 0)
                      .toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddSubModalOpen(false)}
                    className="px-5 py-2.5 border border-silver/50 hover:bg-silver/10 rounded-xl text-xs font-bold text-charcoal active:scale-95 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddSubSubmitLoading}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/90 transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isAddSubSubmitLoading ? "Creating..." : "Create Subscription"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Container Event Modal */}
      {isAddBottleTransModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-silver/50 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-primary/10 via-primary/5 to-cream/20 border-b border-silver/30 flex justify-between items-center">
              <div>
                <h3 className="font-black text-charcoal text-sm uppercase tracking-wider">
                  Log Container Event
                </h3>
                <p className="text-[10px] font-bold text-charcoal/40 uppercase mt-0.5">
                  Record container movement or status updates
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBottleTransModalOpen(false)}
                className="w-7 h-7 bg-white hover:bg-silver/10 border border-silver/50 rounded-lg flex items-center justify-center text-charcoal/50 hover:text-charcoal transition-colors cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleBottleTransSubmit} className="p-6 space-y-5">
              {/* Container Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                  Container Type
                </label>
                <select
                  required
                  value={selectedBottleType}
                  onChange={(e) => setSelectedBottleType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                >
                  {bottleTypes.map((bt) => (
                    <option key={bt.id} value={bt.id}>
                      {bt.name} (Deposit: ₹{parseFloat(bt.deposit_amount).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type & Quantity Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                    Event Type
                  </label>
                  <select
                    required
                    value={bottleTransType}
                    onChange={(e) => setBottleTransType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                  >
                    <option value="returned">Returned</option>
                    <option value="issued">Issued</option>
                    <option value="broken">Broken</option>
                    <option value="refilled">Refilled</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                    Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bottleTransQty}
                    onChange={(e) => setBottleTransQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                  Movement Notes / Context
                </label>
                <textarea
                  value={bottleTransNotes}
                  onChange={(e) => setBottleTransNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Returned with daily morning delivery, credited driver..."
                  className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-silver/30">
                <button
                  type="button"
                  onClick={() => setIsAddBottleTransModalOpen(false)}
                  className="px-4 py-2.5 border border-silver/50 hover:bg-silver/10 rounded-xl text-xs font-bold text-charcoal active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBottleTransSubmitLoading}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/95 transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isBottleTransSubmitLoading ? "Submitting..." : "Submit Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfileTab;
