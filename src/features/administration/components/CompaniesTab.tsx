import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Trash2,
  Edit3,
  Search,
  X,
  MapPin,
  RefreshCw,
  Shield,
  Save,
  CheckCircle2,
} from "lucide-react";
import { companyApi } from "../../../api/companyApi";
import type { Company, City } from "../../../api/companyApi";
import { CustomInput } from "../../../components/common/CustomInput";
import CreateCompanyModal from "./CreateCompanyModal";

interface CompaniesTabProps {
  setError: (err: string | null) => void;
}

export const CompaniesTab: React.FC<CompaniesTabProps> = ({ setError }) => {
  // Companies list
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isFetchingCompanies, setIsFetchingCompanies] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Edit/Create State
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [compName, setCompName] = useState("");
  const [compCode, setCompCode] = useState("");
  const [compActive, setCompActive] = useState(true);
  const [compCities, setCompCities] = useState<City[]>([]);

  // City Sub-Form State
  const [cityName, setCityName] = useState("");
  const [citySchema, setCitySchema] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load companies
  const fetchCompanies = useCallback(async () => {
    setIsFetchingCompanies(true);
    setError(null);
    try {
      const data = await companyApi.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error("Failed to load companies:", err);
      setError("Failed to load companies. Using cached registry.");
    } finally {
      setIsFetchingCompanies(false);
    }
  }, [setError]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Save company
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim() || !compCode.trim()) {
      setError("Company Name and Code are required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      if (editingCompanyId) {
        // Edit flow
        // try {
        //   const updated = await companyApi.updateCompany(
        //     editingCompanyId,
        //     compName.trim(),
        //     compCode.trim(),
        //     compActive,
        //     compCities
        //   );
        //   setCompanies((prev) =>
        //     prev.map((c) => (c.id === editingCompanyId ? updated : c))
        //   );
        // } catch (apiErr) {
        //   console.warn("API update failed, falling back to local update", apiErr);
        //   const fallbackUpdated: Company = {
        //     id: editingCompanyId,
        //     name: compName.trim(),
        //     code: compCode.trim(),
        //     is_active: compActive,
        //     cities: compCities,
        //   };
        //   setCompanies((prev) =>
        //     prev.map((c) => (c.id === editingCompanyId ? fallbackUpdated : c))
        //   );
        // }
      } else {
        // Create flow
        try {
          const newCompany = await companyApi.createCompany(
            compName.trim(),
            compCode.trim(),
          );
          const completeCompany: Company = {
            ...newCompany,
            is_active: compActive,
            cities: compCities,
          };
          setCompanies((prev) => [...prev, completeCompany]);
        } catch (apiErr) {
          console.warn(
            "API create failed, falling back to local create",
            apiErr,
          );
          const fallbackCompany: Company = {
            id: `local_${Date.now()}`,
            name: compName.trim(),
            code: compCode.trim(),
            is_active: compActive,
            cities: compCities,
          };
          setCompanies((prev) => [...prev, fallbackCompany]);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsEditingCompany(false);
      setEditingCompanyId(null);
      setCompName("");
      setCompCode("");
      setCompActive(true);
      setCompCities([]);
    } catch (err: any) {
      console.error("Failed to save company:", err);
      setError("An unexpected error occurred while saving the company.");
    } finally {
      setIsSaving(false);
    }
  };

  // // Delete company
  // const handleDeleteCompany = async (id: string) => {
  //   if (!window.confirm("Are you sure you want to delete this company?")) {
  //     return;
  //   }

  //   setError(null);
  //   try {
  //     try {
  //       await companyApi.deleteCompany(id);
  //     } catch (apiErr) {
  //       console.warn("API delete failed, falling back to local delete", apiErr);
  //     }
  //     setCompanies((prev) => prev.filter((c) => c.id !== id));
  //     setSaveSuccess(true);
  //     setTimeout(() => setSaveSuccess(false), 3000);
  //   } catch (err: any) {
  //     console.error("Failed to delete company:", err);
  //     setError("An unexpected error occurred while deleting the company.");
  //   }
  // };

  // Add City under company
  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim() || !citySchema.trim()) {
      return;
    }
    const newCity: City = {
      id: `city_${Date.now()}`,
      name: cityName.trim(),
      schema_name: citySchema.trim(),
      is_active: true,
    };
    setCompCities((prev) => [...prev, newCity]);
    setCityName("");
    setCitySchema("");
  };

  // Remove City
  const handleRemoveCity = (cityId: string | number) => {
    setCompCities((prev) => prev.filter((c) => c.id !== cityId));
  };

  return (
    <div className="space-y-6">
      {isEditingCompany ? (
        /* Create / Edit Company Form */
        <form
          onSubmit={handleSaveCompany}
          className="space-y-6 animate-in fade-in-50 duration-200"
        >
          <div className="p-8 bg-white border border-silver/50 rounded-3xl shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-silver/30">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">
                  {editingCompanyId
                    ? "Edit Company Details"
                    : "Register New Company"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingCompany(false);
                  setEditingCompanyId(null);
                  setCompName("");
                  setCompCode("");
                  setCompActive(true);
                  setCompCities([]);
                }}
                className="p-2 hover:bg-silver/10 rounded-xl text-charcoal/40 hover:text-charcoal transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Information */}
              <div className="space-y-5">
                <h4 className="text-xs font-black text-charcoal/40 uppercase tracking-wider">
                  Basic Credentials
                </h4>
                <CustomInput
                  label="Company Name"
                  icon={Building2}
                  type="text"
                  placeholder="e.g. Aniket Corp"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  required
                />

                <CustomInput
                  label="Company Code (Short Code)"
                  icon={Shield}
                  type="text"
                  placeholder="e.g. ANI"
                  value={compCode}
                  onChange={(e) => setCompCode(e.target.value)}
                  required
                />

                {/* Active/Inactive Toggle */}
                <div className="flex justify-between items-start gap-4 pt-4 border-t border-silver/20">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-charcoal block">
                      Company Status
                    </span>
                    <span className="text-[10px] text-charcoal/40 font-semibold leading-relaxed block">
                      Active companies can own and run sub-tenant cities, manage
                      riders, and route bookings.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompActive(!compActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      compActive ? "bg-primary" : "bg-silver/60"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        compActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Right Column: Cities Management */}
              <div className="space-y-5">
                <h4 className="text-xs font-black text-charcoal/40 uppercase tracking-wider">
                  Branch / City Registry
                </h4>

                {/* List of associated cities */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider block">
                    Assigned Cities ({compCities.length})
                  </span>
                  {compCities.length === 0 ? (
                    <div className="p-4 bg-silver/10 border border-dashed border-silver/50 rounded-2xl text-center">
                      <span className="text-xs text-charcoal/40 font-medium">
                        No cities assigned. Add a city using the form below.
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-1">
                      {compCities.map((city) => (
                        <div
                          key={city.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-silver/20 hover:bg-silver/30 border border-silver/40 rounded-xl transition-all"
                        >
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-extrabold text-charcoal leading-none">
                              {city.name}
                            </span>
                            <span className="text-[9px] text-charcoal/40 font-bold leading-none mt-0.5">
                              Schema: {city.schema_name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCity(city.id)}
                            className="ml-1 p-0.5 hover:bg-charcoal/10 rounded text-charcoal/40 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-form to Add City */}
                <div className="p-4 bg-silver/10 border border-silver/30 rounded-2xl space-y-4">
                  <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block">
                    Quick Add City
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-charcoal/60 uppercase block">
                        City Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nagpur"
                        value={cityName}
                        onChange={(e) => setCityName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-semibold text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-charcoal/60 uppercase block">
                        Schema Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. nagpur"
                        value={citySchema}
                        onChange={(e) => setCitySchema(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-semibold text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (!cityName.trim() || !citySchema.trim()) return;
                      handleAddCity(e);
                    }}
                    disabled={!cityName.trim() || !citySchema.trim()}
                    className="w-full py-2 bg-charcoal hover:bg-charcoal/90 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add City to Registry
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-cream/20 border border-silver/50 rounded-3xl">
            <span className="text-xs font-black text-charcoal/50">
              {saveSuccess ? (
                <span className="flex items-center gap-1.5 text-primary">
                  <CheckCircle2 className="w-4 h-4" /> Company Saved
                  Successfully!
                </span>
              ) : (
                "Save modifications to return to the active registry."
              )}
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditingCompany(false);
                  setEditingCompanyId(null);
                  setCompName("");
                  setCompCode("");
                  setCompActive(true);
                  setCompCities([]);
                }}
                className="px-5 py-3.5 bg-silver/20 hover:bg-silver/30 border border-silver/40 text-charcoal text-xs font-black rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white hover:bg-primary/95 rounded-2xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving Company..." : "Save Company"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Company List Dashboard */
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="p-4 bg-white border border-silver/50 rounded-3xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-charcoal/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-semibold text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Add Company Action */}
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white hover:bg-primary/95 rounded-2xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Company
            </button>
          </div>

          {/* Data Load / Grid state */}
          {isFetchingCompanies ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs font-bold text-charcoal/40">
                Retrieving companies catalog...
              </span>
            </div>
          ) : (
            <>
              {/* Grid */}
              {(() => {
                const filtered = companies.filter(
                  (c) =>
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.code.toLowerCase().includes(searchQuery.toLowerCase()),
                );

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 bg-white border border-silver/50 rounded-3xl shadow-xs text-center space-y-3">
                      <div className="p-3 bg-silver/15 rounded-2xl text-charcoal/30 inline-block">
                        <Building2 className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-black text-charcoal">
                        No Companies Found
                      </h4>
                      <p className="text-xs text-charcoal/40 font-medium max-w-xs mx-auto leading-relaxed">
                        {searchQuery
                          ? "No companies matched your active search query. Try clearing the filter."
                          : "No companies are currently registered. Register a new company to get started."}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((company) => (
                      <div
                        key={company.id}
                        className="bg-white border border-silver/50 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-silver/80 transition-all group"
                      >
                        <div className="space-y-4">
                          {/* Title / Badge */}
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-charcoal leading-snug">
                                  {company.name}
                                </span>
                                <span className="px-2 py-0.5 bg-silver/20 border border-silver/30 rounded-lg text-[9px] font-black text-charcoal/60 uppercase">
                                  {company.code}
                                </span>
                              </div>
                              <span className="text-[10px] text-charcoal/40 font-semibold block">
                                ID: {company.id}
                              </span>
                            </div>

                            {/* Active Toggle Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${
                                company.is_active
                                  ? "bg-green-50 text-green-600 border border-green-155"
                                  : "bg-silver/30 text-charcoal/40 border border-silver/45"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  company.is_active
                                    ? "bg-green-600 animate-pulse"
                                    : "bg-charcoal/40"
                                }`}
                              />
                              {company.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          {/* Cities badges list */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider block">
                              Cities ({company.cities?.length || 0})
                            </span>
                            {company.cities && company.cities.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto animate-in fade-in duration-300">
                                {company.cities.map((city) => (
                                  <span
                                    key={city.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-silver/10 hover:bg-silver/25 text-charcoal text-[10px] font-extrabold rounded-lg border border-silver/30 transition-all"
                                  >
                                    <MapPin className="w-2.5 h-2.5 text-primary" />
                                    {city.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-charcoal/30 italic block">
                                No cities registered
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Create Company Modal */}
      <CreateCompanyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchCompanies}
      />
    </div>
  );
};
