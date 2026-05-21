import axiosInstance from "../../../api/axiosInstance";
import type {
  MonthlyBill,
  FinanceTransaction,
  FinanceDashboardSummary,
  RecordPaymentPayload,
} from "../components/types";

const BASE_BILLS = "/erp/finance/bills/";
const BASE_TRANSACTIONS = "/erp/finance/transactions/";

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
};
