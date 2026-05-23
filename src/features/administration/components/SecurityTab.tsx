import React, { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
} from "lucide-react";
import { CustomInput } from "../../../components/common/CustomInput";

interface SecurityTabProps {
  setError: (err: string | null) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ setError }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSecuritySave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  return (
    <form onSubmit={handleSecuritySave} className="space-y-6">
      <div className="p-8 bg-white border border-silver/50 rounded-3xl shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-silver/30">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">
            Change Password
          </h3>
        </div>

        <div className="space-y-5">
          <div className="relative">
            <CustomInput
              label="Current Password"
              icon={Lock}
              type={showPass.current ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() =>
                setShowPass((p) => ({ ...p, current: !p.current }))
              }
              className="absolute right-4 top-[35px] text-charcoal/30 hover:text-charcoal transition-colors cursor-pointer"
            >
              {showPass.current ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="relative">
            <CustomInput
              label="New Password"
              icon={Lock}
              type={showPass.new ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => ({ ...p, new: !p.new }))}
              className="absolute right-4 top-[35px] text-charcoal/30 hover:text-charcoal transition-colors cursor-pointer"
            >
              {showPass.new ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="relative">
            <CustomInput
              label="Confirm New Password"
              icon={Lock}
              type={showPass.confirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() =>
                setShowPass((p) => ({ ...p, confirm: !p.confirm }))
              }
              className="absolute right-4 top-[35px] text-charcoal/30 hover:text-charcoal transition-colors cursor-pointer"
            >
              {showPass.confirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-cream/20 border border-silver/50 rounded-3xl">
        <span className="text-xs font-black text-charcoal/50">
          {saveSuccess ? (
            <span className="flex items-center gap-1.5 text-primary animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4" /> Password Changed Successfully!
            </span>
          ) : (
            "Your credentials will be validated before update."
          )}
        </span>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white hover:bg-primary/95 rounded-2xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Updating Password..." : "Update Password"}
        </button>
      </div>
    </form>
  );
};
