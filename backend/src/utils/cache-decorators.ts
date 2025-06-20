/**
 * Decorators para cache automático
 */

import { cacheService, CacheOptions } from '@/services/cache.service';
import { CACHE_TTL, CACHE_PREFIXES } from '@/config/redis';
import { advancedLogger } from '@/config/logger';

export interface CacheableOptions extends CacheOptions {
  keyGenerator?: (...args: any[]) => string;
  condition?: (...args: any[]) => boolean;
  unless?: (...args: any[]) => boolean;
}

/**
 * Decorator para cache de métodos
 */
export function Cacheable(options: CacheableOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Verificar condições
      if (options.condition && !options.condition.apply(this, args)) {
        return method.apply(this, args);
      }

      if (options.unless && options.unless.apply(this, args)) {
        return method.apply(this, args);
      }

      // Gerar chave do cache
      const key = options.keyGenerator
        ? options.keyGenerator.apply(this, args)
        : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      try {
        // Tentar obter do cache
        const cacheOptions: any = {
          prefix: options.prefix ?? CACHE_PREFIXES.QUERY,
        };
        if (options.ttl !== undefined) {
          cacheOptions.ttl = options.ttl;
        }

        const cached = await cacheService.get(key, cacheOptions);

        if (cached !== null) {
          advancedLogger.debug('Cache hit para método', {
            metadata: { method: `${target.constructor.name}.${propertyName}`, key },
          });
          return cached;
        }

        // Executar método original
        const result = await method.apply(this, args);

        // Armazenar no cache
        await cacheService.set(key, result, {
          prefix: options.prefix ?? CACHE_PREFIXES.QUERY,
          ttl: options.ttl ?? CACHE_TTL.MEDIUM,
        });

        advancedLogger.debug('Resultado armazenado no cache', {
          metadata: { method: `${target.constructor.name}.${propertyName}`, key },
        });

        return result;
      } catch (error) {
        advancedLogger.error('Erro no cache decorator', error as Error, {
          metadata: { method: `${target.constructor.name}.${propertyName}` },
        });
        // Em caso de erro no cache, executar método normalmente
        return method.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * Decorator para invalidação de cache
 */
export function CacheEvict(options: {
  key?: string;
  pattern?: string;
  prefix?: string;
  allEntries?: boolean;
} = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // Executar método original primeiro
        const result = await method.apply(this, args);

        // Invalidar cache após sucesso
        if (options.allEntries) {
          await cacheService.clear();
          advancedLogger.info('Cache completamente invalidado', {
            metadata: { method: `${target.constructor.name}.${propertyName}` },
          });
        } else if (options.pattern) {
          await cacheService.invalidatePattern(options.pattern, options.prefix);
          advancedLogger.info('Cache invalidado por padrão', {
            metadata: { 
              method: `${target.constructor.name}.${propertyName}`,
              pattern: options.pattern 
            },
          });
        } else if (options.key) {
          await cacheService.delete(options.key, { prefix: options.prefix });
          advancedLogger.info('Cache invalidado por chave', {
            metadata: { 
              method: `${target.constructor.name}.${propertyName}`,
              key: options.key 
            },
          });
        }

        return result;
      } catch (error) {
        // Em caso de erro, não invalidar cache
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator para cache com atualização automática
 */
export function CachePut(options: CacheableOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // Executar método original
        const result = await method.apply(this, args);

        // Gerar chave do cache
        const key = options.keyGenerator
          ? options.keyGenerator.apply(this, args)
          : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

        // Sempre atualizar o cache com o novo resultado
        await cacheService.set(key, result, {
          prefix: options.prefix ?? CACHE_PREFIXES.QUERY,
          ttl: options.ttl ?? CACHE_TTL.MEDIUM,
        });

        advancedLogger.debug('Cache atualizado', {
          metadata: { method: `${target.constructor.name}.${propertyName}`, key },
        });

        return result;
      } catch (error) {
        advancedLogger.error('Erro no cache put decorator', error as Error, {
          metadata: { method: `${target.constructor.name}.${propertyName}` },
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Função helper para gerar chaves de cache baseadas em parâmetros
 */
export function generateCacheKey(
  prefix: string,
  ...params: (string | number | boolean | object)[]
): string {
  const keyParts = params.map(param => {
    if (typeof param === 'object') {
      return JSON.stringify(param);
    }
    return String(param);
  });

  return `${prefix}:${keyParts.join(':')}`;
}

/**
 * Função helper para cache manual com retry
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  try {
    // Tentar obter do cache
    const cached = await cacheService.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Executar função de busca
    const result = await fetcher();

    // Armazenar no cache
    await cacheService.set(key, result, options);

    return result;
  } catch (error) {
    advancedLogger.error('Erro na função withCache', error as Error, {
      metadata: { key },
    });
    throw error;
  }
}

/**
 * Função helper para cache com lock distribuído
 */
export async function withCacheLock<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { lockTtl?: number } = {}
): Promise<T> {
  const lockKey = `lock:${key}`;
  const lockTtl = options.lockTtl ?? 30; // 30 segundos

  try {
    // Tentar obter do cache primeiro
    const cached = await cacheService.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Tentar adquirir lock
    const lockAcquired = await cacheService.set(
      lockKey,
      'locked',
      { ...options, ttl: lockTtl }
    );

    if (!lockAcquired) {
      // Se não conseguiu o lock, aguardar um pouco e tentar cache novamente
      await new Promise(resolve => setTimeout(resolve, 100));
      const cachedAfterWait = await cacheService.get<T>(key, options);
      if (cachedAfterWait !== null) {
        return cachedAfterWait;
      }
      
      // Se ainda não tem no cache, executar sem lock
      return await fetcher();
    }

    try {
      // Executar função de busca
      const result = await fetcher();

      // Armazenar no cache
      await cacheService.set(key, result, options);

      return result;
    } finally {
      // Liberar lock
      await cacheService.delete(lockKey, options);
    }
  } catch (error) {
    advancedLogger.error('Erro na função withCacheLock', error as Error, {
      metadata: { key },
    });
    throw error;
  }
}
