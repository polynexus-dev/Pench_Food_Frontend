import React from "react";
import { logo } from "../../assets/images";

interface LogoSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
}

export const LogoSpinner: React.FC<LogoSpinnerProps> = ({
  size = "md",
  label,
  className = "",
}) => {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className={`absolute inset-[#-4px] rounded-full bg-[#004d3d]/15 animate-ping`} />
        
        {/* Rotating Pench Foods Logo */}
        <img
          src={logo}
          alt="Loading Pench Foods..."
          className={`${sizeClasses} object-contain animate-spin drop-shadow-md select-none pointer-events-none`}
          style={{ animationDuration: "1.8s" }}
        />
      </div>
      {label && (
        <span className="text-xs font-extrabold text-[#004d3d] tracking-wider animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};

export default LogoSpinner;
