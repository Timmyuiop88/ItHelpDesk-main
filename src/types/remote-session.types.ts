export interface SessionRequestedEvent {
  sessionId: string;
  deviceHostname: string;
  expiresAt: string;
  approvalExpiresAt?: string;
  ticketId?: string;
}

export interface SessionApprovedEvent {
  sessionId: string;
}

export interface SessionDeniedEvent {
  sessionId: string;
  deviceHostname: string;
}

export interface SessionCancelledEvent {
  sessionId: string;
}

export interface SessionStartedEvent {
  sessionId: string;
}

export interface SessionEndedEvent {
  sessionId: string;
}

export interface ApproveSessionResponse {
  status: string;
}

export interface ConnectionResponse {
  rustdeskId: string;
  rustdeskLink: string;
  approvalToken: string;
}

export interface StartSessionPayload {
  approvalToken: string;
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
  approvalExpiresAt?: string;
}

export interface RemoteSessionNotesPayload {
  notes: string;
}

export interface RemoteSessionTimelineEntry {
  id?: string;
  action?: string;
  createdAt?: string;
}
