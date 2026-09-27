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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "../components/BrandMark";
import { useLogin } from "../hooks/auth/useLogin";
import { getApiErrorMessage } from "../lib/apiError";
import { getHomeRouteForRole } from "../lib/roles";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          navigate(getHomeRouteForRole(data.user.role), { replace: true });
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#e8f5ee_0%,#ffffff_45%,#fff8db_100%)] p-6">
      <Card className="w-full max-w-md border-border/80 shadow-sm">
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
              {login.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
