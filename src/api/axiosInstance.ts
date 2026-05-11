import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

import { BASE_URL, getCityUrl } from "../utils/constants";

const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken, tenant } = useAuthStore.getState();

    // For login and city fetching, always use the root domain.
    const isPublic =
      config.url?.includes("/accounts/login/") ||
      config.url?.includes("/erp/tenants/cities/");

    if (isPublic) {
      config.baseURL = BASE_URL;
    } else if (tenant) {
      config.baseURL = getCityUrl(tenant);
    } else {
      config.baseURL = BASE_URL;
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized errors (e.g., token expired)
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      // Optional: Redirect to login or show alert
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
