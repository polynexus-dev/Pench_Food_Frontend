import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { BASE_URL, getCityUrl } from "../utils/constants";

const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken, tenant } = useAuthStore.getState();
    // For login, city, and company fetching, always use the root domain.
    const isPublic =
      config.url?.includes("/accounts/login/") ||
      config.url?.includes("/erp/tenants/cities/") ||
      config.url?.includes("/erp/tenants/companies");

    // Guard: Block tenant-specific requests if tenant context is missing.
    // Tenant-specific requests are those to /erp/ (except cities/companies) or /ems/
    const requiresTenant =
      (config.url?.includes("/erp/") &&
        !config.url?.includes("/erp/tenants/cities/") &&
        !config.url?.includes("/erp/tenants/companies")) ||
      config.url?.includes("/ems/");

    if (requiresTenant && !tenant) {
      console.warn(`[Axios Interceptor] Blocked request to ${config.url} because tenant is not set.`);
      return Promise.reject(new Error("Tenant context is required for this request. Please select a city/tenant first."));
    }

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
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (e.g., token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid loops if the login request itself fails
      if (originalRequest.url?.includes("/accounts/login/")) {
        return Promise.reject(error);
      }

      // If the refresh request itself fails, logout and redirect
      if (originalRequest.url?.includes("/accounts/login/refresh/")) {
        useAuthStore.getState().logout();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, tenant, user } = useAuthStore.getState();
      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const refreshUrl = `${tenant ? getCityUrl(tenant) : BASE_URL}/api/accounts/login/refresh/`;
        // Use plain axios to avoid interceptor loops
        const response = await axios.post(refreshUrl, { refresh: refreshToken });
        const { access } = response.data;

        if (user) {
          useAuthStore.getState().setAuth(user, access, refreshToken);
        }

        processQueue(null, access);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
