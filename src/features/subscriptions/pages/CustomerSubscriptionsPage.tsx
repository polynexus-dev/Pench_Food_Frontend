import React, { useState } from "react";
import {
  Calendar,
  Sparkles,
  Play,
  Pause,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Minus,
  Trash2,
  Edit2,
} from "lucide-react";

const CustomerSubscriptionsPage = () => {
  const [plans, setPlans] = useState([
    { id: 1, name: "Full Cream Fresh Milk", quantity: "2 Liters", frequency: "Daily", status: "Active", price: "₹130/day" },
    { id: 2, name: "Organic Cow Ghee", quantity: "1 Jar", frequency: "Weekly (Sundays)", status: "Paused", price: "₹650/jar" },
  ]);

  const togglePlan = (id: number) => {
    setPlans(plans.map(p => p.id === id ? { ...p, status: p.status === "Active" ? "Paused" : "Active" } : p));
  };

  // Add Subscription state
  const [addingPlan, setAddingPlan] = useState(false);
  const [addName, setAddName] = useState("");
  const [addQuantity, setAddQuantity] = useState("");
  const [addFrequency, setAddFrequency] = useState("Daily");
  const [addPrice, setAddPrice] = useState("");

  // Edit Subscription state
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editFrequency, setEditFrequency] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan = {
      id: Date.now(),
      name: addName,
      quantity: addQuantity,
      frequency: addFrequency,
      status: "Active",
      price: addPrice.startsWith("₹") ? addPrice : `₹${addPrice}`
    };
    setPlans([...plans, newPlan]);
    setAddingPlan(false);
    setAddName("");
    setAddQuantity("");
    setAddFrequency("Daily");
    setAddPrice("");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setPlans(plans.map(p => p.id === editingPlan.id ? {
      ...p,
      name: editName,
      quantity: editQuantity,
      frequency: editFrequency,
      price: editPrice.startsWith("₹") ? editPrice : `₹${editPrice}`
    } : p));
    setEditingPlan(null);
  };

  const handleDeletePlan = (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this subscription plan?")) {
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  // Overrides list tracking: stores custom quantities for specific dates
  const [overrides, setOverrides] = useState<Array<{ day: number; month: number; year: number; quantity: string }>>([
    { day: 25, month: 4, year: 2026, quantity: "4 Liters" } // Mock override for May 25, 2026
  ]);

  const [selectedOverrideDay, setSelectedOverrideDay] = useState<number | null>(null);
  const [tempQty, setTempQty] = useState(3);

  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // starts in May 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const blankBoxes = Array.from({ length: firstDayOfMonth });
  const dayBoxes = Array.from({ length: daysInMonth });

  return (
    <div className="p-8 space-y-8 bg-milk-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-silver/50 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-3xl font-extrabold text-charcoal tracking-tight flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" />
            My Subscriptions
          </h1>
          <p className="text-charcoal/60 mt-1 text-sm">
            Control your recurring deliveries, pause/resume item plans, and monitor scheduled drop calendars.
          </p>
        </div>
        <button
          onClick={() => {
            setAddingPlan(true);
            setAddName("");
            setAddQuantity("");
            setAddFrequency("Daily");
            setAddPrice("");
          }}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white hover:bg-primary/95 active:scale-[0.98] rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm z-10"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Active Plans Control */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm lg:col-span-2 space-y-6">
          <div className="border-b border-silver/30 pb-4">
            <h2 className="text-xl font-bold text-charcoal tracking-tight">Active Recurring Plans</h2>
            <p className="text-xs text-charcoal/60 mt-1">Manage delivery flags and quantity structures.</p>
          </div>

          <div className="space-y-4">
            {plans.map((plan) => {
              const isActive = plan.status === "Active";
              return (
                <div
                  key={plan.id}
                  className={`p-5 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    isActive ? "bg-white border-primary/20 shadow-sm" : "bg-silver/10 border-silver/50 opacity-80"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${isActive ? "bg-primary/5 text-primary" : "bg-charcoal/5 text-charcoal/40"}`}>
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-charcoal text-base">{plan.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {plan.status}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal/60 mt-1">
                        Quantity: <span className="font-bold text-charcoal">{plan.quantity}</span> | Frequency: <span className="font-bold text-charcoal">{plan.frequency}</span>
                      </p>
                      <p className="text-xs font-black text-primary mt-1">{plan.price}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePlan(plan.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                        isActive 
                          ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" 
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          Resume
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setEditName(plan.name);
                        setEditQuantity(plan.quantity);
                        setEditFrequency(plan.frequency);
                        setEditPrice(plan.price);
                      }}
                      className="p-2.5 bg-silver/10 hover:bg-silver/20 text-charcoal/60 hover:text-charcoal rounded-xl transition-all cursor-pointer border border-transparent hover:border-silver/40"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Delivery Calendar Grid */}
        <div className="bg-white p-6 rounded-3xl border border-silver/50 shadow-sm space-y-6">
          <div className="border-b border-silver/30 pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Delivery Calendar
              </h2>
              <p className="text-xs text-charcoal/60 mt-1">{monthNames[month]} {year} Drop Schedule</p>
            </div>
            <div className="flex items-center gap-1 bg-silver/10 border border-silver/30 p-1.5 rounded-xl shrink-0">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-white rounded-lg text-charcoal transition-all cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-white rounded-lg text-charcoal transition-all cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-charcoal/40 uppercase tracking-wider mb-2">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>

          {/* Simple Grid Calendar representation */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty boxes for padding */}
            {blankBoxes.map((_, idx) => (
              <div key={`blank-${idx}`} className="py-2.5 bg-transparent"></div>
            ))}
            {/* Days 1 - Max Days */}
            {dayBoxes.map((_, index) => {
              const day = index + 1;
              let bg = "bg-silver/5 text-charcoal/40";
              let title = "Scheduled";

              // Mock logic for status distribution: let's base it on actual past/present month ranges
              const isMay2026 = year === 2026 && month === 4;
              const isFutureDay = !isMay2026 || day >= 22;

              // Check if there is a custom volume override for this day
              const activeOverride = overrides.find(
                (o) => o.day === day && o.month === month && o.year === year
              );

              if (activeOverride) {
                bg = "bg-amber-500/20 text-amber-800 font-extrabold border-2 border-amber-500 hover:bg-amber-500/30 cursor-pointer shadow-xs";
                title = `Custom quantity overridden to: ${activeOverride.quantity}`;
              } else if (isMay2026) {
                if (day < 18) {
                  bg = "bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/20";
                  title = "Delivered";
                } else if (day === 18) {
                  bg = "bg-rose-500/10 text-rose-700 font-bold border border-rose-500/20";
                  title = "Not At Home";
                } else if (day > 18 && day < 22) {
                  bg = "bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/20";
                  title = "Delivered";
                } else if (day >= 22) {
                  bg = "bg-primary/5 text-primary font-bold border border-primary/20 hover:bg-primary/10 cursor-pointer";
                  title = "Next Delivery";
                }
              } else if (year < 2026 || (year === 2026 && month < 4)) {
                // All historical months are marked as fully delivered!
                bg = "bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/20";
                title = "Delivered";
              } else {
                // All future months are scheduled!
                bg = "bg-primary/5 text-primary font-bold border border-primary/20 hover:bg-primary/10 cursor-pointer";
                title = "Next Delivery";
              }

              return (
                <div
                  key={day}
                  title={title}
                  onClick={() => {
                    if (isFutureDay) {
                      setSelectedOverrideDay(day);
                      if (activeOverride) {
                        setTempQty(parseInt(activeOverride.quantity) || 3);
                      } else {
                        setTempQty(3);
                      }
                    }
                  }}
                  className={`py-2 text-xs rounded-lg flex flex-col items-center justify-center transition-all ${bg}`}
                >
                  <span>{day}</span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 mt-4 border-t border-silver/30 pt-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/20 block" />
              <span className="text-charcoal/60">Delivered Drops</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3.5 h-3.5 rounded bg-rose-500/10 border border-rose-500/20 block" />
              <span className="text-charcoal/60">Failed Delivery Attempts</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3.5 h-3.5 rounded bg-primary/5 border border-primary/20 block" />
              <span className="text-charcoal/60">Upcoming scheduled Drops</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border-2 border-amber-500 block" />
              <span className="text-charcoal/60">Single-day Overridden Quantity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Single-Day Quantity Override Modal */}
      {selectedOverrideDay !== null && (() => {
        const activeOverride = overrides.find(
          (o) => o.day === selectedOverrideDay && o.month === month && o.year === year
        );

        const handleSaveOverride = () => {
          const freshOverride = {
            day: selectedOverrideDay,
            month,
            year,
            quantity: `${tempQty} Liters`,
          };
          // filter out old and append new
          setOverrides([
            ...overrides.filter(
              (o) => !(o.day === selectedOverrideDay && o.month === month && o.year === year)
            ),
            freshOverride,
          ]);
          setSelectedOverrideDay(null);
        };

        const handleRemoveOverride = () => {
          setOverrides(
            overrides.filter(
              (o) => !(o.day === selectedOverrideDay && o.month === month && o.year === year)
            )
          );
          setSelectedOverrideDay(null);
        };

        return (
          <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl border border-silver/50 shadow-2xl p-6 relative animate-in zoom-in-95 duration-250">
              <button
                onClick={() => setSelectedOverrideDay(null)}
                className="absolute right-4 top-4 p-2 text-charcoal/40 hover:text-charcoal hover:bg-silver/10 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-silver/30 pb-4 mb-6">
                <h3 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Single-Day Override
                </h3>
                <p className="text-xs text-charcoal/60 mt-1">
                  Adjust drop volume specifically for {monthNames[month]} {selectedOverrideDay}, {year}.
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-charcoal/60">Base subscription:</span>
                  <span className="text-xs font-black text-charcoal">2 Liters Daily</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider block text-center">
                    Override Volume
                  </label>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setTempQty(Math.max(1, tempQty - 1))}
                      className="w-12 h-12 bg-silver/10 border border-silver/30 hover:bg-silver/20 rounded-full flex items-center justify-center text-charcoal transition-all cursor-pointer"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-3xl font-black text-charcoal min-w-[70px] text-center">
                      {tempQty} L
                    </span>
                    <button
                      onClick={() => setTempQty(tempQty + 1)}
                      className="w-12 h-12 bg-silver/10 border border-silver/30 hover:bg-silver/20 rounded-full flex items-center justify-center text-charcoal transition-all cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    onClick={handleSaveOverride}
                    className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/15"
                  >
                    Confirm Single-Day Override
                  </button>

                  {activeOverride && (
                    <button
                      onClick={handleRemoveOverride}
                      className="w-full bg-rose-500/10 text-rose-600 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-rose-500/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Restore Standard Quantity
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Subscription Modal */}
      {addingPlan && (
        <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl border border-silver/50 shadow-2xl p-6 relative animate-in zoom-in-95 duration-250">
            <button
              onClick={() => setAddingPlan(false)}
              className="absolute right-4 top-4 p-2 text-charcoal/40 hover:text-charcoal hover:bg-silver/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-silver/30 pb-4 mb-6">
              <h3 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Add New Subscription
              </h3>
              <p className="text-xs text-charcoal/60 mt-1">
                Configure your new recurring delivery plan parameters.
              </p>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Cow Milk"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                    Quantity
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2 Liters, 1 Jar"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                    Price/Unit Price
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹65/day, ₹650/jar"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                  Frequency
                </label>
                <select
                  value={addFrequency}
                  onChange={(e) => setAddFrequency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs font-semibold"
                >
                  <option value="Daily">Daily</option>
                  <option value="Alternate Days">Alternate Days</option>
                  <option value="Weekly (Sundays)">Weekly (Sundays)</option>
                  <option value="Weekly (Saturdays)">Weekly (Saturdays)</option>
                  <option value="Mon - Fri (Weekdays)">Mon - Fri (Weekdays)</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/15"
                >
                  Create Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl border border-silver/50 shadow-2xl p-6 relative animate-in zoom-in-95 duration-250">
            <button
              onClick={() => setEditingPlan(null)}
              className="absolute right-4 top-4 p-2 text-charcoal/40 hover:text-charcoal hover:bg-silver/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-silver/30 pb-4 mb-6">
              <h3 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Edit Subscription Plan
              </h3>
              <p className="text-xs text-charcoal/60 mt-1">
                Modify recurring parameters for {editingPlan.name}.
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Product name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                    Quantity
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Quantity"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                    Price/Unit Price
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Price details"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-charcoal/50 uppercase tracking-wider block">
                  Frequency
                </label>
                <select
                  value={editFrequency}
                  onChange={(e) => setEditFrequency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-silver/50 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none text-charcoal font-bold text-xs font-semibold"
                >
                  <option value="Daily">Daily</option>
                  <option value="Alternate Days">Alternate Days</option>
                  <option value="Weekly (Sundays)">Weekly (Sundays)</option>
                  <option value="Weekly (Saturdays)">Weekly (Saturdays)</option>
                  <option value="Mon - Fri (Weekdays)">Mon - Fri (Weekdays)</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center hover:bg-primary/95 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/15"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSubscriptionsPage;
