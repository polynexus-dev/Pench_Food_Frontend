import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Package,
  Users,
  ClipboardList,
  Droplets,
  Building2,
  Navigation,
  ShoppingCart,
  ChevronDown,
  Check,
  User,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { companyApi } from "../../api/companyApi";
import type { Company } from "../../api/companyApi";

const Sidebar = () => {
  const { tenant, setTenant, companyId, setCompanyId } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const data = await companyApi.getCompanies();
        const activeCompanies = data.filter((c) => c.is_active);
        setCompanies(activeCompanies);

        // Determine default company and select it if no companyId is set
        const defaultCompany = activeCompanies[0];
        let currentCompanyId = companyId;
        
        if (!companyId && defaultCompany) {
          setCompanyId(defaultCompany.id);
          currentCompanyId = defaultCompany.id;
        }

        // Set default tenant/city if not set or if it's not valid for the active company
        const currentCompany = activeCompanies.find(c => c.id === currentCompanyId);
        if (currentCompany && currentCompany.cities.length > 0) {
          const activeCities = currentCompany.cities.filter(city => city.is_active);
          if (activeCities.length > 0) {
            const citySchemaNames = activeCities.map(city => city.schema_name);
            if (!tenant || !citySchemaNames.includes(tenant)) {
              setTenant(activeCities[0].schema_name);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [companyId, tenant, setCompanyId, setTenant]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentCompany = companies.find(c => c.id === companyId);
  const currentCity = currentCompany?.cities.find(city => city.schema_name === tenant);

  return (
    <aside className="w-72 bg-gradient-to-b from-[#1a2e21] to-[#0a140d] text-white hidden md:flex flex-col h-full shrink-0 shadow-2xl relative z-30">
      <div className="p-6 relative select-none" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left p-3.5 hover:bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 rotate-3 group-hover:rotate-0 transition-transform shrink-0">
              <Droplets className="text-primary w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-base font-extrabold tracking-tight block leading-none text-white truncate">
                {currentCompany ? currentCompany.name : "PENCH"}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold opacity-80 mt-1 block">
                {currentCity ? currentCity.name : "Dairy ERP"}
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-white/40 group-hover:text-white transition-transform duration-300 shrink-0 ml-2 ${
              isOpen ? "rotate-180 text-white" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-[88px] left-6 right-6 bg-[#122217] border border-white/10 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white/40">
              Switch Company
            </p>
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
              {isLoadingCompanies ? (
                <div className="px-3 py-2.5 text-xs text-white/40 flex items-center gap-2">
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                  Loading...
                </div>
              ) : companies.length === 0 ? (
                <div className="px-3 py-2.5 text-xs text-white/40">No companies found</div>
              ) : (
                companies.map((company) => {
                  const isActive = company.id === companyId;
                  return (
                    <button
                      key={company.id}
                      onClick={() => {
                        setCompanyId(company.id);
                        const activeCities = company.cities ? company.cities.filter(c => c.is_active) : [];
                        const firstCity = activeCities[0];
                        if (firstCity) {
                          setTenant(firstCity.schema_name);
                        } else {
                          setTenant("");
                        }
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? "bg-accent text-primary font-bold shadow-[0_4px_12px_rgba(240,192,86,0.15)]"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isActive ? "bg-primary text-accent" : "bg-white/10 text-white"
                          }`}
                        >
                          {company.code ? company.code.substring(0, 2).toUpperCase() : company.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold truncate">{company.name}</span>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" end />
        <SidebarItem icon={Building2} label="Tenants" to="/tenants" />
        <SidebarItem icon={Truck} label="Logistics & Route" to="/logistics" />
        <SidebarItem
          icon={Navigation}
          label="Live Tracking"
          to="/tracking"
          pulse
        />
        <SidebarItem icon={Package} label="Inventory" to="/inventory" />
        <SidebarItem icon={ShoppingCart} label="Orders" to="/orders" />
        <SidebarItem icon={Users} label="Customers" to="/customers" />
        <SidebarItem icon={User} label="Drivers" to="/drivers" />
        <SidebarItem icon={ClipboardList} label="Reports" to="/reports" />
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-gradient-to-br from-white/10 to-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <p className="text-[10px] text-accent uppercase tracking-widest mb-2 font-bold">
            Logistics Goal
          </p>
          <div className="flex justify-between items-end mb-2">
            <span className="text-2xl font-black">
              85<span className="text-sm font-normal opacity-60">%</span>
            </span>
            <span className="text-[10px] opacity-50 font-medium pb-1">
              Target: 30k L
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-accent to-sage h-full rounded-full shadow-[0_0_10px_rgba(240,192,86,0.3)]"
              style={{ width: "85%" }}
            ></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const SidebarItem = ({
  icon: Icon,
  label,
  to,
  end = false,
  pulse = false,
}: {
  icon: any;
  label: string;
  to: string;
  end?: boolean;
  pulse?: boolean;
}) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `
      flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group
      ${
        isActive
          ? "bg-accent text-primary font-bold shadow-[0_10px_20px_rgba(240,192,86,0.2)] scale-[1.02]"
          : "text-white/60 hover:bg-white/5 hover:text-white hover:pl-6"
      }
    `}
  >
    {({ isActive }) => (
      <>
        <div className="flex items-center gap-3">
          <Icon
            className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-primary" : "text-accent/60 group-hover:text-accent"}`}
          />
          <span className="text-[13px] font-semibold tracking-wide">
            {label}
          </span>
        </div>
        {pulse && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </>
    )}
  </NavLink>
);

export default Sidebar;
