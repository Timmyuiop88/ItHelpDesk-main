import { useMe } from "../auth/useMe";
import { useAllTechnicians } from "./useTechnicians";
import type { Technician } from "../../types/technician.types";

export function useCurrentTechnician(): Technician | null {
  const me = useMe();
  const technicians = useAllTechnicians();
  const userId = me.data?.id;

  if (!userId || !technicians.data) {
    return null;
  }

  return (
    technicians.data.find(
      (technician) =>
        technician.userId === userId || technician.user?.id === userId,
    ) ?? null
  );
}

export function useCurrentTechnicianId(): string | null {
  return useCurrentTechnician()?.id ?? null;
}
