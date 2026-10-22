import clientApi from "./_clientApi";

import type {
  User,
  UserSearchFilters,
  PaginatedResponse
} from "../types/api";

/**
 * TF 07 — Busca de usuários utilizando Elasticsearch.
 *
 * O frontend envia os filtros para o backend.
 * O backend consulta o Elasticsearch e recupera
 * os usuários correspondentes no PostgreSQL.
 */
export async function userSearchApi(
  filters: UserSearchFilters,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<User>> {

  const { data } = await clientApi.post<PaginatedResponse<User>>(
    "/users/search",
    {
      filters,
      page,
      limit
    }
  );

  return data;
}
