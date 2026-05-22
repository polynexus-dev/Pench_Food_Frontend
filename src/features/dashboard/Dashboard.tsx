import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import axiosInstance from '../../api/axiosInstance';
import { 
  LayoutDashboard, 
  Truck, 
  Package, 
  Users, 
  TrendingUp, 
  Bell, 
  Search,
  Droplets,
  ClipboardList,
  ChevronRight,
  LogOut,
  MapPin,
  ChevronDown
} from 'lucide-react';

interface City {
  id: number;
  schema_name: string;
  name: string;
  is_active: boolean;
}

const Dashboard = () => {
  const { logout, user, tenant, setTenant } = useAuthStore();
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Dynamic Dashboard Stats State
  const [customerCount, setCustomerCount] = useState(0);
  const [riderCount, setRiderCount] = useState(0);
  const [zoneCount, setZoneCount] = useState(0);
  const [activeDeliveriesCount, setActiveDeliveriesCount] = useState(0);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const response = await axiosInstance.get('/erp/tenants/cities/');
        // Filter out 'public' and only keep active cities
        const filteredCities = response.data.filter((c: City) => c.schema_name !== 'public' && c.is_active);
        setCities(filteredCities);
        
        // If no tenant is set, default to the first city in the list
        if (!tenant && filteredCities.length > 0) {
          setTenant(filteredCities[0].schema_name);
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCities();
  }, [tenant, setTenant]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!tenant) return;
      setIsLoadingStats(true);
      try {
        // 1. Fetch Customers
        const custRes = await axiosInstance.get('/erp/customers/');
        const activeCusts = Array.isArray(custRes.data) ? custRes.data : [];
        setCustomerCount(activeCusts.length);

        // 2. Fetch Riders (Drivers)
        const driverRes = await axiosInstance.get('/erp/drivers/');
        const activeRiders = Array.isArray(driverRes.data) ? driverRes.data : [];
        setRiderCount(activeRiders.length);

        // 3. Fetch Zones
        const zoneRes = await axiosInstance.get('/erp/zones/');
        const activeZones = Array.isArray(zoneRes.data) ? zoneRes.data : [];
        setZoneCount(activeZones.length);

        // 4. Fetch Routes
        const routeRes = await axiosInstance.get('/erp/routes/');
        const activeRoutes = Array.isArray(routeRes.data) ? routeRes.data : [];
        setActiveDeliveriesCount(activeRoutes.length);

        // 5. Populate some real recent routes/deliveries
        const mappedDeliveries = activeRoutes.slice(0, 4).map((route: any) => ({
          id: `#RTE-${route.id.slice(0, 4).toUpperCase()}`,
          customer: route.driver_name || 'Unassigned Rider',
          item: route.zone_name || 'General Zone',
          amount: `${route.assigned_customers_count || 0} Customers`,
          status: route.is_active ? 'In Transit' : 'Delivered',
          time: new Date(route.created_at || Date.now()).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }));
        setRecentDeliveries(mappedDeliveries);

      } catch (error) {
        console.error('Failed to load dashboard operational statistics:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [tenant]);

  const stats = [
    { title: 'Active Partners', value: isLoadingStats ? '...' : `${customerCount}`, change: 'Registered', icon: Users, color: 'text-primary' },
    { title: 'Active Riders', value: isLoadingStats ? '...' : `${riderCount}`, change: 'On Duty', icon: Truck, color: 'text-sage' },
    { title: 'Operated Zones', value: isLoadingStats ? '...' : `${zoneCount}`, change: 'Geographies', icon: MapPin, color: 'text-accent' },
    { title: 'Active Routes', value: isLoadingStats ? '...' : `${activeDeliveriesCount}`, change: 'Dispatched', icon: ClipboardList, color: 'text-charcoal' },
  ];

  return (
    <div className="flex h-screen bg-milk-white">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <Droplets className="text-primary w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">MilkDistro</span>
        </div>
        
        <nav className="flex-1 px-4 mt-4 space-y-2">
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={Truck} label="Deliveries" />
          <NavItem icon={Package} label="Inventory" />
          <NavItem icon={Users} label="Customers" />
          <NavItem icon={ClipboardList} label="Reports" />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-sage/20 p-4 rounded-xl border border-sage/30">
            <p className="text-xs text-sage-100 mb-1">Weekly Goal</p>
            <div className="flex justify-between items-end mb-2">
              <span className="text-lg font-bold">85%</span>
              <span className="text-[10px] opacity-70">25,000L / 30,000L</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div className="bg-accent h-1.5 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-silver flex items-center justify-between px-8">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search deliveries, customers..."
              className="w-full pl-10 pr-4 py-2 bg-silver/30 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="flex items-center gap-4">
            {/* City Selector */}
            <div className="relative group mr-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-silver/20 rounded-full border border-silver/50 hover:border-primary/30 transition-all cursor-pointer">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <select 
                  value={tenant || ''} 
                  onChange={(e) => setTenant(e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-charcoal outline-none appearance-none pr-4 cursor-pointer"
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

            <button className="p-2 text-charcoal/60 hover:bg-silver/50 rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-silver">
              <div className="text-right">
                <p className="text-sm font-bold text-charcoal">{user?.username || 'Admin User'}</p>
                <p className="text-[10px] text-charcoal/60 capitalize">{user?.role || 'Distributor Head'}</p>
              </div>
              <button 
                onClick={logout}
                className="w-10 h-10 bg-cream rounded-full border border-silver flex items-center justify-center overflow-hidden hover:bg-red-50 hover:border-red-200 group transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-charcoal/60 group-hover:text-red-500 transition-colors" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-charcoal">Distributor Overview</h1>
            <p className="text-charcoal/60">Welcome back! Here's what's happening today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-silver hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-silver/20 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.includes('+') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-charcoal/60 text-sm font-medium">{stat.title}</h3>
                <p className="text-2xl font-bold text-charcoal mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Deliveries Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-silver overflow-hidden">
              <div className="p-6 border-b border-silver flex justify-between items-center">
                <h3 className="font-bold text-charcoal">Active Dispatch Routes</h3>
                <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/5 px-3 py-1.5 rounded-lg">
                  Real-time status
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-silver/10 text-[11px] uppercase tracking-wider text-charcoal/50 font-bold border-b border-silver">
                    <tr>
                      <th className="px-6 py-4">Route ID</th>
                      <th className="px-6 py-4">Assigned Rider</th>
                      <th className="px-6 py-4">Coverage Zone</th>
                      <th className="px-6 py-4">Load / Scale</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-silver">
                    {recentDeliveries.map((delivery, i) => (
                      <tr key={i} className="hover:bg-milk-white/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-primary">{delivery.id}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-charcoal">{delivery.customer}</p>
                          <p className="text-[10px] text-charcoal/50">{delivery.time}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-charcoal/80 font-bold">{delivery.item}</td>
                        <td className="px-6 py-4 text-sm font-bold text-charcoal/60">{delivery.amount}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            delivery.status === 'Delivered' ? 'bg-sage/20 text-primary' : 
                            delivery.status === 'In Transit' ? 'bg-accent/20 text-orange-700' : 
                            'bg-silver text-charcoal/60'
                          }`}>
                            {delivery.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {recentDeliveries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-sm text-charcoal/40 font-bold">
                          No active routes dispatched for today yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions / Stock */}
            <div className="space-y-6">
              <div className="bg-cream p-6 rounded-2xl border border-accent/30">
                <h3 className="font-bold text-charcoal mb-4">Stock Highlights</h3>
                <div className="space-y-4">
                  <StockItem label="Full Cream" level={92} color="bg-primary" />
                  <StockItem label="Skimmed Milk" level={45} color="bg-accent" />
                  <StockItem label="Paneer" level={78} color="bg-sage" />
                  <StockItem label="Curd / Yogurt" level={23} color="bg-red-400" />
                </div>
                <button className="w-full mt-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
                  Create Restock Order
                </button>
              </div>

              <div className="bg-charcoal text-white p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Bell className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-bold">System Alerts</h3>
                </div>
                <p className="text-sm text-white/70 mb-4">You have 3 routes needing optimization due to traffic conditions.</p>
                <button className="text-accent text-sm font-bold hover:underline">Review Routes &rarr;</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active = false }: { icon: any; label: string; active?: boolean }) => (
  <a 
    href="#" 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-white text-primary font-bold shadow-lg shadow-black/10' 
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm">{label}</span>
  </a>
);

const StockItem = ({ label, level, color }: { label: string; level: number; color: string }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="font-medium text-charcoal/70">{label}</span>
      <span className="font-bold text-charcoal">{level}%</span>
    </div>
    <div className="w-full bg-white rounded-full h-1.5 border border-silver">
      <div className={`${color} h-1.5 rounded-full`} style={{ width: `${level}%` }}></div>
    </div>
  </div>
);

export default Dashboard;
