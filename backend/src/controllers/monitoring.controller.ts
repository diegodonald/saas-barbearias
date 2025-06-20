/**
 * Controller para monitoramento e métricas do sistema
 */

import { Request, Response } from 'express';
import { metricsCollector } from '@/utils/metrics';
import { advancedLogger } from '@/config/logger';
import { ApiResponse } from '@/types/api';

export class MonitoringController {
  /**
   * Obter métricas de performance do sistema
   */
  static async getPerformanceMetrics(req: Request, res: Response<ApiResponse>) {
    try {
      const timeWindow = parseInt(req.query['timeWindow'] as string) || 3600000; // 1 hora por padrão
      const stats = metricsCollector.getPerformanceStats(timeWindow);

      advancedLogger.info('Performance metrics requested', {
        userId: req.user?.id,
        timeWindow,
      });

      res.json({
        success: true,
        message: 'Métricas de performance obtidas com sucesso',
        data: stats,
      });
    } catch (error) {
      advancedLogger.error('Erro ao obter métricas de performance', error as Error, {
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
   * Obter erros mais frequentes
   */
  static async getTopErrors(req: Request, res: Response<ApiResponse>) {
    try {
      const limit = parseInt(req.query['limit'] as string) || 10;
      const errors = metricsCollector.getTopErrors(limit);

      advancedLogger.info('Top errors requested', {
        userId: req.user?.id,
        limit,
      });

      res.json({
        success: true,
        message: 'Erros mais frequentes obtidos com sucesso',
        data: errors,
      });
    } catch (error) {
      advancedLogger.error('Erro ao obter top errors', error as Error, {
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
   * Obter eventos de segurança recentes
   */
  static async getSecurityEvents(req: Request, res: Response<ApiResponse>) {
    try {
      const timeWindow = parseInt(req.query['timeWindow'] as string) || 3600000;
      const events = metricsCollector.getRecentSecurityEvents(timeWindow);

      advancedLogger.info('Security events requested', {
        userId: req.user?.id,
        timeWindow,
      });

      res.json({
        success: true,
        message: 'Eventos de segurança obtidos com sucesso',
        data: events,
      });
    } catch (error) {
      advancedLogger.error('Erro ao obter eventos de segurança', error as Error, {
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
   * Obter resumo geral do sistema
   */
  static async getSystemSummary(req: Request, res: Response<ApiResponse>) {
    try {
      const summary = metricsCollector.getSystemSummary();

      advancedLogger.info('System summary requested', {
        userId: req.user?.id,
      });

      res.json({
        success: true,
        message: 'Resumo do sistema obtido com sucesso',
        data: summary,
      });
    } catch (error) {
      advancedLogger.error('Erro ao obter resumo do sistema', error as Error, {
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
   * Obter logs recentes (apenas para admins)
   */
  static async getRecentLogs(req: Request, res: Response<ApiResponse>) {
    try {
      const level = req.query['level'] as string ?? 'info';
      const limit = parseInt(req.query['limit'] as string) || 100;

      // Simular obtenção de logs (em produção, isso viria de um sistema de logs centralizado)
      const logs = {
        level,
        limit,
        message: 'Em produção, isso retornaria logs reais de um sistema como ELK Stack ou CloudWatch',
        timestamp: new Date().toISOString(),
      };

      advancedLogger.info('Recent logs requested', {
        userId: req.user?.id,
        level,
        limit,
      });

      res.json({
        success: true,
        message: 'Logs recentes obtidos com sucesso',
        data: logs,
      });
    } catch (error) {
      advancedLogger.error('Erro ao obter logs recentes', error as Error, {
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
   * Health check avançado
   */
  static async getAdvancedHealthCheck(req: Request, res: Response<ApiResponse>) {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();
      
      // Verificar saúde dos serviços
      const services = {
        database: 'healthy', // Em produção, verificar conexão real
        redis: 'healthy',    // Em produção, verificar conexão real
        external_apis: 'healthy', // Verificar APIs externas
      };

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        version: process.env['npm_package_version'] ?? '1.0.0',
        environment: process.env['NODE_ENV'],
        services,
        system: {
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
          },
          load: (process as any).loadavg ? (process as any).loadavg() : [0, 0, 0],
        },
        metrics: metricsCollector.getSystemSummary(),
      };

      const statusCode = health.status === 'healthy' ? 200 : 503;

      advancedLogger.info('Advanced health check performed', {
        userId: req.user?.id,
        status: health.status,
      });

      res.status(statusCode).json({
        success: health.status === 'healthy',
        message: `Sistema ${health.status}`,
        data: health,
      });
    } catch (error) {
      advancedLogger.error('Erro no health check avançado', error as Error, {
        userId: req.user?.id,
      });

      res.status(503).json({
        success: false,
        message: 'Erro no health check',
        error: 'HEALTH_CHECK_ERROR',
      });
    }
  }
}
