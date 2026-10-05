import { useMutation } from "@tanstack/react-query";
import { remoteSessionService } from "../../services/remote-session.service";

interface SaveSessionNotesVariables {
  id: string;
  notes: string;
}

export function useSaveSessionNotes() {
  return useMutation({
    mutationFn: ({ id, notes }: SaveSessionNotesVariables) =>
      remoteSessionService.addNotes(id, { notes }),
  });
}
