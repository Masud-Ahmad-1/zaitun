import { AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin") throw new AuthError("Forbidden");

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [trees, total] = await Promise.all([
      db.familyTree.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: { select: { name: true, email: true } },
          _count: { select: { persons: true, members: true, diaryEntries: true } },
        },
      }),
      db.familyTree.count(),
    ]);

    return NextResponse.json({ trees, total, pages: Math.ceil(total / limit) });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin") throw new AuthError("Forbidden");

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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}