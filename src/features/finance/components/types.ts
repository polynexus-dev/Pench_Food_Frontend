// Finance & Billing TypeScript Types

export type BillStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface FinanceTransaction {
  id: string;
  bill: string;
  amount: string;
  payment_method: string;
  transaction_id: string;
  payment_date: string;
  notes: string;
}

export interface MonthlyBill {
  id: string;
  customer: string;
  customer_name: string;
  billing_month: string;
  total_amount: string;
  amount_paid: string;
  remaining_amount: string;
  status: BillStatus;
  status_display: string;
  due_date: string;
  invoice_number: string;
  transactions: FinanceTransaction[];
}

export interface FinanceDashboardSummary {
  total_outstanding: number;
  total_billed: number;
  total_collected: number;
  collected_today: number;
  collection_rate: number;
  total_bills: number;
  paid_count: number;
  unpaid_count: number;
  partial_count: number;
}

export interface RecordPaymentPayload {
  bill: string;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
}
