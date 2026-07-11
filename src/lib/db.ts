import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Debug: log env at module load
console.error('[db.ts] TURSO_DATABASE_URL =', process.env.TURSO_DATABASE_URL)
console.error('[db.ts] typeof =', typeof process.env.TURSO_DATABASE_URL)
console.error('[db.ts] keys =', Object.keys(process.env).filter(k => k.includes('TURSO')))

function createPrismaClient(): PrismaClient {
  if (process.env.TURSO_DATABASE_URL) {
    console.error('[db.ts] Creating Turso client with URL:', process.env.TURSO_DATABASE_URL?.substring(0, 40))
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require('@prisma/adapter-libsql')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client')
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    return new PrismaClient({ adapter: new PrismaLibSql(libsql) })
  }

  console.error('[db.ts] Creating local SQLite client')
  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db