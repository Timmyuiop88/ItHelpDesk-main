import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useApproveSession } from "../../hooks/remote-sessions/useApproveSession";
import { useConsentSession } from "../../hooks/remote-sessions/useConsentSession";
import { useDenySession } from "../../hooks/remote-sessions/useDenySession";
import { useEmployeeSocket } from "../../hooks/useEmployeeSocket";
import { getApiErrorMessage } from "../../lib/apiError";
import { ensureRustdeskRunning } from "../../lib/remoteConnect";
import type { Ticket } from "../../types/ticket.types";
import { useDeviceAgentState } from "../DeviceAgentContext";

function useEmployeeRemoteState() {
  const socket = useEmployeeSocket();
  const approve = useApproveSession();
  const consent = useConsentSession();
  const deny = useDenySession();
  const agent = useDeviceAgentState();
  const { request, clearRequest, markApproved } = socket;

  const [launching, setLaunching] = useState(false);

  const pendingAction: "approve" | "deny" | null =
    launching || approve.isPending
      ? "approve"
      : deny.isPending
        ? "deny"
        : null;

  const allow = async () => {
    if (!request || launching) return;
    setLaunching(true);
    const ready = await ensureRustdeskRunning();
    setLaunching(false);
    if (!ready) return;
    approve.mutate(request.sessionId, {
      onSuccess: () => {
        consent.mutate(request.sessionId, {
          onSettled: () => {
            markApproved(request);
            clearRequest();
          },
        });
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  const decline = () => {
    if (!request) return;
    deny.mutate(request.sessionId, {
      onSuccess: () => {
        toast("Remote access declined", {
          description: "IT Support has been notified.",
        });
        clearRequest();
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  // Without a ticketId from the backend, fall back to the ticket's device.
  const belongsTo = (ticket: Ticket, ticketId: string | undefined) =>
    ticketId
      ? ticketId === ticket.id
      : ticket.status !== "CLOSED" &&
        !!ticket.deviceId &&
        ticket.deviceId === agent.device?.id;

  return {
    request: socket.request,
    activeSession: socket.activeSession,
    pendingAction,
    allow,
    decline,
    requestFor: (ticket: Ticket) =>
      request && belongsTo(ticket, request.ticketId) ? request : null,
    sessionFor: (ticket: Ticket) =>
      socket.activeSession && belongsTo(ticket, socket.activeSession.ticketId)
        ? socket.activeSession
        : null,
  };
}

type EmployeeRemoteState = ReturnType<typeof useEmployeeRemoteState>;

const EmployeeRemoteContext = createContext<EmployeeRemoteState | null>(null);

export function EmployeeRemoteProvider({ children }: { children: ReactNode }) {
  const state = useEmployeeRemoteState();
  return (
    <EmployeeRemoteContext.Provider value={state}>
      {children}
    </EmployeeRemoteContext.Provider>
  );
}

export function useEmployeeRemote(): EmployeeRemoteState {
  const value = useContext(EmployeeRemoteContext);
  if (!value) {
    throw new Error("EmployeeRemoteProvider is missing");
  }
  return value;
}
