import { JiraService } from '@/services/jira.service';
import axios from 'axios';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock da configuração
jest.mock('@/config/env', () => ({
  config: {
    jira: {
      baseUrl: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token',
      projectKey: 'TEST',
    },
  },
}));

// Mock do logger para evitar logs nos testes
jest.mock('@/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('JiraService', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock da instância do axios
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Reset do cliente singleton do JiraService
    (JiraService as any).client = null;
  });

  describe('testConnection', () => {
    it('deve retornar true para conexão bem-sucedida', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValue({
        data: { accountId: 'test-account' },
      });

      // Act
      const result = await JiraService.testConnection();

      // Assert
      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/myself');
    });

    it('deve retornar false para falha na conexão', async () => {
      // Arrange
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));

      // Act
      const result = await JiraService.testConnection();

      // Assert
      expect(result).toBe(false);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/myself');
    });
  });

  describe('getProject', () => {
    it('deve obter projeto com sucesso', async () => {
      // Arrange
      const mockProject = {
        id: '10000',
        key: 'TEST',
        name: 'Test Project',
        description: 'Test project description',
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: mockProject,
      });

      // Act
      const result = await JiraService.getProject('TEST');

      // Assert
      expect(result).toEqual(mockProject);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/project/TEST');
    });

    it('deve usar projectKey padrão se não fornecido', async () => {
      // Arrange
      const mockProject = { id: '10000', key: 'TEST' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockProject });

      // Act
      await JiraService.getProject();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/project/TEST');
    });
  });

  describe('createIssue', () => {
    it('deve criar issue com sucesso', async () => {
      // Arrange
      const issueData = {
        summary: 'Test Issue',
        description: 'Test description',
        issueType: '10001',
        priority: '3',
        labels: ['test'],
      };

      const mockCreateResponse = {
        data: { id: '10001', key: 'TEST-1' },
      };

      const mockIssue = {
        id: '10001',
        key: 'TEST-1',
        summary: 'Test Issue',
        status: { name: 'To Do' },
        priority: { name: 'Medium' },
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      };

      mockAxiosInstance.post.mockResolvedValue(mockCreateResponse);
      mockAxiosInstance.get.mockResolvedValue({ data: mockIssue });

      // Act
      const result = await JiraService.createIssue(issueData);

      // Assert
      expect(result).toEqual(mockIssue);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/issue', {
        fields: {
          project: { key: 'TEST' },
          summary: 'Test Issue',
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Test description',
                  },
                ],
              },
            ],
          },
          issuetype: { id: '10001' },
          priority: { id: '3' },
          assignee: undefined,
          labels: ['test'],
          components: [],
        },
      });
    });
  });

  describe('createSaasIssue', () => {
    it('deve criar issue do SaaS com mapeamento correto', async () => {
      // Arrange
      const saasIssueData = {
        title: 'Bug no sistema',
        description: 'Descrição do bug',
        type: 'bug' as const,
        priority: 'high' as const,
        barbershopId: 'barbershop-123',
        labels: ['urgent'],
      };

      const mockCreateResponse = {
        data: { id: '10001', key: 'TEST-1' },
      };

      const mockIssue = {
        id: '10001',
        key: 'TEST-1',
        summary: 'Bug no sistema',
        status: { name: 'To Do' },
        priority: { name: 'High' },
        assignee: null,
        reporter: { displayName: 'Test User' },
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      };

      mockAxiosInstance.post.mockResolvedValue(mockCreateResponse);
      mockAxiosInstance.get.mockResolvedValue({ data: mockIssue });

      // Act
      const result = await JiraService.createSaasIssue(saasIssueData);

      // Assert
      expect(result).toEqual({
        id: '10001',
        jiraKey: 'TEST-1',
        title: 'Bug no sistema',
        description: 'Descrição do bug',
        type: 'bug',
        priority: 'high',
        status: 'To Do',
        assignee: undefined,
        reporter: 'Test User',
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
        url: 'https://test.atlassian.net/browse/TEST-1',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/issue', {
        fields: {
          project: { key: 'TEST' },
          summary: 'Bug no sistema',
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Descrição do bug',
                  },
                ],
              },
            ],
          },
          issuetype: { id: '10004' }, // bug mapping
          priority: { id: '2' }, // high mapping
          assignee: undefined,
          labels: ['urgent', 'barbershop:barbershop-123'],
          components: [],
        },
      });
    });
  });

  describe('searchIssues', () => {
    it('deve buscar issues com sucesso', async () => {
      // Arrange
      const searchRequest = {
        jql: 'project = TEST',
        startAt: 0,
        maxResults: 10,
      };

      const mockSearchResponse = {
        data: {
          expand: '',
          startAt: 0,
          maxResults: 10,
          total: 1,
          issues: [
            {
              id: '10001',
              key: 'TEST-1',
              summary: 'Test Issue',
            },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockSearchResponse);

      // Act
      const result = await JiraService.searchIssues(searchRequest);

      // Assert
      expect(result).toEqual(mockSearchResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/search', {
        params: {
          jql: 'project = TEST',
          startAt: 0,
          maxResults: 10,
          fields: '*all',
          expand: '',
        },
      });
    });
  });

  describe('transitionIssue', () => {
    it('deve executar transição com sucesso', async () => {
      // Arrange
      const issueKey = 'TEST-1';
      const transitionId = '31';

      mockAxiosInstance.post.mockResolvedValue({});

      // Act
      await JiraService.transitionIssue(issueKey, transitionId);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/issue/TEST-1/transitions', {
        transition: { id: '31' },
      });
    });
  });

  describe('addComment', () => {
    it('deve adicionar comentário com sucesso', async () => {
      // Arrange
      const issueKey = 'TEST-1';
      const commentData = { body: 'Test comment' };

      const mockComment = {
        id: '10000',
        author: { displayName: 'Test User' },
        body: 'Test comment',
        created: '2024-01-01T00:00:00.000Z',
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockComment });

      // Act
      const result = await JiraService.addComment(issueKey, commentData);

      // Assert
      expect(result).toEqual(mockComment);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/issue/TEST-1/comment', {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Test comment',
                },
              ],
            },
          ],
        },
      });
    });
  });
});
