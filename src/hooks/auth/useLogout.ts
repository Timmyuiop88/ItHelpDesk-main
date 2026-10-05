import { useNavigate } from "react-router-dom";
import { clearToken } from "../../api/tokenStore";
import { queryClient } from "../../lib/queryClient";

export function useLogout() {
  const navigate = useNavigate();

  return async () => {
    await clearToken();
    queryClient.clear();
    navigate("/login", { replace: true });
  };
}
