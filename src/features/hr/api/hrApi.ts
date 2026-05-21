import axiosInstance from "../../../api/axiosInstance";
import type {
  Employee,
  Department,
  SalaryStructure,
  MonthlyPayroll,
  EmployeeDocument,
  DeliveryIncentiveRule,
  Attendance,
} from "../components/types";

const B = {
  employees: "/erp/hr/employees/",
  departments: "/erp/hr/departments/",
  salaryStructures: "/erp/hr/salary-structures/",
  payrolls: "/erp/hr/payrolls/",
  documents: "/erp/hr/documents/",
  attendance: "/erp/hr/attendance/",
  incentiveRules: "/erp/hr/incentive-rules/",
};

export const hrApi = {
  // ── Employees ──────────────────────────────────────────────────────────
  getEmployees: (params?: Record<string, string>) =>
    axiosInstance.get<Employee[]>(B.employees, { params }),
  createEmployee: (data: Partial<Employee>) =>
    axiosInstance.post<Employee>(B.employees, data),
  updateEmployee: (id: string, data: Partial<Employee>) =>
    axiosInstance.patch<Employee>(`${B.employees}${id}/`, data),
  deleteEmployee: (id: string) =>
    axiosInstance.delete(`${B.employees}${id}/`),

  // ── Departments ────────────────────────────────────────────────────────
  getDepartments: () =>
    axiosInstance.get<Department[]>(B.departments),
  createDepartment: (data: Partial<Department>) =>
    axiosInstance.post<Department>(B.departments, data),
  updateDepartment: (id: string, data: Partial<Department>) =>
    axiosInstance.patch<Department>(`${B.departments}${id}/`, data),
  deleteDepartment: (id: string) =>
    axiosInstance.delete(`${B.departments}${id}/`),

  // ── Salary Structures ──────────────────────────────────────────────────
  getSalaryStructures: () =>
    axiosInstance.get<SalaryStructure[]>(B.salaryStructures),

  // ── Payroll ────────────────────────────────────────────────────────────
  getPayrolls: (params?: Record<string, string>) =>
    axiosInstance.get<MonthlyPayroll[]>(B.payrolls, { params }),
  updatePayroll: (id: string, data: Partial<MonthlyPayroll>) =>
    axiosInstance.patch<MonthlyPayroll>(`${B.payrolls}${id}/`, data),
  generatePayroll: (month: number, year: number) =>
    axiosInstance.post(`${B.payrolls}generate/`, { month, year }),

  // ── Documents ──────────────────────────────────────────────────────────
  getDocuments: (params?: Record<string, string>) =>
    axiosInstance.get<EmployeeDocument[]>(B.documents, { params }),
  uploadDocument: (formData: FormData) =>
    axiosInstance.post<EmployeeDocument>(B.documents, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  verifyDocument: (id: string) =>
    axiosInstance.post<EmployeeDocument>(`${B.documents}${id}/verify/`),
  deleteDocument: (id: string) =>
    axiosInstance.delete(`${B.documents}${id}/`),

  // ── Attendance ─────────────────────────────────────────────────────────
  getAttendance: (params?: Record<string, string>) =>
    axiosInstance.get<Attendance[]>(B.attendance, { params }),
  createAttendance: (data: Partial<Attendance>) =>
    axiosInstance.post<Attendance>(B.attendance, data),
  updateAttendance: (id: string, data: Partial<Attendance>) =>
    axiosInstance.patch<Attendance>(`${B.attendance}${id}/`, data),

  // ── Incentive Rules ────────────────────────────────────────────────────
  getIncentiveRules: () =>
    axiosInstance.get<DeliveryIncentiveRule[]>(B.incentiveRules),
  createIncentiveRule: (data: Partial<DeliveryIncentiveRule>) =>
    axiosInstance.post<DeliveryIncentiveRule>(B.incentiveRules, data),
  updateIncentiveRule: (id: string, data: Partial<DeliveryIncentiveRule>) =>
    axiosInstance.patch<DeliveryIncentiveRule>(`${B.incentiveRules}${id}/`, data),
  deleteIncentiveRule: (id: string) =>
    axiosInstance.delete(`${B.incentiveRules}${id}/`),
};
