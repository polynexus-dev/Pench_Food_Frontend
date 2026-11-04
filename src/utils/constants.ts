const RAW_BASE_URL = import.meta.env.VITE_API_URL || "pench.api.polynexus.in/api";

const getApiUrlConfig = () => {
  let protocol = "https://";
  let cleanUrl = RAW_BASE_URL;

  if (RAW_BASE_URL.startsWith("http://")) {
    protocol = "http://";
    cleanUrl = RAW_BASE_URL.replace("http://", "");
  } else if (RAW_BASE_URL.startsWith("https://")) {
    protocol = "https://";
    cleanUrl = RAW_BASE_URL.replace("https://", "");
  } else {
    // If no protocol is specified, check if it's localhost or an IP address
    const isLocal =
      RAW_BASE_URL.includes("localhost") ||
      RAW_BASE_URL.includes("127.0.0.1") ||
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(RAW_BASE_URL);
    protocol = isLocal ? "http://" : "https://";
  }

  // Extract hostname to check if it's a raw IP address (e.g. 192.168.1.196)
  const hostPart = cleanUrl.split('/')[0].split(':')[0];
  const isRawIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostPart);

  if (isRawIp) {
    const portAndPath = cleanUrl.substring(hostPart.length);
    cleanUrl = `${hostPart}.nip.io${portAndPath}`;
  }

  return { protocol, cleanUrl };
};

const { protocol, cleanUrl } = getApiUrlConfig();

export const BASE_URL = `${protocol}${cleanUrl}`;

export const getCityUrl = (tenant: string) => {
  const subdomain = tenant.replace(/_/g, "-");
  return `${protocol}${subdomain}.${cleanUrl}`;
};

// Clean host by removing trailing /api or api
export const cleanHost = cleanUrl.replace(/\/api\/?$/, "");

// Determine default WebSocket protocol based on the REST protocol
export const DEFAULT_WS_PROTOCOL = protocol === "https://" ? "wss" : "ws";

// Generate websocket URL dynamically for a given tenant/city
export const getCityWsUrl = (tenant: string, wsProtocol: "ws" | "wss" = DEFAULT_WS_PROTOCOL) => {
  const subdomain = tenant.replace(/_/g, "-");
  return `${wsProtocol}://${subdomain}.${cleanHost}/ws/tracking/`;
};

/**
 * Safely resolves relative or mixed-protocol media file URLs (such as payment screenshots, avatars, POD images)
 * to an absolute HTTPS URL against the appropriate tenant or base domain.
 */
export const resolveMediaUrl = (url?: string | null, tenant?: string | null): string => {
  if (!url) return "";
  let finalUrl = url.trim();

  // If relative path like "/media/online_payments/..."
  if (finalUrl.startsWith("/")) {
    const baseOrigin = tenant ? getCityUrl(tenant).replace(/\/api\/?$/, "") : BASE_URL.replace(/\/api\/?$/, "");
    finalUrl = `${baseOrigin}${finalUrl}`;
  }

  // Force HTTPS if running on HTTPS to prevent Mixed Content blocking in browsers
  if (typeof window !== "undefined" && window.location.protocol === "https:" && finalUrl.startsWith("http://")) {
    finalUrl = finalUrl.replace(/^http:\/\//i, "https://");
  }

  return finalUrl;
};
