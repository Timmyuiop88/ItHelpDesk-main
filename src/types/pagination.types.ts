export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PageParams {
  page?: number;
  limit?: number;
}

export interface CursorParams {
  cursor?: string;
  limit?: number;
}

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE: PageSizeOption = 20;
