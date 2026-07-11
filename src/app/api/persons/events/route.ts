import { AuthError, requireAuth, isTreeMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const personId = searchParams.get("personId");
    if (!personId) return NextResponse.json({ error: "personId required" }, { status: 400 });

    const events = await db.lifeEvent.findMany({
      where: { personId },
      orderBy: [{ sortOrder: "asc" }, { year: "asc" }],
    });
    return NextResponse.json(events);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { personId, year, title, description, sortOrder } = body;
    if (!personId || !year || !title) return NextResponse.json({ error: "personId, year and title required" }, { status: 400 });

    const person = await db.person.findUnique({ where: { id: personId }, select: { treeId: true } });
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    const member = await isTreeMember(user.id, person.treeId);
    if (!member && user.role !== "admin") return NextResponse.json({ error: "permission_denied" }, { status: 403 });

    const maxOrder = await db.lifeEvent.findFirst({
      where: { personId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const event = await db.lifeEvent.create({
      data: {
        personId, year, title,
        description: description || null,
        sortOrder: sortOrder ?? (maxOrder?.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json(event);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { id, year, title, description, sortOrder } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const event = await db.lifeEvent.update({
      where: { id },
      data: { year, title, description, sortOrder },
    });
    return NextResponse.json(event);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.lifeEvent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}