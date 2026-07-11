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
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, name: true, email: true, role: true, locale: true, createdAt: true,
          _count: { select: { createdTrees: true, familyTreeMemberships: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const me = await requireAuth();
    if (me.role !== "admin") throw new AuthError("Forbidden");

    const body = await req.json();
    const { id, role } = body;
    if (!id || !role) {
      return NextResponse.json({ error: "id and role required" }, { status: 400 });
    }
    if (id === me.id) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const me = await requireAuth();
    if (me.role !== "admin") throw new AuthError("Forbidden");

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (id === me.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    // Delete all user data
    const memberships = await db.familyTreeMember.findMany({ where: { userId: id } });
    for (const m of memberships) {
      await db.diaryEntry.deleteMany({ where: { treeId: m.treeId } });
      await db.relationship.deleteMany({ where: { treeId: m.treeId } });
      await db.person.deleteMany({ where: { treeId: m.treeId } });
      await db.familyTreeMember.deleteMany({ where: { treeId: m.treeId } });
      await db.familyTree.delete({ where: { id: m.treeId } });
    }
    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}