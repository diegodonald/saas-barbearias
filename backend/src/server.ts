import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';

import { config } from '@/config/env';
import { logger, setupErrorHandling, httpLogger } from '@/config/logger';
import { connectDatabase, checkDatabaseHealth } from '@/config/database';
import { connectRedis, checkRedisHealth } from '@/config/redis';
import { specs } from '@/config/swagger';

// Importar rotas
import authRoutes from '@/routes/auth.routes';
import jiraRoutes from '@/routes/jira.routes';
import monitoringRoutes from '@/routes/monitoring.routes';
import cacheRoutes from '@/routes/cache.routes';

// Configurar tratamento de erros não capturados
setupErrorHandling();

// Criar aplicação Express
const app = express();

// Configurar proxy se necessário
if (config.server.trustProxy) {
  app.set('trust proxy', 1);
}

// Middlewares de segurança
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
if (config.cors.enabled) {
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em alguns minutos.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Middlewares de parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging HTTP
if (config.logging.enableMorgan && config.isDevelopment) {
  app.use(morgan('combined'));
} else {
  app.use(httpLogger);
}

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const isDatabaseHealthy = await checkDatabaseHealth();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    const healthStatus = {
      status: isDatabaseHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      version: process.env['npm_package_version'] ?? '1.0.0',
      services: {
        database: isDatabaseHealthy ? 'connected' : 'disconnected',
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
    };

    res.status(isDatabaseHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    logger.error('Erro no health check:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// Documentação da API com Swagger
if (config.development.enableSwagger) {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'SaaS Barbearias API Documentation',
    })
  );
}

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/jira', jiraRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/cache', cacheRoutes);

// Rota de teste
app.get('/api/test', (_req, res) => {
  res.json({
    success: true,
    message: 'API funcionando corretamente!',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// Rota 404 para API
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    error: 'NOT_FOUND',
  });
});

// Rota raiz
app.get('/', (_req, res) => {
  res.json({
    name: 'SaaS Barbearias API',
    version: '1.0.0',
    description: 'API para sistema de gestão de barbearias',
    documentation: '/api/docs',
    health: '/health',
  });
});

// Middleware de tratamento de erros
app.use((error: any, _req: express.Request, res: express.Response) => {
  logger.error('Erro não tratado:', error);

  // Erro de validação do Prisma
  if (error.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Dados duplicados',
      error: 'DUPLICATE_DATA',
    });
  }

  // Erro de registro não encontrado do Prisma
  if (error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Registro não encontrado',
      error: 'NOT_FOUND',
    });
  }

  // Erro de JSON malformado
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido',
      error: 'INVALID_JSON',
    });
  }

  // Erro genérico
  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: 'INTERNAL_ERROR',
    ...(config.isDevelopment && { details: error.message }),
  });
});

// Função para iniciar o servidor
async function startServer() {
  try {
    // Conectar ao banco de dados
    await connectDatabase();

    // Conectar ao Redis
    try {
      await connectRedis();
      const redisHealth = await checkRedisHealth();
      if (redisHealth.status === 'healthy') {
        logger.info('✅ Conectado ao Redis');
      } else {
        logger.warn('⚠️ Redis não disponível - cache desabilitado');
      }
    } catch (error) {
      logger.warn('⚠️ Redis não disponível - continuando sem cache');
    }

    // Iniciar servidor
    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Servidor rodando na porta ${config.server.port}`);
      logger.info(`📊 Ambiente: ${config.server.nodeEnv}`);
      logger.info(`🔗 URL: http://localhost:${config.server.port}`);
      logger.info(`💚 Health Check: http://localhost:${config.server.port}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} recebido. Iniciando shutdown graceful...`);

      server.close(() => {
        logger.info('Servidor HTTP fechado');
        process.exit(0);
      });

      // Forçar shutdown após 10 segundos
      setTimeout(() => {
        logger.error('Forçando shutdown após timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

export default app;
