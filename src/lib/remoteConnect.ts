import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { updateTechnicianSession } from "../hooks/technicianSessionStore";
import { remoteSessionService } from "../services/remote-session.service";

export async function openRustdesk(link: string): Promise<boolean> {
  try {
    await openUrl(link);
    return true;
  } catch {
    toast.error("Could not open RustDesk", {
      description:
        "Make sure RustDesk is installed, or copy the link and open it manually.",
    });
    return false;
  }
}

export async function connectToSession(sessionId: string): Promise<void> {
  let connection;
  try {
    connection = await remoteSessionService.connection(sessionId);
  } catch {
    toast.error("Could not fetch connection details", {
      description: "Try again from the remote support panel.",
    });
    return;
  }

  const opened = await openRustdesk(connection.rustdeskLink);
  if (!opened) {
    updateTechnicianSession(sessionId, {
      status: "APPROVED",
      rustdeskLink: connection.rustdeskLink,
    });
    return;
  }

  try {
    await remoteSessionService.start(sessionId, {
      approvalToken: connection.approvalToken,
    });
    updateTechnicianSession(sessionId, {
      status: "ACTIVE",
      rustdeskLink: connection.rustdeskLink,
    });
  } catch {
    toast.error("Approved, but the session could not be marked active.", {
      description: "Use “Connect” in the remote support panel to retry.",
    });
    updateTechnicianSession(sessionId, {
      status: "APPROVED",
      rustdeskLink: connection.rustdeskLink,
    });
  }
}
