import { apiGet, apiPatch, apiPost } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type {
  ApproveSessionResponse,
  CreateRemoteSessionPayload,
  RemoteSession,
  RemoteSessionNotesPayload,
  RemoteSessionTimelineEntry,
} from "../types/remote-session.types";

export const remoteSessionService = {
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
  start: (id: string) =>
    apiPost<RemoteSession, Record<string, never>>(
      ENDPOINTS.remoteSessions.start(id),
      {},
    ),
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
