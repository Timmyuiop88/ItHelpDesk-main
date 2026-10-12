import axios from "axios";
import { buildBaseUrl, getServerUrl } from "./serverStore";
import {
  clearSession,
  getRefreshToken,
  setSession,
  type SessionTokens,
} from "./tokenStore";
import { ENDPOINTS } from "./endpoints";

let refreshInFlight: Promise<SessionTokens> | null = null;
let proactiveTimer: ReturnType<typeof setTimeout> | null = null;

const sessionRefreshedListeners = new Set<(tokens: SessionTokens) => void>();

export function onSessionRefreshed(
  listener: (tokens: SessionTokens) => void,
): () => void {
  sessionRefreshedListeners.add(listener);
  return () => sessionRefreshedListeners.delete(listener);
}

function notifySessionRefreshed(tokens: SessionTokens): void {
  sessionRefreshedListeners.forEach((listener) => listener(tokens));
}

function decodeJwtExp(accessToken: string): number | null {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) {
      return null;
    }
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

function clearProactiveRefresh(): void {
  if (proactiveTimer !== null) {
    clearTimeout(proactiveTimer);
    proactiveTimer = null;
  }
}

export function armProactiveRefresh(accessToken: string): void {
  clearProactiveRefresh();
  const exp = decodeJwtExp(accessToken);
  if (exp === null) {
    return;
  }
  const msUntilExp = exp * 1000 - Date.now();
  const refreshIn = Math.max(msUntilExp * 0.8, 5_000);
  proactiveTimer = setTimeout(() => {
    void refreshSession().catch(() => {
      /* 401 handled by interceptor / unauthorized handler */
    });
  }, refreshIn);
}

async function postRefresh(refreshToken: string): Promise<SessionTokens> {
  const serverConfig = await getServerUrl();
  const baseURL = serverConfig
    ? buildBaseUrl(serverConfig)
    : import.meta.env.VITE_API_BASE_URL;

  const response = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${baseURL}${ENDPOINTS.auth.refresh}`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } },
  );

  return {
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
  };
}

export async function refreshSession(): Promise<SessionTokens> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("NO_REFRESH_TOKEN");
  }

  refreshInFlight = postRefresh(refreshToken)
    .then(async (tokens) => {
      await setSession(tokens);
      armProactiveRefresh(tokens.accessToken);
      notifySessionRefreshed(tokens);
      return tokens;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

/** Restore access token on app boot when a refresh token is persisted. */
export async function restoreSessionOnBoot(): Promise<boolean> {
  if (!getRefreshToken()) {
    return false;
  }
  try {
    await refreshSession();
    return true;
  } catch {
    await clearSession();
    return false;
  }
}

export function stopSessionTimers(): void {
  clearProactiveRefresh();
}
