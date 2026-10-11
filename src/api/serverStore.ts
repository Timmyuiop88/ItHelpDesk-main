import { isTauri } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";

const STORE_PATH = "auth-store.json";
const SERVER_URL_KEY = "server_url";
const SERVER_HTTPS_KEY = "server_https";
const SERVER_PORT_KEY = "server_port";

export interface ServerConfig {
  host: string;
  https: boolean;
  port: number | null;
}

let memoryConfig: ServerConfig | null = null;
let cacheInitialized = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeServer(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getServerSnapshot(): ServerConfig | null {
  return memoryConfig;
}

function parsePort(value: unknown): number | null {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : null;
}

async function readFromPersistence(): Promise<ServerConfig | null> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    const host = await store.get<string>(SERVER_URL_KEY);
    const https = await store.get<boolean>(SERVER_HTTPS_KEY);
    const port = await store.get<number>(SERVER_PORT_KEY);
    if (host) {
      return { host, https: https ?? true, port: parsePort(port) };
    }
    return null;
  }

  if (typeof localStorage !== "undefined") {
    const host = localStorage.getItem(SERVER_URL_KEY);
    const https = localStorage.getItem(SERVER_HTTPS_KEY);
    const port = localStorage.getItem(SERVER_PORT_KEY);
    if (host) {
      return { host, https: https !== "false", port: parsePort(port) };
    }
    return null;
  }

  return null;
}

async function writeToPersistence(config: ServerConfig): Promise<void> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    await store.set(SERVER_URL_KEY, config.host);
    await store.set(SERVER_HTTPS_KEY, config.https);
    if (config.port) {
      await store.set(SERVER_PORT_KEY, config.port);
    } else {
      await store.delete(SERVER_PORT_KEY);
    }
    await store.save();
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SERVER_URL_KEY, config.host);
    localStorage.setItem(SERVER_HTTPS_KEY, String(config.https));
    if (config.port) {
      localStorage.setItem(SERVER_PORT_KEY, String(config.port));
    } else {
      localStorage.removeItem(SERVER_PORT_KEY);
    }
  }
}

async function removeFromPersistence(): Promise<void> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    await store.delete(SERVER_URL_KEY);
    await store.delete(SERVER_HTTPS_KEY);
    await store.delete(SERVER_PORT_KEY);
    await store.save();
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(SERVER_URL_KEY);
    localStorage.removeItem(SERVER_HTTPS_KEY);
    localStorage.removeItem(SERVER_PORT_KEY);
  }
}

export async function initServerStore(): Promise<void> {
  if (cacheInitialized) return;
  memoryConfig = await readFromPersistence();
  cacheInitialized = true;
  notify();
}

export async function getServerUrl(): Promise<ServerConfig | null> {
  if (!cacheInitialized) await initServerStore();
  return memoryConfig;
}

export async function setServerUrl(config: ServerConfig): Promise<void> {
  memoryConfig = config;
  await writeToPersistence(config);
  notify();
}

export async function clearServerUrl(): Promise<void> {
  memoryConfig = null;
  cacheInitialized = false;
  await removeFromPersistence();
  notify();
}

/** Returns the full base URL, e.g. "https://itback.onrender.com" or "http://192.168.1.6:3000" */
export function buildBaseUrl(config: ServerConfig): string {
  const protocol = config.https ? "https" : "http";
  const port = config.port ? `:${config.port}` : "";
  return `${protocol}://${config.host}${port}`;
}

/** Returns the WebSocket URL, e.g. "https://itback.onrender.com/ws" */
export function buildWsUrl(config: ServerConfig): string {
  return `${buildBaseUrl(config)}/ws`;
}
