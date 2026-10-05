import { Loader2, Unlink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUnlinkDevice } from "../../hooks/devices/useUnlinkDevice";
import { getApiErrorMessage } from "../../lib/apiError";
import type { Device } from "../../types/device.types";
import { useDeviceAgentState } from "../DeviceAgentContext";

export function UnlinkDeviceButton({ device }: { device: Device }) {
  const agent = useDeviceAgentState();
  const unlink = useUnlinkDevice();
  const [open, setOpen] = useState(false);
  const isThisComputer = agent.device?.id === device.id;
  const name = device.hostname || "this device";

  const confirm = () => {
    unlink.mutate(device.id, {
      onSuccess: () => {
        setOpen(false);
        toast.success(`${name} unlinked`);
        agent.markUnlinked(device.id);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Unlink />
          Unlink
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlink {name}?</DialogTitle>
          <DialogDescription>
            {isThisComputer
              ? "This is the computer you're using. It will stop reporting its status and IT won't be able to offer remote support until you link it again."
              : "The device will be freed so someone else can register it. Any pending remote-access requests for it will expire."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={unlink.isPending}
          >
            {unlink.isPending && <Loader2 className="animate-spin" />}
            Unlink device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
