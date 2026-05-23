import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Globe,
  MapPin,
  Loader2,
  FileUp,
} from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import { CustomInput } from "../../../components/common/CustomInput";
import type { City } from "./types";

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  city: City | null;
}

const EditTenantModal: React.FC<EditTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  city,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    state: "",
  });
  const [boundaryFile, setBoundaryFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (city) {
      setFormData({
        name: city.name,
        state: city.state || "",
      });
      setBoundaryFile(null);
      setError(null);
    }
  }, [city, isOpen]);

  if (!isOpen || !city) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBoundaryFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("state", formData.state);
      if (boundaryFile) {
        data.append("boundary_file", boundaryFile);
      }

      await axiosInstance.patch(`/erp/tenants/cities/${city.id}/`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.boundary_file ||
          "Failed to update city. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-primary to-sage text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none">
                Update City Instance
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-white/70 mt-1 font-bold">
                Modify City Settings & Geofence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Read-Only Identity Row */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-silver/10 rounded-2xl border border-silver/30 text-xs">
              <div>
                <span className="text-[9px] font-black uppercase text-charcoal/40 block">Schema Name</span>
                <span className="font-mono font-bold text-primary">{city.schema_name}</span>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-charcoal/40 block">City Code</span>
                <span className="font-mono font-bold text-charcoal">{city.code}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput
                label="City Name"
                icon={MapPin}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g. Nagpur"
                inputClassName="text-charcoal font-semibold"
              />

              <CustomInput
                label="State"
                icon={Globe}
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                placeholder="e.g. Maharashtra"
                inputClassName="text-charcoal font-semibold"
              />
            </div>

            <div className="space-y-2 w-full">
              <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">
                Upload New Boundary File (Optional)
              </label>
              <div className="relative group">
                <FileUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors z-10" />
                <input
                  type="file"
                  name="boundary_file"
                  onChange={handleFileChange}
                  accept=".geojson,.kml,.zip"
                  className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-semibold text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-charcoal/40 font-semibold px-1">
                Supported formats: .geojson, .kml, or a zipped shapefile. This will override the existing city boundary.
              </p>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-silver/20 text-charcoal font-bold rounded-2xl hover:bg-silver/30 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTenantModal;
