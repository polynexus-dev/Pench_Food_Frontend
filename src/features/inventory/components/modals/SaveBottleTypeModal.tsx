import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { inventoryApi } from "../../api/inventoryApi";
import type { BottleType } from "../types";

interface SaveBottleTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  editingItem: BottleType | null;
  onSuccess: () => void;
  setNotification: (val: { title: string; message: string; type: "success" | "error" } | null) => void;
}

export const SaveBottleTypeModal: React.FC<SaveBottleTypeModalProps> = ({
  isOpen,
  onClose,
  editingId,
  editingItem,
  onSuccess,
  setNotification,
}) => {
  const [name, setName] = useState("");
  const [volumeMl, setVolumeMl] = useState("1000");
  const [depositAmount, setDepositAmount] = useState("50.00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingId && editingItem) {
        setName(editingItem.name);
        setVolumeMl(String(editingItem.volume_ml));
        setDepositAmount(editingItem.deposit_amount);
      } else {
        setName("");
        setVolumeMl("1000");
        setDepositAmount("50.00");
      }
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, editingId, editingItem]);

  if (!isOpen) return null;

  const handleSubmitBottleType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !volumeMl || !depositAmount) {
      setError("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        name,
        volume_ml: parseInt(volumeMl),
        deposit_amount: parseFloat(depositAmount).toFixed(2),
        is_active: true,
      };

      if (editingId) {
        await inventoryApi.updateBottleType(editingId, payload);
        setNotification({
          title: "Container Type Updated",
          message: `Successfully updated container type "${name}".`,
          type: "success",
        });
      } else {
        await inventoryApi.createBottleType(payload);
        setNotification({
          title: "Container Type Created",
          message: `Successfully created container type "${name}".`,
          type: "success",
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to save container type:", err);
      setError(
        editingId
          ? "Failed to update container type."
          : "Failed to create container type. Please verify configurations.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-silver/60 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary to-primary/90 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-black text-base tracking-tight">
              {editingId ? "Edit Container Type" : "Add Container Type"}
            </h3>
            <p className="text-[10px] text-white/70 font-medium mt-0.5">
              {editingId
                ? "Update the container type details"
                : "Create a new glass bottle variant for asset tracking"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications */}
        {success && (
          <div className="mx-5 mt-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-in fade-in duration-200">
            {success}
          </div>
        )}
        {error && (
          <div className="mx-5 mt-5 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmitBottleType} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-charcoal/70 mb-1">
              {"Container Name "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 1 Liter Glass Bottle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-silver/20 rounded-xl border border-silver/60 text-xs text-charcoal font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-charcoal/70 mb-1">
                {"Volume (ml) "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 1000"
                value={volumeMl}
                onChange={(e) => setVolumeMl(e.target.value)}
                className="w-full px-3 py-2 bg-silver/20 rounded-xl border border-silver/60 text-xs text-charcoal font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-charcoal/70 mb-1">
                {"Refundable Deposit (₹) "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 50.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3 py-2 bg-silver/20 rounded-xl border border-silver/60 text-xs text-charcoal font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-silver/40 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-silver/20 rounded-xl text-xs font-bold text-charcoal/70 hover:bg-silver/40 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  {editingId
                    ? "Update Container Type"
                    : "Create Container Type"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
