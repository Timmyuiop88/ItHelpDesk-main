import type { AuthUser } from "./auth.types";
import type { Employee } from "./employee.types";
import type { Technician } from "./technician.types";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_EMPLOYEE"
  | "RESOLVED"
  | "CLOSED";

export type TicketUser = Pick<AuthUser, "id"> &
  Partial<Omit<AuthUser, "id">>;

export interface Ticket {
  id: string;
  ticketNumber?: string | number;
  title: string;
  description: string;
  priority: string;
  status: TicketStatus;
  deviceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  employeeId?: string;
  employee?: Employee | null;
  assignedTechnicianId?: string | null;
  assignedTechnician?: Technician | null;
  technicianId?: string | null;
  technician?: Technician | null;
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

export interface TransferTicketPayload {
  technicianId: string;
  note?: string;
}

export interface TicketComment {
  id: string;
  message: string;
  createdAt?: string;
  authorId?: string;
  author?: TicketUser | null;
  userId?: string;
  user?: TicketUser | null;
}

export interface CreateCommentPayload {
  message: string;
}

export interface TicketParticipant {
  id?: string;
  userId?: string;
  user?: TicketUser | null;
  addedById?: string;
  createdAt?: string;
}

export interface AddParticipantPayload {
  userId: string;
}

export interface TicketCommentEvent {
  ticketId: string;
  ticketNumber?: string | number;
  comment: TicketComment;
}

export interface TicketAssignedEvent {
  ticketId: string;
  ticketNumber?: string | number;
  title: string;
}

export interface TicketTransferredEvent {
  ticketId: string;
  ticketNumber?: string | number;
  title: string;
  toTechnicianId: string;
  toTechnicianName: string;
  note?: string | null;
}

export interface TicketParticipantAddedEvent {
  ticketId: string;
  ticketNumber?: string | number;
  title: string;
  addedById: string;
}

export interface TicketParticipantRemovedEvent {
  ticketId: string;
  ticketNumber?: string | number;
  title: string;
}
