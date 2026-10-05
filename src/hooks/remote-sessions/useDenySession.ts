import { useMutation } from "@tanstack/react-query";
import { remoteSessionService } from "../../services/remote-session.service";

export function useDenySession() {
  return useMutation({
    mutationFn: (id: string) => remoteSessionService.deny(id),
  });
}
