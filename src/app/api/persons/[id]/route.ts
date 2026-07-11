import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  const person = await db.person.update({ where: { id }, data })
  return NextResponse.json(person)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.relationship.deleteMany({ where: { OR: [{ fromId: id }, { toId: id }] } })
  await db.person.delete({ where: { id } })
  return NextResponse.json({ success: true })
}