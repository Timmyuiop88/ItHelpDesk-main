import type { PagedQueryResult } from "../../../hooks/common/usePagedQuery";
import type { PagedInfiniteQueryResult } from "../../../hooks/common/usePagedInfiniteQuery";
import type { CursorQueryResult } from "../../../hooks/common/useCursorQuery";
import type { PageMeta, PageSizeOption } from "../../../types/pagination.types";
import { PAGE_SIZE_OPTIONS } from "../../../types/pagination.types";

export function pagedProps<T>(
  query: PagedQueryResult<T>,
  handlers: {
    page: number;
    limit: PageSizeOption;
    onPageChange: (page: number) => void;
    onPageSizeChange: (limit: PageSizeOption) => void;
  },
) {
  const meta = query.meta;
  if (!meta) {
    return {
      meta: undefined as PageMeta | undefined,
      onPageChange: handlers.onPageChange,
      pageSize: handlers.limit,
      onPageSizeChange: handlers.onPageSizeChange,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      isFetching: query.isFetching,
    };
  }
  return {
    meta,
    onPageChange: handlers.onPageChange,
    pageSize: handlers.limit,
    onPageSizeChange: handlers.onPageSizeChange,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    isFetching: query.isFetching,
  };
}

export function infinitePropsFromPaged<T>(query: PagedInfiniteQueryResult<T>) {
  return {
    hasMore: query.hasMore,
    isFetchingMore: query.isFetchingMore,
    onLoadMore: query.loadMore,
  };
}

export function infinitePropsFromCursor<T>(query: CursorQueryResult<T>) {
  return {
    hasMore: query.hasMore,
    isFetchingMore: query.isFetchingMore,
    onLoadMore: query.loadMore,
  };
}
