import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { companyApi } from "../../api/companyApi";
import type { City } from "../../api/companyApi";
import { Bell, Search, LogOut, MapPin, ChevronDown, Settings, Trash2 } from "lucide-react";
import { useNotificationStore } from "../../store/useNotificationStore";

const Navbar = () => {
  const { logout, user, tenant, setTenant, companyId } = useAuthStore();
  const { notifications, markAllAsRead, clearNotifications } = useNotificationStore();
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const showSettings = !!user;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCitySelect = (schema_name: string) => {
    setTenant(schema_name);
    setIsDropdownOpen(false);
  };

  const selectedCity = cities.find((c) => c.schema_name === tenant) || cities[0];

  useEffect(() => {
    const fetchCompanyCities = async () => {
      setIsLoadingCities(true);
      try {
        const companies = await companyApi.getCompanies();
        const activeCompanies = companies.filter((c) => c.is_active);

        // Validate stored companyId against fetched list
        let activeCompany = activeCompanies.find((c) => c.id === companyId);
        if (!activeCompany && activeCompanies.length > 0) {
          // Stored companyId is stale/missing — fall back to first active company
          activeCompany = activeCompanies[0];
        }

        if (activeCompany) {
          const companyCities = activeCompany.cities || [];
          setCities(companyCities);

          // Auto-select city if stored tenant is missing or not in this company's cities
          const citySchemas = companyCities.map((c: City) => c.schema_name);
          if (companyCities.length > 0 && (!tenant || !citySchemas.includes(tenant))) {
            setTenant(companyCities[0].schema_name);
          }
        } else {
          setCities([]);
        }
      } catch (error) {
        console.error("Failed to fetch company cities:", error);
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCompanyCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-silver/50 flex items-center justify-between px-10 shrink-0 sticky top-0 z-20 shadow-sm">
      <div className="relative w-[400px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30 w-4.5 h-4.5" />
        <input
          type="text"
          placeholder="Quick search everything..."
          className="w-full pl-12 pr-4 py-3 bg-silver/10 border border-transparent rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-charcoal/30"
        />
      </div>

      <div className="flex items-center gap-6">
        {/* City Selector */}
        <div className="relative" ref={dropdownRef}>
          {((user?.role?.toLowerCase() === "customer" || user?.role?.toLowerCase() === "drivers" || user?.role?.toLowerCase() === "driver") && !user?.is_superuser && !user?.is_staff) ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-silver/10 rounded-2xl border border-silver/30 select-none">
              <div className="p-1 bg-white rounded-lg shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-charcoal/50" />
              </div>
              <span className="text-xs font-bold text-charcoal/60 tracking-wide">
                {selectedCity?.name || "Nagpur Branch"}
              </span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-primary/5 hover:bg-primary/10 active:scale-[0.98] rounded-2xl border border-primary/10 hover:border-primary/20 transition-all cursor-pointer select-none"
              >
                <div className="p-1 bg-white rounded-lg shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary tracking-wide">
                  {isLoadingCities ? "Loading..." : (selectedCity?.name || "Select City")}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-primary/60 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && !isLoadingCities && cities.length > 0 && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-silver/50 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-250">
                  <p className="px-3.5 py-1 text-[8px] font-black text-charcoal/30 uppercase tracking-widest border-b border-silver/20 mb-1 block">
                    Select Active City
                  </p>
                  {cities.map((city) => {
                    const isActive = city.schema_name === tenant;
                    return (
                      <button
                        key={city.schema_name}
                        type="button"
                        onClick={() => handleCitySelect(city.schema_name)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left font-bold transition-all ${
                          isActive 
                            ? "text-primary bg-primary/5 border-l-2 border-primary" 
                            : "text-charcoal/60 hover:text-charcoal hover:bg-silver/10 border-l-2 border-transparent"
                        }`}
                      >
                        <span>{city.name}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              if (!isNotificationsOpen) {
                markAllAsRead();
              }
            }}
            className="p-3 text-charcoal/40 hover:text-primary hover:bg-primary/5 rounded-2xl relative transition-all group cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5 group-hover:animate-swing" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-silver/50 rounded-2xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-3 duration-250 text-left">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-silver/20 mb-2">
                <span className="text-xs font-bold text-charcoal">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      clearNotifications();
                      setIsNotificationsOpen(false);
                    }}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto px-1 space-y-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-charcoal/40 font-bold">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => {
                    let typeDot = "bg-primary";
                    if (n.type === "success") typeDot = "bg-emerald-500";
                    if (n.type === "error") typeDot = "bg-rose-500";
                    if (n.type === "warning") typeDot = "bg-amber-500";
                    return (
                      <div
                        key={n.id}
                        className="p-3 hover:bg-silver/10 rounded-xl transition-all border border-transparent hover:border-silver/20 flex gap-2.5"
                      >
                        <div className="mt-1">
                          <span className={`w-2 h-2 rounded-full block ${typeDot}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-charcoal leading-snug">{n.title}</p>
                          <p className="text-[10px] text-charcoal/60 leading-normal mt-0.5 whitespace-pre-wrap">{n.message}</p>
                          <p className="text-[8px] text-charcoal/30 font-black uppercase tracking-wider mt-1">{n.timestamp}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        {showSettings && (
          <Link
            to="/profile/settings"
            className="p-3 text-charcoal/40 hover:text-primary hover:bg-primary/5 rounded-2xl relative transition-all group"
            title="Account Settings"
          >
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          </Link>
        )}

        {/* Profile / Logout */}
        <div className="flex items-center gap-4 pl-6 border-l border-silver/50">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-bold text-charcoal leading-none mb-1">
              {user?.username || "Admin User"}
            </p>
            <p className="text-[10px] text-charcoal/40 uppercase tracking-widest font-bold">
              {user?.role || "Distributor Head"}
            </p>
          </div>
          <button
            onClick={logout}
            className="w-12 h-12 bg-cream/50 hover:bg-red-50 rounded-2xl border border-silver/50 hover:border-red-100 flex items-center justify-center overflow-hidden transition-all shadow-sm hover:shadow-red-500/10 group"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-charcoal/40 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
