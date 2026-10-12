import { Loader2, MessageCircle, Send } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "../../components/common/pagination/Pagination";
import { infinitePropsFromPaged } from "../../components/common/pagination/paginationAdapters";
import { RefreshButton } from "../../components/common/RefreshButton";
import {
  useChatConversations,
  useChatMessages,
  useMarkChatRead,
  useSendChatMessage,
} from "../../hooks/chat/useChat";
import { useChatSocket } from "../../hooks/chat/useChatSocket";
import { useMe } from "../../hooks/auth/useMe";
import { getApiErrorMessage } from "../../lib/apiError";
import { fullName } from "../../lib/format";
import type { ChatConversation, ChatMessage } from "../../types/chat.types";

function conversationTitle(conv: ChatConversation, myId: string | undefined): string {
  if (conv.title && conv.title.trim().length > 0) {
    return conv.title;
  }
  const others = (conv.participants ?? []).filter(
    (p) => (p.userId ?? p.user?.id) !== myId,
  );
  const names = others
    .map((p) => fullName(p.user) || p.user?.email)
    .filter(Boolean)
    .join(", ");
  return names || "Conversation";
}

function messageAuthor(message: ChatMessage): string {
  return fullName(message.sender) || message.sender?.email || "Unknown";
}

export function ChatPage() {
  const me = useMe();
  const conversations = useChatConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const messages = useChatMessages(selectedId);
  const send = useSendChatMessage(selectedId ?? "");
  const markRead = useMarkChatRead();
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useChatSocket(selectedId);

  useEffect(() => {
    if (!selectedId && conversations.items[0]?.id) {
      setSelectedId(conversations.items[0].id);
    }
  }, [conversations.items, selectedId]);

  useEffect(() => {
    if (selectedId) {
      markRead.mutate(selectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark read when switching threads
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.items.length, selectedId]);

  const handleLoadOlder = () => {
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    messages.loadMore();
    requestAnimationFrame(() => {
      if (el) {
        el.scrollTop += el.scrollHeight - prevHeight;
      }
    });
  };

  const myId = me.data?.id;

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId || !body.trim()) {
      return;
    }
    send.mutate(
      { body: body.trim() },
      {
        onSuccess: () => setBody(""),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  };

  const list = conversations.items;
  const messageItems = messages.items;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between">
        <h1 className="text-2xl font-semibold">Chat</h1>
        <RefreshButton
          onRefresh={async () => {
            await conversations.refetch();
            if (selectedId) {
              await messages.refetch();
            }
          }}
          iconOnly
        />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
        <aside className="flex w-64 shrink-0 flex-col border-r border-border">
          <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.isLoading && (
              <p className="p-3 text-xs text-muted-foreground">Loading…</p>
            )}
            {list.map((conv) => {
              const title = conversationTitle(conv, myId);
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedId(conv.id)}
                  className={`flex w-full flex-col gap-0.5 border-b border-border px-3 py-2.5 text-left text-sm hover:bg-muted/50 ${
                    selectedId === conv.id ? "bg-primary/5" : ""
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 font-medium">
                    {title}
                    {(conv.unreadCount ?? 0) > 0 && (
                      <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </span>
                  {conv.lastMessage?.body && (
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {conv.lastMessage.body}
                    </span>
                  )}
                </button>
              );
            })}
            {list.length === 0 && !conversations.isLoading && (
              <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
                <MessageCircle className="size-8 opacity-40" />
                <p className="text-xs">No conversations yet.</p>
              </div>
            )}
            <Pagination variant="infinite" {...infinitePropsFromPaged(conversations)} />
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
                {messages.hasMore && (
                  <Pagination
                    variant="loadMore"
                    direction="older"
                    hasMore={messages.hasMore}
                    isFetchingMore={messages.isFetchingMore}
                    onLoadMore={handleLoadOlder}
                  />
                )}
                {messages.isLoading && (
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                )}
                {messageItems.map((message) => {
                  const mine = message.senderId === myId;
                  return (
                    <div
                      key={message.id}
                      className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground ring-1 ring-border"
                        }`}
                      >
                        {!mine && (
                          <p className="mb-0.5 text-[10px] font-medium opacity-80">
                            {messageAuthor(message)}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form
                onSubmit={handleSend}
                className="flex items-end gap-2 border-t border-border p-3"
              >
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.currentTarget.value)}
                  placeholder="Message…"
                  rows={1}
                  className="min-h-10 flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <Button type="submit" size="icon-lg" disabled={!body.trim() || send.isPending}>
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
