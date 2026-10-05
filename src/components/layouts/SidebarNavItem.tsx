import type { LucideIcon } from "lucide-react";
import { NavLink, useMatch, useResolvedPath } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarNavItemProps {
  to: string;
  label: string;
  end: boolean;
  icon: LucideIcon;
  collapsed: boolean;
}

export function SidebarNavItem({ to, label, end, icon: Icon, collapsed }: SidebarNavItemProps) {
  const resolved = useResolvedPath(to);
  const isActive = useMatch({ path: resolved.pathname, end }) !== null;

  // A string className (not NavLink's function form) so Radix Slot can merge it.
  const className = `flex items-center rounded-lg text-sm transition-colors ${
    collapsed ? "size-9 justify-center" : "gap-3 px-3 py-2"
  } ${
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;

  const link = (
    <NavLink to={to} end={end} className={className} aria-label={collapsed ? label : undefined}>
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
