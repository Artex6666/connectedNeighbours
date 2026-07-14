import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { success, error } from '../utils/response.utils'
import { parseMongoDsl } from './mongoDsl.parser'

export async function executeMongoDsl(req: Request, res: Response) {
  try {
    const { query } = req.body as { query?: string }

    if (!query) {
      return error(res, 'query est requis', 400)
    }

    const ast = parseMongoDsl(query)

    const db = mongoose.connection.db
    if (!db) {
      return error(res, 'Connexion MongoDB indisponible', 500)
    }

    const projection =
      ast.collection === 'users'
        ? {
            password: 0,
            mfaSecret: 0,
            emailVerificationCode: 0,
            emailVerificationExpires: 0,
          }
        : {};

    const results = await db
      .collection(ast.collection)
      .find(ast.filter, { projection })
      .limit(50)
      .toArray();
    return success(res, {
      ast,
      count: results.length,
      results,
    })
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Erreur DSL',
      400
    )
  }
}