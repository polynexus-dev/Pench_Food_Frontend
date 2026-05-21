import React, { useState } from "react";
import { FileText, CheckCircle2, Clock, ShieldCheck, Trash2, RefreshCw, Upload, X, AlertTriangle } from "lucide-react";
import { hrApi } from "../api/hrApi";
import type { EmployeeDocument, Employee } from "./types";

const docStyle = (verified: boolean) =>
  verified ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100";

const DocumentsTab: React.FC<{
  documents: EmployeeDocument[];
  employees: Employee[];
  onRefresh: () => void;
}> = ({ documents, employees, onRefresh }) => {
  const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");
  const [verifying, setVerifying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const filtered = documents.filter((d) => {
    if (filter === "verified") return d.is_verified;
    if (filter === "pending") return !d.is_verified;
    return true;
  });

  const verified = documents.filter((d) => d.is_verified).length;
  const pending = documents.length - verified;

  const handleVerify = async (id: string) => {
    setVerifying(id);
    try { await hrApi.verifyDocument(id); onRefresh(); } finally { setVerifying(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    setDeleting(id);
    try { await hrApi.deleteDocument(id); onRefresh(); } finally { setDeleting(null); }
  };

  const empName = (empId: string) => employees.find((e) => e.id === empId)?.full_name || "—";

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Total Documents</span>
          <span className="text-2xl font-black text-charcoal mt-2 block">{documents.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Verified</span>
          <span className="text-2xl font-black text-emerald-600 mt-2 block">{verified}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Pending Review</span>
          <span className="text-2xl font-black text-amber-600 mt-2 block">{pending}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-silver/60 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-silver/50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            {(["all", "pending", "verified"] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${filter === s ? "bg-primary text-white border-primary shadow-xs" : "bg-silver/10 text-charcoal/60 border-silver/50 hover:border-primary/40"}`}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </button>
        </div>
        <div className="max-h-[480px] overflow-y-auto divide-y divide-silver/30">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs font-bold text-charcoal/30 flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-charcoal/20" /> No documents found.
            </div>
          ) : filtered.map((doc) => (
            <div key={doc.id} className="px-5 py-4 flex items-center justify-between hover:bg-silver/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-black text-charcoal">{doc.document_type_display}</div>
                  <div className="text-[10px] text-charcoal/40 font-medium">{empName(doc.employee)} · No. {doc.document_number}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${docStyle(doc.is_verified)}`}>
                  {doc.is_verified ? <><ShieldCheck className="w-3 h-3" /> VERIFIED</> : <><Clock className="w-3 h-3" /> PENDING</>}
                </span>
                {!doc.is_verified && (
                  <button onClick={() => handleVerify(doc.id)} disabled={verifying === doc.id}
                    className="text-[10px] font-bold px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1">
                    {verifying === doc.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Verify
                  </button>
                )}
                {doc.document_file && (
                  <a href={doc.document_file} target="_blank" rel="noreferrer"
                    className="text-[10px] font-bold px-3 py-1.5 border border-silver rounded-xl hover:bg-silver/10 transition-all cursor-pointer">View</a>
                )}
                <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-charcoal/40 hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-40">
                  {deleting === doc.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && <UploadDocModal employees={employees} onClose={() => setShowUpload(false)} onSuccess={() => { onRefresh(); setShowUpload(false); }} />}
    </>
  );
};

const UploadDocModal: React.FC<{ employees: Employee[]; onClose: () => void; onSuccess: () => void }> = ({ employees, onClose, onSuccess }) => {
  const [empId, setEmpId] = useState("");
  const [docType, setDocType] = useState("aadhaar");
  const [docNumber, setDocNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !empId) { setError("All fields required."); return; }
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("employee", empId);
      fd.append("document_type", docType);
      fd.append("document_number", docNumber);
      fd.append("document_file", file);
      await hrApi.uploadDocument(fd);
      onSuccess();
    } catch (err: any) {
      setError(JSON.stringify(err?.response?.data) || "Upload failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-silver/50">
        <div className="p-6 border-b border-silver/50 flex items-center justify-between">
          <h2 className="text-base font-black text-charcoal flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Upload Document</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-silver/20 transition-colors cursor-pointer"><X className="w-4 h-4 text-charcoal/50" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Employee</label>
            <select value={empId} onChange={(e) => setEmpId(e.target.value)} required
              className="w-full text-sm font-medium px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer">
              <option value="">Select employee…</option>
              {employees.map((e) => (<option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Doc Type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)}
                className="w-full text-sm font-medium px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer">
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="licence">Driving Licence</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Doc Number</label>
              <input type="text" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} required
                className="w-full text-sm font-medium px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">File</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required
              className="w-full text-sm font-medium px-3 py-2 border border-silver rounded-xl bg-silver/5 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary cursor-pointer" />
          </div>
          {error && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 border border-silver rounded-xl text-sm font-bold text-charcoal hover:bg-silver/10 transition-all cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 px-4 bg-primary rounded-xl text-sm font-black text-white hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentsTab;
