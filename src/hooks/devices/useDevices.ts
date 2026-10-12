import { usePaginationState } from "../common/usePaginationState";
import { usePagedQuery } from "../common/usePagedQuery";
import { queryKeys } from "../../lib/queryClient";
import { deviceService } from "../../services/device.service";

export function useDevices(status?: string) {
  const { page, limit, setPage, setLimit } = usePaginationState({
    resetKey: status ?? "",
  });

  const query = usePagedQuery({
    queryKey: queryKeys.devices.list({ status: status ?? "" }),
    queryFn: ({ page: p, limit: l, signal }) =>
      deviceService.list(
        { page: p, limit: l, ...(status ? { status } : {}) },
        signal,
      ),
    page,
    limit,
    onEmptyPastEnd: (totalPages) => setPage(totalPages),
  });

  return {
    ...query,
    page,
    limit,
    setPage,
    setLimit,
  };
}
