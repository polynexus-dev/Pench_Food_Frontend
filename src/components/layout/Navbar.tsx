import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { companyApi } from "../../api/companyApi";
import type { City } from "../../api/companyApi";
import { Bell, Search, LogOut, MapPin, ChevronDown } from "lucide-react";

const Navbar = () => {
  const { logout, user, tenant, setTenant, companyId } = useAuthStore();
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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
        
        // Find the active company (either the stored one or the first active one)
        let activeCompany = companies.find((c) => c.id === companyId && c.is_active);
        if (!activeCompany && companies.length > 0) {
          activeCompany = companies.find((c) => c.is_active);
        }

        if (activeCompany) {
          const activeCities = activeCompany.cities
            ? activeCompany.cities.filter((c: City) => c.is_active)
            : [];
          setCities(activeCities);

          // Ensure tenant matches one of this company's cities
          const citySchemas = activeCities.map((c: City) => c.schema_name);
          if (activeCities.length > 0 && (!tenant || !citySchemas.includes(tenant))) {
            setTenant(activeCities[0].schema_name);
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
  }, [companyId, tenant, setTenant]);

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
          {user?.role?.toLowerCase() === "customer" || user?.role?.toLowerCase() === "drivers" || user?.role?.toLowerCase() === "driver" ? (
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
        <button className="p-3 text-charcoal/40 hover:text-primary hover:bg-primary/5 rounded-2xl relative transition-all group">
          <Bell className="w-5 h-5 group-hover:animate-swing" />
          <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-500/20"></span>
        </button>

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
