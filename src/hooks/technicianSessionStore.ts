export type TechnicianSessionStatus =
  | "REQUESTED"
  | "APPROVED"
  | "ACTIVE"
  | "DENIED"
  | "ENDED";

export interface TechnicianSessionState {
  id: string;
  status: TechnicianSessionStatus;
  ticketId?: string;
  deviceHostname?: string;
  rustdeskLink?: string;
  since: number;
}

let current: TechnicianSessionState | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeTechnicianSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTechnicianSession(): TechnicianSessionState | null {
  return current;
}

export function setTechnicianSession(
  session: TechnicianSessionState | null,
): void {
  current = session;
  notify();
}

export function updateTechnicianSession(
  id: string,
  patch: Partial<Omit<TechnicianSessionState, "id">>,
): void {
  const base: TechnicianSessionState =
    current?.id === id ? current : { id, status: "REQUESTED", since: Date.now() };
  const statusChanged = patch.status !== undefined && patch.status !== base.status;
  current = {
    ...base,
    ...patch,
    since: patch.since ?? (statusChanged ? Date.now() : base.since),
  };
  notify();
}

export function isLiveStatus(status: TechnicianSessionStatus): boolean {
  return status === "REQUESTED" || status === "APPROVED" || status === "ACTIVE";
}
