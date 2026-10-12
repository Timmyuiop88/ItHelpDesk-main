import {
  Home,
  LogOut,
  MessageCircle,
  MonitorSmartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Ticket,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLogout } from "../../hooks/auth/useLogout";
import { useNotificationSocket } from "../../hooks/notifications/useNotificationSocket";
import { useTicketSocket } from "../../hooks/tickets/useTicketSocket";
import { useTechnicianSocket } from "../../hooks/useTechnicianSocket";
import { BrandMark } from "../BrandMark";
import { NotificationBell } from "../notifications/NotificationBell";
import { TechnicianAvailabilityControl } from "../technicians/TechnicianAvailabilityControl";
import { DeviceAgentProvider } from "../DeviceAgentContext";
import { TechnicianSessionIndicator } from "../remote/TechnicianSessionIndicator";
import { SidebarNavItem } from "./SidebarNavItem";

const links = [
  { to: "/technician", label: "Home", end: true, icon: Home },
  { to: "/technician/tickets", label: "Tickets", end: false, icon: Ticket },
  { to: "/technician/devices", label: "Devices", end: false, icon: MonitorSmartphone },
  { to: "/technician/chat", label: "Messages", end: false, icon: MessageCircle },
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
  useNotificationSocket("/technician");
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

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <aside
          className={`flex h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ${
            collapsed ? "w-16 items-center px-2 py-4" : "w-56 p-4"
          }`}
        >
          <div className={`mb-6 flex w-full ${collapsed ? "justify-center" : "items-center justify-between"}`}>
            <BrandMark subtitle="IT Support · Technician" collapsed={collapsed} />
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

          <div className={`mt-auto flex w-full flex-col gap-3 ${collapsed ? "items-center" : ""}`}>
            <div className={`flex w-full gap-1 ${collapsed ? "flex-col items-center" : ""}`}>
              <NotificationBell basePath="/technician" />
              <TechnicianAvailabilityControl collapsed={collapsed} />
            </div>
            <TechnicianSessionIndicator collapsed={collapsed} />
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
        <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
}
