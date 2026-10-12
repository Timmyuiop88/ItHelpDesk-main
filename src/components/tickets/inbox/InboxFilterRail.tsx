import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  ALL_TICKET_STATUSES,
  PRIORITY_META,
  STATUS_META,
} from "../../../lib/ticketDisplay";
import {
  activeFilterCount,
  ALL_INBOX_VIEWS,
  DEFAULT_INBOX_FILTERS,
  toggleValue,
  viewLabel,
  type InboxCounts,
  type InboxFilters,
} from "../../../lib/ticketInbox";

interface InboxFilterRailProps {
  filters: InboxFilters;
  counts: InboxCounts;
  onChange: (patch: Partial<InboxFilters>) => void;
  className?: string;
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-2 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <ChevronDown className={`size-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="flex flex-col gap-0.5 pb-1">{children}</div>}
    </div>
  );
}

function FilterItem({
  label,
  count,
  active,
  onClick,
  dotClass,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  dotClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-foreground hover:bg-muted/60"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2 truncate">
        {dotClass && (
          <span className={`size-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
        )}
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">{count}</span>
    </button>
  );
}

export function InboxFilterRail({
  filters,
  counts,
  onChange,
  className = "",
}: InboxFilterRailProps) {
  const clearFilters = () =>
    onChange({
      views: DEFAULT_INBOX_FILTERS.views,
      statuses: DEFAULT_INBOX_FILTERS.statuses,
      priorities: DEFAULT_INBOX_FILTERS.priorities,
      categoryIds: DEFAULT_INBOX_FILTERS.categoryIds,
      emailOnly: false,
    });

  return (
    <aside
      className={`flex h-full w-56 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar ${className}`}
    >
      <div className="border-b border-border px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Inbox
        </p>
      </div>

      <FilterSection title="Views">
        <FilterItem
          label="All"
          count={counts.views.all}
          active={activeFilterCount(filters) === 0}
          onClick={clearFilters}
        />
        {ALL_INBOX_VIEWS.map((view) => (
          <FilterItem
            key={view}
            label={viewLabel(view)}
            count={counts.views[view]}
            active={filters.views.includes(view)}
            onClick={() => onChange({ views: toggleValue(filters.views, view) })}
          />
        ))}
      </FilterSection>

      <FilterSection title="Status">
        {ALL_TICKET_STATUSES.map((status) => (
          <FilterItem
            key={status}
            label={STATUS_META[status].label}
            count={counts.statuses[status]}
            dotClass={STATUS_META[status].dotClass}
            active={filters.statuses.includes(status)}
            onClick={() => onChange({ statuses: toggleValue(filters.statuses, status) })}
          />
        ))}
      </FilterSection>

      <FilterSection title="Priority">
        {(["HIGH", "MEDIUM", "LOW"] as const).map((priority) => (
          <FilterItem
            key={priority}
            label={PRIORITY_META[priority].label}
            count={counts.priorities[priority] ?? 0}
            active={filters.priorities.includes(priority)}
            onClick={() =>
              onChange({ priorities: toggleValue(filters.priorities, priority) })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Category" defaultOpen={counts.categories.length > 0}>
        {counts.categories.length === 0 && (
          <p className="px-3 py-1 text-xs text-muted-foreground">No categories yet</p>
        )}
        {counts.categories.map((cat) => (
          <FilterItem
            key={cat.id}
            label={cat.name}
            count={cat.count}
            active={filters.categoryIds.includes(cat.id)}
            onClick={() =>
              onChange({ categoryIds: toggleValue(filters.categoryIds, cat.id) })
            }
          />
        ))}
        <FilterItem
          label="Via email"
          count={counts.email}
          active={filters.emailOnly}
          onClick={() => onChange({ emailOnly: !filters.emailOnly })}
        />
      </FilterSection>

      {activeFilterCount(filters) > 0 && (
        <div className="mt-auto border-t border-border p-2">
          <button
            type="button"
            className="w-full rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      )}
    </aside>
  );
}
