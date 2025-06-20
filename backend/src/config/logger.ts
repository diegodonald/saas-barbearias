import winston from 'winston';
import path from 'path';

import { LogContext, SecurityEvent, BusinessEvent } from '@/types/logging';
import { metricsCollector } from '@/utils/metrics';

// Configuração dos níveis de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Configuração das cores para cada nível
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Adicionar cores ao winston
winston.addColors(colors);

// Formato personalizado para logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info['timestamp']} ${info.level}: ${info.message}`)
);

// Formato para arquivos (sem cores)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configuração dos transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format,
    level: process.env['NODE_ENV'] === 'development' ? 'debug' : 'info',
  }),

  // Arquivo para erros
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Arquivo para todos os logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Criar logger
const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] ?? 'info',
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Função para log de requisições HTTP avançado
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  const startCpuUsage = process.cpuUsage();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Definir request ID no logger
  advancedLogger.setRequestId(requestId);

  // Adicionar request ID ao objeto de requisição
  req.requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const cpuUsage = process.cpuUsage(startCpuUsage);
    const memoryUsage = process.memoryUsage();

    const context: LogContext = {
      requestId,
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: {
        query: req.query,
        params: req.params,
        bodySize: req.get('Content-Length'),
        responseSize: res.get('Content-Length'),
        cpuUsage: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
        },
      },
    };

    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 500) {
      advancedLogger.error(message, undefined, context);
    } else if (res.statusCode >= 400) {
      advancedLogger.warn(message, context);
    } else {
      advancedLogger.http(message, context);
    }
  });

  next();
};

// Função para log de erros não capturados
export const setupErrorHandling = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
};

// Classe de logger avançado
class AdvancedLogger {
  private winston: winston.Logger;
  private requestId: string | null = null;

  constructor(winstonLogger: winston.Logger) {
    this.winston = winstonLogger;
  }

  /**
   * Definir ID da requisição para contexto
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Log estruturado com contexto
   */
  private logWithContext(level: string, message: string, context: LogContext = {}): void {
    const enrichedContext = {
      ...context,
      requestId: this.requestId || context.requestId,
      timestamp: new Date().toISOString(),
      service: 'saas-barbearias-api',
    };

    this.winston.log(level, message, enrichedContext);
  }

  /**
   * Log de informação
   */
  info(message: string, context: LogContext = {}): void {
    this.logWithContext('info', message, context);
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error, context: LogContext = {}): void {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    this.logWithContext('error', message, errorContext);

    // Coletar métricas de erro
    if (error) {
      metricsCollector.collectError({
        type: error.name,
        message: error.message,
        stack: error.stack ?? undefined,
        endpoint: context.url ?? undefined,
        userId: context.userId ?? undefined,
      });
    }
  }

  /**
   * Log de warning
   */
  warn(message: string, context: LogContext = {}): void {
    this.logWithContext('warn', message, context);
  }

  /**
   * Log de debug
   */
  debug(message: string, context: LogContext = {}): void {
    this.logWithContext('debug', message, context);
  }

  /**
   * Log de requisição HTTP
   */
  http(message: string, context: LogContext = {}): void {
    this.logWithContext('http', message, context);

    // Coletar métricas de performance se disponível
    if (context.duration && context.url && context.method && context.statusCode) {
      metricsCollector.collectPerformance({
        endpoint: context.url,
        method: context.method,
        duration: context.duration,
        statusCode: context.statusCode,
        memoryUsage: process.memoryUsage().heapUsed,
        timestamp: new Date(),
        userId: context.userId ?? undefined,
      });
    }
  }

  /**
   * Log de evento de segurança
   */
  security(event: SecurityEvent): void {
    this.logWithContext('warn', `Security Event: ${event.type}`, {
      userId: event.userId ?? undefined,
      ip: event.ip,
      userAgent: event.userAgent,
      metadata: event.details,
    });

    metricsCollector.recordSecurityEvent(event);
  }

  /**
   * Log de evento de negócio
   */
  business(event: BusinessEvent): void {
    this.logWithContext('info', `Business Event: ${event.type} ${event.action} on ${event.entity}`, {
      userId: event.userId ?? undefined,
      metadata: {
        entity: event.entity,
        entityId: event.entityId,
        action: event.action,
        changes: event.changes,
        ...event.metadata,
      },
    });

    metricsCollector.recordBusinessEvent(event);
  }

  /**
   * Log de performance
   */
  performance(operation: string, duration: number, context: LogContext = {}): void {
    const message = `Performance: ${operation} completed in ${duration}ms`;
    this.logWithContext('info', message, {
      ...context,
      operation,
      duration,
      performance: {
        duration,
        memoryUsage: process.memoryUsage(),
      },
    });
  }
}

// Instância do logger avançado
export const advancedLogger = new AdvancedLogger(logger);

export { logger };
export default advancedLogger;
