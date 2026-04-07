import { success, error } from './response.utils';
import { Response } from 'express';

function mockRes(): jest.Mocked<Partial<Response>> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as jest.Mocked<Partial<Response>>;
}

describe('response.utils', () => {
  describe('success', () => {
    it('répond avec 200 par défaut et success: true', () => {
      const res = mockRes();
      success(res as Response, { foo: 'bar' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { foo: 'bar' } });
    });

    it('utilise le statusCode fourni', () => {
      const res = mockRes();
      success(res as Response, null, 201);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('error', () => {
    it('répond avec 400 par défaut et success: false', () => {
      const res = mockRes();
      error(res as Response, 'Quelque chose a raté');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Quelque chose a raté' });
    });

    it('utilise le statusCode fourni', () => {
      const res = mockRes();
      error(res as Response, 'Non autorisé', 401);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
