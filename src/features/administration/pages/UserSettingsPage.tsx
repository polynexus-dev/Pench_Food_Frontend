import React, { useState } from "react";
import {
  User,
  Shield,
  Layout,
  Building2,
} from "lucide-react";
import { ProfileTab } from "../components/ProfileTab";
import { SecurityTab } from "../components/SecurityTab";
import { PreferencesTab } from "../components/PreferencesTab";
import { CompaniesTab } from "../components/CompaniesTab";

const UserSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "preferences" | "companies"
  >("profile");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="max-w-8xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-xs">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-charcoal tracking-tight">
              Account Settings
            </h1>
            <p className="text-charcoal/50 font-medium text-xs mt-0.5">
              Personalize your profile credentials, change security
              configurations, and configure application preferences.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2 max-w-sm animate-shake">
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1.5 bg-silver/20 rounded-2xl mb-8 border border-silver/30 max-w-xl">
        <button
          onClick={() => {
            setActiveTab("profile");
            setError(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "profile"
              ? "bg-white text-primary shadow-sm border border-silver/10"
              : "text-charcoal/50 hover:text-charcoal hover:bg-white/50"
          }`}
        >
          <User className="w-4 h-4" />
          My Profile
        </button>
        <button
          onClick={() => {
            setActiveTab("security");
            setError(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "security"
              ? "bg-white text-primary shadow-sm border border-silver/10"
              : "text-charcoal/50 hover:text-charcoal hover:bg-white/50"
          }`}
        >
          <Shield className="w-4 h-4" />
          Security
        </button>
        <button
          onClick={() => {
            setActiveTab("preferences");
            setError(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "preferences"
              ? "bg-white text-primary shadow-sm border border-silver/10"
              : "text-charcoal/50 hover:text-charcoal hover:bg-white/50"
          }`}
        >
          <Layout className="w-4 h-4" />
          Preferences
        </button>
        <button
          onClick={() => {
            setActiveTab("companies");
            setError(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "companies"
              ? "bg-white text-primary shadow-sm border border-silver/10"
              : "text-charcoal/50 hover:text-charcoal hover:bg-white/50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Companies
        </button>
      </div>

      {/* Tab Contents */}
      <div className="tab-content">
        {activeTab === "profile" && <ProfileTab setError={setError} />}
        {activeTab === "security" && <SecurityTab setError={setError} />}
        {activeTab === "preferences" && <PreferencesTab setError={setError} />}
        {activeTab === "companies" && <CompaniesTab setError={setError} />}
      </div>
    </div>
  );
};

export default UserSettingsPage;
