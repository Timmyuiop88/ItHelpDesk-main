import axios from "axios";

interface ApiErrorBody {
  code?: string;
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong";
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.code;
  }
  return undefined;
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
