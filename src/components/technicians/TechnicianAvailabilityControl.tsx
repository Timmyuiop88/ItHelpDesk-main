import { Loader2, PauseCircle, Radio } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUpdateTechnicianAvailability } from "../../hooks/technicians/useTechnicianAvailability";
import { getApiErrorMessage } from "../../lib/apiError";

interface TechnicianAvailabilityControlProps {
  collapsed?: boolean;
}

export function TechnicianAvailabilityControl({
  collapsed = false,
}: TechnicianAvailabilityControlProps) {
  const update = useUpdateTechnicianAvailability();
  const [awayOpen, setAwayOpen] = useState(false);
  const [awayUntil, setAwayUntil] = useState("");

  const setAvailable = () => {
    update.mutate(
      { available: true, awayUntil: null },
      {
        onSuccess: () => toast.success("You are available for assignments"),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  };

  const setPaused = () => {
    update.mutate(
      { available: false, awayUntil: null },
      {
        onSuccess: () => toast.message("New assignments paused"),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  };

  const submitAway = () => {
    if (!awayUntil) {
      return;
    }
    const iso = new Date(awayUntil).toISOString();
    update.mutate(
      { available: false, awayUntil: iso },
      {
        onSuccess: () => {
          toast.message("Away until set");
          setAwayOpen(false);
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  };

  const trigger = (
    <Button
      variant="outline"
      size={collapsed ? "icon-lg" : "sm"}
      className={collapsed ? "size-9" : "w-[160px] justify-start gap-2"}
      disabled={update.isPending}
    >
      {update.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Radio className="size-4" />
      )}
      {!collapsed && "Availability"}
    </Button>
  );

  const menu = (
    <div className="flex flex-col gap-1">
      <Button variant="ghost" size="sm" className="justify-start" onClick={setAvailable}>
        Available
      </Button>
      <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={setPaused}>
        <PauseCircle className="size-4" />
        Pause new assignments
      </Button>
      <Dialog open={awayOpen} onOpenChange={setAwayOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="justify-start">
            Away until…
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Away until</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="away-until">Date and time</Label>
            <Input
              id="away-until"
              type="datetime-local"
              value={awayUntil}
              onChange={(e) => setAwayUntil(e.currentTarget.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={submitAway} disabled={!awayUntil || update.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (collapsed) {
    return (
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">Availability</TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-xs">{menu}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">{menu}</DialogContent>
    </Dialog>
  );
}
