import { Router } from 'express';
import * as documentsController from '../controllers/documents.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { mfaMiddleware } from '../middlewares/mfa.middleware';
import { documentUpload } from '../middlewares/upload.middleware';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Documents PDF — import, zones de signature, signature (MFA) et archivage
 */

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: Mes documents (importés ou à signer)
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Liste des documents }
 */
router.get('/', documentsController.listDocuments);

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     summary: Détail d'un document (importateur ou signataire)
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Document }
 *       403: { description: Accès refusé }
 *       404: { description: Introuvable }
 */
router.get('/:id', documentsController.getDocument);

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Importer un document PDF (multipart, champ "file")
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               title: { type: string }
 *     responses:
 *       201: { description: Document importé (hash sha256 calculé) }
 *       400: { description: Aucun PDF reçu }
 *       403: { description: Aucun quartier rattaché }
 */
router.post('/', documentUpload.single('file'), documentsController.uploadDocument);

/**
 * @swagger
 * /documents/{id}/zones:
 *   put:
 *     summary: Définir les zones de signature (importateur, brouillon)
 *     tags: [Documents]
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
 *             properties:
 *               zones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     signerId: { type: string }
 *                     page: { type: integer }
 *                     x: { type: number }
 *                     y: { type: number }
 *                     width: { type: number }
 *                     height: { type: number }
 *                     type: { type: string, enum: [signature, initials] }
 *     responses:
 *       200: { description: Zones enregistrées }
 *       403: { description: Réservé à l'importateur }
 */
router.put('/:id/zones', documentsController.setZones);

/**
 * @swagger
 * /documents/{id}/send:
 *   post:
 *     summary: Désigner les signataires et envoyer pour signature
 *     tags: [Documents]
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
 *             required: [signatories]
 *             properties:
 *               signatories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId: { type: string }
 *                     order: { type: integer }
 *     responses:
 *       200: { description: Document en attente de signatures }
 *       400: { description: Aucun signataire }
 */
router.post('/:id/send', documentsController.sendForSignature);

/**
 * @swagger
 * /documents/{id}/sign:
 *   post:
 *     summary: Signer le document (MFA obligatoire, respecte l'ordre)
 *     tags: [Documents]
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
 *             required: [signature, totpCode]
 *             properties:
 *               signature: { type: string, description: "Nom complet apposé" }
 *               totpCode: { type: string, description: "Code 2FA" }
 *     responses:
 *       200: { description: Signé (document verrouillé si tous ont signé) }
 *       400: { description: Pas votre tour / déjà signé / signature manquante }
 *       403: { description: Non signataire ou MFA invalide }
 */
router.post('/:id/sign', mfaMiddleware, documentsController.signDocument);

/**
 * @swagger
 * /documents/{id}/verify:
 *   get:
 *     summary: Vérifier l'intégrité (recalcule le hash et compare)
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Résultat : integrity = ok | altered | missing + chaîne de signatures" }
 */
router.get('/:id/verify', documentsController.verifyDocument);

export default router;
