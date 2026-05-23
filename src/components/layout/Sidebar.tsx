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
  CreditCard,
  Briefcase,
  Settings,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { companyApi } from "../../api/companyApi";
import type { Company } from "../../api/companyApi";

const Sidebar = () => {
  const { tenant, setTenant, companyId, setCompanyId, user } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCompanies = async (selectCompanyId?: string) => {
    console.log("Sidebar: fetchCompanies triggered. selectCompanyId:", selectCompanyId);
    setIsLoadingCompanies(true);
    try {
      const data = await companyApi.getCompanies();
      console.log("Sidebar: fetchCompanies API returned raw list:", data);
      const activeCompanies = data.filter((c) => c.is_active);
      console.log("Sidebar: fetchCompanies filtered active companies:", activeCompanies);
      setCompanies(activeCompanies);

      const { companyId: storeCompanyId, tenant: storeTenant, setCompanyId, setTenant } = useAuthStore.getState();
      console.log("Sidebar: Current store state:", { storeCompanyId, storeTenant });

      // Determine active/default company
      const defaultCompany = activeCompanies[0];
      let currentCompanyId = selectCompanyId || storeCompanyId;

      if (!currentCompanyId && defaultCompany) {
        console.log("Sidebar: No active company set. Selecting default company:", defaultCompany.id);
        setCompanyId(defaultCompany.id);
        currentCompanyId = defaultCompany.id;
      } else if (selectCompanyId) {
        console.log("Sidebar: Setting active company to new ID:", selectCompanyId);
        setCompanyId(selectCompanyId);
      }

      // Set default tenant/city if not set or if it's not valid for the active company
      const currentCompany = activeCompanies.find((c) => c.id === currentCompanyId);
      console.log("Sidebar: Active company object in list:", currentCompany);
      if (currentCompany && currentCompany.cities && currentCompany.cities.length > 0) {
        const companyCities = currentCompany.cities;
        const citySchemaNames = companyCities.map((city) => city.schema_name);
        if (!storeTenant || !citySchemaNames.includes(storeTenant)) {
          console.log("Sidebar: Setting default tenant/city:", companyCities[0].schema_name);
          setTenant(companyCities[0].schema_name);
        }
      } else if (selectCompanyId) {
        // Reset active tenant/city since it's a new company with no cities yet
        console.log("Sidebar: Resetting tenant schema to empty for new company");
        setTenant("");
      }
    } catch (error) {
      console.error("Sidebar: Failed to fetch companies:", error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  useEffect(() => {
    console.log("Sidebar: mounted, calling fetchCompanies()");
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleCompanyCreated = (event: Event) => {
      const customEvent = event as CustomEvent<Company>;
      const newCompany = customEvent.detail;
      console.log("Sidebar: Caught company-created event!", newCompany);
      if (newCompany && newCompany.id) {
        console.log("Sidebar: Calling fetchCompanies with the new company ID:", newCompany.id);
        fetchCompanies(newCompany.id);
      } else {
        console.warn("Sidebar: company-created event detail is invalid:", newCompany);
      }
    };
    console.log("Sidebar: Registering company-created event listener");
    window.addEventListener("company-created", handleCompanyCreated);
    return () => {
      console.log("Sidebar: Unregistering company-created event listener");
      window.removeEventListener("company-created", handleCompanyCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const isCustomer = user?.is_customer || user?.role?.toLowerCase() === "customer";
  const isLockedRole = isCustomer || user?.role?.toLowerCase() === "drivers" || user?.role?.toLowerCase() === "driver";

  return (
    <aside className="w-72 bg-gradient-to-b from-[#1a2e21] to-[#0a140d] text-white hidden md:flex flex-col h-full shrink-0 shadow-2xl relative z-30">
      <div className="p-6 relative select-none" ref={dropdownRef}>
        {isLockedRole ? (
          <div className="w-full text-left p-3.5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between select-none">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 rotate-3 shrink-0">
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
          </div>
        ) : (
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
        )}

        {isOpen && !isLockedRole && (
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
                        const companyCities = company.cities || [];
                        const firstCity = companyCities[0];
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
        {isCustomer ? (
          <>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" end />
            <SidebarItem icon={ClipboardList} label="My Subscriptions" to="/my-subscriptions" />
            <SidebarItem icon={ShoppingCart} label="My Orders" to="/my-orders" />
            <SidebarItem icon={CreditCard} label="My Bills" to="/my-bills" />
            <SidebarItem icon={Package} label="Container Ledger" to="/my-containers" />
          </>
        ) : user?.role?.toLowerCase() === "drivers" || user?.role?.toLowerCase() === "driver" ? (
          <>
            <SidebarItem icon={LayoutDashboard} label="Employee Dashboard" to="/" end />
            <SidebarItem icon={Briefcase} label="My Payroll & Leaves" to="/my-payroll" />
          </>
        ) : (
          <>
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
            <SidebarItem icon={CreditCard} label="Finance & Billing" to="/finance" />
            <SidebarItem icon={Briefcase} label="HR & Payroll" to="/hr" />
            <SidebarItem icon={Users} label="Customers" to="/customers" />
            <SidebarItem icon={User} label="Riders" to="/drivers" />
            <SidebarItem icon={ClipboardList} label="Reports" to="/reports" />
          </>
        )}
      </nav>

      {/* Brand Footer */}
      <div className="p-5 mt-auto border-t border-white/5 bg-gradient-to-t from-white/[0.01] to-transparent shrink-0">
        <div className="relative group flex flex-col items-center justify-center text-center p-3 bg-white/[0.02] border border-white/5 rounded-2xl transition-all duration-500 hover:bg-white/[0.04] hover:border-accent/20">
          <span className="text-[8px] font-black tracking-widest text-white/30 uppercase group-hover:text-accent/60 transition-colors duration-300">
            Developed & Powered By
          </span>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[11px] font-bold text-white tracking-tight group-hover:text-accent transition-all duration-300">
              Pench Foods
            </span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
            </span>
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
