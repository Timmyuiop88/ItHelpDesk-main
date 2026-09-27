import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { connectSocket, disconnectSocket } from "../api/socket";
import { getTokenSnapshot, subscribe } from "../api/tokenStore";
import { queryKeys } from "../lib/queryClient";
import { connectToSession } from "../lib/remoteConnect";
import type {
  SessionApprovedEvent,
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

export function useTechnicianSocket() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      setTechnicianSession(null);
      return;
    }

    const socket = connectSocket(token);

    const isOtherSession = (sessionId: string) => {
      const current = getTechnicianSession();
      return current !== null && current.id !== sessionId;
    };

    const onApproved = (data: SessionApprovedEvent) => {
      if (isOtherSession(data.sessionId)) {
        return;
      }
      toast.success("Employee approved remote access", {
        description: "Opening RustDesk…",
      });
      updateTechnicianSession(data.sessionId, {
        status: "APPROVED",
        rustdeskLink: data.rustdeskLink,
      });
      void connectToSession(data.sessionId, data.rustdeskLink);
    };

    const onDenied = (data: SessionDeniedEvent) => {
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
    };

    const onEnded = (data: SessionEndedEvent) => {
      if (isOtherSession(data.sessionId)) {
        return;
      }
      if (getTechnicianSession()?.status !== "ENDED") {
        toast.message("Remote session ended");
      }
      updateTechnicianSession(data.sessionId, { status: "ENDED" });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
    };

    socket.on("session:approved", onApproved);
    socket.on("session:denied", onDenied);
    socket.on("session:ended", onEnded);

    return () => {
      socket.off("session:approved", onApproved);
      socket.off("session:denied", onDenied);
      socket.off("session:ended", onEnded);
      disconnectSocket();
    };
  }, [token, queryClient]);
}
