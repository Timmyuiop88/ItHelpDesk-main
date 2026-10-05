export const ENDPOINTS = {
  auth: {
    login: "/api/v1/auth/login",
    me: "/api/v1/auth/me",
  },
  tickets: {
    base: "/api/v1/tickets",
    byId: (id: string) => `/api/v1/tickets/${id}`,
    comments: (id: string) => `/api/v1/tickets/${id}/comments`,
    devices: (id: string) => `/api/v1/tickets/${id}/devices`,
    assign: (id: string) => `/api/v1/tickets/${id}/assign`,
    transfer: (id: string) => `/api/v1/tickets/${id}/transfer`,
    resolve: (id: string) => `/api/v1/tickets/${id}/resolve`,
    close: (id: string) => `/api/v1/tickets/${id}/close`,
    participants: (id: string) => `/api/v1/tickets/${id}/participants`,
    participant: (id: string, userId: string) =>
      `/api/v1/tickets/${id}/participants/${userId}`,
  },
  employees: {
    base: "/api/v1/employees",
    me: "/api/v1/employees/me",
    byId: (id: string) => `/api/v1/employees/${id}`,
  },
  departments: {
    base: "/api/v1/departments",
  },
  devices: {
    base: "/api/v1/devices",
    me: "/api/v1/devices/me",
    byId: (id: string) => `/api/v1/devices/${id}`,
    register: "/api/v1/devices/register",
    unlink: (id: string) => `/api/v1/devices/${id}/unlink`,
    heartbeat: (id: string) => `/api/v1/devices/${id}/heartbeat`,
  },
  technicians: {
    base: "/api/v1/technicians",
    byId: (id: string) => `/api/v1/technicians/${id}`,
  },
  remoteSessions: {
    base: "/api/v1/remote-sessions",
    byId: (id: string) => `/api/v1/remote-sessions/${id}`,
    approve: (id: string) => `/api/v1/remote-sessions/${id}/approve`,
    deny: (id: string) => `/api/v1/remote-sessions/${id}/deny`,
    start: (id: string) => `/api/v1/remote-sessions/${id}/start`,
    end: (id: string) => `/api/v1/remote-sessions/${id}/end`,
    notes: (id: string) => `/api/v1/remote-sessions/${id}/notes`,
    timeline: (id: string) => `/api/v1/remote-sessions/${id}/timeline`,
  },
} as const;
