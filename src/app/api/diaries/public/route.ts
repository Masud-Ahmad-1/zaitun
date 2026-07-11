import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "6", 10), 50);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: Record<string, unknown> = {};

    if (filter === "public") {
      where.privacy = "public";
    } else if (filter === "family") {
      where.privacy = "family";
    } else {
      where.privacy = { in: ["public", "family"] };
    }

    const [entries, total] = await Promise.all([
      db.diaryEntry.findMany({
        where,
        include: {
          person: {
            select: { firstName: true, lastName: true, gender: true },
          },
          tree: {
            select: { name: true },
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      db.diaryEntry.count({ where }),
    ]);

    return NextResponse.json({ entries, total, hasMore: offset + entries.length < total });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}