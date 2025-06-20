/**
 * Serviço de Cache com Redis
 * Implementa operações de cache com TTL, invalidação e padrões de cache
 */

import { redis, CACHE_TTL, CACHE_PREFIXES } from '@/config/redis';
import { advancedLogger } from '@/config/logger';

export interface CacheOptions {
  ttl?: number | undefined;
  prefix?: string | undefined;
  compress?: boolean | undefined;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

class CacheService {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  /**
   * Gerar chave de cache com prefixo
   */
  private generateKey(key: string, prefix?: string | undefined): string {
    const finalPrefix = prefix ?? CACHE_PREFIXES.API;
    return `${finalPrefix}${key}`;
  }

  /**
   * Serializar dados para cache
   */
  private serialize(data: any): string {
    try {
      return JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0',
      });
    } catch (error) {
      advancedLogger.error('Erro ao serializar dados para cache', error as Error);
      throw new Error('Falha na serialização');
    }
  }

  /**
   * Deserializar dados do cache
   */
  private deserialize<T>(serialized: string): T | null {
    try {
      const parsed = JSON.parse(serialized);
      return parsed.data as T;
    } catch (error) {
      advancedLogger.error('Erro ao deserializar dados do cache', error as Error);
      return null;
    }
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!redis) {
      this.stats.misses++;
      return null;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const cached = await redis.get(cacheKey);

      if (cached === null) {
        this.stats.misses++;
        advancedLogger.debug('Cache miss', { metadata: { key: cacheKey } });
        return null;
      }

      this.stats.hits++;
      const data = this.deserialize<T>(cached);

      advancedLogger.debug('Cache hit', {
        metadata: { key: cacheKey, hasData: data !== null },
      });

      return data;
    } catch (error) {
      this.stats.errors++;
      advancedLogger.error('Erro ao obter valor do cache', error as Error, {
        metadata: { key },
      });
      return null;
    }
  }

  /**
   * Definir valor no cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const ttl = options.ttl ?? CACHE_TTL.MEDIUM;
      const serialized = this.serialize(value);

      if (ttl > 0) {
        await redis.setex(cacheKey, ttl, serialized);
      } else {
        await redis.set(cacheKey, serialized);
      }

      this.stats.sets++;
      advancedLogger.debug('Valor definido no cache', {
        metadata: { key: cacheKey, ttl },
      });

      return true;
    } catch (error) {
      this.stats.errors++;
      advancedLogger.error('Erro ao definir valor no cache', error as Error, {
        metadata: { key },
      });
      return false;
    }
  }

  /**
   * Deletar valor do cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const result = await redis.del(cacheKey);

      this.stats.deletes++;
      advancedLogger.debug('Valor removido do cache', {
        metadata: { key: cacheKey, existed: result > 0 },
      });

      return result > 0;
    } catch (error) {
      this.stats.errors++;
      advancedLogger.error('Erro ao deletar valor do cache', error as Error, {
        metadata: { key },
      });
      return false;
    }
  }

  /**
   * Verificar se chave existe no cache
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const result = await redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      this.stats.errors++;
      advancedLogger.error('Erro ao verificar existência no cache', error as Error, {
        metadata: { key },
      });
      return false;
    }
  }

  /**
   * Obter TTL de uma chave
   */
  async getTTL(key: string, options: CacheOptions = {}): Promise<number> {
    if (!redis) {
      return -1;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      return await redis.ttl(cacheKey);
    } catch (error) {
      this.stats.errors++;
      advancedLogger.error('Erro ao obter TTL do cache', error as Error, {
        metadata: { key },
      });
      return -1;
    }
  }

  /**
   * Invalidar cache por padrão
   */
  async invalidatePattern(pattern: string, prefix?: string): Promise<number> {
    if (!redis) {
      return 0;
    }

    try {
      const searchPattern = this.generateKey(pattern, prefix);
      const keys = await redis.keys(searchPattern);

      if (keys.length === 0) {
        return 0;
      }

      const result = await redis.del(...keys);

      advancedLogger.info('Cache invalidado por padrão', {
        metadata: { pattern: searchPattern, keysDeleted: result },
      });

      return result;
    } catch (error) {
      this.stats.errors++;
      advancedLogger.error('Erro ao invalidar cache por padrão', error as Error, {
        metadata: { pattern },
      });
      return 0;
    }
  }

  /**
   * Limpar todo o cache
   */
  async clear(): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      await redis.flushdb();
      advancedLogger.warn('Cache completamente limpo');
      return true;
    } catch (error) {
      this.stats.errors++;
      advancedLogger.error('Erro ao limpar cache', error as Error);
      return false;
    }
  }

  /**
   * Obter múltiplos valores do cache
   */
  async getMultiple<T>(
    keys: string[],
    options: CacheOptions = {}
  ): Promise<Record<string, T | null>> {
    if (!redis) {
      const result: Record<string, T | null> = {};
      keys.forEach((key) => {
        result[key] = null;
        this.stats.misses++;
      });
      return result;
    }

    try {
      const cacheKeys = keys.map((key) => this.generateKey(key, options.prefix));
      const values = await redis.mget(...cacheKeys);

      const result: Record<string, T | null> = {};

      keys.forEach((originalKey, index) => {
        const value = values[index];
        if (value !== null && value !== undefined) {
          result[originalKey] = this.deserialize<T>(value);
          this.stats.hits++;
        } else {
          result[originalKey] = null;
          this.stats.misses++;
        }
      });

      return result;
    } catch (error) {
      this.stats.errors++;
      advancedLogger.error('Erro ao obter múltiplos valores do cache', error as Error);
      return {};
    }
  }

  /**
   * Definir múltiplos valores no cache
   */
  async setMultiple(data: Record<string, any>, options: CacheOptions = {}): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      const pipeline = redis.pipeline();
      const ttl = options.ttl ?? CACHE_TTL.MEDIUM;

      Object.entries(data).forEach(([key, value]) => {
        const cacheKey = this.generateKey(key, options.prefix);
        const serialized = this.serialize(value);

        if (ttl > 0) {
          pipeline.setex(cacheKey, ttl, serialized);
        } else {
          pipeline.set(cacheKey, serialized);
        }
      });

      await pipeline.exec();
      this.stats.sets += Object.keys(data).length;

      advancedLogger.debug('Múltiplos valores definidos no cache', {
        metadata: { count: Object.keys(data).length, ttl },
      });

      return true;
    } catch (error) {
      this.stats.errors++;
      advancedLogger.error('Erro ao definir múltiplos valores no cache', error as Error);
      return false;
    }
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Resetar estatísticas
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  /**
   * Obter informações do Redis
   */
  async getRedisInfo(): Promise<Record<string, string>> {
    if (!redis) {
      return {};
    }

    try {
      const info = await redis.info();
      const lines = info.split('\r\n');
      const result: Record<string, string> = {};

      lines.forEach((line) => {
        if (line.includes(':') && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            result[key] = value;
          }
        }
      });

      return result;
    } catch (error) {
      advancedLogger.error('Erro ao obter informações do Redis', error as Error);
      return {};
    }
  }
}

// Instância singleton do serviço de cache
export const cacheService = new CacheService();
export default cacheService;
