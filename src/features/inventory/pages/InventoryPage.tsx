import React, { useState, useEffect, useMemo } from "react";
import { inventoryApi } from "../api/inventoryApi";
import { useAuthStore } from "../../../store/useAuthStore";
import type {
  Product,
  BottleTrackingSummaryResponse,
} from "../components/types";
import InventoryDashboardTab from "../components/InventoryDashboardTab";
import InventoryManageTab from "../components/InventoryManageTab";
import InventoryBottleTrackingTab from "../components/InventoryBottleTrackingTab";
import {
  Package,
  RefreshCw,
  PieChart,
  Sliders,
  Check,
  Boxes,
  Warehouse,
} from "lucide-react";
import InventoryWarehouseTab from "../components/InventoryWarehouseTab";

const InventoryPage: React.FC = () => {
  const tenant = useAuthStore((state) => state.tenant) || "nagpur";

  // Navigation Sub-Tab State matching user custom design reference
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "manage" | "warehouse" | "bottles"
  >("dashboard");

  // Catalog State mapping exclusively to real live backend API connection
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Bottle Tracking State
  const [bottleSummary, setBottleSummary] =
    useState<BottleTrackingSummaryResponse | null>(null);
  const [isBottleLoading, setIsBottleLoading] = useState<boolean>(false);
  const [selectedBottleDate, setSelectedBottleDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all");

  // Optimization simulation state for enhanced dynamic appeal inside dashboard
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizedBanner, setOptimizedBanner] = useState<string | null>(null);

  // Search & Filtering controls for manage tab
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [returnableFilter, setReturnableFilter] = useState<
    "all" | "returnable" | "non-returnable"
  >("all");

  // Layout presentation mode
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Fetch product arrays dynamically via authenticated multi-tenant layer
  const fetchInventory = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      // Hits https://{{tenant}}.pench.api.polynexus.in/api/erp/inventory/products/ automatically
      const fetchedData = await inventoryApi.getProducts();
      setProducts(fetchedData);
    } catch (err: any) {
      console.error(
        "Live inventory data endpoint returned empty array status maps.",
        err,
      );
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBottleSummary = async (
    silent = false,
    date = selectedBottleDate,
    warehouseId = selectedWarehouseId
  ) => {
    if (!silent) {
      setIsBottleLoading(true);
    }
    try {
      const data = await inventoryApi.getBottleSummary(date, warehouseId);
      setBottleSummary(data);
    } catch (err) {
      console.error("Failed to fetch returnable containers summary desk:", err);
      setBottleSummary(null);
    } finally {
      setIsBottleLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [tenant]);

  useEffect(() => {
    if (activeTab === "bottles") {
      fetchBottleSummary(false, selectedBottleDate, selectedWarehouseId);
    }
  }, [activeTab, tenant, selectedBottleDate, selectedWarehouseId]);

  // Compute filtering sets dynamically
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Query check
      const query = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(query);
      const matchSku = item.sku.toLowerCase().includes(query);
      if (!matchName && !matchSku) return false;

      // Status check
      if (statusFilter === "active" && !item.is_active) return false;
      if (statusFilter === "inactive" && item.is_active) return false;

      // Returnable check
      if (returnableFilter === "returnable" && !item.is_returnable)
        return false;
      if (returnableFilter === "non-returnable" && item.is_returnable)
        return false;

      return true;
    });
  }, [products, searchQuery, statusFilter, returnableFilter]);

  // Aggregate stats calculations for dashboard tab
  const stats = useMemo(() => {
    const total = products.length;
    const activeCount = products.filter((p) => p.is_active).length;
    const returnableCount = products.filter((p) => p.is_returnable).length;

    const validPrices = products.map((p) => parseFloat(p.unit_price) || 0);
    const avgPrice =
      total > 0 ? validPrices.reduce((sum, val) => sum + val, 0) / total : 0;

    // Categorized breakdown for rich dashboard graphics
    const packageTypes: Record<string, number> = {};
    products.forEach((p) => {
      const key = p.bottle_type || "Sealed Pack";
      packageTypes[key] = (packageTypes[key] || 0) + 1;
    });

    return {
      total,
      activeCount,
      returnableCount,
      avgPrice: avgPrice.toFixed(2),
      packageTypes,
    };
  }, [products]);

  // Simulate pricing calibration handler
  const handleSimulateOptimization = () => {
    setIsOptimizing(true);
    setOptimizedBanner(null);
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizedBanner(
        "Variant base matrices calibrated successfully against tenant regional retail margins!",
      );
      setTimeout(() => setOptimizedBanner(null), 6000);
    }, 1200);
  };

  return (
    <div className="max-w-8xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* 1. Header Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-xs">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-charcoal tracking-tight flex items-center gap-2">
                Inventory Catalog
              </h1>
              <p className="text-charcoal/50 font-medium text-xs mt-0.5">
                Manage live distribution variants, retail pricing parameters,
                and package returns policies.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button
            onClick={() => {
              if (activeTab === "bottles") {
                fetchBottleSummary(false, selectedBottleDate, selectedWarehouseId);
              } else {
                fetchInventory(false);
              }
            }}
            disabled={activeTab === "bottles" ? isBottleLoading : isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs disabled:opacity-50"
            title="Reload items stream from active endpoint"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-primary ${(activeTab === "bottles" ? isBottleLoading : isLoading) ? "animate-spin" : ""}`}
            />
            Refresh {activeTab === "bottles" ? "Assets" : "Catalog"}
          </button>
        </div>
      </div>

      {/* 2. Top-level Nested Section Tabs matching custom UI design layout reference */}
      <div className="border-b border-silver/60 mb-8 flex items-center gap-8 px-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "dashboard"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <PieChart
            className={`w-4 h-4 ${activeTab === "dashboard" ? "text-primary" : "text-charcoal/40"}`}
          />
          Dashboard Overview
          {activeTab === "dashboard" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("manage")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "manage"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <Sliders
            className={`w-4 h-4 ${activeTab === "manage" ? "text-primary" : "text-charcoal/40"}`}
          />
          Manage Inventory
          {activeTab === "manage" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("warehouse")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "warehouse"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <Warehouse
            className={`w-4 h-4 ${activeTab === "warehouse" ? "text-primary" : "text-charcoal/40"}`}
          />
          Warehouse Locations
          {activeTab === "warehouse" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("bottles")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "bottles"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <Boxes
            className={`w-4 h-4 ${activeTab === "bottles" ? "text-primary" : "text-charcoal/40"}`}
          />
          Returnable Assets
          {activeTab === "bottles" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>
      </div>

      {/* Notification banner for optimizations */}
      {optimizedBanner && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          {optimizedBanner}
        </div>
      )}

      {/* 3. Render Sub-Component Pages Modularly */}
      {activeTab === "dashboard" && (
        <InventoryDashboardTab
          stats={stats}
          onSimulateOptimization={handleSimulateOptimization}
          isOptimizing={isOptimizing}
        />
      )}
      {activeTab === "manage" && (
        <InventoryManageTab
          filteredProducts={filteredProducts}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          returnableFilter={returnableFilter}
          setReturnableFilter={setReturnableFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onRefreshCatalog={() => fetchInventory(true)}
        />
      )}
      {activeTab === "warehouse" && <InventoryWarehouseTab />}
      {activeTab === "bottles" && (
        <InventoryBottleTrackingTab
          summary={bottleSummary}
          isLoading={isBottleLoading}
          selectedDate={selectedBottleDate}
          onDateChange={setSelectedBottleDate}
          selectedWarehouseId={selectedWarehouseId}
          onWarehouseChange={setSelectedWarehouseId}
          onRefresh={() => fetchBottleSummary(true, selectedBottleDate, selectedWarehouseId)}
        />
      )}
    </div>
  );
};

export default InventoryPage;
