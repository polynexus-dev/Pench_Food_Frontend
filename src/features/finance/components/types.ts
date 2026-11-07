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

export interface SubscriptionWeeklyRow {
  week_number: number;
  label: string;
  start_date: string;
  end_date: string;
  scheduled_days: number;
  delivered_days: number;
  skipped_days: number;
  pending_days: number;
  amount: string;
}

export interface ExtraOrderRow {
  id: string;
  order_number: string;
  date: string;
  items_summary: string;
  items_subtotal: string;
  handling_fee: string;
  total: string;
  amount_collected: string;
  remaining_amount: string;
  payment_method: string;
  payment_status: string;
  billing_mode_label: string;
  status: string;
}

export interface DeductionItem {
  label: string;
  amount: string;
  type: string;
}

export interface MonthlyBillBreakdown {
  subscription_summary: {
    total_scheduled_days: number;
    total_delivered_days: number;
    total_skipped_days: number;
    daily_rate: string;
    total_amount: string;
    prepaid_credit: string;
    weeks: SubscriptionWeeklyRow[];
  };
  extra_orders_summary: {
    count: number;
    items_subtotal: string;
    handling_fee_total: string;
    gross_total: string;
    paid_immediately_or_partial: string;
    unpaid_added_to_bill: string;
    orders: ExtraOrderRow[];
  };
  deductions_and_credits: {
    subscription_prepaid: string;
    extra_orders_paid: string;
    bill_transactions_paid: string;
    total_deductions: string;
    items: DeductionItem[];
  };
  final_calculation: {
    subscription_charges: string;
    extra_orders_charges: string;
    gross_items_total: string;
    less_prepaid_and_collected: string;
    unpaid_bill_subtotal: string;
    handling_fee: string;
    handling_fee_label: string;
    handling_slab: {
      min_amount: string;
      max_amount: string | null;
      fee: string;
      label: string;
    } | null;
    net_bill_total: string;
    bill_payments_received: string;
    final_payable_amount: string;
  };
}

export interface MonthlyBill {
  id: string;
  customer: string;
  customer_name: string;
  billing_month: string;
  handling_fee?: string;
  total_amount: string;
  amount_paid: string;
  remaining_amount: string;
  status: BillStatus;
  status_display: string;
  due_date: string;
  invoice_number: string;
  transactions: FinanceTransaction[];
  orders_breakdown?: MonthlyBillBreakdown;
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
  payment_gateway?: string;
  gateway_txnid?: string;
  gateway_mihpayid?: string;
  gateway_mode?: string;
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

// ─── PayU Payment Gateway & Handling Fee Slabs ───────────────────────────────

export interface PayUInitiatePayload {
  order_id?: string;
  subscription_id?: string;
  bill_id?: string;
  amount?: number | string;
  customer_id?: string;
  notes?: string;
  frontend_redirect_url?: string;
}

export interface PayUInitiateResponse {
  payment_id?: string;
  online_payment_id?: string;
  txnid: string;
  action_url?: string;
  payu_action_url?: string;
  mode?: string;
  payu_env?: string;
  params?: Record<string, string>;
  form_fields?: Record<string, string>;
}

export interface HandlingFeeSlabItem {
  min_amount: string;
  max_amount: string | null;
  fee: string;
  label: string;
}

export interface HandlingFeeSlabResponse {
  slabs: HandlingFeeSlabItem[];
  preview?: {
    items_subtotal: string;
    payment_method: string;
    handling_fee: string;
    total_payable: string;
    slab: HandlingFeeSlabItem | null;
    note: string;
  };
}
