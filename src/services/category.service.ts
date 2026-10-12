import { apiGet } from "../api/config";
import { ENDPOINTS } from "../api/endpoints";
import type { TicketCategory } from "../types/ticket.types";

export const categoryService = {
  getAll: () => apiGet<TicketCategory[]>(ENDPOINTS.categories.base),
};
