import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const SECRET = new TextEncoder().encode("zaitun-family-tree-secret-key-2024");

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
  return token;
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("zaitun_session")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError();
  }
  return user;
}

export async function getUserById(id: string) {
  return db.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export type EditPermissionResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export async function checkPersonEditPermission(
  userId: string, personId: string, userRole: string
): Promise<EditPermissionResult> {
  const person = await db.person.findUnique({ where: { id: personId }, select: { id: true, treeId: true, userId: true } });
  if (!person) return { allowed: false, reason: "Person not found" };
  if (userRole === "admin") return { allowed: true };
  if (person.userId === userId) return { allowed: true };
  if (!person.userId) {
    const membership = await db.familyTreeMember.findUnique({ where: { treeId_userId: { treeId: person.treeId, userId } } });
    if (membership) return { allowed: true };
    return { allowed: false, reason: "not_member" };
  }
  const tree = await db.familyTree.findUnique({ where: { id: person.treeId }, select: { createdBy: true } });
  if (tree && tree.createdBy === userId) return { allowed: true };
  return { allowed: false, reason: "not_owner" };
}

export async function checkDiaryEditPermission(
  userId: string, diaryId: string, userRole: string
): Promise<EditPermissionResult> {
  const entry = await db.diaryEntry.findUnique({ where: { id: diaryId }, select: { id: true, treeId: true, personId: true } });
  if (!entry) return { allowed: false, reason: "Diary entry not found" };
  if (userRole === "admin") return { allowed: true };
  const person = await db.person.findUnique({ where: { id: entry.personId }, select: { userId: true, treeId: true } });
  if (!person) return { allowed: false, reason: "Person not found" };
  if (person.userId === userId) return { allowed: true };
  if (!person.userId) {
    const membership = await db.familyTreeMember.findUnique({ where: { treeId_userId: { treeId: entry.treeId, userId } } });
    if (membership) return { allowed: true };
    return { allowed: false, reason: "not_member" };
  }
  const tree = await db.familyTree.findUnique({ where: { id: entry.treeId }, select: { createdBy: true } });
  if (tree && tree.createdBy === userId) return { allowed: true };
  return { allowed: false, reason: "not_owner" };
}

export async function isTreeMember(userId: string, treeId: string): Promise<boolean> {
  const membership = await db.familyTreeMember.findUnique({ where: { treeId_userId: { treeId, userId } } });
  return !!membership;
}

export async function isTreeOwner(userId: string, treeId: string): Promise<boolean> {
  const tree = await db.familyTree.findUnique({ where: { id: treeId }, select: { createdBy: true } });
  return !!tree && tree.createdBy === userId;
}