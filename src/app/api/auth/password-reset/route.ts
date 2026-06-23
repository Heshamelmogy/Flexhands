import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonOk, handleApiError } from "@/lib/api";

const resetSchema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const { email } = resetSchema.parse(await request.json());
    return jsonOk({
      message: "Password reset request accepted. Connect this route to your email provider.",
      email
    });
  } catch (error) {
    return handleApiError(error);
  }
}
