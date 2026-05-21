import React, { useState, useEffect, useCallback } from "react";
import { Briefcase, Users, Clock, FileText, IndianRupee, Trophy, RefreshCw, AlertTriangle } from "lucide-react";
import { hrApi } from "../api/hrApi";
import type { Employee, Department, MonthlyPayroll, EmployeeDocument, Attendance, DeliveryIncentiveRule } from "../components/types";
import EmployeesTab from "../components/EmployeesTab";
import AttendanceTab from "../components/AttendanceTab";
import DocumentsTab from "../components/DocumentsTab";
import PayrollTab from "../components/PayrollTab";
import IncentivesTab from "../components/IncentivesTab";

type Tab = "employees" | "attendance" | "documents" | "payroll" | "incentives";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "employees", label: "Employees", icon: Users },
  { key: "attendance", label: "Attendance", icon: Clock },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "payroll", label: "Payroll", icon: IndianRupee },
  { key: "incentives", label: "Incentives", icon: Trophy },
];

const HRPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("employees");
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [payrolls, setPayrolls] = useState<MonthlyPayroll[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [incentiveRules, setIncentiveRules] = useState<DeliveryIncentiveRule[]>([]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setIsForbidden(false);
    try {
      const [empRes, deptRes, payRes, docRes, attRes, incRes] = await Promise.all([
        hrApi.getEmployees(),
        hrApi.getDepartments(),
        hrApi.getPayrolls(),
        hrApi.getDocuments(),
        hrApi.getAttendance(),
        hrApi.getIncentiveRules(),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setPayrolls(payRes.data);
      setDocuments(docRes.data);
      setAttendance(attRes.data);
      setIncentiveRules(incRes.data);
    } catch (err: any) {
      if (err?.response?.status === 403) setIsForbidden(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-8xl mx-auto pb-12 animate-pulse space-y-6">
        <div className="h-10 w-64 bg-silver/40 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (<div key={i} className="h-12 bg-silver/30 rounded-2xl" />))}
        </div>
        <div className="h-96 bg-silver/20 rounded-2xl" />
      </div>
    );
  }

  // ── Access restricted ─────────────────────────────────────────────────
  if (isForbidden) {
    return (
      <div className="max-w-8xl mx-auto pb-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-black text-charcoal mb-2">Access Restricted</h2>
          <p className="text-sm text-charcoal/50 font-medium">
            The HR & Payroll module requires <strong>HR_Managers</strong> or <strong>ERP_Admins</strong> group membership.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-xs">
            <Briefcase className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-charcoal tracking-tight">HR & Payroll</h1>
            <p className="text-charcoal/50 font-medium text-xs mt-0.5">
              Manage employees, attendance, documents, payroll, and incentive rules.
            </p>
          </div>
        </div>
        <button onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-silver/60 rounded-xl text-xs font-bold text-charcoal hover:bg-silver/10 active:scale-95 transition-all shadow-xs cursor-pointer self-start md:self-auto">
          <RefreshCw className="w-3.5 h-3.5 text-primary" /> Refresh
        </button>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1.5 mb-6 bg-white rounded-2xl border border-silver/50 p-1.5 shadow-xs overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === key
                ? "bg-primary text-white shadow-xs"
                : "text-charcoal/50 hover:bg-silver/10 hover:text-charcoal"
            }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "employees" && <EmployeesTab employees={employees} departments={departments} onRefresh={loadAll} />}
      {activeTab === "attendance" && <AttendanceTab attendance={attendance} onRefresh={loadAll} />}
      {activeTab === "documents" && <DocumentsTab documents={documents} employees={employees} onRefresh={loadAll} />}
      {activeTab === "payroll" && <PayrollTab payrolls={payrolls} onRefresh={loadAll} />}
      {activeTab === "incentives" && <IncentivesTab rules={incentiveRules} onRefresh={loadAll} />}
    </div>
  );
};

export default HRPage;
