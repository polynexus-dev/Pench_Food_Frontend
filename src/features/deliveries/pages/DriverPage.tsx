import { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  Truck,
  Search,
  Plus,
  ShieldCheck,
  Package,
  Activity,
  MoreVertical,
  Navigation,
  CheckCircle2,
  XCircle,
  Hash,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import CreateDriverModal from "../components/CreateDriverModal";

interface Driver {
  id: string;
  user: number;
  full_name: string;
  vehicle_plate: string;
  vehicle_type: string;
  max_capacity_kg: string;
  is_available: boolean;
}

const DriverPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const tenant = useAuthStore((state) => state.tenant);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/ems/drivers/");
      setDrivers(response.data);
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [tenant]);

  const filteredDrivers = drivers.filter((driver) =>
    driver.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.vehicle_plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Truck className="w-8 h-8" />
            </div>
            Delivery Fleet
          </h1>
          <p className="text-charcoal/50 font-medium mt-1">
            Monitor and manage your active delivery personnel and vehicles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-5 h-5" />
            Register Driver
          </button>
        </div>
      </div>

      <CreateDriverModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDrivers}
      />

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by driver name or vehicle plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-silver/50 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-charcoal font-medium"
          />
        </div>

        <div className="flex gap-3">
          <div className="bg-white border border-silver/50 rounded-2xl p-1 flex shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-charcoal/40 hover:text-charcoal'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-charcoal/40 hover:text-charcoal'}`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-primary/5 px-5 py-4 rounded-2xl border border-primary/10 flex items-center gap-3">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Available Now</span>
            <span className="text-lg font-black text-primary leading-none">
              {drivers.filter(d => d.is_available).length}
            </span>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className={`bg-white rounded-3xl border border-silver/50 animate-pulse ${viewMode === 'grid' ? 'h-64' : 'h-24'}`}></div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <div key={driver.id} className="bg-white rounded-3xl border border-silver/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all group overflow-hidden flex flex-col">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg- cream rounded-2xl flex items-center justify-center border border-primary/5 group-hover:scale-105 transition-transform duration-300 relative">
                    <ShieldCheck className="w-8 h-8 text-primary/40" />
                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${driver.is_available ? 'bg-green-500 ring-2 ring-green-500/20' : 'bg-red-500 ring-2 ring-red-500/20'}`}></div>
                  </div>
                  <button className="p-1.5 text-charcoal/20 hover:text-charcoal hover:bg-silver/30 rounded-lg transition-all">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-black text-charcoal group-hover:text-primary transition-colors leading-tight mb-4">
                  {driver.full_name}
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-silver/10 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-primary/40" />
                      <span className="text-xs font-black text-charcoal/40 uppercase tracking-widest">Plate No</span>
                    </div>
                    <span className="text-sm font-bold text-charcoal font-mono">{driver.vehicle_plate}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border border-silver/30 rounded-2xl">
                      <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest mb-1">Type</p>
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-primary/60" />
                        <span className="text-xs font-bold text-charcoal capitalize">{driver.vehicle_type}</span>
                      </div>
                    </div>
                    <div className="p-3 border border-silver/30 rounded-2xl">
                      <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest mb-1">Capacity</p>
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-primary/60" />
                        <span className="text-xs font-bold text-charcoal">{driver.max_capacity_kg} kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto p-4 bg-silver/5 border-t border-silver/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-charcoal/40">
                  <Activity className="w-3 h-3" />
                  ID: #{driver.user}
                </div>
                <button className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                  <Navigation className="w-3 h-3" />
                  Track Location
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-silver/10 text-[10px] uppercase tracking-[0.2em] text-charcoal/40 font-black border-b border-silver/30">
                <tr>
                  <th className="px-8 py-5">Driver Name</th>
                  <th className="px-6 py-5">Vehicle Details</th>
                  <th className="px-6 py-5">Capacity</th>
                  <th className="px-6 py-5">Availability</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/30">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-cream rounded-xl flex items-center justify-center font-black text-sm text-primary border border-primary/5">
                          {driver.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-charcoal">{driver.full_name}</p>
                          <p className="text-[10px] text-charcoal/40 font-bold uppercase">ID: #{driver.user}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-charcoal font-mono">{driver.vehicle_plate}</span>
                        <span className="text-[10px] text-charcoal/30 uppercase font-black">{driver.vehicle_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-charcoal/70">
                        <Package className="w-3.5 h-3.5 text-primary/40" />
                        {driver.max_capacity_kg} kg
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                        driver.is_available 
                          ? 'bg-sage/10 text-primary border border-primary/10' 
                          : 'bg-red-50 text-red-500 border border-red-100'
                      }`}>
                        {driver.is_available ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Available
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Busy
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-charcoal/20 hover:text-primary hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredDrivers.length === 0 && !isLoading && (
        <div className="p-20 text-center bg-white rounded-3xl border border-silver/50 shadow-sm mt-8">
          <div className="w-20 h-20 bg-silver/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-10 h-10 text-charcoal/20" />
          </div>
          <h3 className="text-xl font-bold text-charcoal">No drivers found</h3>
          <p className="text-charcoal/40">Try searching for a different name or plate number.</p>
        </div>
      )}
    </div>
  );
};

export default DriverPage;
