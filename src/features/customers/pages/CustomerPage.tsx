import React, { useEffect, useState, useMemo } from "react";
import { customerApi } from "../api/customerApi";
import { Users, Download, UserPlus, RefreshCw, PieChart, UserCircle, Map, MapPin, CheckCircle, AlertTriangle, QrCode, Upload } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { useNotificationStore } from "../../../store/useNotificationStore";
import CustomerDashboardTab from "../components/CustomerDashboardTab";
import CustomerDetailTab from "../components/CustomerDetailTab";
import CustomerProfileTab from "../components/CustomerProfileTab";
import CustomerQrTab from "../components/CustomerQrTab";
import CreateCustomerModal from "../components/CreateCustomerModal";
import { BulkCreateCustomersModal } from "../components/BulkCreateCustomersModal";
import type { Customer } from "../components/types";

const CustomerPage: React.FC = () => {
  const tenant = useAuthStore((state) => state.tenant);
  const user = useAuthStore((state) => state.user);
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "detail" | "profile" | "customer-qr">("dashboard");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAutoAssigning, setIsAutoAssigning] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);

  const [notification, _setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const setNotification = (val: { message: string; type: "success" | "error" } | null) => {
    _setNotification(val);
    if (val) {
      addNotification({
        title: val.type === "success" ? "Auto-Assignment Complete 🎉" : "Operation Failed ⚠️",
        message: val.message,
        type: val.type
      });
    }
  };

  // Check authorization (CRM_Managers or ERP_Admins)
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    return (
      user.groups.includes("CRM_Managers") || 
      user.groups.includes("ERP_Admins") || 
      user.role === "SuperAdmin"
    );
  }, [user]);

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

  const handleAutoAssignZones = async () => {
    setIsAutoAssigning(true);
    try {
      const res = await customerApi.autoAssignZones();
      setNotification({
        message: `${res.message}\nScanned: ${res.scanned} customers | Updated: ${res.updated} assignments`,
        type: "success"
      });
      // Refresh the customer list to reflect the updated zone assignments
      await fetchCustomers(true);
    } catch (error: any) {
      console.error("Failed to auto-assign zones:", error);
      setNotification({
        message: error?.response?.data?.detail || "Failed to auto-assign zones. Please check your permissions.",
        type: "error"
      });
    } finally {
      setIsAutoAssigning(false);
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);


  // Handle switching to profile details tab
  const handleViewProfile = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setActiveTab("profile");
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
          {isAuthorized && (
            <button
              onClick={handleAutoAssignZones}
              disabled={isAutoAssigning || isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="Auto-Assign Zones"
            >
              <MapPin className={`w-3.5 h-3.5 text-primary ${isAutoAssigning ? "animate-spin" : ""}`} />
              {isAutoAssigning ? "Assigning..." : "Auto-Assign Zones"}
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-silver/50 text-charcoal text-xs font-bold rounded-xl hover:bg-silver/10 transition-all shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-charcoal text-xs font-bold rounded-xl hover:bg-accent/95 shadow-md transition-all active:scale-95 cursor-pointer"
            title="Bulk Import Customers"
          >
            <Upload className="w-3.5 h-3.5" />
            Bulk Import
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* 2. Top-level Nested Section Tabs matching custom UI design layout reference */}
      <div className="border-b border-silver/60 mb-8 flex items-center gap-8 px-2">
        <button
          onClick={() => {
            setActiveTab("dashboard");
            setSelectedCustomerId(null);
          }}
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
          onClick={() => {
            setActiveTab("detail");
            setSelectedCustomerId(null);
          }}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "detail"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <Map
            className={`w-4 h-4 ${activeTab === "detail" ? "text-primary" : "text-charcoal/40"}`}
          />
          Customer Map View
          {activeTab === "detail" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("customer-qr");
            setSelectedCustomerId(null);
          }}
          className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
            activeTab === "customer-qr"
              ? "text-primary font-black"
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          <QrCode
            className={`w-4 h-4 ${activeTab === "customer-qr" ? "text-primary" : "text-charcoal/40"}`}
          />
          Customer QR
          {activeTab === "customer-qr" && (
            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
          )}
        </button>

        {selectedCustomerId && selectedCustomer && (
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 font-bold text-sm transition-all relative cursor-pointer flex items-center gap-2 ${
              activeTab === "profile"
                ? "text-primary font-black"
                : "text-charcoal/50 hover:text-charcoal"
            }`}
          >
            <UserCircle
              className={`w-4 h-4 ${activeTab === "profile" ? "text-primary" : "text-charcoal/40"}`}
            />
            Profile: {selectedCustomer.name}
            {activeTab === "profile" && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full shadow-xs"></div>
            )}
          </button>
        )}
      </div>

      {/* 3. Render Sub-Component Pages Modularly */}
      {activeTab === "dashboard" && (
        <CustomerDashboardTab
          customers={customers}
          isLoading={isLoading}
          onViewDetails={handleViewProfile}
        />
      )}

      {activeTab === "detail" && (
        <CustomerDetailTab
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          onBack={() => {
            setActiveTab("dashboard");
            setSelectedCustomerId(null);
          }}
          onManageProfile={handleViewProfile}
        />
      )}

      {activeTab === "profile" && selectedCustomer && (
        <CustomerProfileTab
          customer={selectedCustomer}
          onBack={() => {
            setActiveTab("dashboard");
            setSelectedCustomerId(null);
          }}
          onUpdateCustomer={(updatedCustomer) => {
            setCustomers((prev) =>
              prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
            );
          }}
        />
      )}

      {activeTab === "customer-qr" && (
        <CustomerQrTab
          customers={customers}
          isLoading={isLoading}
        />
      )}

      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-10 duration-300 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-500/20 text-emerald-800"
              : "bg-rose-50 border-rose-500/20 text-rose-800"
          }`}
        >
          <div
            className={`p-1.5 rounded-lg ${
              notification.type === "success"
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-sm">
              {notification.type === "success" ? "Auto-Assignment Complete" : "Error Occurred"}
            </h4>
            <p className="text-xs opacity-90 mt-0.5 whitespace-pre-line">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-xs font-bold opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchCustomers(true)}
      />
      {/* Bulk Import Customers Modal */}
      <BulkCreateCustomersModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => fetchCustomers(true)}
      />
    </div>
  );
};

export default CustomerPage;
