import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthBackground } from "../components/auth/AuthBackground";
import { BrandMark } from "../components/BrandMark";
import { useLogout } from "../hooks/auth/useLogout";

export function UnauthorizedPage() {
  const logout = useLogout();

  return (
    <AuthBackground videoSrc="auth.mov">
      <Card className="w-full max-w-md border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader>
          <BrandMark className="mb-4" subtitle="IT Support Desk" />
          <CardTitle>Admin access not available here</CardTitle>
          <CardDescription>
            Admin access is available on the web portal. ECOWAS IT Support on
            desktop supports employee and technician accounts only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void logout()}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </AuthBackground>
  );
}
