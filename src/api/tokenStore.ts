import { isTauri } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";

const LEGACY_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const STORE_PATH = "auth-store.json";

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let cacheInitialized = false;
const listeners = new Set<() => void>();

let unauthorizedHandler: (() => void) | null = null;

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** In-memory access token — used for React auth snapshots and API calls. */
export function getAccessToken(): string | null {
  return memoryAccessToken;
}

/** @deprecated Use getAccessToken — kept for existing subscribers. */
export function getTokenSnapshot(): string | null {
  return memoryAccessToken;
}

export function getRefreshToken(): string | null {
  return memoryRefreshToken;
}

export function hasPersistedRefreshToken(): boolean {
  return memoryRefreshToken !== null;
}

export function registerUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export function triggerUnauthorizedHandler(): void {
  unauthorizedHandler?.();
}

async function readRefreshFromPersistence(): Promise<string | null> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    const refresh = await store.get<string>(REFRESH_TOKEN_KEY);
    if (refresh) {
      return refresh;
    }
    const legacy = await store.get<string>(LEGACY_TOKEN_KEY);
    if (legacy) {
      await store.set(REFRESH_TOKEN_KEY, legacy);
      await store.delete(LEGACY_TOKEN_KEY);
      await store.save();
      return legacy;
    }
    return null;
  }

  if (typeof localStorage !== "undefined") {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refresh) {
      return refresh;
    }
    const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy) {
      localStorage.setItem(REFRESH_TOKEN_KEY, legacy);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      return legacy;
    }
  }

  return null;
}

async function writeRefreshToPersistence(refreshToken: string): Promise<void> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    await store.set(REFRESH_TOKEN_KEY, refreshToken);
    await store.delete(LEGACY_TOKEN_KEY);
    await store.save();
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
}

async function removeRefreshFromPersistence(): Promise<void> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    await store.delete(REFRESH_TOKEN_KEY);
    await store.delete(LEGACY_TOKEN_KEY);
    await store.save();
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
}

export async function initTokenStore(): Promise<void> {
  if (cacheInitialized) {
    return;
  }

  memoryRefreshToken = await readRefreshFromPersistence();
  cacheInitialized = true;
  notify();
}

export async function getToken(): Promise<string | null> {
  if (!cacheInitialized) {
    await initTokenStore();
  }

  return memoryAccessToken;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export async function setSession(tokens: SessionTokens): Promise<void> {
  memoryAccessToken = tokens.accessToken;
  memoryRefreshToken = tokens.refreshToken;
  await writeRefreshToPersistence(tokens.refreshToken);
  notify();
}

export async function clearSession(): Promise<void> {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  await removeRefreshFromPersistence();
  notify();
}

/** @deprecated Use clearSession */
export async function clearToken(): Promise<void> {
  await clearSession();
}

/** @deprecated Use setSession */
export async function setToken(accessToken: string): Promise<void> {
  memoryAccessToken = accessToken;
  notify();
}
