import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk, handleApiError } from "@/lib/api";
import { getUserFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reportSchema = z.object({
  reportedId: z.string(),
  reason: z.string().min(3),
  details: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request.headers.get("authorization"));
    if (!user) return jsonOk({ error: "Unauthorized" }, 401);

    const input = reportSchema.parse(await request.json());
    const report = await prisma.report.create({ data: { ...input, reporterId: user.id } });
    return jsonOk({ report }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
