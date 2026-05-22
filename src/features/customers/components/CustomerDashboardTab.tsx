import React, { useState, useEffect, useMemo } from "react";
import { Search, Mail, Phone, MoreVertical, Filter, LayoutGrid, List as ListIcon, Calendar, Users } from "lucide-react";
import type { Customer } from "./types";
import { tenantApi } from "../../tenant/api/tenantApi";
import { driverApi } from "../../drivers/api/driverApi";
import axiosInstance from "../../../api/axiosInstance";

interface CustomerDashboardTabProps {
  customers: Customer[];
  isLoading: boolean;
  onViewDetails: (customerId: string) => void;
}

const CustomerDashboardTab: React.FC<CustomerDashboardTabProps> = ({ customers, isLoading, onViewDetails }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // 1. Search text filter
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery);
      if (!matchesSearch) return false;

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
        const custBalances = bottleBalances.filter((b) => b.customer === customer.id);
        
        if (selectedBottleType === "1L") {
          const has1L = custBalances.some((b) => b.bottle_type_name.toLowerCase().includes("1") && b.balance > 0);
          if (!has1L) return false;
        } else if (selectedBottleType === "500ml") {
          const has500ml = custBalances.some((b) => b.bottle_type_name.toLowerCase().includes("500") && b.balance > 0);
          if (!has500ml) return false;
        } else if (selectedBottleType === "none") {
          const hasAny = custBalances.some((b) => b.balance > 0);
          if (hasAny) return false;
        }
      }

      return true;
    });
  }, [customers, searchQuery, selectedZone, selectedRider, selectedStatus, selectedBottleType, riders, bottleBalances]);

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
          <div className="bg-primary/5 px-5 py-4 rounded-2xl border border-primary/10 flex items-center gap-3">
            <span className="text-xs font-black text-primary uppercase tracking-widest">
              Active Members
            </span>
            <span className="text-lg font-black text-primary leading-none">
              {customers.filter((c) => c.is_active).length}
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

      {/* View Content */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className={`bg-white rounded-3xl border border-silver/50 animate-pulse ${viewMode === 'grid' ? 'h-64' : 'h-20'}`}></div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-3xl border border-silver/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all group overflow-hidden flex flex-col"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center font-black text-2xl text-primary border border-primary/5 group-hover:scale-105 transition-transform duration-300">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        customer.is_active
                          ? "bg-sage/10 text-primary border border-primary/10"
                          : "bg-red-50 text-red-500 border border-red-100"
                      }`}
                    >
                      {customer.is_active ? "Active" : "Inactive"}
                    </span>
                    <button className="p-1.5 text-charcoal/20 hover:text-charcoal hover:bg-silver/30 rounded-lg transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-black text-charcoal group-hover:text-primary transition-colors leading-tight mb-1">
                  {customer.name}
                </h3>
                <p className="text-xs text-charcoal/40 font-bold uppercase tracking-wider mb-6">
                  {customer.company || "Private Customer"}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-charcoal/60 font-medium">
                    <div className="p-1.5 bg-silver/20 rounded-lg group-hover:bg-primary/5 transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    {customer.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-charcoal/60 font-medium">
                    <div className="p-1.5 bg-silver/20 rounded-lg group-hover:bg-primary/5 transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    {customer.phone}
                  </div>
                </div>
              </div>

              <div className="mt-auto p-4 bg-silver/5 border-t border-silver/30 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-charcoal/40 font-bold uppercase">
                  <Calendar className="w-3 h-3" />
                  Joined{" "}
                  {new Date(customer.created_at).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <button 
                  onClick={() => onViewDetails(customer.id)}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline cursor-pointer"
                >
                  View Profile &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-silver/10 text-[10px] uppercase tracking-[0.2em] text-charcoal/40 font-black border-b border-silver/30">
                <tr>
                  <th className="px-8 py-5">Customer</th>
                  <th className="px-6 py-5">Contact Details</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Join Date</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/30">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-8 py-5 cursor-pointer" onClick={() => onViewDetails(customer.id)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-cream rounded-xl flex items-center justify-center font-black text-sm text-primary border border-primary/5">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-charcoal group-hover:text-primary transition-colors">{customer.name}</p>
                          <p className="text-[10px] text-charcoal/40 font-bold uppercase">{customer.company || 'Private'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-charcoal/70 flex items-center gap-2">
                          <Mail className="w-3 h-3 text-primary/40" /> {customer.email}
                        </p>
                        <p className="text-xs font-semibold text-charcoal/70 flex items-center gap-2">
                          <Phone className="w-3 h-3 text-primary/40" /> {customer.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        customer.is_active ? 'bg-sage/10 text-primary border-primary/10' : 'bg-red-50 text-red-500 border-red-100'
                      }`}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-charcoal/40 uppercase">
                      {new Date(customer.created_at).toLocaleDateString("en-IN", {
                        day: '2-digit',
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-charcoal/20 hover:text-primary hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default CustomerDashboardTab;
