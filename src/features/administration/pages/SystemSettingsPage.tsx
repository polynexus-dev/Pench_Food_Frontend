import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Camera, 
  FileSignature, 
  UserCheck, 
  Clock, 
  Palette, 
  Building2, 
  Mail, 
  Phone, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  IndianRupee,
  ShieldCheck
} from "lucide-react";
import { adminApi } from "../api/adminApi";
import type { AdminConfiguration } from "../api/adminApi";
import { CustomInput } from "../../../components/common/CustomInput";

const SystemSettingsPage: React.FC = () => {
  const [config, setConfig] = useState<AdminConfiguration>({
    enable_delivery_photo: false,
    require_signature: false,
    auto_assign_orders: true,
    max_cancellation_time: 30,
    support_contact_number: "",
    support_email: "",
    company_name: "",
    theme_color: "#007bff",
    charge_bottle_penalty: false,
    bottle_penalty_amount: "0.00",
    company_upi_id: "",
    company_upi_name: ""
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getConfig();
      setConfig(data);
    } catch (err: any) {
      console.error("Failed to fetch settings config:", err);
      setError("Failed to retrieve system settings configuration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggle = (field: keyof AdminConfiguration) => {
    setConfig(prev => ({
      ...prev,
      [field]: !prev[field] as any
    }));
  };

  const handleChange = (field: keyof AdminConfiguration, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const updated = await adminApi.updateConfig(config);
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setError("Failed to save your administration adjustments. Please check fields and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-charcoal/50">Retrieving system settings catalog...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-xs">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-charcoal tracking-tight">System Settings</h1>
            <p className="text-charcoal/50 font-medium text-xs mt-0.5">
              Manage central operating rules, delivery protocols, logistics, and company branding.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2 max-w-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Column 1: Fulfillment Guidelines */}
          <div className="space-y-6">
            
            {/* CARD A: Proof of Delivery (POD) Guidelines */}
            <div className="p-6 bg-white border border-silver/50 rounded-3xl shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-silver/30">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">Proof of Delivery Rules</h3>
              </div>

              <div className="space-y-4">
                {/* Photo Toggles */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-charcoal block">Force Delivery Photo Proof</span>
                    <span className="text-[10px] text-charcoal/40 font-semibold leading-relaxed block">
                      Drivers are required to snap a POD photo of the dropped item to verify the drop before completing.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("enable_delivery_photo")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      config.enable_delivery_photo ? "bg-primary" : "bg-silver/60"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        config.enable_delivery_photo ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Signature Toggles */}
                <div className="flex justify-between items-start gap-4 pt-3 border-t border-silver/20">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-charcoal block">Require Customer Signature</span>
                    <span className="text-[10px] text-charcoal/40 font-semibold leading-relaxed block">
                      Forces signature capture on the driver's device during drop-offs for delivery verification.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("require_signature")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      config.require_signature ? "bg-primary" : "bg-silver/60"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        config.require_signature ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* CARD B: Logistics & Optimization */}
            <div className="p-6 bg-white border border-silver/50 rounded-3xl shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-silver/30">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">Logistics Rules</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-charcoal block">Auto-Assign Incoming Orders</span>
                    <span className="text-[10px] text-charcoal/40 font-semibold leading-relaxed block">
                      Automatically allot newly scheduled orders to the primary active delivery drivers assigned in each zone.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("auto_assign_orders")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      config.auto_assign_orders ? "bg-primary" : "bg-silver/60"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        config.auto_assign_orders ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Slider: Max Cancellation Time */}
                <div className="space-y-2 pt-3 border-t border-silver/20">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-charcoal/40" />
                      <span className="text-xs font-black text-charcoal">Max Cancellation Window</span>
                    </div>
                    <span className="text-xs font-black bg-silver/10 text-charcoal px-2 py-0.5 rounded-lg border border-silver/40">
                      {config.max_cancellation_time} minutes
                    </span>
                  </div>
                  <p className="text-[10px] text-charcoal/40 font-semibold leading-relaxed">
                    Set the maximum buffer period in minutes within which a customer is permitted to cancel their order.
                  </p>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={config.max_cancellation_time}
                    onChange={(e) => handleChange("max_cancellation_time", parseInt(e.target.value))}
                    className="w-full h-1.5 bg-silver/50 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Column 2: Returnable Container Penalties & Branding */}
          <div className="space-y-6">
            
            {/* CARD C: Flexible Bottle Container Penalties */}
            <div className="p-6 bg-white border border-silver/50 rounded-3xl shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-silver/30">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">Empty Bottle Penalty Settings</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-charcoal block">Charge Penalties for Lost/Broken Bottles</span>
                    <span className="text-[10px] text-charcoal/40 font-semibold leading-relaxed block">
                      Enables penalty billing during monthly reconciliations for container breakages or lost unreturned bottles.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("charge_bottle_penalty")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      config.charge_bottle_penalty ? "bg-primary" : "bg-silver/60"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        config.charge_bottle_penalty ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {config.charge_bottle_penalty && (
                  <div className="pt-3 border-t border-silver/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CustomInput
                      label="Penalty Charge per Bottle (₹)"
                      icon={IndianRupee}
                      type="number"
                      min="0"
                      step="0.01"
                      name="bottle_penalty_amount"
                      value={config.bottle_penalty_amount}
                      onChange={(e) => handleChange("bottle_penalty_amount", e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* CARD F: UPI Payment Settings */}
            <div className="p-6 bg-white border border-silver/50 rounded-3xl shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-silver/30">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">UPI Collection Settings</h3>
              </div>

              <div className="space-y-4">
                <CustomInput
                  label="Company UPI VPA (e.g. pay@bank)"
                  icon={Settings}
                  type="text"
                  name="company_upi_id"
                  value={config.company_upi_id || ""}
                  onChange={(e) => handleChange("company_upi_id", e.target.value)}
                  placeholder="company@okaxis"
                />

                <CustomInput
                  label="Company UPI Display Name"
                  icon={Building2}
                  type="text"
                  name="company_upi_name"
                  value={config.company_upi_name || ""}
                  onChange={(e) => handleChange("company_upi_name", e.target.value)}
                  placeholder="Pench Foods Pvt Ltd"
                />
              </div>
            </div>

            {/* CARD D: Branding & Identity */}
            <div className="p-6 bg-white border border-silver/50 rounded-3xl shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-silver/30">
                <Palette className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">Appearance & branding</h3>
              </div>

              <div className="space-y-4">
                {/* Company Name */}
                <CustomInput
                  label="Company / Brand Name"
                  icon={Building2}
                  type="text"
                  name="company_name"
                  value={config.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  placeholder="e.g. Pench Food & Beverages"
                  required
                />

                {/* Theme Color Picker */}
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="col-span-2">
                    <CustomInput
                      label="Primary Theme hex Color"
                      icon={Palette}
                      type="text"
                      name="theme_color"
                      value={config.theme_color}
                      onChange={(e) => handleChange("theme_color", e.target.value)}
                      placeholder="#007bff"
                      required
                    />
                  </div>
                  <div className="col-span-1 pb-2">
                    <div className="flex items-center gap-2 h-[42px] px-3 bg-white border border-silver/50 rounded-2xl">
                      <input
                        type="color"
                        value={config.theme_color}
                        onChange={(e) => handleChange("theme_color", e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 outline-none p-0 bg-transparent shrink-0"
                      />
                      <span className="text-[10px] font-black text-charcoal/50 uppercase">Preview</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD E: Support Coordinates */}
            <div className="p-6 bg-white border border-silver/50 rounded-3xl shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-silver/30">
                <Mail className="w-5 h-5 text-charcoal/40" />
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">Support Communications</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomInput
                    label="Customer Care Email"
                    icon={Mail}
                    type="email"
                    name="support_email"
                    value={config.support_email}
                    onChange={(e) => handleChange("support_email", e.target.value)}
                    placeholder="support@pench.com"
                  />
                  <CustomInput
                    label="Customer Care Phone"
                    icon={Phone}
                    type="text"
                    name="support_contact_number"
                    value={config.support_contact_number}
                    onChange={(e) => handleChange("support_contact_number", e.target.value)}
                    placeholder="+91 9999999999"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer controls & Saving indicator */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-cream/20 border border-silver/50 rounded-3xl mt-8">
          <div className="flex items-center gap-3">
            {saveSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-black text-primary bg-white border border-primary/20 px-4 py-2 rounded-xl shadow-xs animate-in zoom-in-95">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Operating System Configuration Updated Successfully!
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-black text-charcoal/50">
                <ShieldCheck className="w-4 h-4 text-charcoal/30" />
                Settings are synced in real-time to active tenant subdomains.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white hover:bg-primary/95 rounded-2xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Updating System Configurations...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Operating Rules
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default SystemSettingsPage;
