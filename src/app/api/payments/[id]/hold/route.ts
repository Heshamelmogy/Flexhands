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
    if (payment.payerId !== user.id) return jsonOk({ error: "Only payer can fund escrow" }, 403);

    const held = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "HELD_IN_ESCROW", heldAt: new Date(), providerIntentId: `demo_${payment.id}` }
    });

    await prisma.task.update({ where: { id: payment.taskId }, data: { status: "IN_PROGRESS" } });
    return jsonOk({ payment: held });
  } catch (error) {
    return handleApiError(error);
  }
}
