import { apiDelete, apiGet, apiPatch, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type {
  AssignTicketPayload,
  CreateCommentPayload,
  CreateTicketPayload,
  Ticket,
  TicketComment,
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
  remove: (id: string) => apiDelete<void>(ENDPOINTS.tickets.byId(id)),
  assign: (id: string, payload: AssignTicketPayload) =>
    apiPost<Ticket, AssignTicketPayload>(ENDPOINTS.tickets.assign(id), payload),
  resolve: (id: string) =>
    apiPost<Ticket, Record<string, never>>(ENDPOINTS.tickets.resolve(id), {}),
  close: (id: string) =>
    apiPost<Ticket, Record<string, never>>(ENDPOINTS.tickets.close(id), {}),
  getComments: (id: string) =>
    apiGet<TicketComment[]>(ENDPOINTS.tickets.comments(id)),
  addComment: (id: string, payload: CreateCommentPayload) =>
    apiPost<TicketComment, CreateCommentPayload>(
      ENDPOINTS.tickets.comments(id),
      payload,
    ),
};
