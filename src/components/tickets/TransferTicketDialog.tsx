import { ArrowRightLeft, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTechnicians } from "../../hooks/technicians/useTechnicians";
import { useTransferTicket } from "../../hooks/tickets/useTransferTicket";
import { getApiErrorMessage } from "../../lib/apiError";
import { fullName } from "../../lib/format";

interface TransferTicketDialogProps {
  ticketId: string;
  currentTechnicianId: string | null;
}

export function TransferTicketDialog({
  ticketId,
  currentTechnicianId,
}: TransferTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [note, setNote] = useState("");
  const technicians = useTechnicians(undefined, { enabled: open });
  const transfer = useTransferTicket();

  const query = search.trim().toLowerCase();
  const candidates = (technicians.data ?? []).filter((technician) => {
    if (technician.id === currentTechnicianId) return false;
    if (!query) return true;
    return [fullName(technician.user), technician.user?.email, technician.department?.name]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query));
  });

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setSearch("");
      setSelectedId("");
      setNote("");
    }
    setOpen(next);
  };

  const submit = () => {
    const trimmed = note.trim();
    transfer.mutate(
      {
        id: ticketId,
        payload: { technicianId: selectedId, ...(trimmed ? { note: trimmed } : {}) },
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Ticket transferred");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRightLeft />
          Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer ticket</DialogTitle>
          <DialogDescription>
            Hand this ticket to another technician. A note is posted to the conversation so everyone can see the handover.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Search by name, email or department"
        />

        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1" role="radiogroup">
          {technicians.isLoading && (
            <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading technicians…
            </p>
          )}
          {technicians.isError && (
            <p className="py-4 text-sm text-destructive">Failed to load technicians.</p>
          )}
          {!technicians.isLoading && candidates.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No other technicians found.
            </p>
          )}
          {candidates.map((technician) => {
            const selected = technician.id === selectedId;
            return (
              <button
                key={technician.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedId(technician.id)}
                className={`flex flex-col rounded-lg border p-3 text-left transition-all ${
                  selected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <span className="text-sm font-medium">
                  {fullName(technician.user) || technician.employeeNumber || technician.id}
                </span>
                <span className="text-xs text-muted-foreground">
                  {[technician.department?.name, technician.user?.email]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="transfer-note">Note (optional)</Label>
          <Textarea
            id="transfer-note"
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
            placeholder="e.g. Needs the network team"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!selectedId || transfer.isPending}>
            {transfer.isPending ? <Loader2 className="animate-spin" /> : <ArrowRightLeft />}
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
