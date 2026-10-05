import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { getTokenSnapshot, subscribe } from "../../api/tokenStore";
import { queryKeys } from "../../lib/queryClient";
import { authService } from "../../services/auth.service";

function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getTokenSnapshot, getTokenSnapshot);
}

export function useMe() {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => authService.me(),
    enabled: !!token,
  });
}
