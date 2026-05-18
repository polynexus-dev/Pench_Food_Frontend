import { useState, useEffect } from 'react';
import { X, User, Phone, Lock, Loader2, UserPlus, Truck, MapPin, Weight, Mail } from 'lucide-react';
import axiosInstance from '../../../api/axiosInstance';
import { useAuthStore } from '../../../store/useAuthStore';
import { CustomInput } from '../../../components/common/CustomInput';
import { CustomSelect } from '../../../components/common/CustomSelect';

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateDriverModal: React.FC<CreateDriverModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const currentTenant = useAuthStore(state => state.tenant);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Drivers',
    tenant_schema: currentTenant || '',
    vehicle_plate: '',
    vehicle_type: '',
    max_capacity_kg: '',
    zone: ''
  });
  const [zones, setZones] = useState<any[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchZones = async () => {
        try {
          setIsLoadingZones(true);
          const response = await axiosInstance.get('/ems/zones/');
          setZones(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
          console.error("Failed to fetch zones", error);
        } finally {
          setIsLoadingZones(false);
        }
      };
      fetchZones();
    }
  }, [isOpen]);

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
      const payload = {
        ...formData,
        max_capacity_kg: Number(formData.max_capacity_kg) || 0
      };
      // The payload is expected as an array based on the user's request
      await axiosInstance.post('/accounts/register/', [payload]);
      onSuccess();
      onClose();
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        role: 'Drivers',
        tenant_schema: currentTenant || '',
        vehicle_plate: '',
        vehicle_type: '',
        max_capacity_kg: '',
        zone: ''
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
            <CustomInput
              label="Username"
              icon={User}
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="driver_name"
              inputClassName="font-mono"
            />

            <CustomInput
              label="Phone Number"
              icon={Phone}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder="9010276379"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput
              label="First Name"
              icon={User}
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              placeholder="First Name"
            />

            <CustomInput
              label="Last Name"
              icon={User}
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
              placeholder="Last Name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput
              label="Email"
              icon={Mail}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="driver@example.com"
            />

            <CustomInput
              label="Password"
              icon={Lock}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomInput
              label="Vehicle Plate"
              icon={Truck}
              type="text"
              name="vehicle_plate"
              value={formData.vehicle_plate}
              onChange={handleInputChange}
              required
              placeholder="e.g. MH-31-AZ-1234"
              inputClassName="uppercase"
            />

            <CustomSelect
              label="Vehicle Type"
              icon={Truck}
              value={formData.vehicle_type}
              onChange={(val) => setFormData(prev => ({ ...prev, vehicle_type: val }))}
              placeholder="Select Type"
              options={[
                { label: "Mini Van", value: "Mini Van" },
                { label: "Truck", value: "Truck" },
                { label: "Bike", value: "Bike" },
                { label: "Pickup", value: "Pickup" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomSelect
              label="Zone"
              icon={MapPin}
              value={formData.zone}
              onChange={(val) => setFormData(prev => ({ ...prev, zone: val }))}
              placeholder={isLoadingZones ? "Loading zones..." : "Select Zone"}
              options={zones.map(z => ({ label: z.name, value: z.id }))}
            />

            <CustomInput
              label="Max Capacity (kg)"
              icon={Weight}
              type="number"
              name="max_capacity_kg"
              value={formData.max_capacity_kg}
              onChange={handleInputChange}
              required
              min="0"
              placeholder="e.g. 500"
            />
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
