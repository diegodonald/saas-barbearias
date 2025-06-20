/**
 * Configuração e cliente Redis para cache
 */

import Redis from 'ioredis';
import { config } from './env';
import { advancedLogger } from './logger';

// Configuração do Redis
const redisConfig: any = {
  host: config.redis?.host ?? 'localhost',
  port: config.redis?.port ?? 6379,
  db: config.redis?.database ?? 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Adicionar password apenas se definido
if (config.redis?.password) {
  redisConfig.password = config.redis.password;
}

// Cliente Redis principal
export const redis = new Redis(redisConfig);

// Cliente Redis para pub/sub (se necessário)
export const redisPubSub = new Redis(redisConfig);

// Configuração de eventos
redis.on('connect', () => {
  advancedLogger.info('Redis conectado com sucesso', {
    metadata: { host: redisConfig.host, port: redisConfig.port },
  });
});

redis.on('ready', () => {
  advancedLogger.info('Redis pronto para uso');
});

redis.on('error', (error) => {
  advancedLogger.error('Erro na conexão Redis', error, {
    metadata: { host: redisConfig.host, port: redisConfig.port },
  });
});

redis.on('close', () => {
  advancedLogger.warn('Conexão Redis fechada');
});

redis.on('reconnecting', () => {
  advancedLogger.info('Reconectando ao Redis...');
});

// Função para verificar saúde do Redis
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Função para conectar ao Redis
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    advancedLogger.info('Cliente Redis inicializado com sucesso');
  } catch (error) {
    advancedLogger.error('Falha ao conectar ao Redis', error as Error);
    throw error;
  }
}

// Função para desconectar do Redis
export async function disconnectRedis(): Promise<void> {
  try {
    await redis.disconnect();
    await redisPubSub.disconnect();
    advancedLogger.info('Conexões Redis fechadas');
  } catch (error) {
    advancedLogger.error('Erro ao fechar conexões Redis', error as Error);
  }
}

// Configurações de TTL padrão (em segundos)
export const CACHE_TTL = {
  SHORT: 60, // 1 minuto
  MEDIUM: 300, // 5 minutos
  LONG: 1800, // 30 minutos
  VERY_LONG: 3600, // 1 hora
  DAILY: 86400, // 24 horas
} as const;

// Prefixos para diferentes tipos de cache
export const CACHE_PREFIXES = {
  USER: 'user:',
  SESSION: 'session:',
  AUTH: 'auth:',
  API: 'api:',
  QUERY: 'query:',
  RATE_LIMIT: 'rate_limit:',
  TEMP: 'temp:',
  BUSINESS: 'business:',
} as const;

export default redis;
