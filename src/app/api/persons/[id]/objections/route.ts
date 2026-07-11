import { AuthError, requireAuth, isTreeMember, isTreeOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const personId = searchParams.get("personId");
    if (!personId) return NextResponse.json({ error: "personId required" }, { status: 400 });

    const person = await db.person.findUnique({ where: { id: personId }, select: { treeId: true } });
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    const member = await isTreeMember(user.id, person.treeId);
    const owner = await isTreeOwner(user.id, person.treeId);
    if (!member && !owner && user.role !== "admin") return NextResponse.json({ error: "permission_denied" }, { status: 403 });

    const objections = await db.objection.findMany({
      where: { personId },
      orderBy: { createdAt: "desc" },
    });

    const userIds = new Set<string>();
    objections.forEach((o) => { userIds.add(o.raisedBy); if (o.resolvedBy) userIds.add(o.resolvedBy); });
    const users = await db.user.findMany({ where: { id: { in: Array.from(userIds) } }, select: { id: true, name: true } });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const mapped = objections.map((o) => ({
      id: o.id, personId: o.personId, field: o.field, oldValue: o.oldValue,
      newValue: o.newValue, reason: o.reason, rebuttal: o.rebuttal,
      status: o.status, raisedBy: o.raisedBy, resolvedBy: o.resolvedBy,
      raisedByName: userMap.get(o.raisedBy) || "Unknown",
      resolvedByName: o.resolvedBy ? (userMap.get(o.resolvedBy) || null) : null,
      createdAt: o.createdAt, updatedAt: o.updatedAt,
    }));

    return NextResponse.json(mapped);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { personId, field, oldValue, newValue, reason } = body;
    if (!personId || !field || !reason) return NextResponse.json({ error: "personId, field and reason required" }, { status: 400 });

    const person = await db.person.findUnique({ where: { id: personId }, select: { treeId: true, userId: true } });
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    const member = await isTreeMember(user.id, person.treeId);
    const owner = await isTreeOwner(user.id, person.treeId);
    if (!member && !owner && user.role !== "admin") return NextResponse.json({ error: "permission_denied" }, { status: 403 });
    if (person.userId === user.id) return NextResponse.json({ error: "cannot_object_own" }, { status: 400 });

    const validFields = ["firstName", "lastName", "gender", "birthDate", "deathDate", "bio", "occupation", "isDeceased", "photo"];
    if (!validFields.includes(field)) return NextResponse.json({ error: "invalid_field" }, { status: 400 });

    const objection = await db.objection.create({
      data: { personId, field, oldValue: oldValue || null, newValue: newValue || null, reason, raisedBy: user.id },
    });
    return NextResponse.json(objection);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { id, rebuttal, status } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const existing = await db.objection.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Objection not found" }, { status: 404 });

    const person = await db.person.findUnique({ where: { id: existing.personId }, select: { treeId: true, userId: true } });
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    if (rebuttal !== undefined) {
      if (person.userId !== user.id && user.role !== "admin") return NextResponse.json({ error: "only_owner_can_rebut" }, { status: 403 });
      const updated = await db.objection.update({ where: { id }, data: { rebuttal } });
      return NextResponse.json(updated);
    }

    if (status !== undefined) {
      if (!["approved", "rejected", "pending"].includes(status)) return NextResponse.json({ error: "invalid_status" }, { status: 400 });
      const owner = await isTreeOwner(user.id, person.treeId);
      if (!owner && user.role !== "admin") return NextResponse.json({ error: "only_owner_can_resolve" }, { status: 403 });

      const updated = await db.objection.update({ where: { id }, data: { status, resolvedBy: user.id } });

      if (status === "approved" && existing.newValue !== null && existing.newValue !== undefined) {
        const updateData: Record<string, unknown> = {};
        if (existing.field === "isDeceased") updateData[existing.field] = existing.newValue === "true";
        else updateData[existing.field] = existing.newValue;
        await db.person.update({ where: { id: existing.personId }, data: updateData });
      }
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "no_action" }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const existing = await db.objection.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Objection not found" }, { status: 404 });

    const person = await db.person.findUnique({ where: { id: existing.personId }, select: { treeId: true } });
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    const owner = await isTreeOwner(user.id, person.treeId);
    if (existing.raisedBy !== user.id && !owner && user.role !== "admin") return NextResponse.json({ error: "permission_denied" }, { status: 403 });
    if (existing.status !== "pending") return NextResponse.json({ error: "cannot_delete_resolved" }, { status: 400 });

    await db.objection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}