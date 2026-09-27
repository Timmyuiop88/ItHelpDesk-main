export const ENDPOINTS = {
  auth: {
    login: "/api/v1/auth/login",
    me: "/api/v1/auth/me",
  },
  tickets: {
    base: "/api/v1/tickets",
    byId: (id: string) => `/api/v1/tickets/${id}`,
    comments: (id: string) => `/api/v1/tickets/${id}/comments`,
    assign: (id: string) => `/api/v1/tickets/${id}/assign`,
    resolve: (id: string) => `/api/v1/tickets/${id}/resolve`,
    close: (id: string) => `/api/v1/tickets/${id}/close`,
  },
  employees: {
    base: "/api/v1/employees",
    byId: (id: string) => `/api/v1/employees/${id}`,
  },
  devices: {
    base: "/api/v1/devices",
    byId: (id: string) => `/api/v1/devices/${id}`,
    register: "/api/v1/devices/register",
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
