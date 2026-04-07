import { Request, Response, NextFunction } from 'express';
import { requireRole } from './role.middleware';

function mockReq(role?: string): Partial<Request> {
  return { user: role ? { _id: 'u1' as never, email: 'a@a.com', role: role as never } : undefined };
}

function mockRes(): jest.Mocked<Partial<Response>> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as jest.Mocked<Partial<Response>>;
}

const next: NextFunction = jest.fn();

describe('requireRole', () => {
  beforeEach(() => jest.clearAllMocks());

  it('appelle next() si le rôle correspond', () => {
    const middleware = requireRole('admin');
    const res = mockRes();
    middleware(mockReq('admin') as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('appelle next() si l\'un des rôles autorisés correspond', () => {
    const middleware = requireRole('admin', 'moderator');
    const res = mockRes();
    middleware(mockReq('moderator') as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('renvoie 403 si le rôle ne correspond pas', () => {
    const middleware = requireRole('admin');
    const res = mockRes();
    middleware(mockReq('resident') as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('renvoie 401 si req.user est absent', () => {
    const middleware = requireRole('admin');
    const res = mockRes();
    middleware(mockReq() as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
