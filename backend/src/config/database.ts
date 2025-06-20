import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Configuração do Prisma Client com logging
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Event listeners para logging
prisma.$on('query', (e) => {
  logger.debug('Query: ' + e.query);
  logger.debug('Params: ' + e.params);
  logger.debug('Duration: ' + e.duration + 'ms');
});

prisma.$on('error', (e) => {
  logger.error('Database error:', e);
});

prisma.$on('info', (e) => {
  logger.info('Database info:', e.message);
});

prisma.$on('warn', (e) => {
  logger.warn('Database warning:', e.message);
});

// Função para conectar ao banco
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ Conectado ao banco de dados PostgreSQL');
  } catch (error) {
    logger.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
};

// Função para desconectar do banco
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('✅ Desconectado do banco de dados');
  } catch (error) {
    logger.error('❌ Erro ao desconectar do banco de dados:', error);
  }
};

// Função para verificar saúde do banco
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('❌ Banco de dados não está saudável:', error);
    return false;
  }
};

export { prisma };
export default prisma;
