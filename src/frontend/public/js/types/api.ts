export interface Task {
    id: number;
    name: string;
    is_done: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
}
