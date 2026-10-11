import axios, { type AxiosError } from "axios";
import {
  clearToken,
  getToken,
  triggerUnauthorizedHandler,
} from "./tokenStore";
import { buildBaseUrl, getServerUrl } from "./serverStore";

const apiClient = axios.create({
  // baseURL is set lazily on each request via the interceptor below,
  // so it picks up the runtime server URL instead of a build-time env var.
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  // Attach auth token
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach base URL from persistent server config (falls back to env var)
  if (!config.baseURL) {
    const serverConfig = await getServerUrl();
    config.baseURL = serverConfig
      ? buildBaseUrl(serverConfig)
      : import.meta.env.VITE_API_BASE_URL;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearToken();
      triggerUnauthorizedHandler();
    }

    return Promise.reject(error);
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
