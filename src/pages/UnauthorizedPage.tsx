import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandMark } from "../components/BrandMark";
import { useLogout } from "../hooks/auth/useLogout";

export function UnauthorizedPage() {
  const logout = useLogout();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#e8f5ee_0%,#ffffff_45%,#fff8db_100%)] p-6">
      <Card className="w-full max-w-md">
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
    </main>
  );
}
