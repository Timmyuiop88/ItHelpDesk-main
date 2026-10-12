import type { LucideIcon } from "lucide-react";
import { NavLink, useMatch, useResolvedPath } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarNavItemProps {
  to: string;
  label: string;
  end: boolean;
  icon: LucideIcon;
  collapsed: boolean;
  badge?: number;
}

export function SidebarNavItem({
  to,
  label,
  end,
  icon: Icon,
  collapsed,
  badge = 0,
}: SidebarNavItemProps) {
  const resolved = useResolvedPath(to);
  const isActive = useMatch({ path: resolved.pathname, end }) !== null;

  // A string className (not NavLink's function form) so Radix Slot can merge it.
  const className = `relative flex items-center rounded-lg text-sm transition-colors ${
    collapsed ? "size-9 justify-center" : "gap-3 px-3 py-2"
  } ${
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;

  const link = (
    <NavLink to={to} end={end} className={className} aria-label={collapsed ? label : undefined}>
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="flex-1">{label}</span>}
      {badge > 0 &&
        (collapsed ? (
          <span className="absolute right-1 top-1 size-2 rounded-full bg-primary ring-2 ring-sidebar" />
        ) : (
          <span
            className={`flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${
              isActive ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
            }`}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        ))}
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
