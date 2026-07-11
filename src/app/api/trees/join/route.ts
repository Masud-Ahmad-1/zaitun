import { AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { inviteCode } = body;

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
    return NextResponse.json(tree);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}