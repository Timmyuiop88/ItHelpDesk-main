import { io, type Socket } from "socket.io-client";
import { getToken } from "./tokenStore";
import { buildWsUrl, getServerUrl } from "./serverStore";
import { refreshSession } from "./session";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export async function connectSocket(): Promise<Socket> {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const serverConfig = await getServerUrl();
  const wsUrl = serverConfig
    ? buildWsUrl(serverConfig)
    : import.meta.env.VITE_WS_URL;

  const token = await getToken();

  socket = io(wsUrl, {
    auth: { token: token ?? "" },
    reconnection: true,
  });

  socket.io.on("reconnect_attempt", () => {
    void (async () => {
      const fresh = await getToken();
      if (socket) {
        socket.auth = { token: fresh ?? "" };
      }
    })();
  });

  socket.on("connect_error", (err: Error) => {
    const message = err.message.toLowerCase();
    if (!message.includes("unauthorized") && !message.includes("jwt")) {
      return;
    }
    void (async () => {
      try {
        await refreshSession();
        const fresh = await getToken();
        if (socket && fresh) {
          socket.auth = { token: fresh };
          socket.connect();
        }
      } catch {
        /* logout handled elsewhere */
      }
    })();
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export async function updateSocketAuth(): Promise<void> {
  const fresh = await getToken();
  if (socket && fresh) {
    socket.auth = { token: fresh };
    if (!socket.connected) {
      socket.connect();
    }
  }
}
