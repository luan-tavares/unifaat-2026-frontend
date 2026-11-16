import clientApi from "./_clientApi.js";
import type { PaginatedResponse, User, UserSearchFilters } from "../types/api";

export default async function userSearchApi(
    filters: UserSearchFilters,
    page: number = 1,
    limit: number = 10
): Promise<PaginatedResponse<User>> {
    const { data } = await clientApi.post<PaginatedResponse<User>>(
        "/users/search",
        { filters, page, limit }
    );

    return data;
}
