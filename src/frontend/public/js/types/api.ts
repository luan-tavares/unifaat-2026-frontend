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


export interface User {
    id: number;
    name: string;
    email: string;
    job_title?: string | null;
    city?: string | null;
    state?: string | null;
    bio?: string | null;
}

export interface UserSearchFilters {
    name?: string;
    email?: string;
    job_title?: string;
    bio?: string;
    city?: string;
    state?: string;
    is_active?: boolean;
}
