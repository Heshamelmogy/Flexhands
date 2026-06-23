import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk, handleApiError } from "@/lib/api";
import { getUserFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const uploadSchema = z.object({
  type: z.enum(["IDENTITY", "WORK_PERMIT", "STUDENT_ENROLLMENT"]),
  documentUrl: z.string().url()
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request.headers.get("authorization"));
    if (!user) return jsonOk({ error: "Unauthorized" }, 401);

    const input = uploadSchema.parse(await request.json());
    const verification = await prisma.verification.upsert({
      where: { userId_type: { userId: user.id, type: input.type } },
      create: { userId: user.id, type: input.type, documentUrl: input.documentUrl, status: "PENDING" },
      update: { documentUrl: input.documentUrl, status: "PENDING", rejectionReason: null }
    });

    return jsonOk({ verification }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
