import { QueryClient } from "@tanstack/react-query";

function queryRetry(failureCount: number, error: unknown): boolean {
  const status =
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { status?: number } }).response?.status === "number"
      ? (error as { response: { status: number } }).response.status
      : undefined;

  if (status !== undefined && status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return false;
  }
  return failureCount < 1;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: queryRetry,
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  tickets: {
    all: ["tickets"] as const,
    detail: (id: string) => ["tickets", id] as const,
    comments: (id: string) => ["tickets", id, "comments"] as const,
    participants: (id: string) => ["tickets", id, "participants"] as const,
    devices: (id: string) => ["tickets", id, "devices"] as const,
    assignmentHistory: (id: string) =>
      ["tickets", id, "assignment-history"] as const,
  },
  employees: {
    all: ["employees"] as const,
    list: (departmentId?: string) =>
      ["employees", "list", departmentId ?? "all"] as const,
  },
  departments: {
    all: ["departments"] as const,
  },
  devices: {
    all: ["devices"] as const,
    mine: ["devices", "mine"] as const,
    detail: (id: string) => ["devices", "detail", id] as const,
  },
  technicians: {
    all: ["technicians"] as const,
    list: (departmentId?: string) =>
      ["technicians", "list", departmentId ?? "all"] as const,
    availability: ["technicians", "me", "availability"] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (page?: number) => ["notifications", "list", page ?? 1] as const,
    unread: ["notifications", "unread-count"] as const,
  },
  chat: {
    all: ["chat"] as const,
    conversations: ["chat", "conversations"] as const,
    messages: (id: string) => ["chat", "conversations", id, "messages"] as const,
  },
} as const;
