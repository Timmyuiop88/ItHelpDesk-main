import axios from "axios";
import type { Page, PageMeta } from "../types/pagination.types";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../types/pagination.types";

const MAX_FETCH_ALL_PAGES = 20;
const MAX_Q_LENGTH = 100;

export function clampLimit(limit: number | undefined): number {
  if (limit === undefined || Number.isNaN(limit)) {
    return DEFAULT_PAGE_SIZE;
  }
  const clamped = Math.min(Math.max(Math.floor(limit), 1), 100);
  if (!(PAGE_SIZE_OPTIONS as readonly number[]).includes(clamped)) {
    return clamped;
  }
  return clamped;
}

export function cleanParams(
  params: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    if (key === "q" && typeof value === "string") {
      out.q = value.slice(0, MAX_Q_LENGTH);
      continue;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    }
  }
  return out;
}

export async function fetchAll<T>(
  fetchPage: (page: number, limit: number) => Promise<Page<T>>,
): Promise<T[]> {
  const limit = 100;
  const items: T[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext && page <= MAX_FETCH_ALL_PAGES) {
    const result = await fetchPage(page, limit);
    items.push(...result.items);
    hasNext = result.meta.hasNext;
    page += 1;
  }

  return items;
}

export function isPagingError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) {
    return false;
  }
  return err.response?.status === 400;
}

export function rangeLabel(meta: PageMeta): string {
  if (meta.total === 0) {
    return "Showing 0 of 0";
  }
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  return `Showing ${start}–${end} of ${meta.total}`;
}
