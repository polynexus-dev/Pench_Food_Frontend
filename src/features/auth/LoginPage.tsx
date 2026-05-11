import React, { useState } from "react";
import { logo } from "../../assets/images";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import axiosInstance from "../../api/axiosInstance";

interface LoginPageProps {
  onLogin?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post("/accounts/login/", {
        username,
        password,
      });

      const { user, access, refresh } = response.data;

      setAuth(user, access, refresh);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to connect to the server. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-milk-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-primary/10 border border-silver/50 relative z-10 overflow-hidden">
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-primary via-sage to-accent"></div>

        <div className="p-10">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-cream rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <img
                src={logo}
                alt="MilkDistro Logo"
                className="w-14 h-14 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-primary">Welcome Back</h1>
            <p className="text-charcoal/60 text-sm">
              Sign in to manage your dairy distribution
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl animate-shake">
                {error}
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-xs font-bold text-charcoal/70 uppercase tracking-wider ml-1"
              >
                Username
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40 group-focus-within:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin"
                  className="w-full pl-12 pr-4 py-3.5 bg-silver/20 border border-silver/50 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-charcoal/70 uppercase tracking-wider">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40 group-focus-within:text-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-silver/20 border border-silver/50 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 ml-1">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-silver text-primary focus:ring-primary"
              />
              <label htmlFor="remember" className="text-sm text-charcoal/60">
                Remember this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-primary/20"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-10 flex items-center justify-center gap-2 text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            Secure Enterprise Access
          </div>
        </div>
      </div>

      {/* Decorative Branding */}
      <div className="absolute bottom-8 text-center w-full text-charcoal/30 text-xs font-medium">
        &copy; 2026 Pench Dairy Solutions. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;
