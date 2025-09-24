// Generic API Response structure
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

// Generic Paginated response structure
export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// Base error response
export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
}
