import dotenv from 'dotenv';
import { z } from 'zod';

// Carregar variáveis de ambiente
dotenv.config();

// Schema de validação para variáveis de ambiente
const envSchema = z.object({
  // Configurações do servidor
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),

  // Configurações do banco de dados
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

  // Configurações JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Configurações CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Configurações de Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Configurações de Upload
  UPLOAD_MAX_SIZE: z.string().transform(Number).default('5242880'), // 5MB
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/webp'),

  // Configurações de Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().optional(),
  FROM_NAME: z.string().optional(),

  // Configurações de Logs
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  // Configurações de Monitoramento
  SENTRY_DSN: z.string().optional(),

  // Configurações Jira
  JIRA_BASE_URL: z.string().optional(),
  JIRA_EMAIL: z.string().optional(),
  JIRA_API_TOKEN: z.string().optional(),
  JIRA_PROJECT_KEY: z.string().optional(),

  // Configurações Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DATABASE: z.string().transform(Number).default('0'),

  // Configurações de Desenvolvimento
  ENABLE_SWAGGER: z.string().transform(Boolean).default('true'),
  ENABLE_CORS: z.string().transform(Boolean).default('true'),
  ENABLE_MORGAN_LOGGING: z.string().transform(Boolean).default('true'),

  // Configurações de Produção
  TRUST_PROXY: z.string().transform(Boolean).default('false'),
});

// Validar e exportar configurações
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Erro nas variáveis de ambiente:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Configurações derivadas
export const config = {
  ...env,

  // Configurações do servidor
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    trustProxy: env.TRUST_PROXY,
  },

  // Configurações do banco
  database: {
    url: env.DATABASE_URL,
  },

  // Configurações JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // Configurações CORS
  cors: {
    origin: env.CORS_ORIGIN,
    enabled: env.ENABLE_CORS,
  },

  // Configurações Redis
  redis: {
    url: env.REDIS_URL,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    database: env.REDIS_DATABASE,
  },

  // Configurações de Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Configurações de Upload
  upload: {
    maxSize: env.UPLOAD_MAX_SIZE,
    allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(','),
  },

  // Configurações de Email
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.FROM_EMAIL,
    fromName: env.FROM_NAME,
  },

  // Configurações de Logs
  logging: {
    level: env.LOG_LEVEL,
    enableMorgan: env.ENABLE_MORGAN_LOGGING,
  },

  // Configurações de Monitoramento
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
  },

  // Configurações Jira
  jira: {
    baseUrl: env.JIRA_BASE_URL,
    email: env.JIRA_EMAIL,
    apiToken: env.JIRA_API_TOKEN,
    projectKey: env.JIRA_PROJECT_KEY,
  },

  // Configurações de Desenvolvimento
  development: {
    enableSwagger: env.ENABLE_SWAGGER,
  },

  // Helpers
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
};

export default config;
