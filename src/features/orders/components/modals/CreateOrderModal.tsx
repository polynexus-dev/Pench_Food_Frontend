import React, { useState, useEffect } from "react";
import { X, ShoppingCart, CreditCard, User, PlusCircle } from "lucide-react";
import { orderApi } from "../../api/orderApi";
import { inventoryApi } from "../../../inventory/api/inventoryApi";
import { customerApi } from "../../../customers/api/customerApi";
import { useAuthStore } from "../../../../store/useAuthStore";
import type { Product } from "../../../inventory/components/types";
import type { Customer } from "../../../customers/components/types";
import { CustomSelect } from "../../../../components/common/CustomSelect";

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
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadModalData = async () => {
      setLoading(true);
      setErrorMsg(null);
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
          const activeCustomers = fetchedCustomers.filter((c) => c.is_active);
          setCustomers(activeCustomers);
          if (activeCustomers.length > 0) {
            setSelectedCustomerId(activeCustomers[0].id);
          }
        }

        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
        const day = String(tomorrow.getDate()).padStart(2, "0");
        setDate(`${year}-${month}-${day}`);
      } catch (error: any) {
        console.error("Failed to load modal data:", error);
        setErrorMsg("Failed to load product/customer metadata. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadModalData();
  }, [isOpen, isCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || !date) return;
    if (!isCustomer && !selectedCustomerId) {
      setErrorMsg("Please select a customer first.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        scheduled_delivery_date: date,
        items: [
          {
            product: selectedProductId,
            quantity: Number(quantity),
          },
        ],
      };

      if (!isCustomer) {
        payload.customer = selectedCustomerId;
      }

      await orderApi.createOrder(payload);

      if (onSuccess) {
        onSuccess(
          isCustomer
            ? "Your special order has been successfully placed!"
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
    <div className="fixed inset-0 bg-[#00000080] backdrop-blur-xs flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl border border-silver/50 shadow-2xl p-6 relative animate-in zoom-in-95 duration-250">
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
        <div className="border-b border-silver/30 pb-4 mb-6">
          <h3 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            {isCustomer ? "Place New One-Off Order" : "Create Customer Order"}
          </h3>
          <p className="text-xs text-charcoal/60 mt-1">
            {isCustomer
              ? "Request an additional drop scheduled immediately."
              : "Schedule a delivery drop directly for a customer."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col justify-center items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-charcoal/40 font-bold tracking-wider">
              Loading details...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Dropdown (Admin only) */}
            {!isCustomer && (
              <>
                {customers.length === 0 ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block ml-1">
                      Customer
                    </label>
                    <div className="py-2 text-xs text-red-500 font-bold">
                      No active customers found.
                    </div>
                  </div>
                ) : (
                  <CustomSelect
                    label="Customer"
                    icon={User}
                    value={selectedCustomerId}
                    onChange={(val) => setSelectedCustomerId(val)}
                    options={customers.map((c) => ({
                      label: `${c.name} (${c.phone})`,
                      value: c.id,
                    }))}
                    placeholder="Select customer..."
                  />
                )}
              </>
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
                className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all"
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
                className="w-full px-4 py-3 bg-silver/10 border border-silver/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all cursor-pointer"
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
              disabled={isSubmitting || products.length === 0 || (!isCustomer && customers.length === 0)}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/10 mt-6 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              {isSubmitting
                ? "Processing Order..."
                : isCustomer
                ? "Confirm & Book Delivery"
                : "Create Customer Order"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateOrderModal;
