import type { OrderPaymentStatus } from "./types";

const PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  pending: "Pending",
  verification_pending: "Verification Pending",
  paid: "Paid",
  failed: "Failed",
};

const PAYMENT_STATUS_STYLES: Record<OrderPaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-600 border border-amber-100",
  verification_pending: "bg-sky-50 text-sky-700 border border-sky-100",
  paid: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  failed: "bg-rose-50 text-rose-600 border border-rose-100",
};

export const getPaymentStatusLabel = (status?: OrderPaymentStatus) =>
  PAYMENT_STATUS_LABELS[status ?? "pending"] ?? PAYMENT_STATUS_LABELS.pending;

export const getPaymentStatusStyle = (status?: OrderPaymentStatus) =>
  PAYMENT_STATUS_STYLES[status ?? "pending"] ?? PAYMENT_STATUS_STYLES.pending;
