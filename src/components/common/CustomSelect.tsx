import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  label: string;
  icon: any;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}

export const CustomSelect = ({ 
  label,
  icon: Icon, 
  value, 
  onChange, 
  options, 
  placeholder 
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className="space-y-2 w-full">
      <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors z-10" />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full pl-11 pr-10 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-semibold text-left flex items-center justify-between"
        >
          <span className={value ? "text-charcoal" : "text-gray-400"}>{selectedLabel}</span>
        </button>
        <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 transition-transform pointer-events-none ${isOpen ? 'rotate-180' : ''}`} />
        
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-silver/30 rounded-2xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-48 overflow-y-auto py-2">
                {options.length > 0 ? options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary/5 hover:text-primary ${value === opt.value ? 'bg-primary/10 text-primary' : 'text-charcoal/70'}`}
                  >
                    {opt.label}
                  </button>
                )) : (
                  <div className="px-4 py-2 text-sm text-charcoal/40 text-center font-semibold">No options available</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
