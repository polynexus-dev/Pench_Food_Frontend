const RAW_BASE_URL = import.meta.env.VITE_API_URL || "pench.api.polynexus.in/api";

export const BASE_URL = `https://${RAW_BASE_URL}`;

export const getCityUrl = (tenant: string) => {
  return `https://${tenant}.${RAW_BASE_URL}`;
};

