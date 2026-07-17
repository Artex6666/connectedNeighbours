import { Router } from 'express';
import * as votesController from '../controllers/votes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Votes
 *   description: Votes & sondages de quartier (4 types) + commentaires. Tout habitant peut créer.
 */

/**
 * @swagger
 * /votes:
 *   get:
 *     summary: Liste les votes du quartier (avec mon statut de participation)
 *     tags: [Votes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Liste des votes }
 */
router.get('/', votesController.listVotes);

/**
 * @swagger
 * /votes/{id}:
 *   get:
 *     summary: Détail d'un vote
 *     tags: [Votes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Vote }
 *       404: { description: Introuvable }
 */
router.get('/:id', votesController.getVote);

/**
 * @swagger
 * /votes:
 *   post:
 *     summary: Crée un vote (ouvert à tout habitant)
 *     tags: [Votes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, type]
 *             properties:
 *               question: { type: string }
 *               type: { type: string, enum: [yesno, single, multiple, weighted] }
 *               options: { type: array, items: { type: string }, description: "Requis sauf yesno (2 min)" }
 *               isAnonymous: { type: boolean }
 *               openAt: { type: string, format: date-time }
 *               closeAt: { type: string, format: date-time }
 *               quorum: { type: integer }
 *               showResultsLive: { type: boolean }
 *     responses:
 *       201: { description: Vote créé }
 *       400: { description: Données invalides }
 *       403: { description: Aucun quartier rattaché }
 */
router.post('/', votesController.createVote);

/**
 * @swagger
 * /votes/{id}/cast:
 *   post:
 *     summary: Voter (un seul vote par personne)
 *     description: "yesno/single → choice (index) · multiple → choices[] · weighted → weights[] (somme = 10)"
 *     tags: [Votes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               choice: { type: integer }
 *               choices: { type: array, items: { type: integer } }
 *               weights: { type: array, items: { type: integer } }
 *     responses:
 *       200: { description: Vote enregistré }
 *       400: { description: Déjà voté / clôturé / choix invalide }
 */
router.post('/:id/cast', votesController.castVote);

/**
 * @swagger
 * /votes/comments/{commentId}:
 *   delete:
 *     summary: Supprime un commentaire (auteur ou modérateur/admin)
 *     tags: [Votes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Supprimé }
 *       403: { description: Non autorisé }
 */
router.delete('/comments/:commentId', votesController.deleteComment);

/**
 * @swagger
 * /votes/{id}/comments:
 *   get:
 *     summary: Liste les commentaires d'un vote
 *     tags: [Votes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Commentaires (avec auteur + rôle) }
 *   post:
 *     summary: Ajoute un commentaire à un vote
 *     tags: [Votes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       201: { description: Commentaire ajouté }
 *       400: { description: Commentaire vide }
 */
router.get('/:id/comments', votesController.listComments);
router.post('/:id/comments', votesController.addComment);

/**
 * @swagger
 * /votes/{id}:
 *   delete:
 *     summary: Supprime un vote (auteur ou modérateur/admin)
 *     tags: [Votes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Supprimé }
 *       403: { description: Non autorisé }
 */
router.delete('/:id', votesController.deleteVote);

export default router;
