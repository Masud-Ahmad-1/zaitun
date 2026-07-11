import { AuthError, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { personId } = body;

    if (!personId) {
      return NextResponse.json({ error: "personId required" }, { status: 400 });
    }

    const person = await db.person.findUnique({
      where: { id: personId },
      select: { id: true, treeId: true, userId: true },
    });
    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    if (person.userId) {
      return NextResponse.json({ error: "This profile is already claimed" }, { status: 409 });
    }

    const membership = await db.familyTreeMember.findUnique({
      where: { treeId_userId: { treeId: person.treeId, userId: user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "You must be a member of this tree to claim a profile" }, { status: 403 });
    }

    const updated = await db.person.update({
      where: { id: personId },
      data: { userId: user.id },
    });

    // Account transfer: copy user bio/birthDate to person if empty
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { bio: true, birthDate: true, name: true },
    });
    if (userData) {
      const existingPerson = await db.person.findUnique({
        where: { id: personId },
        select: { bio: true, birthDate: true, firstName: true, lastName: true },
      });
      if (existingPerson) {
        const updates: Record<string, unknown> = {};
        if (!existingPerson.bio && userData.bio) updates.bio = userData.bio;
        if (!existingPerson.birthDate && userData.birthDate) updates.birthDate = userData.birthDate;
        const userFirst = userData.name.split(" ")[0];
        const userLast = userData.name.split(" ").slice(1).join(" ");
        if (userFirst && userFirst.toLowerCase() === existingPerson.firstName.toLowerCase() && userLast && !existingPerson.lastName) {
          updates.lastName = userLast;
        }
        if (Object.keys(updates).length > 0) {
          await db.person.update({ where: { id: personId }, data: updates });
        }
      }
    }

    const finalPerson = await db.person.findUnique({ where: { id: personId } });
    return NextResponse.json(finalPerson);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}