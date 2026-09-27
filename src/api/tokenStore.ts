import { isTauri } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";

const TOKEN_KEY = "auth_token";
const STORE_PATH = "auth-store.json";

let memoryToken: string | null = null;
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

export function getTokenSnapshot(): string | null {
  return memoryToken;
}

export function registerUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export function triggerUnauthorizedHandler(): void {
  unauthorizedHandler?.();
}

async function readTokenFromPersistence(): Promise<string | null> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    const token = await store.get<string>(TOKEN_KEY);
    return token ?? null;
  }

  if (typeof localStorage !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }

  return null;
}

async function writeTokenToPersistence(token: string): Promise<void> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    await store.set(TOKEN_KEY, token);
    await store.save();
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

async function removeTokenFromPersistence(): Promise<void> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    await store.delete(TOKEN_KEY);
    await store.save();
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function initTokenStore(): Promise<void> {
  if (cacheInitialized) {
    return;
  }

  memoryToken = await readTokenFromPersistence();
  cacheInitialized = true;
  notify();
}

export async function getToken(): Promise<string | null> {
  if (!cacheInitialized) {
    await initTokenStore();
  }

  return memoryToken;
}

export async function setToken(token: string): Promise<void> {
  memoryToken = token;
  await writeTokenToPersistence(token);
  notify();
}

export async function clearToken(): Promise<void> {
  memoryToken = null;
  await removeTokenFromPersistence();
  notify();
}
