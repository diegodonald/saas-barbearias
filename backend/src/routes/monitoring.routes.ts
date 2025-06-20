/**
 * Rotas para monitoramento e métricas do sistema
 */

import { Router } from 'express';
import { MonitoringController } from '@/controllers/monitoring.controller';
import { authenticate, requireRole } from '@/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/monitoring/performance:
 *   get:
 *     summary: Obter métricas de performance
 *     description: Retorna estatísticas de performance do sistema (apenas para admins)
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: integer
 *           default: 3600000
 *         description: Janela de tempo em milissegundos (padrão 1 hora)
 *     responses:
 *       200:
 *         description: Métricas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Métricas de performance obtidas com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     averageResponseTime:
 *                       type: number
 *                       example: 150.5
 *                     requestCount:
 *                       type: integer
 *                       example: 1250
 *                     errorRate:
 *                       type: number
 *                       example: 2.5
 *                     slowestEndpoints:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           endpoint:
 *                             type: string
 *                           avgDuration:
 *                             type: number
 *       401:
 *         description: Token de autenticação inválido
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.get(
  '/performance',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  MonitoringController.getPerformanceMetrics
);

/**
 * @swagger
 * /api/monitoring/errors:
 *   get:
 *     summary: Obter erros mais frequentes
 *     description: Retorna lista dos erros mais frequentes do sistema
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número máximo de erros a retornar
 *     responses:
 *       200:
 *         description: Erros obtidos com sucesso
 */
router.get(
  '/errors',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  MonitoringController.getTopErrors
);

/**
 * @swagger
 * /api/monitoring/security:
 *   get:
 *     summary: Obter eventos de segurança
 *     description: Retorna eventos de segurança recentes
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: integer
 *           default: 3600000
 *         description: Janela de tempo em milissegundos
 *     responses:
 *       200:
 *         description: Eventos de segurança obtidos com sucesso
 */
router.get(
  '/security',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  MonitoringController.getSecurityEvents
);

/**
 * @swagger
 * /api/monitoring/summary:
 *   get:
 *     summary: Obter resumo geral do sistema
 *     description: Retorna um resumo completo da saúde e performance do sistema
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumo obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     performance:
 *                       type: object
 *                     topErrors:
 *                       type: array
 *                     securityAlerts:
 *                       type: integer
 *                     businessActivity:
 *                       type: integer
 *                     memoryUsage:
 *                       type: object
 *                     uptime:
 *                       type: number
 */
router.get(
  '/summary',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  MonitoringController.getSystemSummary
);

/**
 * @swagger
 * /api/monitoring/logs:
 *   get:
 *     summary: Obter logs recentes
 *     description: Retorna logs recentes do sistema (apenas super admins)
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *           default: info
 *         description: Nível de log
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Número máximo de logs
 *     responses:
 *       200:
 *         description: Logs obtidos com sucesso
 */
router.get(
  '/logs',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  MonitoringController.getRecentLogs
);

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: Health check avançado
 *     description: Retorna informações detalhadas sobre a saúde do sistema
 *     tags: [Monitoramento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sistema saudável
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                     version:
 *                       type: string
 *                     environment:
 *                       type: string
 *                     services:
 *                       type: object
 *                     system:
 *                       type: object
 *                     metrics:
 *                       type: object
 *       503:
 *         description: Sistema com problemas
 */
router.get(
  '/health',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  MonitoringController.getAdvancedHealthCheck
);

export default router;
