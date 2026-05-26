import 'dotenv/config'

export interface AppConfig {
  port: number
  databasePath: string
  jwtSecret: string
  jwtExpiresIn: string
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    databasePath: process.env.DATABASE_PATH ?? './data/hotel.db',
    jwtSecret: required('JWT_SECRET', process.env.NODE_ENV === 'test' ? 'test-secret' : undefined),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
  }
}
