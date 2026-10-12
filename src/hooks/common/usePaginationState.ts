import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { clampLimit } from "../../lib/pagination";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSizeOption,
} from "../../types/pagination.types";

export interface UsePaginationStateOptions {
  syncToUrl?: boolean;
  resetKey?: string;
  defaultLimit?: PageSizeOption;
}

export function usePaginationState({
  syncToUrl = false,
  resetKey = "",
  defaultLimit = DEFAULT_PAGE_SIZE,
}: UsePaginationStateOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlPage = syncToUrl
    ? Math.max(1, Number(searchParams.get("page") ?? "1") || 1)
    : 1;
  const urlLimitRaw = syncToUrl
    ? Number(searchParams.get("limit") ?? String(defaultLimit))
    : defaultLimit;
  const urlLimit = clampLimit(urlLimitRaw) as PageSizeOption;
  const safeUrlLimit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(
    urlLimit,
  )
    ? urlLimit
    : defaultLimit;

  const [localPage, setLocalPage] = useState(urlPage);
  const [localLimit, setLocalLimit] = useState<PageSizeOption>(safeUrlLimit);

  const page = syncToUrl ? urlPage : localPage;
  const limit = syncToUrl ? safeUrlLimit : localLimit;

  const prevResetKey = useRef(resetKey);
  useEffect(() => {
    if (prevResetKey.current !== resetKey) {
      prevResetKey.current = resetKey;
      if (syncToUrl) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("page", "1");
            return next;
          },
          { replace: true },
        );
      } else {
        setLocalPage(1);
      }
    }
  }, [resetKey, syncToUrl, setSearchParams]);

  const setPage = (next: number) => {
    const safe = Math.max(1, next);
    if (syncToUrl) {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("page", String(safe));
          return params;
        },
        { replace: true },
      );
    } else {
      setLocalPage(safe);
    }
  };

  const setLimit = (next: PageSizeOption) => {
    if (syncToUrl) {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("limit", String(next));
          params.set("page", "1");
          return params;
        },
        { replace: true },
      );
    } else {
      setLocalLimit(next);
      setLocalPage(1);
    }
  };

  return { page, limit, setPage, setLimit };
}
