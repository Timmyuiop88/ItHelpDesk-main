import { Globe, Hash, Lock, LockOpen } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBackground } from "../components/auth/AuthBackground";
import { BrandMark } from "../components/BrandMark";
import { setServerUrl } from "../api/serverStore";

interface ServerSetupPageProps {
  onConfigured: () => void;
}

export function ServerSetupPage({ onConfigured }: ServerSetupPageProps) {
  const [host, setHost] = useState("");
  const [useHttps, setUseHttps] = useState(true);
  const [port, setPort] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let cleaned = host
      .trim()
      .replace(/^https?:\/\//i, "") // strip accidental protocol prefix
      .replace(/\/+$/, "");         // strip trailing slashes

    let portValue = port.trim();
    const inlinePort = cleaned.match(/:(\d+)$/);
    if (inlinePort) {
      cleaned = cleaned.slice(0, inlinePort.index);
      if (!portValue) portValue = inlinePort[1];
    }

    if (!cleaned) {
      toast.error("Please enter a server address.");
      return;
    }

    let parsedPort: number | null = null;
    if (!useHttps) {
      parsedPort = Number(portValue);
      if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
        toast.error("Please enter a valid port (1–65535).");
        return;
      }
    }

    setSaving(true);
    try {
      await setServerUrl({ host: cleaned, https: useHttps, port: parsedPort });
      toast.success("Server configured. You can now sign in.");
      onConfigured();
    } catch {
      toast.error("Failed to save server settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthBackground videoSrc="auth.mov">
      <Card className="w-full max-w-md border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="items-center text-center">
          <BrandMark size="lg" subtitle="IT Support Desk" className="mb-2 flex-col items-center text-center" />
          <CardTitle className="mt-2">Connect to your server</CardTitle>
          <CardDescription>
            Enter the address of your IT Help Desk server to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-5" onSubmit={(e) => void handleSubmit(e)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="server-host" className="flex items-center gap-1.5">
                <Globe className="size-3.5 text-muted-foreground" />
                Server address
              </Label>
              <Input
                id="server-host"
                type="text"
                placeholder="company.com"
                value={host}
                onChange={(e) => setHost(e.currentTarget.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
              <p className="text-xs text-muted-foreground">
                Hostname or IP only — no http:// or trailing slash.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2">
                {useHttps
                  ? <Lock className="size-4 text-primary" />
                  : <LockOpen className="size-4 text-amber-600" />
                }
                <div>
                  <p className="text-sm font-medium">
                    {useHttps ? "Use HTTPS (secure)" : "Use HTTP (insecure)"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {useHttps
                      ? "Recommended for production servers."
                      : "Only for local / dev servers."
                    }
                  </p>
                </div>
              </div>
              {/* Simple toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={useHttps}
                onClick={() => setUseHttps((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  useHttps ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              >
                <span
                  className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                    useHttps ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {!useHttps && (
              <div className="flex flex-col gap-2 animate-in fade-in-0 slide-in-from-top-1">
                <Label htmlFor="server-port" className="flex items-center gap-1.5">
                  <Hash className="size-3.5 text-muted-foreground" />
                  Port
                </Label>
                <Input
                  id="server-port"
                  type="text"
                  inputMode="numeric"
                  placeholder="3000"
                  value={port}
                  onChange={(e) => setPort(e.currentTarget.value.replace(/\D/g, ""))}
                  maxLength={5}
                  autoComplete="off"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Will connect to{" "}
                  <span className="font-mono text-foreground">
                    http://{host.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "").replace(/:\d+$/, "") || "server"}:{port || "port"}
                  </span>
                </p>
              </div>
            )}

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Connecting…" : "Connect"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthBackground>
  );
}
