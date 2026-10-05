import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { RefreshButton } from "../../components/common/RefreshButton";
import { useDeviceAgentState } from "../../components/DeviceAgentContext";
import { TicketMeta } from "../../components/tickets/TicketMeta";
import { useCreateTicket } from "../../hooks/tickets/useCreateTicket";
import { useTickets } from "../../hooks/tickets/useTickets";
import { getApiErrorMessage } from "../../lib/apiError";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export function TicketsPage() {
  const tickets = useTickets();
  const createTicket = useCreateTicket();
  const agent = useDeviceAgentState();
  const navigate = useNavigate();
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
      case "LOW":
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <div className="flex gap-2">
          <RefreshButton onRefresh={async () => { await tickets.refetch(); }} iconOnly />
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
      </div>

      {tickets.isLoading && <p className="text-sm">Loading tickets...</p>}
      {tickets.isError && (
        <p className="text-sm text-destructive">Failed to load tickets.</p>
      )}

      <div className="flex flex-col gap-3">
        {tickets.data?.map((ticket) => (
          <Card 
            key={ticket.id} 
            className="cursor-pointer transition-all hover:border-primary/60 hover:shadow-md group"
            onClick={() => navigate(`/employee/tickets/${ticket.id}`)}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base group-hover:text-primary transition-colors">
                  {ticket.title}
                </CardTitle>
                <TicketMeta ticket={ticket} />
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
                <Badge>{ticket.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ticket.description}
              </p>
            </CardContent>
          </Card>
        ))}
        {tickets.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
              <svg className="size-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">No tickets yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              You haven't created any support tickets. If you need help, create one now.
            </p>
            <Button onClick={() => setOpen(true)}>Create your first ticket</Button>
          </div>
        )}
      </div>
    </div>
  );
}
