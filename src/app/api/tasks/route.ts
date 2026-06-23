import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk, handleApiError } from "@/lib/api";
import { getUserFromBearer } from "@/lib/auth";
import { distanceKm } from "@/lib/geo";
import { prisma } from "@/lib/prisma";

const createTaskSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.string().min(2),
  budgetCents: z.number().int().positive(),
  address: z.string().min(3),
  latitude: z.number(),
  longitude: z.number(),
  dueAt: z.string().datetime().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const radiusKm = Number(searchParams.get("radiusKm") ?? 10);

    const tasks = await prisma.task.findMany({
      where: { status: "OPEN" },
      include: { poster: { select: { id: true, name: true, ratingAverage: true, ratingCount: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const filtered =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? tasks
            .map((task) => ({
              ...task,
              distanceKm: distanceKm({ latitude: lat, longitude: lng }, task)
            }))
            .filter((task) => task.distanceKm <= radiusKm)
        : tasks;

    return jsonOk({ tasks: filtered });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request.headers.get("authorization"));
    if (!user) return jsonOk({ error: "Unauthorized" }, 401);

    const input = createTaskSchema.parse(await request.json());
    const task = await prisma.task.create({
      data: {
        ...input,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        posterId: user.id
      }
    });

    return jsonOk({ task }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
