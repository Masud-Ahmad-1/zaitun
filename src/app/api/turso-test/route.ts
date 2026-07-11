import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const result = await client.execute("SELECT COUNT(*) as c FROM DiaryEntry WHERE privacy='public'");
    return NextResponse.json({ ok: true, count: result.rows[0].c, url: process.env.TURSO_DATABASE_URL?.substring(0, 40) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message?.substring(0, 300), envUrl: process.env.TURSO_DATABASE_URL?.substring(0, 40) });
  }
}