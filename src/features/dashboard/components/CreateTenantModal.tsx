import React, { useState } from 'react';
import { X, Building2, Globe, MapPin, Loader2 } from 'lucide-react';
import axiosInstance from '../../../api/axiosInstance';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTenantModal: React.FC<CreateTenantModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    schema_name: '',
    state: '',
    code: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate schema name and code if user is typing city name
    if (name === 'name') {
      const sanitized = value.toLowerCase().replace(/\s+/g, '');
      const shortCode = value.substring(0, 3).toUpperCase();
      setFormData(prev => ({
        ...prev,
        name: value,
        schema_name: sanitized,
        code: value.length >= 3 ? shortCode : prev.code
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await axiosInstance.post('/erp/tenants/cities/', formData);
      onSuccess();
      onClose();
      setFormData({ name: '', schema_name: '', state: '', code: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create tenant. Please try again.');
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
              <h2 className="text-xl font-bold leading-none">Register New City</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/70 mt-1 font-bold">Multi-Tenant Instance</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* City Name */}
              <div className="space-y-2">
                <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">City Name</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Nagpur"
                    className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-charcoal font-semibold"
                  />
                </div>
              </div>

              {/* State */}
              <div className="space-y-2">
                <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">State</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Maharashtra"
                    className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-charcoal font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Schema Name */}
              <div className="space-y-2">
                <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">Schema Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    name="schema_name"
                    value={formData.schema_name}
                    onChange={handleInputChange}
                    required
                    placeholder="nagpur"
                    className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-charcoal font-mono text-sm"
                  />
                </div>
              </div>

              {/* City Code */}
              <div className="space-y-2">
                <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">City Code</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="NGP"
                    maxLength={3}
                    className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none text-charcoal font-mono font-bold text-sm uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-silver/20 text-charcoal font-bold rounded-2xl hover:bg-silver/30 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Provisioning...
                </>
              ) : (
                'Create Instance'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTenantModal;
