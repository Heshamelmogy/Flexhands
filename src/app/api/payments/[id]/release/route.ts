import { NextRequest } from "next/server";
import { jsonOk, handleApiError } from "@/lib/api";
import { getUserFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromBearer(request.headers.get("authorization"));
    if (!user) return jsonOk({ error: "Unauthorized" }, 401);

    const { id } = await params;
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id } });
    if (payment.payerId !== user.id) return jsonOk({ error: "Only payer can release escrow" }, 403);

    const released = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: "RELEASED", releasedAt: new Date() }
      });
      await tx.task.update({ where: { id: payment.taskId }, data: { status: "PAID" } });
      return updatedPayment;
    });

    return jsonOk({ payment: released });
  } catch (error) {
    return handleApiError(error);
  }
}
