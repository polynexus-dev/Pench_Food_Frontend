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

// ─── Online Payments (customer-submitted, admin-verified) ───────────────────

export type OnlinePaymentStatus = 'pending' | 'verified' | 'rejected';
export type OnlinePaymentPurpose = 'subscription' | 'order' | 'bill' | 'general';

export interface OnlinePayment {
  id: string;
  customer: string;
  customer_name: string;
  customer_phone: string;
  amount: string;
  screenshot: string | null;
  transaction_id: string;
  purpose: OnlinePaymentPurpose;
  purpose_display: string;
  subscription: string | null;
  order: string | null;
  bill: string | null;
  bill_invoice_number: string | null;
  notes: string;
  status: OnlinePaymentStatus;
  status_display: string;
  verified_by: number | null;
  verified_by_name: string | null;
  verified_at: string | null;
  rejection_reason: string;
  bill_transaction: string | null;
  created_at: string;
}

export interface OnlinePaymentBucket {
  count: number;
  customers: number;
  amount: number;
}

export interface OnlinePaymentSummary {
  total_customers_paid_online: number;
  pending: OnlinePaymentBucket;
  verified: OnlinePaymentBucket;
  rejected: OnlinePaymentBucket;
  pending_by_purpose: Partial<Record<OnlinePaymentPurpose, number>>;
}
