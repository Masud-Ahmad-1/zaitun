import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Bracket notation prevents Turbopack from replacing at build time
  const envKey = 'TURSO_DATABASE_URL'
  const tursoUrl = process.env[envKey]
  const tursoToken = process.env['TURSO_AUTH_TOKEN']

  if (tursoUrl) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require('@prisma/adapter-libsql')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client')
    const libsql = createClient({ url: tursoUrl, authToken: tursoToken })
    return new PrismaClient({ adapter: new PrismaLibSql(libsql) })
  }

  return new PrismaClient({
    log: process.env['NODE_ENV'] !== 'production' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = db