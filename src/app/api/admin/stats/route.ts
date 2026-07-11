import { AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== "admin") {
      throw new AuthError("Forbidden");
    }

    const [totalUsers, totalTrees, totalPersons, totalDiaries, recentUsers] = await Promise.all([
      db.user.count(),
      db.familyTree.count(),
      db.person.count(),
      db.diaryEntry.count(),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalTrees,
      totalPersons,
      totalDiaries,
      recentUsers,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}