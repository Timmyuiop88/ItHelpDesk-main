import type { TicketStatus } from "../../types/ticket.types";

interface StatusConfig {
  label: string;
  color: string;           // inactive pill
  activeColor: string;     // active pill
}

const STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  OPEN: {
    label: "Open",
    color: "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400",
    activeColor: "bg-slate-600 text-white border-slate-600 dark:bg-slate-500 dark:border-slate-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400",
    activeColor: "bg-blue-600 text-white border-blue-600 dark:bg-blue-700 dark:border-blue-700",
  },
  WAITING_FOR_EMPLOYEE: {
    label: "Waiting",
    color: "border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400",
    activeColor: "bg-amber-500 text-white border-amber-500 dark:bg-amber-600 dark:border-amber-600",
  },
  RESOLVED: {
    label: "Resolved",
    color: "border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400",
    activeColor: "bg-teal-600 text-white border-teal-600 dark:bg-teal-700 dark:border-teal-700",
  },
  CLOSED: {
    label: "Closed",
    color: "border-border text-muted-foreground cursor-default",
    activeColor: "bg-muted text-muted-foreground border-border cursor-default",
  },
};

const ALL_STATUSES: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_EMPLOYEE",
  "RESOLVED",
  "CLOSED",
];

interface TicketStatusPillsProps {
  current: TicketStatus;
  /** Which statuses the user is allowed to click. Empty = read-only. */
  clickable?: TicketStatus[];
  onSelect?: (status: TicketStatus) => void;
  isPending?: boolean;
}

export function TicketStatusPills({
  current,
  clickable = [],
  onSelect,
  isPending = false,
}: TicketStatusPillsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_STATUSES.map((status) => {
        const isActive = status === current;
        const isClickable = clickable.includes(status) && status !== current && status !== "CLOSED";
        const cfg = STATUS_CONFIG[status];

        return (
          <button
            key={status}
            type="button"
            disabled={!isClickable || isPending}
            onClick={() => isClickable && onSelect?.(status)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none ${
              isActive ? cfg.activeColor : cfg.color
            } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
          >
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
