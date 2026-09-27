import { invoke, isTauri } from "@tauri-apps/api/core";
import { hostname, platform, version } from "@tauri-apps/plugin-os";
import { getManualRustdeskId, getOrCreateSerialNumber } from "../api/deviceStore";
import type { RegisterDevicePayload } from "../types/device.types";

const AGENT_VERSION = "0.1.0";

async function detectRustdeskId(): Promise<string | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    return await invoke<string | null>("get_rustdesk_id");
  } catch {
    return null;
  }
}

export async function resolveRustdeskId(): Promise<string> {
  return (
    (await getManualRustdeskId()) ??
    (await detectRustdeskId()) ??
    import.meta.env.VITE_RUSTDESK_ID ??
    ""
  );
}

export async function collectMachineIdentity(): Promise<RegisterDevicePayload> {
  const serialNumber = await getOrCreateSerialNumber();
  const rustdeskId = await resolveRustdeskId();

  if (isTauri()) {
    let host = "unknown-host";
    try {
      host = (await hostname()) ?? "unknown-host";
    } catch {
      // os:allow-hostname may be missing; still register the device
    }

    const osName = platform();
    const osVersion = version();

    return {
      hostname: host,
      serialNumber,
      operatingSystem: `${osName} ${osVersion}`.trim(),
      agentVersion: AGENT_VERSION,
      ...(rustdeskId ? { rustdeskId } : {}),
    };
  }

  return {
    hostname: "browser-host",
    serialNumber,
    operatingSystem: navigator.userAgent,
    agentVersion: AGENT_VERSION,
    ...(rustdeskId ? { rustdeskId } : {}),
  };
}
