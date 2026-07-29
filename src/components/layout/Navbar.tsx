import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useCompanyStore } from "../../store/useCompanyStore";
import type { City } from "../../api/companyApi";
import { customerApi } from "../../features/customers/api/customerApi";
import type { Customer } from "../../features/customers/components/types";
import { 
  Bell, 
  Search, 
  LogOut, 
  MapPin, 
  ChevronDown, 
  Settings, 
  Trash2, 
  Menu,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  Navigation,
  Package,
  CreditCard,
  Briefcase,
  User,
  Building2,
  ClipboardList,
  QrCode,
  Map,
  X,
  ArrowRight,
  CornerDownLeft
} from "lucide-react";
import { useNotificationStore } from "../../store/useNotificationStore";

interface NavbarProps {
  onMenuClick?: () => void;
}

interface SearchModuleItem {
  id: string;
  title: string;
  category: "Module" | "Feature" | "Customer Portal" | "Customer";
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const ALL_SEARCH_ITEMS: SearchModuleItem[] = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    category: "Module",
    description: "Main business metrics, sales overview, daily delivery progress",
    path: "/",
    icon: LayoutDashboard,
    keywords: ["dashboard", "home", "overview", "analytics", "stats", "metrics", "sales"]
  },
  {
    id: "customers",
    title: "Customer Directory",
    category: "Module",
    description: "Manage retail & wholesale customer accounts and contact info",
    path: "/customers",
    icon: Users,
    keywords: ["customers", "client", "directory", "contacts", "users", "subscribers", "phone", "name"]
  },
  {
    id: "leads",
    title: "Leads & Non-Subscribed",
    category: "Feature",
    description: "View potential leads, trial requests, and unsubscribed contacts",
    path: "/customers?tab=leads",
    icon: Users,
    keywords: ["leads", "non-subscribed", "trials", "prospects", "unsubscribed", "new customers"]
  },
  {
    id: "customer-map",
    title: "Customer Map View",
    category: "Feature",
    description: "Interactive map of customer delivery locations and zones",
    path: "/customers?tab=detail",
    icon: Map,
    keywords: ["map", "location", "geofence", "coordinates", "customer map", "gis"]
  },
  {
    id: "customer-qr",
    title: "Customer QR Code Manager",
    category: "Feature",
    description: "Generate & download customer QR stickers for bottle delivery",
    path: "/customers?tab=customer-qr",
    icon: QrCode,
    keywords: ["qr", "qr code", "sticker", "barcode", "scan", "download qr"]
  },
  {
    id: "orders",
    title: "Orders & Deliveries",
    category: "Module",
    description: "Manage daily orders, custom orders, and delivery schedules",
    path: "/orders",
    icon: ShoppingCart,
    keywords: ["orders", "deliveries", "sales", "schedule", "dispatch", "order history"]
  },
  {
    id: "logistics",
    title: "Logistics & Route Allocation",
    category: "Module",
    description: "Vehicle route planning, rider route assignment, dispatch runs",
    path: "/logistics",
    icon: Truck,
    keywords: ["logistics", "route", "dispatch", "vehicles", "delivery route", "allocation"]
  },
  {
    id: "tracking",
    title: "Live GPS Tracking",
    category: "Module",
    description: "Real-time live location tracking of riders and delivery vans",
    path: "/tracking",
    icon: Navigation,
    keywords: ["tracking", "live tracking", "gps", "riders map", "fleet", "realtime", "map"]
  },
  {
    id: "inventory",
    title: "Inventory & Stock Control",
    category: "Module",
    description: "Bottle tracking, warehouse stock, bottle return balances",
    path: "/inventory",
    icon: Package,
    keywords: ["inventory", "stock", "bottles", "warehouse", "crates", "crate balance", "products"]
  },
  {
    id: "finance",
    title: "Finance & Billing",
    category: "Module",
    description: "Monthly customer invoices, payment history, outstanding ledgers",
    path: "/finance",
    icon: CreditCard,
    keywords: ["finance", "billing", "invoices", "payments", "ledger", "due", "revenue", "bills"]
  },
  {
    id: "hr",
    title: "HR & Payroll",
    category: "Module",
    description: "Staff & rider directory, salary slips, attendance, payroll logs",
    path: "/hr",
    icon: Briefcase,
    keywords: ["hr", "payroll", "employees", "staff", "salary", "attendance", "leaves"]
  },
  {
    id: "drivers",
    title: "Riders & Drivers",
    category: "Module",
    description: "Delivery driver profiles, vehicle plates, zone coverage",
    path: "/drivers",
    icon: User,
    keywords: ["riders", "drivers", "delivery boy", "vehicles", "driver profiles", "staff"]
  },
  {
    id: "tenants",
    title: "Tenants & Cities",
    category: "Module",
    description: "Multi-city branch management, company city schemas",
    path: "/tenants",
    icon: Building2,
    keywords: ["tenants", "cities", "branches", "company", "nagpur", "schemas", "locations"]
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    category: "Module",
    description: "Exportable CSV reports, financial summaries, bottle summaries",
    path: "/reports",
    icon: ClipboardList,
    keywords: ["reports", "analytics", "export", "csv", "data", "summary", "stats"]
  },
  {
    id: "settings",
    title: "Account Settings",
    category: "Module",
    description: "User profile, password change, notification preferences",
    path: "/profile/settings",
    icon: Settings,
    keywords: ["settings", "profile", "account", "password", "security", "user settings"]
  },
  {
    id: "my-subscriptions",
    title: "My Daily Subscriptions",
    category: "Customer Portal",
    description: "Customer recurring milk & dairy subscriptions",
    path: "/my-subscriptions",
    icon: ClipboardList,
    keywords: ["my subscriptions", "daily subscription", "milk subscription", "pause subscription"]
  },
  {
    id: "my-orders",
    title: "My Order History",
    category: "Customer Portal",
    description: "Customer personal order history & delivery status",
    path: "/my-orders",
    icon: ShoppingCart,
    keywords: ["my orders", "order status", "past orders"]
  },
  {
    id: "my-bills",
    title: "My Billing Statement",
    category: "Customer Portal",
    description: "Customer monthly invoices & online payments",
    path: "/my-bills",
    icon: CreditCard,
    keywords: ["my bills", "invoices", "payments", "due payment"]
  },
  {
    id: "my-containers",
    title: "Container Ledger",
    category: "Customer Portal",
    description: "Customer empty bottle return ledger",
    path: "/my-containers",
    icon: Package,
    keywords: ["my containers", "bottle ledger", "empty bottles", "bottle balance"]
  }
];

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { logout, user, tenant, setTenant, companyId } = useAuthStore();
  const { notifications, markAllAsRead, clearNotifications } = useNotificationStore();
  const { companies, fetchCompanies } = useCompanyStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Quick Search Command Palette States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const showSettings = !!user;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Derive cities from the shared company store instead of fetching independently
  const activeCompanies = companies.filter((c) => c.is_active);
  const activeCompany = companies.find((c) => c.id === companyId) || activeCompanies[0];
  const cities: City[] = activeCompany?.cities || [];
  const isLoadingCities = companies.length === 0;

  // Fetch customers when quick search opens to support live customer search
  useEffect(() => {
    if (isSearchOpen && tenant) {
      customerApi.getCustomers().then((data) => {
        setCustomerList(data);
      }).catch(() => {});
    }
  }, [isSearchOpen, tenant]);

  // Combine module search items with live customer search results
  const filteredSearchItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ALL_SEARCH_ITEMS;

    const matchedModules = ALL_SEARCH_ITEMS.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchKey = item.keywords.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCat || matchKey;
    });

    const matchedCustomers: SearchModuleItem[] = customerList
      .filter((c) => {
        const nameMatch = (c.name || "").toLowerCase().includes(q);
        const phoneMatch = (c.phone || "").includes(q);
        const emailMatch = (c.email || "").toLowerCase().includes(q);
        const addressMatch = (c.address || "").toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch || addressMatch;
      })
      .slice(0, 6)
      .map((c) => ({
        id: `customer-${c.id}`,
        title: c.name || "Customer Account",
        category: "Customer" as const,
        description: `Phone: ${c.phone || "N/A"} • ${c.address || "No address"}`,
        path: `/customers?viewProfile=${c.id}`,
        icon: User,
        keywords: [c.name, c.phone, c.email].filter(Boolean) as string[],
      }));

    return [...matchedCustomers, ...matchedModules];
  }, [searchQuery, customerList]);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isSearchOpen]);

  // Command palette keyboard navigation (Up, Down, Enter, Escape)
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredSearchItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredSearchItems.length) % (filteredSearchItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSearchItems.length > 0) {
        const item = filteredSearchItems[selectedIndex];
        if (item) {
          navigate(item.path);
          setIsSearchOpen(false);
        }
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  const handleSelectItem = (path: string) => {
    navigate(path);
    setIsSearchOpen(false);
  };

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

  // When companyId changes, ensure companies are loaded (uses cache if fresh)
  useEffect(() => {
    fetchCompanies();
  }, [companyId, fetchCompanies]);

  // Auto-select city if stored tenant is missing or not in this company's cities
  useEffect(() => {
    if (cities.length > 0) {
      const citySchemas = cities.map((c: City) => c.schema_name);
      if (!tenant || !citySchemas.includes(tenant)) {
        setTenant(cities[0].schema_name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, cities.length]);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-silver/50 flex items-center justify-between px-4 md:px-10 shrink-0 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3 relative w-full max-w-[200px] sm:max-w-[400px]">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2.5 hover:bg-silver/10 active:scale-95 rounded-2xl border border-silver/50 text-charcoal md:hidden cursor-pointer shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative flex-1 hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30 w-4.5 h-4.5" />
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-full text-left pl-12 pr-12 py-3 bg-silver/10 border border-transparent rounded-2xl text-sm text-charcoal/50 hover:bg-silver/20 hover:text-charcoal focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all cursor-pointer flex items-center justify-between select-none"
          >
            <span>Quick search everything...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-charcoal/40 bg-white rounded-lg border border-silver/40 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>
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

      {/* Operational Quick Search Command Palette Modal */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-charcoal/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-silver/40 animate-in zoom-in-95 duration-200 flex flex-col text-left max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="relative border-b border-silver/30 px-6 py-4 flex items-center gap-3 bg-silver/5">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search modules, customers by name/phone, or quick jump..."
                className="w-full bg-transparent border-none outline-none text-base font-bold text-charcoal placeholder:text-charcoal/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-charcoal/30 hover:text-charcoal rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-2.5 py-1 text-xs font-bold text-charcoal/40 hover:text-charcoal bg-silver/20 rounded-xl transition-colors cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Search Results List */}
            <div className="max-h-[400px] overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {filteredSearchItems.length === 0 ? (
                <div className="py-12 text-center text-charcoal/40 font-medium space-y-2">
                  <Search className="w-8 h-8 text-charcoal/20 mx-auto" />
                  <p className="text-sm font-bold">No results match "{searchQuery}"</p>
                  <p className="text-xs">Try searching for customer names, phone numbers, orders, logistics, or finance.</p>
                </div>
              ) : (
                filteredSearchItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full px-4 py-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.01]"
                          : "hover:bg-silver/10 text-charcoal"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl transition-colors ${
                            isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm tracking-tight truncate">
                              {item.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : item.category === "Customer" 
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-silver/30 text-charcoal/60"
                              }`}
                            >
                              {item.category}
                            </span>
                          </div>
                          <p
                            className={`text-xs mt-0.5 truncate ${
                              isSelected ? "text-white/80 font-medium" : "text-charcoal/50 font-medium"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isSelected ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-xl">
                            <span>Open</span>
                            <CornerDownLeft className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-charcoal/20" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Navigation Bar */}
            <div className="bg-silver/10 border-t border-silver/30 px-6 py-3 flex items-center justify-between text-[11px] text-charcoal/40 font-bold">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-silver/40 font-mono text-[10px]">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-silver/40 font-mono text-[10px]">↵</kbd> select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-silver/40 font-mono text-[10px]">ESC</kbd> close
                </span>
              </div>
              <span className="text-primary font-black uppercase tracking-wider">Pench Quick Search</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

