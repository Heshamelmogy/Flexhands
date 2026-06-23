import { NextRequest } from "next/server";
import { jsonOk, handleApiError } from "@/lib/api";
import { getUserFromBearer } from "@/lib/auth";
import { platformFeeCents } from "@/lib/geo";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromBearer(request.headers.get("authorization"));
    if (!user) return jsonOk({ error: "Unauthorized" }, 401);

    const { id } = await params;
    const offer = await prisma.offer.findUniqueOrThrow({ where: { id }, include: { task: true } });
    if (offer.task.posterId !== user.id) return jsonOk({ error: "Only the task poster can accept offers" }, 403);

    const result = await prisma.$transaction(async (tx) => {
      const acceptedOffer = await tx.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
      const task = await tx.task.update({
        where: { id: offer.taskId },
        data: {
          assignedDoerId: offer.doerId,
          finalPriceCents: offer.amountCents,
          status: "ACCEPTED"
        }
      });
      const payment = await tx.payment.create({
        data: {
          taskId: task.id,
          payerId: task.posterId,
          payeeId: offer.doerId,
          amountCents: offer.amountCents,
          platformFeeCents: platformFeeCents(offer.amountCents),
          status: "REQUIRES_PAYMENT"
        }
      });

      return { acceptedOffer, task, payment };
    });

    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
