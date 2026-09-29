import React, { useState, useEffect, useMemo } from "react";
import { Search, Mail, Phone, MoreVertical, Filter, LayoutGrid, List as ListIcon, Calendar, Users, Trash2, X, Loader2, User, Boxes, ChevronLeft, ChevronRight } from "lucide-react";
import type { Customer } from "./types";
import { tenantApi } from "../../tenant/api/tenantApi";
import { driverApi } from "../../drivers/api/driverApi";
import axiosInstance from "../../../api/axiosInstance";
import { customerApi } from "../api/customerApi";

const ALPHABETS = ["ALL", "0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

interface CustomerDashboardTabProps {
  customers: Customer[];
  isLoading: boolean;
  onViewDetails: (customerId: string) => void;
  onRefresh: () => void;
  mode?: "subscribed" | "leads";
}

const CustomerDashboardTab: React.FC<CustomerDashboardTabProps> = ({ customers, isLoading, onViewDetails, onRefresh, mode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pagination & Alphabetical Navigation States
  const [selectedLetter, setSelectedLetter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);

  // Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [deleteConfirmIds, setDeleteConfirmIds] = useState<string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close active dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Filter States
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedRider, setSelectedRider] = useState<string>("");
  const [selectedBottleType, setSelectedBottleType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Dropdown Options State
  const [zones, setZones] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [bottleBalances, setBottleBalances] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Fetch filter dropdown data on mount
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const zonesData = await tenantApi.getZones();
        setZones(zonesData);
      } catch (err) {
        console.warn("Failed to fetch zones for customer filters:", err);
      }

      try {
        const ridersData = await driverApi.getDrivers();
        setRiders(ridersData);
      } catch (err) {
        console.warn("Failed to fetch riders for customer filters:", err);
      }

      try {
        const response = await axiosInstance.get("/erp/inventory/bottle-balances/");
        setBottleBalances(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.warn("Failed to fetch bottle balances for customer filters:", err);
      }
    };

    loadFilterData();
  }, []);

  // Helper to extract sorting & letter matching characters
  const getCustomerInitial = (cust: Customer): { firstChar: string; firstAlphaChar: string | null } => {
    const name = (cust.name || cust.company || "").trim();
    const firstChar = name.length > 0 ? name.charAt(0).toUpperCase() : "";
    const alphaMatch = name.match(/[a-zA-Z]/);
    const firstAlphaChar = alphaMatch ? alphaMatch[0].toUpperCase() : null;
    return { firstChar, firstAlphaChar };
  };

  const baseCustomers = useMemo(() => {
    return (customers || []).filter((customer) => {
      if (!customer) return false;
      const activeSubs = customer.dashboard?.active_subscriptions || 0;
      if (mode === "leads") {
        return activeSubs === 0;
      }
      // default: show only active subscribed customers
      return activeSubs > 0;
    });
  }, [customers, mode]);

  // Compute available customer counts for each letter in the alphabet bar
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: baseCustomers.length };
    for (const c of baseCustomers) {
      const { firstChar, firstAlphaChar } = getCustomerInitial(c);
      if (firstChar >= "0" && firstChar <= "9") {
        counts["0-9"] = (counts["0-9"] || 0) + 1;
      }
      if (firstAlphaChar) {
        counts[firstAlphaChar] = (counts[firstAlphaChar] || 0) + 1;
      } else if (firstChar && firstChar >= "A" && firstChar <= "Z") {
        counts[firstChar] = (counts[firstChar] || 0) + 1;
      }
    }
    return counts;
  }, [baseCustomers]);

  const filteredCustomers = useMemo(() => {
    const searchLower = (searchQuery || "").toLowerCase().trim();

    return baseCustomers
      .filter((customer) => {
        // 0. Alphabetical Quick-Filter
        if (selectedLetter !== "ALL") {
          const { firstChar, firstAlphaChar } = getCustomerInitial(customer);
          if (selectedLetter === "0-9") {
            if (!(firstChar >= "0" && firstChar <= "9")) return false;
          } else {
            if (firstChar !== selectedLetter && firstAlphaChar !== selectedLetter) {
              return false;
            }
          }
        }

        // 1. Search text filter
        if (searchLower) {
          const digitQuery = searchQuery.replace(/\D/g, "");

          const nameMatch = customer.name ? customer.name.toLowerCase().includes(searchLower) : false;
          const emailMatch = customer.email ? customer.email.toLowerCase().includes(searchLower) : false;

          // Phone matching: raw string match OR digit-normalized match
          const rawPhone = customer.phone ? String(customer.phone) : "";
          const cleanPhone = rawPhone.replace(/\D/g, "");
          const phoneMatch =
            rawPhone.toLowerCase().includes(searchLower) ||
            (digitQuery.length > 0 && cleanPhone.includes(digitQuery));

          const usernameMatch = customer.username ? customer.username.toLowerCase().includes(searchLower) : false;
          const companyMatch = customer.company ? customer.company.toLowerCase().includes(searchLower) : false;

          if (!nameMatch && !emailMatch && !phoneMatch && !usernameMatch && !companyMatch) {
            return false;
          }
        }

        // 2. Zone filter
        if (selectedZone && customer.zone !== selectedZone) {
          return false;
        }

        // 3. Rider filter (rider's assigned zone matches customer's zone)
        if (selectedRider) {
          const rider = riders.find((r) => r.id === selectedRider);
          if (!rider || customer.zone !== rider.zone) {
            return false;
          }
        }

        // 4. Status filter
        if (selectedStatus) {
          const isActive = selectedStatus === "active";
          if (customer.is_active !== isActive) {
            return false;
          }
        }

        // 5. Bottle Type filter
        if (selectedBottleType) {
          const custBalances = bottleBalances.filter((b) => b && b.customer === customer.id);
          
          if (selectedBottleType === "1L") {
            const has1L = custBalances.some((b) => b.bottle_type_name && b.bottle_type_name.toLowerCase().includes("1") && b.balance > 0);
            if (!has1L) return false;
          } else if (selectedBottleType === "500ml") {
            const has500ml = custBalances.some((b) => b.bottle_type_name && b.bottle_type_name.toLowerCase().includes("500") && b.balance > 0);
            if (!has500ml) return false;
          } else if (selectedBottleType === "none") {
            const hasAny = custBalances.some((b) => b.balance > 0);
            if (hasAny) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Natural alphabetical sorting A-Z
        const nameA = (a.name || a.company || "").trim().toLowerCase();
        const nameB = (b.name || b.company || "").trim().toLowerCase();
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
      });
  }, [baseCustomers, searchQuery, selectedLetter, selectedZone, selectedRider, selectedStatus, selectedBottleType, riders, bottleBalances]);

  // Reset to first page whenever search, letter, or other filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLetter, selectedZone, selectedRider, selectedStatus, selectedBottleType, mode, pageSize]);

  // Pagination Calculations
  const totalCustomers = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalCustomers / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCustomers);

  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, startIndex, endIndex]);

  // Page-Level Selection Logic
  const currentPageIds = useMemo(() => {
    return paginatedCustomers.map((c) => c.id);
  }, [paginatedCustomers]);

  const isAllCurrentPageSelected = useMemo(() => {
    return currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));
  }, [currentPageIds, selectedIds]);

  const isSomeCurrentPageSelected = useMemo(() => {
    return currentPageIds.some((id) => selectedIds.includes(id)) && !isAllCurrentPageSelected;
  }, [currentPageIds, selectedIds, isAllCurrentPageSelected]);

  const handleToggleSelectPage = () => {
    if (isAllCurrentPageSelected) {
      // Deselect all customers on the current page
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      // Select all customers on the current page
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  // Reusable Pagination Component
  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 7;
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (safePage > 3) pages.push("...");
        const start = Math.max(2, safePage - 1);
        const end = Math.min(totalPages - 1, safePage + 1);
        for (let i = start; i <= end; i++) {
          if (!pages.includes(i)) pages.push(i);
        }
        if (safePage < totalPages - 2) pages.push("...");
        pages.push(totalPages);
      }
      return pages;
    };

    return (
      <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-1">
        <div className="text-xs font-bold text-charcoal/50">
          Page <span className="text-charcoal font-black">{safePage}</span> of{" "}
          <span className="text-charcoal font-black">{totalPages}</span> ({totalCustomers} total)
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-silver/50 rounded-xl text-xs font-bold text-charcoal/70 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`dots-${idx}`} className="px-2 text-xs font-bold text-charcoal/30 select-none">
                    ...
                  </span>
                );
              }
              const pageNum = p as number;
              const isActive = pageNum === safePage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-8 h-8 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                      : "bg-white border border-silver/50 text-charcoal/70 hover:text-primary hover:border-primary/30"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-silver/50 rounded-xl text-xs font-bold text-charcoal/70 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-silver/50 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-charcoal font-medium"
          />
        </div>

        <div className="flex gap-3">
          <div className="bg-white border border-silver/50 rounded-2xl p-1 flex shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-charcoal/40 hover:text-charcoal'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-charcoal/40 hover:text-charcoal'}`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-4 border rounded-2xl hover:border-primary/30 transition-all shadow-sm font-bold text-sm outline-none focus:outline-none cursor-pointer ${
              showFilters 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/10" 
                : "bg-white border border-silver/50 text-charcoal/60 hover:text-primary"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setDeleteConfirmIds(selectedIds)}
              className="flex items-center gap-2 px-5 py-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/10 font-bold text-sm outline-none focus:outline-none cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <div className="bg-primary/5 px-5 py-4 rounded-2xl border border-primary/10 flex items-center gap-3">
            <span className="text-xs font-black text-primary uppercase tracking-widest">
              {mode === "leads" ? "Total Leads" : "Active Subscribers"}
            </span>
            <span className="text-lg font-black text-primary leading-none">
              {mode === "leads"
                ? customers.filter((c) => (c.dashboard?.active_subscriptions || 0) === 0).length
                : customers.filter((c) => (c.dashboard?.active_subscriptions || 0) > 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div className="bg-silver/10 border border-silver/40 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
          {/* Zone Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Zone</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-white border border-silver/50 rounded-xl px-3 py-2 text-xs font-bold text-charcoal focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer shadow-xs"
            >
              <option value="">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          {/* Rider Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Assigned Rider</label>
            <select
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              className="w-full bg-white border border-silver/50 rounded-xl px-3 py-2 text-xs font-bold text-charcoal focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer shadow-xs"
            >
              <option value="">All Riders</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>{r.full_name}</option>
              ))}
            </select>
          </div>

          {/* Bottle Type Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">Bottle Type Balance</label>
            <select
              value={selectedBottleType}
              onChange={(e) => setSelectedBottleType(e.target.value)}
              className="w-full bg-white border border-silver/50 rounded-xl px-3 py-2 text-xs font-bold text-charcoal focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer shadow-xs"
            >
              <option value="">All Balances</option>
              <option value="1L">Has 1L Bottle Balance</option>
              <option value="500ml">Has 500ml Bottle Balance</option>
              <option value="none">No Active Bottle Balance</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div>
              <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block mb-1.5">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white border border-silver/50 rounded-xl px-3 py-2 text-xs font-bold text-charcoal focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer shadow-xs"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            {(selectedZone || selectedRider || selectedBottleType || selectedStatus) && (
              <button
                onClick={() => {
                  setSelectedZone("");
                  setSelectedRider("");
                  setSelectedBottleType("");
                  setSelectedStatus("");
                }}
                className="text-[10px] font-black text-red-500 uppercase tracking-wider text-right hover:underline self-end mt-2 outline-none focus:outline-none cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Alphabetical Quick-Filter Bar */}
      <div className="bg-white border border-silver/50 rounded-2xl p-2.5 px-4 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 pr-2 shrink-0 select-none">
            A–Z:
          </span>
          {ALPHABETS.map((letter) => {
            const count = letterCounts[letter] || 0;
            const isSelected = selectedLetter === letter;
            const hasCustomers = count > 0 || letter === "ALL";

            return (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedLetter(letter)}
                className={`shrink-0 min-w-7 h-7 px-2 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 select-none ${
                  isSelected
                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                    : hasCustomers
                    ? "bg-silver/10 hover:bg-silver/30 text-charcoal/80 hover:text-primary"
                    : "bg-transparent text-charcoal/25 hover:text-charcoal/50"
                }`}
                title={`${letter}: ${count} customers`}
              >
                <span>{letter}</span>
                {letter === "ALL" && (
                  <span className={`text-[9px] font-bold ${isSelected ? "text-white/80" : "text-charcoal/40"}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
          {selectedLetter !== "ALL" && (
            <button
              type="button"
              onClick={() => setSelectedLetter("ALL")}
              className="ml-auto shrink-0 text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-700 underline px-2 cursor-pointer"
            >
              Reset A–Z
            </button>
          )}
        </div>
      </div>

      {/* Page-Level Selection & Top Pagination Toolbar */}
      <div className="bg-white border border-silver/50 rounded-2xl p-3 px-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Left: Select All on current page */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <input
              type="checkbox"
              ref={(el) => {
                if (el) el.indeterminate = isSomeCurrentPageSelected;
              }}
              checked={isAllCurrentPageSelected}
              onChange={handleToggleSelectPage}
              className="w-4 h-4 rounded border-silver/60 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
            />
            <span className="text-xs font-black text-charcoal group-hover:text-primary transition-colors">
              Select All on this Page ({paginatedCustomers.length})
            </span>
          </label>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 pl-4 border-l border-silver/40">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-primary/10 text-primary border border-primary/20">
                {selectedIds.length} Total Selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-charcoal/50 hover:text-charcoal underline cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Right: Customer count & Page Size Selector */}
        <div className="flex items-center gap-4 text-xs font-bold text-charcoal/60">
          <span>
            Showing <strong className="text-charcoal">{totalCustomers > 0 ? startIndex + 1 : 0}–{endIndex}</strong> of <strong className="text-charcoal">{totalCustomers}</strong>
          </span>
          <div className="flex items-center gap-1.5 pl-3 border-l border-silver/40">
            <span className="text-[11px] font-medium text-charcoal/40">Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-silver/10 border border-silver/40 rounded-xl px-2.5 py-1 text-xs font-bold text-charcoal focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              <option value={12}>12 / page</option>
              <option value={24}>24 / page</option>
              <option value={48}>48 / page</option>
              <option value={96}>96 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Pagination Buttons (when multiple pages exist) */}
      {renderPaginationControls()}

      {/* View Content */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className={`bg-white rounded-3xl border border-silver/50 animate-pulse ${viewMode === 'grid' ? 'h-64' : 'h-20'}`}></div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCustomers.map((customer) => {
            const isSelected = selectedIds.includes(customer.id);
            return (
              <div
                key={customer.id}
                className={`bg-white rounded-3xl border shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all group overflow-hidden flex flex-col relative ${
                  isSelected ? 'border-primary bg-primary/[0.02]' : 'border-silver/50'
                }`}
              >
                <div className="p-6 relative">
                  {/* Grid Checkbox overlay */}
                  <div className="absolute top-6 left-6 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedIds(prev =>
                          prev.includes(customer.id)
                            ? prev.filter(id => id !== customer.id)
                            : [...prev, customer.id]
                        );
                      }}
                      className="w-4 h-4 rounded border-silver/60 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between items-start mb-6 pl-8">
                    <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center font-black text-2xl text-primary border border-primary/5 group-hover:scale-105 transition-transform duration-300">
                      {(customer.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col items-end gap-2 relative">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          customer.is_active
                            ? "bg-sage/10 text-primary border border-primary/10"
                            : "bg-red-50 text-red-500 border border-red-100"
                        }`}
                      >
                        {customer.is_active ? "Active" : "Inactive"}
                      </span>
                      <div className="relative inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === customer.id ? null : customer.id);
                          }}
                          className="p-1.5 text-charcoal/20 hover:text-charcoal hover:bg-silver/30 rounded-lg transition-all cursor-pointer"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {activeDropdownId === customer.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white border border-silver/50 rounded-2xl shadow-xl z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 text-left">
                            <button
                              onClick={() => onViewDetails(customer.id)}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-charcoal/70 hover:bg-silver/10 transition-colors"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => setDeleteConfirmIds([customer.id])}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              Delete Customer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-charcoal group-hover:text-primary transition-colors leading-tight mb-1">
                    {customer.name || "Unnamed Customer"}
                  </h3>
                  <p className="text-xs text-charcoal/40 font-bold uppercase tracking-wider mb-6">
                    {customer.company || "Private Customer"}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-charcoal/60 font-medium">
                      <div className="p-1.5 bg-silver/20 rounded-lg group-hover:bg-primary/5 transition-colors">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      {customer.email || "No email"}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-charcoal/60 font-medium">
                      <div className="p-1.5 bg-silver/20 rounded-lg group-hover:bg-primary/5 transition-colors">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      {customer.phone || "No phone"}
                    </div>
                    {customer.username && (
                      <div className="flex items-center gap-3 text-sm text-charcoal/60 font-medium">
                        <div className="p-1.5 bg-silver/20 rounded-lg group-hover:bg-primary/5 transition-colors">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-mono text-xs">@{customer.username}</span>
                      </div>
                    )}
                    {customer.bottle_balances && customer.bottle_balances.total_unreturned > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs mt-1">
                        <Boxes className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-900 text-[11px]">
                          {customer.bottle_balances.unreturned_1L > 0 && `${customer.bottle_balances.unreturned_1L}x 1L `}
                          {customer.bottle_balances.unreturned_500ml > 0 && `${customer.bottle_balances.unreturned_500ml}x 500ml `}
                          Unreturned
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto p-4 bg-silver/5 border-t border-silver/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-charcoal/40 font-bold uppercase">
                    <Calendar className="w-3 h-3" />
                    Joined{" "}
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </div>
                  <button 
                    onClick={() => onViewDetails(customer.id)}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline cursor-pointer"
                  >
                    View Profile &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-silver/10 text-[10px] uppercase tracking-[0.2em] text-charcoal/40 font-black border-b border-silver/30">
                <tr>
                  <th className="px-6 py-5 w-[50px] text-center">
                    <input
                      type="checkbox"
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeCurrentPageSelected;
                      }}
                      checked={isAllCurrentPageSelected}
                      onChange={handleToggleSelectPage}
                      className="w-4 h-4 rounded border-silver/60 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-8 py-5">Customer</th>
                  <th className="px-6 py-5">Contact Details</th>
                  <th className="px-6 py-5">Empty Containers</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Join Date</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/30">
                {paginatedCustomers.map((customer) => {
                  const isSelected = selectedIds.includes(customer.id);
                  return (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-primary/5 transition-colors group ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-6 py-5 text-center w-[50px]">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedIds(prev =>
                              prev.includes(customer.id)
                                ? prev.filter(id => id !== customer.id)
                                : [...prev, customer.id]
                            );
                          }}
                          className="w-4 h-4 rounded border-silver/60 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-8 py-5 cursor-pointer" onClick={() => onViewDetails(customer.id)}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-cream rounded-xl flex items-center justify-center font-black text-sm text-primary border border-primary/5">
                            {(customer.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-charcoal group-hover:text-primary transition-colors">{customer.name || "Unnamed Customer"}</p>
                            <p className="text-[10px] text-charcoal/40 font-bold uppercase">
                              {customer.company || 'Private Customer'}
                              {customer.username && ` • @${customer.username}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-charcoal/70 flex items-center gap-2">
                            <Mail className="w-3 h-3 text-primary/40" /> {customer.email || "No email"}
                          </p>
                          <p className="text-xs font-semibold text-charcoal/70 flex items-center gap-2">
                            <Phone className="w-3 h-3 text-primary/40" /> {customer.phone || "No phone"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {customer.bottle_balances && customer.bottle_balances.total_unreturned > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg text-[11px] font-mono font-black border border-emerald-200 w-fit">
                              <Boxes className="w-3 h-3 text-emerald-700" />
                              {customer.bottle_balances.total_unreturned} empty units
                            </span>
                            <span className="text-[9px] font-bold text-charcoal/40">
                              {customer.bottle_balances.unreturned_1L > 0 && `${customer.bottle_balances.unreturned_1L}x 1L `}
                              {customer.bottle_balances.unreturned_500ml > 0 && `${customer.bottle_balances.unreturned_500ml}x 500ml`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-charcoal/30">0 Held</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          customer.is_active ? 'bg-sage/10 text-primary border-primary/10' : 'bg-red-50 text-red-500 border-red-100'
                        }`}>
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-charcoal/40 uppercase">
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString("en-IN", {
                          day: '2-digit',
                          month: "short",
                          year: "numeric",
                        }) : "N/A"}
                      </td>
                      <td className="px-6 py-5 text-right relative">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === customer.id ? null : customer.id);
                            }}
                            className="p-2 text-charcoal/20 hover:text-primary hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm cursor-pointer"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {activeDropdownId === customer.id && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-silver/50 rounded-2xl shadow-xl z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 text-left">
                              <button
                                onClick={() => onViewDetails(customer.id)}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-charcoal/70 hover:bg-silver/10 transition-colors"
                              >
                                View Profile
                              </button>
                              <button
                                onClick={() => setDeleteConfirmIds([customer.id])}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                Delete Customer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Pagination Controls */}
      {!isLoading && paginatedCustomers.length > 0 && renderPaginationControls()}

      {filteredCustomers.length === 0 && !isLoading && (
        <div className="p-20 text-center bg-white rounded-3xl border border-silver/50 shadow-sm mt-8">
          <div className="w-20 h-20 bg-silver/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-charcoal/20" />
          </div>
          <h3 className="text-xl font-bold text-charcoal">
            No customers found
          </h3>
          <p className="text-charcoal/40">
            Try searching for a different name or phone number.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmIds !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-charcoal/65 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-300 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-charcoal">
                Confirm Permanent Deletion
              </h3>
            </div>
            <p className="text-sm text-charcoal/70 mb-6">
              Are you sure you want to permanently delete{" "}
              <strong>{deleteConfirmIds.length}</strong> selected customer(s)?
              This action <strong>cannot be undone</strong> and will permanently delete all associated data (subscriptions, order history, balances, etc.).
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmIds(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-white border border-silver/50 text-charcoal text-xs font-bold rounded-xl hover:bg-silver/10 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    if (deleteConfirmIds.length === 1) {
                      await customerApi.deleteCustomer(deleteConfirmIds[0]);
                    } else {
                      await customerApi.bulkDeleteCustomers(deleteConfirmIds);
                    }
                    setSelectedIds(prev => prev.filter(id => !deleteConfirmIds.includes(id)));
                    setDeleteConfirmIds(null);
                    onRefresh();
                  } catch (err) {
                    console.error("Failed to delete customers:", err);
                    alert("Failed to delete customer(s). Please try again.");
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboardTab;
