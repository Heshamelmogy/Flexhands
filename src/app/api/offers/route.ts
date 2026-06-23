import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk, handleApiError } from "@/lib/api";
import { getUserFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const offerSchema = z.object({
  taskId: z.string(),
  amountCents: z.number().int().positive(),
  note: z.string().max(600).optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request.headers.get("authorization"));
    if (!user) return jsonOk({ error: "Unauthorized" }, 401);

    const input = offerSchema.parse(await request.json());
    const offer = await prisma.offer.create({
      data: { ...input, doerId: user.id, status: "PENDING" }
    });

    await prisma.notification.create({
      data: {
        userId: (await prisma.task.findUniqueOrThrow({ where: { id: input.taskId } })).posterId,
        type: "OFFER",
        title: "New offer received",
        body: `${user.name} offered EUR ${(input.amountCents / 100).toFixed(2)}`
      }
    });

    return jsonOk({ offer }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
