import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Get a single diary entry by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const entry = await db.diaryEntry.findUnique({
      where: { id },
      include: {
        person: {
          select: {
            firstName: true,
            lastName: true,
            gender: true,
            bio: true,
            occupation: true,
            birthDate: true,
            photo: true,
          },
        },
        tree: { select: { id: true, name: true, isPrivate: true } },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Privacy check
    const user = await getSessionUser();

    if (entry.privacy === "private") {
      // Only the person's linked user or tree members can see private entries
      if (!user) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const membership = await db.familyTreeMember.findFirst({
        where: { treeId: entry.treeId, userId: user.id },
      });
      const isLinkedUser = entry.person?.userId === user.id;
      if (!membership && !isLinkedUser) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    } else if (entry.privacy === "family") {
      // Only tree members can see family entries
      if (user) {
        const membership = await db.familyTreeMember.findFirst({
          where: { treeId: entry.treeId, userId: user.id },
        });
        if (!membership) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
    // "public" — anyone can see

    return NextResponse.json(entry);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}