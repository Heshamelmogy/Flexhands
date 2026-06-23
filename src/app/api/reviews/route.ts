import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk, handleApiError } from "@/lib/api";
import { getUserFromBearer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  taskId: z.string(),
  revieweeId: z.string(),
  rating: z.number().int().min(1).max(5),
  positive: z.boolean(),
  body: z.string().min(4).max(1000)
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request.headers.get("authorization"));
    if (!user) return jsonOk({ error: "Unauthorized" }, 401);

    const input = reviewSchema.parse(await request.json());
    const review = await prisma.review.create({ data: { ...input, reviewerId: user.id } });
    const aggregate = await prisma.review.aggregate({
      where: { revieweeId: input.revieweeId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    await prisma.user.update({
      where: { id: input.revieweeId },
      data: {
        ratingAverage: aggregate._avg.rating ?? input.rating,
        ratingCount: aggregate._count.rating
      }
    });

    return jsonOk({ review }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
