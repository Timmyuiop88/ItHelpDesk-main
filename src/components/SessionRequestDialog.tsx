import { Monitor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PermissionList,
  RequestCountdown,
  ResponseButtons,
} from "./remote/AccessRequestParts";
import { useEmployeeRemote } from "./remote/EmployeeRemoteContext";

interface SessionRequestDialogProps {
  suppressed?: boolean;
}

export function SessionRequestDialog({ suppressed = false }: SessionRequestDialogProps) {
  const { request, pendingAction, allow, decline } = useEmployeeRemote();

  return (
    <Dialog open={request !== null && !suppressed}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        {request && (
          <>
            <div className="flex flex-col items-center gap-4 bg-gradient-to-b from-primary/10 to-transparent px-6 pt-8 pb-5 text-center">
              <div className="relative">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-duration:2s]" />
                <div className="relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                  <Monitor className="size-7" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <DialogTitle className="text-lg font-semibold">
                  IT Support wants to view your screen
                </DialogTitle>
                <DialogDescription>
                  A technician is asking to connect so they can help with your ticket.
                </DialogDescription>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
                <Monitor className="size-3.5 text-muted-foreground" />
                {request.deviceHostname || "This device"}
              </span>
            </div>

            <div className="flex flex-col gap-3 px-6 pb-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                If you allow, the technician can
              </p>
              <PermissionList />
            </div>

            <div className="px-6 pb-5">
              <RequestCountdown key={request.sessionId} expiresAt={request.expiresAt} />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border bg-muted/40 px-6 py-4">
              <ResponseButtons
                pendingAction={pendingAction}
                onAllow={allow}
                onDecline={decline}
                autoFocus
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
