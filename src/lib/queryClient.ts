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
  },
  employees: {
    all: ["employees"] as const,
    detail: (id: string) => ["employees", id] as const,
  },
  devices: {
    all: ["devices"] as const,
    detail: (id: string) => ["devices", id] as const,
  },
  technicians: {
    all: ["technicians"] as const,
    detail: (id: string) => ["technicians", id] as const,
  },
} as const;
