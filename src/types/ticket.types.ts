import type { AuthUser } from "./auth.types";
import type { Employee } from "./employee.types";
import type { Technician } from "./technician.types";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_EMPLOYEE"
  | "RESOLVED"
  | "CLOSED";

export type TicketSource = "PORTAL" | "EMAIL";

export type CommentVisibility = "PUBLIC" | "INTERNAL";

export type CommentSource = "PORTAL" | "EMAIL";

export interface TicketCategory {
  id: string;
  name: string;
  slug?: string;
}

export interface ExternalRequester {
  name: string;
  email: string;
}

export type TicketUser = Pick<AuthUser, "id"> &
  Partial<Omit<AuthUser, "id">>;

export interface Ticket {
  id: string;
  ticketNumber?: string | number;
  title: string;
  description: string;
  priority: string;
  status: TicketStatus;
  source?: TicketSource;
  categoryId?: string | null;
  category?: TicketCategory | null;
  deviceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  employeeId?: string | null;
  employee?: Employee | null;
  externalRequester?: ExternalRequester | null;
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
  categoryId?: string;
}

export type UpdateTicketPayload = Partial<CreateTicketPayload> & {
  status?: TicketStatus;
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
  visibility?: CommentVisibility;
  source?: CommentSource;
  authorName?: string | null;
  authorEmail?: string | null;
  authorId?: string;
  author?: TicketUser | null;
  userId?: string;
  user?: TicketUser | null;
}

export interface CreateCommentPayload {
  message: string;
  visibility?: CommentVisibility;
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

export interface TicketAssignmentHistoryEntry {
  id: string;
  ticketId: string;
  fromTechnicianId?: string | null;
  toTechnicianId?: string | null;
  fromTechnicianName?: string | null;
  toTechnicianName?: string | null;
  note?: string | null;
  createdAt?: string;
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

export interface TicketLifecycleEvent {
  ticketId: string;
  ticketNumber?: string | number;
  title?: string;
}
