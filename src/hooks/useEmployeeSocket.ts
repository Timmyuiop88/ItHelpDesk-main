import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { getTokenSnapshot, subscribe } from "../api/tokenStore";
import { useSocketEvent } from "../components/SocketProvider";
import { queryKeys } from "../lib/queryClient";
import { remoteSessionService } from "../services/remote-session.service";
import type {
  SessionEndedEvent,
  SessionRequestedEvent,
  SessionStartedEvent,
} from "../types/remote-session.types";

export interface EmployeeActiveSession {
  sessionId: string;
  deviceHostname: string;
  ticketId?: string;
  status: "APPROVED" | "LIVE";
  since: number;
}

const TICKET_LOOKUP_TIMEOUT_MS = 1500;

function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getTokenSnapshot, getTokenSnapshot);
}

function isExpired(request: SessionRequestedEvent): boolean {
  return new Date(request.expiresAt).getTime() <= Date.now();
}

async function lookupTicketId(sessionId: string): Promise<string | undefined> {
  const timeout = new Promise<undefined>((resolve) =>
    window.setTimeout(() => resolve(undefined), TICKET_LOOKUP_TIMEOUT_MS),
  );
  const lookup = remoteSessionService
    .getById(sessionId)
    .then((session) => session.ticketId)
    .catch(() => undefined);
  return Promise.race([lookup, timeout]);
}

export function useEmployeeSocket() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const [request, setRequest] = useState<SessionRequestedEvent | null>(null);
  const [activeSession, setActiveSession] =
    useState<EmployeeActiveSession | null>(null);
  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;

  useEffect(() => {
    if (!token) {
      setRequest(null);
      setActiveSession(null);
    }
  }, [token]);

  useSocketEvent<SessionRequestedEvent>("session:requested", async (data) => {
    if (isExpired(data)) {
      return;
    }
    const ticketId = data.ticketId ?? (await lookupTicketId(data.sessionId));
    setRequest({ ...data, ticketId });
  });

  useSocketEvent<SessionStartedEvent>("session:started", (data) => {
    setActiveSession((current) =>
      current?.sessionId === data.sessionId
        ? { ...current, status: "LIVE", since: Date.now() }
        : current,
    );
  });

  useSocketEvent<SessionEndedEvent>("session:ended", (data) => {
    setRequest((current) =>
      current?.sessionId === data.sessionId ? null : current,
    );
    if (activeSessionRef.current?.sessionId === data.sessionId) {
      toast.message("Remote session ended", {
        description: "IT Support is no longer connected to your device.",
      });
      setActiveSession(null);
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
  });

  useSocketEvent("session:expired-sweep", () => {
    setRequest((current) => (current && isExpired(current) ? null : current));
  });

  useEffect(() => {
    if (!request) {
      return;
    }

    const msLeft = new Date(request.expiresAt).getTime() - Date.now();
    if (Number.isNaN(msLeft)) {
      return;
    }
    const timer = window.setTimeout(() => setRequest(null), Math.max(msLeft, 0));
    return () => window.clearTimeout(timer);
  }, [request]);

  const clearRequest = useCallback(() => setRequest(null), []);

  const markApproved = useCallback((approved: SessionRequestedEvent) => {
    setActiveSession({
      sessionId: approved.sessionId,
      deviceHostname: approved.deviceHostname,
      ticketId: approved.ticketId,
      status: "APPROVED",
      since: Date.now(),
    });
  }, []);

  return { request, activeSession, clearRequest, markApproved };
}
