export const BASE_URL = "https://pench.api.polynexus.in/api/";

export const getCityUrl = (tenant: string) => {
  return `https://${tenant}.pench.api.polynexus.in/api/`;
};
