import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Package,
  Users,
  ClipboardList,
  Droplets,
  Building2,
  Navigation,
  ShoppingCart,
} from "lucide-react";

const Sidebar = () => {
  return (
    <aside className="w-72 bg-gradient-to-b from-[#1a2e21] to-[#0a140d] text-white hidden md:flex flex-col h-full shrink-0 shadow-2xl relative z-30">
      <div className="p-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20 rotate-3 group-hover:rotate-0 transition-transform">
          <Droplets className="text-primary w-7 h-7" />
        </div>
        <div>
          <span className="text-2xl font-black tracking-tighter block leading-none">
            PENCH
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold opacity-80">
            Dairy ERP
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" end />
        <SidebarItem icon={Building2} label="Tenants" to="/tenants" />
        <SidebarItem icon={Truck} label="Logistics & Route" to="/deliveries" />
        <SidebarItem
          icon={Navigation}
          label="Live Tracking"
          to="/tracking"
          pulse
        />
        <SidebarItem icon={Package} label="Inventory" to="/inventory" />
        <SidebarItem icon={ShoppingCart} label="Orders" to="/orders" />
        <SidebarItem icon={Users} label="Customers" to="/customers" />
        <SidebarItem icon={ClipboardList} label="Reports" to="/reports" />
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-gradient-to-br from-white/10 to-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <p className="text-[10px] text-accent uppercase tracking-widest mb-2 font-bold">
            Logistics Goal
          </p>
          <div className="flex justify-between items-end mb-2">
            <span className="text-2xl font-black">
              85<span className="text-sm font-normal opacity-60">%</span>
            </span>
            <span className="text-[10px] opacity-50 font-medium pb-1">
              Target: 30k L
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-accent to-sage h-full rounded-full shadow-[0_0_10px_rgba(240,192,86,0.3)]"
              style={{ width: "85%" }}
            ></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const SidebarItem = ({
  icon: Icon,
  label,
  to,
  end = false,
  pulse = false,
}: {
  icon: any;
  label: string;
  to: string;
  end?: boolean;
  pulse?: boolean;
}) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `
      flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group
      ${
        isActive
          ? "bg-accent text-primary font-bold shadow-[0_10px_20px_rgba(240,192,86,0.2)] scale-[1.02]"
          : "text-white/60 hover:bg-white/5 hover:text-white hover:pl-6"
      }
    `}
  >
    {({ isActive }) => (
      <>
        <div className="flex items-center gap-3">
          <Icon
            className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-primary" : "text-accent/60 group-hover:text-accent"}`}
          />
          <span className="text-[13px] font-semibold tracking-wide">
            {label}
          </span>
        </div>
        {pulse && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </>
    )}
  </NavLink>
);

export default Sidebar;
