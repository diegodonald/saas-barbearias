/**
 * Sistema de métricas e monitoramento
 */

import { PerformanceMetrics, ErrorMetrics, SecurityEvent, BusinessEvent } from '@/types/logging';

class MetricsCollector {
  private performanceMetrics: PerformanceMetrics[] = [];
  private errorMetrics: Map<string, ErrorMetrics> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private businessEvents: BusinessEvent[] = [];
  private readonly maxMetricsSize = 1000;

  /**
   * Coletar métricas de performance
   */
  collectPerformance(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics);
    
    // Manter apenas os últimos N registros
    if (this.performanceMetrics.length > this.maxMetricsSize) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsSize);
    }
  }

  /**
   * Coletar métricas de erro
   */
  collectError(error: Omit<ErrorMetrics, 'count' | 'firstOccurrence' | 'lastOccurrence'>): void {
    const key = `${error.type}:${error.message}`;
    const existing = this.errorMetrics.get(key);
    
    if (existing) {
      existing.count++;
      existing.lastOccurrence = new Date();
    } else {
      this.errorMetrics.set(key, {
        ...error,
        count: 1,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
      });
    }
  }

  /**
   * Registrar evento de segurança
   */
  recordSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push({
      ...event,
    });
    
    // Manter apenas os últimos eventos
    if (this.securityEvents.length > this.maxMetricsSize) {
      this.securityEvents = this.securityEvents.slice(-this.maxMetricsSize);
    }
  }

  /**
   * Registrar evento de negócio
   */
  recordBusinessEvent(event: BusinessEvent): void {
    this.businessEvents.push(event);
    
    // Manter apenas os últimos eventos
    if (this.businessEvents.length > this.maxMetricsSize) {
      this.businessEvents = this.businessEvents.slice(-this.maxMetricsSize);
    }
  }

  /**
   * Obter estatísticas de performance
   */
  getPerformanceStats(timeWindow: number = 3600000): {
    averageResponseTime: number;
    requestCount: number;
    errorRate: number;
    slowestEndpoints: Array<{ endpoint: string; avgDuration: number }>;
  } {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentMetrics = this.performanceMetrics.filter(m => m.timestamp >= cutoff);
    
    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        requestCount: 0,
        errorRate: 0,
        slowestEndpoints: [],
      };
    }

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    
    // Agrupar por endpoint
    const endpointStats = new Map<string, { totalDuration: number; count: number }>();
    recentMetrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      const existing = endpointStats.get(key) || { totalDuration: 0, count: 0 };
      existing.totalDuration += m.duration;
      existing.count++;
      endpointStats.set(key, existing);
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: stats.totalDuration / stats.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return {
      averageResponseTime: totalDuration / recentMetrics.length,
      requestCount: recentMetrics.length,
      errorRate: (errorCount / recentMetrics.length) * 100,
      slowestEndpoints,
    };
  }

  /**
   * Obter erros mais frequentes
   */
  getTopErrors(limit: number = 10): ErrorMetrics[] {
    return Array.from(this.errorMetrics.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Obter eventos de segurança recentes
   */
  getRecentSecurityEvents(timeWindow: number = 3600000): SecurityEvent[] {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.securityEvents.filter(event => 
      new Date(event.details['timestamp'] || Date.now()) >= cutoff
    );
  }

  /**
   * Obter eventos de negócio recentes
   */
  getRecentBusinessEvents(timeWindow: number = 3600000): BusinessEvent[] {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.businessEvents.filter(event => 
      new Date(event.metadata?.['timestamp'] ?? Date.now()) >= cutoff
    );
  }

  /**
   * Obter resumo geral do sistema
   */
  getSystemSummary() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      performance: this.getPerformanceStats(),
      topErrors: this.getTopErrors(5),
      securityAlerts: this.getRecentSecurityEvents().filter(e => 
        e.severity === 'HIGH' || e.severity === 'CRITICAL'
      ).length,
      businessActivity: this.getRecentBusinessEvents().length,
      memoryUsage,
      uptime,
    };
  }

  /**
   * Limpar métricas antigas
   */
  cleanup(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas
    
    // Limpar métricas de performance
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp >= cutoff);
    
    // Limpar eventos de segurança
    this.securityEvents = this.securityEvents.filter(e => 
      new Date(e.details['timestamp'] ?? Date.now()) >= cutoff
    );
    
    // Limpar eventos de negócio
    this.businessEvents = this.businessEvents.filter(e => 
      new Date(e.metadata?.['timestamp'] ?? Date.now()) >= cutoff
    );
  }
}

// Instância singleton
export const metricsCollector = new MetricsCollector();

// Configurar limpeza automática a cada hora
setInterval(() => {
  metricsCollector.cleanup();
}, 60 * 60 * 1000);

export default metricsCollector;
