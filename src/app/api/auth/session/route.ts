import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("zaitun_session")?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }
    const { verifySession } = await import("@/lib/auth");
    const user = await verifySession(token);
    if (!user) {
      const res = NextResponse.json({ user: null });
      res.cookies.set("zaitun_session", "", { maxAge: 0, path: "/" });
      return res;
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("zaitun_session", "", {
    maxAge: 0,
    path: "/",
  });
  return response;
}