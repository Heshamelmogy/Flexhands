import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./prisma";

const jwtSecret = process.env.JWT_SECRET ?? "dev-only-secret-change-me";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["CLIENT", "DOER", "BOTH"]).default("BOTH"),
  isStudent: z.boolean().default(false)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signSession(userId: string) {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: "7d" });
}

export async function getUserFromBearer(authHeader: string | null) {
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  try {
    const payload = jwt.verify(token, jwtSecret) as { sub?: string };
    if (!payload.sub) return null;
    return prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}
