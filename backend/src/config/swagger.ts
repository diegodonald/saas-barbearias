import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '@/config/env';

// Configuração básica do Swagger
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SaaS Barbearias API',
      version: '1.0.0',
      description: 'API completa para sistema SaaS de gerenciamento de barbearias',
      contact: {
        name: 'Diego Donald',
        email: 'diego@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: config.isDevelopment
          ? `http://localhost:${config.server.port}`
          : 'https://api.saas-barbearias.com',
        description: config.isDevelopment ? 'Servidor de Desenvolvimento' : 'Servidor de Produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticação',
        },
      },
      schemas: {
        // Schemas de Autenticação
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'usuario@exemplo.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'MinhaSenh@123',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'João Silva',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@exemplo.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'MinhaSenh@123',
            },
            phone: {
              type: 'string',
              pattern: '^\\(\\d{2}\\)\\s\\d{4,5}-\\d{4}$',
              example: '(11) 99999-9999',
            },
            role: {
              type: 'string',
              enum: ['CLIENT', 'BARBER', 'ADMIN'],
              example: 'CLIENT',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Login realizado com sucesso',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                expiresIn: {
                  type: 'number',
                  example: 3600,
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clp1234567890',
            },
            name: {
              type: 'string',
              example: 'João Silva',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@exemplo.com',
            },
            role: {
              type: 'string',
              enum: ['CLIENT', 'BARBER', 'ADMIN', 'SUPER_ADMIN'],
              example: 'CLIENT',
            },
            phone: {
              type: 'string',
              example: '(11) 99999-9999',
            },
            avatar: {
              type: 'string',
              example: 'https://example.com/avatar.jpg',
            },
            barbershopId: {
              type: 'string',
              example: 'clp0987654321',
            },
            barberId: {
              type: 'string',
              example: 'clp1122334455',
            },
          },
        },
        // Schemas do Jira
        CreateJiraIssueRequest: {
          type: 'object',
          required: ['title', 'type', 'priority', 'barbershopId'],
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              example: 'Bug no sistema de agendamento',
            },
            description: {
              type: 'string',
              example: 'Descrição detalhada do problema encontrado',
            },
            type: {
              type: 'string',
              enum: ['bug', 'feature', 'task', 'support'],
              example: 'bug',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              example: 'high',
            },
            barbershopId: {
              type: 'string',
              example: 'clp0987654321',
            },
            assigneeEmail: {
              type: 'string',
              format: 'email',
              example: 'dev@exemplo.com',
            },
            labels: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['urgent', 'frontend'],
            },
          },
        },
        JiraIssueResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Issue criada com sucesso',
            },
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '10001',
                },
                jiraKey: {
                  type: 'string',
                  example: 'SAAS-123',
                },
                title: {
                  type: 'string',
                  example: 'Bug no sistema de agendamento',
                },
                description: {
                  type: 'string',
                  example: 'Descrição detalhada do problema',
                },
                type: {
                  type: 'string',
                  example: 'bug',
                },
                priority: {
                  type: 'string',
                  example: 'high',
                },
                status: {
                  type: 'string',
                  example: 'To Do',
                },
                assignee: {
                  type: 'string',
                  example: 'João Desenvolvedor',
                },
                reporter: {
                  type: 'string',
                  example: 'Maria Cliente',
                },
                created: {
                  type: 'string',
                  format: 'date-time',
                  example: '2024-01-01T00:00:00.000Z',
                },
                updated: {
                  type: 'string',
                  format: 'date-time',
                  example: '2024-01-01T00:00:00.000Z',
                },
                url: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://company.atlassian.net/browse/SAAS-123',
                },
              },
            },
          },
        },
        // Schemas de Erro
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Erro na operação',
            },
            error: {
              type: 'string',
              example: 'VALIDATION_ERROR',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Email é obrigatório',
                  },
                  code: {
                    type: 'string',
                    example: 'required',
                  },
                },
              },
            },
          },
        },
        // Schema de Health Check
        HealthCheckResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
              example: 'healthy',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
            uptime: {
              type: 'number',
              example: 3600,
            },
            version: {
              type: 'string',
              example: '1.0.0',
            },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'string',
                  enum: ['connected', 'disconnected'],
                  example: 'connected',
                },
              },
            },
            memory: {
              type: 'object',
              properties: {
                used: {
                  type: 'number',
                  example: 50.5,
                },
                total: {
                  type: 'number',
                  example: 100.0,
                },
                percentage: {
                  type: 'number',
                  example: 50.5,
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const specs = swaggerJsdoc(options);
