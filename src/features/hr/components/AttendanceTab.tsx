import React, { useState } from "react";
import { Clock, CheckCircle2, XCircle, Truck, RefreshCw } from "lucide-react";
import { hrApi } from "../api/hrApi";
import type { Attendance } from "./types";

const fmtTime = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const AttendanceTab: React.FC<{
  attendance: Attendance[];
  onRefresh: () => void;
}> = ({ attendance, onRefresh }) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const filtered = attendance.filter((a) => a.date === date);
  const present = filtered.length;
  const ready = filtered.filter((a) => a.is_driver_ready).length;
  const checkedOut = filtered.filter((a) => a.check_out).length;

  const handleCheckout = async (att: Attendance) => {
    setCheckingOut(att.id);
    try {
      await hrApi.updateAttendance(att.id, { check_out: new Date().toISOString() });
      onRefresh();
    } finally {
      setCheckingOut(null);
    }
  };

  return (
    <>
      {/* Date picker + KPIs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-black text-charcoal/40 uppercase tracking-wider">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="text-sm font-bold px-4 py-2 border border-silver rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer" />
        </div>
        <div className="flex gap-3 flex-1">
          <div className="flex-1 bg-white p-4 rounded-2xl border border-silver/50 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 block">Present</span>
            <span className="text-xl font-black text-primary mt-1 block">{present}</span>
          </div>
          <div className="flex-1 bg-white p-4 rounded-2xl border border-silver/50 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 block">Driver Ready</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">{ready}</span>
          </div>
          <div className="flex-1 bg-white p-4 rounded-2xl border border-silver/50 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 block">Checked Out</span>
            <span className="text-xl font-black text-charcoal/60 mt-1 block">{checkedOut}</span>
          </div>
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="bg-white rounded-2xl border border-silver/60 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-silver/50">
          <h2 className="text-xs font-black uppercase tracking-wider text-charcoal flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Daily Attendance Log
          </h2>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs font-bold text-charcoal/30 flex flex-col items-center gap-2">
              <Clock className="w-8 h-8 text-charcoal/20" />
              No attendance records for {date}.
            </div>
          ) : (
            <div className="divide-y divide-silver/30">
              {filtered.map((att) => (
                <div key={att.id} className="px-5 py-4 flex items-center justify-between hover:bg-silver/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${att.is_driver_ready ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-silver/20 text-charcoal/50 border border-silver/50"}`}>
                      {att.employee_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-black text-charcoal">{att.employee_name}</div>
                      <div className="text-[10px] text-charcoal/40 font-medium flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> In: {fmtTime(att.check_in)}</span>
                        {att.check_out && <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-rose-400" /> Out: {fmtTime(att.check_out)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {att.is_driver_ready && (
                      <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Truck className="w-3 h-3" /> READY
                      </span>
                    )}
                    {!att.check_out && (
                      <button onClick={() => handleCheckout(att)} disabled={checkingOut === att.id}
                        className="text-[10px] font-bold px-3 py-1.5 border border-silver rounded-xl hover:bg-silver/10 active:scale-95 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1">
                        {checkingOut === att.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        Check Out
                      </button>
                    )}
                    {att.notes && <span className="text-[9px] italic text-charcoal/40 max-w-[120px] truncate" title={att.notes}>"{att.notes}"</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AttendanceTab;
