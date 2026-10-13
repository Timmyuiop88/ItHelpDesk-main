import { invoke, isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { updateTechnicianSession } from "../hooks/technicianSessionStore";
import { remoteSessionService } from "../services/remote-session.service";

const RUSTDESK_DOWNLOAD_URL = "https://rustdesk.com/download";

/**
 * Makes sure RustDesk is open before a session needs it. RustDesk only accepts
 * connections while running, and a cold-launched app drops the rustdesk:// link.
 * Returns false (after telling the user why) when RustDesk can't be started.
 */
export async function ensureRustdeskRunning(): Promise<boolean> {
  if (!isTauri()) {
    return true;
  }

  const toastId = toast.loading("Opening RustDesk…");
  try {
    const result = await invoke<"running" | "launched">("ensure_rustdesk_running");
    if (result === "launched") {
      toast.success("RustDesk is open", { id: toastId });
    } else {
      toast.dismiss(toastId);
    }
    return true;
  } catch (error) {
    const reason = String(error);
    if (reason.includes("not_installed")) {
      toast.error("RustDesk isn't installed", {
        id: toastId,
        description: "Install RustDesk, then try again.",
        action: {
          label: "Download",
          onClick: () => void openUrl(RUSTDESK_DOWNLOAD_URL),
        },
      });
    } else {
      toast.error("RustDesk didn't start", {
        id: toastId,
        description: "Open RustDesk manually, then try again.",
      });
    }
    return false;
  }
}

export async function openRustdesk(link: string): Promise<boolean> {
  if (!(await ensureRustdeskRunning())) {
    return false;
  }
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
