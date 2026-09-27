import { apiGet, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
} from "../types/auth.types";

export const authService = {
  login: (payload: LoginRequest) =>
    apiPost<LoginResponse, LoginRequest>(ENDPOINTS.auth.login, payload),
  me: () => apiGet<MeResponse>(ENDPOINTS.auth.me),
};
