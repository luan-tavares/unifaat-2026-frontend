import clientApi from "./_clientApi";
import type { PaginatedResponse, User, UserSearchFilters } from "../types/api";

export async function userSearchApi(
  filters: UserSearchFilters,
  page: number,
  limit: number
): Promise<PaginatedResponse<User>> {
  const { data } = await clientApi.post<PaginatedResponse<User>>("/users/search", {
    filters,
    page,
    limit,
  });

  return data;
}
