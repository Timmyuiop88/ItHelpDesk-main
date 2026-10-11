import { io, type Socket } from "socket.io-client";
import { buildWsUrl, getServerUrl } from "./serverStore";

let socket: Socket | null = null;

export async function connectSocket(token: string): Promise<Socket> {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const serverConfig = await getServerUrl();
  const wsUrl = serverConfig
    ? buildWsUrl(serverConfig)
    : import.meta.env.VITE_WS_URL;

  socket = io(wsUrl, {
    auth: { token },
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
