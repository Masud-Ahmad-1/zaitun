import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, nameBn, gender, birthDate, deathDate, bio } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const person = await db.person.create({
    data: { name, nameBn: nameBn || null, gender: gender || 'male', birthDate: birthDate || null, deathDate: deathDate || null, bio: bio || null, treeId: id },
  })
  return NextResponse.json(person)
}
