import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, ShoppingCart, CreditCard, PlusCircle, Search, UserPlus, CheckCircle2, Phone, MapPin } from "lucide-react";
import { orderApi } from "../../api/orderApi";
import { inventoryApi } from "../../../inventory/api/inventoryApi";
import { customerApi } from "../../../customers/api/customerApi";
import { useAuthStore } from "../../../../store/useAuthStore";
import type { Product } from "../../../inventory/components/types";
import type { Customer } from "../../../customers/components/types";
import { CustomSelect } from "../../../../components/common/CustomSelect";
import { LogoSpinner } from "../../../../components/common/LogoSpinner";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const isCustomer = !!(user?.is_customer && !user?.is_superuser && !user?.is_staff);

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // POS Customer Search & Selection State
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<Customer | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // POS New Lead / Customer Registration State
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const loadModalData = async () => {
      setLoading(true);
      setErrorMsg(null);
      setSelectedCustomerId("");
      setSelectedCustomerObj(null);
      setCustomerSearchQuery("");
      setIsNewCustomerMode(false);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustAddress("");

      try {
        // Load active products
        const fetchedProducts = await inventoryApi.getProducts();
        const activeProducts = fetchedProducts.filter((p) => p.is_active);
        setProducts(activeProducts);
        if (activeProducts.length > 0) {
          setSelectedProductId(activeProducts[0].id);
        }

        // Load customers if administrator
        if (!isCustomer) {
          const fetchedCustomers = await customerApi.getCustomers();
          setCustomers(fetchedCustomers);
          if (fetchedCustomers.length > 0) {
            // Default to first customer
            const first = fetchedCustomers[0];
            setSelectedCustomerId(first.id);
            setSelectedCustomerObj(first);
            setCustomerSearchQuery(`${first.name} (${first.phone || "No phone"})`);
          }
        }

        // Default date to TODAY (for POS immediate orders)
        const todayStr = new Date().toISOString().split("T")[0];
        setDate(todayStr);
      } catch (error: any) {
        console.error("Failed to load modal data:", error);
        setErrorMsg("Failed to load product/customer metadata. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadModalData();
  }, [isOpen, isCustomer]);

  // Filtered customer list matching POS query
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.toLowerCase().trim();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter((c) => {
        const nameMatch = (c.name || "").toLowerCase().includes(q);
        const phoneMatch = (c.phone || "").includes(q);
        const emailMatch = (c.email || "").toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch;
      })
      .slice(0, 8);
  }, [customers, customerSearchQuery]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setSelectedCustomerObj(c);
    setCustomerSearchQuery(`${c.name} (${c.phone || "No phone"})`);
    setIsDropdownOpen(false);
    setIsNewCustomerMode(false);
  };

  const handleEnableNewCustomerMode = () => {
    setIsNewCustomerMode(true);
    setSelectedCustomerId("");
    setSelectedCustomerObj(null);
    setIsDropdownOpen(false);
    
    // Auto-fill phone or name if user typed numbers/text into search
    const query = customerSearchQuery.trim();
    if (/^\d+$/.test(query)) {
      setNewCustPhone(query);
      setNewCustName("");
    } else if (query) {
      setNewCustName(query);
      setNewCustPhone("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || !date) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    let targetCustomerId = selectedCustomerId;

    try {
      // If Admin and New Customer mode is active, create new customer in Leads first
      if (!isCustomer && isNewCustomerMode) {
        if (!newCustName.trim() || !newCustPhone.trim()) {
          setErrorMsg("Please provide both Customer Name and Mobile Number.");
          setIsSubmitting(false);
          return;
        }

        // Check if customer with this phone already exists in local list
        const existing = customers.find(c => (c.phone || "").trim() === newCustPhone.trim());
        if (existing) {
          targetCustomerId = existing.id;
        } else {
          // Create new Lead/Customer record
          const createdCust = await customerApi.createCustomer({
            name: newCustName.trim(),
            phone: newCustPhone.trim(),
            address: newCustAddress.trim(),
            is_active: false, // Automatically saved in Leads / Non-subscribed
          });
          targetCustomerId = createdCust.id;
        }
      } else if (!isCustomer && !targetCustomerId) {
        setErrorMsg("Please select an existing customer or enter new customer details.");
        setIsSubmitting(false);
        return;
      }

      const payload: any = {
        scheduled_delivery_date: date,
        items: [
          {
            product: selectedProductId,
            quantity: Number(quantity),
          },
        ],
      };

      if (!isCustomer && targetCustomerId) {
        payload.customer = targetCustomerId;
      }

      await orderApi.createOrder(payload);

      if (onSuccess) {
        onSuccess(
          isCustomer
            ? "Your special order has been successfully placed!"
            : isNewCustomerMode
            ? `Order created & New Lead (${newCustName}) saved in Leads directory!`
            : "Customer order has been created successfully!"
        );
      }
      onClose();
    } catch (error: any) {
      console.error("Failed to create order:", error);
      setErrorMsg(
        error.response?.data?.detail ||
          error.message ||
          "Failed to create order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedProductObj = products.find((p) => p.id === selectedProductId);
  const selectedProductPrice = selectedProductObj
    ? parseFloat(selectedProductObj.unit_price)
    : 0;
  const estimatedCost = selectedProductPrice * (Number(quantity) || 1);

  return (
    <div className="fixed inset-0 bg-[#00000080] backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-silver/50 shadow-2xl p-6 relative animate-in zoom-in-95 duration-250 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 p-2 text-charcoal/40 hover:text-charcoal hover:bg-silver/10 rounded-xl transition-all cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-silver/30 pb-4 mb-5">
          <h3 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            {isCustomer ? "Place New Order" : "POS / Create Customer Order"}
          </h3>
          <p className="text-xs text-charcoal/60 mt-1">
            {isCustomer
              ? "Request an additional drop scheduled immediately."
              : "Search existing customer by Name/Mobile or create a POS order for a new Lead."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <LogoSpinner size="lg" label="Loading POS catalog..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* POS Customer Autocomplete & Quick Add (Admin only) */}
            {!isCustomer && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">
                    Customer Details (POS)
                  </label>
                  {!isNewCustomerMode ? (
                    <button
                      type="button"
                      onClick={handleEnableNewCustomerMode}
                      className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      + Add New Customer / Lead
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsNewCustomerMode(false)}
                      className="text-[11px] font-extrabold text-charcoal/50 hover:text-charcoal hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Search Existing Customers
                    </button>
                  )}
                </div>

                {!isNewCustomerMode ? (
                  /* Existing Customer Autocomplete Field */
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/30 w-4 h-4" />
                      <input
                        type="text"
                        value={customerSearchQuery}
                        onChange={(e) => {
                          setCustomerSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                          setSelectedCustomerId("");
                          setSelectedCustomerObj(null);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Search by Name or Mobile No (e.g., 98765)..."
                        className="w-full pl-10 pr-10 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white font-bold transition-all"
                      />
                      {customerSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerSearchQuery("");
                            setSelectedCustomerId("");
                            setSelectedCustomerObj(null);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Selected Badge */}
                    {selectedCustomerObj && (
                      <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          Selected: {selectedCustomerObj.name} ({selectedCustomerObj.phone || "No phone"})
                        </span>
                        <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">
                          {selectedCustomerObj.is_active ? "Active" : "Lead"}
                        </span>
                      </div>
                    )}

                    {/* Autocomplete Suggestions Dropdown */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-silver/60 rounded-2xl shadow-xl z-50 max-h-52 overflow-y-auto custom-scrollbar py-1">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-center">
                            <p className="text-xs font-bold text-charcoal/50">No matching customer found</p>
                            <button
                              type="button"
                              onClick={handleEnableNewCustomerMode}
                              className="mt-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Create "{customerSearchQuery}" as New Lead
                            </button>
                          </div>
                        ) : (
                          filteredCustomers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCustomer(c)}
                              className="w-full text-left px-4 py-2.5 hover:bg-silver/10 flex items-center justify-between text-xs transition-colors border-b border-silver/20 last:border-none cursor-pointer"
                            >
                              <div>
                                <span className="font-extrabold text-charcoal block">{c.name}</span>
                                <span className="text-[11px] text-charcoal/50 font-medium">
                                  {c.phone || "No phone"} • {c.address || "No address"}
                                </span>
                              </div>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${c.is_active ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                {c.is_active ? "Customer" : "Lead"}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* New Customer / Lead Quick Add Form */
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-primary border-b border-primary/10 pb-2">
                      <span className="flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4" />
                        New Customer / Lead Registration
                      </span>
                      <span className="text-[9px] uppercase font-black px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                        Saves to Leads
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-charcoal/70 block">
                        Customer Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        placeholder="Enter full name..."
                        className="w-full px-3.5 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-charcoal/70 block">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30 w-3.5 h-3.5" />
                        <input
                          type="tel"
                          required
                          value={newCustPhone}
                          onChange={(e) => setNewCustPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-charcoal/70 block">
                        Delivery Address / Area (Optional)
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30 w-3.5 h-3.5" />
                        <input
                          type="text"
                          value={newCustAddress}
                          onChange={(e) => setNewCustAddress(e.target.value)}
                          placeholder="e.g. Flat 402, Green Valley Apartments"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-medium text-charcoal focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product Selector */}
            {products.length === 0 ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">
                  Product
                </label>
                <div className="py-2 text-xs text-red-500 font-bold">
                  No active products found in inventory.
                </div>
              </div>
            ) : (
              <CustomSelect
                label="Product"
                icon={ShoppingCart}
                value={selectedProductId}
                onChange={(val) => setSelectedProductId(val)}
                options={products.map((p) => ({
                  label: `${p.name} (₹${p.unit_price}/${p.unit})`,
                  value: p.id,
                }))}
                placeholder="Select product..."
              />
            )}

            {/* Quantity */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm font-bold text-charcoal focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all"
              />
            </div>

            {/* Delivery Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">
                Delivery Date
              </label>
              <input
                type="date"
                required
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm font-bold text-charcoal focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all cursor-pointer"
              />
            </div>

            {/* Price Preview */}
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex justify-between items-center mt-6">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-charcoal/60">Estimated Total Cost</span>
              </div>
              <span className="text-lg font-black text-primary">
                ₹{estimatedCost.toFixed(2)}
              </span>
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              disabled={isSubmitting || products.length === 0 || (!isCustomer && !isNewCustomerMode && !selectedCustomerId)}
              className="w-full bg-[#004d3d] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/10 mt-6 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              {isSubmitting
                ? "Processing POS Order..."
                : isCustomer
                ? "Confirm & Book Delivery"
                : isNewCustomerMode
                ? "Create Order & Save Lead"
                : "Create Customer Order"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateOrderModal;

