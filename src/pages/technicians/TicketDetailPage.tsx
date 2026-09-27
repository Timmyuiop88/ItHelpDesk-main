import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RemoteSessionPanel } from "../../components/remote/RemoteSessionPanel";
import { useCloseTicket } from "../../hooks/tickets/useCloseTicket";
import { useAddComment } from "../../hooks/tickets/useAddComment";
import { useAssignTicket } from "../../hooks/tickets/useAssignTicket";
import { useResolveTicket } from "../../hooks/tickets/useResolveTicket";
import { useTicket } from "../../hooks/tickets/useTicket";
import { useTicketComments } from "../../hooks/tickets/useTicketComments";
import { useUpdateTicket } from "../../hooks/tickets/useUpdateTicket";
import { useCurrentTechnicianId } from "../../hooks/technicians/useCurrentTechnicianId";
import { getApiErrorMessage } from "../../lib/apiError";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export function TicketDetailPage() {
  const { id = "" } = useParams();
  const ticket = useTicket(id);
  const comments = useTicketComments(id);
  const addComment = useAddComment();
  const assignTicket = useAssignTicket();
  const updateTicket = useUpdateTicket();
  const resolveTicket = useResolveTicket();
  const closeTicket = useCloseTicket();
  const technicianId = useCurrentTechnicianId();
  const [message, setMessage] = useState("");

  const status = ticket.data?.status;
  const canWork =
    status === "IN_PROGRESS" || status === "WAITING_FOR_EMPLOYEE";

  const handleComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addComment.mutate(
      { id, payload: { message } },
      {
        onSuccess: () => {
          setMessage("");
          toast.success("Comment added");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const handleAssign = () => {
    if (!technicianId) {
      toast.error("Could not match your technician profile.");
      return;
    }
    assignTicket.mutate(
      { id, payload: { technicianId } },
      {
        onSuccess: () => toast.success("Ticket assigned"),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const handleWaiting = () => {
    updateTicket.mutate(
      { id, payload: { status: "WAITING_FOR_EMPLOYEE" } },
      {
        onSuccess: () => toast.success("Waiting for employee"),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const handlePriority = (priority: string) => {
    updateTicket.mutate(
      { id, payload: { priority } },
      {
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Link to="/technician/tickets" className="text-sm text-muted-foreground">
        Back to tickets
      </Link>
      {ticket.isLoading && <p>Loading ticket...</p>}
      {ticket.isError && (
        <p className="text-destructive">Failed to load ticket.</p>
      )}
      {ticket.data && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{ticket.data.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {ticket.data.description}
              </p>
            </div>
            <Badge>{ticket.data.status}</Badge>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              className="h-8 w-40 rounded-lg border border-input bg-background px-2 text-sm"
              value={ticket.data.priority}
              onChange={(event) => handlePriority(event.currentTarget.value)}
            >
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {status === "OPEN" && (
              <Button
                onClick={handleAssign}
                disabled={assignTicket.isPending || !technicianId}
              >
                Assign to me
              </Button>
            )}
            {status === "IN_PROGRESS" && (
              <Button variant="outline" onClick={handleWaiting}>
                Waiting for employee
              </Button>
            )}
            {canWork && (
              <Button
                variant="outline"
                disabled={resolveTicket.isPending}
                onClick={() =>
                  resolveTicket.mutate(id, {
                    onSuccess: () => toast.success("Ticket resolved"),
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  })
                }
              >
                Resolve
              </Button>
            )}
            {status !== "CLOSED" && (
              <Button
                variant="outline"
                disabled={closeTicket.isPending}
                onClick={() =>
                  closeTicket.mutate(id, {
                    onSuccess: () => toast.success("Ticket closed"),
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  })
                }
              >
                Close
              </Button>
            )}
          </div>

          <RemoteSessionPanel
            ticketId={id}
            defaultDeviceId={ticket.data.deviceId ?? undefined}
            disabled={status === "CLOSED"}
          />

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Comments</h2>
            {comments.isLoading && <p className="text-sm">Loading comments...</p>}
            {comments.data?.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-border p-3">
                <p className="text-sm">{comment.message}</p>
                {comment.createdAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
            <form className="flex flex-col gap-2" onSubmit={handleComment}>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.currentTarget.value)}
                placeholder="Write a comment"
                required
              />
              <Button type="submit" disabled={addComment.isPending}>
                Add comment
              </Button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
