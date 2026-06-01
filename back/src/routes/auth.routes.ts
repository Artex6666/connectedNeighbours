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
 *     summary: Verify account by email code
 *     tags: [Auth]
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /auth/mfa/setup:
 *   post:
 *     summary: Initialize TOTP MFA (returns QR code)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/mfa/setup', authMiddleware, authController.setupMfa);

/**
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     summary: Verify and activate MFA
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/mfa/verify', authMiddleware, mfaMiddleware, authController.confirmMfa);

export default router;
