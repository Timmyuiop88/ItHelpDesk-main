import { useCallback, useEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { getStoredDeviceId } from "../../api/deviceStore";
import { getTokenSnapshot, subscribe } from "../../api/tokenStore";
import { getApiErrorMessage } from "../../lib/apiError";
import { collectMachineIdentity } from "../../lib/machineIdentity";
import type { Device } from "../../types/device.types";
import { useDeviceHeartbeat } from "./useDeviceHeartbeat";
import { useRegisterDevice } from "./useRegisterDevice";

const HEARTBEAT_MS = 30_000;

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
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationRun, setRegistrationRun] = useState(0);

  useEffect(() => {
    if (!token) {
      setDevice(null);
      setError(null);
      return;
    }

    let intervalId: number | undefined;
    let cancelled = false;

    const run = async () => {
      setIsRegistering(true);
      setError(null);

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
        if (!cancelled) {
          setError(getApiErrorMessage(registrationError));
          const storedId = await getStoredDeviceId();
          if (storedId) {
            setDevice((current) =>
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
  }, [token, registrationRun]);

  const reregister = useCallback(() => {
    setRegistrationRun((run) => run + 1);
  }, []);

  return { device, error, isRegistering, reregister };
}
