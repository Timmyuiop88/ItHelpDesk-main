import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { isPagingError } from "../../lib/pagination";
import { parseApiError } from "../../lib/apiError";
import type { CursorPage } from "../../types/pagination.types";

export interface UseCursorQueryParams<T> {
  queryKey: QueryKey;
  queryFn: (ctx: {
    cursor?: string;
    limit: number;
    signal: AbortSignal;
  }) => Promise<CursorPage<T>>;
  limit: number;
  enabled?: boolean;
  /** When true, flatten pages in reverse order (newest page first in API). */
  reverse?: boolean;
}

export function useCursorQuery<T>({
  queryKey,
  queryFn,
  limit,
  enabled = true,
  reverse = false,
}: UseCursorQueryParams<T>) {
  const query = useInfiniteQuery({
    queryKey: [...queryKey, "cursor", limit],
    queryFn: async ({ pageParam, signal }) => {
      const cursor = pageParam as string | undefined;
      try {
        return await queryFn({ cursor, limit, signal });
      } catch (err) {
        if (isPagingError(err)) {
          const parsed = parseApiError(err);
          console.error("[paging] Invalid list request", parsed.requestId, err);
        }
        throw err;
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    meta: { silentError: true },
  });

  const pages = query.data?.pages ?? [];
  const flat = reverse
    ? [...pages].reverse().flatMap((p) => [...p.items].reverse())
    : pages.flatMap((p) => p.items);

  const lastPage = pages.length > 0 ? pages[pages.length - 1] : undefined;
  const hasMore = Boolean(lastPage?.nextCursor);

  return {
    ...query,
    items: flat,
    hasMore,
    isFetchingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    rawPages: pages,
  };
}

export type CursorQueryResult<T> = ReturnType<typeof useCursorQuery<T>>;
