import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { clearStoredDeviceId, getStoredDeviceId } from "../../api/deviceStore";
import { getTokenSnapshot, subscribe } from "../../api/tokenStore";
import { getApiErrorMessage } from "../../lib/apiError";
import { collectMachineIdentity } from "../../lib/machineIdentity";
import type { Device } from "../../types/device.types";
import { useDeviceHeartbeat } from "./useDeviceHeartbeat";
import { useDeviceSocket } from "./useDeviceSocket";
import { useRegisterDevice } from "./useRegisterDevice";

const HEARTBEAT_MS = 30_000;

export type RegistrationIssue =
  | { kind: "owned-by-other"; message: string }
  | { kind: "limit-reached"; message: string }
  | { kind: "unlinked"; message: string }
  | { kind: "failed"; message: string };

function classifyRegistrationError(error: unknown): RegistrationIssue {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;

  if (status === 409) {
    return {
      kind: "owned-by-other",
      message:
        "This computer belongs to someone else. Ask them or IT to unlink it.",
    };
  }
  if (status === 403) {
    return {
      kind: "limit-reached",
      message: "Device limit reached. Unlink an old device first.",
    };
  }
  return { kind: "failed", message: getApiErrorMessage(error) };
}

function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getTokenSnapshot, getTokenSnapshot);
}

export function useDeviceAgent() {
  const token = useAuthToken();
  const register = useRegisterDevice();
  const heartbeat = useDeviceHeartbeat();
  const registerRef = useRef(register.mutateAsync);
  const heartbeatRef = useRef(heartbeat.mutate);
  registerRef.current = register.mutateAsync;
  heartbeatRef.current = heartbeat.mutate;
  const [device, setDevice] = useState<Device | null>(null);
  const [issue, setIssue] = useState<RegistrationIssue | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationRun, setRegistrationRun] = useState(0);
  const [paused, setPaused] = useState(false);
  const deviceRef = useRef(device);
  deviceRef.current = device;

  useEffect(() => {
    if (!token) {
      setDevice(null);
      setIssue(null);
      setPaused(false);
      return;
    }

    if (paused) {
      return;
    }

    let intervalId: number | undefined;
    let cancelled = false;

    const run = async () => {
      setIsRegistering(true);
      setIssue(null);

      try {
        const identity = await collectMachineIdentity();
        const registered = await registerRef.current(identity);
        if (cancelled) {
          return;
        }

        setDevice(registered);

        intervalId = window.setInterval(() => {
          heartbeatRef.current(registered.id);
        }, HEARTBEAT_MS);
      } catch (registrationError) {
        if (cancelled) {
          return;
        }

        const classified = classifyRegistrationError(registrationError);
        setIssue(classified);

        if (classified.kind !== "failed") {
          setDevice(null);
          return;
        }

        const storedId = await getStoredDeviceId();
        if (storedId) {
          setDevice(
            (current) =>
              current ?? {
                id: storedId,
                hostname: "",
                serialNumber: "",
                operatingSystem: "",
                rustdeskId: "",
                agentVersion: "",
              },
          );
        }
      } finally {
        if (!cancelled) {
          setIsRegistering(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [token, registrationRun, paused]);

  const reregister = useCallback(() => {
    setPaused(false);
    setRegistrationRun((run) => run + 1);
  }, []);

  const markUnlinked = useCallback((deviceId: string) => {
    if (deviceRef.current?.id !== deviceId) {
      return;
    }
    setPaused(true);
    setDevice(null);
    setIssue({
      kind: "unlinked",
      message: "This computer is no longer linked to your account.",
    });
    void clearStoredDeviceId();
  }, []);

  useDeviceSocket({ onUnlinked: (event) => markUnlinked(event.deviceId) });

  return {
    device,
    issue,
    error: issue?.message ?? null,
    isRegistering,
    reregister,
    markUnlinked,
  };
}
