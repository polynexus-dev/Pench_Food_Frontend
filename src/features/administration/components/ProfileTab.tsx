import React, { useState } from "react";
import {
  User,
  UserCheck,
  Mail,
  Phone,
  Globe,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { CustomInput } from "../../../components/common/CustomInput";

interface ProfileTabProps {
  setError: (err: string | null) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ setError }) => {
  const { user, tenant } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.first_name || "Admin");
  const [lastName, setLastName] = useState(user?.last_name || "User");
  const [email, setEmail] = useState(user?.email || "admin@pench.com");
  const [phone, setPhone] = useState(user?.phone || "+91 98765 43210");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  return (
    <form onSubmit={handleProfileSave} className="space-y-6">
      <div className="p-8 bg-white border border-silver/50 rounded-3xl shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-silver/30">
          <UserCheck className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">
            Personal Identity
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <CustomInput
            label="First Name"
            icon={User}
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <CustomInput
            label="Last Name"
            icon={User}
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <CustomInput
            label="Email Address"
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <CustomInput
            label="Phone Number"
            icon={Phone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        {/* Read-Only Account Metadata */}
        <div className="pt-6 border-t border-silver/30">
          <h4 className="text-xs font-black text-charcoal uppercase tracking-wider mb-4">
            Account Attributes
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-silver/10 rounded-2xl border border-silver/30">
              <span className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider block">
                Username
              </span>
              <span className="text-sm font-extrabold text-charcoal mt-1 block">
                {user?.username || "admin"}
              </span>
            </div>
            <div className="p-4 bg-silver/10 rounded-2xl border border-silver/30">
              <span className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider block">
                User Role
              </span>
              <span className="text-sm font-extrabold text-primary capitalize mt-1 block">
                {user?.role || "Distributor"}
              </span>
            </div>
            <div className="p-4 bg-silver/10 rounded-2xl border border-silver/30">
              <span className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider block">
                Active Subdomain
              </span>
              <span className="text-sm font-extrabold text-charcoal mt-1 block flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                {tenant || "nagpur"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-cream/20 border border-silver/50 rounded-3xl">
        <span className="text-xs font-black text-charcoal/50">
          {saveSuccess ? (
            <span className="flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="w-4 h-4" /> Profile Details Updated!
            </span>
          ) : (
            "Updates will take effect immediately upon saving."
          )}
        </span>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white hover:bg-primary/95 rounded-2xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving Updates..." : "Save Profile Details"}
        </button>
      </div>
    </form>
  );
};
