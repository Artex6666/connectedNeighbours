import { Request, Response, NextFunction } from 'express';
import { errorMiddleware } from './error.middleware';

function mockRes(): jest.Mocked<Partial<Response>> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as jest.Mocked<Partial<Response>>;
}

describe('errorMiddleware', () => {
  const next: NextFunction = jest.fn();

  it('renvoie 500 avec success: false', () => {
    const err = new Error('Erreur inattendue');
    const res = mockRes();

    errorMiddleware(err, {} as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Erreur inattendue' }),
    );
  });

  it('inclut le stack en mode development', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('Erreur dev');
    const res = mockRes();

    errorMiddleware(err, {} as Request, res as Response, next);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.stack).toBeDefined();
    process.env.NODE_ENV = 'test';
  });

  it('n\'inclut pas le stack en production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Erreur prod');
    const res = mockRes();

    errorMiddleware(err, {} as Request, res as Response, next);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.stack).toBeUndefined();
    process.env.NODE_ENV = 'test';
  });
});
