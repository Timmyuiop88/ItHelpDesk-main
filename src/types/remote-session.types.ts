export interface SessionRequestedEvent {
  sessionId: string;
  deviceHostname: string;
  expiresAt: string;
  ticketId?: string;
}

export interface SessionApprovedEvent {
  sessionId: string;
  rustdeskId: string;
  rustdeskLink: string;
}

export interface SessionDeniedEvent {
  sessionId: string;
  deviceHostname: string;
}

export interface SessionStartedEvent {
  sessionId: string;
}

export interface SessionEndedEvent {
  sessionId: string;
}

export interface ApproveSessionResponse {
  status: string;
  rustdeskLink: string;
}

export interface CreateRemoteSessionPayload {
  ticketId: string;
  deviceId: string;
}

export interface RemoteSession {
  id: string;
  status: string;
  ticketId?: string;
  deviceId?: string;
}

export interface RemoteSessionNotesPayload {
  notes: string;
}

export interface RemoteSessionTimelineEntry {
  id?: string;
  action?: string;
  createdAt?: string;
}
