import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // In Vercel: TURSO_DATABASE_URL is set, adapter creates the connection
  // In local dev: TURSO_DATABASE_URL is not set, falls back to local SQLite
  if (process.env.TURSO_DATABASE_URL) {
    const libsql = require('@libsql/client').createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new (require('@prisma/adapter-libsql').PrismaLibSQL)(libsql)
    return new PrismaClient({ adapter })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db