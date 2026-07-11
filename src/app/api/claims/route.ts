import { AuthError } from "@/lib/auth";
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
