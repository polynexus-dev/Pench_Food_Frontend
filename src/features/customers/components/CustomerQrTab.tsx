import React, { useState, useMemo } from "react";
import { Search, Download, QrCode, Loader2, CheckCircle2, User, MapPin } from "lucide-react";
import { customerApi } from "../api/customerApi";
import type { Customer } from "./types";

interface CustomerQrTabProps {
  customers: Customer[];
  isLoading: boolean;
}

const CustomerQrTab: React.FC<CustomerQrTabProps> = ({ customers, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isDownloadingSelected, setIsDownloadingSelected] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
        (customer.phone && customer.phone.includes(searchQuery)) ||
        (customer.qr_code_id && customer.qr_code_id.toLowerCase().includes(searchLower))
      );
    });
  }, [customers, searchQuery]);

  // Handle Master Checkbox Toggle
  const isAllSelected = useMemo(() => {
    if (filteredCustomers.length === 0) return false;
    return filteredCustomers.every((c) => selectedIds.has(c.id));
  }, [filteredCustomers, selectedIds]);

  const handleSelectAllToggle = () => {
    const newSelected = new Set(selectedIds);
    if (isAllSelected) {
      // Uncheck all in current filtered list
      filteredCustomers.forEach((c) => newSelected.delete(c.id));
    } else {
      // Check all in current filtered list
      filteredCustomers.forEach((c) => newSelected.add(c.id));
    }
    setSelectedIds(newSelected);
  };

  // Handle Individual Checkbox Toggle
  const handleSelectToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Trigger Toast Notification on success
  const showSuccessToast = (message: string) => {
    setDownloadSuccess(message);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  // Download all QRs
  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      await customerApi.bulkDownloadQr();
      showSuccessToast("All customer QR codes downloaded successfully.");
    } catch (error) {
      console.error("Failed to download all QRs:", error);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Download selected QRs
  const handleDownloadSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDownloadingSelected(true);
    try {
      await customerApi.bulkDownloadQr(Array.from(selectedIds));
      showSuccessToast(`${selectedIds.size} customer QR codes downloaded successfully.`);
    } catch (error) {
      console.error("Failed to download selected QRs:", error);
    } finally {
      setIsDownloadingSelected(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Header Control Panel */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Search Input */}
        <div className="flex-1 relative group max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by name, phone, email or QR code ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-silver/50 rounded-2xl shadow-xs focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-charcoal text-sm font-medium"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Selected Count Indicator */}
          {selectedIds.size > 0 && (
            <div className="bg-primary/5 border border-primary/10 px-4 py-2.5 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-black text-primary tracking-wide">
                {selectedIds.size} SELECTED
              </span>
            </div>
          )}

          {/* Download Selected Button */}
          <button
            onClick={handleDownloadSelected}
            disabled={selectedIds.size === 0 || isDownloadingSelected}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer select-none disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed ${
              selectedIds.size > 0
                ? "bg-accent text-charcoal hover:bg-accent/95 shadow-md shadow-accent/10"
                : "bg-silver/40 text-charcoal/40 border border-silver/30"
            }`}
          >
            {isDownloadingSelected ? (
              <Loader2 className="w-4 h-4 animate-spin text-charcoal" />
            ) : (
              <Download className="w-4 h-4 text-charcoal" />
            )}
            Download Selected ({selectedIds.size})
          </button>

          {/* Download All Button */}
          <button
            onClick={handleDownloadAll}
            disabled={isDownloadingAll || customers.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/15 hover:bg-primary/95 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer select-none"
          >
            {isDownloadingAll ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <QrCode className="w-4 h-4 text-white" />
            )}
            Download All QR Codes
          </button>
        </div>
      </div>

      {/* Toast Alert for Download Status */}
      {downloadSuccess && (
        <div className="bg-emerald-50 border border-emerald-500/20 text-emerald-800 px-5 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{downloadSuccess}</span>
        </div>
      )}

      {/* 2. Customer Checklist Row List */}
      <div className="bg-white rounded-3xl border border-silver/50 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-silver/10 border-b border-silver/40">
                <th className="py-4 px-6 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAllToggle}
                    className="w-5 h-5 rounded border-silver/60 text-primary accent-primary cursor-pointer transition-all"
                  />
                </th>
                <th className="py-4 px-4 text-xs font-black text-charcoal/40 uppercase tracking-wider">
                  Customer
                </th>
                <th className="py-4 px-4 text-xs font-black text-charcoal/40 uppercase tracking-wider">
                  Contact
                </th>
                <th className="py-4 px-4 text-xs font-black text-charcoal/40 uppercase tracking-wider">
                  QR ID
                </th>
                <th className="py-4 px-4 text-xs font-black text-charcoal/40 uppercase tracking-wider">
                  Zone
                </th>
                <th className="py-4 px-4 text-xs font-black text-charcoal/40 uppercase tracking-wider text-center">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                // Skeletons
                Array(5)
                  .fill(0)
                  .map((_, idx) => (
                    <tr key={idx} className="border-b border-silver/20 animate-pulse">
                      <td className="py-5 px-6 text-center">
                        <div className="w-5 h-5 bg-silver/60 rounded mx-auto"></div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 bg-silver/60 rounded w-40"></div>
                        <div className="h-3 bg-silver/40 rounded w-20 mt-2"></div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 bg-silver/60 rounded w-32"></div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 bg-silver/60 rounded w-28"></div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 bg-silver/60 rounded w-20"></div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-6 bg-silver/60 rounded-full w-16 mx-auto"></div>
                      </td>
                    </tr>
                  ))
              ) : filteredCustomers.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                      <div className="p-4 bg-silver/10 rounded-full text-charcoal/30 mb-4">
                        <QrCode className="w-10 h-10" />
                      </div>
                      <h3 className="text-base font-black text-charcoal">No Customers Found</h3>
                      <p className="text-charcoal/40 font-medium text-xs mt-1">
                        Try refining your search terms or adding new customers.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data List
                filteredCustomers.map((customer) => {
                  const isChecked = selectedIds.has(customer.id);
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => handleSelectToggle(customer.id)}
                      className={`border-b border-silver/30 hover:bg-silver/10 cursor-pointer select-none transition-colors ${
                        isChecked ? "bg-primary/5 hover:bg-primary/10" : ""
                      }`}
                    >
                      <td
                        className="py-4.5 px-6 text-center"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent duplicate toggle since tr has onClick
                          handleSelectToggle(customer.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Controlled by tr onClick
                          className="w-5 h-5 rounded border-silver/60 text-primary accent-primary cursor-pointer transition-all"
                        />
                      </td>

                      <td className="py-4.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            isChecked ? "bg-primary/10 text-primary" : "bg-silver/30 text-charcoal/60"
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-charcoal">
                              {customer.name}
                            </div>
                            <div className="text-xs font-semibold text-charcoal/45 mt-0.5">
                              ID: {customer.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4.5 px-4 font-medium text-xs text-charcoal/70">
                        {customer.phone && <div>{customer.phone}</div>}
                        {customer.email && (
                          <div className="text-[10px] text-charcoal/40 mt-0.5">
                            {customer.email}
                          </div>
                        )}
                      </td>

                      <td className="py-4.5 px-4">
                        <span className="font-mono text-xs font-bold text-charcoal/80 bg-silver/20 px-2.5 py-1 rounded-md border border-silver/30">
                          {customer.qr_code_id || "N/A"}
                        </span>
                      </td>

                      <td className="py-4.5 px-4">
                        {customer.zone_name ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal/75">
                            <MapPin className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                            {customer.zone_name}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-charcoal/30">Unassigned</span>
                        )}
                      </td>

                      <td className="py-4.5 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${
                            customer.is_active
                              ? "bg-emerald-50 border-emerald-500/20 text-emerald-700"
                              : "bg-rose-50 border-rose-500/20 text-rose-750"
                          }`}
                        >
                          {customer.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerQrTab;
