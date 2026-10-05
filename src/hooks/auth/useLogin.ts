import { useMutation } from "@tanstack/react-query";
import { setStoredDeviceId } from "../../api/deviceStore";
import { setToken } from "../../api/tokenStore";
import { collectMachineIdentity } from "../../lib/machineIdentity";
import { queryClient, queryKeys } from "../../lib/queryClient";
import { authService } from "../../services/auth.service";
import type { LoginRequest } from "../../types/auth.types";

type LoginCredentials = Pick<LoginRequest, "email" | "password">;

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Employees and technicians must say which machine they're logging in
      // from; the server links it to them as part of login.
      const device = await collectMachineIdentity();
      return authService.login({ ...credentials, device });
    },
    onSuccess: async (data) => {
      await setToken(data.accessToken);
      if (data.device?.id) {
        await setStoredDeviceId(data.device.id);
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      await queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
    },
  });
}
