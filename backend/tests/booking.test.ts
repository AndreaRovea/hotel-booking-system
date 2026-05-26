import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { buildApp } from '../src/app.ts'
import { openDatabase } from '../src/db.ts'

const config = {
  port: 0,
  databasePath: ':memory:',
  jwtSecret: 'test-secret',
  jwtExpiresIn: '1h',
}

function freshApp() {
  const db = openDatabase(config)
  return { app: buildApp(db, config), db }
}

async function registerAndLogin(app: ReturnType<typeof freshApp>['app']) {
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin@example.com', password: 'password123' })
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'password123' })
  return login.body.token as string
}

describe('auth', () => {
  it('registers and logs in a user, returning a JWT', async () => {
    const { app } = freshApp()
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@example.com', password: 'password123' })
    expect(reg.status).toBe(201)

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'password123' })
    expect(login.status).toBe(200)
    expect(login.body.token).toBeTypeOf('string')
  })

  it('rejects login with wrong password', async () => {
    const { app } = freshApp()
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'b@example.com', password: 'password123' })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'b@example.com', password: 'wrong-one' })
    expect(res.status).toBe(401)
  })

  it('refuses protected route without bearer token', async () => {
    const { app } = freshApp()
    const res = await request(app).get('/api/rooms')
    expect(res.status).toBe(401)
  })
})

describe('booking availability', () => {
  let app: ReturnType<typeof freshApp>['app']
  let token: string
  let roomId: number
  let guestId: number

  beforeEach(async () => {
    ;({ app } = freshApp())
    token = await registerAndLogin(app)

    const room = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ number: '101', type: 'double', capacity: 2, dailyRate: 120 })
    roomId = room.body.id

    const guest = await request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Mario Rossi', email: 'mario@example.com' })
    guestId = guest.body.id
  })

  it('creates a booking when the date range is free', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId, guestId, checkIn: '2026-07-01', checkOut: '2026-07-05' })
    expect(res.status).toBe(201)
    expect(res.body.checkIn).toBe('2026-07-01')
  })

  it('rejects an overlapping booking with 409', async () => {
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId, guestId, checkIn: '2026-07-01', checkOut: '2026-07-05' })

    const conflict = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId, guestId, checkIn: '2026-07-03', checkOut: '2026-07-08' })
    expect(conflict.status).toBe(409)
  })

  it('allows adjacent bookings (checkout == checkin)', async () => {
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId, guestId, checkIn: '2026-07-01', checkOut: '2026-07-05' })

    const adjacent = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId, guestId, checkIn: '2026-07-05', checkOut: '2026-07-08' })
    expect(adjacent.status).toBe(201)
  })

  it('rejects checkOut <= checkIn with 400', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId, guestId, checkIn: '2026-07-05', checkOut: '2026-07-05' })
    expect(res.status).toBe(400)
  })
})
