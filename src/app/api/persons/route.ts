import { AuthError, requireAuth, checkPersonEditPermission, isTreeMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const treeId = searchParams.get("treeId");
    if (!treeId) return NextResponse.json({ error: "treeId required" }, { status: 400 });

    const persons = await db.person.findMany({
      where: { treeId },
      orderBy: { createdAt: "asc" },
    });
    const relationships = await db.relationship.findMany({
      where: { treeId },
    });
    return NextResponse.json({ persons, relationships });
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
    const { treeId, firstName, lastName, gender, birthDate, deathDate, bio, occupation, isDeceased, photo, relType, relToPersonId } = body;
    if (!treeId || !firstName) {
      return NextResponse.json({ error: "treeId and firstName required" }, { status: 400 });
    }

    const person = await db.person.create({
      data: {
        treeId, firstName, lastName: lastName || null, gender: gender || null,
        birthDate: birthDate || null, deathDate: deathDate || null,
        bio: bio || null, occupation: occupation || null,
        isDeceased: isDeceased ?? false, photo: photo || null,
      },
    });

    if (relType && relToPersonId) {
      await db.relationship.create({
        data: { treeId, person1Id: relToPersonId, person2Id: person.id, type: relType },
      });
      const reverseMap: Record<string, string> = {
        father: "child", mother: "child", son: "parent", daughter: "parent",
        child: "parent", brother: "sibling", sister: "sibling", sibling: "sibling",
        spouse: "spouse", grandfather: "grandchild", grandmother: "grandchild",
        grandson: "grandparent", granddaughter: "grandparent",
        uncle: "nephew/niece", aunt: "nephew/niece", cousin: "cousin",
      };
      const reverseType = reverseMap[relType];
      if (reverseType) {
        await db.relationship.create({
          data: { treeId, person1Id: person.id, person2Id: relToPersonId, type: reverseType },
        });
      }
    }

    return NextResponse.json(person);
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
    const { id, firstName, lastName, gender, birthDate, deathDate, bio, occupation, isDeceased, photo } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const person = await db.person.update({
      where: { id },
      data: { firstName, lastName, gender, birthDate, deathDate, bio, occupation, isDeceased, photo },
    });
    return NextResponse.json(person);
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
    await db.relationship.deleteMany({ where: { OR: [{ person1Id: id }, { person2Id: id }] } });
    await db.person.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}