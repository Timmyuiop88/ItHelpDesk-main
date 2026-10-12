import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import { categoryService } from "../../services/category.service";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoryService.getAll(),
    staleTime: 60 * 60 * 1000,
  });
}
