import { Router } from 'express'
import { z } from 'zod'

import type { DB } from '../db.ts'
import { HttpError } from '../shared/http-error.ts'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected ISO date YYYY-MM-DD')

const bookingSchema = z
  .object({
    roomId: z.number().int().positive(),
    guestId: z.number().int().positive(),
    checkIn: isoDate,
    checkOut: isoDate,
  })
  .refine((b) => b.checkOut > b.checkIn, {
    message: 'checkOut must be strictly after checkIn',
    path: ['checkOut'],
  })

interface BookingRow {
  id: number
  room_id: number
  guest_id: number
  check_in: string
  check_out: string
  status: string
}

function toResponse(row: BookingRow) {
  return {
    id: row.id,
    roomId: row.room_id,
    guestId: row.guest_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
  }
}

/**
 * Two intervals [a_in, a_out) and [b_in, b_out) overlap iff
 *   a_in < b_out AND b_in < a_out.
 * This is the standard half-open interval overlap check.
 */
function hasOverlap(
  db: DB,
  roomId: number,
  checkIn: string,
  checkOut: string,
): boolean {
  const row = db
    .prepare(
      `SELECT 1 FROM bookings
       WHERE room_id = ?
         AND status = 'CONFIRMED'
         AND check_in < ?
         AND check_out > ?
       LIMIT 1`,
    )
    .get(roomId, checkOut, checkIn)
  return row !== undefined
}

export function buildBookingsRouter(db: DB): Router {
  const router = Router()

  router.get('/', (_req, res) => {
    const rows = db
      .prepare('SELECT * FROM bookings ORDER BY check_in DESC')
      .all() as BookingRow[]
    res.json(rows.map(toResponse))
  })

  router.post('/', (req, res, next) => {
    try {
      const input = bookingSchema.parse(req.body)

      const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(input.roomId)
      if (!room) throw new HttpError(404, `room not found: ${input.roomId}`)
      const guest = db.prepare('SELECT id FROM guests WHERE id = ?').get(input.guestId)
      if (!guest) throw new HttpError(404, `guest not found: ${input.guestId}`)

      if (hasOverlap(db, input.roomId, input.checkIn, input.checkOut)) {
        throw new HttpError(409, 'room is not available in the requested date range')
      }

      const result = db
        .prepare(
          `INSERT INTO bookings (room_id, guest_id, check_in, check_out)
           VALUES (?, ?, ?, ?)`,
        )
        .run(input.roomId, input.guestId, input.checkIn, input.checkOut)

      const row = db
        .prepare('SELECT * FROM bookings WHERE id = ?')
        .get(Number(result.lastInsertRowid)) as BookingRow
      res.status(201).json(toResponse(row))
    } catch (err) {
      next(err)
    }
  })

  router.delete('/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(id)
      if (result.changes === 0) {
        throw new HttpError(404, `booking not found: ${id}`)
      }
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  })

  return router
}
