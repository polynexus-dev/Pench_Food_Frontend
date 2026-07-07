import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  MapPin,
  Sparkles,
  Loader2,
  Plus,
} from "lucide-react";
import { driverApi } from "../api/driverApi";
import { inventoryApi } from "../../inventory/api/inventoryApi";
import { useAuthStore } from "../../../store/useAuthStore";
import type { Zone } from "./types";
import type { Warehouse } from "../../inventory/components/types";

interface BulkCreateDriversModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedDriver {
  id: string; // local client side id for rendering keys
  username: string;
  phone: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  vehicle_plate: string;
  vehicle_type: string;
  max_capacity_kg: string;
  zone: string; // raw name typed/uploaded, resolved to UUID on submit
  warehouse: string; // raw name typed/uploaded, resolved to UUID on submit
  error?: string;
  warning?: string;
}

export const BulkCreateDriversModal: React.FC<BulkCreateDriversModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const tenant = useAuthStore((state) => state.tenant);

  const [zones, setZones] = useState<Zone[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [parsedDrivers, setParsedDrivers] = useState<ParsedDriver[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load zones & warehouses for name -> UUID resolution
  useEffect(() => {
    if (isOpen) {
      const fetchZones = async () => {
        try {
          const data = await driverApi.getZones();
          setZones(data);
        } catch (err) {
          console.error("Failed to fetch zones:", err);
        }
      };

      const fetchWarehouses = async () => {
        try {
          const data = await inventoryApi.getWarehouses();
          setWarehouses(data);
        } catch (err) {
          console.error("Failed to fetch warehouses:", err);
        }
      };

      fetchZones();
      fetchWarehouses();

      // Reset state
      setParsedDrivers([]);
      setSubmitError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const findZoneId = (name: string): string => {
    if (!name.trim()) return "";
    const match = zones.find(
      (z) => z.name.toLowerCase() === name.trim().toLowerCase(),
    );
    return match?.id || "";
  };

  const findWarehouseId = (name: string): string => {
    if (!name.trim()) return "";
    const match = warehouses.find(
      (w) => w.name.toLowerCase() === name.trim().toLowerCase(),
    );
    return match ? String(match.id) : "";
  };

  // Simple CSV/TSV parser
  const parseData = (rawText: string) => {
    if (!rawText.trim()) {
      setParsedDrivers([]);
      return;
    }

    const lines = rawText.split(/\r?\n/);
    const parsedList: ParsedDriver[] = [];

    // Detect separator (tab vs comma)
    const firstLine = lines[0] || "";
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const sep = tabCount >= commaCount && tabCount > 0 ? "\t" : ",";

    // Detect header row
    let startIndex = 0;
    let colMapping = {
      username: 0,
      phone: 1,
      email: 2,
      password: 3,
      first_name: 4,
      last_name: 5,
      vehicle_plate: 6,
      vehicle_type: 7,
      max_capacity_kg: 8,
      zone: 9,
      warehouse: 10,
    };

    const headerLine = firstLine.toLowerCase();
    if (
      headerLine.includes("username") ||
      headerLine.includes("email") ||
      headerLine.includes("password") ||
      headerLine.includes("vehicle")
    ) {
      startIndex = 1;
      const headers = firstLine.split(sep).map((h) => h.trim().toLowerCase());

      colMapping = {
        username: -1,
        phone: -1,
        email: -1,
        password: -1,
        first_name: -1,
        last_name: -1,
        vehicle_plate: -1,
        vehicle_type: -1,
        max_capacity_kg: -1,
        zone: -1,
        warehouse: -1,
      };

      headers.forEach((h, index) => {
        if (h.includes("user")) colMapping.username = index;
        else if (h.includes("phone") || h.includes("mobile") || h.includes("contact"))
          colMapping.phone = index;
        else if (h.includes("email") || h.includes("mail")) colMapping.email = index;
        else if (h.includes("pass")) colMapping.password = index;
        else if (h.includes("first")) colMapping.first_name = index;
        else if (h.includes("last")) colMapping.last_name = index;
        else if (h.includes("plate") || h.includes("reg")) colMapping.vehicle_plate = index;
        else if (h.includes("vehicle") && h.includes("type")) colMapping.vehicle_type = index;
        else if (h.includes("type") && colMapping.vehicle_type === -1)
          colMapping.vehicle_type = index;
        else if (h.includes("capacity") || h.includes("kg")) colMapping.max_capacity_kg = index;
        else if (h.includes("zone")) colMapping.zone = index;
        else if (h.includes("warehouse") || h.includes("hub")) colMapping.warehouse = index;
      });
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle split considering possible quotes (simple CSV escape)
      let cols: string[] = [];
      if (sep === ",") {
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
        cols = line.split("\t").map((c) => c.trim());
      }

      const getColVal = (idx: number) => {
        if (idx >= 0 && idx < cols.length) {
          let val = cols[idx];
          if (val && val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
          }
          return val ? val.trim() : "";
        }
        return "";
      };

      parsedList.push({
        id: Math.random().toString(36).substring(2, 9),
        username: getColVal(colMapping.username),
        phone: getColVal(colMapping.phone),
        email: getColVal(colMapping.email),
        password: getColVal(colMapping.password),
        first_name: getColVal(colMapping.first_name),
        last_name: getColVal(colMapping.last_name),
        vehicle_plate: getColVal(colMapping.vehicle_plate),
        vehicle_type: getColVal(colMapping.vehicle_type),
        max_capacity_kg: getColVal(colMapping.max_capacity_kg),
        zone: getColVal(colMapping.zone),
        warehouse: getColVal(colMapping.warehouse),
      });
    }

    validateRows(parsedList);
  };

  // Run validation checks on each rider row
  const validateRows = (list: ParsedDriver[]) => {
    const validated = list.map((item) => {
      const copy = { ...item };
      delete copy.error;
      delete copy.warning;

      if (!copy.username.trim()) {
        copy.error = "Username is required.";
      }

      if (!copy.error && !copy.email.trim()) {
        copy.error = "Email is required.";
      }

      if (!copy.error && copy.email.trim() && !copy.email.includes("@")) {
        copy.error = "Invalid email format.";
      }

      if (!copy.error && !copy.password.trim()) {
        copy.error = "Password is required.";
      }

      if (
        !copy.error &&
        copy.password.trim() &&
        copy.password.trim().length < 8
      ) {
        copy.error = "Password must be at least 8 characters.";
      }

      // Phone is intentionally optional - riders log in with username/password
      // and can add their number later via profile update.

      if (!copy.error) {
        if (copy.zone.trim() && !findZoneId(copy.zone)) {
          copy.warning = `Zone "${copy.zone}" not found. It will be left unassigned.`;
        } else if (copy.warehouse.trim() && !findWarehouseId(copy.warehouse)) {
          copy.warning = `Warehouse "${copy.warehouse}" not found. It will be left unassigned.`;
        }
      }

      return copy;
    });

    setParsedDrivers(validated);
  };

  // Handle cell text changes in preview grid
  const handleCellChange = (
    id: string,
    field: keyof ParsedDriver,
    val: string,
  ) => {
    const updated = parsedDrivers.map((d) =>
      d.id === id ? { ...d, [field]: val } : d,
    );
    validateRows(updated);
  };

  // Delete row from preview grid
  const handleDeleteRow = (id: string) => {
    const filtered = parsedDrivers.filter((d) => d.id !== id);
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

  // Submit parsed batch riders to backend
  const handleSubmit = async () => {
    if (parsedDrivers.length === 0) {
      setSubmitError("No rider records found to import.");
      return;
    }

    const hasErrors = parsedDrivers.some((d) => !!d.error);
    if (hasErrors) {
      setSubmitError(
        "Please fix all validation errors highlighted in red before creating.",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = parsedDrivers.map((d) => {
        const item: any = {
          username: d.username.trim(),
          email: d.email.trim(),
          password: d.password.trim(),
          role: "Drivers",
          tenant_schema: tenant || "",
        };

        if (d.phone && d.phone.trim()) item.phone = d.phone.trim();
        if (d.first_name && d.first_name.trim()) item.first_name = d.first_name.trim();
        if (d.last_name && d.last_name.trim()) item.last_name = d.last_name.trim();
        if (d.vehicle_plate && d.vehicle_plate.trim())
          item.vehicle_plate = d.vehicle_plate.trim();
        if (d.vehicle_type && d.vehicle_type.trim())
          item.vehicle_type = d.vehicle_type.trim();

        const capacity = parseFloat(d.max_capacity_kg || "");
        if (!isNaN(capacity)) item.max_capacity_kg = capacity;

        const zoneId = findZoneId(d.zone);
        if (zoneId) item.zone = zoneId;

        const warehouseId = findWarehouseId(d.warehouse);
        if (warehouseId) item.warehouse = warehouseId;

        return item;
      });

      await driverApi.bulkRegisterDrivers(payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Bulk rider creation failed:", err);
      const serverErr = err.response?.data;
      if (Array.isArray(serverErr)) {
        const firstErrorEntry = serverErr.find(
          (e: any) => e && typeof e === "object" && Object.keys(e).length > 0,
        );
        if (firstErrorEntry) {
          const firstKey = Object.keys(firstErrorEntry)[0];
          const errorMsg = Array.isArray(firstErrorEntry[firstKey])
            ? firstErrorEntry[firstKey][0]
            : firstErrorEntry[firstKey];
          setSubmitError(`Row Validation Failed -> ${firstKey.toUpperCase()}: ${errorMsg}`);
        } else {
          setSubmitError("Bulk import failed. Please check formatting and duplicates.");
        }
      } else if (serverErr && typeof serverErr === "object") {
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
  const errorCount = parsedDrivers.filter((d) => !!d.error).length;
  const warningCount = parsedDrivers.filter((d) => !!d.warning).length;
  const validCount = parsedDrivers.length - errorCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/65 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-5.5 bg-gradient-to-r from-primary to-sage text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none">Bulk Rider Import</h2>
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
          <div className="flex items-center justify-end gap-6 pb-4 border-b border-silver/30 shrink-0">
            <div className="flex flex-col items-end justify-center">
              <span className="text-xs font-black text-charcoal/40 uppercase tracking-wider mb-1 mr-1">
                Select CSV File
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-silver/60 rounded-2xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs cursor-pointer animate-in fade-in"
              >
                <Upload className="w-4 h-4 text-primary" />
                {parsedDrivers.length > 0 ? "Change CSV File" : "Choose CSV File"}
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
          {parsedDrivers.length === 0 && (
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
                Columns: Username, Email, Password (Optional: Phone, First
                Name, Last Name, Vehicle Plate, Vehicle Type, Max Capacity,
                Zone, Warehouse)
              </div>
            </div>
          )}

          {/* Preview Section */}
          {parsedDrivers.length > 0 && (
            <div className="space-y-4 flex flex-col flex-1 min-h-[250px]">
              {/* Summary Badges */}
              <div className="flex flex-wrap items-center justify-between gap-4 shrink-0 px-1">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-black text-charcoal/40 uppercase tracking-wider">
                    Parsed Registry Preview ({parsedDrivers.length} records)
                  </div>
                  <button
                    onClick={() => setParsedDrivers([])}
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
              <div className="border border-silver/50 rounded-2xl shadow-inner bg-silver/5 max-h-[350px] overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full min-w-[1400px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5F7F8] border-b border-silver/45 sticky top-0 z-10 animate-fade-in">
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[140px] bg-[#F5F7F8]">
                        Username *
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[180px] bg-[#F5F7F8]">
                        Email *
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[140px] bg-[#F5F7F8]">
                        Password *
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[130px] bg-[#F5F7F8]">
                        Phone
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[130px] bg-[#F5F7F8]">
                        First Name
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[130px] bg-[#F5F7F8]">
                        Last Name
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[140px] bg-[#F5F7F8]">
                        Vehicle Plate
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[120px] bg-[#F5F7F8]">
                        Vehicle Type
                      </th>
                      <th className="py-3.5 px-3 font-black text-charcoal/50 text-[10px] uppercase tracking-wider text-center min-w-[100px] bg-[#F5F7F8]">
                        Capacity (kg)
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[140px] bg-[#F5F7F8]">
                        Zone
                      </th>
                      <th className="py-3.5 px-5 font-black text-charcoal/50 text-[10px] uppercase tracking-wider min-w-[160px] bg-[#F5F7F8]">
                        Warehouse
                      </th>
                      <th className="py-3.5 px-4 w-[50px] text-center bg-[#F5F7F8]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedDrivers.map((d) => {
                      const hasErr = !!d.error;
                      const hasWarn = !!d.warning;

                      return (
                        <tr
                          key={d.id}
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
                              value={d.username}
                              onChange={(e) =>
                                handleCellChange(d.id, "username", e.target.value)
                              }
                              className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold ${
                                hasErr && !d.username.trim()
                                  ? "border-rose-400 bg-rose-50/50"
                                  : ""
                              }`}
                            />
                            {hasErr && !d.username.trim() && (
                              <div className="text-[10px] text-rose-500 font-bold px-2 mt-0.5">
                                {d.error}
                              </div>
                            )}
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="email"
                              value={d.email}
                              onChange={(e) =>
                                handleCellChange(d.id, "email", e.target.value)
                              }
                              className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold ${
                                hasErr && (!d.email.trim() || !d.email.includes("@"))
                                  ? "border-rose-400 bg-rose-50/50"
                                  : ""
                              }`}
                            />
                            {hasErr && (!d.email.trim() || !d.email.includes("@")) && (
                              <div className="text-[10px] text-rose-500 font-bold px-2 mt-0.5">
                                {d.error}
                              </div>
                            )}
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={d.password}
                              onChange={(e) =>
                                handleCellChange(d.id, "password", e.target.value)
                              }
                              className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-mono font-semibold ${
                                hasErr &&
                                (!d.password.trim() || d.password.trim().length < 8)
                                  ? "border-rose-400 bg-rose-50/50"
                                  : ""
                              }`}
                            />
                            {hasErr &&
                              (!d.password.trim() || d.password.trim().length < 8) && (
                                <div className="text-[10px] text-rose-500 font-bold px-2 mt-0.5">
                                  {d.error}
                                </div>
                              )}
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={d.phone}
                              onChange={(e) =>
                                handleCellChange(d.id, "phone", e.target.value)
                              }
                              placeholder="optional"
                              className="w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold placeholder:text-charcoal/20"
                            />
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={d.first_name}
                              onChange={(e) =>
                                handleCellChange(d.id, "first_name", e.target.value)
                              }
                              className="w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold"
                            />
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={d.last_name}
                              onChange={(e) =>
                                handleCellChange(d.id, "last_name", e.target.value)
                              }
                              className="w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold"
                            />
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={d.vehicle_plate}
                              onChange={(e) =>
                                handleCellChange(d.id, "vehicle_plate", e.target.value)
                              }
                              className="w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-mono font-semibold uppercase"
                            />
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={d.vehicle_type}
                              onChange={(e) =>
                                handleCellChange(d.id, "vehicle_type", e.target.value)
                              }
                              placeholder="van"
                              className="w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold placeholder:text-charcoal/20"
                            />
                          </td>
                          <td className="p-1 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={d.max_capacity_kg}
                              onChange={(e) =>
                                handleCellChange(d.id, "max_capacity_kg", e.target.value)
                              }
                              placeholder="500"
                              className="w-full p-2 text-center bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-bold placeholder:text-charcoal/20"
                            />
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={d.zone}
                              onChange={(e) =>
                                handleCellChange(d.id, "zone", e.target.value)
                              }
                              placeholder="zone name"
                              className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold placeholder:text-charcoal/20 ${
                                d.zone.trim() && !findZoneId(d.zone)
                                  ? "border-amber-400 bg-amber-50/40"
                                  : ""
                              }`}
                            />
                          </td>
                          <td className="p-1 px-3">
                            <input
                              type="text"
                              value={d.warehouse}
                              onChange={(e) =>
                                handleCellChange(d.id, "warehouse", e.target.value)
                              }
                              placeholder="warehouse name"
                              className={`w-full p-2 bg-transparent outline-none border border-transparent rounded-lg focus:bg-white focus:border-silver/80 text-charcoal font-semibold placeholder:text-charcoal/20 ${
                                d.warehouse.trim() && !findWarehouseId(d.warehouse)
                                  ? "border-amber-400 bg-amber-50/40"
                                  : ""
                              }`}
                            />
                          </td>
                          <td className="p-1 text-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(d.id)}
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

              {/* Warnings footnote */}
              {warningCount > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/50 text-amber-800 text-[10px] font-semibold rounded-xl flex items-center gap-2 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Note: {warningCount} row(s) reference a zone/warehouse
                    name that wasn't found. Those rider accounts will still
                    be created, just left unassigned — you can assign them
                    manually afterwards.
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
                isSubmitting || parsedDrivers.length === 0 || errorCount > 0
              }
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating Riders ({parsedDrivers.length})...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Import {parsedDrivers.length || ""} Riders
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
