import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { mfaMiddleware } from '../middlewares/mfa.middleware';


const router: Router = Router();

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
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Returns accessToken + refreshToken
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Get a new access token using a refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Returns a new accessToken
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout (invalidate refresh token)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices (requires authentication)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Logged out from all devices
 */
router.post('/logout-all', authMiddleware, authController.logoutAll);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Vérifie un compte via le code reçu par email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string, example: '482913' }
 *     responses:
 *       200: { description: Compte vérifié }
 *       400: { description: Code invalide ou expiré }
 *       404: { description: Utilisateur introuvable }
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Renvoie un code de vérification par email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Email renvoyé (réponse neutre) }
 */
router.post('/resend-verification', authController.resendVerification);

/**
 * @swagger
 * /auth/mfa/setup:
 *   post:
 *     summary: Démarre l'activation de la 2FA (renvoie un QR code à scanner)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: QR code (data URL) + secret base32 pour saisie manuelle
 *       400:
 *         description: 2FA déjà activée
 */
router.post('/mfa/setup', authMiddleware, authController.setupMfa);

/**
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     summary: Confirme et active la 2FA avec un code TOTP
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [totpCode]
 *             properties:
 *               totpCode: { type: string, example: '123456' }
 *     responses:
 *       200: { description: 2FA activée }
 *       403: { description: Code invalide ou MFA non initialisée }
 */
router.post('/mfa/verify', authMiddleware, mfaMiddleware, authController.confirmMfa);

/**
 * @swagger
 * /auth/mfa/disable:
 *   post:
 *     summary: Désactive la 2FA (nécessite un code TOTP valide)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [totpCode]
 *             properties:
 *               totpCode: { type: string }
 *     responses:
 *       200: { description: 2FA désactivée }
 *       403: { description: Code invalide }
 */
router.post('/mfa/disable', authMiddleware, mfaMiddleware, authController.disableMfa);


router.post('/sso/code', authMiddleware, authController.createSsoCode);
router.post('/sso/exchange', authController.ssoExchange);

export default router;
