import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
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
  },
} as const;
