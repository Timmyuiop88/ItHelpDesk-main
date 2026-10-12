import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { getTokenSnapshot, subscribe } from "../api/tokenStore";
import { useSocketEvent } from "../components/SocketProvider";
import { queryKeys } from "../lib/queryClient";
import { connectToSession } from "../lib/remoteConnect";
import type {
  SessionApprovedEvent,
  SessionCancelledEvent,
  SessionDeniedEvent,
  SessionEndedEvent,
} from "../types/remote-session.types";
import {
  getTechnicianSession,
  setTechnicianSession,
  subscribeTechnicianSession,
  updateTechnicianSession,
} from "./technicianSessionStore";

function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getTokenSnapshot, getTokenSnapshot);
}

export function useTechnicianSession() {
  return useSyncExternalStore(
    subscribeTechnicianSession,
    getTechnicianSession,
    getTechnicianSession,
  );
}

function isOtherSession(sessionId: string): boolean {
  const current = getTechnicianSession();
  return current !== null && current.id !== sessionId;
}

export function useTechnicianSocket() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      setTechnicianSession(null);
    }
  }, [token]);

  useSocketEvent<SessionApprovedEvent>("session:approved", (data) => {
    if (isOtherSession(data.sessionId)) {
      return;
    }
    toast.success("Employee approved remote access", {
      description: "You can connect from the remote support panel.",
    });
    updateTechnicianSession(data.sessionId, {
      status: "APPROVED",
    });
    void connectToSession(data.sessionId);
  });

  useSocketEvent<SessionDeniedEvent>("session:denied", (data) => {
    if (isOtherSession(data.sessionId)) {
      return;
    }
    toast.error("Remote access declined", {
      description: `The employee on ${data.deviceHostname} declined the request.`,
    });
    updateTechnicianSession(data.sessionId, {
      status: "DENIED",
      deviceHostname: data.deviceHostname,
    });
  });

  useSocketEvent<SessionCancelledEvent>("session:cancelled", (data) => {
    if (isOtherSession(data.sessionId)) {
      return;
    }
    toast.message("Remote request cancelled");
    updateTechnicianSession(data.sessionId, { status: "CANCELLED" });
  });

  useSocketEvent<SessionEndedEvent>("session:ended", (data) => {
    if (isOtherSession(data.sessionId)) {
      return;
    }
    if (getTechnicianSession()?.status !== "ENDED") {
      toast.message("Remote session ended");
    }
    updateTechnicianSession(data.sessionId, { status: "ENDED" });
    void queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
  });
}
