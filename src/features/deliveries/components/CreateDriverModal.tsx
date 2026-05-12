import { useState } from 'react';
import { X, User, Phone, Lock, Loader2, UserPlus } from 'lucide-react';
import axiosInstance from '../../../api/axiosInstance';
import { useAuthStore } from '../../../store/useAuthStore';

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateDriverModal: React.FC<CreateDriverModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const currentTenant = useAuthStore(state => state.tenant);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone: '',
    first_name: '',
    last_name: '',
    role: 'Drivers',
    tenant_schema: currentTenant || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // The payload is expected as an array based on the user's request
      await axiosInstance.post('/accounts/register/', [formData]);
      onSuccess();
      onClose();
      setFormData({
        username: '',
        password: '',
        phone: '',
        first_name: '',
        last_name: '',
        role: 'Drivers',
        tenant_schema: currentTenant || ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.[0]?.message || 'Failed to register driver. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-primary to-sage text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl text-white">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none">Register New Driver</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/70 mt-1 font-bold">Fleet Expansion for {currentTenant?.toUpperCase()}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">First Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Ramesh"
                  className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">Last Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Patil"
                  className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  placeholder="driver_nagpur_10"
                  className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="917000000010"
                    className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
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
                  Registering...
                </>
              ) : (
                'Create Driver Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDriverModal;
