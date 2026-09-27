import { useMe } from "../auth/useMe";
import { useTechnicians } from "./useTechnicians";

export function useCurrentTechnicianId(): string | null {
  const me = useMe();
  const technicians = useTechnicians();
  const userId = me.data?.id;

  if (!userId || !technicians.data) {
    return null;
  }

  const match = technicians.data.find(
    (technician) =>
      technician.userId === userId || technician.user?.id === userId,
  );

  return match?.id ?? null;
}
