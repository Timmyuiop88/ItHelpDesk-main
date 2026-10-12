import { apiGet, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  MeResponse,
  RefreshResponse,
} from "../types/auth.types";

export const authService = {
  login: (payload: LoginRequest) =>
    apiPost<LoginResponse, LoginRequest>(ENDPOINTS.auth.login, payload),
  me: () => apiGet<MeResponse>(ENDPOINTS.auth.me),
  refresh: (refreshToken: string) =>
    apiPost<RefreshResponse, { refreshToken: string }>(ENDPOINTS.auth.refresh, {
      refreshToken,
    }),
  logout: (payload: LogoutRequest) =>
    apiPost<void, LogoutRequest>(ENDPOINTS.auth.logout, payload),
};
