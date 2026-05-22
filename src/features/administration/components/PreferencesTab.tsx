import React, { useState } from "react";
import {
  Bell,
  Save,
  CheckCircle2,
} from "lucide-react";

interface PreferencesTabProps {
  setError: (err: string | null) => void;
}

export const PreferencesTab: React.FC<PreferencesTabProps> = ({ setError }) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState("30");
  const [compactSidebar, setCompactSidebar] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handlePreferencesSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <form onSubmit={handlePreferencesSave} className="space-y-6">
      <div className="p-8 bg-white border border-silver/50 rounded-3xl shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-silver/30">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">
            Alerts & System Preferences
          </h3>
        </div>

        {/* Email Notification Toggle */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-charcoal block">
              Email Alerts
            </span>
            <span className="text-[10px] text-charcoal/40 font-semibold leading-relaxed block">
              Receive real-time transactional logs, monthly billing details,
              and order confirmations via email.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
              emailNotifications ? "bg-primary" : "bg-silver/60"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                emailNotifications ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* SMS Notification Toggle */}
        <div className="flex justify-between items-start gap-4 pt-4 border-t border-silver/20">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-charcoal block">
              SMS & Whatsapp Updates
            </span>
            <span className="text-[10px] text-charcoal/40 font-semibold leading-relaxed block">
              Receive logistics alerts, dispatch updates, and container
              returns directly on your phone.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSmsNotifications(!smsNotifications)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
              smsNotifications ? "bg-primary" : "bg-silver/60"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                smsNotifications ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Layout Toggles */}
        <div className="flex justify-between items-start gap-4 pt-4 border-t border-silver/20">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-charcoal block">
              Compact Sidebar Navigation
            </span>
            <span className="text-[10px] text-charcoal/40 font-semibold leading-relaxed block">
              Collapse the main sidebar menu automatically to maximize map
              and table workspaces.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCompactSidebar(!compactSidebar)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
              compactSidebar ? "bg-primary" : "bg-silver/60"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                compactSidebar ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Dashboard Refresh Frequency */}
        <div className="space-y-2 pt-4 border-t border-silver/20">
          <label className="text-xs font-black text-charcoal block">
            Live Map Auto-Refresh interval
          </label>
          <p className="text-[10px] text-charcoal/40 font-semibold leading-relaxed">
            Determine how frequently the tracking maps and rider positions
            query the server.
          </p>
          <select
            value={autoRefreshInterval}
            onChange={(e) => setAutoRefreshInterval(e.target.value)}
            className="w-full max-w-xs px-4 py-2.5 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-semibold text-sm"
          >
            <option value="10">Every 10 seconds</option>
            <option value="30">Every 30 seconds</option>
            <option value="60">Every 1 minute</option>
            <option value="300">Every 5 minutes</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-cream/20 border border-silver/50 rounded-3xl">
        <span className="text-xs font-black text-charcoal/50">
          {saveSuccess ? (
            <span className="flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="w-4 h-4" /> Preferences Synced!
            </span>
          ) : (
            "Visual styles are applied to this session only."
          )}
        </span>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white hover:bg-primary/95 rounded-2xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </form>
  );
};
