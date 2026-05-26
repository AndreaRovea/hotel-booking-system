import cors from 'cors'
import express, { type Express } from 'express'

import { authMiddleware, buildAuthRouter } from './auth/auth.routes.ts'
import { AuthService } from './auth/auth.service.ts'
import { buildBookingsRouter } from './bookings/bookings.routes.ts'
import type { AppConfig } from './config.ts'
import type { DB } from './db.ts'
import { buildGuestsRouter } from './guests/guests.routes.ts'
import { buildRoomsRouter } from './rooms/rooms.routes.ts'
import { errorHandler } from './shared/error-handler.ts'

export function buildApp(db: DB, config: AppConfig): Express {
  const app = express()
  app.use(cors())
  app.use(express.json())

  const authService = new AuthService(db, config)

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', buildAuthRouter(authService))

  const auth = authMiddleware(authService)
  app.use('/api/rooms', auth, buildRoomsRouter(db))
  app.use('/api/guests', auth, buildGuestsRouter(db))
  app.use('/api/bookings', auth, buildBookingsRouter(db))

  app.use(errorHandler)
  return app
}
