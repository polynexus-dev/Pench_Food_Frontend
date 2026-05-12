
import { 
  Droplets,
  TrendingUp,
  Truck,
  Package,
  ChevronRight
} from 'lucide-react';

const OverviewPage = () => {
  const stats = [
    { title: 'Milk Volume', value: '4,250L', change: '+12%', icon: Droplets, color: 'text-primary' },
    { title: 'Daily Revenue', value: '₹1,45,200', change: '+5.4%', icon: TrendingUp, color: 'text-sage' },
    { title: 'Active Deliveries', value: '48', change: '8 pending', icon: Truck, color: 'text-accent' },
    { title: 'Inventory Status', value: 'Normal', change: '12 items low', icon: Package, color: 'text-charcoal' },
  ];

  const recentDeliveries = [
    { id: '#DEL-9842', customer: 'Fresh Bakes Bakery', item: 'Full Cream Milk', amount: '200L', status: 'Delivered', time: '10:30 AM' },
    { id: '#DEL-9843', customer: 'City Supermarket', item: 'Pasteurized Milk', amount: '500L', status: 'In Transit', time: '11:15 AM' },
    { id: '#DEL-9844', customer: 'Health Zone Gym', item: 'Skimmed Milk', amount: '50L', status: 'Pending', time: '12:00 PM' },
    { id: '#DEL-9845', customer: 'Morning Cafeteria', item: 'Paneer (Bulk)', amount: '15kg', status: 'Delivered', time: '09:45 AM' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal">Distributor Overview</h1>
        <p className="text-charcoal/60">Welcome back! Here's what's happening today across your distribution network.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-silver hover:shadow-md transition-shadow">
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
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Deliveries Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-silver overflow-hidden">
          <div className="p-6 border-b border-silver flex justify-between items-center">
            <h3 className="font-bold text-charcoal">Recent Deliveries</h3>
            <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
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
                {recentDeliveries.map((delivery, i) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Stock */}
        <div className="space-y-6">
          <div className="bg-cream p-6 rounded-2xl border border-accent/30">
            <h3 className="font-bold text-charcoal mb-4">Stock Highlights</h3>
            <div className="space-y-4">
              <StockItem label="Full Cream" level={92} color="bg-primary" />
              <StockItem label="Skimmed Milk" level={45} color="bg-accent" />
              <StockItem label="Paneer" level={78} color="bg-sage" />
              <StockItem label="Curd / Yogurt" level={23} color="bg-red-400" />
            </div>
            <button className="w-full mt-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
              Create Restock Order
            </button>
          </div>
        </div>
      </div>
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
