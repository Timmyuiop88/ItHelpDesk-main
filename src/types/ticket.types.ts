export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_EMPLOYEE"
  | "RESOLVED"
  | "CLOSED";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: TicketStatus;
  deviceId?: string;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: string;
  deviceId?: string;
}

export type UpdateTicketPayload = Partial<CreateTicketPayload> & {
  status?: "IN_PROGRESS" | "WAITING_FOR_EMPLOYEE";
};

export interface AssignTicketPayload {
  technicianId: string;
}

export interface TicketComment {
  id: string;
  message: string;
  createdAt?: string;
}

export interface CreateCommentPayload {
  message: string;
}
