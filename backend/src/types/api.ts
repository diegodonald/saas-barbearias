// Interface para resposta padrão da API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Interface para erro de validação
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Interface para paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface para filtros de busca
export interface SearchParams {
  search?: string;
  filters?: Record<string, any>;
}

// Interface para parâmetros de query
export interface QueryParams extends PaginationParams, SearchParams {}

// Interface para resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos para códigos de erro HTTP
export type HttpStatusCode =
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 503; // Service Unavailable

// Interface para erro customizado
export interface CustomError extends Error {
  statusCode: HttpStatusCode;
  code?: string;
  details?: any;
}

// Tipos para logs de auditoria
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Interface para health check
export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
    redis?: 'connected' | 'disconnected';
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}
