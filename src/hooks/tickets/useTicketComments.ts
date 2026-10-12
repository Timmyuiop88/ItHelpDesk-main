import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "../../lib/queryClient";
import { ticketService } from "../../services/ticket.service";
import type { TicketComment } from "../../types/ticket.types";
import { useTicket } from "./useTicket";

function mergeComments(
  seed: TicketComment[],
  olderPages: TicketComment[][],
): TicketComment[] {
  const map = new Map<string, TicketComment>();
  for (const page of olderPages) {
    for (const c of page) {
      map.set(c.id, c);
    }
  }
  for (const c of seed) {
    map.set(c.id, c);
  }
  return [...map.values()].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return ta - tb;
  });
}

export function useTicketComments(ticketId: string) {
  const ticket = useTicket(ticketId);
  const seed = ticket.data?.comments ?? [];
  const truncated = ticket.data?.commentsTruncated ?? false;

  const olderQuery = useInfiniteQuery({
    queryKey: queryKeys.tickets.commentsOlder(ticketId),
    queryFn: async ({ pageParam, signal }) => {
      const page = pageParam as number;
      const result = await ticketService.getComments(
        ticketId,
        { order: "desc", page, limit: 30 },
        signal,
      );
      return result;
    },
    initialPageParam: 2,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
    enabled: !!ticketId && truncated,
    meta: { silentError: true },
  });

  const olderItems = useMemo(
    () => olderQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [olderQuery.data?.pages],
  );

  const merged = useMemo(
    () => mergeComments(seed, [olderItems]),
    [seed, olderItems],
  );

  const hasMoreOlder =
    truncated && (olderQuery.hasNextPage || olderQuery.data === undefined);

  return {
    data: merged,
    isLoading: ticket.isLoading,
    isError: ticket.isError || olderQuery.isError,
    commentsTruncated: truncated,
    hasMoreOlder,
    loadOlder: () => void olderQuery.fetchNextPage(),
    isFetchingOlder: olderQuery.isFetchingNextPage,
    refetch: async () => {
      await ticket.refetch();
      if (truncated) {
        await olderQuery.refetch();
      }
    },
  };
}

export function useInvalidateTicketComments() {
  const queryClient = useQueryClient();
  return (ticketId: string) => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tickets.detail(ticketId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tickets.commentsOlder(ticketId),
    });
  };
}
