import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk, handleApiError } from "@/lib/api";
import { getUserFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const blockSchema = z.object({ blockedId: z.string() });

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request.headers.get("authorization"));
    if (!user) return jsonOk({ error: "Unauthorized" }, 401);

    const { blockedId } = blockSchema.parse(await request.json());
    const block = await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
      create: { blockerId: user.id, blockedId },
      update: {}
    });

    return jsonOk({ block }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
