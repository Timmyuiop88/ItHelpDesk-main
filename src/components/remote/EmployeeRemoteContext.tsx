import { createContext, useContext, type ReactNode } from "react";
import { toast } from "sonner";
import { useApproveSession } from "../../hooks/remote-sessions/useApproveSession";
import { useDenySession } from "../../hooks/remote-sessions/useDenySession";
import { useEmployeeSocket } from "../../hooks/useEmployeeSocket";
import { getApiErrorMessage } from "../../lib/apiError";
import type { Ticket } from "../../types/ticket.types";
import { useDeviceAgentState } from "../DeviceAgentContext";

function useEmployeeRemoteState() {
  const socket = useEmployeeSocket();
  const approve = useApproveSession();
  const deny = useDenySession();
  const agent = useDeviceAgentState();
  const { request, clearRequest, markApproved } = socket;

  const pendingAction: "approve" | "deny" | null = approve.isPending
    ? "approve"
    : deny.isPending
      ? "deny"
      : null;

  const allow = () => {
    if (!request) return;
    approve.mutate(request.sessionId, {
      onSuccess: () => {
        markApproved(request);
        clearRequest();
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
