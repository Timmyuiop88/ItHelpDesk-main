import { AlertTriangle, Link2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeviceAgentState } from "../DeviceAgentContext";

const TITLES = {
  "owned-by-other": "This computer is linked to another user",
  "limit-reached": "Device limit reached",
  unlinked: "This computer was unlinked",
  failed: "Couldn't register this computer",
} as const;

export function DeviceIssueNotice() {
  const agent = useDeviceAgentState();
  const issue = agent.issue;

  if (!issue) {
    return null;
  }

  const relink = issue.kind === "unlinked";

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-amber-300/60 bg-amber-50 p-4 dark:bg-amber-500/10">
      <AlertTriangle className="size-5 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{TITLES[issue.kind]}</p>
        <p className="text-sm text-muted-foreground">{issue.message}</p>
      </div>
      <Button
        variant="outline"
        onClick={agent.reregister}
        disabled={agent.isRegistering}
      >
        {agent.isRegistering ? (
          <Loader2 className="animate-spin" />
        ) : relink ? (
          <Link2 />
        ) : (
          <RefreshCw />
        )}
        {relink ? "Link this computer again" : "Try again"}
      </Button>
    </div>
  );
}
