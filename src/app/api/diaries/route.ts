import { AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const treeId = searchParams.get("treeId");
    const personId = searchParams.get("personId");
    if (!treeId) return NextResponse.json({ error: "treeId required" }, { status: 400 });

    const where: Record<string, unknown> = { treeId };
    if (personId) where.personId = personId;

    const entries = await db.diaryEntry.findMany({
      where,
      include: { person: { select: { firstName: true, lastName: true, gender: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(entries);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { treeId, personId, date, title, content, privacy, tags } = body;
    if (!treeId || !personId || !date || !title) {
      return NextResponse.json({ error: "treeId, personId, date and title required" }, { status: 400 });
    }

    const entry = await db.diaryEntry.create({
      data: {
        treeId,
        personId,
        date,
        title,
        content: content || "",
        privacy: privacy || "family",
        tags: tags || "",
      },
      include: { person: { select: { firstName: true, lastName: true, gender: true } } },
    });
    return NextResponse.json(entry);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { id, date, title, content, privacy, tags } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const entry = await db.diaryEntry.update({
      where: { id },
      data: { date, title, content, privacy, tags },
      include: { person: { select: { firstName: true, lastName: true, gender: true } } },
    });
    return NextResponse.json(entry);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.diaryEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}