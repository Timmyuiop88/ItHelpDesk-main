import { ChevronDown, History } from "lucide-react";
import { useState } from "react";
import { useAssignmentHistory } from "../../hooks/tickets/useAssignmentHistory";
import { formatRelative } from "../../lib/format";

interface AssignmentHistorySectionProps {
  ticketId: string;
}

export function AssignmentHistorySection({ ticketId }: AssignmentHistorySectionProps) {
  const [open, setOpen] = useState(false);
  const history = useAssignmentHistory(ticketId);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-flex items-center gap-1.5">
          <History className="size-3.5" />
          Assignment history
        </span>
        <ChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-2 pl-1">
          {history.isLoading && (
            <p className="text-xs text-muted-foreground">Loading…</p>
          )}
          {history.data?.length === 0 && (
            <p className="text-xs text-muted-foreground">No assignment changes yet.</p>
          )}
          {(history.data ?? []).map((entry) => (
            <div
              key={entry.id}
              className="relative border-l-2 border-border pl-3 text-xs"
            >
              <p className="font-medium text-foreground">
                {entry.toTechnicianName ?? "Technician"}{" "}
                {entry.fromTechnicianName
                  ? `(from ${entry.fromTechnicianName})`
                  : "(initial)"}
              </p>
              {entry.note && (
                <p className="text-muted-foreground">{entry.note}</p>
              )}
              {entry.createdAt && (
                <p className="text-[10px] text-muted-foreground">
                  {formatRelative(entry.createdAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
