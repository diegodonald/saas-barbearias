/**
 * Controller para gerenciamento de cache
 */

import { Request, Response } from 'express';
import { cacheService } from '@/services/cache.service';
import { checkRedisHealth } from '@/config/redis';
import { advancedLogger } from '@/config/logger';
import { ApiResponse } from '@/types/api';

export class CacheController {
  /**
   * Obter estatísticas do cache
   */
  static async getStats(req: Request, res: Response<ApiResponse>) {
    try {
      const stats = cacheService.getStats();
      const redisHealth = await checkRedisHealth();
      const redisInfo = await cacheService.getRedisInfo();

      const cacheStats = {
        ...stats,
        redis: {
          health: redisHealth,
          info: {
            version: redisInfo['redis_version'],
            mode: redisInfo['redis_mode'],
            uptime: redisInfo['uptime_in_seconds'],
            connected_clients: redisInfo['connected_clients'],
            used_memory: redisInfo['used_memory_human'],
            total_commands_processed: redisInfo['total_commands_processed'],
            keyspace_hits: redisInfo['keyspace_hits'],
            keyspace_misses: redisInfo['keyspace_misses'],
          },
        },
        hitRate:
          stats.hits + stats.misses > 0
            ? `${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)}%`
            : '0%',
      };

      advancedLogger.info('Estatísticas do cache solicitadas', {
        userId: req.user?.id,
      });

      res.json({
        success: true,
        message: 'Estatísticas do cache obtidas com sucesso',
        data: cacheStats,
      });
    } catch (error) {
      advancedLogger.error('Erro ao obter estatísticas do cache', error as Error, {
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Limpar cache por padrão
   */
  static async clearByPattern(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<Response<ApiResponse> | void> {
    try {
      const { pattern } = req.body;

      if (!pattern) {
        return res.status(400).json({
          success: false,
          message: 'Padrão é obrigatório',
          error: 'VALIDATION_ERROR',
        });
      }

      const deletedCount = await cacheService.invalidatePattern(pattern);

      advancedLogger.info('Cache limpo por padrão', {
        userId: req.user?.id,
        metadata: { pattern, deletedCount },
      });

      res.json({
        success: true,
        message: `Cache limpo com sucesso. ${deletedCount} chaves removidas.`,
        data: { pattern, deletedCount },
      });
    } catch (error) {
      advancedLogger.error('Erro ao limpar cache por padrão', error as Error, {
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Limpar todo o cache
   */
  static async clearAll(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<Response<ApiResponse> | void> {
    try {
      const success = await cacheService.clear();

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Falha ao limpar cache',
          error: 'CACHE_CLEAR_ERROR',
        });
      }

      advancedLogger.warn('Todo o cache foi limpo', {
        userId: req.user?.id,
      });

      res.json({
        success: true,
        message: 'Todo o cache foi limpo com sucesso',
        data: { cleared: true },
      });
    } catch (error) {
      advancedLogger.error('Erro ao limpar todo o cache', error as Error, {
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Obter valor do cache por chave
   */
  static async getValue(req: Request, res: Response<ApiResponse>) {
    try {
      const key = req.params['key'] as string;
      const { prefix } = req.query;

      const options = typeof prefix === 'string' ? { prefix } : {};

      const value = await cacheService.get(key, options);
      const exists = value !== null;
      const ttl = exists ? await cacheService.getTTL(key, options) : -1;

      advancedLogger.debug('Valor do cache solicitado', {
        userId: req.user?.id,
        metadata: { key, prefix, exists },
      });

      res.json({
        success: true,
        message: exists ? 'Valor encontrado no cache' : 'Valor não encontrado no cache',
        data: {
          key,
          value,
          exists,
          ttl,
        },
      });
    } catch (error) {
      advancedLogger.error('Erro ao obter valor do cache', error as Error, {
        userId: req.user?.id,
        metadata: { key: req.params['key'] },
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Definir valor no cache
   */
  static async setValue(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<Response<ApiResponse> | void> {
    try {
      const key = req.params['key'] as string;
      const { value, ttl, prefix } = req.body;

      const options: any = { prefix };
      if (ttl) {
        options.ttl = parseInt(ttl);
      }

      const success = await cacheService.set(key, value, options);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Falha ao definir valor no cache',
          error: 'CACHE_SET_ERROR',
        });
      }

      advancedLogger.info('Valor definido no cache manualmente', {
        userId: req.user?.id,
        metadata: { key, prefix, ttl },
      });

      res.json({
        success: true,
        message: 'Valor definido no cache com sucesso',
        data: { key, set: true },
      });
    } catch (error) {
      advancedLogger.error('Erro ao definir valor no cache', error as Error, {
        userId: req.user?.id,
        metadata: { key: req.params['key'] },
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Deletar valor do cache
   */
  static async deleteValue(req: Request, res: Response<ApiResponse>) {
    try {
      const key = req.params['key'] as string;
      const { prefix } = req.query;

      const options = typeof prefix === 'string' ? { prefix } : {};

      const success = await cacheService.delete(key, options);

      advancedLogger.info('Valor removido do cache manualmente', {
        userId: req.user?.id,
        metadata: { key, prefix, existed: success },
      });

      res.json({
        success: true,
        message: success ? 'Valor removido do cache' : 'Valor não existia no cache',
        data: { key, deleted: success },
      });
    } catch (error) {
      advancedLogger.error('Erro ao deletar valor do cache', error as Error, {
        userId: req.user?.id,
        metadata: { key: req.params['key'] },
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Resetar estatísticas do cache
   */
  static async resetStats(req: Request, res: Response<ApiResponse>) {
    try {
      cacheService.resetStats();

      advancedLogger.info('Estatísticas do cache resetadas', {
        userId: req.user?.id,
      });

      res.json({
        success: true,
        message: 'Estatísticas do cache resetadas com sucesso',
        data: { reset: true },
      });
    } catch (error) {
      advancedLogger.error('Erro ao resetar estatísticas do cache', error as Error, {
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }
}
