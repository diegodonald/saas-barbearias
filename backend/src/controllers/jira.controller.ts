import { Request, Response } from 'express';
import { JiraService } from '@/services/jira.service';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/types/auth';
import {
  SaasIssueRequest,
  CreateJiraCommentRequest,
  JiraSearchRequest,
  UpdateJiraIssueRequest,
} from '@/types/jira';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export class JiraController {
  /**
   * Testar conexão com Jira
   */
  static async testConnection(_req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const isConnected = await JiraService.testConnection();

      res.status(200).json({
        success: isConnected,
        message: isConnected ? 'Conexão com Jira estabelecida' : 'Falha na conexão com Jira',
        data: { connected: isConnected },
      });
    } catch (error) {
      logger.error('Erro no teste de conexão Jira:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Obter informações do projeto
   */
  static async getProject(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { projectKey } = req.params;
      const project = await JiraService.getProject(projectKey);

      res.status(200).json({
        success: true,
        message: 'Projeto obtido com sucesso',
        data: project,
      });
    } catch (error) {
      logger.error('Erro ao obter projeto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter projeto',
        error: 'PROJECT_ERROR',
      });
    }
  }

  /**
   * Criar issue no Jira
   */
  static async createIssue(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const issueData = req.body as unknown as SaasIssueRequest;

      // Validar dados obrigatórios
      if (!issueData.title || !issueData.type || !issueData.priority || !issueData.barbershopId) {
        res.status(400).json({
          success: false,
          message: 'Dados obrigatórios não fornecidos',
          error: 'VALIDATION_ERROR',
        });
        return;
      }

      const createdIssue = await JiraService.createSaasIssue(issueData);

      logger.info(`Issue criada por ${req.user.email}: ${createdIssue.jiraKey}`);

      res.status(201).json({
        success: true,
        message: 'Issue criada com sucesso',
        data: createdIssue,
      });
    } catch (error) {
      logger.error('Erro ao criar issue:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar issue',
        error: 'CREATE_ISSUE_ERROR',
      });
    }
  }

  /**
   * Obter issue por chave
   */
  static async getIssue(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { issueKey } = req.params;

      if (!issueKey) {
        res.status(400).json({
          success: false,
          message: 'Chave da issue não fornecida',
          error: 'VALIDATION_ERROR',
        });
        return;
      }

      const issue = await JiraService.getIssue(issueKey);

      res.status(200).json({
        success: true,
        message: 'Issue obtida com sucesso',
        data: issue,
      });
    } catch (error) {
      logger.error('Erro ao obter issue:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter issue',
        error: 'GET_ISSUE_ERROR',
      });
    }
  }

  /**
   * Atualizar issue
   */
  static async updateIssue(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { issueKey } = (req as any).params;
      const updateData = req.body as UpdateJiraIssueRequest;

      if (!issueKey) {
        res.status(400).json({
          success: false,
          message: 'Chave da issue não fornecida',
          error: 'VALIDATION_ERROR',
        });
        return;
      }

      await JiraService.updateIssue(issueKey, updateData);

      logger.info(`Issue ${issueKey} atualizada por ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: 'Issue atualizada com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao atualizar issue:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar issue',
        error: 'UPDATE_ISSUE_ERROR',
      });
    }
  }

  /**
   * Buscar issues
   */
  static async searchIssues(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const searchRequest: JiraSearchRequest = {
        jql: (req.query['jql'] as string) || 'project = SAAS',
        startAt: parseInt(req.query['startAt'] as string) || 0,
        maxResults: parseInt(req.query['maxResults'] as string) || 50,
      };

      if (req.query['fields']) {
        searchRequest.fields = (req.query['fields'] as string).split(',');
      }

      if (req.query['expand']) {
        searchRequest.expand = (req.query['expand'] as string).split(',');
      }

      const searchResults = await JiraService.searchIssues(searchRequest);

      res.status(200).json({
        success: true,
        message: 'Busca realizada com sucesso',
        data: searchResults,
      });
    } catch (error) {
      logger.error('Erro ao buscar issues:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar issues',
        error: 'SEARCH_ERROR',
      });
    }
  }

  /**
   * Obter transições disponíveis
   */
  static async getTransitions(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { issueKey } = req.params;

      if (!issueKey) {
        res.status(400).json({
          success: false,
          message: 'Chave da issue não fornecida',
          error: 'VALIDATION_ERROR',
        });
        return;
      }

      const transitions = await JiraService.getTransitions(issueKey);

      res.status(200).json({
        success: true,
        message: 'Transições obtidas com sucesso',
        data: transitions,
      });
    } catch (error) {
      logger.error('Erro ao obter transições:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter transições',
        error: 'TRANSITIONS_ERROR',
      });
    }
  }

  /**
   * Executar transição de status
   */
  static async transitionIssue(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const { issueKey } = (req as any).params;
      const { transitionId } = req.body as any;

      if (!issueKey || !transitionId) {
        res.status(400).json({
          success: false,
          message: 'Chave da issue ou ID da transição não fornecidos',
          error: 'VALIDATION_ERROR',
        });
        return;
      }

      await JiraService.transitionIssue(issueKey, transitionId);

      logger.info(`Transição executada na issue ${issueKey} por ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: 'Transição executada com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao executar transição:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao executar transição',
        error: 'TRANSITION_ERROR',
      });
    }
  }

  /**
   * Adicionar comentário
   */
  static async addComment(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { issueKey } = (req as any).params;
      const commentData = req.body as unknown as CreateJiraCommentRequest;

      if (!issueKey || !commentData.body) {
        res.status(400).json({
          success: false,
          message: 'Chave da issue ou corpo do comentário não fornecidos',
          error: 'VALIDATION_ERROR',
        });
        return;
      }

      const comment = await JiraService.addComment(issueKey, commentData);

      logger.info(`Comentário adicionado à issue ${issueKey} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Comentário adicionado com sucesso',
        data: comment,
      });
    } catch (error) {
      logger.error('Erro ao adicionar comentário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao adicionar comentário',
        error: 'COMMENT_ERROR',
      });
    }
  }
}
