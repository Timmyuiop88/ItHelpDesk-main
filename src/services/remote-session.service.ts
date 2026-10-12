import { apiGet, apiPatch, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import { cleanParams } from "../lib/pagination";
import type { Page } from "../types/pagination.types";
import type {
  ApproveSessionResponse,
  ConnectionResponse,
  CreateRemoteSessionPayload,
  RemoteSession,
  RemoteSessionNotesPayload,
  RemoteSessionTimelineEntry,
  StartSessionPayload,
} from "../types/remote-session.types";

export interface RemoteSessionListParams {
  page?: number;
  limit?: number;
  status?: string;
  ticketId?: string;
}

export const remoteSessionService = {
  list: (params: RemoteSessionListParams = {}, signal?: AbortSignal) =>
    apiGet<Page<RemoteSession>>(
      ENDPOINTS.remoteSessions.base,
      cleanParams(params as Record<string, unknown>),
      { signal },
    ),
  getById: (id: string) =>
    apiGet<RemoteSession>(ENDPOINTS.remoteSessions.byId(id)),
  create: (payload: CreateRemoteSessionPayload) =>
    apiPost<RemoteSession, CreateRemoteSessionPayload>(
      ENDPOINTS.remoteSessions.base,
      payload,
    ),
  approve: (id: string) =>
    apiPost<ApproveSessionResponse, Record<string, never>>(
      ENDPOINTS.remoteSessions.approve(id),
      {},
    ),
  deny: (id: string) =>
    apiPost<void, Record<string, never>>(ENDPOINTS.remoteSessions.deny(id), {}),
  connection: (id: string) =>
    apiGet<ConnectionResponse>(ENDPOINTS.remoteSessions.connection(id)),
  start: (id: string, payload: StartSessionPayload) =>
    apiPost<RemoteSession, StartSessionPayload>(
      ENDPOINTS.remoteSessions.start(id),
      payload,
    ),
  cancel: (id: string) =>
    apiPost<RemoteSession, Record<string, never>>(
      ENDPOINTS.remoteSessions.cancel(id),
      {},
    ),
  consent: (id: string) =>
    apiPost<void, Record<string, never>>(ENDPOINTS.remoteSessions.consent(id), {}),
  end: (id: string) =>
    apiPost<RemoteSession, Record<string, never>>(
      ENDPOINTS.remoteSessions.end(id),
      {},
    ),
  addNotes: (id: string, payload: RemoteSessionNotesPayload) =>
    apiPatch<RemoteSession, RemoteSessionNotesPayload>(
      ENDPOINTS.remoteSessions.notes(id),
      payload,
    ),
  timeline: (id: string) =>
    apiGet<RemoteSessionTimelineEntry[]>(ENDPOINTS.remoteSessions.timeline(id)),
};
