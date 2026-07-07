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
  Plus,
} from "lucide-react";
import { customerApi } from "../api/customerApi";
import { companyApi, type Company } from "../../../api/companyApi";
import { useAuthStore } from "../../../store/useAuthStore";
import type { Product } from "../../inventory/components/types";

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
  subscription?: string;
  quantity?: string;
  productId?: string;
  specialInstructions?: string;
  error?: string;
  warning?: string;
}

export const BulkCreateCustomersModal: React.FC<
  BulkCreateCustomersModalProps
> = ({ isOpen, onClose, onSuccess }) => {
  const tenant = useAuthStore((state) => state.tenant);

  // State
  const [inputText, setInputText] = useState("");
  const [defaultCompany, setDefaultCompany] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterMode, setFilterMode] = useState<"all" | "ready" | "errors" | "warnings">("all");

  // Load companies & products
  useEffect(() => {
    if (isOpen) {
      const fetchCompanies = async () => {
        setIsLoadingCompanies(true);
        try {
          const companiesRes = await companyApi.getCompanies();
          const fetchedCompanies = Array.isArray(companiesRes)
            ? companiesRes
            : [];
          setCompanies(fetchedCompanies.filter((c) => c.is_active));
        } catch (err) {
          console.error("Failed to fetch companies:", err);
        } finally {
          setIsLoadingCompanies(false);
        }
      };

      const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
          const productsRes = await customerApi.getProducts();
          setProducts(productsRes);
        } catch (err) {
          console.error("Failed to fetch products:", err);
        } finally {
          setIsLoadingProducts(false);
        }
      };

      fetchCompanies();
      fetchProducts();

      // Reset State
      setInputText("");
      setDefaultCompany("");
      setParsedCustomers([]);
      setSubmitError(null);
      setFilterMode("all");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizeFrequency = (freq: string): string => {
    const val = freq.trim().toLowerCase();
    if (
      ["daily", "alternate", "weekdays", "weekends", "custom", "none"].includes(val)
    ) {
      return val;
    }
    return "none";
  };

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
      longitude: 6,
      subscription: 7,
      quantity: 8,
      product: 9,
      instructions: 10,
    };

    const headerLine = firstLine.toLowerCase();
    if (
      headerLine.includes("name") ||
      headerLine.includes("email") ||
      headerLine.includes("phone") ||
      headerLine.includes("subscription")
    ) {
      startIndex = 1;
      const headers = firstLine.split(sep).map((h) => h.trim().toLowerCase());

      colMapping = {
        name: -1,
        email: -1,
        phone: -1,
        company: -1,
        address: -1,
        latitude: -1,
        longitude: -1,
        subscription: -1,
        quantity: -1,
        product: -1,
        instructions: -1,
      };

      headers.forEach((h, index) => {
        if (h.includes("name")) colMapping.name = index;
        else if (h.includes("email") || h.includes("mail"))
          colMapping.email = index;
        else if (
          h.includes("phone") ||
          h.includes("contact") ||
          h.includes("mobile")
        )
          colMapping.phone = index;
        else if (h.includes("company") || h.includes("firm"))
          colMapping.company = index;
        else if (h.includes("address") || h.includes("location"))
          colMapping.address = index;
        else if (h.includes("lat")) colMapping.latitude = index;
        else if (
          h.includes("lng") ||
          h.includes("lon") ||
          h.includes("longitude")
        )
          colMapping.longitude = index;
        else if (h.includes("sub")) colMapping.subscription = index;
        else if (h.includes("qty") || h.includes("quantity"))
          colMapping.quantity = index;
        else if (h.includes("prod")) colMapping.product = index;
        else if (
          h.includes("instruction") ||
          h.includes("note") ||
          h.includes("special")
        )
          colMapping.instructions = index;
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
        cols = line.split("\t").map((c) => c.trim());
      }

      const getColVal = (idx: number) => {
        if (idx >= 0 && idx < cols.length) {
          // Remove wrapping quotes if any
          let val = cols[idx];
          if (val && val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
          }
          return val ? val.trim() : "";
        }
        return "";
      };

      const name = getColVal(colMapping.name);
      let email = getColVal(colMapping.email);
      const phone = getColVal(colMapping.phone);
      const company = getColVal(colMapping.company);
      const address = getColVal(colMapping.address);
      const latitude = getColVal(colMapping.latitude);
      const longitude = getColVal(colMapping.longitude);
      const subscription = getColVal(colMapping.subscription);
      const quantity = getColVal(colMapping.quantity);
      const productVal = getColVal(colMapping.product);
      const instructions = getColVal(colMapping.instructions);

      if (!email.trim() && name.trim()) {
        const cleanName = name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, ".");
        email = `${cleanName}@gmail.com`;
      }

      let foundProductId = "";
      const parsedQty = parseFloat(quantity || "1") || 1;

      if (parsedQty === 1) {
        const match = products.find(
          (p) =>
            p.name.toLowerCase().includes("1l") ||
            p.name.toLowerCase().includes("1 l"),
        );
        if (match) foundProductId = match.id;
      } else if (parsedQty === 0.5) {
        const match = products.find(
          (p) =>
            p.name.toLowerCase().includes("500ml") ||
            p.name.toLowerCase().includes("500 ml"),
        );
        if (match) foundProductId = match.id;
      } else if (parsedQty === 1.5 || parsedQty === 2.5) {
        const match = products.find(
          (p) =>
            p.name.toLowerCase().includes("1l") ||
            p.name.toLowerCase().includes("1 l"),
        );
        if (match) foundProductId = match.id;
      }

      if (!foundProductId && productVal) {
        const matched = products.find(
          (p) =>
            p.id.toLowerCase() === productVal.toLowerCase() ||
            p.name.toLowerCase() === productVal.toLowerCase() ||
            p.sku.toLowerCase() === productVal.toLowerCase(),
        );
        if (matched) {
          foundProductId = matched.id;
        }
      }
      if (!foundProductId && products.length > 0) {
        foundProductId = products[0].id;
      }

      parsedList.push({
        id: Math.random().toString(36).substring(2, 9),
        name,
        email,
        phone,
        company,
        address,
        latitude,
        longitude,
        subscription: subscription ? normalizeFrequency(subscription) : "none",
        quantity: quantity || "1",
        productId: foundProductId,
        specialInstructions: instructions,
      });
    }

    // Validate parsed results
    validateRows(parsedList);
  };

  // Run validation checks on each customer row
  const validateRows = (list: ParsedCustomer[]) => {
    const validated = list.map((item) => {
      const copy = { ...item };
      delete copy.error;
      delete copy.warning;

      if (!copy.name.trim()) {
        copy.error = "Name is required.";
      }

      if (!copy.error) {
        if (copy.email.trim() && !copy.email.includes("@")) {
          copy.error = "Invalid email format.";
        }
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

      if (!copy.error) {
        if (copy.subscription !== "none" && !copy.productId) {
          copy.error = "Product selection is required.";
        }
      }

      if (!copy.error) {
        const freq = copy.subscription?.trim().toLowerCase() || "";
        if (
          !["daily", "alternate", "weekdays", "weekends", "custom", "none"].includes(
            freq,
          )
        ) {
          copy.error =
            "Subscription frequency must be 'daily', 'alternate', 'weekdays', 'weekends', 'custom', or 'none'.";
        }
      }

      if (!copy.error) {
        if (copy.subscription !== "none") {
          const qtyVal = parseFloat(copy.quantity || "");
          if (isNaN(qtyVal) || qtyVal <= 0) {
            copy.error = "Quantity must be a positive number.";
          }
        }
      }

      return copy;
    });

    setParsedCustomers(validated);
  };

  // Handle cell text changes in preview grid
  const handleCellChange = (
    id: string,
    field: keyof ParsedCustomer,
    val: string,
  ) => {
    const updated = parsedCustomers.map((c) => {
      if (c.id === id) {
        let item = { ...c, [field]: val };

        if (field === "quantity") {
          let parsedQty = parseFloat(val);
          if (parsedQty === 1) {
            const match = products.find(
              (p) =>
                p.name.toLowerCase().includes("1l") ||
                p.name.toLowerCase().includes("1 l"),
            );
            if (match) item.productId = match.id;
          } else if (parsedQty === 0.5) {
            const match = products.find(
              (p) =>
                p.name.toLowerCase().includes("500ml") ||
                p.name.toLowerCase().includes("500 ml"),
            );
            if (match) item.productId = match.id;
          } else if (parsedQty === 1.5 || parsedQty === 2.5) {
            const match = products.find(
              (p) =>
                p.name.toLowerCase().includes("1l") ||
                p.name.toLowerCase().includes("1 l"),
            );
            if (match) item.productId = match.id;
          }
        }

        return item;
      }
      return c;
    });
    validateRows(updated);
  };

  // Delete row from preview grid
  const handleDeleteRow = (id: string) => {
    const filtered = parsedCustomers.filter((c) => c.id !== id);
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

    const hasErrors = parsedCustomers.some((c) => !!c.error);
    if (hasErrors) {
      setSubmitError(
        "Please fix all validation errors highlighted in red before creating.",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = parsedCustomers.map((c) => {
        const item: any = {
          name: c.name.trim(),
        };

        let emailVal = c.email ? c.email.trim() : "";
        if (!emailVal && c.name.trim()) {
          const cleanName = c.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, ".");
          emailVal = `${cleanName}@gmail.com`;
        }

        if (emailVal) item.email = emailVal;
        if (c.phone && c.phone.trim()) {
          item.phone = c.phone.trim();
        } else {
          const randomStr = Math.random().toString(36).substring(2, 7);
          const timestamp = Math.floor(Date.now() / 1000) % 100000;
          item.phone = `N/A-${randomStr}-${timestamp}`;
        }
        item.company = c.company.trim() || defaultCompany || "";
        if (c.address && c.address.trim()) item.address = c.address.trim();

        if (c.latitude && c.latitude.trim()) {
          const latVal = parseFloat(c.latitude);
          if (!isNaN(latVal)) item.latitude = latVal;
        }
        if (c.longitude && c.longitude.trim()) {
          const lngVal = parseFloat(c.longitude);
          if (!isNaN(lngVal)) item.longitude = lngVal;
        }
        return item;
      });

      const resData = await customerApi.bulkCreateCustomers(payload);

      let createdCustomers: any[] = [];
      let skippedRecords: any[] = [];

      if (Array.isArray(resData)) {
        createdCustomers = resData;
      } else if (resData && typeof resData === "object") {
        createdCustomers = resData.imported || [];
        skippedRecords = resData.skipped || [];
      }

      // Construct and send the subscription payloads in array
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const subscriptionPayload = parsedCustomers.flatMap((c, index) => {
        if (!c.subscription || c.subscription === "none") {
          return [];
        }

        const createdCustomer = createdCustomers.find(
          (cust) =>
            (c.email && cust.email === c.email.trim()) ||
            (c.phone && cust.phone === c.phone.trim()) ||
            cust.name === c.name.trim()
        );
        const customerId = createdCustomer?.id || "";
        const qty = parseFloat(c.quantity || "1") || 1;

        const baseSub = {
          customer: customerId,
          frequency: c.subscription || "daily",
          custom_days: [],
          start_date: tomorrowStr,
          end_date: null,
          delivery_address: c.address.trim() || "",
          special_instructions: c.specialInstructions?.trim() || "",
        };

        const a2CowMilk1L = products.find(
          (p) =>
            p.name.toLowerCase().includes("1l") ||
            p.name.toLowerCase().includes("1 l"),
        );
        const a2CowMilk500ml = products.find(
          (p) =>
            p.name.toLowerCase().includes("500ml") ||
            p.name.toLowerCase().includes("500 ml"),
        );

        const prod1Id = a2CowMilk1L?.id || c.productId || "";
        const prod2Id = a2CowMilk500ml?.id || c.productId || "";

        const subs: any[] = [];
        const wholeLiters = Math.floor(qty);

        // 1. Create 1 subscription of the 1L product with quantity = wholeLiters
        if (wholeLiters > 0) {
          subs.push({
            ...baseSub,
            items: [
              {
                product: prod1Id,
                quantity: wholeLiters,
              },
            ],
          });
        }

        // 2. If there is a remainder (like 0.5 L), create 1 subscription of 500ml product with quantity = 1
        const remainder = qty - wholeLiters;
        if (remainder > 0) {
          subs.push({
            ...baseSub,
            items: [
              {
                product: prod2Id,
                quantity: 1,
              },
            ],
          });
        }

        return subs;
      });

      if (subscriptionPayload.length > 0) {
        await customerApi.createSubscription(subscriptionPayload);
      }

      if (skippedRecords.length > 0) {
        const skippedSummary = skippedRecords
          .map((r) => `Row ${r.row} (${r.name || "N/A"}): ${r.reason}`)
          .join("\n");
        alert(
          `Import Summary:\n- Successfully imported: ${createdCustomers.length}\n- Skipped/Duplicates: ${skippedRecords.length}\n\nSkipped Rows Details:\n${skippedSummary}`
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Bulk creation failed:", err);
      const serverErr = err.response?.data;
      if (Array.isArray(serverErr)) {
        let errorFound = false;
        const updated = parsedCustomers.map((c, index) => {
          const rowError = serverErr[index];
          if (rowError && typeof rowError === "object" && Object.keys(rowError).length > 0) {
            const firstFieldName = Object.keys(rowError)[0];
            const firstFieldErrors = rowError[firstFieldName];
            const msg = Array.isArray(firstFieldErrors) ? firstFieldErrors[0] : String(firstFieldErrors);
            errorFound = true;
            return {
              ...c,
              error: `${firstFieldName.toUpperCase()}: ${msg}`,
            };
          }
          return c;
        });
        if (errorFound) {
          setParsedCustomers(updated);
          setSubmitError("Some customer records failed backend validation. Errors have been highlighted below.");
          setFilterMode("errors");
          return;
        }
      }

      if (serverErr && typeof serverErr === "object") {
        const firstKey = Object.keys(serverErr)[0];
        const errorMsg = Array.isArray(serverErr[firstKey])
          ? serverErr[firstKey][0]
          : typeof serverErr[firstKey] === "string"
            ? serverErr[firstKey]
            : "Invalid field values.";
        setSubmitError(
          `Row Validation Failed -> ${firstKey.toUpperCase()}: ${errorMsg}`,
        );
      } else {
        setSubmitError(
          serverErr?.detail ||
            "Bulk import failed. Please check formatting and duplicates.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Statistics
  const errorCount = parsedCustomers.filter((c) => !!c.error).length;
  const warningCount = parsedCustomers.filter((c) => !!c.warning).length;
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
              <h2 className="text-xl font-bold leading-none">
                Bulk Customer Import
              </h2>
              <p className="text-[10px] uppercase tracking-wider text-white/80 font-black mt-1">
                Active City Scoping:{" "}
                <span className="underline decoration-white/50">
                  {tenant?.toUpperCase() || "N/A"}
                </span>
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

          {/* Controls / Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-silver/30 shrink-0">
            {/* Default Company selector */}
            <div className="space-y-1 max-w-md w-full">
              <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">
                Fallback/Default Company
              </label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors z-10" />
                <select
                  value={defaultCompany}
                  onChange={(e) => setDefaultCompany(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-semibold text-sm text-charcoal appearance-none cursor-pointer"
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
                Applied automatically to imported customers with no specific
                company name.
              </p>
            </div>

            {/* Quick Upload action on the right */}
            <div className="flex flex-col items-start md:items-end justify-center">
              <span className="text-xs font-black text-charcoal/40 uppercase tracking-wider mb-1 mr-1">
                Select CSV File
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-silver/60 rounded-2xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs cursor-pointer animate-in fade-in"
              >
                <Upload className="w-4 h-4 text-primary" />
                {parsedCustomers.length > 0
                  ? "Change CSV File"
                  : "Choose CSV File"}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
            </div>
          </div>

          {/* Upload Section */}
          {parsedCustomers.length === 0 && (
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
              <div className="p-4 bg-primary/5 group-hover:bg-primary/10 rounded-full text-primary transition-all">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-charcoal">
                  Drag & Drop your CSV File
                </h4>
                <p className="text-xs text-charcoal/40 mt-1 font-semibold">
                  Or click anywhere to browse local files (under 5MB)
                </p>
              </div>
              <div className="mt-2 text-[10px] text-charcoal/35 font-bold uppercase bg-silver/20 px-3 py-1.5 rounded-xl border border-silver/10 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Columns: Name, Phone, Latitude, Longitude, Subscription,
                Quantity (Optional: Email, Company, Address)
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
                      setFilterMode("all");
                    }}
                    className="text-[10px] font-black text-primary hover:underline"
                  >
                    Clear All & Restart
                  </button>
                  {filterMode !== "all" && (
                    <span className="text-[10px] font-bold text-charcoal/30 select-none">|</span>
                  )}
                  {filterMode !== "all" && (
                    <button
                      onClick={() => setFilterMode("all")}
                      className="text-[10px] font-black text-primary hover:underline"
                    >
                      Show All Records
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {validCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode(filterMode === "ready" ? "all" : "ready")}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase rounded-full border transition-all cursor-pointer select-none ${
                        filterMode === "ready"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-emerald-50 text-emerald-700 border-emerald-500/10 hover:bg-emerald-100/70"
                      }`}
                      title="Filter by Ready rows"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {validCount} Ready
                    </button>
                  )}
                  {errorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode(filterMode === "errors" ? "all" : "errors")}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase rounded-full border transition-all cursor-pointer select-none ${
                        filterMode === "errors"
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                          : "bg-rose-50 text-rose-700 border-rose-500/10 hover:bg-rose-100/70 animate-pulse"
                      }`}
                      title="Filter by Error rows"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {errorCount} Fix Errors
                    </button>
                  )}
                  {warningCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode(filterMode === "warnings" ? "all" : "warnings")}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase rounded-full border transition-all cursor-pointer select-none ${
                        filterMode === "warnings"
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-amber-50 text-amber-700 border-amber-500/10 hover:bg-amber-100/70"
                      }`}
                      title="Filter by Warning rows"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {warningCount} Warnings
                    </button>
                  )}
                </div>
              </div>

              {/* Editable Grid Table */}
              <div className="border border-silver/50 rounded-2xl shadow-inner bg-silver/5 max-h-[350px] overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full min-w-[1290px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5F7F8] border-b border-silver/45 sticky top-0 z-10 animate-fade-in">
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[160px] bg-[#F5F7F8]">
                        Name *
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[130px] bg-[#F5F7F8]">
                        Phone
                      </th>
                      <th className="py-3.5 px-3 font-black text-charcoal/50 text-[10px] uppercase tracking-wider text-center min-w-[100px] bg-[#F5F7F8]">
                        Lat
                      </th>
                      <th className="py-3.5 px-3 font-black text-charcoal/50 text-[10px] uppercase tracking-wider text-center min-w-[100px] bg-[#F5F7F8]">
                        Lng
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider text-center min-w-[160px] bg-[#F5F7F8]">
                        Product *
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider text-center min-w-[140px] bg-[#F5F7F8]">
                        Subscription *
                      </th>
                      <th className="py-3.5 px-3 font-black text-charcoal/50 text-[10px] uppercase tracking-wider text-center min-w-[80px] bg-[#F5F7F8]">
                        Qty *
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[180px] bg-[#F5F7F8]">
                        Email
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[150px] bg-[#F5F7F8]">
                        Company
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[200px] bg-[#F5F7F8]">
                        Address
                      </th>
                      <th className="py-3.5 px-4 w-[50px] text-center bg-[#F5F7F8]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedCustomers
                      .filter((c) => {
                        if (filterMode === "errors") return !!c.error;
                        if (filterMode === "warnings") return !!c.warning;
                        if (filterMode === "ready") return !c.error;
                        return true;
                      })
                      .map((c) => {
                      const hasErr = !!c.error;
                      const hasWarn = !!c.warning;
                      const qtyVal = parseFloat(c.quantity || "1");
                      const hasMultipleSubs =
                        c.subscription !== "none" && Math.floor(qtyVal) > 0 && qtyVal % 1 > 0;

                      return (
                        <React.Fragment key={c.id}>
                          <tr
                            className={`border-b border-silver/30 transition-colors hover:bg-silver/5 ${
                              hasErr
                                ? "bg-rose-50/20 hover:bg-rose-50/30"
                                : hasWarn
                                  ? "bg-amber-50/10 hover:bg-amber-50/20"
                                  : ""
                            }`}
                          >
                            <td className="p-1 px-3">
                              <input
                                type="text"
                                value={c.name}
                                onChange={(e) =>
                                  handleCellChange(c.id, "name", e.target.value)
                                }
                                className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold ${
                                  hasErr && !c.name.trim()
                                    ? "border-rose-400 bg-rose-50/50"
                                    : ""
                                }`}
                              />
                              {hasErr && !c.name.trim() && (
                                <div className="text-[10px] text-rose-500 font-bold px-2 mt-0.5">
                                  {c.error}
                                </div>
                              )}
                            </td>
                            <td className="p-1 px-3">
                              <input
                                type="text"
                                value={c.phone}
                                onChange={(e) =>
                                  handleCellChange(
                                    c.id,
                                    "phone",
                                    e.target.value,
                                  )
                                }
                                className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold ${
                                  hasErr && c.error?.toLowerCase().includes("phone")
                                    ? "border-rose-400 bg-rose-50/50"
                                    : ""
                                }`}
                              />
                              {hasErr && c.error?.toLowerCase().includes("phone") && (
                                <div className="text-[10px] text-rose-500 font-bold px-2 mt-0.5">
                                  {c.error}
                                </div>
                              )}
                            </td>
                            <td className="p-1 px-2 text-center">
                              <input
                                type="text"
                                value={c.latitude}
                                onChange={(e) =>
                                  handleCellChange(
                                    c.id,
                                    "latitude",
                                    e.target.value,
                                  )
                                }
                                placeholder="lat"
                                className={`w-full p-2 text-center bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-mono font-bold placeholder:text-charcoal/20 ${
                                  hasErr &&
                                  c.latitude &&
                                  isNaN(parseFloat(c.latitude))
                                    ? "border-rose-400 bg-rose-50/50"
                                    : ""
                                }`}
                              />
                            </td>
                            <td className="p-1 px-2 text-center">
                              <input
                                type="text"
                                value={c.longitude}
                                onChange={(e) =>
                                  handleCellChange(
                                    c.id,
                                    "longitude",
                                    e.target.value,
                                  )
                                }
                                placeholder="lng"
                                className={`w-full p-2 text-center bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-mono font-bold placeholder:text-charcoal/20 ${
                                  hasErr &&
                                  c.longitude &&
                                  isNaN(parseFloat(c.longitude))
                                    ? "border-rose-400 bg-rose-50/50"
                                    : ""
                                }`}
                              />
                            </td>
                            <td className="p-1 px-3 text-center">
                              <select
                                value={c.productId || ""}
                                onChange={(e) =>
                                  handleCellChange(
                                    c.id,
                                    "productId",
                                    e.target.value,
                                  )
                                }
                                className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold ${
                                  c.subscription !== "none" && hasErr && !c.productId
                                    ? "border-rose-400 bg-rose-50/50"
                                    : ""
                                }`}
                              >
                                <option value="" disabled>
                                  Select Product
                                </option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                              {c.subscription !== "none" && hasErr && !c.productId && (
                                <div className="text-[10px] text-rose-500 font-bold px-2 mt-0.5">
                                  Product is required
                                </div>
                              )}
                            </td>
                            <td className="p-1 px-3 text-center">
                              <select
                                value={c.subscription || "none"}
                                onChange={(e) =>
                                  handleCellChange(
                                    c.id,
                                    "subscription",
                                    e.target.value,
                                  )
                                }
                                className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold text-center ${
                                  hasErr &&
                                  (!c.subscription ||
                                    ![
                                      "daily",
                                      "alternate",
                                      "weekdays",
                                      "weekends",
                                      "custom",
                                      "none",
                                    ].includes(c.subscription))
                                    ? "border-rose-400 bg-rose-50/50"
                                    : ""
                                }`}
                              >
                                <option value="none">No Subscription</option>
                                <option value="daily">Daily</option>
                                <option value="alternate">Alternate</option>
                                <option value="weekdays">Weekdays</option>
                                <option value="weekends">Weekends</option>
                                <option value="custom">Custom</option>
                              </select>
                            </td>
                            <td className="p-1 px-2 text-center">
                              <input
                                type="number"
                                min="1"
                                step="any"
                                value={c.quantity || ""}
                                placeholder="qty"
                                onChange={(e) =>
                                  handleCellChange(
                                    c.id,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                className={`w-full p-2 text-center bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-bold placeholder:text-charcoal/20 ${
                                  c.subscription !== "none" &&
                                  hasErr &&
                                  (!c.quantity ||
                                    parseFloat(c.quantity) <= 0 ||
                                    isNaN(parseFloat(c.quantity)))
                                    ? "border-rose-400 bg-rose-50/50"
                                    : ""
                                }`}
                              />
                              {c.subscription !== "none" &&
                                hasErr &&
                                (!c.quantity ||
                                  parseFloat(c.quantity) <= 0 ||
                                  isNaN(parseFloat(c.quantity))) && (
                                  <div className="text-[10px] text-rose-500 font-bold px-2 mt-0.5">
                                    Invalid qty
                                  </div>
                                )}
                            </td>
                            <td className="p-1 px-3">
                              <input
                                type="email"
                                value={c.email}
                                onChange={(e) =>
                                  handleCellChange(
                                    c.id,
                                    "email",
                                    e.target.value,
                                  )
                                }
                                className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold ${
                                  hasErr &&
                                  ((c.email.trim() && !c.email.includes("@")) ||
                                    c.error?.toLowerCase().includes("email"))
                                    ? "border-rose-400 bg-rose-50/50"
                                    : ""
                                }`}
                              />
                              {hasErr &&
                                ((c.email.trim() && !c.email.includes("@")) ||
                                  c.error?.toLowerCase().includes("email")) && (
                                  <div className="text-[10px] text-rose-500 font-bold px-2 mt-0.5">
                                    {c.error}
                                  </div>
                                )}
                            </td>
                            <td className="p-1 px-3">
                              <input
                                type="text"
                                value={c.company}
                                placeholder={defaultCompany || "-- private --"}
                                onChange={(e) =>
                                  handleCellChange(
                                    c.id,
                                    "company",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold placeholder:text-charcoal/30"
                              />
                            </td>
                            <td className="p-1 px-3">
                              <input
                                type="text"
                                value={c.address}
                                onChange={(e) =>
                                  handleCellChange(
                                    c.id,
                                    "address",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold"
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
                          {hasMultipleSubs && (
                            <tr className="bg-[#FAFBFB]">
                              <td
                                colSpan={11}
                                className="px-5 py-2.5 border-b border-silver/30"
                              >
                                <details className="group">
                                  <summary className="font-bold text-[10px] text-charcoal/50 hover:text-primary uppercase tracking-wider cursor-pointer list-none flex items-center gap-1.5 select-none outline-none">
                                    <span className="transition-transform group-open:rotate-90 text-[8px] text-charcoal/40">
                                      ▶
                                    </span>
                                    View split subscriptions details (
                                    {c.quantity} L)
                                  </summary>
                                  <div className="mt-2.5 pl-4 space-y-1.5 text-xs text-charcoal/85 animate-in fade-in duration-200">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                                      <span>
                                        Subscription 1: <strong>{Math.floor(qtyVal)}x</strong> A2 Cow Milk (1L)
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-sage shrink-0"></div>
                                      <span>
                                        Subscription 2: <strong>1x</strong> A2 Cow Milk (500ml)
                                      </span>
                                    </div>
                                  </div>
                                </details>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
                    Note: {warningCount} row(s) do not contain coordinates. They
                    will be imported successfully, but you must assign them to
                    delivery zones manually or via auto-assignment later.
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
              disabled={
                isSubmitting || parsedCustomers.length === 0 || errorCount > 0
              }
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
