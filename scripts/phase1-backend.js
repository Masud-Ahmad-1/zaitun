// Phase 1 Backend Updates - API routes
const fs = require('fs');

const BASE = '/home/z/my-project/src';

// ─── 1. Signup route ───
fs.writeFileSync(`${BASE}/app/api/auth/signup/route.ts`, `import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { createSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, password, birthDate, gender, bio } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Email, name, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        birthDate: birthDate || null,
        gender: gender || null,
        bio: bio || null,
      },
    });

    const token = await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      birthDate: user.birthDate,
      gender: user.gender,
      bio: user.bio,
    });

    response.cookies.set("zaitun_session", token, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
`);

// ─── 2. Trees route (auto Person node) ───
fs.writeFileSync(`${BASE}/app/api/trees/route.ts`, `import { AuthError } from "@/lib/auth";
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

    const code = \`ZAITUN-\${Math.random().toString(36).substring(2, 6).toUpperCase()}-\${Math.random().toString(36).substring(2, 6).toUpperCase()}\`;

    const tree = await db.familyTree.create({
      data: { name, description: description || null, isPrivate: isPrivate ?? true, inviteCode: code, createdBy: user.id },
    });
    await db.familyTreeMember.create({
      data: { treeId: tree.id, userId: user.id, role: "owner" },
    });

    // Auto-create Person node for the user
    const nameParts = user.name.trim().split(/\\s+/);
    const firstName = nameParts[0] || user.name;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    // Get user profile data to sync
    const userProfile = await db.user.findUnique({ where: { id: user.id } });

    await db.person.create({
      data: {
        treeId: tree.id,
        firstName,
        lastName,
        gender: userProfile?.gender || null,
        birthDate: userProfile?.birthDate || null,
        bio: userProfile?.bio || null,
        userId: user.id,
        contributedBy: user.id,
        sortOrder: 0,
      },
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
`);

// ─── 3. Join route (with suggestion GET + claim on join) ───
fs.writeFileSync(`${BASE}/app/api/trees/join/route.ts`, `import { AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { inviteCode, claimPersonId } = body;

    if (!inviteCode) {
      return NextResponse.json({ error: "inviteCode required" }, { status: 400 });
    }

    const tree = await db.familyTree.findUnique({ where: { inviteCode } });
    if (!tree) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }
    const existing = await db.familyTreeMember.findUnique({
      where: { treeId_userId: { treeId: tree.id, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }
    await db.familyTreeMember.create({
      data: { treeId: tree.id, userId: user.id, role: "member" },
    });

    // If user wants to claim a person node on join
    if (claimPersonId) {
      const person = await db.person.findFirst({
        where: { id: claimPersonId, treeId: tree.id, userId: null },
      });
      if (person) {
        await db.profileClaim.create({
          data: {
            personId: claimPersonId,
            treeId: tree.id,
            claimantId: user.id,
            status: "approved",
          },
        });
        await db.person.update({
          where: { id: claimPersonId },
          data: { userId: user.id },
        });
      }
    }

    return NextResponse.json(tree);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET: Check for matching persons when joining (suggestions)
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const inviteCode = searchParams.get("inviteCode");
    if (!inviteCode) return NextResponse.json({ suggestions: [] });

    const tree = await db.familyTree.findUnique({ where: { inviteCode } });
    if (!tree) return NextResponse.json({ suggestions: [] });

    const userFirstName = user.name.split(/\\s+/)[0]?.toLowerCase() || "";
    const userFullName = user.name.toLowerCase();

    const suggestions = await db.person.findMany({
      where: {
        treeId: tree.id,
        userId: null,
        OR: [
          { firstName: { equals: user.name, mode: "insensitive" } },
          { firstName: { equals: userFirstName, mode: "insensitive" } },
          { lastName: { equals: userFirstName, mode: "insensitive" } },
          {
            AND: [
              { firstName: { equals: userFullName.split(" ")[0], mode: "insensitive" } },
              userFullName.includes(" ") ? { lastName: { equals: userFullName.split(" ").slice(1).join(" "), mode: "insensitive" } } : {},
            ],
          },
        ],
      },
      select: { id: true, firstName: true, lastName: true, bio: true, gender: true, birthDate: true },
      take: 5,
    });

    return NextResponse.json({ suggestions, treeName: tree.name, treeId: tree.id });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
`);

// ─── 4. Persons route (edit rules) ───
fs.writeFileSync(`${BASE}/app/api/persons/route.ts`, `import { AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAuth, getSessionUser } from "@/lib/auth";
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
    const user = await requireAuth();
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
        contributedBy: user.id,
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
    const user = await requireAuth();
    const body = await req.json();
    const { id, firstName, lastName, gender, birthDate, deathDate, bio, occupation, isDeceased, photo } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const person = await db.person.findUnique({ where: { id } });
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    // Edit rule: if person is linked to another user, deny
    if (person.userId && person.userId !== user.id) {
      return NextResponse.json({ error: "You can only edit your own profile" }, { status: 403 });
    }

    const updated = await db.person.update({
      where: { id },
      data: { firstName, lastName, gender, birthDate, deathDate, bio, occupation, isDeceased, photo },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const person = await db.person.findUnique({ where: { id } });
    if (person?.userId && person.userId !== user.id) {
      return NextResponse.json({ error: "You can only delete your own profile" }, { status: 403 });
    }

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
`);

// ─── 5. Profile Claim API ───
const claimDir = `${BASE}/app/api/claims`;
fs.mkdirSync(claimDir, { recursive: true });

fs.writeFileSync(`${claimDir}/route.ts`, `import { AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const treeId = searchParams.get("treeId");
    const status = searchParams.get("status") || "pending";

    if (!treeId) return NextResponse.json({ error: "treeId required" }, { status: 400 });

    const membership = await db.familyTreeMember.findUnique({
      where: { treeId_userId: { treeId, userId: user.id } },
    });
    if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const claims = await db.profileClaim.findMany({
      where: { treeId, status },
      include: {
        claimant: { select: { id: true, name: true, email: true, image: true } },
        person: { select: { id: true, firstName: true, lastName: true, bio: true } },
        witnesses: { include: { user: { select: { id: true, name: true } } } },
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(claims);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { personId, treeId, relationship, evidence, witnessIds } = body;

    if (!personId || !treeId) {
      return NextResponse.json({ error: "personId and treeId required" }, { status: 400 });
    }

    const person = await db.person.findFirst({
      where: { id: personId, treeId, userId: null },
    });
    if (!person) {
      return NextResponse.json({ error: "Person not found or already claimed" }, { status: 404 });
    }

    const membership = await db.familyTreeMember.findUnique({
      where: { treeId_userId: { treeId, userId: user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a tree member" }, { status: 403 });
    }

    const existingClaim = await db.profileClaim.findFirst({
      where: { personId, claimantId: user.id, status: "pending" },
    });
    if (existingClaim) {
      return NextResponse.json({ error: "You already have a pending claim" }, { status: 409 });
    }

    const claim = await db.profileClaim.create({
      data: {
        personId,
        treeId,
        claimantId: user.id,
        relationship: relationship || null,
        evidence: evidence || null,
      },
      include: {
        claimant: { select: { id: true, name: true } },
        person: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (witnessIds && Array.isArray(witnessIds)) {
      for (const wId of witnessIds) {
        await db.profileClaimWitness.create({
          data: { claimId: claim.id, userId: wId },
        });
      }
    }

    return NextResponse.json(claim);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { claimId, action } = body;

    if (!claimId || !action) {
      return NextResponse.json({ error: "claimId and action required" }, { status: 400 });
    }

    const claim = await db.profileClaim.findUnique({ where: { id: claimId } });
    if (!claim || claim.status !== "pending") {
      return NextResponse.json({ error: "Claim not found or already resolved" }, { status: 404 });
    }

    const tree = await db.familyTree.findUnique({ where: { id: claim.treeId } });
    const isOwner = tree?.createdBy === user.id;
    const person = await db.person.findUnique({ where: { id: claim.personId } });
    const isContributor = person?.contributedBy === user.id;

    if (!isOwner && !isContributor) {
      return NextResponse.json({ error: "Only tree owner or contributor can review" }, { status: 403 });
    }

    if (action === "approve") {
      await db.person.update({
        where: { id: claim.personId },
        data: { userId: claim.claimantId },
      });
      await db.profileClaim.update({
        where: { id: claimId },
        data: { status: "approved", reviewerId: user.id, reviewedAt: new Date() },
      });
    } else {
      await db.profileClaim.update({
        where: { id: claimId },
        data: { status: "rejected", reviewerId: user.id, reviewedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
`);

console.log('All API routes written!');