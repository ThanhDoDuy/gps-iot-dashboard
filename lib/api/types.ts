// Common API types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
