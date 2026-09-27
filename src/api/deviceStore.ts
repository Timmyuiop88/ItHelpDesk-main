import { isTauri } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";

const STORE_PATH = "auth-store.json";
const SERIAL_KEY = "device_serial";
const DEVICE_ID_KEY = "device_id";
const RUSTDESK_ID_KEY = "rustdesk_id";

async function readValue(key: string): Promise<string | null> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    const value = await store.get<string>(key);
    return value ?? null;
  }

  if (typeof localStorage !== "undefined") {
    return localStorage.getItem(key);
  }

  return null;
}

async function writeValue(key: string, value: string): Promise<void> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    await store.set(key, value);
    await store.save();
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
  }
}

export async function getOrCreateSerialNumber(): Promise<string> {
  const existing = await readValue(SERIAL_KEY);
  if (existing) {
    return existing;
  }

  const serial = crypto.randomUUID();
  await writeValue(SERIAL_KEY, serial);
  return serial;
}

export async function getManualRustdeskId(): Promise<string | null> {
  return readValue(RUSTDESK_ID_KEY);
}

export async function setManualRustdeskId(id: string): Promise<void> {
  await writeValue(RUSTDESK_ID_KEY, id);
}

export async function clearManualRustdeskId(): Promise<void> {
  if (isTauri()) {
    const store = await load(STORE_PATH);
    await store.delete(RUSTDESK_ID_KEY);
    await store.save();
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(RUSTDESK_ID_KEY);
  }
}

export async function getStoredDeviceId(): Promise<string | null> {
  return readValue(DEVICE_ID_KEY);
}

export async function setStoredDeviceId(id: string): Promise<void> {
  await writeValue(DEVICE_ID_KEY, id);
}
