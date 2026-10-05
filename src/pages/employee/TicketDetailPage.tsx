import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeRemoteAccessCard } from "../../components/remote/EmployeeRemoteAccessCard";
import { CommentThread } from "../../components/tickets/CommentThread";
import { ParticipantsPanel } from "../../components/tickets/ParticipantsPanel";
import { TicketMeta } from "../../components/tickets/TicketMeta";
import { useMe } from "../../hooks/auth/useMe";
import { useCloseTicket } from "../../hooks/tickets/useCloseTicket";
import { useTicket } from "../../hooks/tickets/useTicket";
import { getApiErrorMessage } from "../../lib/apiError";

export function TicketDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const me = useMe();
  const ticket = useTicket(id);
  const closeTicket = useCloseTicket();

  const ownerUserId =
    ticket.data?.employee?.user?.id ?? ticket.data?.employee?.userId;
  const isOwner = !ownerUserId || ownerUserId === me.data?.id;

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
              <TicketMeta
                ticket={ticket.data}
                showRequester={!isOwner}
                className="mt-1"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {ticket.data.description}
              </p>
            </div>
            <Badge>{ticket.data.status}</Badge>
          </div>
          {isOwner && <EmployeeRemoteAccessCard ticket={ticket.data} />}
          {isOwner && ticket.data.status !== "CLOSED" && (
            <Button
              variant="outline"
              disabled={closeTicket.isPending}
              onClick={handleClose}
            >
              Close ticket
            </Button>
          )}
          <ParticipantsPanel
            ticketId={id}
            currentUserId={me.data?.id}
            canManage={false}
            onLeft={() => navigate("/employee/tickets", { replace: true })}
          />
          <CommentThread
            ticketId={id}
            currentUserId={me.data?.id}
            disabled={ticket.data.status === "CLOSED"}
          />
        </>
      )}
    </div>
  );
}
