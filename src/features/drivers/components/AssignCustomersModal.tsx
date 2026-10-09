import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  Check,
  Users,
  AlertCircle,
  Loader2,
  ArrowRightLeft,
  MapPin,
  Phone,
  UserCheck,
} from "lucide-react";
import { customerApi } from "../../customers/api/customerApi";
import type { Customer } from "../../customers/components/types";
import type { Zone } from "./types";

interface AssignCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverName: string;
  targetZoneId: string | null;
  targetZoneName: string;
  onSuccess: (assignedCount: number) => void;
  zones: Zone[];
}

export const AssignCustomersModal: React.FC<AssignCustomersModalProps> = ({
  isOpen,
  onClose,
  driverName,
  targetZoneId,
  targetZoneName,
  onSuccess,
  zones,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"unassigned" | "other_zones">("unassigned");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load all customers when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadCustomers = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        setSelectedIds(new Set());
        setSearchQuery("");
        const data = await customerApi.getCustomers();
        setCustomers(data);
      } catch (err: any) {
        console.error("Failed to load customers for assignment:", err);
        setErrorMessage("Failed to load customer list. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, [isOpen]);

  // Zone map for fast lookup
  const zoneMap = useMemo(() => {
    const map = new Map<string, string>();
    zones.forEach((z) => map.set(z.id, z.name));
    return map;
  }, [zones]);

  // Filter customers:
  // STRICT RULE: No overlapping. Customers already assigned to THIS rider's zone are excluded.
  const filteredCustomers = useMemo(() => {
    if (!targetZoneId) return [];

    const q = searchQuery.toLowerCase().trim();

    return customers.filter((c) => {
      // Exclude customers ALREADY assigned to this driver's zone (prevent overlap)
      if (c.zone === targetZoneId) return false;

      // Filter Mode: Unassigned only vs other zones
      if (filterMode === "unassigned" && c.zone) return false;
      if (filterMode === "other_zones" && !c.zone) return false;

      // Text search
      if (!q) return true;
      const nameMatch = c.name ? c.name.toLowerCase().includes(q) : false;
      const phoneMatch = c.phone ? String(c.phone).includes(q) : false;
      const companyMatch = c.company ? c.company.toLowerCase().includes(q) : false;
      const addressMatch = c.address ? c.address.toLowerCase().includes(q) : false;
      return nameMatch || phoneMatch || companyMatch || addressMatch;
    });
  }, [customers, targetZoneId, filterMode, searchQuery]);

  // Count unassigned and other zone customers
  const counts = useMemo(() => {
    let unassigned = 0;
    let otherZones = 0;

    customers.forEach((c) => {
      if (c.zone === targetZoneId) return; // already on this rider
      if (!c.zone) {
        unassigned++;
      } else {
        otherZones++;
      }
    });

    return { unassigned, otherZones };
  }, [customers, targetZoneId]);

  // Handle select / deselect
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all visible
  const handleSelectAll = () => {
    if (selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map((c) => c.id)));
    }
  };

  // Submit assignments
  const handleAssign = async () => {
    if (selectedIds.size === 0 || !targetZoneId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const idsToAssign = Array.from(selectedIds);
    try {
      // Concurrently update each customer's zone to targetZoneId
      // This atomically removes them from any prior zone, guaranteeing NO OVERLAPPING.
      await Promise.all(
        idsToAssign.map((id) =>
          customerApi.updateCustomer(id, { zone: targetZoneId })
        )
      );

      onSuccess(idsToAssign.length);
      onClose();
    } catch (err: any) {
      console.error("Failed to assign customers:", err);
      setErrorMessage("An error occurred while assigning customers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-silver/40 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-silver/40 flex items-center justify-between bg-silver/5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-charcoal">
                Assign Customers to {driverName}
              </h3>
            </div>
            <p className="text-xs text-charcoal/50 mt-1">
              Target Zone:{" "}
              <span className="font-bold text-primary">
                {targetZoneName || "Assigned Zone"}
              </span>{" "}
              • Assigned customers are exclusive to this rider (no overlapping).
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-charcoal/40 hover:text-charcoal hover:bg-silver/20 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 pt-4 pb-3 border-b border-silver/30 space-y-3 bg-white">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/30 w-4 h-4 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search by customer name, phone, address, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-silver/10 border border-silver/40 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all outline-none font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-silver/15 p-1 rounded-xl self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode("unassigned")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterMode === "unassigned"
                    ? "bg-white text-primary shadow-xs"
                    : "text-charcoal/60 hover:text-charcoal"
                }`}
              >
                Unassigned ({counts.unassigned})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("other_zones")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  filterMode === "other_zones"
                    ? "bg-white text-primary shadow-xs"
                    : "text-charcoal/60 hover:text-charcoal"
                }`}
              >
                <ArrowRightLeft className="w-3 h-3" />
                Transfer from Other Zones ({counts.otherZones})
              </button>
            </div>
          </div>

          {/* Quick Info / Transfer Note */}
          {filterMode === "other_zones" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-800 text-[11px] font-medium">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Selecting a customer from another zone will transfer them to{" "}
                <strong>{driverName}</strong>, removing them from their previous
                rider so there is <strong>zero overlap</strong>.
              </span>
            </div>
          )}

          {/* Selection Control Bar */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-charcoal/70 select-none">
              <input
                type="checkbox"
                checked={
                  filteredCustomers.length > 0 &&
                  selectedIds.size === filteredCustomers.length
                }
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-silver/60 text-primary accent-primary cursor-pointer"
              />
              <span>
                Select all filtered ({filteredCustomers.length})
              </span>
            </label>
            <span className="font-black text-primary">
              {selectedIds.size} selected
            </span>
          </div>
        </div>

        {/* Customer List Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs font-bold text-charcoal/40">Loading customers...</p>
            </div>
          ) : filteredCustomers.length > 0 ? (
            filteredCustomers.map((cust) => {
              const isSelected = selectedIds.has(cust.id);
              const currentZoneName = cust.zone ? zoneMap.get(cust.zone) || "Other Zone" : null;

              return (
                <div
                  key={cust.id}
                  onClick={() => toggleSelect(cust.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                    isSelected
                      ? "bg-primary/5 border-primary/40 shadow-xs"
                      : "bg-white border-silver/40 hover:border-silver/80 hover:bg-silver/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent div onClick
                      className="w-4 h-4 rounded border-silver/60 text-primary accent-primary cursor-pointer shrink-0"
                    />

                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-sage text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      {cust.name ? cust.name.charAt(0).toUpperCase() : "C"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-charcoal truncate">
                          {cust.name}
                        </p>
                        {cust.company && (
                          <span className="text-[10px] text-charcoal/40 font-medium truncate">
                            ({cust.company})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-charcoal/50 mt-0.5">
                        {cust.phone && (
                          <span className="flex items-center gap-1 font-bold text-charcoal/70">
                            <Phone className="w-2.5 h-2.5 text-charcoal/40" />
                            {cust.phone}
                          </span>
                        )}
                        {cust.address && (
                          <span className="flex items-center gap-1 truncate max-w-[320px]">
                            <MapPin className="w-2.5 h-2.5 text-charcoal/40 shrink-0" />
                            <span className="truncate">{cust.address}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 flex items-center gap-2">
                    {currentZoneName ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        <ArrowRightLeft className="w-2.5 h-2.5" />
                        {currentZoneName}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center border border-dashed border-silver/50 rounded-2xl bg-silver/5">
              <Users className="w-10 h-10 text-charcoal/20 mx-auto mb-2" />
              <p className="text-sm font-black text-charcoal/50">
                No matching customers found
              </p>
              <p className="text-xs text-charcoal/30 mt-1">
                {filterMode === "unassigned"
                  ? "All active customers are currently assigned to zones."
                  : "No other customers found matching the search criteria."}
              </p>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-4 border-t border-silver/40 flex items-center justify-between bg-silver/5">
          <div className="text-xs font-bold text-charcoal/60">
            {selectedIds.size > 0 ? (
              <span className="text-primary font-black">
                {selectedIds.size} customer{selectedIds.size > 1 ? "s" : ""} selected for assignment
              </span>
            ) : (
              "Select customers to assign"
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-charcoal/70 hover:bg-silver/20 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={selectedIds.size === 0 || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-xs ${
                selectedIds.size > 0 && !isSubmitting
                  ? "bg-primary text-white hover:bg-primary/90 hover:shadow-md cursor-pointer"
                  : "bg-silver/40 text-charcoal/40 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Assign Selected ({selectedIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
