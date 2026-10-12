import { useNavigate } from "react-router-dom";
import {
  clearSession,
  getRefreshToken,
} from "../../api/tokenStore";
import { stopSessionTimers } from "../../api/session";
import { authService } from "../../services/auth.service";
import { queryClient } from "../../lib/queryClient";

export function useLogout() {
  const navigate = useNavigate();

  return async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authService.logout({ refreshToken });
      } catch {
        /* best-effort server logout */
      }
    }
    stopSessionTimers();
    await clearSession();
    queryClient.clear();
    navigate("/login", { replace: true });
  };
}
