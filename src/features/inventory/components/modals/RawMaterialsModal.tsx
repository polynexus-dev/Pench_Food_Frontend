import React, { useState } from "react";
import { X, Check, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { inventoryApi } from "../../api/inventoryApi";
import type { RawMaterial } from "../types";

interface RawMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: RawMaterial[];
  isLoadingRawMaterials: boolean;
  onRefreshRawMaterials: () => void;
}

const RawMaterialsModal: React.FC<RawMaterialsModalProps> = ({
  isOpen,
  onClose,
  rawMaterials,
  isLoadingRawMaterials,
  onRefreshRawMaterials,
}) => {
  const [editingRawMaterial, setEditingRawMaterial] = useState<RawMaterial | null>(null);
  const [rawFormData, setRawFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "Litre",
  });
  const [isRawSubmitting, setIsRawSubmitting] = useState<boolean>(false);
  const [rawSuccessMessage, setRawSuccessMessage] = useState<string | null>(null);
  const [rawErrorMessage, setRawErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRawInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRawFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawFormData.name || !rawFormData.sku) {
      setRawErrorMessage("Label and SKU identifier are required.");
      return;
    }

    setIsRawSubmitting(true);
    setRawErrorMessage(null);
    setRawSuccessMessage(null);

    try {
      if (editingRawMaterial) {
        await inventoryApi.updateRawMaterial(editingRawMaterial.id, {
          name: rawFormData.name.trim(),
          sku: rawFormData.sku.trim().toUpperCase(),
          description: rawFormData.description.trim(),
          unit: rawFormData.unit,
        });
        setRawSuccessMessage("Raw Material updated successfully!");
      } else {
        await inventoryApi.createRawMaterial({
          name: rawFormData.name.trim(),
          sku: rawFormData.sku.trim().toUpperCase(),
          description: rawFormData.description.trim(),
          unit: rawFormData.unit,
        });
        setRawSuccessMessage("Raw Material provisioned successfully!");
      }
      onRefreshRawMaterials();
      setRawFormData({ name: "", sku: "", description: "", unit: "Litre" });
      setEditingRawMaterial(null);
      setTimeout(() => setRawSuccessMessage(null), 2500);
    } catch (err: any) {
      setRawErrorMessage(err.response?.data?.detail || "Failed to submit raw material.");
    } finally {
      setIsRawSubmitting(false);
    }
  };

  const handleRawDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this raw material? All linked products will be unlinked.")) return;
    try {
      await inventoryApi.deleteRawMaterial(id);
      setRawSuccessMessage("Raw Material deleted successfully!");
      onRefreshRawMaterials();
      setTimeout(() => setRawSuccessMessage(null), 2500);
    } catch (err: any) {
      setRawErrorMessage("Failed to delete raw material.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-silver/60 shadow-xl max-w-3xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row h-[550px]">
        
        {/* Left side: Manage/List Raw Materials */}
        <div className="flex-1 p-6 flex flex-col overflow-y-auto border-r border-silver/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-base tracking-tight text-charcoal">Raw Materials</h3>
              <p className="text-[10px] text-charcoal/40 font-medium mt-0.5">Underlying bulk assets for derived forecasting</p>
            </div>
          </div>

          {rawSuccessMessage && (
            <div className="p-2.5 mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              {rawSuccessMessage}
            </div>
          )}

          {isLoadingRawMaterials ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2"></div>
              <p className="text-[11px] font-bold text-charcoal/40">Loading raw stock catalog...</p>
            </div>
          ) : rawMaterials.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-8 h-8 text-charcoal/20 mb-2" />
              <p className="text-xs font-black text-charcoal">No Raw Materials Provisioned</p>
              <p className="text-[10px] text-charcoal/40 max-w-[200px] mt-0.5 font-semibold">Use the provisioning dock to create your first bulk asset.</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {rawMaterials.map((rm) => (
                <div key={rm.id} className="bg-silver/20 border border-silver/40 rounded-xl p-3 flex items-center justify-between hover:border-primary/20 transition-all">
                  <div>
                    <div className="font-bold text-xs text-charcoal flex items-center gap-1.5">
                      {rm.name}
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-silver/60 rounded text-charcoal/60">{rm.sku}</span>
                    </div>
                    {rm.description && (
                      <div className="text-[10px] text-charcoal/50 font-medium line-clamp-1 mt-0.5">{rm.description}</div>
                    )}
                    <div className="text-[9px] text-primary/70 font-black mt-1">Measured in: {rm.unit}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRawMaterial(rm);
                        setRawFormData({
                          name: rm.name,
                          sku: rm.sku,
                          description: rm.description || "",
                          unit: rm.unit,
                        });
                      }}
                      className="p-1 bg-white hover:bg-primary/5 border border-silver/60 rounded-md text-charcoal/70 hover:text-primary transition-colors cursor-pointer"
                      title="Edit Raw Material"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRawDelete(rm.id)}
                      className="p-1 bg-white hover:bg-red-50 border border-silver/60 rounded-md text-charcoal/70 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete Raw Material"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Add/Edit Form Dock */}
        <div className="w-full md:w-[280px] bg-silver/10 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-silver/40">
              <h4 className="font-black text-xs uppercase tracking-wider text-charcoal/70">
                {editingRawMaterial ? "Modify Bulk Asset" : "Provision Bulk Asset"}
              </h4>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full hover:bg-silver/30 text-charcoal/40 hover:text-charcoal transition-colors cursor-pointer md:hidden"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {rawErrorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-[10px] font-bold">
                {rawErrorMessage}
              </div>
            )}

            <form onSubmit={handleRawSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-charcoal/70 mb-0.5">Label Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Raw Gir Cow Milk"
                  value={rawFormData.name}
                  onChange={handleRawInputChange}
                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-silver text-xs text-charcoal font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-charcoal/70 mb-0.5">SKU Code *</label>
                <input
                  type="text"
                  name="sku"
                  required
                  placeholder="e.g. RAW-MILK"
                  value={rawFormData.sku}
                  onChange={handleRawInputChange}
                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-silver text-xs text-charcoal font-mono font-bold uppercase focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-charcoal/70 mb-0.5">Base Unit *</label>
                <select
                  name="unit"
                  required
                  value={rawFormData.unit}
                  onChange={handleRawInputChange}
                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-silver text-xs text-charcoal font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="Litre">Litre (L)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="pcs">Pieces (pcs)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-charcoal/70 mb-0.5">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Specify asset notes..."
                  value={rawFormData.description}
                  onChange={handleRawInputChange}
                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-silver text-xs text-charcoal font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex gap-1.5">
                {editingRawMaterial && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRawMaterial(null);
                      setRawFormData({ name: "", sku: "", description: "", unit: "Litre" });
                    }}
                    className="flex-1 py-2 bg-silver/40 rounded-lg text-[10px] font-bold text-charcoal hover:bg-silver/60 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isRawSubmitting}
                  className="flex-2 py-2 bg-primary text-white rounded-lg text-[10px] font-black hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {editingRawMaterial ? "Commit Change" : "Commit Provision"}
                </button>
              </div>
            </form>
          </div>

          {/* Close Button Footer (MD and up) */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 border border-charcoal/15 bg-white rounded-xl text-xs font-bold text-charcoal/70 hover:bg-charcoal/5 transition-all mt-4 cursor-pointer"
          >
            Close Portal
          </button>
        </div>

      </div>
    </div>
  );
};

export default RawMaterialsModal;
