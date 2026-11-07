import axiosInstance from "../../../api/axiosInstance";
import type {
  MonthlyBill,
  FinanceTransaction,
  FinanceDashboardSummary,
  RecordPaymentPayload,
  OnlinePayment,
  OnlinePaymentSummary,
  PayUInitiatePayload,
  PayUInitiateResponse,
  HandlingFeeSlabResponse,
} from "../components/types";

const BASE_BILLS = "/erp/finance/bills/";
const BASE_TRANSACTIONS = "/erp/finance/transactions/";
const BASE_ONLINE_PAYMENTS = "/erp/finance/online-payments/";
const BASE_PAYU = "/erp/finance/payu/";
const BASE_SLABS = "/erp/finance/handling-fee-slabs/";

export const calculateHandlingFeeLocally = (
  amount: number,
  paymentMethod: string = "payu"
): number => {
  if (paymentMethod === "on_account" || amount <= 0) return 0;
  if (amount <= 1500) return 5;
  if (amount <= 2500) return 10;
  if (amount <= 4000) return 18;
  return 25;
};

export const submitPayUCheckoutForm = (initData: PayUInitiateResponse) => {
  const actionUrl = initData.action_url || initData.payu_action_url;
  const fields = initData.params || initData.form_fields;
  if (!actionUrl || !fields) {
    throw new Error("Invalid PayU initiation response from server.");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value ?? "";
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

export const financeApi = {
  /** Global KPI dashboard summary */
  getSummary: () =>
    axiosInstance.get<FinanceDashboardSummary>(`${BASE_BILLS}summary/`),

  /** List all monthly bills, with optional query filters */
  getMonthlyBills: (params?: Record<string, string>) =>
    axiosInstance.get<MonthlyBill[]>(BASE_BILLS, { params }),

  /** Single bill detail */
  getBill: (id: string) =>
    axiosInstance.get<MonthlyBill>(`${BASE_BILLS}${id}/`),

  /** List all transactions (payment receipts) */
  getTransactions: (params?: Record<string, string>) =>
    axiosInstance.get<FinanceTransaction[]>(BASE_TRANSACTIONS, { params }),

  /** Record a new payment against a bill */
  recordPayment: (payload: RecordPaymentPayload) =>
    axiosInstance.post<FinanceTransaction>(BASE_TRANSACTIONS, payload),

  /** Delete a payment receipt (reopens the invoice via backend signal) */
  deleteTransaction: (id: string) =>
    axiosInstance.delete(`${BASE_TRANSACTIONS}${id}/`),

  /** Manually trigger billing cycle generation */
  triggerBillingCycle: (year: number, month: number) =>
    axiosInstance.post(`${BASE_BILLS}trigger-generation/`, { year, month }),

  /** List customer-submitted online payments (filter by status, purpose, customer, ...) */
  getOnlinePayments: (params?: Record<string, string>) =>
    axiosInstance.get<OnlinePayment[]>(BASE_ONLINE_PAYMENTS, { params }),

  /** Online payment verification KPIs */
  getOnlinePaymentSummary: (params?: Record<string, string>) =>
    axiosInstance.get<OnlinePaymentSummary>(`${BASE_ONLINE_PAYMENTS}summary/`, { params }),

  /** Mark an online payment as verified (records a bill transaction / marks order paid) */
  verifyOnlinePayment: (id: string) =>
    axiosInstance.post<OnlinePayment>(`${BASE_ONLINE_PAYMENTS}${id}/verify/`),

  /** Reject an online payment with a reason visible to the customer */
  rejectOnlinePayment: (id: string, reason: string) =>
    axiosInstance.post<OnlinePayment>(`${BASE_ONLINE_PAYMENTS}${id}/reject/`, { reason }),

  /** Download invoice PDF */
  downloadInvoicePdf: async (id: string, invoiceNumber: string) => {
    const response = await axiosInstance.get(`${BASE_BILLS}${id}/download-pdf/`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Invoice_${invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },

  /** Initiate PayU checkout for an Order, Subscription, or MonthlyBill */
  initiatePayU: (payload: PayUInitiatePayload) =>
    axiosInstance.post<PayUInitiateResponse>(`${BASE_PAYU}initiate/`, payload),

  /** Check/verify PayU transaction status by txnid */
  getPayUStatus: (txnid: string, verify: boolean = true) =>
    axiosInstance.get(`${BASE_PAYU}status/${txnid}/`, {
      params: { verify: verify ? "true" : "false" },
    }),

  /** Fetch Packing & Handling Fee Slabs + optional live preview for an amount */
  getHandlingFeeSlabs: (amount?: number | string, paymentMethod: string = "payu") =>
    axiosInstance.get<HandlingFeeSlabResponse>(BASE_SLABS, {
      params: amount !== undefined ? { amount: String(amount), payment_method: paymentMethod } : undefined,
    }),
};
