import { generateTotpSecret, verifyTotpCode } from './totp.utils';
import speakeasy from 'speakeasy';

describe('totp.utils', () => {
  describe('generateTotpSecret', () => {
    it('retourne un secret avec base32 et otpauth_url', () => {
      const secret = generateTotpSecret('user@test.com');
      expect(secret.base32).toBeDefined();
      expect(secret.otpauth_url).toBeDefined();
    });

    it('intègre l\'email dans le nom', () => {
      const secret = generateTotpSecret('alice@test.com');
      expect(secret.otpauth_url).toContain('alice%40test.com');
    });
  });

  describe('verifyTotpCode', () => {
    it('valide un code TOTP correct', () => {
      const secret = generateTotpSecret('user@test.com');
      const code = speakeasy.totp({ secret: secret.base32!, encoding: 'base32' });
      expect(verifyTotpCode(secret.base32!, code)).toBe(true);
    });

    it('rejette un code TOTP incorrect', () => {
      const secret = generateTotpSecret('user@test.com');
      expect(verifyTotpCode(secret.base32!, '000000')).toBe(false);
    });
  });
});
