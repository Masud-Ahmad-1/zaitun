import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _db: PrismaClient | null = null

function getDb(): PrismaClient {
  if (_db) return _db

  // Lazy check — runs on first API call, not at module load
  if (process.env.TURSO_DATABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require('@prisma/adapter-libsql')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client')
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    _db = new PrismaClient({ adapter: new PrismaLibSql(libsql) })
  } else {
    _db = new PrismaClient({
      log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
    })
  }

  globalForPrisma.prisma = _db
  return _db
}

// Proxy: delegates every property access to the real client lazily
// This prevents Turbopack from evaluating env vars at build time
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getDb()
    const value = Reflect.get(client, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
  has(_target, prop) {
    return prop in getDb()
  },
})