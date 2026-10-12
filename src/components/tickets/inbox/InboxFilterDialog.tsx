import { ListFilter } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ALL_TICKET_STATUSES,
  PRIORITY_META,
  STATUS_META,
} from "../../../lib/ticketDisplay";
import {
  activeFilterCount,
  ALL_INBOX_VIEWS,
  toggleValue,
  viewLabel,
  type InboxCounts,
  type InboxFilters,
} from "../../../lib/ticketInbox";

type FilterSelection = Pick<
  InboxFilters,
  "views" | "statuses" | "priorities" | "categoryIds" | "emailOnly"
>;

const EMPTY_SELECTION: FilterSelection = {
  views: [],
  statuses: [],
  priorities: [],
  categoryIds: [],
  emailOnly: false,
};

interface InboxFilterDialogProps {
  filters: InboxFilters;
  counts: InboxCounts;
  onApply: (selection: FilterSelection) => void;
}

function pickSelection(filters: InboxFilters): FilterSelection {
  return {
    views: filters.views,
    statuses: filters.statuses,
    priorities: filters.priorities,
    categoryIds: filters.categoryIds,
    emailOnly: filters.emailOnly,
  };
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function FilterOption({
  label,
  count,
  checked,
  onToggle,
  dotClass,
}: {
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
  dotClass?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
        checked ? "bg-primary/10 text-foreground" : "hover:bg-muted/60"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="size-3.5 shrink-0 accent-primary"
      />
      {dotClass && <span className={`size-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>
    </label>
  );
}

export function InboxFilterDialog({ filters, counts, onApply }: InboxFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterSelection>(() => pickSelection(filters));
  const appliedCount = activeFilterCount(filters);
  const draftCount = activeFilterCount({ ...filters, ...draft });

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(pickSelection(filters));
    setOpen(next);
  };

  const apply = () => {
    onApply(draft);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={appliedCount > 0 ? "secondary" : "outline"}
          className="h-8 shrink-0 gap-1.5"
          aria-label="Filter tickets"
        >
          <ListFilter className="size-3.5" />
          Filter
          {appliedCount > 0 && (
            <span className="flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {appliedCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Filter tickets</DialogTitle>
          <DialogDescription>
            Pick as many options as you like. A ticket shows if it matches any option in each
            group you use.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] gap-5 overflow-y-auto sm:grid-cols-2">
          <FilterGroup title="Assignment">
            {ALL_INBOX_VIEWS.map((view) => (
              <FilterOption
                key={view}
                label={viewLabel(view)}
                count={counts.views[view]}
                checked={draft.views.includes(view)}
                onToggle={() => setDraft((d) => ({ ...d, views: toggleValue(d.views, view) }))}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Status">
            {ALL_TICKET_STATUSES.map((status) => (
              <FilterOption
                key={status}
                label={STATUS_META[status].label}
                count={counts.statuses[status]}
                dotClass={STATUS_META[status].dotClass}
                checked={draft.statuses.includes(status)}
                onToggle={() =>
                  setDraft((d) => ({ ...d, statuses: toggleValue(d.statuses, status) }))
                }
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Priority">
            {(["HIGH", "MEDIUM", "LOW"] as const).map((priority) => (
              <FilterOption
                key={priority}
                label={PRIORITY_META[priority].label}
                count={counts.priorities[priority] ?? 0}
                checked={draft.priorities.includes(priority)}
                onToggle={() =>
                  setDraft((d) => ({ ...d, priorities: toggleValue(d.priorities, priority) }))
                }
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Category and source">
            {counts.categories.length === 0 && (
              <p className="px-2 py-1 text-xs text-muted-foreground">No categories yet</p>
            )}
            {counts.categories.map((cat) => (
              <FilterOption
                key={cat.id}
                label={cat.name}
                count={cat.count}
                checked={draft.categoryIds.includes(cat.id)}
                onToggle={() =>
                  setDraft((d) => ({ ...d, categoryIds: toggleValue(d.categoryIds, cat.id) }))
                }
              />
            ))}
            <FilterOption
              label="Via email"
              count={counts.email}
              checked={draft.emailOnly}
              onToggle={() => setDraft((d) => ({ ...d, emailOnly: !d.emailOnly }))}
            />
          </FilterGroup>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => setDraft(EMPTY_SELECTION)}
            disabled={draftCount === 0}
          >
            Clear all
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={apply}>
              Apply{draftCount > 0 ? ` (${draftCount})` : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
