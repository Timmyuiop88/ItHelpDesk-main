import { useMutation } from "@tanstack/react-query";
import { setToken } from "../../api/tokenStore";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { authService } from "../../services/auth.service";
import type { LoginRequest } from "../../types/auth.types";

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: async (data) => {
      await setToken(data.accessToken);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}
