import { useMutation } from "@tanstack/react-query";
import { remoteSessionService } from "../../services/remote-session.service";

export function useStartSession() {
  return useMutation({
    mutationFn: (id: string) => remoteSessionService.start(id),
  });
}
