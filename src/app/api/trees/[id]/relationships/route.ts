import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { fromId, toId, type } = await req.json()
  if (!fromId || !toId || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const rel = await db.relationship.create({
    data: { fromId, toId, type, treeId: id },
  })
  return NextResponse.json(rel)
}
