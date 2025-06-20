import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '@/config/env';
import { logger } from '@/config/logger';
import {
  JiraIssue,
  JiraProject,
  JiraTransition,
  JiraSearchRequest,
  JiraSearchResponse,
  CreateJiraIssueRequest,
  UpdateJiraIssueRequest,
  CreateJiraCommentRequest,
  JiraComment,
  SaasIssueRequest,
  SaasIssueResponse,
} from '@/types/jira';

export class JiraService {
  private static client: AxiosInstance | null = null;

  /**
   * Inicializar cliente Jira
   */
  private static getClient(): AxiosInstance {
    if (!JiraService.client) {
      if (!config.jira.baseUrl || !config.jira.email || !config.jira.apiToken) {
        throw new Error('Configurações do Jira não encontradas');
      }

      JiraService.client = axios.create({
        baseURL: `${config.jira.baseUrl}/rest/api/3`,
        auth: {
          username: config.jira.email,
          password: config.jira.apiToken,
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      // Interceptor para log de erros
      JiraService.client.interceptors.response.use(
        (response) => response,
        (error) => {
          logger.error('Erro na API do Jira:', {
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
          });
          return Promise.reject(error);
        }
      );
    }

    return JiraService.client;
  }

  /**
   * Verificar conectividade com Jira
   */
  static async testConnection(): Promise<boolean> {
    try {
      const client = JiraService.getClient();
      await client.get('/myself');
      logger.info('Conexão com Jira estabelecida com sucesso');
      return true;
    } catch (error) {
      logger.error('Falha na conexão com Jira:', error);
      return false;
    }
  }

  /**
   * Obter informações do projeto
   */
  static async getProject(projectKey?: string): Promise<JiraProject> {
    try {
      const client = JiraService.getClient();
      const key = projectKey || config.jira.projectKey;

      if (!key) {
        throw new Error('Chave do projeto não fornecida');
      }

      const response: AxiosResponse<JiraProject> = await client.get(`/project/${key}`);
      return response.data;
    } catch (error) {
      logger.error(`Erro ao obter projeto ${projectKey}:`, error);
      throw new Error('Falha ao obter informações do projeto');
    }
  }

  /**
   * Criar issue no Jira
   */
  static async createIssue(issueData: CreateJiraIssueRequest): Promise<JiraIssue> {
    try {
      const client = JiraService.getClient();

      const payload = {
        fields: {
          project: {
            key: config.jira.projectKey,
          },
          summary: issueData.summary,
          description: issueData.description
            ? {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: issueData.description,
                      },
                    ],
                  },
                ],
              }
            : undefined,
          issuetype: {
            id: issueData.issueType,
          },
          priority: issueData.priority
            ? {
                id: issueData.priority,
              }
            : undefined,
          assignee: issueData.assignee
            ? {
                accountId: issueData.assignee,
              }
            : undefined,
          labels: issueData.labels || [],
          components: issueData.components?.map((id) => ({ id })) || [],
          ...issueData.customFields,
        },
      };

      const response: AxiosResponse<{ id: string; key: string }> = await client.post(
        '/issue',
        payload
      );

      // Buscar a issue criada para retornar dados completos
      const createdIssue = await JiraService.getIssue(response.data.key);

      logger.info(`Issue criada no Jira: ${response.data.key}`);
      return createdIssue;
    } catch (error) {
      logger.error('Erro ao criar issue no Jira:', error);
      throw new Error('Falha ao criar issue no Jira');
    }
  }

  /**
   * Obter issue por chave
   */
  static async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      const client = JiraService.getClient();
      const response: AxiosResponse<JiraIssue> = await client.get(`/issue/${issueKey}`);
      return response.data;
    } catch (error) {
      logger.error(`Erro ao obter issue ${issueKey}:`, error);
      throw new Error('Falha ao obter issue');
    }
  }

  /**
   * Atualizar issue
   */
  static async updateIssue(issueKey: string, updateData: UpdateJiraIssueRequest): Promise<void> {
    try {
      const client = JiraService.getClient();

      const payload = {
        fields: {
          ...(updateData.summary && { summary: updateData.summary }),
          ...(updateData.description && {
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: updateData.description,
                    },
                  ],
                },
              ],
            },
          }),
          ...(updateData.priority && { priority: { id: updateData.priority } }),
          ...(updateData.assignee && { assignee: { accountId: updateData.assignee } }),
          ...(updateData.labels && { labels: updateData.labels }),
          ...(updateData.components && { components: updateData.components.map((id) => ({ id })) }),
          ...updateData.customFields,
        },
      };

      await client.put(`/issue/${issueKey}`, payload);
      logger.info(`Issue ${issueKey} atualizada no Jira`);
    } catch (error) {
      logger.error(`Erro ao atualizar issue ${issueKey}:`, error);
      throw new Error('Falha ao atualizar issue');
    }
  }

  /**
   * Buscar issues
   */
  static async searchIssues(searchRequest: JiraSearchRequest): Promise<JiraSearchResponse> {
    try {
      const client = JiraService.getClient();

      const params = {
        jql: searchRequest.jql,
        startAt: searchRequest.startAt || 0,
        maxResults: searchRequest.maxResults || 50,
        fields: searchRequest.fields?.join(',') || '*all',
        expand: searchRequest.expand?.join(',') || '',
      };

      const response: AxiosResponse<JiraSearchResponse> = await client.get('/search', { params });
      return response.data;
    } catch (error) {
      logger.error('Erro ao buscar issues no Jira:', error);
      throw new Error('Falha ao buscar issues');
    }
  }

  /**
   * Obter transições disponíveis para uma issue
   */
  static async getTransitions(issueKey: string): Promise<JiraTransition[]> {
    try {
      const client = JiraService.getClient();
      const response: AxiosResponse<{ transitions: JiraTransition[] }> = await client.get(
        `/issue/${issueKey}/transitions`
      );
      return response.data.transitions;
    } catch (error) {
      logger.error(`Erro ao obter transições para ${issueKey}:`, error);
      throw new Error('Falha ao obter transições');
    }
  }

  /**
   * Executar transição de status
   */
  static async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    try {
      const client = JiraService.getClient();

      const payload = {
        transition: {
          id: transitionId,
        },
      };

      await client.post(`/issue/${issueKey}/transitions`, payload);
      logger.info(`Transição executada para issue ${issueKey}: ${transitionId}`);
    } catch (error) {
      logger.error(`Erro ao executar transição para ${issueKey}:`, error);
      throw new Error('Falha ao executar transição');
    }
  }

  /**
   * Adicionar comentário a uma issue
   */
  static async addComment(
    issueKey: string,
    commentData: CreateJiraCommentRequest
  ): Promise<JiraComment> {
    try {
      const client = JiraService.getClient();

      const payload = {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: commentData.body,
                },
              ],
            },
          ],
        },
      };

      const response: AxiosResponse<JiraComment> = await client.post(
        `/issue/${issueKey}/comment`,
        payload
      );
      logger.info(`Comentário adicionado à issue ${issueKey}`);
      return response.data;
    } catch (error) {
      logger.error(`Erro ao adicionar comentário à issue ${issueKey}:`, error);
      throw new Error('Falha ao adicionar comentário');
    }
  }

  /**
   * Método de conveniência para criar issue do SaaS
   */
  static async createSaasIssue(issueData: SaasIssueRequest): Promise<SaasIssueResponse> {
    try {
      // Mapear tipos e prioridades do SaaS para IDs do Jira
      const issueTypeMapping = {
        bug: '10004',
        feature: '10001',
        task: '10003',
        support: '10002',
      };

      const priorityMapping = {
        low: '4',
        medium: '3',
        high: '2',
        critical: '1',
      };

      const jiraIssueData: CreateJiraIssueRequest = {
        summary: issueData.title,
        description: issueData.description ?? undefined,
        issueType: issueTypeMapping[issueData.type],
        priority: priorityMapping[issueData.priority],
        labels: [...(issueData.labels || []), `barbershop:${issueData.barbershopId}`],
      };

      const createdIssue = await JiraService.createIssue(jiraIssueData);

      return {
        id: createdIssue.id,
        jiraKey: createdIssue.key,
        title: createdIssue.summary,
        description: issueData.description ?? undefined,
        type: issueData.type,
        priority: issueData.priority,
        status: createdIssue.status.name,
        assignee: createdIssue.assignee?.displayName,
        reporter: createdIssue.reporter.displayName,
        created: createdIssue.created,
        updated: createdIssue.updated,
        url: `${config.jira.baseUrl}/browse/${createdIssue.key}`,
      };
    } catch (error) {
      logger.error('Erro ao criar issue do SaaS:', error);
      throw error;
    }
  }
}
