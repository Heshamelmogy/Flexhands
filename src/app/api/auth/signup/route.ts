import { NextRequest } from "next/server";
import { jsonOk, handleApiError } from "@/lib/api";
import { hashPassword, signSession, signupSchema } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const input = signupSchema.parse(await request.json());
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await hashPassword(input.password),
        phone: input.phone,
        name: input.name,
        role: input.role,
        isStudent: input.isStudent,
        verifications: {
          create: [
            { type: "IDENTITY", status: "PENDING" },
            { type: input.isStudent ? "STUDENT_ENROLLMENT" : "WORK_PERMIT", status: "PENDING" }
          ]
        }
      },
      select: { id: true, email: true, name: true, role: true }
    });

    return jsonOk({ user, token: signSession(user.id) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
