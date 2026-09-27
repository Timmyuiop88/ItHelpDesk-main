import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  initTokenStore,
  registerUnauthorizedHandler,
} from "../api/tokenStore";

export function AuthSetup({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      navigate("/login", { replace: true });
    });

    void initTokenStore().then(() => {
      setReady(true);
    });
  }, [navigate]);

  if (!ready) {
    return (
      <main className="container">
        <p>Loading...</p>
      </main>
    );
  }

  return children;
}
