import { Loader2, Mail, Search } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "../../common/pagination/Pagination";
import { pagedProps } from "../../common/pagination/paginationAdapters";
import type { PagedQueryResult } from "../../../hooks/common/usePagedQuery";
import { formatRelative } from "../../../lib/format";
import { initials, priorityMeta, STATUS_META } from "../../../lib/ticketDisplay";
import { inboxTitle, type InboxFilters } from "../../../lib/ticketInbox";
import {
  getAssigneeId,
  getAssigneeName,
  getRequesterName,
  isEmailTicket,
  ticketLabel,
} from "../../../lib/tickets";
import type { Ticket } from "../../../types/ticket.types";
import type { PageSizeOption } from "../../../types/pagination.types";

interface InboxTicketListProps {
  tickets: Ticket[];
  filters: InboxFilters;
  totalCount?: number;
  pagedQuery?: PagedQueryResult<Ticket>;
  page: number;
  limit: PageSizeOption;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: PageSizeOption) => void;
  selectedId?: string | null;
  currentTechnicianId?: string | null;
  isLoading?: boolean;
  isError?: boolean;
  onSelect: (ticketId: string) => void;
  onFiltersChange: (patch: Partial<InboxFilters>) => void;
  onRowClickNavigate?: (ticketId: string) => void;
  /** Shows "Take this ticket" on unassigned, still-open rows. */
  onTake?: (ticketId: string) => void;
  takingId?: string | null;
  searchAction?: ReactNode;
  className?: string;
}

const TAKEABLE_STATUSES = new Set<Ticket["status"]>(["OPEN", "IN_PROGRESS", "WAITING_FOR_EMPLOYEE"]);

export function InboxTicketList({
  tickets,
  filters,
  totalCount,
  pagedQuery,
  page,
  limit,
  onPageChange,
  onPageSizeChange,
  selectedId = null,
  currentTechnicianId = null,
  isLoading = false,
  isError = false,
  onSelect,
  onFiltersChange,
  onRowClickNavigate,
  onTake,
  takingId = null,
  searchAction,
  className = "w-full max-w-md shrink-0 border-r border-border xl:w-96",
}: InboxTicketListProps) {
  const handleRowClick = (ticketId: string) => {
    if (onRowClickNavigate) {
      onRowClickNavigate(ticketId);
      return;
    }
    onSelect(ticketId);
  };

  const handleRowKeyDown = (e: KeyboardEvent<HTMLDivElement>, ticketId: string) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRowClick(ticketId);
    }
  };

  const countLabel = totalCount ?? tickets.length;

  return (
    <section className={`flex h-full flex-col bg-background ${className}`}>
      <header className="shrink-0 space-y-2 border-b border-border px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-semibold">{inboxTitle(filters)}</h2>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {countLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.currentTarget.value })}
              placeholder="Search tickets…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          {searchAction}
        </div>
        {/* Client-side sort (no API param):
        <select
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs"
          value={filters.sort}
          onChange={(e) => onFiltersChange({ sort: e.currentTarget.value as InboxSort })}
        >
          <option value="activity">Last activity</option>
          <option value="newest">Newest</option>
          <option value="priority">Priority</option>
        </select>
        */}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && (
          <p className="p-4 text-center text-sm text-muted-foreground">Loading tickets…</p>
        )}
        {isError && !isLoading && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this list. Try again.
          </p>
        )}
        {!isLoading && !isError && tickets.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No tickets match these filters.
          </p>
        )}
        {tickets.map((ticket) => {
          const requester = getRequesterName(ticket);
          const status = STATUS_META[ticket.status];
          const priority = priorityMeta(ticket.priority);
          const active = selectedId === ticket.id;
          const assigneeId = getAssigneeId(ticket);
          const assignedToMe = !!currentTechnicianId && assigneeId === currentTechnicianId;
          const canTake = !!onTake && !assigneeId && TAKEABLE_STATUSES.has(ticket.status);
          const taking = takingId === ticket.id;

          return (
            <div
              key={ticket.id}
              role="button"
              tabIndex={0}
              onClick={() => handleRowClick(ticket.id)}
              onKeyDown={(e) => handleRowKeyDown(e, ticket.id)}
              className={`flex w-full cursor-pointer flex-col gap-1 border-b border-border px-3 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/60 ${
                active ? "border-l-2 border-l-primary bg-primary/5" : "border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold ring-2 ${status.avatarRingClass}`}
                >
                  {initials(requester)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-xs font-medium text-muted-foreground">
                      {requester}
                    </span>
                    {ticket.createdAt && (
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                        {formatRelative(ticket.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm font-semibold leading-snug">{ticket.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{ticket.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pl-11">
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className={`size-1.5 rounded-full ${status.dotClass}`} />
                  {status.label}
                </span>
                <Badge variant="outline" className={`h-4 px-1.5 text-[9px] ${priority.badgeClass}`}>
                  {priority.label}
                </Badge>
                {ticket.ticketNumber !== undefined && (
                  <span className="text-[10px] text-muted-foreground">{ticketLabel(ticket)}</span>
                )}
                {isEmailTicket(ticket) && (
                  <Badge variant="outline" className="h-4 gap-0.5 px-1.5 text-[9px]">
                    <Mail className="size-2.5" />
                    Email
                  </Badge>
                )}
                {assignedToMe ? (
                  <Badge
                    variant="outline"
                    className="h-4 border-primary/30 bg-blue-50 px-1.5 text-[9px] text-blue-700"
                  >
                    Assigned to you
                  </Badge>
                ) : assigneeId ? (
                  <Badge variant="outline" className="h-4 max-w-[140px] truncate px-1.5 text-[9px]">
                    {getAssigneeName(ticket) || "Assigned"}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                    Unassigned
                  </Badge>
                )}
                {canTake && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto h-6 px-2 text-[11px]"
                    disabled={!!takingId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTake?.(ticket.id);
                    }}
                  >
                    {taking && <Loader2 className="size-3 animate-spin" />}
                    Take this ticket
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pagedQuery && (
        <Pagination
          variant="pages"
          compact
          {...pagedProps(pagedQuery, {
            page,
            limit,
            onPageChange,
            onPageSizeChange,
          })}
        />
      )}
    </section>
  );
}
