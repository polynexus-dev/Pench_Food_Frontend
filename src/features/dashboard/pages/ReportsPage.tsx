import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Droplets,
  DollarSign,
  Truck,
  Users,
  Layers,
  Download,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Package,
} from "lucide-react";

// Mock data structures representing a realistic multi-tenant dairy network
const MOCK_FINANCIAL_DATA = {
  all: {
    '7d': [
      { date: "May 16", revenue: 145200, profit: 43560, orders: 480 },
      { date: "May 17", revenue: 151000, profit: 45300, orders: 495 },
      { date: "May 18", revenue: 139500, profit: 41850, orders: 460 },
      { date: "May 19", revenue: 162000, profit: 48600, orders: 520 },
      { date: "May 20", revenue: 158000, profit: 47400, orders: 510 },
      { date: "May 21", revenue: 165000, profit: 49500, orders: 535 },
      { date: "May 22", revenue: 172000, profit: 51600, orders: 550 },
    ],
    '30d': [
      { date: "Wk 1", revenue: 980000, profit: 294000, orders: 3100 },
      { date: "Wk 2", revenue: 1040000, profit: 312000, orders: 3300 },
      { date: "Wk 3", revenue: 1010000, profit: 303000, orders: 3200 },
      { date: "Wk 4", revenue: 1120000, profit: 336000, orders: 3500 },
    ],
  },
  pune: {
    '7d': [
      { date: "May 16", revenue: 85200, profit: 25560, orders: 280 },
      { date: "May 17", revenue: 91000, profit: 27300, orders: 295 },
      { date: "May 18", revenue: 79500, profit: 23850, orders: 260 },
      { date: "May 19", revenue: 98000, profit: 29400, orders: 310 },
      { date: "May 20", revenue: 94000, profit: 28200, orders: 300 },
      { date: "May 21", revenue: 99000, profit: 29700, orders: 315 },
      { date: "May 22", revenue: 105000, profit: 31500, orders: 330 },
    ],
    '30d': [
      { date: "Wk 1", revenue: 580000, profit: 174000, orders: 1800 },
      { date: "Wk 2", revenue: 640000, profit: 192000, orders: 2000 },
      { date: "Wk 3", revenue: 610000, profit: 183000, orders: 1900 },
      { date: "Wk 4", revenue: 720000, profit: 216000, orders: 2200 },
    ],
  },
  nagpur: {
    '7d': [
      { date: "May 16", revenue: 60000, profit: 18000, orders: 200 },
      { date: "May 17", revenue: 60000, profit: 18000, orders: 200 },
      { date: "May 18", revenue: 60000, profit: 18000, orders: 200 },
      { date: "May 19", revenue: 64000, profit: 19200, orders: 210 },
      { date: "May 20", revenue: 64000, profit: 19200, orders: 210 },
      { date: "May 21", revenue: 66000, profit: 19800, orders: 220 },
      { date: "May 22", revenue: 67000, profit: 20100, orders: 220 },
    ],
    '30d': [
      { date: "Wk 1", revenue: 400000, profit: 120000, orders: 1300 },
      { date: "Wk 2", revenue: 400000, profit: 120000, orders: 1300 },
      { date: "Wk 3", revenue: 400000, profit: 120000, orders: 1300 },
      { date: "Wk 4", revenue: 400000, profit: 120000, orders: 1300 },
    ],
  },
};

const MOCK_LOGISTICS_DATA = {
  all: {
    '7d': [
      { date: "May 16", volume: 4100, routes: 42, onTime: 96 },
      { date: "May 17", volume: 4250, routes: 45, onTime: 95 },
      { date: "May 18", volume: 3900, routes: 40, onTime: 98 },
      { date: "May 19", volume: 4400, routes: 48, onTime: 94 },
      { date: "May 20", volume: 4350, routes: 46, onTime: 97 },
      { date: "May 21", volume: 4500, routes: 48, onTime: 96 },
      { date: "May 22", volume: 4650, routes: 50, onTime: 95 },
    ],
    '30d': [
      { date: "Wk 1", volume: 28000, routes: 300, onTime: 95.8 },
      { date: "Wk 2", volume: 29500, routes: 310, onTime: 96.2 },
      { date: "Wk 3", volume: 28900, routes: 305, onTime: 95.5 },
      { date: "Wk 4", volume: 31200, routes: 330, onTime: 96.8 },
    ],
  },
  pune: {
    '7d': [
      { date: "May 16", volume: 2500, routes: 24, onTime: 95 },
      { date: "May 17", volume: 2600, routes: 26, onTime: 94 },
      { date: "May 18", volume: 2400, routes: 22, onTime: 98 },
      { date: "May 19", volume: 2700, routes: 28, onTime: 93 },
      { date: "May 20", volume: 2650, routes: 26, onTime: 96 },
      { date: "May 21", volume: 2750, routes: 28, onTime: 95 },
      { date: "May 22", volume: 2850, routes: 30, onTime: 94 },
    ],
    '30d': [
      { date: "Wk 1", volume: 17000, routes: 170, onTime: 95.2 },
      { date: "Wk 2", volume: 18200, routes: 180, onTime: 95.8 },
      { date: "Wk 3", volume: 17800, routes: 175, onTime: 94.9 },
      { date: "Wk 4", volume: 19500, routes: 190, onTime: 96.1 },
    ],
  },
  nagpur: {
    '7d': [
      { date: "May 16", volume: 1600, routes: 18, onTime: 98 },
      { date: "May 17", volume: 1650, routes: 19, onTime: 97 },
      { date: "May 18", volume: 1500, routes: 18, onTime: 98 },
      { date: "May 19", volume: 1700, routes: 20, onTime: 96 },
      { date: "May 20", volume: 1700, routes: 20, onTime: 98 },
      { date: "May 21", volume: 1750, routes: 20, onTime: 97 },
      { date: "May 22", volume: 1800, routes: 20, onTime: 97 },
    ],
    '30d': [
      { date: "Wk 1", volume: 11000, routes: 130, onTime: 97.4 },
      { date: "Wk 2", volume: 11300, routes: 130, onTime: 97.2 },
      { date: "Wk 3", volume: 11100, routes: 130, onTime: 97.5 },
      { date: "Wk 4", volume: 11700, routes: 140, onTime: 97.8 },
    ],
  },
};

const MOCK_SUBS_DATA = {
  all: {
    active: 1450,
    churned: 35,
    popular: [
      { name: "Full Cream Milk", shares: 45, liters: 25000 },
      { name: "Cow Milk", shares: 30, liters: 16600 },
      { name: "Paneer (Bulk)", shares: 15, liters: 8300 },
      { name: "Curd/Yogurt", shares: 10, liters: 5540 },
    ],
  },
  pune: {
    active: 920,
    churned: 22,
    popular: [
      { name: "Full Cream Milk", shares: 48, liters: 16800 },
      { name: "Cow Milk", shares: 28, liters: 9800 },
      { name: "Paneer (Bulk)", shares: 14, liters: 4900 },
      { name: "Curd/Yogurt", shares: 10, liters: 3500 },
    ],
  },
  nagpur: {
    active: 530,
    churned: 13,
    popular: [
      { name: "Full Cream Milk", shares: 40, liters: 8200 },
      { name: "Cow Milk", shares: 34, liters: 6800 },
      { name: "Paneer (Bulk)", shares: 16, liters: 3400 },
      { name: "Curd/Yogurt", shares: 10, liters: 2040 },
    ],
  },
};

const MOCK_INVENTORY_DATA = {
  all: {
    '7d': [
      { date: "May 16", stock: 5200, wastage: 85, damaged: 12 },
      { date: "May 17", stock: 5400, wastage: 90, damaged: 15 },
      { date: "May 18", stock: 5000, wastage: 75, damaged: 8 },
      { date: "May 19", stock: 5600, wastage: 95, damaged: 14 },
      { date: "May 20", stock: 5500, wastage: 80, damaged: 10 },
      { date: "May 21", stock: 5800, wastage: 82, damaged: 11 },
      { date: "May 22", stock: 6000, wastage: 60, damaged: 5 },
    ],
    '30d': [
      { date: "Wk 1", stock: 36000, wastage: 580, damaged: 82 },
      { date: "Wk 2", stock: 38200, wastage: 610, damaged: 90 },
      { date: "Wk 3", stock: 37500, wastage: 550, damaged: 75 },
      { date: "Wk 4", stock: 41000, wastage: 480, damaged: 50 },
    ],
  },
  pune: {
    '7d': [
      { date: "May 16", stock: 3200, wastage: 55, damaged: 8 },
      { date: "May 17", stock: 3300, wastage: 60, damaged: 10 },
      { date: "May 18", stock: 3100, wastage: 48, damaged: 5 },
      { date: "May 19", stock: 3500, wastage: 65, damaged: 9 },
      { date: "May 20", stock: 3400, wastage: 52, damaged: 6 },
      { date: "May 21", stock: 3600, wastage: 54, damaged: 7 },
      { date: "May 22", stock: 3800, wastage: 38, damaged: 3 },
    ],
    '30d': [
      { date: "Wk 1", stock: 22000, wastage: 370, damaged: 52 },
      { date: "Wk 2", stock: 23500, wastage: 390, damaged: 58 },
      { date: "Wk 3", stock: 23000, wastage: 350, damaged: 48 },
      { date: "Wk 4", stock: 25200, wastage: 300, damaged: 32 },
    ],
  },
  nagpur: {
    '7d': [
      { date: "May 16", stock: 2000, wastage: 30, damaged: 4 },
      { date: "May 17", stock: 2100, wastage: 30, damaged: 5 },
      { date: "May 18", stock: 1900, wastage: 27, damaged: 3 },
      { date: "May 19", stock: 2100, wastage: 30, damaged: 5 },
      { date: "May 20", stock: 2100, wastage: 28, damaged: 4 },
      { date: "May 21", stock: 2200, wastage: 28, damaged: 4 },
      { date: "May 22", stock: 2200, wastage: 22, damaged: 2 },
    ],
    '30d': [
      { date: "Wk 1", stock: 14000, wastage: 210, damaged: 30 },
      { date: "Wk 2", stock: 14700, wastage: 220, damaged: 32 },
      { date: "Wk 3", stock: 14500, wastage: 200, damaged: 27 },
      { date: "Wk 4", stock: 15800, wastage: 180, damaged: 18 },
    ],
  },
};

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"financials" | "logistics" | "subscriptions" | "inventory">("financials");
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [cityFilter, setCityFilter] = useState<"all" | "pune" | "nagpur">("all");
  
  // Interactive sorting state
  const [sortField, setSortField] = useState<string>("");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Hover chart state for customized interactive tooltips
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // simulated CSV export loader
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Get active datasets dynamically
  const activeFinancialData = useMemo(() => MOCK_FINANCIAL_DATA[cityFilter][timeRange], [cityFilter, timeRange]);
  const activeLogisticsData = useMemo(() => MOCK_LOGISTICS_DATA[cityFilter][timeRange], [cityFilter, timeRange]);
  const activeSubsData = useMemo(() => MOCK_SUBS_DATA[cityFilter], [cityFilter]);
  const activeInventoryData = useMemo(() => MOCK_INVENTORY_DATA[cityFilter][timeRange], [cityFilter, timeRange]);

  // Aggregate Metrics based on filters
  const metrics = useMemo(() => {
    if (activeTab === "financials") {
      const totalRev = activeFinancialData.reduce((acc, curr) => acc + curr.revenue, 0);
      const totalProf = activeFinancialData.reduce((acc, curr) => acc + curr.profit, 0);
      const totalOrds = activeFinancialData.reduce((acc, curr) => acc + curr.orders, 0);
      const avgOrder = totalOrds > 0 ? Math.round(totalRev / totalOrds) : 0;
      return [
        { label: "Total Revenue", value: `₹${totalRev.toLocaleString("en-IN")}`, change: "+8.4%", icon: DollarSign, color: "text-primary bg-primary/10 border-primary/20" },
        { label: "Net Margins", value: `₹${totalProf.toLocaleString("en-IN")}`, change: "+12.1%", icon: TrendingUp, color: "text-sage bg-sage/20 border-sage/30" },
        { label: "Orders Placed", value: totalOrds.toLocaleString(), change: "+5.2%", icon: Layers, color: "text-accent bg-accent/10 border-accent/20" },
        { label: "Avg. Ticket Size", value: `₹${avgOrder}`, change: "+3.0%", icon: Sparkles, color: "text-yellow-600 bg-yellow-50 border-yellow-100" },
      ];
    } else if (activeTab === "logistics") {
      const totalVol = activeLogisticsData.reduce((acc, curr) => acc + curr.volume, 0);
      const avgOnTime = (activeLogisticsData.reduce((acc, curr) => acc + curr.onTime, 0) / activeLogisticsData.length).toFixed(1);
      const totalRoutes = activeLogisticsData.reduce((acc, curr) => acc + curr.routes, 0);
      return [
        { label: "Volume Distributed", value: `${totalVol.toLocaleString()} L`, change: "+6.8%", icon: Droplets, color: "text-blue-600 bg-blue-50 border-blue-100" },
        { label: "On-Time Dispatch", value: `${avgOnTime}%`, change: "+1.2%", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { label: "Dispatched Routes", value: totalRoutes.toLocaleString(), change: "+4.5%", icon: Truck, color: "text-accent bg-accent/10 border-accent/20" },
        { label: "Active Drivers", value: cityFilter === 'all' ? "28" : cityFilter === 'pune' ? "18" : "10", change: "100% capacity", icon: Users, color: "text-purple-600 bg-purple-50 border-purple-100" },
      ];
    } else if (activeTab === "subscriptions") {
      const activeCount = activeSubsData.active;
      const churnRate = ((activeSubsData.churned / activeCount) * 100).toFixed(1);
      const popularItem = activeSubsData.popular[0].name;
      return [
        { label: "Active Subscriptions", value: activeCount.toLocaleString(), change: "+14.3%", icon: Users, color: "text-primary bg-primary/10 border-primary/20" },
        { label: "Churn Rate (MoM)", value: `${churnRate}%`, change: "-0.4%", icon: TrendingUp, color: "text-red-600 bg-red-50 border-red-100" },
        { label: "Retention Rate", value: `${(100 - parseFloat(churnRate)).toFixed(1)}%`, change: "Highly Stable", icon: CheckCircle2, color: "text-sage bg-sage/20 border-sage/30" },
        { label: "Anchor Product", value: popularItem.split(" ")[0] + " Milk", change: `${activeSubsData.popular[0].shares}% Share`, icon: Droplets, color: "text-blue-600 bg-blue-50 border-blue-100" },
      ];
    } else {
      const totalStock = activeInventoryData.reduce((acc, curr) => acc + curr.stock, 0);
      const totalWastage = activeInventoryData.reduce((acc, curr) => acc + curr.wastage, 0);
      const totalDamaged = activeInventoryData.reduce((acc, curr) => acc + curr.damaged, 0);
      const lossRatio = ((totalWastage / totalStock) * 100).toFixed(2);
      return [
        { label: "Stock Processed", value: `${totalStock.toLocaleString()} L`, change: "+9.2%", icon: Package, color: "text-orange-600 bg-orange-50 border-orange-100" },
        { label: "Transit Wastage", value: `${totalWastage.toLocaleString()} L`, change: "-12.5%", icon: Droplets, color: "text-red-500 bg-red-50 border-red-100" },
        { label: "Damaged Items", value: `${totalDamaged} units`, change: "-4.2%", icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-100" },
        { label: "Loss-to-Stock Ratio", value: `${lossRatio}%`, change: "Optimized", icon: Sparkles, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
      ];
    }
  }, [activeTab, activeFinancialData, activeLogisticsData, activeSubsData, activeInventoryData, cityFilter]);

  // Business Analyst AI Recommendations
  const analystInsights = useMemo(() => {
    const isPune = cityFilter === "pune";
    const isNagpur = cityFilter === "nagpur";

    if (activeTab === "financials") {
      return [
        {
          text: `Net revenues in ${cityFilter === 'all' ? 'the entire network' : cityFilter.toUpperCase()} grew by ${timeRange === '7d' ? '8.4%' : '11.2%'} this cycle, heavily supported by organic subscription orders.`,
          type: "success",
        },
        {
          text: isNagpur 
            ? "Nagpur margins are completely stable but volume has capped. Recommend cross-selling bulk Paneer to retail clients to increase average ticket size."
            : "Average Ticket Size is rising. Introducing premium A2 Buffalo Milk subscription tiers could capture another 4.8% of organic high-margin profits in Pune.",
          type: "info",
        },
        {
          text: "Invoice collections for bulk commercial accounts are experiencing a minor 3-day billing delay. Implement automated SMS invoice reminders to boost cash liquidity.",
          type: "warning",
        },
      ];
    } else if (activeTab === "logistics") {
      return [
        {
          text: "Overall On-Time Dispatch rate is maintaining a robust 95.8% efficiency score.",
          type: "success",
        },
        {
          text: isPune
            ? "Pune's delivery Route 14 is consistently experiencing morning traffic delays. Consider dividing Route 14 into two sub-routes to shave off 25 minutes of driver transit time."
            : "Nagpur delivery routes are maintaining a near-perfect 97.4% efficiency rating. Great work by local driver supervisors.",
          type: "info",
        },
        {
          text: "A 5% spikes in Friday delivery volumes is increasing fuel burn rates. Adjust driver schedules to dispatch 15 minutes earlier on Thursday nights to bypass Friday peak traffic.",
          type: "warning",
        },
      ];
    } else if (activeTab === "subscriptions") {
      return [
        {
          text: `Total Active subscribers grew to ${activeSubsData.active.toLocaleString()} active households, with a low churn rate under 2.5%.`,
          type: "success",
        },
        {
          text: `${activeSubsData.popular[0].name} continues to dominate sales with a ${activeSubsData.popular[0].shares}% subscription share.`,
          type: "info",
        },
        {
          text: "A minor cohort of subscribers who cancelled cited a desire for custom delivery frequencies. Launching 'Alternate Days' and 'Weekends Only' presets will improve user acquisition by 12%.",
          type: "info",
        },
      ];
    } else {
      return [
        {
          text: "Loss-to-stock ratio is remaining exceptionally low at sub-1.6% due to cold chain improvements.",
          type: "success",
        },
        {
          text: "Weather-forecast metrics suggest temperature spikes in Pune next week. Issue critical alerts to logistics drivers to double dry-ice levels on long-haul routes.",
          type: "warning",
        },
        {
          text: "Damaged containers on returns have dropped by 18% following the implementation of our new silicon-padded loading crates.",
          type: "success",
        },
      ];
    }
  }, [activeTab, cityFilter, timeRange, activeSubsData]);

  // Export report logic (simulating high-fidelity download generation)
  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      // Create detailed tabular CSV content based on active tab
      let csvContent = "data:text/csv;charset=utf-8,";
      
      if (activeTab === "financials") {
        csvContent += "Date,Revenue (INR),Net Profit (INR),Total Orders\n";
        activeFinancialData.forEach((row) => {
          csvContent += `${row.date},${row.revenue},${row.profit},${row.orders}\n`;
        });
      } else if (activeTab === "logistics") {
        csvContent += "Date,Milk Volume (Liters),Active Routes,On-Time Delivery Rate (%)\n";
        activeLogisticsData.forEach((row) => {
          csvContent += `${row.date},${row.volume},${row.routes},${row.onTime}\n`;
        });
      } else if (activeTab === "subscriptions") {
        csvContent += "Product Name,Subscription Share (%),Volume Sold (Liters)\n";
        activeSubsData.popular.forEach((row) => {
          csvContent += `${row.name},${row.shares},${row.liters}\n`;
        });
      } else {
        csvContent += "Date,Stock Processed (Liters),Transit Wastage (Liters),Damaged Units\n";
        activeInventoryData.forEach((row) => {
          csvContent += `${row.date},${row.stock},${row.wastage},${row.damaged}\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pench_${activeTab}_report_${cityFilter}_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 1200);
  };

  // Sorting handlers for detailed breakdown table
  const sortData = (data: any[]) => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  };

  const requestSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedTableData = useMemo(() => {
    if (activeTab === "financials") return sortData(activeFinancialData);
    if (activeTab === "logistics") return sortData(activeLogisticsData);
    if (activeTab === "subscriptions") return sortData(activeSubsData.popular);
    return sortData(activeInventoryData);
  }, [activeTab, activeFinancialData, activeLogisticsData, activeSubsData, activeInventoryData, sortField, sortAsc]);

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 280;
  const chartPadding = { top: 30, right: 30, bottom: 40, left: 70 };

  // Calculate coordinates for SVG charts dynamically
  const svgChartElements = useMemo(() => {
    const points: { x: number; y: number; val: number; raw: any }[] = [];
    let pathD = "";
    let areaD = "";
    let bars: { x: number; y: number; height: number; width: number; val: number; raw: any }[] = [];
    let pieSlices: { d: string; color: string; label: string; percentage: number; val: number }[] = [];

    const drawableWidth = chartWidth - chartPadding.left - chartPadding.right;
    const drawableHeight = chartHeight - chartPadding.top - chartPadding.bottom;

    if (activeTab === "financials") {
      const maxVal = Math.max(...activeFinancialData.map((d) => d.revenue)) * 1.15;
      const minVal = Math.min(...activeFinancialData.map((d) => d.revenue)) * 0.85;
      const range = maxVal - minVal;

      activeFinancialData.forEach((d, idx) => {
        const x = chartPadding.left + (idx / (activeFinancialData.length - 1)) * drawableWidth;
        const ratio = range > 0 ? (d.revenue - minVal) / range : 0.5;
        const y = chartPadding.top + drawableHeight - ratio * drawableHeight;
        points.push({ x, y, val: d.revenue, raw: d });
      });

      // Bezier curve calculations for sleek premium lines
      if (points.length > 0) {
        pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
          const cpX1 = points[i].x + drawableWidth / (points.length - 1) / 2;
          const cpY1 = points[i].y;
          const cpX2 = points[i + 1].x - drawableWidth / (points.length - 1) / 2;
          const cpY2 = points[i + 1].y;
          pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i + 1].x} ${points[i + 1].y}`;
        }
        areaD = `${pathD} L ${points[points.length - 1].x} ${chartPadding.top + drawableHeight} L ${points[0].x} ${chartPadding.top + drawableHeight} Z`;
      }
    } else if (activeTab === "logistics") {
      const maxVal = Math.max(...activeLogisticsData.map((d) => d.volume)) * 1.1;
      const barWidth = drawableWidth / activeLogisticsData.length * 0.6;
      const step = drawableWidth / activeLogisticsData.length;

      activeLogisticsData.forEach((d, idx) => {
        const x = chartPadding.left + idx * step + (step - barWidth) / 2;
        const height = (d.volume / maxVal) * drawableHeight;
        const y = chartPadding.top + drawableHeight - height;
        bars.push({ x, y, height, width: barWidth, val: d.volume, raw: d });
      });
    } else if (activeTab === "subscriptions") {
      // Donut Chart logic
      let currentAngle = -90; // Start at top
      const colors = ["#2B4C5F", "#82A3A1", "#F8C7A5", "#E86F68"];
      const radius = 90;
      const cx = chartWidth / 2;
      const cy = chartHeight / 2;

      activeSubsData.popular.forEach((p, idx) => {
        const angle = (p.shares / 100) * 360;
        const angleRad = (Math.PI * (currentAngle + angle / 2)) / 180;
        const x1 = cx + radius * Math.cos((Math.PI * currentAngle) / 180);
        const y1 = cy + radius * Math.sin((Math.PI * currentAngle) / 180);
        const x2 = cx + radius * Math.cos((Math.PI * (currentAngle + angle)) / 180);
        const y2 = cy + radius * Math.sin((Math.PI * (currentAngle + angle)) / 180);

        const largeArcFlag = angle > 180 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

        pieSlices.push({
          d,
          color: colors[idx % colors.length],
          label: p.name,
          percentage: p.shares,
          val: p.liters,
        });

        currentAngle += angle;
      });
    } else if (activeTab === "inventory") {
      const maxVal = Math.max(...activeInventoryData.map((d) => d.wastage)) * 1.2;
      activeInventoryData.forEach((d, idx) => {
        const x = chartPadding.left + (idx / (activeInventoryData.length - 1)) * drawableWidth;
        const y = chartPadding.top + drawableHeight - (d.wastage / maxVal) * drawableHeight;
        points.push({ x, y, val: d.wastage, raw: d });
      });

      if (points.length > 0) {
        pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
          const cpX1 = points[i].x + drawableWidth / (points.length - 1) / 2;
          const cpY1 = points[i].y;
          const cpX2 = points[i + 1].x - drawableWidth / (points.length - 1) / 2;
          const cpY2 = points[i + 1].y;
          pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i + 1].x} ${points[i + 1].y}`;
        }
        areaD = `${pathD} L ${points[points.length - 1].x} ${chartPadding.top + drawableHeight} L ${points[0].x} ${chartPadding.top + drawableHeight} Z`;
      }
    }

    return { points, pathD, areaD, bars, pieSlices };
  }, [activeTab, activeFinancialData, activeLogisticsData, activeSubsData, activeInventoryData]);

  // Handle Chart Area Hover for customized floating details
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Scale mouse coordinates from the scaled DOM rect to the native SVG viewBox coordinates (720x280)
    const scaleX = rect.width > 0 ? chartWidth / rect.width : 1;
    const xInSvgSpace = x * scaleX;

    const drawableWidth = chartWidth - chartPadding.left - chartPadding.right;
    const drawableLeft = chartPadding.left;

    if (activeTab === "financials" || activeTab === "inventory") {
      const dataLen = activeTab === "financials" ? activeFinancialData.length : activeInventoryData.length;
      const step = drawableWidth / (dataLen - 1);
      const relativeX = xInSvgSpace - drawableLeft;
      const index = Math.min(Math.max(Math.round(relativeX / step), 0), dataLen - 1);
      setHoverIndex(index);
    } else if (activeTab === "logistics") {
      const dataLen = activeLogisticsData.length;
      const step = drawableWidth / dataLen;
      const relativeX = xInSvgSpace - drawableLeft;
      const index = Math.min(Math.max(Math.floor(relativeX / step), 0), dataLen - 1);
      setHoverIndex(index);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="max-w-8xl mx-auto p-1 sm:p-6 bg-milk-white min-h-screen">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-charcoal flex items-center gap-2">
            <Layers className="w-8 h-8 text-primary" />
            Business Intelligence & Reports
          </h1>
          <p className="text-charcoal/60 mt-1">
            Real-time multi-tenant telemetry and analytical business intelligence at a single click.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-silver shadow-sm">
          {/* Time range */}
          <div className="flex items-center rounded-xl bg-silver/20 p-1 border border-silver/50">
            <button
              onClick={() => setTimeRange("7d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === "7d" ? "bg-white text-primary shadow-sm" : "text-charcoal/60 hover:text-charcoal"}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === "30d" ? "bg-white text-primary shadow-sm" : "text-charcoal/60 hover:text-charcoal"}`}
            >
              30 Days
            </button>
          </div>

          {/* City / Tenant Selector */}
          <div className="flex items-center gap-1.5 border-l border-silver/80 pl-3">
            <MapPin className="w-4 h-4 text-charcoal/40" />
            <select
              value={cityFilter}
              onChange={(e: any) => setCityFilter(e.target.value)}
              className="text-xs font-bold text-charcoal focus:outline-none bg-transparent cursor-pointer py-1 pr-4"
            >
              <option value="all">All Cities (Global)</option>
              <option value="pune">Pune Schema</option>
              <option value="nagpur">Nagpur Schema</option>
            </select>
          </div>

          {/* Export CSV button with simulated loader */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-75"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? "Generating CSV..." : "Export Report"}
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex overflow-x-auto gap-2 border-b border-silver mb-8 pb-px scrollbar-none">
        <button
          onClick={() => { setActiveTab("financials"); setSortField(""); }}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "financials" ? "border-primary text-primary" : "border-transparent text-charcoal/60 hover:text-charcoal hover:border-silver"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Financial Performance
        </button>
        <button
          onClick={() => { setActiveTab("logistics"); setSortField(""); }}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "logistics" ? "border-primary text-primary" : "border-transparent text-charcoal/60 hover:text-charcoal hover:border-silver"
          }`}
        >
          <Truck className="w-4 h-4" />
          Logistics & Deliveries
        </button>
        <button
          onClick={() => { setActiveTab("subscriptions"); setSortField(""); }}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "subscriptions" ? "border-primary text-primary" : "border-transparent text-charcoal/60 hover:text-charcoal hover:border-silver"
          }`}
        >
          <Users className="w-4 h-4" />
          Customer Subscriptions
        </button>
        <button
          onClick={() => { setActiveTab("inventory"); setSortField(""); }}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "inventory" ? "border-primary text-primary" : "border-transparent text-charcoal/60 hover:text-charcoal hover:border-silver"
          }`}
        >
          <Package className="w-4 h-4" />
          Inventory & Wastage
        </button>
      </div>

      {/* Key Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fadeIn">
        {metrics.map((metric, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-silver shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl border ${metric.color}`}>
                <metric.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${metric.change.startsWith("-") ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                {metric.change}
              </span>
            </div>
            <h3 className="text-charcoal/50 text-xs font-bold uppercase tracking-wider">{metric.label}</h3>
            <p className="text-3xl font-extrabold text-charcoal mt-1 tracking-tight">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Interactive Charts & AI Analyst Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* SVG Interactive Chart Display */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-silver shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-extrabold text-charcoal text-lg">
                {activeTab === "financials" && "Revenue Trends"}
                {activeTab === "logistics" && "Daily Volume Deliveries"}
                {activeTab === "subscriptions" && "Product Subscription Share"}
                {activeTab === "inventory" && "Transit Wastage Insights"}
              </h2>
              <p className="text-xs text-charcoal/50">
                {activeTab === "financials" && "Daily and weekly revenue variations"}
                {activeTab === "logistics" && "Dispatched milk liters across city routes"}
                {activeTab === "subscriptions" && "Market share and distribution per product variant"}
                {activeTab === "inventory" && "Transit temperature-leak wastage volume"}
              </p>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              {cityFilter.toUpperCase()} • {timeRange.toUpperCase()}
            </span>
          </div>

          {/* Interactive Chart Workspace */}
          <div className="relative flex justify-center w-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Defs for Premium styling gradients */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2B4C5F" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2B4C5F" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E86F68" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#E86F68" stopOpacity="0.0" />
                </linearGradient>
                <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2B4C5F" floodOpacity="0.08" />
                </filter>
              </defs>

              {/* Grid Lines for layout guidance */}
              {activeTab !== "subscriptions" && (
                <>
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = chartPadding.top + ratio * (chartHeight - chartPadding.top - chartPadding.bottom);
                    return (
                      <line
                        key={i}
                        x1={chartPadding.left}
                        y1={y}
                        x2={chartWidth - chartPadding.right}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                    );
                  })}
                </>
              )}

              {/* Renders Tab-Specific Chart Types */}
              {activeTab === "financials" && (
                <>
                  {/* Fill Area Under Bezier Curve */}
                  <path d={svgChartElements.areaD} fill="url(#chartGradient)" />
                  {/* Glowing Bezier Curve Stroke */}
                  <path
                    d={svgChartElements.pathD}
                    fill="none"
                    stroke="#2B4C5F"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter="url(#shadow)"
                  />
                  {/* Interactive Circles on vertices */}
                  {svgChartElements.points.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r={hoverIndex === idx ? "7" : "4.5"}
                      fill={hoverIndex === idx ? "#2B4C5F" : "#FFFFFF"}
                      stroke="#2B4C5F"
                      strokeWidth="2.5"
                      className="transition-all duration-150"
                    />
                  ))}
                </>
              )}

              {activeTab === "logistics" && (
                <>
                  {/* Multi-Colored Round-capped Bar charts */}
                  {svgChartElements.bars.map((bar, idx) => (
                    <g key={idx}>
                      <rect
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={bar.height}
                        rx="5"
                        fill={hoverIndex === idx ? "#2B4C5F" : "#82A3A1"}
                        className="transition-all duration-200"
                        opacity={hoverIndex !== null && hoverIndex !== idx ? 0.6 : 1}
                      />
                    </g>
                  ))}
                </>
              )}

              {activeTab === "subscriptions" && (
                <>
                  {/* Pie / Donut interactive segments */}
                  {svgChartElements.pieSlices.map((slice, idx) => (
                    <path
                      key={idx}
                      d={slice.d}
                      fill={slice.color}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="transition-all duration-300 hover:scale-[1.03] origin-center cursor-pointer"
                      style={{ transformOrigin: "50% 50%" }}
                    />
                  ))}
                  {/* Inner Cutout to create satisfying Donut Look */}
                  <circle cx={chartWidth / 2} cy={chartHeight / 2} r="50" fill="#FFFFFF" />
                  <text
                    x={chartWidth / 2}
                    y={chartHeight / 2 + 5}
                    textAnchor="middle"
                    className="font-extrabold text-charcoal text-sm"
                  >
                    Subs
                  </text>
                </>
              )}

              {activeTab === "inventory" && (
                <>
                  <path d={svgChartElements.areaD} fill="url(#wasteGradient)" />
                  <path
                    d={svgChartElements.pathD}
                    fill="none"
                    stroke="#E86F68"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {svgChartElements.points.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r={hoverIndex === idx ? "7" : "4.5"}
                      fill={hoverIndex === idx ? "#E86F68" : "#FFFFFF"}
                      stroke="#E86F68"
                      strokeWidth="2.5"
                      className="transition-all duration-150"
                    />
                  ))}
                </>
              )}

              {/* X & Y Axis labels */}
              {activeTab !== "subscriptions" && (
                <>
                  {/* X Axis ticks */}
                  {((activeTab === "financials" || activeTab === "inventory")
                    ? svgChartElements.points
                    : svgChartElements.bars
                  ).map((item: any, idx) => {
                    const dateVal = activeTab === "financials" || activeTab === "inventory"
                      ? item.raw.date
                      : item.raw.date;
                    return (
                      <text
                        key={idx}
                        x={item.x + (activeTab === "logistics" ? item.width / 2 : 0)}
                        y={chartHeight - 15}
                        textAnchor="middle"
                        className="text-[10px] font-bold text-charcoal/40"
                      >
                        {dateVal}
                      </text>
                    );
                  })}
                  {/* Y Axis helper values */}
                  <text
                    x={chartPadding.left - 15}
                    y={chartPadding.top + 5}
                    textAnchor="end"
                    className="text-[9px] font-bold text-charcoal/30"
                  >
                    {activeTab === "financials" ? "Max" : "High"}
                  </text>
                  <text
                    x={chartPadding.left - 15}
                    y={chartHeight - chartPadding.bottom}
                    textAnchor="end"
                    className="text-[9px] font-bold text-charcoal/30"
                  >
                    Min
                  </text>
                </>
              )}

              {/* Vertical Dashed Hover Tracker */}
              {hoverIndex !== null && activeTab !== "subscriptions" && (
                <line
                  x1={
                    activeTab === "logistics"
                      ? svgChartElements.bars[hoverIndex].x + svgChartElements.bars[hoverIndex].width / 2
                      : svgChartElements.points[hoverIndex].x
                  }
                  y1={chartPadding.top}
                  x2={
                    activeTab === "logistics"
                      ? svgChartElements.bars[hoverIndex].x + svgChartElements.bars[hoverIndex].width / 2
                      : svgChartElements.points[hoverIndex].x
                  }
                  y2={chartHeight - chartPadding.bottom}
                  stroke="#A0AEC0"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}
            </svg>

            {/* Float Tooltip triggered on mouse movement */}
            {hoverIndex !== null && activeTab !== "subscriptions" && (
              <div
                className="absolute bg-charcoal text-white text-[11px] p-3 rounded-xl shadow-xl pointer-events-none z-30 transition-all border border-white/10"
                style={{
                  left: `${mousePos.x - 60}px`,
                  top: `${mousePos.y - 85}px`,
                }}
              >
                <p className="font-bold border-b border-white/20 pb-1 mb-1 text-center">
                  {activeTab === "financials" && activeFinancialData[hoverIndex].date}
                  {activeTab === "logistics" && activeLogisticsData[hoverIndex].date}
                  {activeTab === "inventory" && activeInventoryData[hoverIndex].date}
                </p>
                <p className="flex justify-between gap-4">
                  <span>
                    {activeTab === "financials" && "Revenue:"}
                    {activeTab === "logistics" && "Milk Volume:"}
                    {activeTab === "inventory" && "Wastage Volume:"}
                  </span>
                  <span className="font-extrabold text-primary-light">
                    {activeTab === "financials" && `₹${activeFinancialData[hoverIndex].revenue.toLocaleString("en-IN")}`}
                    {activeTab === "logistics" && `${activeLogisticsData[hoverIndex].volume.toLocaleString()} L`}
                    {activeTab === "inventory" && `${activeInventoryData[hoverIndex].wastage} L`}
                  </span>
                </p>
                {activeTab === "financials" && (
                  <p className="flex justify-between gap-4 mt-0.5">
                    <span>Orders:</span>
                    <span className="font-bold">{activeFinancialData[hoverIndex].orders}</span>
                  </p>
                )}
                {activeTab === "logistics" && (
                  <p className="flex justify-between gap-4 mt-0.5">
                    <span>On-time Rate:</span>
                    <span className="font-bold">{activeLogisticsData[hoverIndex].onTime}%</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Business Analyst Insights Panel */}
        <div className="bg-gradient-to-br from-primary to-primary-light text-white p-6 rounded-3xl border border-primary/20 shadow-xl shadow-primary/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-white/10 border border-white/20 animate-pulse">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <h2 className="font-extrabold text-lg tracking-tight">AI Business Analyst</h2>
            </div>
            <p className="text-xs text-white/70 mb-6">
              Automated telemetry-driven recommendations based on deep data analysis.
            </p>

            {/* Smart insights list */}
            <div className="space-y-4">
              {analystInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3 hover:bg-white/10 transition-colors"
                >
                  <div className="mt-0.5">
                    {insight.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                    {insight.type === "info" && <Sparkles className="w-4 h-4 text-yellow-200" />}
                    {insight.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-300" />}
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed text-white/90">
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
              Telemetry engine active
            </span>
          </div>
        </div>
      </div>

      {/* Tab-Specific Detailed Breakdown Table */}
      <div className="bg-white rounded-3xl border border-silver shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-silver flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-charcoal">Detailed Report Matrix</h3>
            <p className="text-xs text-charcoal/50">Sort and analyze specific transaction telemetry logs below.</p>
          </div>
          <span className="text-[10px] font-bold text-charcoal/40 bg-silver/20 border border-silver/30 px-3 py-1 rounded-xl uppercase">
            Click columns to toggle sort order
          </span>
        </div>

        {/* Tabular Renders */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-silver/10 text-[10px] uppercase tracking-wider text-charcoal/50 font-bold border-b border-silver">
              {activeTab === "financials" && (
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("date")}>
                    Date {sortField === "date" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("revenue")}>
                    Gross Revenue (INR) {sortField === "revenue" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("profit")}>
                    Net Profit (INR) {sortField === "profit" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("orders")}>
                    Total Orders {sortField === "orders" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4">Financial Status</th>
                </tr>
              )}

              {activeTab === "logistics" && (
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("date")}>
                    Date {sortField === "date" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("volume")}>
                    Volume (Liters) {sortField === "volume" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("routes")}>
                    Routes Ran {sortField === "routes" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("onTime")}>
                    On-Time Rate (%) {sortField === "onTime" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4">Delivery Status</th>
                </tr>
              )}

              {activeTab === "subscriptions" && (
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("name")}>
                    Milk / Dairy Variant {sortField === "name" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("shares")}>
                    Subscription Share (%) {sortField === "shares" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("liters")}>
                    Volume Distributed (Liters) {sortField === "liters" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4">Variant Popularity</th>
                </tr>
              )}

              {activeTab === "inventory" && (
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("date")}>
                    Date {sortField === "date" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("stock")}>
                    Stock Processed {sortField === "stock" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("wastage")}>
                    Wastage Loss (Liters) {sortField === "wastage" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort("damaged")}>
                    Damaged Crates {sortField === "damaged" && (sortAsc ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th className="px-6 py-4">Wastage Alert</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-silver text-xs">
              {sortedTableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-milk-white/40 transition-all">
                  {activeTab === "financials" && (
                    <>
                      <td className="px-6 py-4 font-bold text-charcoal">{row.date}</td>
                      <td className="px-6 py-4 font-semibold">₹{row.revenue.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-sage font-bold">₹{row.profit.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 font-semibold text-charcoal/80">{row.orders}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                          Profitable
                        </span>
                      </td>
                    </>
                  )}

                  {activeTab === "logistics" && (
                    <>
                      <td className="px-6 py-4 font-bold text-charcoal">{row.date}</td>
                      <td className="px-6 py-4 font-semibold">{row.volume.toLocaleString()} L</td>
                      <td className="px-6 py-4 font-semibold text-charcoal/80">{row.routes} routes</td>
                      <td className="px-6 py-4 font-bold text-primary">{row.onTime}%</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.onTime >= 95 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-yellow-50 text-yellow-600 border border-yellow-100"}`}>
                          {row.onTime >= 95 ? "Excellent" : "Stable"}
                        </span>
                      </td>
                    </>
                  )}

                  {activeTab === "subscriptions" && (
                    <>
                      <td className="px-6 py-4 font-bold text-primary">{row.name}</td>
                      <td className="px-6 py-4 font-semibold">{row.shares}% share</td>
                      <td className="px-6 py-4 font-bold text-charcoal">{row.liters.toLocaleString()} Liters</td>
                      <td className="px-6 py-4">
                        <div className="w-24 bg-silver/30 rounded-full h-2 border border-silver/50 overflow-hidden">
                          <div
                            className={`h-full ${idx === 0 ? "bg-primary" : idx === 1 ? "bg-sage" : idx === 2 ? "bg-accent" : "bg-red-400"}`}
                            style={{ width: `${row.shares}%` }}
                          />
                        </div>
                      </td>
                    </>
                  )}

                  {activeTab === "inventory" && (
                    <>
                      <td className="px-6 py-4 font-bold text-charcoal">{row.date}</td>
                      <td className="px-6 py-4 font-semibold">{row.stock.toLocaleString()} L</td>
                      <td className="px-6 py-4 font-semibold text-red-500">{row.wastage} Liters</td>
                      <td className="px-6 py-4 font-semibold text-charcoal/80">{row.damaged} units</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.wastage < 85 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                          {row.wastage < 85 ? "Low Loss" : "Review Required"}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
