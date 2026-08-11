import React, { useState, useEffect } from "react";
import { logo } from "../../assets/images";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import axiosInstance from "../../api/axiosInstance";
import { tenantApi } from "../tenant/api/tenantApi";
import type { City } from "../tenant/components/types";

interface LoginPageProps {
  onLogin?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = () => {
  // Login states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register states
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regCity, setRegCity] = useState("");
  const [isRegLoading, setIsRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Cities selection state
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const { setAuth } = useAuthStore();

  // Load cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoadingCities(true);
        const data = await tenantApi.getCities();
        setCities(data);
      } catch (err) {
        console.error("Failed to load cities for registration dropdown", err);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

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

      const roleLower = user.role?.toLowerCase();
      const isDriver = roleLower === "drivers" || roleLower === "driver";

      if (
        !user.is_erp_user &&
        !user.is_superuser &&
        !user.is_staff &&
        !user.is_customer &&
        !isDriver
      ) {
        setError(
          "Access Denied: Your account does not have access to this portal.",
        );
        setIsLoading(false);
        return;
      }

      setAuth(user, access, refresh);
    } catch (err: any) {
      const serverMsg = err.response?.data?.detail || err.response?.data?.message;
      setError(
        typeof serverMsg === "string"
          ? serverMsg
          : "Failed to connect to the server. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegLoading(true);
    setRegError(null);
    setRegSuccess(null);

    if (!regCity) {
      setRegError("Please select your city to register.");
      setIsRegLoading(false);
      return;
    }

    try {
      const payload = {
        username: regEmail,
        email: regEmail,
        password: regPassword,
        role: "Customers",
        tenant_schema: regCity,
      };

      await axiosInstance.post("/accounts/register/", payload);
      setRegSuccess(
        "Registration successful! You can now log in using your credentials.",
      );

      // Clear register inputs
      setRegEmail("");
      setRegPassword("");
      setRegCity("");
    } catch (err: any) {
      const data = err.response?.data;
      let msg = "Failed to register. Please try again.";
      if (data) {
        if (typeof data === "string") {
          msg = data;
        } else if (Array.isArray(data)) {
          msg = data[0]?.message || data[0] || msg;
        } else if (typeof data === "object") {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            const val = data[keys[0]];
            msg = Array.isArray(val)
              ? val[0]
              : typeof val === "string"
                ? val
                : JSON.stringify(val);
          }
        }
      }
      setRegError(msg);
    } finally {
      setIsRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        {/* Top Header Contact Bar */}
        <div className="w-full bg-[#01522D] text-white/90 py-2.5 px-6 hidden md:block text-xs font-sans tracking-wide">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex gap-6">
              <span>✉ info@penchfoods.in</span>
              <span>📍 Shop No 1 & 2, Telangkhedi, Ram Nagar, Nagpur 440010</span>
            </div>
            <div>
              <span>📞 +91 9657673411</span>
            </div>
          </div>
        </div>

        {/* Branding Header */}
        <div className="w-full bg-white py-4 px-6 border-b border-[#E3E3E3]">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Pench Foods Logo"
                className="h-10 object-contain"
              />
              <span className="font-bold text-lg text-[#01522D] tracking-wide font-sans">
                Pench Foods Pvt. Ltd.
              </span>
            </div>
            <div className="text-sm font-bold text-[#E8BC5A] font-sans italic hidden sm:block">
              Go With Nature
            </div>
          </div>
        </div>

        {/* Page Banner with background overlay */}
        <div
          className="w-full py-16 relative overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://linen-cheetah-756778.hostingersite.com/wp-content/uploads/2020/11/Paneer.png')",
          }}
        >
          <div className="absolute inset-0 bg-[#01522D]/75"></div>
          <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-wide font-sans">
              My account
            </h1>
            <div className="text-white/80 text-sm font-semibold tracking-wider font-sans">
              <span>Home</span>
              <span className="mx-2">&gt;</span>
              <span className="text-[#E8BC5A]">My account</span>
            </div>
          </div>
        </div>

        {/* Two-Column Forms Container */}
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Left Column: Login */}
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-[#01522D] border-b-2 border-[#E8BC5A] pb-3 font-sans">
              Login
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-bold text-charcoal flex items-center gap-1"
                >
                  Username or email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border border-[#E3E3E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01522D]/20 focus:border-[#01522D] transition-all bg-[#F1FFF7]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-bold text-charcoal flex items-center gap-1"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 pr-12 border border-[#E3E3E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01522D]/20 focus:border-[#01522D] transition-all bg-[#F1FFF7]"
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

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#01522D] text-white hover:bg-[#01522D]/95 px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-75 hover:shadow-md cursor-pointer"
                >
                  {isLoading ? "Logging in..." : "Log in"}
                </button>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="rememberme"
                    className="w-4 h-4 rounded border-silver text-[#01522D] focus:ring-[#01522D] accent-[#01522D] cursor-pointer"
                  />
                  <span className="text-sm font-bold text-charcoal/70">
                    Remember me
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      "Please contact your system administrator to recover your account credentials.",
                    );
                  }}
                  className="text-sm font-bold text-[#01522D] hover:underline"
                >
                  Lost your password?
                </a>
              </div>
            </form>
          </div>

          {/* Right Column: Register */}
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-[#01522D] border-b-2 border-[#E8BC5A] pb-3 font-sans">
              Register
            </h2>

            <form onSubmit={handleRegister} className="space-y-5">
              {regError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl">
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl">
                  {regSuccess}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="reg_email"
                  className="text-sm font-bold text-charcoal flex items-center gap-1"
                >
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="reg_email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border border-[#E3E3E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01522D]/20 focus:border-[#01522D] transition-all bg-[#F1FFF7]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="reg_password"
                  className="text-sm font-bold text-charcoal flex items-center gap-1"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={regShowPassword ? "text" : "password"}
                    id="reg_password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 pr-12 border border-[#E3E3E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01522D]/20 focus:border-[#01522D] transition-all bg-[#F1FFF7]"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
                  >
                    {regShowPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="reg_city"
                  className="text-sm font-bold text-charcoal flex items-center gap-1"
                >
                  Select City <span className="text-red-500">*</span>
                </label>
                <select
                  id="reg_city"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border border-[#E3E3E3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#01522D]/20 focus:border-[#01522D] transition-all bg-[#F1FFF7] cursor-pointer"
                >
                  <option value="">-- Choose your city --</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.schema_name}>
                      {city.name} ({city.state})
                    </option>
                  ))}
                </select>
                {isLoadingCities && (
                  <span className="text-xs text-charcoal/40 font-medium">
                    Loading cities...
                  </span>
                )}
              </div>

              <div className="text-xs text-charcoal/60 leading-relaxed pt-2 font-medium">
                Your personal data will be used to support your experience throughout
                this website, to manage access to your account, and for other
                purposes described in our{" "}
                <a
                  href="#"
                  className="underline font-semibold hover:text-[#01522D] transition-colors"
                >
                  privacy policy
                </a>
                .
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRegLoading}
                  className="bg-[#E8BC5A] text-[#01522D] hover:bg-[#E8BC5A]/95 px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-75 hover:shadow-md cursor-pointer"
                >
                  {isRegLoading ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Decorative Copyright Footer */}
      <div className="text-center py-6 text-charcoal/50 text-xs font-bold border-t border-[#E3E3E3]/50 bg-white space-y-1">
        <div>&copy; 2026 Pench Foods Pvt. Ltd. All rights reserved.</div>
        <div className="text-[10px] font-semibold text-charcoal/40 uppercase tracking-widest">
          Developed &amp; Powered by{" "}
          <a
            href="https://polynexus.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#01522D] transition-colors underline font-bold"
          >
            Polynexus Technologies
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

