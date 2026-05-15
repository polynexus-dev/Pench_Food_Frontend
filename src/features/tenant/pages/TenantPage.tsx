import React, { useState, useEffect, useMemo } from "react";
import { Building2, MapPin, RefreshCcw, LayoutGrid, List as ListIcon } from "lucide-react";
import { tenantApi } from "../api/tenantApi";
import type { City, Zone } from "../components/types";
import TenantListTab from "../components/TenantListTab";
import ZoneTab from "../components/ZoneTab";
import CreateTenantModal from "../components/CreateTenantModal";

const TenantPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"list" | "zones">("list");
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCities = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await tenantApi.getCities();
      setCities(data);
    } catch (error) {
      console.error("Failed to fetch tenant data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const filteredCities = useMemo(() => {
    return cities.filter(city =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.schema_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cities, searchQuery]);

  return (
    <div className="max-w-8xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* 1. Compact Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-xs">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-charcoal tracking-tight flex items-center gap-2">
                Tenant Control
              </h1>
              <p className="text-charcoal/50 font-medium text-xs mt-0.5">
                Configure and monitor your multi-tenant city instances and regional zones.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button
            onClick={() => fetchCities(false)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCcw
              className={`w-3.5 h-3.5 text-primary ${isLoading ? "animate-spin" : ""}`}
            />
            Sync Instances
          </button>
        </div>
      </div>

      {/* 2. Top-level Nested Section Tabs */}
      <div className="border-b border-silver/60 mb-6 flex items-center gap-8 px-2">
        <button
          onClick={() => setActiveTab("list")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "list" ? "text-primary font-black" : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <ListIcon className={`w-4 h-4 ${activeTab === "list" ? "text-primary" : "text-charcoal/40"}`} />
          List of Tenants
          {activeTab === "list" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>}
        </button>

        <button
          onClick={() => setActiveTab("zones")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "zones" ? "text-primary font-black" : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <MapPin className={`w-4 h-4 ${activeTab === "zones" ? "text-primary" : "text-charcoal/40"}`} />
          Operational Zones
          {activeTab === "zones" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>}
        </button>
      </div>

      {/* 3. Tab Content */}
      {activeTab === "list" ? (
        <TenantListTab 
          cities={filteredCities} 
          isLoading={isLoading} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddClick={() => setIsModalOpen(true)}
        />
      ) : (
        <ZoneTab />
      )}

      <CreateTenantModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCities}
      />
    </div>
  );
};

export default TenantPage;
