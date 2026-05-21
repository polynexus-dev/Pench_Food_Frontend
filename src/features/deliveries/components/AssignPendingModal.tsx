import React, { useState } from 'react';
import { X, Calendar, Loader2, CheckCircle2, AlertTriangle, Info, MapPin } from 'lucide-react';
import { deliveryApi } from '../api/deliveryApi';
import { CustomInput } from '../../../components/common/CustomInput';
import type { Route } from './types';

interface AssignPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ResultData {
  date: string;
  total_zones_processed: number;
  created_routes: Route[];
  errors: {
    zone_id: string;
    zone_name: string;
    error: string;
  }[];
}

const AssignPendingModal: React.FC<AssignPendingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [date, setDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await deliveryApi.assignPendingOrders(date);
      setResult(response);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.detail || 
        'Failed to assign pending orders. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    onSuccess();
    onClose();
    // Reset state
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 my-auto overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-primary to-sage text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl text-white">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none">Bulk-Assign Pending Orders</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/70 mt-1 font-bold">
                Zone-based optimization & routing
              </p>
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
        <div className="p-8">
          {error && (
            <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-charcoal/70 font-semibold leading-relaxed">
                  This will retrieve all <strong>pending</strong> and <strong>confirmed</strong> orders for the selected date. 
                  It groups them by customer zones and assigns them to the primary driver of each zone.
                </p>
              </div>

              <CustomInput
                label="Delivery Date"
                icon={Calendar}
                type="date"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />

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
                      Optimizing & Assigning...
                    </>
                  ) : (
                    'Assign & Create Routes'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Success Banner */}
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-emerald-800">Assignment Process Complete</h4>
                  <p className="text-xs text-emerald-700/80 font-bold mt-1">
                    Processed date: {result.date}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-silver/10 rounded-2xl border border-silver/30">
                  <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">
                    Zones Processed
                  </span>
                  <span className="text-2xl font-black text-charcoal mt-1 block">
                    {result.total_zones_processed}
                  </span>
                </div>
                <div className="p-4 bg-silver/10 rounded-2xl border border-silver/30">
                  <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-wider block">
                    Routes Generated
                  </span>
                  <span className="text-2xl font-black text-charcoal mt-1 block">
                    {result.created_routes.length}
                  </span>
                </div>
              </div>

              {/* Created Routes List */}
              {result.created_routes.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-black text-charcoal/50 uppercase tracking-wider ml-1">
                    Generated Routes
                  </h5>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar border border-silver/30 rounded-2xl divide-y divide-silver/30">
                    {result.created_routes.map((route) => (
                      <div key={route.id} className="p-3 bg-white flex justify-between items-center">
                        <div>
                          <span className="text-xs font-black text-charcoal block">{route.name}</span>
                          <span className="text-[10px] text-charcoal/50 font-bold block mt-0.5">
                            Driver: {route.driver_name || 'Unassigned'}
                          </span>
                        </div>
                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                          {route.stops?.length || 0} stops
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors List */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-black text-charcoal/50 uppercase tracking-wider ml-1 flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Unassigned Zones / Warnings ({result.errors.length})
                  </h5>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar border border-amber-100 bg-amber-50/30 rounded-2xl divide-y divide-amber-100">
                    {result.errors.map((err, i) => (
                      <div key={i} className="p-3 flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-black text-amber-800 block">
                            Zone: {err.zone_name || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-amber-700/80 font-semibold block mt-0.5 leading-relaxed">
                            {err.error}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={handleDone}
                className="w-full py-4 bg-charcoal text-white font-bold rounded-2xl hover:bg-charcoal/90 transition-all shadow-lg"
              >
                Close & Refresh View
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignPendingModal;
