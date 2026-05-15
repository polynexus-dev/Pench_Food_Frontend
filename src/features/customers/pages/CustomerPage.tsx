import React, { useEffect, useState, useMemo } from "react";
import { customerApi } from "../api/customerApi";
import { Users, Download, UserPlus, RefreshCw, PieChart, UserCircle } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import CustomerDashboardTab from "../components/CustomerDashboardTab";
import CustomerDetailTab from "../components/CustomerDetailTab";
import type { Customer } from "../components/types";

const CustomerPage: React.FC = () => {
  const tenant = useAuthStore((state) => state.tenant);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "detail">("dashboard");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCustomers = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await customerApi.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [tenant]);

  // Handle switching to details view
  const handleViewDetails = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setActiveTab("detail");
  };

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  return (
    <div className="max-w-8xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2">
      {/* 1. Header Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-xs">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-charcoal tracking-tight flex items-center gap-2">
                Customer Directory
              </h1>
              <p className="text-charcoal/50 font-medium text-xs mt-0.5">
                Manage your retail and wholesale dairy partners.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <button
            onClick={() => fetchCustomers(false)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs disabled:opacity-50"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-silver/50 text-charcoal text-xs font-bold rounded-xl hover:bg-silver/10 transition-all shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <UserPlus className="w-4 h-4" />
            Add Customer
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
          onClick={() => setActiveTab("detail")}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "detail"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <UserCircle
            className={`w-4 h-4 ${activeTab === "detail" ? "text-primary" : "text-charcoal/40"}`}
          />
          Customer Details
          {activeTab === "detail" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>
      </div>

      {/* 3. Render Sub-Component Pages Modularly */}
      {activeTab === "dashboard" ? (
        <CustomerDashboardTab
          customers={customers}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
        />
      ) : (
        <CustomerDetailTab
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          onBack={() => setActiveTab("dashboard")}
        />
      )}
    </div>
  );
};

export default CustomerPage;
