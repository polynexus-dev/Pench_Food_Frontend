import React, { useState } from "react";
import { Trophy, Plus, Edit3, Trash2, RefreshCw, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { hrApi } from "../api/hrApi";
import type { DeliveryIncentiveRule } from "./types";

const fmt = (n: number | string) => `₹${Number(n).toLocaleString("en-IN")}`;

const IncentivesTab: React.FC<{
  rules: DeliveryIncentiveRule[];
  onRefresh: () => void;
}> = ({ rules, onRefresh }) => {
  const [editing, setEditing] = useState<DeliveryIncentiveRule | null | "new">(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this incentive rule?")) return;
    setDeleting(id);
    try { await hrApi.deleteIncentiveRule(id); onRefresh(); } finally { setDeleting(null); }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-silver/60 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-silver/50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-charcoal flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Delivery Incentive Rules
            </h2>
            <p className="text-[11px] text-charcoal/40 mt-0.5">Configure performance benchmarks and bonus amounts</p>
          </div>
          <button onClick={() => setEditing("new")}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-xs cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </button>
        </div>
        <div className="divide-y divide-silver/30">
          {rules.length === 0 ? (
            <div className="py-16 text-center text-xs font-bold text-charcoal/30 flex flex-col items-center gap-2">
              <Trophy className="w-8 h-8 text-charcoal/20" /> No incentive rules configured.
            </div>
          ) : rules.map((rule) => (
            <div key={rule.id} className="px-5 py-4 flex items-center justify-between hover:bg-silver/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${rule.is_active ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-silver/20 text-charcoal/40 border border-silver/50"}`}>
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-charcoal">{rule.name}</div>
                  <div className="text-[10px] text-charcoal/40 font-medium mt-0.5">
                    {rule.metric_display} ≥ {rule.threshold} → <span className="font-bold text-emerald-600">{fmt(rule.incentive_amount)}</span> bonus
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${rule.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-silver/30 text-charcoal/50 border-silver"}`}>
                  {rule.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
                <button onClick={() => setEditing(rule)} className="p-1.5 rounded-lg hover:bg-primary/10 text-charcoal/40 hover:text-primary transition-colors cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(rule.id)} disabled={deleting === rule.id} className="p-1.5 rounded-lg hover:bg-rose-50 text-charcoal/40 hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-40">
                  {deleting === rule.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && <IncentiveModal rule={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSuccess={() => { onRefresh(); setEditing(null); }} />}
    </>
  );
};

const IncentiveModal: React.FC<{ rule: DeliveryIncentiveRule | null; onClose: () => void; onSuccess: () => void }> = ({ rule, onClose, onSuccess }) => {
  const isEdit = !!rule;
  const [form, setForm] = useState({
    name: rule?.name || "",
    metric: rule?.metric || "on_time_pct",
    threshold: rule?.threshold || "95",
    incentive_amount: rule?.incentive_amount || "500",
    is_active: rule?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      if (isEdit) await hrApi.updateIncentiveRule(rule!.id, form);
      else await hrApi.createIncentiveRule(form);
      onSuccess();
    } catch (err: any) {
      setError(JSON.stringify(err?.response?.data) || "Save failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-silver/50">
        <div className="p-6 border-b border-silver/50 flex items-center justify-between">
          <h2 className="text-base font-black text-charcoal flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> {isEdit ? "Edit Rule" : "New Rule"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-silver/20 transition-colors cursor-pointer"><X className="w-4 h-4 text-charcoal/50" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Rule Name</label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required
              className="w-full text-sm font-medium px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" placeholder="e.g. On-Time Bonus" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Metric</label>
              <select value={form.metric} onChange={(e) => set("metric", e.target.value)}
                className="w-full text-sm font-medium px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer">
                <option value="on_time_pct">On-Time Delivery %</option>
                <option value="collection_accuracy">Collection Accuracy</option>
                <option value="total_deliveries">Total Deliveries</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Threshold</label>
              <input type="number" step="0.01" value={form.threshold} onChange={(e) => set("threshold", e.target.value)} required
                className="w-full text-sm font-medium px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Bonus Amount (₹)</label>
              <input type="number" step="0.01" value={form.incentive_amount} onChange={(e) => set("incentive_amount", e.target.value)} required
                className="w-full text-sm font-medium px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="w-4 h-4 rounded accent-primary cursor-pointer" />
                <span className="text-xs font-bold text-charcoal">Active</span>
              </label>
            </div>
          </div>
          {error && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 border border-silver rounded-xl text-sm font-bold text-charcoal hover:bg-silver/10 transition-all cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 px-4 bg-primary rounded-xl text-sm font-black text-white hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncentivesTab;
