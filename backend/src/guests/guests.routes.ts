import { Router } from 'express'
import { z } from 'zod'

import type { DB } from '../db.ts'
import { HttpError } from '../shared/http-error.ts'

const guestSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
})

interface GuestRow {
  id: number
  full_name: string
  email: string | null
  phone: string | null
}

function toResponse(row: GuestRow) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
  }
}

export function buildGuestsRouter(db: DB): Router {
  const router = Router()

  router.get('/', (_req, res) => {
    const rows = db.prepare('SELECT * FROM guests ORDER BY full_name').all() as GuestRow[]
    res.json(rows.map(toResponse))
  })

  router.post('/', (req, res, next) => {
    try {
      const input = guestSchema.parse(req.body)
      const result = db
        .prepare('INSERT INTO guests (full_name, email, phone) VALUES (?, ?, ?)')
        .run(input.fullName, input.email ?? null, input.phone ?? null)
      const row = db
        .prepare('SELECT * FROM guests WHERE id = ?')
        .get(Number(result.lastInsertRowid)) as GuestRow
      res.status(201).json(toResponse(row))
    } catch (err) {
      next(err)
    }
  })

  router.delete('/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const result = db.prepare('DELETE FROM guests WHERE id = ?').run(id)
      if (result.changes === 0) {
        throw new HttpError(404, `guest not found: ${id}`)
      }
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  })

  return router
}
