import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tree = await db.familyTree.findUnique({
    where: { id },
    include: {
      persons: true,
      relations: true,
    },
  })
  if (!tree) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    ...tree,
    persons: tree.persons,
    relationships: tree.relations,
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.relationship.deleteMany({ where: { treeId: id } })
  await db.person.deleteMany({ where: { treeId: id } })
  await db.familyTree.delete({ where: { id } })
  return NextResponse.json({ success: true })
}