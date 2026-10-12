import { useMutation } from "@tanstack/react-query";
import { remoteSessionService } from "../../services/remote-session.service";

export function useConsentSession() {
  return useMutation({
    mutationFn: (id: string) => remoteSessionService.consent(id),
  });
}
