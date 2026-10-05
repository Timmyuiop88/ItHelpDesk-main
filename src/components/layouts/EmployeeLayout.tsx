import { NavLink, Outlet, useMatch } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLogout } from "../../hooks/auth/useLogout";
import { useTicketSocket } from "../../hooks/tickets/useTicketSocket";
import { BrandMark } from "../BrandMark";
import { DeviceAgentProvider } from "../DeviceAgentContext";
import { EmployeeSessionBanner } from "../remote/EmployeeSessionBanner";
import {
  EmployeeRemoteProvider,
  useEmployeeRemote,
} from "../remote/EmployeeRemoteContext";
import { SessionRequestDialog } from "../SessionRequestDialog";

const links = [
  { to: "/employee", label: "Home", end: true },
  { to: "/employee/tickets", label: "Tickets", end: false },
  { to: "/employee/device", label: "Device", end: false },
];

function ShellFrame() {
  const logout = useLogout();
  useTicketSocket("/employee");
  const { request, activeSession } = useEmployeeRemote();
  const viewingTicketId = useMatch("/employee/tickets/:id")?.params.id;

  // The ticket page shows its own inline card for these.
  const requestOnPage =
    !!request?.ticketId && request.ticketId === viewingTicketId;
  const sessionOnPage =
    !!activeSession?.ticketId && activeSession.ticketId === viewingTicketId;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-56 flex-col border-r border-border bg-sidebar p-4 max-h-screen overflow-y-auto">
        <BrandMark className="mb-6" />
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
        <Button variant="outline" onClick={() => void logout()}>
          Logout
        </Button>
      </aside>
      <main className="flex-1 p-8">
        {!sessionOnPage && <EmployeeSessionBanner session={activeSession} />}
        <Outlet />
      </main>
      <SessionRequestDialog suppressed={requestOnPage} />
    </div>
  );
}

export function EmployeeLayout() {
  return (
    <DeviceAgentProvider>
      <EmployeeRemoteProvider>
        <ShellFrame />
      </EmployeeRemoteProvider>
    </DeviceAgentProvider>
  );
}
