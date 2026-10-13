import { Check, Loader2, MessageSquarePlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { useCreateChatConversation } from "../../hooks/chat/useChat";
import { useAllEmployees } from "../../hooks/employees/useEmployees";
import { useAllTechnicians } from "../../hooks/technicians/useTechnicians";
import { getApiErrorMessage } from "../../lib/apiError";
import { fullName } from "../../lib/format";
import type { UserRole } from "../../lib/roles";

/** API limit on participantUserIds. */
const MAX_PARTICIPANTS = 20;

interface ChatContact {
  userId: string;
  name: string;
  email?: string;
  roleLabel: string;
  detail?: string;
}

interface NewChatDialogProps {
  myId: string | undefined;
  myRole: UserRole | undefined;
  onCreated: (conversationId: string) => void;
}

export function NewChatDialog({ myId, myRole, onCreated }: NewChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  // Employees can only start chats with staff, and can't list employees.
  const canSeeEmployees = myRole !== "EMPLOYEE";
  const technicians = useAllTechnicians(undefined, { enabled: open });
  const employees = useAllEmployees(undefined, { enabled: open && canSeeEmployees });
  const create = useCreateChatConversation();

  const contacts = useMemo(() => {
    const byUserId = new Map<string, ChatContact>();
    for (const technician of technicians.data ?? []) {
      const userId = technician.userId ?? technician.user?.id;
      if (!userId || userId === myId) continue;
      byUserId.set(userId, {
        userId,
        name: fullName(technician.user) || technician.user?.email || "Technician",
        email: technician.user?.email,
        roleLabel: "Technician",
        detail: technician.department?.name,
      });
    }
    if (canSeeEmployees) {
      for (const employee of employees.data ?? []) {
        const userId = employee.userId ?? employee.user?.id;
        if (!userId || userId === myId || byUserId.has(userId)) continue;
        byUserId.set(userId, {
          userId,
          name: fullName(employee.user) || employee.user?.email || "Employee",
          email: employee.user?.email,
          roleLabel: "Employee",
          detail: [employee.jobTitle, employee.department?.name].filter(Boolean).join(" · "),
        });
      }
    }
    return [...byUserId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [technicians.data, employees.data, canSeeEmployees, myId]);

  const query = search.trim().toLowerCase();
  const candidates = query
    ? contacts.filter((contact) =>
        [contact.name, contact.email, contact.detail, contact.roleLabel]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query)),
      )
    : contacts;

  const isLoading = technicians.isLoading || (canSeeEmployees && employees.isLoading);
  const isError = technicians.isError || (canSeeEmployees && employees.isError);
  const isGroup = selectedIds.length > 1;

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setSearch("");
      setSelectedIds([]);
      setTitle("");
    }
    setOpen(next);
  };

  const toggle = (userId: string) => {
    setSelectedIds((current) => {
      if (current.includes(userId)) {
        return current.filter((id) => id !== userId);
      }
      if (current.length >= MAX_PARTICIPANTS) {
        toast.error(`You can add up to ${MAX_PARTICIPANTS} people`);
        return current;
      }
      return [...current, userId];
    });
  };

  const submit = () => {
    const trimmedTitle = title.trim();
    create.mutate(
      {
        participantUserIds: selectedIds,
        ...(isGroup && trimmedTitle ? { title: trimmedTitle } : {}),
      },
      {
        onSuccess: (conversation) => {
          setOpen(false);
          onCreated(conversation.id);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Start chat" title="Start chat">
          <MessageSquarePlus />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a chat</DialogTitle>
          <DialogDescription>
            {canSeeEmployees
              ? "Pick one person for a direct message, or several to start a group."
              : "Pick a member of the IT team to message, or several to start a group."}
          </DialogDescription>
        </DialogHeader>

        <Input
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Search by name, email or department"
          autoFocus
        />

        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {isLoading && (
            <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading people…
            </p>
          )}
          {isError && (
            <p className="py-4 text-sm text-destructive">Failed to load people.</p>
          )}
          {!isLoading && !isError && candidates.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No one matches your search.
            </p>
          )}
          {candidates.map((contact) => {
            const selected = selectedIds.includes(contact.userId);
            return (
              <button
                key={contact.userId}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(contact.userId)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  selected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{contact.name}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {contact.roleLabel}
                    </Badge>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[contact.detail, contact.email].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {selected && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>

        {isGroup && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-chat-title">Group name (optional)</Label>
            <Input
              id="new-chat-title"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="e.g. Printer rollout"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={selectedIds.length === 0 || create.isPending}>
            {create.isPending ? <Loader2 className="animate-spin" /> : <MessageSquarePlus />}
            {isGroup ? `Start group (${selectedIds.length})` : "Start chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
