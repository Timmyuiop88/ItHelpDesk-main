import { useNavigate, useParams } from "react-router-dom";
import { RefreshButton } from "../../components/common/RefreshButton";
import { CommentFeed } from "../../components/tickets/CommentFeed";
import { TicketSidebar } from "../../components/tickets/TicketSidebar";
import { TicketMeta } from "../../components/tickets/TicketMeta";
import { useMe } from "../../hooks/auth/useMe";
import { useTicket } from "../../hooks/tickets/useTicket";
import { useTicketComments } from "../../hooks/tickets/useTicketComments";
import { useTicketParticipants } from "../../hooks/tickets/useTicketParticipants";

export function TicketDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const me = useMe();
  const ticket = useTicket(id);
  const comments = useTicketComments(id);
  const participants = useTicketParticipants(id);

  const ownerUserId =
    ticket.data?.employee?.user?.id ?? ticket.data?.employee?.userId;
  const isOwner = !ownerUserId || ownerUserId === me.data?.id;
  const isClosed = ticket.data?.status === "CLOSED";

  const handleRefresh = async () => {
    await Promise.all([ticket.refetch(), comments.refetch(), participants.refetch()]);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between pb-4">
        <button
          type="button"
          onClick={() => navigate("/employee/tickets")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to tickets
        </button>
        <RefreshButton onRefresh={handleRefresh} iconOnly />
      </div>

      {ticket.isLoading && (
        <p className="text-sm text-muted-foreground">Loading ticket…</p>
      )}
      {ticket.isError && (
        <p className="text-sm text-destructive">Failed to load ticket.</p>
      )}

      {ticket.data && (
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden lg:gap-6">
          {/* ── Left column: header + chat ── */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Ticket header */}
            <div className="shrink-0 pb-3">
              <h1 className="text-xl font-semibold leading-tight">{ticket.data.title}</h1>
              <TicketMeta
                ticket={ticket.data}
                showRequester={!isOwner}
                className="mt-1"
              />
              {ticket.data.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {ticket.data.description}
                </p>
              )}
            </div>

            {/* Chat feed fills remaining space */}
            <CommentFeed ticketId={id} isClosed={isClosed} />
          </div>

          {/* ── Right sidebar ── */}
          <TicketSidebar
            ticket={ticket.data}
            ticketId={id}
            currentUserId={me.data?.id}
            role="employee"
            onLeft={() => navigate("/employee/tickets", { replace: true })}
          />
        </div>
      )}
    </div>
  );
}
