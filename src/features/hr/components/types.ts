// ─── HR Module TypeScript Types ──────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  description: string;
}

export interface Employee {
  id: string;
  user: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  department: string | null;
  department_name: string;
  job_title: string;
  employee_id: string;
  date_joined: string;
  is_active: boolean;
  aadhaar_number: string;
  pan_number: string;
  licence_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  bank_account_number: string;
  bank_ifsc: string;
  warehouse_id?: string | null;
  warehouse_name?: string | null;
}

export interface EmployeeDocument {
  id: string;
  employee: string;
  document_type: "aadhaar" | "pan" | "licence" | "other";
  document_type_display: string;
  document_number: string;
  document_file: string;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
}

export interface SalaryStructure {
  id: string;
  name: string;
  basic_amount: string;
  hra_percentage: string;
  da_percentage: string;
  other_allowances: string;
  is_active: boolean;
}

export type PayrollStatus = "draft" | "processed" | "paid";

export interface MonthlyPayroll {
  id: string;
  employee: string;
  employee_name: string;
  month: number;
  year: number;
  basic: string;
  hra: string;
  da: string;
  incentive: string;
  deductions: string;
  gross_salary: string;
  net_salary: string;
  status: PayrollStatus;
  status_display: string;
  processed_at: string | null;
  paid_at: string | null;
}

export type IncentiveMetric = "on_time_pct" | "collection_accuracy" | "total_deliveries";

export interface DeliveryIncentiveRule {
  id: string;
  name: string;
  metric: IncentiveMetric;
  metric_display: string;
  threshold: string;
  incentive_amount: string;
  is_active: boolean;
}

export interface Attendance {
  id: string;
  employee: string;
  employee_name: string;
  date: string;
  check_in: string;
  check_out: string | null;
  is_driver_ready: boolean;
  notes: string;
}
