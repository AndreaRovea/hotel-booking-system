import { Router } from 'express'
import { z } from 'zod'

import type { DB } from '../db.ts'
import { HttpError } from '../shared/http-error.ts'

const roomSchema = z.object({
  number: z.string().min(1).max(20),
  type: z.string().min(1).max(50),
  capacity: z.number().int().min(1).max(20),
  dailyRate: z.number().nonnegative(),
})

interface RoomRow {
  id: number
  number: string
  type: string
  capacity: number
  daily_rate: number
}

function toResponse(row: RoomRow) {
  return {
    id: row.id,
    number: row.number,
    type: row.type,
    capacity: row.capacity,
    dailyRate: row.daily_rate,
  }
}

export function buildRoomsRouter(db: DB): Router {
  const router = Router()

  router.get('/', (_req, res) => {
    const rows = db.prepare('SELECT * FROM rooms ORDER BY number').all() as RoomRow[]
    res.json(rows.map(toResponse))
  })

  router.post('/', (req, res, next) => {
    try {
      const input = roomSchema.parse(req.body)
      const result = db
        .prepare(
          'INSERT INTO rooms (number, type, capacity, daily_rate) VALUES (?, ?, ?, ?)',
        )
        .run(input.number, input.type, input.capacity, input.dailyRate)
      const row = db
        .prepare('SELECT * FROM rooms WHERE id = ?')
        .get(Number(result.lastInsertRowid)) as RoomRow
      res.status(201).json(toResponse(row))
    } catch (err) {
      if (err instanceof Error && err.message.includes('UNIQUE')) {
        next(new HttpError(409, 'room number already exists'))
      } else {
        next(err)
      }
    }
  })

  router.delete('/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const result = db.prepare('DELETE FROM rooms WHERE id = ?').run(id)
      if (result.changes === 0) {
        throw new HttpError(404, `room not found: ${id}`)
      }
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  })

  return router
}
