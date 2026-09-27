import { createContext, useContext, type ReactNode } from "react";
import { useDeviceAgent } from "../hooks/devices/useDeviceAgent";

type DeviceAgentState = ReturnType<typeof useDeviceAgent>;

const DeviceAgentContext = createContext<DeviceAgentState | null>(null);

export function DeviceAgentProvider({ children }: { children: ReactNode }) {
  const agent = useDeviceAgent();

  return (
    <DeviceAgentContext.Provider value={agent}>
      {children}
    </DeviceAgentContext.Provider>
  );
}

export function useDeviceAgentState(): DeviceAgentState {
  const value = useContext(DeviceAgentContext);
  if (!value) {
    throw new Error("DeviceAgentProvider is missing");
  }
  return value;
}
