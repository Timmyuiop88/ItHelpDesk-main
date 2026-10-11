import { Send } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "../../hooks/auth/useMe";
import { useAddComment } from "../../hooks/tickets/useAddComment";
import { useTicketComments } from "../../hooks/tickets/useTicketComments";
import { getApiErrorMessage } from "../../lib/apiError";
import { fullName } from "../../lib/format";
import { getCommentAuthor } from "../../lib/tickets";
import type { TicketComment } from "../../types/ticket.types";

interface CommentFeedProps {
  ticketId: string;
  isClosed?: boolean;
}

interface CurrentIdentity {
  ids: Set<string>;
  email: string | null;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? time
    : `${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${time}`;
}

// `/auth/me` may expose the user id as `id`, `sub` or `userId`, and a comment
// may reference its author by `authorId`, `userId` or a nested object.
function isMine(comment: TicketComment, me: CurrentIdentity): boolean {
  const author = getCommentAuthor(comment);
  const authorIds = [comment.authorId, comment.userId, author?.id].filter(
    (value): value is string => !!value,
  );
  if (authorIds.some((id) => me.ids.has(id))) return true;
  return !!me.email && author?.email?.toLowerCase() === me.email;
}

export function CommentFeed({ ticketId, isClosed = false }: CommentFeedProps) {
  const me = useMe();
  const comments = useTicketComments(ticketId);
  const addComment = useAddComment();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const meData = me.data as (Record<string, unknown> & { email?: string }) | undefined;
  const identity: CurrentIdentity = {
    ids: new Set(
      [meData?.id, meData?.sub, meData?.userId].filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      ),
    ),
    email: meData?.email?.toLowerCase() ?? null,
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.data]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    addComment.mutate(
      { id: ticketId, payload: { message: message.trim() } },
      {
        onSuccess: () => setMessage(""),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const items = (comments.data ?? []).map((comment) => ({
    comment,
    mine: isMine(comment, identity),
    authorKey:
      comment.authorId ?? comment.userId ?? getCommentAuthor(comment)?.id ?? comment.id,
  }));

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        {comments.isLoading && (
          <p className="text-center text-sm text-muted-foreground">Loading messages…</p>
        )}
        {comments.isError && (
          <p className="text-center text-sm text-destructive">Failed to load messages.</p>
        )}
        {comments.data?.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Send className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground">
              {isClosed ? "This ticket is closed." : "Start the conversation below."}
            </p>
          </div>
        )}

        {items.map(({ comment, mine, authorKey }, index) => {
          const author = getCommentAuthor(comment);
          const name = fullName(author) || author?.email || "Unknown";
          const prev = items[index - 1];
          const next = items[index + 1];
          const startsGroup = !prev || prev.authorKey !== authorKey;
          const endsGroup = !next || next.authorKey !== authorKey;

          return (
            <div
              key={comment.id}
              className={`flex w-full items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${
                startsGroup ? "mt-3 first:mt-0" : "mt-0.5"
              }`}
            >
              {!mine && (
                <div className="w-8 shrink-0">
                  {endsGroup && (
                    <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground ring-1 ring-border">
                      {initials(name) || "?"}
                    </div>
                  )}
                </div>
              )}

              <div className={`flex max-w-[75%] flex-col ${mine ? "items-end" : "items-start"}`}>
                {!mine && startsGroup && (
                  <div className="mb-1 flex items-center gap-1.5 px-1">
                    <span className="text-xs font-medium text-foreground">{name}</span>
                    {author?.role && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {author.role}
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    mine
                      ? `bg-primary text-primary-foreground rounded-2xl ${endsGroup ? "rounded-br-md" : ""}`
                      : `bg-card text-card-foreground ring-1 ring-border rounded-2xl ${endsGroup ? "rounded-bl-md" : ""}`
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{comment.message}</p>
                </div>

                {endsGroup && comment.createdAt && (
                  <span className="mt-1 px-1 text-[10px] text-muted-foreground">
                    {formatTime(comment.createdAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {!isClosed && (
        <div className="border-t border-border bg-background px-3 py-3">
          <form className="flex items-end gap-2" onSubmit={handleSubmit}>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              placeholder="Type a message…"
              rows={1}
              className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <Button
              type="submit"
              size="icon-lg"
              className="shrink-0 rounded-full"
              disabled={!message.trim() || addComment.isPending}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            Enter to send · Shift+Enter for a new line
          </p>
        </div>
      )}

      {isClosed && (
        <div className="border-t border-border bg-muted/50 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">This ticket is closed — messaging is disabled.</p>
        </div>
      )}
    </div>
  );
}
