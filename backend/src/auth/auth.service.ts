import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import type { AppConfig } from '../config.ts'
import type { DB } from '../db.ts'

export interface User {
  id: number
  email: string
}

export interface RegisterInput {
  email: string
  password: string
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
  }
}

export class AuthService {
  constructor(
    private readonly db: DB,
    private readonly config: Pick<AppConfig, 'jwtSecret' | 'jwtExpiresIn'>,
  ) {}

  async register(input: RegisterInput): Promise<User> {
    const existing = this.db.prepare('SELECT id FROM users WHERE email = ?').get(input.email)
    if (existing) {
      throw new AuthError('email already registered', 409)
    }
    const hash = await bcrypt.hash(input.password, 10)
    const result = this.db
      .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
      .run(input.email, hash)
    return { id: Number(result.lastInsertRowid), email: input.email }
  }

  async login(input: RegisterInput): Promise<{ user: User; token: string }> {
    const row = this.db
      .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
      .get(input.email) as { id: number; email: string; password_hash: string } | undefined
    if (!row) {
      throw new AuthError('invalid credentials', 401)
    }
    const ok = await bcrypt.compare(input.password, row.password_hash)
    if (!ok) {
      throw new AuthError('invalid credentials', 401)
    }
    const user: User = { id: row.id, email: row.email }
    const token = jwt.sign({ sub: row.id, email: row.email }, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
    } as jwt.SignOptions)
    return { user, token }
  }

  verify(token: string): User {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as jwt.JwtPayload
      if (typeof decoded.sub !== 'number' && typeof decoded.sub !== 'string') {
        throw new AuthError('invalid token', 401)
      }
      return { id: Number(decoded.sub), email: String(decoded.email) }
    } catch {
      throw new AuthError('invalid or expired token', 401)
    }
  }
}
