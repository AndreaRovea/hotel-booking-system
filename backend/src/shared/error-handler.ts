import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

import { AuthError } from '../auth/auth.service.ts'
import { HttpError } from './http-error.ts'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'validation_failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    })
    return
  }
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  console.error('[unhandled]', err)
  res.status(500).json({ error: 'internal_server_error' })
}
