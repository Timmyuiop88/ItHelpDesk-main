import { Home, LogOut, MonitorSmartphone, PanelLeftClose, PanelLeftOpen, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useMatch } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { SidebarNavItem } from "./SidebarNavItem";

const links = [
  { to: "/employee", label: "Home", end: true, icon: Home },
  { to: "/employee/tickets", label: "Tickets", end: false, icon: Ticket },
  { to: "/employee/device", label: "Device", end: false, icon: MonitorSmartphone },
];

function ShellFrame() {
  const logout = useLogout();
  useTicketSocket("/employee");
  const { request, activeSession } = useEmployeeRemote();
  const viewingTicketId = useMatch("/employee/tickets/:id")?.params.id;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // The ticket page shows its own inline card for these.
  const requestOnPage =
    !!request?.ticketId && request.ticketId === viewingTicketId;
  const sessionOnPage =
    !!activeSession?.ticketId && activeSession.ticketId === viewingTicketId;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <aside
          className={`flex h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ${
            collapsed ? "w-16 items-center px-2 py-4" : "w-56 p-4"
          }`}
        >
          <div className={`mb-6 flex w-full ${collapsed ? "justify-center" : "items-center justify-between"}`}>
            <BrandMark collapsed={collapsed} />
            {!collapsed && (
              <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="shrink-0 text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="shrink-0 text-muted-foreground">
                      <PanelLeftClose className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Collapse sidebar</TooltipContent>
                </Tooltip>
              </Button>
            )}
          </div>
          {collapsed && (
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="mb-6 shrink-0 text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="mb-6 shrink-0 text-muted-foreground">
                    <PanelLeftOpen className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand sidebar</TooltipContent>
              </Tooltip>
            </Button>
          )}
          <nav className={`flex w-full flex-1 flex-col gap-1 ${collapsed ? "items-center" : ""}`}>
            {links.map((link) => (
              <SidebarNavItem key={link.to} {...link} collapsed={collapsed} />
            ))}
          </nav>

          <div className={`mt-auto flex w-full flex-col ${collapsed ? "items-center" : ""}`}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-lg" aria-label="Logout" className="text-muted-foreground" onClick={() => void logout()}>
                    <LogOut className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => void logout()}>
                <LogOut className="size-4" />
                Logout
              </Button>
            )}
          </div>
        </aside>
        <main className="flex-1 h-screen overflow-y-auto min-w-0 p-6 md:p-8 flex flex-col">
          {!sessionOnPage && <EmployeeSessionBanner session={activeSession} />}
          <Outlet />
        </main>
        <SessionRequestDialog suppressed={requestOnPage} />
      </div>
    </TooltipProvider>
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
