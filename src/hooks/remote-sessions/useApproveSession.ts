import { useMutation } from "@tanstack/react-query";
import { remoteSessionService } from "../../services/remote-session.service";

export function useApproveSession() {
  return useMutation({
    mutationFn: (id: string) => remoteSessionService.approve(id),
  });
}
