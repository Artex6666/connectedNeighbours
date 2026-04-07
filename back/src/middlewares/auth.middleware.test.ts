import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth.middleware';
import { signToken } from '../utils/jwt.utils';

function mockReq(authHeader?: string): Partial<Request> {
  return { headers: { authorization: authHeader } };
}

function mockRes(): jest.Mocked<Partial<Response>> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as jest.Mocked<Partial<Response>>;
}

const next: NextFunction = jest.fn();

describe('authMiddleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('appelle next() avec un token valide', () => {
    const token = signToken({ id: 'u1', email: 'a@a.com', role: 'resident' });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as Request).user).toBeDefined();
    expect((req as Request).user?.email).toBe('a@a.com');
  });

  it('renvoie 401 si pas de header Authorization', () => {
    const res = mockRes();
    authMiddleware(mockReq() as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('renvoie 401 si token invalide', () => {
    const res = mockRes();
    authMiddleware(mockReq('Bearer token.faux') as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('renvoie 401 si le header n\'est pas Bearer', () => {
    const res = mockRes();
    authMiddleware(mockReq('Basic abc123') as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
