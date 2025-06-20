/**
 * Configuração e cliente Redis para cache
 */

import Redis from 'ioredis';
import { config } from './env';
import { advancedLogger } from './logger';

// Flag para controlar se o Redis está disponível
let isRedisAvailable = false;

// Configuração do Redis
const redisConfig: any = {
  host: config.redis?.host ?? 'localhost',
  port: config.redis?.port ?? 6379,
  db: config.redis?.database ?? 0,
  retryDelayOnFailover: 1000,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 5000,
  commandTimeout: 3000,
  // Configurações para evitar loop infinito de reconexão
  retryDelayOnClusterDown: 300,
  enableReadyCheck: false,
  // Desabilitar reconexão automática em caso de falha
  autoResubscribe: false,
  autoResendUnfulfilledCommands: false,
};

// Adicionar password apenas se definido
if (config.redis?.password) {
  redisConfig.password = config.redis.password;
}

// Cliente Redis principal (pode ser null se não disponível)
export let redis: Redis | null = null;

// Cliente Redis para pub/sub (pode ser null se não disponível)
export let redisPubSub: Redis | null = null;

// Função para configurar eventos do Redis
function setupRedisEvents(redisClient: Redis) {
  redisClient.on('connect', () => {
    isRedisAvailable = true;
    advancedLogger.info('Redis conectado com sucesso', {
      metadata: { host: redisConfig.host, port: redisConfig.port },
    });
  });

  redisClient.on('ready', () => {
    isRedisAvailable = true;
    advancedLogger.info('Redis pronto para uso');
  });

  redisClient.on('error', (error) => {
    isRedisAvailable = false;
    advancedLogger.error('Erro na conexão Redis', error, {
      metadata: { host: redisConfig.host, port: redisConfig.port },
    });
  });

  redisClient.on('close', () => {
    isRedisAvailable = false;
    advancedLogger.warn('Conexão Redis fechada');
  });

  redisClient.on('reconnecting', () => {
    advancedLogger.info('Reconectando ao Redis...');
  });
}

// Função para verificar saúde do Redis
export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  if (!redis || !isRedisAvailable) {
    return {
      status: 'unhealthy',
      error: 'Redis não disponível',
    };
  }

  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    isRedisAvailable = false;
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Função para conectar ao Redis
export async function connectRedis(): Promise<void> {
  try {
    // Criar instância do Redis apenas quando necessário
    redis = new Redis(redisConfig);
    redisPubSub = new Redis(redisConfig);

    // Configurar eventos
    setupRedisEvents(redis);
    setupRedisEvents(redisPubSub);

    // Tentar conectar com timeout
    const connectPromise = redis.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na conexão Redis')), 3000);
    });

    await Promise.race([connectPromise, timeoutPromise]);
    isRedisAvailable = true;
    advancedLogger.info('Cliente Redis inicializado com sucesso');
  } catch (error) {
    isRedisAvailable = false;
    advancedLogger.error('Falha ao conectar ao Redis', error as Error);

    // Limpar instâncias em caso de falha
    if (redis) {
      redis.disconnect();
      redis = null;
    }
    if (redisPubSub) {
      redisPubSub.disconnect();
      redisPubSub = null;
    }

    advancedLogger.warn('⚠️ Aplicação continuará sem cache Redis');
  }
}

// Função para desconectar do Redis
export async function disconnectRedis(): Promise<void> {
  try {
    if (redis) {
      redis.disconnect();
      redis = null;
    }
    if (redisPubSub) {
      redisPubSub.disconnect();
      redisPubSub = null;
    }
    isRedisAvailable = false;
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
