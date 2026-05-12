import { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
import {
  Building2,
  MapPin,
  Globe,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  MoreVertical,
  RefreshCcw,
} from "lucide-react";
import CreateTenantModal from "../components/CreateTenantModal";

interface City {
  id: number;
  schema_name: string;
  name: string;
  state: string;
  code: string;
  is_active: boolean;
  timezone: string;
  created_at: string;
}

const TenantPage = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCities = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/erp/tenants/cities/");
      // Filter out 'public' schema
      const filteredData = response.data.filter(
        (city: City) => city.schema_name !== "public",
      );
      setCities(filteredData);
    } catch (error) {
      console.error("Failed to fetch cities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const filteredCities = cities.filter(
    (city) =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.schema_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-charcoal tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Building2 className="w-8 h-8" />
            </div>
            Tenant Management
          </h1>
          <p className="text-charcoal/50 font-medium mt-1">
            Configure and monitor your multi-tenant city instances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCities}
            className="p-3 text-charcoal/40 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all border border-silver/50"
            title="Refresh List"
          >
            <RefreshCcw
              className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New City
          </button>
        </div>
      </div>

      <CreateTenantModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCities}
      />

      {/* Search & Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-2 flex items-center gap-2 bg-white border border-silver/50 rounded-2xl shadow-sm px-4">
          <Search className="text-charcoal/30 w-5 h-5" />
          <input
            type="text"
            placeholder="Search city, schema, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-4  rounded-2xl transition-all outline-none"
          />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-silver/50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sage/10 rounded-xl text-primary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-charcoal/40 font-black">
              Active
            </p>
            <p className="text-xl font-black text-charcoal">
              {cities.filter((c) => c.is_active).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-silver/50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-500">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-charcoal/40 font-black">
              Total
            </p>
            <p className="text-xl font-black text-charcoal">{cities.length}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 border border-silver/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-silver/5 text-[11px] uppercase tracking-[0.15em] text-charcoal/40 font-black border-b border-silver/50">
              <tr>
                <th className="px-8 py-5">City Instance</th>
                <th className="px-6 py-5">Schema / Domain</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/30">
              {isLoading
                ? Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-8 py-10 bg-silver/5"></td>
                      </tr>
                    ))
                : filteredCities.map((city) => (
                    <tr
                      key={city.id}
                      className="hover:bg-primary/5 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-cream rounded-2xl flex items-center justify-center font-black text-primary border border-primary/10 group-hover:scale-110 transition-transform">
                            {city.code}
                          </div>
                          <div>
                            <p className="text-base font-bold text-charcoal leading-tight">
                              {city.name}
                            </p>
                            <p className="text-xs text-charcoal/40 font-medium">
                              ID: #{city.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary font-mono">
                            {city.schema_name}
                          </span>
                          <span className="text-[10px] text-charcoal/30 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {city.schema_name}.pench.api...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-sm font-semibold text-charcoal/70">
                          <MapPin className="w-4 h-4 text-primary/50" />
                          {city.state}, India
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                            city.is_active
                              ? "bg-sage/10 text-primary border border-primary/20"
                              : "bg-red-50 text-red-500 border border-red-100"
                          }`}
                        >
                          {city.is_active ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Online
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              Offline
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <button className="p-2 text-charcoal/20 hover:text-charcoal hover:bg-silver/30 rounded-xl transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {filteredCities.length === 0 && !isLoading && (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-silver/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-charcoal/20" />
              </div>
              <h3 className="text-lg font-bold text-charcoal">
                No cities found
              </h3>
              <p className="text-charcoal/40">
                Try adjusting your search query or refresh the list.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantPage;
