import {
  useInfiniteQuery,
  type QueryKey,
} from "@tanstack/react-query";
import { isPagingError } from "../../lib/pagination";
import { parseApiError } from "../../lib/apiError";
import type { Page } from "../../types/pagination.types";

export interface UsePagedInfiniteQueryParams<T> {
  queryKey: QueryKey;
  queryFn: (ctx: {
    page: number;
    limit: number;
    signal: AbortSignal;
  }) => Promise<Page<T>>;
  limit: number;
  enabled?: boolean;
}

export function usePagedInfiniteQuery<T>({
  queryKey,
  queryFn,
  limit,
  enabled = true,
}: UsePagedInfiniteQueryParams<T>) {
  const query = useInfiniteQuery({
    queryKey: [...queryKey, "infinite", limit],
    queryFn: async ({ pageParam, signal }) => {
      const page = pageParam as number;
      try {
        return await queryFn({ page, limit, signal });
      } catch (err) {
        if (isPagingError(err)) {
          const parsed = parseApiError(err);
          console.error("[paging] Invalid list request", parsed.requestId, err);
        }
        throw err;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
    enabled,
    meta: { silentError: true },
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const pages = query.data?.pages ?? [];
  const lastMeta = pages.length > 0 ? pages[pages.length - 1].meta : undefined;

  return {
    ...query,
    items,
    lastMeta,
    hasMore: Boolean(lastMeta?.hasNext),
    isFetchingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
  };
}

export type PagedInfiniteQueryResult<T> = ReturnType<
  typeof usePagedInfiniteQuery<T>
>;
