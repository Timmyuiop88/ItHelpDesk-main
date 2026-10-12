import axios from "axios";
import { toast } from "sonner";

interface ApiErrorBody {
  code?: string;
  statusCode?: number;
  message?: string | string[];
  error?: string;
  requestId?: string;
  details?: Record<string, unknown> & { allowed?: string[] };
}

export interface ParsedApiError {
  status?: number;
  code?: string;
  message: string;
  requestId?: string;
  details?: ApiErrorBody["details"];
}

const FRIENDLY_BY_CODE: Record<string, string> = {
  INVALID_TICKET_TRANSITION: "That status change isn't allowed for this ticket.",
  TOKEN_EXPIRED: "Your session expired. Please sign in again.",
  AUTH_REVOKED: "Your session was revoked.",
  RATE_LIMITED: "Too many requests. Please wait a moment.",
};

function rawMessage(data: ApiErrorBody | undefined): string | undefined {
  if (!data) {
    return undefined;
  }
  const message = data.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  if (typeof message === "string" && message.length > 0) {
    return message;
  }
  if (typeof data.error === "string" && data.error.length > 0) {
    return data.error;
  }
  return undefined;
}

export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    const code = data?.code;
    const message =
      (code && FRIENDLY_BY_CODE[code]) ||
      rawMessage(data) ||
      error.message ||
      "Something went wrong";
    return {
      status: error.response?.status,
      code,
      message,
      requestId: data?.requestId,
      details: data?.details,
    };
  }

  if (error instanceof Error && error.message) {
    return { message: error.message };
  }

  return { message: "Something went wrong" };
}

export function getApiErrorMessage(error: unknown): string {
  return parseApiError(error).message;
}

export function getApiErrorCode(error: unknown): string | undefined {
  return parseApiError(error).code;
}

export function getApiErrorRequestId(error: unknown): string | undefined {
  return parseApiError(error).requestId;
}

export function getInvalidTransitionAllowed(error: unknown): string[] | undefined {
  const parsed = parseApiError(error);
  if (parsed.code !== "INVALID_TICKET_TRANSITION") {
    return undefined;
  }
  const allowed = parsed.details?.allowed;
  return Array.isArray(allowed) ? allowed.filter((s): s is string => typeof s === "string") : undefined;
}

export function toastApiError(error: unknown, title?: string): void {
  const parsed = parseApiError(error);
  const description = parsed.requestId
    ? `${parsed.message} (ref: ${parsed.requestId})`
    : parsed.message;

  if (parsed.requestId) {
    toast.error(title ?? "Request failed", {
      description,
      action: {
        label: "Copy ref",
        onClick: () => {
          void navigator.clipboard.writeText(parsed.requestId!);
        },
      },
    });
    return;
  }

  toast.error(title ?? "Request failed", { description });
}

export function getLoginErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;

  if (code === "DEVICE_LINKED_TO_ANOTHER_USER" || status === 409) {
    return "This computer belongs to another user. They or IT must unlink it first.";
  }
  if (code === "DEVICE_LIMIT_REACHED") {
    return "You've reached your device limit. Unlink an old device first.";
  }
  if (code === "DEVICE_REQUIRED") {
    return "This app couldn't identify your computer. Please restart it and try again.";
  }
  if (status === 401) {
    return "Wrong email or password.";
  }
  return getApiErrorMessage(error);
}
