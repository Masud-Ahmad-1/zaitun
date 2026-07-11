import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
    tursoUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 30),
    keys: Object.keys(process.env).filter(k => k.startsWith('TURSO') || k.startsWith('ADMIN') || k === 'DATABASE_URL' || k === 'NODE_ENV'),
    nodeEnv: process.env.NODE_ENV,
  });
}