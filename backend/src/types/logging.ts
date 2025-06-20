/**
 * Tipos e interfaces para sistema de logging avançado
 */

export interface LogContext {
  userId?: string | undefined;
  requestId?: string | undefined;
  sessionId?: string | undefined;
  userAgent?: string | undefined;
  ip?: string | undefined;
  method?: string | undefined;
  url?: string | undefined;
  statusCode?: number | undefined;
  duration?: number | undefined;
  service?: string | undefined;
  operation?: string | undefined;
  metadata?: Record<string, any> | undefined;
  performance?:
    | {
        duration: number;
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage?: NodeJS.CpuUsage;
      }
    | undefined;
  // Propriedades específicas para diferentes contextos
  timeWindow?: number | undefined;
  limit?: number | undefined;
  level?: string | undefined;
  status?: string | undefined;
}

export interface LogMetrics {
  timestamp: Date;
  level: string;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
  };
}

export interface SecurityEvent {
  type:
    | 'LOGIN_ATTEMPT'
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'UNAUTHORIZED_ACCESS'
    | 'SUSPICIOUS_ACTIVITY';
  userId?: string;
  ip: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface BusinessEvent {
  type: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  userId?: string;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  memoryUsage: number;
  cpuUsage?: number;
  timestamp: Date;
  userId?: string | undefined;
}

export interface ErrorMetrics {
  type: string;
  message: string;
  stack?: string | undefined;
  endpoint?: string | undefined;
  userId?: string | undefined;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
  TRACE = 'trace',
}

export enum LogCategory {
  SYSTEM = 'system',
  SECURITY = 'security',
  BUSINESS = 'business',
  PERFORMANCE = 'performance',
  API = 'api',
  DATABASE = 'database',
  EXTERNAL = 'external',
}
