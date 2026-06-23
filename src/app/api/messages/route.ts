import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk, handleApiError } from "@/lib/api";
import { getUserFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  taskId: z.string(),
  body: z.string().min(1).max(2000),
  offerId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request.headers.get("authorization"));
    if (!user) return jsonOk({ error: "Unauthorized" }, 401);

    const input = messageSchema.parse(await request.json());
    const task = await prisma.task.findUniqueOrThrow({ where: { id: input.taskId } });
    const otherUserId = task.posterId === user.id ? task.assignedDoerId : task.posterId;

    if (otherUserId) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: user.id, blockedId: otherUserId },
            { blockerId: otherUserId, blockedId: user.id }
          ]
        }
      });
      if (block) return jsonOk({ error: "Messaging is blocked between these users" }, 403);
    }

    const message = await prisma.message.create({ data: { ...input, senderId: user.id } });

    if (otherUserId) {
      await prisma.notification.create({
        data: { userId: otherUserId, type: "MESSAGE", title: "New message", body: input.body.slice(0, 120) }
      });
    }

    return jsonOk({ message }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
