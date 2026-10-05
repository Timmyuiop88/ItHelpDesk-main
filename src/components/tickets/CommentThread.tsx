import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAddComment } from "../../hooks/tickets/useAddComment";
import { useTicketComments } from "../../hooks/tickets/useTicketComments";
import { getApiErrorMessage } from "../../lib/apiError";
import { fullName } from "../../lib/format";
import { getCommentAuthor, getCommentAuthorId } from "../../lib/tickets";

interface CommentThreadProps {
  ticketId: string;
  currentUserId?: string;
  disabled?: boolean;
}

export function CommentThread({
  ticketId,
  currentUserId,
  disabled = false,
}: CommentThreadProps) {
  const comments = useTicketComments(ticketId);
  const addComment = useAddComment();
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addComment.mutate(
      { id: ticketId, payload: { message } },
      {
        onSuccess: () => setMessage(""),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Conversation</h2>
      {comments.isLoading && <p className="text-sm">Loading comments...</p>}
      {comments.isError && (
        <p className="text-sm text-destructive">Failed to load comments.</p>
      )}
      {comments.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}
      {comments.data?.map((comment) => {
        const author = getCommentAuthor(comment);
        const mine = !!currentUserId && getCommentAuthorId(comment) === currentUserId;
        return (
          <div
            key={comment.id}
            className={`max-w-[85%] rounded-lg border p-3 ${
              mine
                ? "self-end border-primary/20 bg-primary/5"
                : "self-start border-border"
            }`}
          >
            <p className="mb-1 text-xs font-medium">
              {mine ? "You" : fullName(author) || "Unknown"}
              {!mine && author?.role && (
                <span className="ml-1.5 font-normal text-muted-foreground uppercase">
                  {author.role}
                </span>
              )}
            </p>
            <p className="text-sm whitespace-pre-wrap">{comment.message}</p>
            {comment.createdAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            )}
          </div>
        );
      })}
      {!disabled && (
        <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
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
      )}
    </section>
  );
}
