import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, name, password, locale } = await req.json()
    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }
    const encoded = Buffer.from(password).toString('base64')
    const user = await db.user.create({
      data: { email, name, password: encoded, locale: locale || 'en' },
    })
    return NextResponse.json({ id: user.id, email: user.email, name: user.name, locale: user.locale })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
