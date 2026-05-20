import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { companyApi } from "../../api/companyApi";
import type { City } from "../../api/companyApi";
import { Bell, Search, LogOut, MapPin, ChevronDown } from "lucide-react";

const Navbar = () => {
  const { logout, user, tenant, setTenant, companyId } = useAuthStore();
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

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
        <div className="relative group">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-primary/5 hover:bg-primary/10 rounded-2xl border border-primary/10 hover:border-primary/20 transition-all cursor-pointer">
            <div className="p-1 bg-white rounded-lg shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-primary" />
            </div>
            <select
              value={tenant || ""}
              onChange={(e) => setTenant(e.target.value)}
              className="bg-transparent text-xs font-bold text-primary outline-none appearance-none pr-5 cursor-pointer tracking-wide"
            >
              {isLoadingCities ? (
                <option>Loading...</option>
              ) : (
                cities.map((city) => (
                  <option key={city.schema_name} value={city.schema_name}>
                    {city.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3 h-3 text-charcoal/40 absolute right-2 pointer-events-none" />
          </div>
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
