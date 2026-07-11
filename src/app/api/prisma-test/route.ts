import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const results = await db.$queryRawUnsafe(`SELECT COUNT(*) as c FROM DiaryEntry WHERE privacy='public'`) as any[];
    return NextResponse.json({ ok: true, rawCount: results[0].c });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message?.substring(0, 500) });
  }
}