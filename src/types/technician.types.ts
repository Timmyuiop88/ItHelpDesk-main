export interface Technician {
  id: string;
  userId?: string;
  user?: { id: string };
}

export type CreateTechnicianPayload = Omit<Technician, "id">;
export type UpdateTechnicianPayload = Partial<CreateTechnicianPayload>;
