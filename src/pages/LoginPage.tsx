import { AlertTriangle } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBackground } from "../components/auth/AuthBackground";
import { BrandMark } from "../components/BrandMark";
import { clearServerUrl } from "../api/serverStore";
import { useLogin } from "../hooks/auth/useLogin";
import { getLoginErrorMessage } from "../lib/apiError";
import { getHomeRouteForRole } from "../lib/roles";

const CONFIRM_PHRASE = "change server";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [changingServer, setChangingServer] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const confirmed = confirmText.trim().toLowerCase() === CONFIRM_PHRASE;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          navigate(getHomeRouteForRole(data.user.role), { replace: true });
        },
        onError: (error) => {
          toast.error(getLoginErrorMessage(error));
        },
      },
    );
  };

  const handleConfirmOpenChange = (open: boolean) => {
    if (!open) setConfirmText("");
    setConfirmOpen(open);
  };

  const handleChangeServer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmed) return;

    setChangingServer(true);
    try {
      await clearServerUrl();
      // Reload the page so AuthSetup re-runs the server gate
      window.location.reload();
    } catch {
      toast.error("Could not clear server settings.");
      setChangingServer(false);
    }
  };

  return (
    <AuthBackground>
      <Card className="w-full max-w-md border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="items-center text-center">
          <BrandMark
            size="lg"
            subtitle="IT Support Desk"
            className="mb-2 flex-col items-center text-center"
          />
          <CardTitle className="sr-only">ECOWAS IT Support Desk</CardTitle>
          <CardDescription>Sign in with your work account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                required
              />
            </div>
            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              Change server (for technicians only)
            </button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={handleConfirmOpenChange}>
        <DialogContent className="border-t-4 border-destructive sm:max-w-md">
          <form className="flex flex-col gap-4" onSubmit={(e) => void handleChangeServer(e)}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="size-5 text-destructive" />
                </div>
                <DialogTitle className="text-destructive">Are you a technician?</DialogTitle>
              </div>
              <DialogDescription>
                Changing the server disconnects this app from your organisation's help desk.
                Only IT technicians should do this. If you're not sure, cancel and contact IT Support.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              The saved server address will be removed and you'll need to enter a new one before anyone can sign in.
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-change-server">
                Type <span className="font-mono font-semibold text-destructive">{CONFIRM_PHRASE}</span> to continue
              </Label>
              <Input
                id="confirm-change-server"
                value={confirmText}
                onChange={(e) => setConfirmText(e.currentTarget.value)}
                placeholder={CONFIRM_PHRASE}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                aria-invalid={confirmText.length > 0 && !confirmed}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleConfirmOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={!confirmed || changingServer}
              >
                {changingServer ? "Clearing…" : "Change server"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthBackground>
  );
}
