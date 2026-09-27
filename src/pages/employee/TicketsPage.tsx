import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useDeviceAgentState } from "../../components/DeviceAgentContext";
import { useCreateTicket } from "../../hooks/tickets/useCreateTicket";
import { useTickets } from "../../hooks/tickets/useTickets";
import { getApiErrorMessage } from "../../lib/apiError";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export function TicketsPage() {
  const tickets = useTickets();
  const createTicket = useCreateTicket();
  const agent = useDeviceAgentState();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("MEDIUM");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    createTicket.mutate(
      {
        title,
        description,
        priority,
        deviceId: agent.device?.id,
      },
      {
        onSuccess: () => {
          toast.success("Ticket created");
          setOpen(false);
          setTitle("");
          setDescription("");
          setPriority("MEDIUM");
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create ticket</DialogTitle>
            </DialogHeader>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.currentTarget.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.currentTarget.value)
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                  value={priority}
                  onChange={(event) => setPriority(event.currentTarget.value)}
                >
                  {PRIORITIES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createTicket.isPending}>
                  {createTicket.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tickets.isLoading && <p className="text-sm">Loading tickets...</p>}
      {tickets.isError && (
        <p className="text-sm text-destructive">Failed to load tickets.</p>
      )}

      <div className="flex flex-col gap-3">
        {tickets.data?.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                <Link to={`/employee/tickets/${ticket.id}`}>{ticket.title}</Link>
              </CardTitle>
              <Badge>{ticket.status}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {ticket.description}
              </p>
            </CardContent>
          </Card>
        ))}
        {tickets.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No tickets yet.</p>
        )}
      </div>
    </div>
  );
}
