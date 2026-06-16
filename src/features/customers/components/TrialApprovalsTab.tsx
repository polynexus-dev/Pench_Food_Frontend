import React, { useState, useEffect } from "react";
import { customerApi } from "../api/customerApi";
import { Check, UserCheck, Search, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import type { Customer } from "./types";
import { useNotificationStore } from "../../../store/useNotificationStore";

interface TrialApprovalsTabProps {
  onViewProfile: (customerId: string) => void;
}

const TrialApprovalsTab: React.FC<TrialApprovalsTabProps> = ({ onViewProfile }) => {
  const [newCustomers, setNewCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const addNotification = useNotificationStore((state) => state.addNotification);

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

  useEffect(() => {
    fetchNewCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (customerId: string, customerName: string) => {
    setApprovingId(customerId);
    try {
      await customerApi.approveCustomer(customerId);
      addNotification({
        title: "Trial Approved! 🎉",
        message: `Customer "${customerName}" has been approved for a trial run. Welcoming push notification sent.`,
        type: "success"
      });
      // Remove from list
      setNewCustomers((prev) => prev.filter((c) => c.id !== customerId));
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
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search pending trials by name, phone or zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-silver/10 border border-silver/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-charcoal"
          />
        </div>
        <div className="text-xs font-semibold text-charcoal/50 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-primary" />
          Trial customers must be approved to receive daily deliveries.
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
              className="bg-white border border-silver/60 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-primary/20 transition-all group relative overflow-hidden"
            >
              {/* Card top banner style */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4
                      onClick={() => onViewProfile(customer.id)}
                      className="text-base font-bold text-charcoal hover:text-primary transition-colors cursor-pointer"
                    >
                      {customer.name}
                    </h4>
                    <p className="text-xs text-charcoal/50 mt-0.5 font-medium">{customer.email || "No email"}</p>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
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
                  onClick={() => handleApprove(customer.id, customer.name)}
                  disabled={approvingId !== null}
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
    </div>
  );
};

export default TrialApprovalsTab;
