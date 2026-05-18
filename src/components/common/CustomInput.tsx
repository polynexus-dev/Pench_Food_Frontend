import type { InputHTMLAttributes } from 'react';

interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: any;
  inputClassName?: string;
}

export const CustomInput = ({ 
  label, 
  icon: Icon, 
  inputClassName = '', 
  ...props 
}: CustomInputProps) => {
  return (
    <div className="space-y-2 w-full">
      <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors z-10" />
        <input 
          {...props}
          className={`w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-semibold ${inputClassName}`}
        />
      </div>
    </div>
  );
};
