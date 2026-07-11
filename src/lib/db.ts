import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use bracket notation + dynamic require to prevent
// Next.js bundler from inlining env vars at build time
const env: Record<string, string | undefined> = process.env

function createPrismaClient(): PrismaClient {
  const tursoUrl = env['TURSO_DATABASE_URL']
  const tursoToken = env['TURSO_AUTH_TOKEN']

  if (tursoUrl) {
    // Dynamic require — bundler won't evaluate this at build time
    const adapterPkg = env['NODE_ENV'] === 'production' ? '@prisma/adapter-libsql' : ''
    if (adapterPkg) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaLibSql } = require(adapterPkg)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require('@libsql/client')
      const libsql = createClient({ url: tursoUrl, authToken: tursoToken })
      return new PrismaClient({ adapter: new PrismaLibSql(libsql) })
    }
  }

  return new PrismaClient({
    log: env['NODE_ENV'] !== 'production' ? ['query'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (env['NODE_ENV'] !== 'production') globalForPrisma.prisma = db