import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const ISSUER = process.env.MFA_ISSUER ?? 'BobConnect';

/**
 * Génère un nouveau secret TOTP pour activer la double authentification.
 * @param email Email de l'utilisateur, affiché comme libellé dans l'application d'authentification
 * @returns L'objet secret speakeasy (base32 à stocker + otpauth_url pour le QR code)
 */
export function generateTotpSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `${ISSUER} (${email})`,
    issuer: ISSUER,
  });
  return secret;
}

/**
 * Transforme une URL otpauth:// en QR code scannable.
 * @param otpauthUrl URL otpauth fournie par generateTotpSecret
 * @returns Le QR code encodé en data URL (image PNG en base64)
 */
export async function generateQrCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

/**
 * Vérifie un code TOTP contre le secret de l'utilisateur.
 * @param secret Secret base32 stocké sur le compte
 * @param token Code à 6 chiffres saisi par l'utilisateur
 * @returns true si le code est valide (tolérance d'une fenêtre de ±30s)
 */
export function verifyTotpCode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });
}
