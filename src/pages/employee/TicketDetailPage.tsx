import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmployeeRemoteAccessCard } from "../../components/remote/EmployeeRemoteAccessCard";
import { useAddComment } from "../../hooks/tickets/useAddComment";
import { useCloseTicket } from "../../hooks/tickets/useCloseTicket";
import { useTicket } from "../../hooks/tickets/useTicket";
import { useTicketComments } from "../../hooks/tickets/useTicketComments";
import { getApiErrorMessage } from "../../lib/apiError";

export function TicketDetailPage() {
  const { id = "" } = useParams();
  const ticket = useTicket(id);
  const comments = useTicketComments(id);
  const addComment = useAddComment();
  const closeTicket = useCloseTicket();
  const [message, setMessage] = useState("");

  const handleComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    addComment.mutate(
      { id, payload: { message } },
      {
        onSuccess: () => {
          setMessage("");
          toast.success("Comment added");
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  const handleClose = () => {
    closeTicket.mutate(id, {
      onSuccess: () => {
        toast.success("Ticket closed");
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Link to="/employee/tickets" className="text-sm text-muted-foreground">
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
          <EmployeeRemoteAccessCard ticket={ticket.data} />
          {ticket.data.status !== "CLOSED" && (
            <Button
              variant="outline"
              disabled={closeTicket.isPending}
              onClick={handleClose}
            >
              Close ticket
            </Button>
          )}
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
