import { apiDelete, apiGet, apiPatch, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type { TicketDevicesResponse } from "../types/device.types";
import type {
  AddParticipantPayload,
  AssignTicketPayload,
  CreateCommentPayload,
  CreateTicketPayload,
  Ticket,
  TicketComment,
  TicketParticipant,
  TransferTicketPayload,
  UpdateTicketPayload,
} from "../types/ticket.types";

export const ticketService = {
  getAll: () => apiGet<Ticket[]>(ENDPOINTS.tickets.base),
  getById: (id: string) => apiGet<Ticket>(ENDPOINTS.tickets.byId(id)),
  create: (payload: CreateTicketPayload) =>
    apiPost<Ticket, CreateTicketPayload>(ENDPOINTS.tickets.base, payload),
  update: (id: string, payload: UpdateTicketPayload) =>
    apiPatch<Ticket, UpdateTicketPayload>(
      ENDPOINTS.tickets.byId(id),
      payload,
    ),
  assign: (id: string, payload: AssignTicketPayload) =>
    apiPost<Ticket, AssignTicketPayload>(ENDPOINTS.tickets.assign(id), payload),
  transfer: (id: string, payload: TransferTicketPayload) =>
    apiPost<Ticket, TransferTicketPayload>(
      ENDPOINTS.tickets.transfer(id),
      payload,
    ),
  resolve: (id: string) =>
    apiPost<Ticket, Record<string, never>>(ENDPOINTS.tickets.resolve(id), {}),
  close: (id: string) =>
    apiPost<Ticket, Record<string, never>>(ENDPOINTS.tickets.close(id), {}),
  getDevices: (id: string) =>
    apiGet<TicketDevicesResponse>(ENDPOINTS.tickets.devices(id)),
  getComments: (id: string) =>
    apiGet<TicketComment[]>(ENDPOINTS.tickets.comments(id)),
  addComment: (id: string, payload: CreateCommentPayload) =>
    apiPost<TicketComment, CreateCommentPayload>(
      ENDPOINTS.tickets.comments(id),
      payload,
    ),
  getParticipants: (id: string) =>
    apiGet<TicketParticipant[]>(ENDPOINTS.tickets.participants(id)),
  addParticipant: (id: string, payload: AddParticipantPayload) =>
    apiPost<TicketParticipant, AddParticipantPayload>(
      ENDPOINTS.tickets.participants(id),
      payload,
    ),
  removeParticipant: (id: string, userId: string) =>
    apiDelete<void>(ENDPOINTS.tickets.participant(id, userId)),
};
