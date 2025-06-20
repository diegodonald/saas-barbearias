/**
 * Testes para o CacheService
 */

import { cacheService } from '@/services/cache.service';
import { CACHE_TTL, CACHE_PREFIXES } from '@/config/redis';

// Mock do Redis
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
    mget: jest.fn(),
    pipeline: jest.fn(),
    flushdb: jest.fn(),
    info: jest.fn(),
    ping: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
  };

  mockRedis.pipeline.mockReturnValue({
    setex: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  });

  return jest.fn(() => mockRedis);
});

// Mock do logger
jest.mock('@/config/logger', () => ({
  advancedLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CacheService', () => {
  let mockRedis: any;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.resetStats();
    
    // Obter instância mockada do Redis
    const Redis = require('ioredis');
    mockRedis = new Redis();
  });

  describe('get', () => {
    it('deve retornar valor do cache quando existe', async () => {
      const testData = { id: 1, name: 'Test' };
      const serialized = JSON.stringify({
        data: testData,
        timestamp: Date.now(),
        version: '1.0',
      });

      mockRedis.get.mockResolvedValue(serialized);

      const result = await cacheService.get('test-key');

      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('api:test-key');
    });

    it('deve retornar null quando chave não existe', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.get('non-existent-key');

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('api:non-existent-key');
    });

    it('deve usar prefixo personalizado', async () => {
      mockRedis.get.mockResolvedValue(null);

      await cacheService.get('test-key', { prefix: CACHE_PREFIXES.USER });

      expect(mockRedis.get).toHaveBeenCalledWith('user:test-key');
    });

    it('deve retornar null em caso de erro', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get('error-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('deve definir valor no cache com TTL', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheService.set('test-key', testData, { ttl: 300 });

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'api:test-key',
        300,
        expect.stringContaining('"data":{"id":1,"name":"Test"}')
      );
    });

    it('deve definir valor sem TTL quando ttl é 0', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedis.set.mockResolvedValue('OK');

      const result = await cacheService.set('test-key', testData, { ttl: 0 });

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'api:test-key',
        expect.stringContaining('"data":{"id":1,"name":"Test"}')
      );
    });

    it('deve usar TTL padrão quando não especificado', async () => {
      const testData = { id: 1, name: 'Test' };
      mockRedis.setex.mockResolvedValue('OK');

      await cacheService.set('test-key', testData);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'api:test-key',
        CACHE_TTL.MEDIUM,
        expect.any(String)
      );
    });

    it('deve retornar false em caso de erro', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.set('error-key', 'value');

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('deve deletar chave existente', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await cacheService.delete('test-key');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('api:test-key');
    });

    it('deve retornar false para chave inexistente', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await cacheService.delete('non-existent-key');

      expect(result).toBe(false);
    });

    it('deve retornar false em caso de erro', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.delete('error-key');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('deve retornar true para chave existente', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await cacheService.exists('test-key');

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('api:test-key');
    });

    it('deve retornar false para chave inexistente', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await cacheService.exists('non-existent-key');

      expect(result).toBe(false);
    });
  });

  describe('getTTL', () => {
    it('deve retornar TTL da chave', async () => {
      mockRedis.ttl.mockResolvedValue(300);

      const result = await cacheService.getTTL('test-key');

      expect(result).toBe(300);
      expect(mockRedis.ttl).toHaveBeenCalledWith('api:test-key');
    });

    it('deve retornar -1 em caso de erro', async () => {
      mockRedis.ttl.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.getTTL('error-key');

      expect(result).toBe(-1);
    });
  });

  describe('invalidatePattern', () => {
    it('deve invalidar chaves por padrão', async () => {
      const keys = ['api:user:1', 'api:user:2', 'api:user:3'];
      mockRedis.keys.mockResolvedValue(keys);
      mockRedis.del.mockResolvedValue(3);

      const result = await cacheService.invalidatePattern('user:*');

      expect(result).toBe(3);
      expect(mockRedis.keys).toHaveBeenCalledWith('api:user:*');
      expect(mockRedis.del).toHaveBeenCalledWith(...keys);
    });

    it('deve retornar 0 quando nenhuma chave encontrada', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const result = await cacheService.invalidatePattern('non-existent:*');

      expect(result).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('deve limpar todo o cache', async () => {
      mockRedis.flushdb.mockResolvedValue('OK');

      const result = await cacheService.clear();

      expect(result).toBe(true);
      expect(mockRedis.flushdb).toHaveBeenCalled();
    });

    it('deve retornar false em caso de erro', async () => {
      mockRedis.flushdb.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.clear();

      expect(result).toBe(false);
    });
  });

  describe('getMultiple', () => {
    it('deve obter múltiplos valores', async () => {
      const data1 = JSON.stringify({ data: { id: 1 }, timestamp: Date.now(), version: '1.0' });
      const data2 = JSON.stringify({ data: { id: 2 }, timestamp: Date.now(), version: '1.0' });
      
      mockRedis.mget.mockResolvedValue([data1, data2, null]);

      const result = await cacheService.getMultiple(['key1', 'key2', 'key3']);

      expect(result).toEqual({
        key1: { id: 1 },
        key2: { id: 2 },
        key3: null,
      });
    });
  });

  describe('setMultiple', () => {
    it('deve definir múltiplos valores', async () => {
      const data = {
        key1: { id: 1 },
        key2: { id: 2 },
      };

      const result = await cacheService.setMultiple(data, { ttl: 300 });

      expect(result).toBe(true);
      expect(mockRedis.pipeline).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas do cache', () => {
      const stats = cacheService.getStats();

      expect(stats).toEqual({
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
      });
    });
  });

  describe('resetStats', () => {
    it('deve resetar estatísticas', () => {
      // Simular algumas operações para gerar estatísticas
      cacheService.resetStats();
      
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });
});
