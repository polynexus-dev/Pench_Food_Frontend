import React, { useState } from "react";
import { IndianRupee, Zap, RefreshCw, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { hrApi } from "../api/hrApi";
import type { MonthlyPayroll } from "./types";

const fmt = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const statusStyle = (s: string) => {
  switch (s) {
    case "paid": return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "processed": return "bg-blue-50 text-blue-700 border-blue-100";
    default: return "bg-silver/30 text-charcoal/60 border-silver";
  }
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const PayrollTab: React.FC<{
  payrolls: MonthlyPayroll[];
  onRefresh: () => void;
}> = ({ payrolls, onRefresh }) => {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [showGenerate, setShowGenerate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "processed" | "paid">("all");

  const filtered = payrolls.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return p.month === Number(month) && p.year === Number(year);
  });

  const totalGross = filtered.reduce((s, p) => s + Number(p.gross_salary), 0);
  const totalNet = filtered.reduce((s, p) => s + Number(p.net_salary), 0);
  const totalIncentive = filtered.reduce((s, p) => s + Number(p.incentive), 0);

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <select value={month} onChange={(e) => setMonth(e.target.value)}
            className="text-sm font-bold px-3 py-2 border border-silver rounded-xl bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary">
            {MONTHS.map((m, i) => (<option key={i + 1} value={String(i + 1)}>{m}</option>))}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min="2020" max="2099"
            className="text-sm font-bold px-3 py-2 border border-silver rounded-xl bg-white w-24 focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex gap-1 ml-2">
            {(["all", "draft", "processed", "paid"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${statusFilter === s ? "bg-primary text-white border-primary" : "bg-silver/10 text-charcoal/60 border-silver/50 hover:border-primary/40"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-xs cursor-pointer">
          <Zap className="w-3.5 h-3.5" /> Generate Payroll
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Total Gross</span>
          <span className="text-2xl font-black text-charcoal mt-2 block">{fmt(totalGross)}</span>
          <span className="text-[10px] text-charcoal/40 font-medium">{filtered.length} payslips</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Total Net</span>
          <span className="text-2xl font-black text-emerald-600 mt-2 block">{fmt(totalNet)}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Incentives</span>
          <span className="text-2xl font-black text-amber-600 mt-2 block">{fmt(totalIncentive)}</span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-silver/60 shadow-xs overflow-hidden">
        <div className="max-h-[460px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-silver/10 z-10">
              <tr className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 border-b border-silver/50">
                <th className="text-left px-5 py-3">Employee</th>
                <th className="text-right px-3 py-3">Basic</th>
                <th className="text-right px-3 py-3">HRA</th>
                <th className="text-right px-3 py-3">DA</th>
                <th className="text-right px-3 py-3">Incentive</th>
                <th className="text-right px-3 py-3">Deductions</th>
                <th className="text-right px-3 py-3">Net</th>
                <th className="text-center px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-silver/30 hover:bg-silver/5 transition-colors">
                  <td className="px-5 py-3 font-black text-charcoal">{p.employee_name}</td>
                  <td className="px-3 py-3 text-right font-medium text-charcoal/70">{fmt(p.basic)}</td>
                  <td className="px-3 py-3 text-right font-medium text-charcoal/70">{fmt(p.hra)}</td>
                  <td className="px-3 py-3 text-right font-medium text-charcoal/70">{fmt(p.da)}</td>
                  <td className="px-3 py-3 text-right font-bold text-amber-600">{fmt(p.incentive)}</td>
                  <td className="px-3 py-3 text-right font-bold text-rose-500">-{fmt(p.deductions)}</td>
                  <td className="px-3 py-3 text-right font-black text-primary">{fmt(p.net_salary)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${statusStyle(p.status)}`}>{p.status_display}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-charcoal/30 font-bold">No payroll records for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerate && <GeneratePayrollModal month={month} year={year} onClose={() => setShowGenerate(false)} onSuccess={() => { onRefresh(); setShowGenerate(false); }} />}
    </>
  );
};

const GeneratePayrollModal: React.FC<{ month: string; year: string; onClose: () => void; onSuccess: () => void }> = ({ month, year, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true); setError(null);
    try {
      const res = await hrApi.generatePayroll(Number(month), Number(year));
      setResult((res.data as any).detail || "Payroll generated!");
      onSuccess();
    } catch {
      setError("Failed to generate payroll.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-silver/50">
        <div className="p-6 border-b border-silver/50 flex items-center justify-between">
          <h2 className="text-base font-black text-charcoal flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Generate Payroll</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-silver/20 transition-colors cursor-pointer"><X className="w-4 h-4 text-charcoal/50" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-charcoal/60 font-medium">Generate payroll for <strong>{MONTHS[Number(month) - 1]} {year}</strong> for all active employees.</p>
          {result && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{result}</div>}
          {error && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 px-4 border border-silver rounded-xl text-sm font-bold text-charcoal hover:bg-silver/10 transition-all cursor-pointer">{result ? "Close" : "Cancel"}</button>
            {!result && (
              <button onClick={handleGenerate} disabled={loading}
                className="flex-1 py-2.5 px-4 bg-amber-500 rounded-xl text-sm font-black text-white hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? "Generating..." : "Run Payroll"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollTab;
