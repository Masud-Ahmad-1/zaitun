import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  if (process.env.TURSO_DATABASE_URL) {
    const { createClient } = require('@libsql/client') as { createClient: Function }
    const { PrismaLibSQL } = require('@prisma/adapter-libsql') as { PrismaLibSQL: any }

    // Create libsql client — confirmed working in Vercel
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })

    // Create adapter wrapping the libsql client
    const adapter = new PrismaLibSQL(libsql)

    // Pass adapter to Prisma — DATABASE_URL must be valid for schema validation
    return new PrismaClient({ adapter })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db