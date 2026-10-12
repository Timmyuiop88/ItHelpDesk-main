import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { refreshSession } from "./session";
import {
  clearSession,
  getToken,
  triggerUnauthorizedHandler,
} from "./tokenStore";
import { buildBaseUrl, getServerUrl } from "./serverStore";

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _rateLimitRetry?: number;
};

const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

function isAuthRoute(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  return url.includes("/auth/login") || url.includes("/auth/refresh");
}

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!config.baseURL) {
    const serverConfig = await getServerUrl();
    config.baseURL = serverConfig
      ? buildBaseUrl(serverConfig)
      : import.meta.env.VITE_API_BASE_URL;
  }

  return config;
});

function parseRetryAfterMs(
  headers: Record<string, string | undefined> | undefined,
): number {
  const raw = headers?.["retry-after"];
  if (!raw) {
    return 1000;
  }
  const seconds = Number(raw);
  if (!Number.isNaN(seconds)) {
    return Math.min(Math.max(seconds * 1000, 500), 30_000);
  }
  const date = Date.parse(raw);
  if (!Number.isNaN(date)) {
    return Math.min(Math.max(date - Date.now(), 500), 30_000);
  }
  return 1000;
}

function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * 250);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (status === 429 && config && (config.method ?? "get").toLowerCase() === "get") {
      const attempts = config._rateLimitRetry ?? 0;
      if (attempts < 2) {
        config._rateLimitRetry = attempts + 1;
        await sleep(
          jitter(
            parseRetryAfterMs(
              error.response?.headers as Record<string, string | undefined> | undefined,
            ),
          ),
        );
        return apiClient(config);
      }
    }

    if (status !== 401 || !config) {
      return Promise.reject(error);
    }

    if (isAuthRoute(config.url)) {
      return Promise.reject(error);
    }

    if (config._retry) {
      await clearSession();
      triggerUnauthorizedHandler();
      return Promise.reject(error);
    }

    try {
      await refreshSession();
      config._retry = true;
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return apiClient(config);
    } catch {
      await clearSession();
      triggerUnauthorizedHandler();
      return Promise.reject(error);
    }
  },
);

export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}

export async function apiPost<T, D>(url: string, data: D): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

export async function apiPut<T, D>(url: string, data: D): Promise<T> {
  const response = await apiClient.put<T>(url, data);
  return response.data;
}

export async function apiPatch<T, D>(url: string, data: D): Promise<T> {
  const response = await apiClient.patch<T>(url, data);
  return response.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiClient.delete<T>(url);
  return response.data;
}

export async function apiPostWithHeaders<T, D>(
  url: string,
  data: D,
  headers: Record<string, string>,
): Promise<T> {
  const response = await apiClient.post<T>(url, data, { headers });
  return response.data;
}
