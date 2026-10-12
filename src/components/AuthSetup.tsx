import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  initTokenStore,
  registerUnauthorizedHandler,
} from "../api/tokenStore";
import { restoreSessionOnBoot } from "../api/session";
import { initServerStore, getServerUrl } from "../api/serverStore";
import { SocketProvider } from "./SocketProvider";
import { ServerSetupPage } from "../pages/ServerSetupPage";

export function AuthSetup({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasServer, setHasServer] = useState<boolean | null>(null);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      navigate("/login", { replace: true });
    });

    void Promise.all([initTokenStore(), initServerStore()]).then(async () => {
      const config = await getServerUrl();
      setHasServer(config !== null);
      if (config !== null) {
        await restoreSessionOnBoot();
      }
      setReady(true);
    });
  }, [navigate]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!hasServer) {
    return (
      <ServerSetupPage
        onConfigured={() => {
          setHasServer(true);
        }}
      />
    );
  }

  return <SocketProvider>{children}</SocketProvider>;
}
