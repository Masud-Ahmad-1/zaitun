import { AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAuth, getSessionUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { name, description, isPrivate } = body;
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const code = `ZAITUN-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const tree = await db.familyTree.create({
      data: { name, description: description || null, isPrivate: isPrivate ?? true, inviteCode: code, createdBy: user.id },
    });
    await db.familyTreeMember.create({
      data: { treeId: tree.id, userId: user.id, role: "owner" },
    });
    return NextResponse.json(tree);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json([]);
    }
    // Return trees where user is a member
    const memberships = await db.familyTreeMember.findMany({
      where: { userId: user.id },
      include: {
        tree: {
          include: { creator: true, persons: true, members: true },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
    const trees = memberships.map((m) => m.tree);
    return NextResponse.json(trees);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.diaryEntry.deleteMany({ where: { treeId: id } });
    await db.relationship.deleteMany({ where: { treeId: id } });
    await db.person.deleteMany({ where: { treeId: id } });
    await db.familyTreeMember.deleteMany({ where: { treeId: id } });
    await db.familyTree.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}