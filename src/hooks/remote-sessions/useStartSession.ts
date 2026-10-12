import { useMutation } from "@tanstack/react-query";
import { remoteSessionService } from "../../services/remote-session.service";
import type { StartSessionPayload } from "../../types/remote-session.types";

export function useStartSession() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StartSessionPayload }) =>
      remoteSessionService.start(id, payload),
  });
}
