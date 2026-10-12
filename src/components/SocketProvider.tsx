import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import {
  connectSocket,
  disconnectSocket,
  updateSocketAuth,
} from "../api/socket";
import { onSessionRefreshed } from "../api/session";
import {
  clearSession,
  getTokenSnapshot,
  subscribe,
  triggerUnauthorizedHandler,
} from "../api/tokenStore";
import { queryKeys } from "../lib/queryClient";

const SocketContext = createContext<Socket | null>(null);

function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getTokenSnapshot, getTokenSnapshot);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }

    let cancelled = false;
    void connectSocket().then((s) => {
      if (!cancelled) {
        setSocket(s);
      }
    });

    return () => {
      cancelled = true;
      disconnectSocket();
      setSocket(null);
    };
  }, [token]);

  useEffect(() => {
    return onSessionRefreshed(() => {
      void updateSocketAuth();
    });
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onReconnect = () => {
      void queryClientRef.current.invalidateQueries({
        queryKey: queryKeys.tickets.all,
      });
      void queryClientRef.current.invalidateQueries({
        queryKey: ["notifications"],
      });
      void queryClientRef.current.invalidateQueries({
        queryKey: ["chat"],
      });
    };

    socket.io.on("reconnect", onReconnect);

    const onAuthRevoked = async () => {
      toast.error("Session ended", {
        description: "Your session was revoked. Please sign in again.",
      });
      await clearSession();
      triggerUnauthorizedHandler();
    };

    socket.on("auth:revoked", onAuthRevoked);

    return () => {
      socket.io.off("reconnect", onReconnect);
      socket.off("auth:revoked", onAuthRevoked);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}

export function useSocketEvent<T>(
  event: string,
  handler: (payload: T) => void,
): void {
  const socket = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) {
      return;
    }

    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
