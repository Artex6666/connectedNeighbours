import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { mfaMiddleware } from '../middlewares/mfa.middleware';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel habitant
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, phone, address]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: Compte créé, e-mail de confirmation envoyé
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion (email + mot de passe)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token JWT retourné
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Validation du compte par code e-mail
 *     tags: [Auth]
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /auth/mfa/setup:
 *   post:
 *     summary: Initialiser le MFA TOTP (retourne QR code)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/mfa/setup', authMiddleware, authController.setupMfa);

/**
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     summary: Vérifier et activer le MFA
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/mfa/verify', authMiddleware, mfaMiddleware, authController.confirmMfa);

export default router;
