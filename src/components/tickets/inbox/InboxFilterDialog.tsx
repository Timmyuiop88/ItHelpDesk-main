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
import { useCategories } from "../../../hooks/categories/useCategories";
import {
  ALL_TICKET_PRIORITIES,
  ALL_TICKET_STATUSES,
  PRIORITY_META,
  STATUS_META,
} from "../../../lib/ticketDisplay";
import {
  activeFilterCount,
  ALL_INBOX_VIEWS,
  countFor,
  viewLabel,
  type InboxFilters,
} from "../../../lib/ticketInbox";
import type { TicketCounts } from "../../../types/ticket.types";

type FilterSelection = Pick<
  InboxFilters,
  "view" | "status" | "priority" | "categoryId"
>;

const EMPTY_SELECTION: FilterSelection = {
  view: "all",
};

interface InboxFilterDialogProps {
  filters: InboxFilters;
  /** Facet counts for the *applied* filters, so numbers stay put while the user edits the draft. */
  counts: TicketCounts | undefined;
  onApply: (selection: FilterSelection) => void;
  onOpenChange?: (open: boolean) => void;
}

function pickSelection(filters: InboxFilters): FilterSelection {
  return {
    view: filters.view,
    status: filters.status,
    priority: filters.priority,
    categoryId: filters.categoryId,
  };
}

function selectionActiveCount(draft: FilterSelection): number {
  let n = 0;
  if (draft.view !== "all") n += 1;
  if (draft.status) n += 1;
  if (draft.priority) n += 1;
  if (draft.categoryId) n += 1;
  return n;
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function RadioOption({
  name,
  label,
  count,
  checked,
  onSelect,
  dotClass,
}: {
  name: string;
  label: string;
  count?: number;
  checked: boolean;
  onSelect: () => void;
  dotClass?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
        checked ? "bg-primary/10 text-foreground" : "hover:bg-muted/60"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="size-3.5 shrink-0 accent-primary"
      />
      {dotClass && (
        <span className={`size-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
    </label>
  );
}

export function InboxFilterDialog({
  filters,
  counts,
  onApply,
  onOpenChange,
}: InboxFilterDialogProps) {
  const categories = useCategories();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterSelection>(() => pickSelection(filters));
  const appliedCount = activeFilterCount(filters);
  const draftCount = selectionActiveCount(draft);
  const uncategorized = counts?.categories.find((c) => c.id === null)?.count ?? 0;

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(pickSelection(filters));
    setOpen(next);
    onOpenChange?.(next);
  };

  const apply = () => {
    onApply(draft);
    handleOpenChange(false);
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
            Choose one option per group. Filters apply on the server.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] gap-5 overflow-y-auto sm:grid-cols-2">
          <FilterGroup title="Assignment">
            {ALL_INBOX_VIEWS.map((view) => (
              <RadioOption
                key={view}
                name="assignment"
                label={viewLabel(view)}
                count={counts && countFor.view(counts, view)}
                checked={draft.view === view}
                onSelect={() => setDraft((d) => ({ ...d, view }))}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Status">
            <RadioOption
              name="status"
              label="Any status"
              count={counts && countFor.status(counts)}
              checked={!draft.status}
              onSelect={() => setDraft((d) => ({ ...d, status: undefined }))}
            />
            {ALL_TICKET_STATUSES.map((status) => (
              <RadioOption
                key={status}
                name="status"
                label={STATUS_META[status].label}
                count={counts && countFor.status(counts, status)}
                dotClass={STATUS_META[status].dotClass}
                checked={draft.status === status}
                onSelect={() => setDraft((d) => ({ ...d, status }))}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Priority">
            <RadioOption
              name="priority"
              label="Any priority"
              count={counts && countFor.priority(counts)}
              checked={!draft.priority}
              onSelect={() => setDraft((d) => ({ ...d, priority: undefined }))}
            />
            {ALL_TICKET_PRIORITIES.map((priority) => (
              <RadioOption
                key={priority}
                name="priority"
                label={PRIORITY_META[priority].label}
                count={counts && countFor.priority(counts, priority)}
                checked={draft.priority === priority}
                onSelect={() => setDraft((d) => ({ ...d, priority }))}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Category">
            <RadioOption
              name="category"
              label="Any category"
              count={counts && countFor.category(counts)}
              checked={!draft.categoryId}
              onSelect={() => setDraft((d) => ({ ...d, categoryId: undefined }))}
            />
            {(categories.data ?? []).map((cat) => (
              <RadioOption
                key={cat.id}
                name="category"
                label={cat.name}
                count={counts && countFor.category(counts, cat.id)}
                checked={draft.categoryId === cat.id}
                onSelect={() => setDraft((d) => ({ ...d, categoryId: cat.id }))}
              />
            ))}
            {uncategorized > 0 && (
              <p className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground">
                <span>No category</span>
                <span className="tabular-nums">{uncategorized}</span>
              </p>
            )}
          </FilterGroup>

          {/* Multi-select and email filter (no API support):
          <FilterGroup title="Category and source">
            ...
            <FilterOption label="Via email" ... />
          </FilterGroup>
          */}
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
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
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
