import { NextRequest } from "next/server";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { loginSchema, signSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      return jsonError("Invalid email or password", 401);
    }

    return jsonOk({
      token: signSession(user.id),
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
