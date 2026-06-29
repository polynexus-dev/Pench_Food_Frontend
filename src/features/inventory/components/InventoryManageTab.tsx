import React, { useState, useEffect } from "react";
import type { Product, RawMaterial, BottleType } from "./types";
import { inventoryApi } from "../api/inventoryApi";
import {
  Search,
  Grid,
  List,
  RotateCcw,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import ProvisionItemModal from "./modals/ProvisionItemModal";
import EditItemModal from "./modals/EditItemModal";
import DeleteItemModal from "./modals/DeleteItemModal";
import RawMaterialsModal from "./modals/RawMaterialsModal";

interface InventoryManageTabProps {
  filteredProducts: Product[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: "all" | "active" | "inactive";
  setStatusFilter: (val: "all" | "active" | "inactive") => void;
  returnableFilter: "all" | "returnable" | "non-returnable";
  setReturnableFilter: (val: "all" | "returnable" | "non-returnable") => void;
  viewMode: "grid" | "table";
  setViewMode: (val: "grid" | "table") => void;
  onRefreshCatalog: () => void;
}

const InventoryManageTab: React.FC<InventoryManageTabProps> = ({
  filteredProducts,
  isLoading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  returnableFilter,
  setReturnableFilter,
  viewMode,
  setViewMode,
  onRefreshCatalog,
}) => {
  // Bottle Types state
  const [bottleTypes, setBottleTypes] = useState<BottleType[]>([]);

  // Raw Materials state
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [isLoadingRawMaterials, setIsLoadingRawMaterials] = useState<boolean>(false);

  // Fetch Bottle Types & Raw Materials on Mount
  const fetchRawMaterials = async () => {
    try {
      setIsLoadingRawMaterials(true);
      const data = await inventoryApi.getRawMaterials();
      setRawMaterials(data);
    } catch (error) {
      console.error("Failed to load raw materials:", error);
    } finally {
      setIsLoadingRawMaterials(false);
    }
  };

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const data = await inventoryApi.getBottleTypes();
        setBottleTypes(data);
      } catch (error) {
        console.error("Failed to load bottle types:", error);
      }
    };
    fetchTypes();
    fetchRawMaterials();
  }, []);

  // Modal State Controls
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isRawModalOpen, setIsRawModalOpen] = useState<boolean>(false);

  // Edit / Delete Click triggers
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
  };

  return (
    <div className="animate-in fade-in duration-300 relative">
      {/* Real-time Search, Filters, and Layout Mode Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-silver/60 shadow-xs mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search items by variant label or SKU index..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-silver/20 rounded-xl border-none text-xs text-charcoal font-medium placeholder:text-charcoal/40 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal text-xs font-bold cursor-pointer"
            >
              &times;
            </button>
          )}
        </div>

        {/* Filters Grouping */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Segmented Controls */}
          <div className="flex items-center bg-silver/20 p-1 rounded-xl border border-silver/40 text-[11px] font-bold text-charcoal/60">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-white text-charcoal shadow-2xs font-black" : "hover:text-charcoal"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === "active" ? "bg-white text-emerald-600 shadow-2xs font-black" : "hover:text-charcoal"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === "inactive" ? "bg-white text-charcoal shadow-2xs font-black" : "hover:text-charcoal"
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Returnable Package Filters */}
          <div className="flex items-center bg-silver/20 p-1 rounded-xl border border-silver/40 text-[11px] font-bold text-charcoal/60">
            <button
              onClick={() => setReturnableFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                returnableFilter === "all" ? "bg-white text-charcoal shadow-2xs font-black" : "hover:text-charcoal"
              }`}
            >
              Any Package
            </button>
            <button
              onClick={() => setReturnableFilter("returnable")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                returnableFilter === "returnable" ? "bg-white text-amber-700 shadow-2xs font-black" : "hover:text-charcoal"
              }`}
            >
              <RotateCcw className="w-3 h-3 text-amber-500" /> Deposits
            </button>
            <button
              onClick={() => setReturnableFilter("non-returnable")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                returnableFilter === "non-returnable" ? "bg-white text-charcoal shadow-2xs font-black" : "hover:text-charcoal"
              }`}
            >
              Disposable
            </button>
          </div>

          {/* Layout Select Toggle Buttons */}
          <div className="flex items-center bg-silver/20 p-1 rounded-xl border border-silver/40 ml-auto lg:ml-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white text-primary shadow-2xs" : "text-charcoal/40 hover:text-charcoal"
              }`}
              title="Show Glassmorphic Cards Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-primary shadow-2xs" : "text-charcoal/40 hover:text-charcoal"
              }`}
              title="Show Enterprise List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Provisioning Buttons */}
          <button
            onClick={() => setIsRawModalOpen(true)}
            className="px-3.5 py-2 border border-primary/20 text-primary bg-primary/5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs hover:bg-primary/10 active:scale-95 transition-all cursor-pointer shrink-0 ml-auto lg:ml-2"
          >
            <Grid className="w-3.5 h-3.5" /> Raw Materials
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs hover:bg-primary/90 active:scale-95 transition-all cursor-pointer shrink-0 ml-auto lg:ml-2"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Item
          </button>
        </div>
      </div>

      {/* Core Catalog View Port */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-silver/50 shadow-xs flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-charcoal">Synchronizing Inventory Payload Streams...</p>
          <p className="text-xs text-charcoal/40 mt-1">Connecting to live distribution catalog array</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-silver/50 shadow-xs flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-charcoal/20 mb-3" />
          <p className="text-base font-black text-charcoal">No Matching Inventory SKUs Discovered</p>
          <p className="text-xs text-charcoal/50 max-w-sm mt-1 font-medium">
            Try resetting active label search parameters or filters to review full preloaded default catalog structures.
          </p>
          {(searchQuery || statusFilter !== "all" || returnableFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setReturnableFilter("all");
              }}
              className="mt-4 text-xs font-black text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/20 transition-all cursor-pointer"
            >
              Reset Search Parameters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* Glassmorphic Grid Cards View Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-silver/60 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group relative"
            >
              {/* Product Card Top Trim / Active Banner Strip */}
              <div className={`h-1.5 w-full ${item.is_active ? "bg-emerald-500" : "bg-silver"}`}></div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  {/* SKU Meta Label */}
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-silver/30 text-charcoal rounded border border-silver/50 group-hover:border-primary/40 transition-colors">
                    {item.sku}
                  </span>

                  {/* Operational Switch indicator badge */}
                  <span
                    className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                      item.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-silver/40 text-charcoal/50 border border-silver"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? "bg-emerald-500" : "bg-charcoal/30"}`}></span>
                    {item.is_active ? "Active SKU" : "Archived"}
                  </span>
                </div>

                {/* Primary Title info */}
                <h3 className="text-base font-black text-charcoal tracking-tight mt-3 group-hover:text-primary transition-colors">
                  {item.name}
                </h3>

                {/* Description Text */}
                <p className="text-xs text-charcoal/60 font-medium mt-1 line-clamp-2 flex-1">
                  {item.description || "Standard automated parameters package listing item."}
                </p>

                {/* Packaging container specs pill */}
                <div className="mt-4 pt-3 border-t border-silver/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {item.is_returnable ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-1">
                        <RotateCcw className="w-2.5 h-2.5 text-amber-500" />
                        {item.bottle_type_name || item.bottle_type || "Deposit Crate"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-charcoal/50 bg-silver/20 px-2 py-0.5 rounded-md">
                        Standard Unit
                      </span>
                    )}
                  </div>

                  {/* Formatted Price block */}
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-charcoal/40 block leading-3">Retail Target</span>
                    <span className="text-sm font-black text-charcoal">
                      ₹{parseFloat(item.unit_price).toFixed(2)}
                      <span className="text-[10px] font-medium text-charcoal/50"> / {item.unit}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="px-5 py-3 bg-silver/10 border-t border-silver/40 flex items-center justify-end gap-2 shrink-0">
                <button
                  onClick={() => handleEditClick(item)}
                  className="p-1.5 bg-white border border-silver/60 rounded-lg text-charcoal/70 hover:text-primary hover:border-primary/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  title="Edit Product"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(item)}
                  className="p-1.5 bg-white border border-silver/60 rounded-lg text-charcoal/70 hover:text-red-600 hover:border-red-200 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  title="Delete Product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* High-Density Responsive Table View Layout */
        <div className="bg-white rounded-3xl border border-silver/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-silver/10 text-[10px] font-black uppercase tracking-wider text-charcoal/40 border-b border-silver/40">
                <tr>
                  <th className="px-5 py-3.5">SKU Index</th>
                  <th className="px-5 py-3.5">Product Label</th>
                  <th className="px-5 py-3.5">Base Price</th>
                  <th className="px-5 py-3.5">Packaging Type</th>
                  <th className="px-5 py-3.5">Returns Policy</th>
                  <th className="px-5 py-3.5 text-right">System Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/30 text-xs">
                {filteredProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-silver/10 transition-colors group">
                    {/* SKU */}
                    <td className="px-5 py-4 font-mono font-bold text-charcoal/80 group-hover:text-primary transition-colors">
                      {item.sku}
                    </td>

                    {/* Name & Desc */}
                    <td className="px-5 py-4">
                      <div className="font-black text-charcoal tracking-tight">{item.name}</div>
                      <div className="text-[11px] text-charcoal/50 font-medium line-clamp-1 max-w-md mt-0.5">
                        {item.description || "Standard parameters setup"}
                      </div>
                    </td>

                    {/* Base Price */}
                    <td className="px-5 py-4 font-black text-charcoal">
                      ₹{parseFloat(item.unit_price).toFixed(2)}
                      <span className="text-[10px] font-medium text-charcoal/40"> / {item.unit}</span>
                    </td>

                    {/* Packaging Specs */}
                    <td className="px-5 py-4 text-charcoal/70 font-medium">
                      {(item.bottle_type_name || item.bottle_type) ? (
                        <span className="font-bold text-charcoal">{item.bottle_type_name || item.bottle_type}</span>
                      ) : (
                        <span className="text-charcoal/40 italic">Sealed Pack</span>
                      )}
                    </td>

                    {/* Returns */}
                    <td className="px-5 py-4">
                      {item.is_returnable ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded">
                          <RotateCcw className="w-2.5 h-2.5 text-amber-600" /> Returnable
                        </span>
                      ) : (
                        <span className="text-charcoal/40 text-[11px]">Disposable</span>
                      )}
                    </td>

                    {/* Status indicator */}
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          item.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-silver/40 text-charcoal/50 border border-silver"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? "bg-emerald-500" : "bg-charcoal/30"}`}></span>
                        {item.is_active ? "Active" : "Archived"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1 bg-white border border-silver/60 rounded-lg text-charcoal/70 hover:text-primary hover:border-primary/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                          title="Edit Product"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="p-1 bg-white border border-silver/60 rounded-lg text-charcoal/70 hover:text-red-600 hover:border-red-200 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Provisioning Glassmorphic Overlay Modal */}
      <ProvisionItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefreshCatalog}
        bottleTypes={bottleTypes}
        rawMaterials={rawMaterials}
      />

      {/* Edit Product Glassmorphic Overlay Modal */}
      <EditItemModal
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={onRefreshCatalog}
        bottleTypes={bottleTypes}
        rawMaterials={rawMaterials}
      />

      {/* Delete Confirmation Modal */}
      <DeleteItemModal
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onSuccess={onRefreshCatalog}
      />

      {/* Raw Materials Management Glassmorphic Overlay Modal */}
      <RawMaterialsModal
        isOpen={isRawModalOpen}
        onClose={() => setIsRawModalOpen(false)}
        rawMaterials={rawMaterials}
        isLoadingRawMaterials={isLoadingRawMaterials}
        onRefreshRawMaterials={fetchRawMaterials}
      />
    </div>
  );
};

export default InventoryManageTab;
