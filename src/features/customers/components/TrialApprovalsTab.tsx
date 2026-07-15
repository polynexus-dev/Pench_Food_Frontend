import React, { useState, useEffect } from "react";
import { customerApi } from "../api/customerApi";
import { Check, UserCheck, Search, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import type { Customer } from "./types";
import { useNotificationStore } from "../../../store/useNotificationStore";

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: string;
  unit: string;
  is_active: boolean;
}

interface TrialApprovalsTabProps {
  onViewProfile: (customerId: string) => void;
}

const TrialApprovalsTab: React.FC<TrialApprovalsTabProps> = ({ onViewProfile }) => {
  const [newCustomers, setNewCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkApproving, setIsBulkApproving] = useState<boolean>(false);
  const addNotification = useNotificationStore((state) => state.addNotification);

  // Modal & trial delivery inputs state
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalCustomer, setModalCustomer] = useState<{ id: string; name: string } | null>(null);
  const [modalIsBulk, setModalIsBulk] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchNewCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await customerApi.getNewCustomers();
      setNewCustomers(data);
    } catch (err) {
      console.error("Failed to load trial customers:", err);
      addNotification({
        title: "Load Error ⚠️",
        message: "Could not fetch new trial customers from server.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await customerApi.getProducts();
      const activeProducts = data.filter((p: any) => p.is_active);
      setProducts(activeProducts);
      if (activeProducts.length > 0) {
        setSelectedProductId(activeProducts[0].id);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  useEffect(() => {
    fetchNewCustomers();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automatically default date to tomorrow when modal opens
  useEffect(() => {
    if (isModalOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDeliveryDate(tomorrow.toISOString().split("T")[0]);
    }
  }, [isModalOpen]);

  const handleApproveClick = (customerId: string, customerName: string) => {
    setModalCustomer({ id: customerId, name: customerName });
    setModalIsBulk(false);
    setQuantity(1);
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
    setIsModalOpen(true);
  };

  const handleBulkApproveClick = () => {
    if (selectedIds.length === 0) return;
    setModalCustomer(null);
    setModalIsBulk(true);
    setQuantity(1);
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
    setIsModalOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedProductId || !deliveryDate || quantity <= 0) {
      addNotification({
        title: "Validation Error ⚠️",
        message: "Please fill in all fields correctly.",
        type: "error"
      });
      return;
    }

    setIsSubmitting(true);
    if (modalIsBulk) {
      setIsBulkApproving(true);
      try {
        const result = await customerApi.bulkApproveCustomers(
          selectedIds,
          selectedProductId,
          deliveryDate,
          quantity
        );
        addNotification({
          title: "Trials Approved! 🎉",
          message: `Successfully approved ${result.approved_customers.length} trial customers. Welcoming notifications sent.`,
          type: "success",
        });
        const approvedIds = result.approved_customers.map((c) => c.id);
        setNewCustomers((prev) => prev.filter((c) => !approvedIds.includes(c.id)));
        setSelectedIds((prev) => prev.filter((id) => !approvedIds.includes(id)));
        setIsModalOpen(false);
      } catch (err: any) {
        console.error("Failed to bulk approve trial customers:", err);
        addNotification({
          title: "Bulk Approval Failed ⚠️",
          message: err?.response?.data?.detail || "Could not bulk approve trial customers.",
          type: "error",
        });
      } finally {
        setIsBulkApproving(false);
      }
    } else if (modalCustomer) {
      const { id: customerId, name: customerName } = modalCustomer;
      setApprovingId(customerId);
      try {
        await customerApi.approveCustomer(customerId, selectedProductId, deliveryDate, quantity);
        addNotification({
          title: "Trial Approved! 🎉",
          message: `Customer "${customerName}" has been approved for a trial run. Welcoming push notification sent.`,
          type: "success"
        });
        // Remove from list and selection
        setNewCustomers((prev) => prev.filter((c) => c.id !== customerId));
        setSelectedIds((prev) => prev.filter((id) => id !== customerId));
        setIsModalOpen(false);
      } catch (err: any) {
        console.error("Failed to approve trial customer:", err);
        addNotification({
          title: "Approval Failed ⚠️",
          message: err?.response?.data?.detail || `Could not approve trial for ${customerName}.`,
          type: "error"
        });
      } finally {
        setApprovingId(null);
      }
    }
    setIsSubmitting(false);
  };

  const handleToggleSelect = (customerId: string) => {
    setSelectedIds((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleToggleSelectAll = () => {
    const filteredIds = filteredCustomers.map((c) => c.id);
    const allFilteredSelected = filteredIds.every((id) => selectedIds.includes(id));

    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Filter list based on search
  const filteredCustomers = newCustomers.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query) ||
      (c.zone_name && c.zone_name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-silver/60 shadow-xs">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search pending trials by name, phone or zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-silver/10 border border-silver/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-charcoal"
            />
          </div>

          {filteredCustomers.length > 0 && (
            <div className="flex items-center gap-2 bg-silver/5 px-3 py-1.5 rounded-xl border border-silver/30">
              <input
                type="checkbox"
                id="select-all-trials"
                checked={filteredCustomers.length > 0 && filteredCustomers.every(c => selectedIds.includes(c.id))}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 text-primary border-silver/80 rounded-sm focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
              />
              <label htmlFor="select-all-trials" className="text-xs font-bold text-charcoal select-none cursor-pointer">
                Select All ({filteredCustomers.length})
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {selectedIds.length > 0 ? (
            <button
              onClick={handleBulkApproveClick}
              disabled={isBulkApproving}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isBulkApproving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserCheck className="w-3.5 h-3.5" />
              )}
              Approve Selected ({selectedIds.length})
            </button>
          ) : (
            <div className="text-xs font-semibold text-charcoal/50 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              Trial customers must be approved to receive daily deliveries.
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-silver/60 rounded-2xl">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-charcoal/50 text-sm mt-3 font-semibold">Loading trial requests...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-silver/60 rounded-2xl text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 mb-4 animate-bounce">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-charcoal">All Clear!</h3>
          <p className="text-charcoal/50 text-sm mt-1 max-w-sm">
            {searchQuery
              ? "No trial requests found matching your search term."
              : "No pending customer trial requests. All accounts are up to date!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden ${
                selectedIds.includes(customer.id) ? "border-primary/40 shadow-sm" : "border-silver/60"
              }`}
            >
              {/* Card top banner style */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(customer.id)}
                      onChange={() => handleToggleSelect(customer.id)}
                      className="mt-1 w-4.5 h-4.5 text-primary border-silver/80 rounded-sm focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
                    />
                    <div>
                      <h4
                        onClick={() => onViewProfile(customer.id)}
                        className="text-base font-bold text-charcoal hover:text-primary transition-colors cursor-pointer leading-snug"
                      >
                        {customer.name}
                      </h4>
                      <p className="text-xs text-charcoal/50 mt-0.5 font-medium">{customer.email || "No email"}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">
                    <Sparkles className="w-3 h-3" />
                    Trial Request
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-charcoal/70 border-t border-b border-silver/40 py-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-charcoal/40">Phone:</span>
                    <span className="font-medium">{customer.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-charcoal/40">Zone:</span>
                    <span className="font-medium text-primary font-bold">
                      {customer.zone_name || customer.zone || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-charcoal/40 shrink-0">Address:</span>
                    <span className="font-medium text-right truncate max-w-[180px]" title={customer.address}>
                      {customer.address}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-5">
                <button
                  onClick={() => onViewProfile(customer.id)}
                  className="flex-1 py-2 border border-silver/60 hover:bg-silver/10 rounded-xl text-xs font-bold text-charcoal transition-all cursor-pointer"
                >
                  View Profile
                </button>
                <button
                  onClick={() => handleApproveClick(customer.id, customer.name)}
                  disabled={approvingId !== null || isBulkApproving}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {approvingId === customer.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  Approve Trial
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trial Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-silver/60 shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Setup Trial Delivery
              </h3>
              <p className="text-xs text-charcoal/50">
                {modalIsBulk
                  ? `Specify the product and delivery date for the ${selectedIds.length} selected trial customers.`
                  : `Specify the product and delivery date for approving ${modalCustomer?.name}'s trial.`}
              </p>
            </div>

            <div className="space-y-4">
              {/* Product selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal/70">Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-silver/10 border border-silver/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-charcoal"
                >
                  <option value="" disabled>-- Select a Product --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (₹{product.unit_price} / {product.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal/70">Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-silver/10 border border-silver/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-charcoal"
                />
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal/70">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-silver/10 border border-silver/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-charcoal"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 border border-silver/60 hover:bg-silver/10 rounded-xl text-xs font-bold text-charcoal transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={isSubmitting || products.length === 0}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" />
                )}
                Confirm & Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialApprovalsTab;
