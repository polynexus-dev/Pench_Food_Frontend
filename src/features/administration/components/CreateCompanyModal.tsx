import React, { useState } from 'react';
import { X, Building2, Shield, Loader2 } from 'lucide-react';
import { companyApi } from '../../../api/companyApi';
import { CustomInput } from '../../../components/common/CustomInput';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Company Name and Code are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await companyApi.createCompany(name.trim(), code.trim());
      setName('');
      setCode('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create company:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Failed to create company. Please try again.'
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
              <h2 className="text-xl font-bold leading-none">Register New Company</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/70 mt-1 font-bold">Enterprise Registry</p>
            </div>
          </div>
          <button 
            type="button"
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
            <CustomInput
              label="Company Name"
              icon={Building2}
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Aniket Corp"
              inputClassName="text-charcoal font-semibold"
            />

            <CustomInput
              label="Company Code (Short Code)"
              icon={Shield}
              type="text"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="e.g. ANI"
              inputClassName="text-charcoal font-mono font-bold uppercase"
            />
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
              className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Company'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompanyModal;
