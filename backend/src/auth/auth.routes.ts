import { Router } from 'express'
import { z } from 'zod'

import { AuthError, type AuthService } from './auth.service.ts'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
})

export function buildAuthRouter(authService: AuthService): Router {
  const router = Router()

  router.post('/register', async (req, res, next) => {
    try {
      const input = credentialsSchema.parse(req.body)
      const user = await authService.register(input)
      res.status(201).json(user)
    } catch (err) {
      next(err)
    }
  })

  router.post('/login', async (req, res, next) => {
    try {
      const input = credentialsSchema.parse(req.body)
      const result = await authService.login(input)
      res.json(result)
    } catch (err) {
      next(err)
    }
  })

  return router
}

export function authMiddleware(authService: AuthService) {
  return (req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return next(new AuthError('missing bearer token', 401))
    }
    try {
      const user = authService.verify(header.slice('Bearer '.length))
      ;(req as { user?: { id: number; email: string } }).user = user
      next()
    } catch (err) {
      next(err)
    }
  }
}
