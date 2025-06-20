/**
 * Middleware de cache para rotas HTTP
 */

import { Request, Response, NextFunction } from 'express';
import { cacheService } from '@/services/cache.service';
import { CACHE_TTL, CACHE_PREFIXES } from '@/config/redis';
import { advancedLogger } from '@/config/logger';

export interface CacheMiddlewareOptions {
  ttl?: number;
  prefix?: string;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  skipCache?: (req: Request) => boolean;
  varyBy?: string[];
}

/**
 * Middleware de cache para respostas HTTP
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Verificar se deve pular o cache
    if (options.skipCache && options.skipCache(req)) {
      return next();
    }

    // Verificar condições
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Apenas cachear métodos GET
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Gerar chave do cache
      const cacheKey = options.keyGenerator
        ? options.keyGenerator(req)
        : generateHttpCacheKey(req, options.varyBy);

      // Tentar obter do cache
      const cached = await cacheService.get(cacheKey, {
        prefix: options.prefix ?? CACHE_PREFIXES.API,
      });

      if (cached) {
        const { statusCode, headers, body } = cached as any;
        
        // Definir headers do cache
        res.set(headers);
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        advancedLogger.debug('Cache hit para rota HTTP', {
          method: req.method,
          url: req.originalUrl,
          metadata: { cacheKey },
        });

        return res.status(statusCode).json(body);
      }

      // Cache miss - interceptar resposta
      const originalSend = res.json;
      const originalStatus = res.status;
      let statusCode = 200;

      // Interceptar status
      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      // Interceptar resposta
      res.json = function(body: any) {
        // Apenas cachear respostas de sucesso
        if (statusCode >= 200 && statusCode < 300) {
          const responseData = {
            statusCode,
            headers: getResponseHeaders(res),
            body,
          };

          // Armazenar no cache de forma assíncrona
          cacheService.set(cacheKey, responseData, {
            prefix: options.prefix ?? CACHE_PREFIXES.API,
            ttl: options.ttl ?? CACHE_TTL.SHORT,
          }).catch(error => {
            advancedLogger.error('Erro ao armazenar resposta no cache', error, {
              method: req.method,
              url: req.originalUrl,
              metadata: { cacheKey },
            });
          });

          advancedLogger.debug('Resposta armazenada no cache', {
            method: req.method,
            url: req.originalUrl,
            metadata: { cacheKey, statusCode },
          });
        }

        // Definir headers do cache
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);

        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      advancedLogger.error('Erro no middleware de cache', error as Error, {
        method: req.method,
        url: req.originalUrl,
      });
      next();
    }
  };
}

/**
 * Middleware para invalidação de cache
 */
export function cacheInvalidationMiddleware(options: {
  pattern?: string;
  keys?: string[];
  prefix?: string;
} = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Executar próximo middleware primeiro
    const originalSend = res.json;
    
    res.json = function(body: any) {
      // Apenas invalidar em caso de sucesso
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidar cache de forma assíncrona
        Promise.resolve().then(async () => {
          try {
            if (options.pattern) {
              await cacheService.invalidatePattern(options.pattern, options.prefix);
              advancedLogger.info('Cache invalidado por padrão via middleware', {
                method: req.method,
                url: req.originalUrl,
                metadata: { pattern: options.pattern },
              });
            }

            if (options.keys) {
              for (const key of options.keys) {
                await cacheService.delete(key, { prefix: options.prefix });
              }
              advancedLogger.info('Cache invalidado por chaves via middleware', {
                method: req.method,
                url: req.originalUrl,
                metadata: { keys: options.keys },
              });
            }
          } catch (error) {
            advancedLogger.error('Erro ao invalidar cache via middleware', error as Error, {
              method: req.method,
              url: req.originalUrl,
            });
          }
        });
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Gerar chave de cache para requisições HTTP
 */
function generateHttpCacheKey(req: Request, varyBy: string[] = []): string {
  const baseKey = `${req.method}:${req.originalUrl}`;
  
  if (varyBy.length === 0) {
    return baseKey;
  }

  const varyParts = varyBy.map(header => {
    const value = req.get(header) || req.query[header] || '';
    return `${header}:${value}`;
  });

  return `${baseKey}:${varyParts.join(':')}`;
}

/**
 * Obter headers relevantes da resposta
 */
function getResponseHeaders(res: Response): Record<string, string> {
  const relevantHeaders = [
    'content-type',
    'cache-control',
    'etag',
    'last-modified',
    'expires',
  ];

  const headers: Record<string, string> = {};
  
  relevantHeaders.forEach(header => {
    const value = res.get(header);
    if (value) {
      headers[header] = value;
    }
  });

  return headers;
}

/**
 * Middleware para cache condicional baseado em ETag
 */
export function conditionalCacheMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const ifNoneMatch = req.get('If-None-Match');
    
    if (ifNoneMatch) {
      // Interceptar resposta para verificar ETag
      const originalSend = res.json;
      
      res.json = function(body: any) {
        const etag = res.get('ETag');
        
        if (etag && ifNoneMatch === etag) {
          return res.status(304).end();
        }
        
        return originalSend.call(this, body);
      };
    }

    next();
  };
}

/**
 * Middleware para definir headers de cache
 */
export function cacheHeadersMiddleware(options: {
  maxAge?: number;
  mustRevalidate?: boolean;
  noCache?: boolean;
  noStore?: boolean;
} = {}) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const cacheControl = [];

    if (options.noStore) {
      cacheControl.push('no-store');
    } else if (options.noCache) {
      cacheControl.push('no-cache');
    } else {
      if (options.maxAge !== undefined) {
        cacheControl.push(`max-age=${options.maxAge}`);
      }
      
      if (options.mustRevalidate) {
        cacheControl.push('must-revalidate');
      }
    }

    if (cacheControl.length > 0) {
      res.set('Cache-Control', cacheControl.join(', '));
    }

    next();
  };
}
