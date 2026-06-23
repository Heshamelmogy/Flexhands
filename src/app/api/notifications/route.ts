import { NextRequest } from "next/server";
import { jsonOk, handleApiError } from "@/lib/api";
import { getUserFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request.headers.get("authorization"));
    if (!user) return jsonOk({ error: "Unauthorized" }, 401);

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30
    });

    return jsonOk({ notifications });
  } catch (error) {
    return handleApiError(error);
  }
}
