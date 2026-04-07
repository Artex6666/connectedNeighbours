import { signToken, verifyToken, JwtPayload } from './jwt.utils';

const payload: JwtPayload = { id: 'abc123', email: 'test@test.com', role: 'resident' };

describe('jwt.utils', () => {
  describe('signToken', () => {
    it('retourne une string non vide', () => {
      const token = signToken(payload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('génère des tokens différents pour des payloads différents', () => {
      const other: JwtPayload = { id: 'xyz', email: 'other@test.com', role: 'admin' };
      expect(signToken(payload)).not.toBe(signToken(other));
    });
  });

  describe('verifyToken', () => {
    it('retourne le payload original', () => {
      const token = signToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('lève une erreur si le token est invalide', () => {
      expect(() => verifyToken('token.invalide.ici')).toThrow();
    });

    it('lève une erreur si le token est altéré', () => {
      const token = signToken(payload);
      expect(() => verifyToken(token + 'x')).toThrow();
    });
  });
});
