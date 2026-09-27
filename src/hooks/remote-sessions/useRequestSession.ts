import { useMutation } from "@tanstack/react-query";
import { remoteSessionService } from "../../services/remote-session.service";
import type { CreateRemoteSessionPayload } from "../../types/remote-session.types";

export function useRequestSession() {
  return useMutation({
    mutationFn: (payload: CreateRemoteSessionPayload) =>
      remoteSessionService.create(payload),
  });
}
