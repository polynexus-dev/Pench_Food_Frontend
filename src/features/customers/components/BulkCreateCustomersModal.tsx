import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Building2,
  Sparkles,
  MapPin,
  Loader2,
  Plus
} from "lucide-react";
import { customerApi } from "../api/customerApi";
import { companyApi, type Company } from "../../../api/companyApi";
import { useAuthStore } from "../../../store/useAuthStore";

interface BulkCreateCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedCustomer {
  id: string; // local client side id for rendering keys
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  latitude: string;
  longitude: string;
  error?: string;
  warning?: string;
}

export const BulkCreateCustomersModal: React.FC<BulkCreateCustomersModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const tenant = useAuthStore((state) => state.tenant);
  
  // State
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
  const [inputText, setInputText] = useState("");
  const [defaultCompany, setDefaultCompany] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load companies
  useEffect(() => {
    if (isOpen) {
      const fetchCompanies = async () => {
        setIsLoadingCompanies(true);
        try {
          const companiesRes = await companyApi.getCompanies();
          const fetchedCompanies = Array.isArray(companiesRes) ? companiesRes : [];
          setCompanies(fetchedCompanies.filter((c) => c.is_active));
        } catch (err) {
          console.error("Failed to fetch companies:", err);
        } finally {
          setIsLoadingCompanies(false);
        }
      };
      fetchCompanies();
      // Reset State
      setInputText("");
      setDefaultCompany("");
      setParsedCustomers([]);
      setSubmitError(null);
      setActiveTab("paste");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Simple CSV/TSV parser
  const parseData = (rawText: string) => {
    if (!rawText.trim()) {
      setParsedCustomers([]);
      return;
    }

    const lines = rawText.split(/\r?\n/);
    const parsedList: ParsedCustomer[] = [];

    // Detect separator (tab vs comma)
    const firstLine = lines[0] || "";
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const sep = tabCount >= commaCount && tabCount > 0 ? "\t" : ",";

    // Detect header row
    let startIndex = 0;
    let colMapping = {
      name: 0,
      email: 1,
      phone: 2,
      company: 3,
      address: 4,
      latitude: 5,
      longitude: 6
    };

    const headerLine = firstLine.toLowerCase();
    if (headerLine.includes("name") || headerLine.includes("email")) {
      startIndex = 1;
      const headers = firstLine.split(sep).map(h => h.trim().toLowerCase());
      
      headers.forEach((h, index) => {
        if (h.includes("name")) colMapping.name = index;
        else if (h.includes("email") || h.includes("mail")) colMapping.email = index;
        else if (h.includes("phone") || h.includes("contact") || h.includes("mobile")) colMapping.phone = index;
        else if (h.includes("company") || h.includes("firm")) colMapping.company = index;
        else if (h.includes("address") || h.includes("location")) colMapping.address = index;
        else if (h.includes("lat")) colMapping.latitude = index;
        else if (h.includes("lng") || h.includes("lon")) colMapping.longitude = index;
      });
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle split considering possible quotes (simple CSV escape)
      let cols: string[] = [];
      if (sep === ",") {
        // Commas with potential quotes
        let currentCell = "";
        let inQuotes = false;
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
          const char = line[charIndex];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            cols.push(currentCell.trim());
            currentCell = "";
          } else {
            currentCell += char;
          }
        }
        cols.push(currentCell.trim());
      } else {
        // Tab separated
        cols = line.split("\t").map(c => c.trim());
      }

      const getColVal = (idx: number) => {
        if (idx < cols.length) {
          // Remove wrapping quotes if any
          let val = cols[idx];
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
          }
          return val.trim();
        }
        return "";
      };

      const name = getColVal(colMapping.name);
      const email = getColVal(colMapping.email);
      const phone = getColVal(colMapping.phone);
      const company = getColVal(colMapping.company);
      const address = getColVal(colMapping.address);
      const latitude = getColVal(colMapping.latitude);
      const longitude = getColVal(colMapping.longitude);

      parsedList.push({
        id: Math.random().toString(36).substring(2, 9),
        name,
        email,
        phone,
        company,
        address,
        latitude,
        longitude
      });
    }

    // Validate parsed results
    validateRows(parsedList);
  };

  // Run validation checks on each customer row
  const validateRows = (list: ParsedCustomer[]) => {
    const validated = list.map(item => {
      const copy = { ...item };
      delete copy.error;
      delete copy.warning;

      if (!copy.name.trim()) {
        copy.error = "Name is required.";
      } else if (!copy.email.trim()) {
        copy.error = "Email is required.";
      } else if (!copy.email.includes("@")) {
        copy.error = "Invalid email format.";
      }

      if (!copy.error) {
        if (copy.latitude || copy.longitude) {
          const latVal = parseFloat(copy.latitude);
          const lngVal = parseFloat(copy.longitude);
          if (isNaN(latVal) || isNaN(lngVal)) {
            copy.error = "GPS coordinates must be valid numbers.";
          }
        } else {
          copy.warning = "No coordinates. Zone assignment will be skipped.";
        }
      }

      return copy;
    });

    setParsedCustomers(validated);
  };

  // Handle cell text changes in preview grid
  const handleCellChange = (id: string, field: keyof ParsedCustomer, val: string) => {
    const updated = parsedCustomers.map(c => {
      if (c.id === id) {
        const item = { ...c, [field]: val };
        return item;
      }
      return c;
    });
    validateRows(updated);
  };

  // Delete row from preview grid
  const handleDeleteRow = (id: string) => {
    const filtered = parsedCustomers.filter(c => c.id !== id);
    validateRows(filtered);
  };

  // Bulk File Selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readAndParseFile(file);
  };

  const readAndParseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
      parseData(text);
    };
    reader.readAsText(file);
  };

  // File Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readAndParseFile(file);
    }
  };

  // Paste Text Trigger
  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    parseData(val);
  };

  // Submit parsed batch customers to backend
  const handleSubmit = async () => {
    if (parsedCustomers.length === 0) {
      setSubmitError("No customer records found to import.");
      return;
    }

    const hasErrors = parsedCustomers.some(c => !!c.error);
    if (hasErrors) {
      setSubmitError("Please fix all validation errors highlighted in red before creating.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = parsedCustomers.map(c => {
        const item: any = {
          name: c.name.trim(),
          email: c.email.trim(),
          phone: c.phone.trim(),
          company: c.company.trim() || defaultCompany,
          address: c.address.trim(),
        };

        if (c.latitude && c.longitude) {
          item.latitude = parseFloat(c.latitude);
          item.longitude = parseFloat(c.longitude);
        }
        return item;
      });

      await customerApi.bulkCreateCustomers(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Bulk creation failed:", err);
      const serverErr = err.response?.data;
      if (serverErr && typeof serverErr === "object") {
        const firstKey = Object.keys(serverErr)[0];
        const errorMsg = Array.isArray(serverErr[firstKey])
          ? serverErr[firstKey][0]
          : typeof serverErr[firstKey] === "string"
          ? serverErr[firstKey]
          : "Invalid field values.";
        setSubmitError(`Row Validation Failed -> ${firstKey.toUpperCase()}: ${errorMsg}`);
      } else {
        setSubmitError(serverErr?.detail || "Bulk import failed. Please check formatting and duplicates.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Statistics
  const errorCount = parsedCustomers.filter(c => !!c.error).length;
  const warningCount = parsedCustomers.filter(c => !!c.warning).length;
  const validCount = parsedCustomers.length - errorCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/65 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-5.5 bg-gradient-to-r from-primary to-sage text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none">Bulk Customer Import</h2>
              <p className="text-[10px] uppercase tracking-wider text-white/80 font-black mt-1">
                Active City Scoping: <span className="underline decoration-white/50">{tenant?.toUpperCase() || "N/A"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar text-left">
          
          {submitError && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-black rounded-2xl flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end shrink-0">
            {/* Default Company selector */}
            <div className="space-y-1">
              <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">
                Fallback/Default Company
              </label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors z-10" />
                <select
                  value={defaultCompany}
                  onChange={(e) => setDefaultCompany(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-semibold text-sm text-charcoal appearance-none cursor-pointer"
                >
                  <option value="">-- Private Partner / Individual --</option>
                  {isLoadingCompanies ? (
                    <option disabled>Loading companies...</option>
                  ) : companies.length === 0 ? (
                    <option disabled>No active companies</option>
                  ) : (
                    companies.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <p className="text-[10px] text-charcoal/40 font-semibold ml-1.5 mt-0.5">
                Applied automatically to imported customers with no specific company name.
              </p>
            </div>

            {/* Input Method Switcher */}
            <div className="flex bg-silver/15 p-1 rounded-2xl border border-silver/30 h-[50px] items-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("paste");
                  setInputText("");
                  setParsedCustomers([]);
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
                  activeTab === "paste"
                    ? "bg-white text-primary shadow-xs"
                    : "text-charcoal/50 hover:text-charcoal"
                }`}
              >
                Copy/Paste Columns
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("upload");
                  setInputText("");
                  setParsedCustomers([]);
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
                  activeTab === "upload"
                    ? "bg-white text-primary shadow-xs"
                    : "text-charcoal/50 hover:text-charcoal"
                }`}
              >
                Upload CSV File
              </button>
            </div>
          </div>

          {/* Paste Section */}
          {activeTab === "paste" && parsedCustomers.length === 0 && (
            <div className="space-y-2 shrink-0">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider">
                  Paste Spreadsheet Columns
                </label>
                <span className="text-[10px] font-black text-charcoal/30 bg-silver/20 px-2 py-0.5 rounded-md">
                  EXPECTS: Name | Email | Phone | Company | Address | Lat | Lng
                </span>
              </div>
              <textarea
                value={inputText}
                onChange={handlePasteChange}
                rows={5}
                placeholder="Rahul Sharma	rahul@example.com	9876543210	Company A	Nagpur West	21.1458	79.0882&#10;Amit Verma	amit@example.com	9890123456			Nagpur East"
                className="w-full p-5 bg-silver/5 border border-silver/50 rounded-3xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-charcoal text-xs font-mono transition-all resize-none placeholder:text-charcoal/20"
              />
            </div>
          )}

          {/* Upload Section */}
          {activeTab === "upload" && parsedCustomers.length === 0 && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer select-none group text-center shrink-0 ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-silver/60 hover:border-primary hover:bg-silver/5"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <div className="p-4 bg-primary/5 group-hover:bg-primary/10 rounded-full text-primary transition-all">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-charcoal">Drag & Drop your CSV File</h4>
                <p className="text-xs text-charcoal/40 mt-1 font-semibold">
                  Or click anywhere to browse local files (under 5MB)
                </p>
              </div>
              <div className="mt-2 text-[10px] text-charcoal/35 font-bold uppercase bg-silver/20 px-3 py-1.5 rounded-xl border border-silver/10 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Columns: Name, Email, Phone, Company, Address, Latitude, Longitude
              </div>
            </div>
          )}

          {/* Preview Section */}
          {parsedCustomers.length > 0 && (
            <div className="space-y-4 flex flex-col flex-1 min-h-[250px]">
              
              {/* Summary Badges */}
              <div className="flex flex-wrap items-center justify-between gap-4 shrink-0 px-1">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-black text-charcoal/40 uppercase tracking-wider">
                    Parsed Registry Preview ({parsedCustomers.length} records)
                  </div>
                  <button
                    onClick={() => {
                      setParsedCustomers([]);
                      setInputText("");
                    }}
                    className="text-[10px] font-black text-primary hover:underline"
                  >
                    Clear All & Restart
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {validCount > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full border border-emerald-500/10">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {validCount} Ready
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-black uppercase rounded-full border border-rose-500/10 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {errorCount} Fix Errors
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-full border border-amber-500/10">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {warningCount} Warnings
                    </span>
                  )}
                </div>
              </div>

              {/* Editable Grid Table */}
              <div className="border border-silver/50 rounded-2xl overflow-hidden shadow-inner bg-silver/5 max-h-[350px] overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-silver/20 border-b border-silver/45 sticky top-0 z-10">
                      <th className="py-3 px-4 font-black text-charcoal/40 uppercase tracking-wider w-[18%]">Name *</th>
                      <th className="py-3 px-4 font-black text-charcoal/40 uppercase tracking-wider w-[20%]">Email *</th>
                      <th className="py-3 px-4 font-black text-charcoal/40 uppercase tracking-wider w-[12%]">Phone</th>
                      <th className="py-3 px-4 font-black text-charcoal/40 uppercase tracking-wider w-[13%]">Company</th>
                      <th className="py-3 px-4 font-black text-charcoal/40 uppercase tracking-wider w-[17%]">Address</th>
                      <th className="py-3 px-3 font-black text-charcoal/40 uppercase tracking-wider w-[8%] text-center">Lat</th>
                      <th className="py-3 px-3 font-black text-charcoal/40 uppercase tracking-wider w-[8%] text-center">Lng</th>
                      <th className="py-3 px-4 w-[4%] text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedCustomers.map((c) => {
                      const hasErr = !!c.error;
                      const hasWarn = !!c.warning;
                      return (
                        <tr
                          key={c.id}
                          className={`border-b border-silver/30 transition-colors ${
                            hasErr
                              ? "bg-rose-50/20 hover:bg-rose-50/40"
                              : hasWarn
                              ? "bg-amber-50/10 hover:bg-amber-50/20"
                              : "hover:bg-silver/10"
                          }`}
                        >
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => handleCellChange(c.id, "name", e.target.value)}
                              className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold ${
                                hasErr && !c.name.trim() ? "border-rose-400 bg-rose-50/50" : ""
                              }`}
                            />
                            {hasErr && !c.name.trim() && (
                              <div className="text-[10px] text-rose-500 font-bold px-2 mt-0.5">{c.error}</div>
                            )}
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="email"
                              value={c.email}
                              onChange={(e) => handleCellChange(c.id, "email", e.target.value)}
                              className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold ${
                                hasErr && (!c.email.trim() || !c.email.includes("@")) ? "border-rose-400 bg-rose-50/50" : ""
                              }`}
                            />
                            {hasErr && (!c.email.trim() || !c.email.includes("@")) && (
                              <div className="text-[10px] text-rose-500 font-bold px-2 mt-0.5">{c.error}</div>
                            )}
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={c.phone}
                              onChange={(e) => handleCellChange(c.id, "phone", e.target.value)}
                              className="w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold"
                            />
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={c.company}
                              placeholder={defaultCompany || "-- private --"}
                              onChange={(e) => handleCellChange(c.id, "company", e.target.value)}
                              className="w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold placeholder:text-charcoal/30"
                            />
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={c.address}
                              onChange={(e) => handleCellChange(c.id, "address", e.target.value)}
                              className="w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold"
                            />
                          </td>
                          <td className="p-1 px-2 text-center">
                            <input
                              type="text"
                              value={c.latitude}
                              onChange={(e) => handleCellChange(c.id, "latitude", e.target.value)}
                              placeholder="lat"
                              className={`w-full p-2 text-center bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-mono font-bold placeholder:text-charcoal/20 ${
                                hasErr && c.latitude && isNaN(parseFloat(c.latitude)) ? "border-rose-400 bg-rose-50/50" : ""
                              }`}
                            />
                          </td>
                          <td className="p-1 px-2 text-center">
                            <input
                              type="text"
                              value={c.longitude}
                              onChange={(e) => handleCellChange(c.id, "longitude", e.target.value)}
                              placeholder="lng"
                              className={`w-full p-2 text-center bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-mono font-bold placeholder:text-charcoal/20 ${
                                hasErr && c.longitude && isNaN(parseFloat(c.longitude)) ? "border-rose-400 bg-rose-50/50" : ""
                              }`}
                            />
                          </td>
                          <td className="p-1 text-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(c.id)}
                              className="p-2.5 text-charcoal/30 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Warnings and Info footnotes */}
              {warningCount > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/50 text-amber-800 text-[10px] font-semibold rounded-xl flex items-center gap-2 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Note: {warningCount} row(s) do not contain coordinates. They will be imported successfully, but you must assign them to delivery zones manually or via auto-assignment later.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5.5 bg-silver/10 border-t border-silver/40 flex items-center justify-between gap-4 shrink-0">
          <div className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">
            * Fields are required to perform creation.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-5 py-2.5 bg-white border border-silver/50 text-charcoal text-xs font-bold rounded-xl hover:bg-silver/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || parsedCustomers.length === 0 || errorCount > 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating Customers ({parsedCustomers.length})...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Import {parsedCustomers.length || ""} Customers
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
