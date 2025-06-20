/**
 * Rotas para gerenciamento de cache
 */

import { Router } from 'express';
import { CacheController } from '@/controllers/cache.controller';
import { authenticate, requireRole } from '@/middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Obter estatísticas do cache
 *     description: Retorna estatísticas detalhadas do sistema de cache Redis
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
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
 *                   example: "Estatísticas do cache obtidas com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     hits:
 *                       type: integer
 *                       example: 150
 *                     misses:
 *                       type: integer
 *                       example: 25
 *                     sets:
 *                       type: integer
 *                       example: 100
 *                     deletes:
 *                       type: integer
 *                       example: 10
 *                     errors:
 *                       type: integer
 *                       example: 2
 *                     hitRate:
 *                       type: string
 *                       example: "85.71%"
 *                     redis:
 *                       type: object
 *                       properties:
 *                         health:
 *                           type: object
 *                         info:
 *                           type: object
 *       401:
 *         description: Token de autenticação inválido
 *       403:
 *         description: Acesso negado - apenas admins
 */
router.get(
  '/stats',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  CacheController.getStats
);

/**
 * @swagger
 * /api/cache/clear/pattern:
 *   post:
 *     summary: Limpar cache por padrão
 *     description: Remove todas as chaves do cache que correspondem ao padrão especificado
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pattern
 *             properties:
 *               pattern:
 *                 type: string
 *                 example: "user:*"
 *                 description: Padrão para buscar chaves (suporta wildcards)
 *     responses:
 *       200:
 *         description: Cache limpo com sucesso
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
 *                   example: "Cache limpo com sucesso. 15 chaves removidas."
 *                 data:
 *                   type: object
 *                   properties:
 *                     pattern:
 *                       type: string
 *                       example: "user:*"
 *                     deletedCount:
 *                       type: integer
 *                       example: 15
 *       400:
 *         description: Padrão não fornecido
 *       401:
 *         description: Token de autenticação inválido
 *       403:
 *         description: Acesso negado - apenas super admins
 */
router.post(
  '/clear/pattern',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  CacheController.clearByPattern
);

/**
 * @swagger
 * /api/cache/clear/all:
 *   post:
 *     summary: Limpar todo o cache
 *     description: Remove todas as chaves do cache (operação perigosa)
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache limpo com sucesso
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
 *                   example: "Todo o cache foi limpo com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cleared:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Token de autenticação inválido
 *       403:
 *         description: Acesso negado - apenas super admins
 */
router.post(
  '/clear/all',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  CacheController.clearAll
);

/**
 * @swagger
 * /api/cache/key/{key}:
 *   get:
 *     summary: Obter valor do cache
 *     description: Obtém o valor armazenado no cache para uma chave específica
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave do cache
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *         description: Prefixo da chave
 *     responses:
 *       200:
 *         description: Valor obtido com sucesso
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
 *                     key:
 *                       type: string
 *                     value:
 *                       type: object
 *                     exists:
 *                       type: boolean
 *                     ttl:
 *                       type: integer
 *   put:
 *     summary: Definir valor no cache
 *     description: Define um valor no cache para uma chave específica
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave do cache
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: object
 *                 description: Valor a ser armazenado
 *               ttl:
 *                 type: integer
 *                 description: Tempo de vida em segundos
 *               prefix:
 *                 type: string
 *                 description: Prefixo da chave
 *     responses:
 *       200:
 *         description: Valor definido com sucesso
 *   delete:
 *     summary: Deletar valor do cache
 *     description: Remove um valor do cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave do cache
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *         description: Prefixo da chave
 *     responses:
 *       200:
 *         description: Valor removido com sucesso
 */
router.get(
  '/key/:key',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  CacheController.getValue
);

router.put(
  '/key/:key',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  CacheController.setValue
);

router.delete(
  '/key/:key',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  CacheController.deleteValue
);

/**
 * @swagger
 * /api/cache/stats/reset:
 *   post:
 *     summary: Resetar estatísticas do cache
 *     description: Zera todas as estatísticas de uso do cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas resetadas com sucesso
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
 *                   example: "Estatísticas do cache resetadas com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reset:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Token de autenticação inválido
 *       403:
 *         description: Acesso negado - apenas super admins
 */
router.post(
  '/stats/reset',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  CacheController.resetStats
);

export default router;
