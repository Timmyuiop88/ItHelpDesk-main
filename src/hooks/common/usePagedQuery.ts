import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { isPagingError } from "../../lib/pagination";
import { parseApiError } from "../../lib/apiError";
import type { Page } from "../../types/pagination.types";

export interface UsePagedQueryParams<T> {
  queryKey: QueryKey;
  queryFn: (ctx: {
    page: number;
    limit: number;
    signal: AbortSignal;
  }) => Promise<Page<T>>;
  page: number;
  limit: number;
  enabled?: boolean;
  onEmptyPastEnd?: (totalPages: number) => void;
}

export function usePagedQuery<T>({
  queryKey,
  queryFn,
  page,
  limit,
  enabled = true,
  onEmptyPastEnd,
}: UsePagedQueryParams<T>) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKey, page, limit],
    queryFn: async ({ signal }) => {
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
    enabled,
    placeholderData: keepPreviousData,
    meta: { silentError: true },
  });

  const meta = query.data?.meta;

  useEffect(() => {
    if (
      query.data &&
      query.data.items.length === 0 &&
      page > 1 &&
      meta &&
      meta.totalPages >= 1
    ) {
      onEmptyPastEnd?.(meta.totalPages);
    }
  }, [query.data, page, meta, onEmptyPastEnd]);

  useEffect(() => {
    if (!meta?.hasNext || !enabled) {
      return;
    }
    void queryClient.prefetchQuery({
      queryKey: [...queryKey, page + 1, limit],
      queryFn: ({ signal }) => queryFn({ page: page + 1, limit, signal }),
    });
  }, [meta?.hasNext, page, limit, queryKey, queryFn, enabled, queryClient]);

  return {
    ...query,
    items: query.data?.items ?? [],
    meta,
  };
}

export type PagedQueryResult<T> = ReturnType<typeof usePagedQuery<T>>;
