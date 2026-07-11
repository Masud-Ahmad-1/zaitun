import { AuthError, requireAuth, checkPersonEditPermission, checkDiaryEditPermission } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const personId = searchParams.get("personId");
    const diaryId = searchParams.get("diaryId");

    if (personId) {
      const perm = await checkPersonEditPermission(user.id, personId, user.role);
      return NextResponse.json(perm);
    }
    if (diaryId) {
      const perm = await checkDiaryEditPermission(user.id, diaryId, user.role);
      return NextResponse.json(perm);
    }
    return NextResponse.json({ error: "personId or diaryId required" }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}