import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLogout } from "../../hooks/auth/useLogout";
import { useTicketSocket } from "../../hooks/tickets/useTicketSocket";
import { useTechnicianSocket } from "../../hooks/useTechnicianSocket";
import { BrandMark } from "../BrandMark";
import { DeviceAgentProvider } from "../DeviceAgentContext";
import { TechnicianSessionIndicator } from "../remote/TechnicianSessionIndicator";

const links = [
  { to: "/technician", label: "Home", end: true },
  { to: "/technician/tickets", label: "Tickets", end: false },
  { to: "/technician/devices", label: "Devices", end: false },
];

export function TechnicianLayout() {
  return (
    <DeviceAgentProvider>
      <ShellFrame />
    </DeviceAgentProvider>
  );
}

function ShellFrame() {
  const logout = useLogout();
  useTechnicianSocket();
  useTicketSocket("/technician");

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-56 flex-col border-r border-border bg-sidebar p-4 max-h-screen overflow-y-auto sticky top-0">
        <BrandMark subtitle="IT Support · Technician" className="mb-6" />
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <TechnicianSessionIndicator />
        <Button variant="outline" onClick={() => void logout()}>
          Logout
        </Button>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
