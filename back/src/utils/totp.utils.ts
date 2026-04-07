import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const ISSUER = process.env.MFA_ISSUER ?? 'BobConnect';

export function generateTotpSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `${ISSUER} (${email})`,
    issuer: ISSUER,
  });
  return secret;
}

export async function generateQrCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyTotpCode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });
}
