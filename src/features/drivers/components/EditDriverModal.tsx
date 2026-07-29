import React, { useState, useEffect } from "react";
import { X, User, Phone, MapPin, Truck, Key, Shield, Loader2, Eye, EyeOff, Building2, Check } from "lucide-react";
import type { Driver, Zone } from "./types";
import { driverApi } from "../api/driverApi";
import { tenantApi } from "../../tenant/api/tenantApi";

interface EditDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  onSuccess: (updatedDriver: Driver) => void;
}

export const EditDriverModal: React.FC<EditDriverModalProps> = ({
  isOpen,
  onClose,
  driver,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("van");
  const [maxCapacityKg, setMaxCapacityKg] = useState("500");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Populate initial values when modal opens or driver changes
  useEffect(() => {
    if (driver && isOpen) {
      setFullName(driver.full_name || "");
      setPhone(driver.phone || "");
      setZoneId(driver.zone || "");
      setVehiclePlate(driver.vehicle_plate || "");
      setVehicleType(driver.vehicle_type || "van");
      setMaxCapacityKg(String(driver.max_capacity_kg || 500));
      setUsername(driver.username || "");
      setNewPassword("");
      setShowPassword(false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [driver, isOpen]);

  // Fetch zones for zone assignment dropdown
  useEffect(() => {
    if (isOpen) {
      setIsLoadingZones(true);
      tenantApi
        .getZones()
        .then((data) => setZones(data))
        .catch((err) => console.error("Failed to load zones:", err))
        .finally(() => setIsLoadingZones(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Prepare main driver profile update payload
      const patchPayload: any = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        zone: zoneId || null,
        vehicle_plate: vehiclePlate.trim(),
        vehicle_type: vehicleType.trim(),
        max_capacity_kg: parseFloat(maxCapacityKg) || 500,
        username: username.trim(),
      };

      if (newPassword.trim()) {
        patchPayload.password = newPassword.trim();
      }

      const updatedDriver = await driverApi.updateDriver(driver.id, patchPayload);

      setSuccessMessage("Rider profile & credentials updated successfully!");
      setTimeout(() => {
        onSuccess(updatedDriver);
        onClose();
      }, 750);
    } catch (err: any) {
      console.error("Failed to update rider details:", err);
      const serverErr = err.response?.data;
      let msg = "Failed to update rider. Please check your inputs.";
      if (serverErr && typeof serverErr === "object") {
        if (serverErr.detail) msg = serverErr.detail;
        else {
          msg = Object.entries(serverErr)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
            .join("\n");
        }
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-charcoal/65 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-silver/40 animate-in zoom-in-95 duration-200 flex flex-col text-left max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-silver/30 flex items-center justify-between bg-silver/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary border border-primary/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-charcoal tracking-tight">
                Edit Rider & Account Credentials
              </h2>
              <p className="text-[11px] font-bold text-charcoal/40">
                Change rider name, zone assignment, or reset login credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-charcoal/30 hover:text-charcoal hover:bg-silver/20 rounded-xl transition-all outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-bold whitespace-pre-line">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {successMessage}
            </div>
          )}

          {/* Section 1: Rider Profile Details */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" /> Rider Identity & Zone
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block ml-1">
                  Full Name (Replace / Edit) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block ml-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block ml-1">
                Assigned Delivery Zone *
              </label>
              {isLoadingZones ? (
                <div className="py-2 text-xs text-charcoal/40 font-bold">Loading zones...</div>
              ) : (
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Section 2: Vehicle Specs */}
          <div className="space-y-3 pt-2 border-t border-silver/30">
            <h3 className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-primary" /> Vehicle Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block ml-1">
                  License Plate *
                </label>
                <input
                  type="text"
                  required
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="e.g. MH-31-AB-1234"
                  className="w-full px-3 py-2 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block ml-1">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs cursor-pointer"
                >
                  <option value="van">Delivery Van</option>
                  <option value="bike">Motorcycle / Bike</option>
                  <option value="scooter">Electric Scooter</option>
                  <option value="auto">Cargo Auto</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block ml-1">
                  Capacity (kg)
                </label>
                <input
                  type="number"
                  value={maxCapacityKg}
                  onChange={(e) => setMaxCapacityKg(e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-2 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: User ID & Password Control (Admin Only) */}
          <div className="space-y-3 p-4 bg-silver/10 border border-silver/40 rounded-2xl">
            <h3 className="text-[10px] font-black text-charcoal uppercase tracking-widest flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-primary" /> Admin Login Credentials Control
            </h3>
            <p className="text-[10px] font-medium text-charcoal/60 leading-normal">
              Directly update the rider's User ID (Username) or set a new password for mobile app access.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block ml-1">
                  User ID (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ramesh_rider"
                  className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block ml-1">
                  New Password (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-charcoal/30 hover:text-charcoal rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-silver/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-silver/50 hover:bg-silver/10 rounded-xl text-xs font-bold text-charcoal active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/95 transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Rider & Credentials"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
