import React, { useState } from "react";
import { Search, Plus, X, RefreshCw, CheckCircle2, AlertTriangle, Users, Building2, Edit3, Trash2 } from "lucide-react";
import { hrApi } from "../api/hrApi";
import type { Employee, Department } from "./types";

/** Show full_name, or fallback to email/employee_id */
const displayName = (emp: Employee) =>
  emp.full_name?.trim() || emp.email || emp.employee_id || "Unnamed";

const initials = (emp: Employee) => {
  if (emp.first_name && emp.last_name) return (emp.first_name[0] + emp.last_name[0]).toUpperCase();
  if (emp.full_name?.trim()) return emp.full_name.substring(0, 2).toUpperCase();
  if (emp.email) return emp.email.substring(0, 2).toUpperCase();
  return "??";
};

// ── Create/Edit Employee Modal ───────────────────────────────────────────────
const EmployeeModal: React.FC<{
  employee: Employee | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ employee, departments, onClose, onSuccess }) => {
  const isEdit = !!employee;
  const [form, setForm] = useState({
    user: employee?.user || "",
    first_name: employee?.first_name || "",
    last_name: employee?.last_name || "",
    phone: employee?.phone || "",
    department: employee?.department || "",
    job_title: employee?.job_title || "",
    employee_id: employee?.employee_id || "",
    date_joined: employee?.date_joined || new Date().toISOString().split("T")[0],
    aadhaar_number: employee?.aadhaar_number || "",
    pan_number: employee?.pan_number || "",
    licence_number: employee?.licence_number || "",
    emergency_contact_name: employee?.emergency_contact_name || "",
    emergency_contact_phone: employee?.emergency_contact_phone || "",
    bank_account_number: employee?.bank_account_number || "",
    bank_ifsc: employee?.bank_ifsc || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: any = { ...form };
      if (!payload.department) delete payload.department;
      if (isEdit) {
        await hrApi.updateEmployee(employee!.id, payload);
      } else {
        await hrApi.createEmployee(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data;
      setError(typeof detail === "string" ? detail : JSON.stringify(detail) || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, key: string, type = "text", required = false) => (
    <div>
      <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">{label}</label>
      <input type={type} value={(form as any)[key]} onChange={(e) => set(key, e.target.value)} required={required}
        className="w-full text-sm font-medium px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-silver/50 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-silver/50 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
          <div>
            <h2 className="text-base font-black text-charcoal flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> {isEdit ? "Edit Employee" : "Add Employee"}
            </h2>
            {isEdit && <p className="text-[11px] text-charcoal/50 mt-0.5">{displayName(employee!)}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-silver/20 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-charcoal/50" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User profile section */}
          <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">User Profile</p>
          <div className="grid grid-cols-2 gap-3">
            {field("First Name", "first_name", "text", true)}
            {field("Last Name", "last_name", "text", true)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Phone", "phone")}
            {!isEdit && field("User ID (UUID)", "user", "text", true)}
          </div>

          <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider pt-2">Employment Details</p>
          <div className="grid grid-cols-2 gap-3">
            {field("Employee Code", "employee_id", "text", true)}
            {field("Job Title", "job_title", "text", true)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black text-charcoal uppercase tracking-wider block mb-1.5">Department</label>
              <select value={form.department} onChange={(e) => set("department", e.target.value)}
                className="w-full text-sm font-medium px-3 py-2.5 border border-silver rounded-xl bg-silver/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer">
                <option value="">— None —</option>
                {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
            {field("Date Joined", "date_joined", "date", true)}
          </div>

          <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider pt-2">Compliance & KYC</p>
          <div className="grid grid-cols-2 gap-3">
            {field("Aadhaar Number", "aadhaar_number")}
            {field("PAN Number", "pan_number")}
          </div>
          {field("Driving Licence", "licence_number")}

          <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-wider pt-2">Emergency & Banking</p>
          <div className="grid grid-cols-2 gap-3">
            {field("Emergency Contact", "emergency_contact_name")}
            {field("Emergency Phone", "emergency_contact_phone")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Bank Account No.", "bank_account_number")}
            {field("IFSC Code", "bank_ifsc")}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
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

// ── Employees Tab ────────────────────────────────────────────────────────────
const EmployeesTab: React.FC<{
  employees: Employee[];
  departments: Department[];
  onRefresh: () => void;
}> = ({ employees, departments, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [modalEmployee, setModalEmployee] = useState<Employee | null | "new">(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = employees.filter((e) => {
    if (deptFilter !== "all" && e.department !== deptFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return displayName(e).toLowerCase().includes(q) || e.employee_id.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this employee?")) return;
    setDeleting(id);
    try { await hrApi.deleteEmployee(id); onRefresh(); } finally { setDeleting(null); }
  };

  const active = employees.filter((e) => e.is_active).length;
  const uniqueDepts = new Set(employees.map((e) => e.department_name).filter(Boolean));
  const pendingDocs = employees.filter((e) => !e.aadhaar_number || !e.pan_number).length;

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none"><Users className="w-24 h-24 text-primary" /></div>
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Active Employees</span>
          <span className="text-2xl font-black text-primary tracking-tight mt-2 block">{active}</span>
          <span className="text-[10px] text-charcoal/40 font-medium">{employees.length - active} inactive</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-accent/60 transition-colors">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none"><Building2 className="w-24 h-24 text-accent" /></div>
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Departments</span>
          <span className="text-2xl font-black text-charcoal tracking-tight mt-2 block">{uniqueDepts.size}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-silver/50 shadow-xs relative overflow-hidden group hover:border-amber-400/50 transition-colors">
          <span className="text-[11px] font-black uppercase tracking-widest text-charcoal/40 block">Pending KYC</span>
          <span className="text-2xl font-black text-amber-600 tracking-tight mt-2 block">{pendingDocs}</span>
          <span className="text-[10px] text-charcoal/40 font-medium">Missing Aadhaar or PAN</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-silver/60 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-silver/50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/30" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, email..."
                className="w-full text-xs font-medium pl-9 pr-4 py-2 border border-silver rounded-xl bg-silver/10 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-charcoal/30" />
            </div>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2 border border-silver rounded-xl bg-silver/10 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="all">All Depts</option>
              {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
          </div>
          <button onClick={() => setModalEmployee("new")}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0">
            <Plus className="w-3.5 h-3.5" /> Add Employee
          </button>
        </div>

        {/* Table */}
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-silver/10 z-10">
              <tr className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 border-b border-silver/50">
                <th className="text-left px-5 py-3">Employee</th>
                <th className="text-left px-3 py-3">Dept</th>
                <th className="text-left px-3 py-3">Job Title</th>
                <th className="text-left px-3 py-3">KYC</th>
                <th className="text-left px-3 py-3">Joined</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-silver/30 hover:bg-silver/5 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                        {initials(emp)}
                      </div>
                      <div>
                        <div className="font-black text-charcoal">{displayName(emp)}</div>
                        <div className="text-[10px] text-charcoal/40">{emp.employee_id} · {emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><span className="text-[10px] font-bold bg-silver/30 text-charcoal/60 px-2 py-0.5 rounded-md">{emp.department_name || "—"}</span></td>
                  <td className="px-3 py-3 font-medium text-charcoal/70">{emp.job_title}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {emp.aadhaar_number && <span className="text-[8px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded">AADHAAR</span>}
                      {emp.pan_number && <span className="text-[8px] font-black bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">PAN</span>}
                      {!emp.aadhaar_number && !emp.pan_number && <span className="text-[8px] font-black bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded">PENDING</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-charcoal/50 font-medium">{new Date(emp.date_joined).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModalEmployee(emp)} className="p-1.5 rounded-lg hover:bg-primary/10 text-charcoal/40 hover:text-primary transition-colors cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(emp.id)} disabled={deleting === emp.id} className="p-1.5 rounded-lg hover:bg-rose-50 text-charcoal/40 hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-40">
                        {deleting === emp.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-charcoal/30 font-bold">No employees found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalEmployee && (
        <EmployeeModal
          employee={modalEmployee === "new" ? null : modalEmployee}
          departments={departments}
          onClose={() => setModalEmployee(null)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
};

export default EmployeesTab;
