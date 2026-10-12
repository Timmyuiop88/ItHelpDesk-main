import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { rangeLabel } from "../../../lib/pagination";
import type { PageMeta, PageSizeOption } from "../../../types/pagination.types";
import { PAGE_SIZE_OPTIONS } from "../../../types/pagination.types";

type PagesVariant = {
  variant: "pages";
  meta: PageMeta | undefined;
  onPageChange: (page: number) => void;
  pageSize: PageSizeOption;
  onPageSizeChange: (size: PageSizeOption) => void;
  pageSizeOptions?: readonly PageSizeOption[];
  isFetching?: boolean;
  compact?: boolean;
};

type LoadMoreBase = {
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  direction?: "older" | "newer";
  label?: string;
};

type LoadMoreVariant = LoadMoreBase & {
  variant: "loadMore";
};

type InfiniteVariant = LoadMoreBase & {
  variant: "infinite";
};

export type PaginationProps = PagesVariant | LoadMoreVariant | InfiniteVariant;

function defaultLoadLabel(direction: "older" | "newer"): string {
  return direction === "older" ? "Load older" : "Load more";
}

function LoadMoreControl({
  hasMore,
  isFetchingMore,
  onLoadMore,
  direction = "newer",
  label,
  observe,
}: LoadMoreBase & { observe?: boolean }) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!observe || !hasMore || isFetchingMore) {
      return;
    }
    const node = sentinelRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onLoadMore();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [observe, hasMore, isFetchingMore, onLoadMore]);

  if (!hasMore) {
    return null;
  }

  const text = label ?? defaultLoadLabel(direction);

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isFetchingMore}
        onClick={onLoadMore}
      >
        {isFetchingMore ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading…
          </>
        ) : (
          text
        )}
      </Button>
      {observe ? <div ref={sentinelRef} className="h-1 w-full" aria-hidden /> : null}
    </div>
  );
}

function PagesControl({
  meta,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  isFetching,
  compact,
}: Omit<PagesVariant, "variant">) {
  if (!meta) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2 text-sm"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="page-size" className="text-muted-foreground">
          Rows
        </label>
        <select
          id="page-size"
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={pageSize}
          onChange={(e) =>
            onPageSizeChange(Number(e.target.value) as PageSizeOption)
          }
          disabled={isFetching}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {!compact ? (
        <p className="text-muted-foreground" aria-live="polite">
          {rangeLabel(meta)} · Page {meta.page} of {meta.totalPages || 1}
        </p>
      ) : (
        <p className="text-muted-foreground" aria-live="polite">
          Page {meta.page} of {meta.totalPages || 1}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!meta.hasPrev || isFetching}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!meta.hasNext || isFetching}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

export function Pagination(props: PaginationProps) {
  switch (props.variant) {
    case "pages":
      return <PagesControl {...props} />;
    case "infinite":
      return <LoadMoreControl {...props} observe />;
    case "loadMore":
      return <LoadMoreControl {...props} />;
  }
}
