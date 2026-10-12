import { apiDelete, apiGet, apiPatch, apiPost, apiPostWithHeaders } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import { cleanParams } from "../lib/pagination";
import type { Page } from "../types/pagination.types";
import type { TicketDevicesResponse } from "../types/device.types";
import type {
  AddParticipantPayload,
  AssignTicketPayload,
  CreateCommentPayload,
  CreateTicketPayload,
  Ticket,
  TicketAssignmentHistoryEntry,
  TicketComment,
  TicketCommentsParams,
  TicketListParams,
  TicketParticipant,
  TransferTicketPayload,
  UpdateTicketPayload,
} from "../types/ticket.types";

export const ticketService = {
  // getAll: () => apiGet<Ticket[]>(ENDPOINTS.tickets.base),
  list: (params: TicketListParams, signal?: AbortSignal) =>
    apiGet<Page<Ticket>>(
      ENDPOINTS.tickets.base,
      cleanParams(params as Record<string, unknown>),
      { signal },
    ),
  getById: (id: string) => apiGet<Ticket>(ENDPOINTS.tickets.byId(id)),
  create: (payload: CreateTicketPayload, idempotencyKey: string) =>
    apiPostWithHeaders<Ticket, CreateTicketPayload>(
      ENDPOINTS.tickets.base,
      payload,
      { "Idempotency-Key": idempotencyKey },
    ),
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
  getAssignmentHistory: (id: string) =>
    apiGet<TicketAssignmentHistoryEntry[]>(
      ENDPOINTS.tickets.assignmentHistory(id),
    ),
  getDevices: (id: string) =>
    apiGet<TicketDevicesResponse>(ENDPOINTS.tickets.devices(id)),
  getComments: (
    id: string,
    params?: TicketCommentsParams,
    signal?: AbortSignal,
  ) =>
    apiGet<Page<TicketComment>>(
      ENDPOINTS.tickets.comments(id),
      cleanParams((params ?? {}) as Record<string, unknown>),
      { signal },
    ),
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
