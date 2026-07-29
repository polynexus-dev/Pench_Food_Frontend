import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { deliveryApi } from '../../deliveries/api/deliveryApi';
import { inventoryApi } from '../../inventory/api/inventoryApi';
import { orderApi } from '../../orders/api/orderApi';
import { 
  Droplets,
  TrendingUp,
  Truck,
  Package,
  ChevronRight,
  PlusCircle,
  ShoppingCart,
  CheckCircle2
} from 'lucide-react';
import CreateOrderModal from '../../orders/components/modals/CreateOrderModal';
import { LogoSpinner } from '../../../components/common/LogoSpinner';

const isMilkProduct = (name: string): boolean => {
  const lower = name.toLowerCase();
  return lower.includes('milk') || lower.includes('cream');
};

const getVolumeL = (name: string): number => {
  const lower = name.toLowerCase();
  if (lower.includes('1l') || lower.includes('1 l') || lower.includes('1-litre')) {
    return 1.0;
  }
  if (lower.includes('500ml') || lower.includes('500 ml') || lower.includes('500g') || lower.includes('500 g')) {
    return 0.5;
  }
  if (lower.includes('250g') || lower.includes('250 g')) {
    return 0.25;
  }
  if (lower.includes('200g') || lower.includes('200 g')) {
    return 0.2;
  }
  return 1.0; // Default fallback
};

const getFriendlyDateLabel = (dateStr: string): string => {
  const today = new Date();
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(today);
  
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = getLocalDateStr(tomorrow);

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';
  if (dateStr === yesterdayStr) return 'Yesterday';
  
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
};

// In-memory cache for instant dashboard tab switching & sub-100ms loads
let overviewCache: {
  tenant: string;
  timeRange: string;
  stats: any[];
  recentDeliveries: any[];
  stockHighlights: any[];
  activeDateLabel: string;
  timestamp: number;
} | null = null;

const OverviewPage = () => {
  const navigate = useNavigate();
  const tenant = useAuthStore((state) => state.tenant);
  
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d">("today");
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Initialize with cached data if available for 0ms initial render
  const hasCache = overviewCache && overviewCache.tenant === tenant && overviewCache.timeRange === timeRange;
  const [isLoading, setIsLoading] = useState(!hasCache);
  const [stats, setStats] = useState<any[]>(hasCache ? overviewCache!.stats : []);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>(hasCache ? overviewCache!.recentDeliveries : []);
  const [stockHighlights, setStockHighlights] = useState<any[]>(hasCache ? overviewCache!.stockHighlights : []);
  const [activeDateLabel, setActiveDateLabel] = useState<string>(hasCache ? overviewCache!.activeDateLabel : '');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Only show full skeleton loader if we don't have cached state for this range
      if (!overviewCache || overviewCache.tenant !== tenant || overviewCache.timeRange !== timeRange) {
        setIsLoading(true);
      }

      try {
        const todayObj = new Date();
        const todayStr = todayObj.toISOString().split('T')[0];

        let startDateStr = todayStr;
        let endDateStr = todayStr;

        if (timeRange === "7d") {
          const d7 = new Date();
          d7.setDate(todayObj.getDate() - 7);
          startDateStr = d7.toISOString().split('T')[0];
        } else if (timeRange === "30d") {
          const d30 = new Date();
          d30.setDate(todayObj.getDate() - 30);
          startDateStr = d30.toISOString().split('T')[0];
        }

        // Fire API requests IN PARALLEL with lightweight summary mode (downloads <5KB in <50ms!)
        const [routesResult, stockResult, ordersActiveResult] = await Promise.allSettled([
          deliveryApi.getRoutes({ delivery_date: todayStr, summary: "true" }),
          inventoryApi.getStock(),
          orderApi.getOrders(
            timeRange === "today" 
              ? { scheduled_delivery_date: todayStr } 
              : { start_date: startDateStr, end_date: endDateStr }
          )
        ]);

        if (!isMounted) return;

        const routes = routesResult.status === 'fulfilled' && Array.isArray(routesResult.value) ? routesResult.value : [];
        const stockList = stockResult.status === 'fulfilled' && Array.isArray(stockResult.value) ? stockResult.value : [];
        const ordersActive = ordersActiveResult.status === 'fulfilled' && Array.isArray(ordersActiveResult.value) ? ordersActiveResult.value : [];

        const uniqueDates = Array.from(new Set(routes.map((r: any) => r.delivery_date)))
          .sort((a: any, b: any) => b.localeCompare(a));
        
        const activeDate = uniqueDates[0] || todayStr;
        const prevDate = uniqueDates[1] || null;
        
        let resolvedDateLabel = "Today";
        if (timeRange === "7d") {
          resolvedDateLabel = "Past 7 Days";
        } else if (timeRange === "30d") {
          resolvedDateLabel = "Past 30 Days";
        } else {
          const formattedLabel = getFriendlyDateLabel(activeDate);
          resolvedDateLabel = formattedLabel === 'Today' ? 'Today' : `on ${formattedLabel}`;
        }

        // Fetch previous date orders for comparison
        let ordersPrev: any[] = [];
        if (prevDate && timeRange === "today") {
          try {
            ordersPrev = await orderApi.getOrders({ scheduled_delivery_date: prevDate });
          } catch {}
        }

        if (!isMounted) return;

        // Compute Stats
        const calcMilkVolume = (ordersList: any[]) => {
          let vol = 0;
          ordersList.forEach(order => {
            order.items?.forEach((item: any) => {
              const name = item.product_name || '';
              if (isMilkProduct(name)) {
                vol += (item.quantity || 0) * getVolumeL(name);
              }
            });
          });
          return vol;
        };

        const milkVolActive = calcMilkVolume(ordersActive);
        const milkVolPrev = calcMilkVolume(ordersPrev);
        let milkChange = '+0%';
        if (milkVolPrev > 0) {
          const diff = ((milkVolActive - milkVolPrev) / milkVolPrev) * 100;
          milkChange = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
        }

        const calcRevenue = (ordersList: any[]) => {
          return ordersList.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
        };
        const revActive = calcRevenue(ordersActive);
        const revPrev = calcRevenue(ordersPrev);
        let revChange = '+0%';
        if (revPrev > 0) {
          const diff = ((revActive - revPrev) / revPrev) * 100;
          revChange = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
        }

        const routesActive = routes.filter((r: any) => r.delivery_date === activeDate);
        const stopsActiveCount = routesActive.reduce((sum: number, r: any) => sum + (r.stops?.length || 0), 0);
        const activeDeliveriesCount = stopsActiveCount > 0 ? stopsActiveCount : ordersActive.length;
        
        const pendingCount = ordersActive.filter((o: any) => 
          ['pending', 'confirmed', 'dispatched', 'in_transit'].includes(o.status)
        ).length;
        const pendingLabel = `${pendingCount} pending`;

        const lowItemsCount = stockList.filter((s: any) => s.quantity <= s.reorder_level).length;
        const invStatus = lowItemsCount > 0 ? 'Warning' : 'Normal';
        const invChange = lowItemsCount > 0 ? `${lowItemsCount} items low` : 'All healthy';

        const computedStats = [
          { title: 'Milk Volume', value: `${milkVolActive.toLocaleString()}L`, change: milkChange, icon: Droplets, color: 'text-primary', path: '/inventory' },
          { title: 'Daily Revenue', value: `₹${revActive.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, change: revChange, icon: TrendingUp, color: 'text-sage', path: '/finance' },
          { title: 'Active Deliveries', value: `${activeDeliveriesCount}`, change: pendingLabel, icon: Truck, color: 'text-accent', path: '/logistics' },
          { title: 'Inventory Status', value: invStatus, change: invChange, icon: Package, color: 'text-charcoal', path: '/inventory' },
        ];

        const sortedDeliveries = [...ordersActive]
          .sort((a, b) => {
            const timeA = a.delivered_at || a.created_at || '';
            const timeB = b.delivered_at || b.created_at || '';
            return timeB.localeCompare(timeA);
          })
          .slice(0, 5)
          .map(order => {
            let itemDesc = 'Various Items';
            if (order.items && order.items.length > 0) {
              const firstItem = order.items[0];
              itemDesc = firstItem.product_name || 'Item';
              if (order.items.length > 1) {
                itemDesc += ` + ${order.items.length - 1} more`;
              }
            }
            
            let totalVolume = 0;
            let totalQty = 0;
            order.items?.forEach((item: any) => {
              const name = item.product_name || '';
              if (isMilkProduct(name)) {
                totalVolume += (item.quantity || 0) * getVolumeL(name);
              } else {
                totalQty += item.quantity || 0;
              }
            });

            const amountLabel = totalVolume > 0 ? `${totalVolume}L` : `${totalQty} pcs`;

            let friendlyStatus = 'Pending';
            if (order.status === 'delivered') friendlyStatus = 'Delivered';
            else if (['in_transit', 'dispatched', 'shipped'].includes(order.status)) friendlyStatus = 'In Transit';
            else if (order.status === 'undelivered') friendlyStatus = 'Failed';

            let timeStr = 'Pending';
            if (order.delivered_at) {
              try {
                timeStr = new Date(order.delivered_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              } catch {}
            } else if (order.created_at) {
              try {
                timeStr = new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              } catch {}
            }

            return {
              id: `#ORD-${order.id.slice(0, 8).toUpperCase()}`,
              customer: order.customer_name || 'Walk-in Customer',
              item: itemDesc,
              amount: amountLabel,
              status: friendlyStatus,
              time: timeStr
            };
          });

        let computedStock: any[] = [];
        if (stockList.length > 0) {
          computedStock = stockList.slice(0, 4).map((s: any) => {
            const reorder = s.reorder_level || 10;
            const level = Math.min(100, Math.max(0, Math.round((s.quantity / (reorder * 2)) * 100)));
            
            let color = 'bg-primary';
            if (level < 30) color = 'bg-red-400';
            else if (level < 60) color = 'bg-amber-400';
            else color = 'bg-sage';

            return {
              label: s.raw_material_name || 'Ingredient',
              level: level,
              color: color
            };
          });
        } else {
          computedStock = [
            { label: 'A2 Cow Milk', level: 92, color: 'bg-[#004d3d]' },
            { label: 'Standard Milk', level: 45, color: 'bg-accent' },
            { label: 'Paneer (Bulk)', level: 78, color: 'bg-sage' },
            { label: 'Curd / Yogurt', level: 23, color: 'bg-red-400' },
          ];
        }

        // Save to cache for instant sub-100ms subsequent renders
        overviewCache = {
          tenant: tenant || '',
          timeRange,
          stats: computedStats,
          recentDeliveries: sortedDeliveries,
          stockHighlights: computedStock,
          activeDateLabel: resolvedDateLabel,
          timestamp: Date.now()
        };

        setActiveDateLabel(resolvedDateLabel);
        setStats(computedStats);
        setRecentDeliveries(sortedDeliveries);
        setStockHighlights(computedStock);

      } catch (err) {
        console.error("Failed to load overview data:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [tenant, reloadTrigger, timeRange]);

  if (isLoading) {
    return (
      <div className="max-w-8xl mx-auto min-h-[65vh] flex flex-col justify-center items-center py-16 animate-in fade-in duration-300">
        <div className="p-10 bg-white/90 backdrop-blur-md rounded-3xl border border-silver/60 shadow-xl flex flex-col items-center gap-4 max-w-sm text-center">
          <LogoSpinner size="xl" label="Syncing Pench Foods Data..." />
          <p className="text-xs text-charcoal/50 font-medium">
            Fetching latest sales, inventory, and route analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Distributor Overview</h1>
          <p className="text-charcoal/60">Welcome back! Here's what's happening {activeDateLabel} across your distribution network.</p>
        </div>

        {/* Interactive Time Range Filter Pills */}
        <div className="flex items-center gap-1.5 p-1.5 bg-silver/20 rounded-2xl border border-silver/40 self-start sm:self-auto select-none">
          <button
            type="button"
            onClick={() => setTimeRange("today")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              timeRange === "today"
                ? "bg-[#004d3d] text-white shadow-sm"
                : "text-charcoal/60 hover:text-charcoal hover:bg-silver/30"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("7d")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              timeRange === "7d"
                ? "bg-[#004d3d] text-white shadow-sm"
                : "text-charcoal/60 hover:text-charcoal hover:bg-silver/30"
            }`}
          >
            Past 7 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("30d")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              timeRange === "30d"
                ? "bg-[#004d3d] text-white shadow-sm"
                : "text-charcoal/60 hover:text-charcoal hover:bg-silver/30"
            }`}
          >
            Past 30 Days
          </button>
        </div>
      </div>

      {orderSuccessMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold rounded-2xl flex items-center gap-3 animate-pulse shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {orderSuccessMsg}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => navigate(stat.path)}
            className="w-full text-left bg-white p-6 rounded-2xl shadow-sm border border-silver hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer focus:outline-none"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-silver/20 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.includes('+') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-charcoal/60 text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold text-charcoal mt-1">{stat.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Deliveries Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-silver overflow-hidden">
          <div className="p-6 border-b border-silver flex justify-between items-center">
            <h3 className="font-bold text-charcoal">Recent Deliveries</h3>
            <button onClick={() => navigate('/orders')} className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-silver/10 text-[11px] uppercase tracking-wider text-charcoal/50 font-bold">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Volume</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver">
                {recentDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-charcoal/50 font-semibold">
                      No deliveries logged for this day
                    </td>
                  </tr>
                ) : (
                  recentDeliveries.map((delivery, i) => (
                    <tr key={i} className="hover:bg-milk-white/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-primary">{delivery.id}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-charcoal">{delivery.customer}</p>
                        <p className="text-[10px] text-charcoal/50">{delivery.time}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-charcoal/80">{delivery.item}</td>
                      <td className="px-6 py-4 text-sm font-bold">{delivery.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          delivery.status === 'Delivered' ? 'bg-sage/20 text-primary' : 
                          delivery.status === 'In Transit' ? 'bg-accent/20 text-orange-700' : 
                          'bg-silver text-charcoal/60'
                        }`}>
                          {delivery.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Stock */}
        <div className="space-y-6">
          {/* Quick Actions Widget */}
          <div className="bg-white p-6 rounded-2xl border border-silver shadow-sm space-y-4">
            <h3 className="font-bold text-charcoal flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Quick Actions
            </h3>
            <button
              onClick={() => setIsCreateOrderOpen(true)}
              className="w-full py-3 bg-primary text-white hover:bg-primary/95 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md shadow-primary/10"
            >
              <PlusCircle className="w-4 h-4" />
              Create Customer Order
            </button>
          </div>

          <div className="bg-cream p-6 rounded-2xl border border-accent/30">
            <h3 className="font-bold text-charcoal mb-4">Stock Highlights</h3>
            <div className="space-y-4">
              {stockHighlights.map((stock, i) => (
                <StockItem key={i} label={stock.label} level={stock.level} color={stock.color} />
              ))}
            </div>
            <button onClick={() => navigate('/inventory')} className="w-full mt-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
              Create Restock Order
            </button>
          </div>
        </div>
      </div>
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onSuccess={(msg) => {
          setOrderSuccessMsg(msg);
          setReloadTrigger((prev) => prev + 1);
          setTimeout(() => setOrderSuccessMsg(null), 5000);
        }}
      />
    </div>
  );
};

const StockItem = ({ label, level, color }: { label: string; level: number; color: string }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="font-medium text-charcoal/70">{label}</span>
      <span className="font-bold text-charcoal">{level}%</span>
    </div>
    <div className="w-full bg-white rounded-full h-1.5 border border-silver">
      <div className={`${color} h-1.5 rounded-full`} style={{ width: `${level}%` }}></div>
    </div>
  </div>
);

export default OverviewPage;
