import { Router } from 'express';
import { JiraController } from '@/controllers/jira.controller';
import { authenticate, requireRole } from '@/middleware/auth';
import { validateBody } from '@/middleware/validation';
import { z } from 'zod';

const router = Router();

// Schemas de validação
const createIssueSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['bug', 'feature', 'task', 'support'], {
    errorMap: () => ({ message: 'Tipo deve ser: bug, feature, task ou support' }),
  }),
  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: 'Prioridade deve ser: low, medium, high ou critical' }),
  }),
  barbershopId: z.string().min(1, 'ID da barbearia é obrigatório'),
  assigneeEmail: z.string().email().optional(),
  labels: z.array(z.string()).optional(),
});

const updateIssueSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
  labels: z.array(z.string()).optional(),
  components: z.array(z.string()).optional(),
});

const transitionIssueSchema = z.object({
  transitionId: z.string().min(1, 'ID da transição é obrigatório'),
});

const addCommentSchema = z.object({
  body: z.string().min(1, 'Corpo do comentário é obrigatório'),
});

/**
 * @route   GET /api/jira/test
 * @desc    Testar conexão com Jira
 * @access  Private (Admin+)
 */
router.get(
  '/test',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  JiraController.testConnection
);

/**
 * @route   GET /api/jira/project/:projectKey?
 * @desc    Obter informações do projeto
 * @access  Private (Admin+)
 */
router.get(
  '/project/:projectKey?',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  JiraController.getProject
);

/**
 * @swagger
 * /api/jira/issues:
 *   post:
 *     summary: Criar nova issue no Jira
 *     description: Cria uma nova issue no Jira com mapeamento automático de tipos
 *     tags: [Jira]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJiraIssueRequest'
 *     responses:
 *       201:
 *         description: Issue criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JiraIssueResponse'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token de autenticação inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/issues',
  authenticate,
  validateBody(createIssueSchema),
  JiraController.createIssue as any
);

/**
 * @route   GET /api/jira/issues/:issueKey
 * @desc    Obter issue por chave
 * @access  Private
 */
router.get('/issues/:issueKey', authenticate, JiraController.getIssue);

/**
 * @route   PUT /api/jira/issues/:issueKey
 * @desc    Atualizar issue
 * @access  Private
 */
router.put(
  '/issues/:issueKey',
  authenticate,
  validateBody(updateIssueSchema),
  JiraController.updateIssue as any
);

/**
 * @route   GET /api/jira/search
 * @desc    Buscar issues
 * @access  Private
 * @query   jql, startAt, maxResults, fields, expand
 */
router.get('/search', authenticate, JiraController.searchIssues);

/**
 * @route   GET /api/jira/issues/:issueKey/transitions
 * @desc    Obter transições disponíveis para uma issue
 * @access  Private
 */
router.get('/issues/:issueKey/transitions', authenticate, JiraController.getTransitions);

/**
 * @route   POST /api/jira/issues/:issueKey/transitions
 * @desc    Executar transição de status
 * @access  Private
 */
router.post(
  '/issues/:issueKey/transitions',
  authenticate,
  validateBody(transitionIssueSchema),
  JiraController.transitionIssue as any
);

/**
 * @route   POST /api/jira/issues/:issueKey/comments
 * @desc    Adicionar comentário à issue
 * @access  Private
 */
router.post(
  '/issues/:issueKey/comments',
  authenticate,
  validateBody(addCommentSchema),
  JiraController.addComment as any
);

export default router;
