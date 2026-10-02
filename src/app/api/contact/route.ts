import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { endpoint, platformContext } from "@/lib/operations/core";

// POST /api/contact - Public website contact form. Intentionally unauthenticated:
// it is called by anonymous visitors on the marketing site and only creates a
// global ContactMessage row (the model has no businessId). It is still wrapped in
// endpoint() so malformed JSON and validation errors are handled safely.
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const body = z
      .object({
        firstName: z.string().trim().min(1).max(100),
        lastName: z.string().trim().min(1).max(100),
        email: z.string().trim().email().max(200),
        phone: z.string().trim().max(50).optional().nullable(),
        subject: z.string().trim().min(1).max(200),
        message: z.string().trim().min(1).max(5000),
      })
      .parse(await request.json());

    await prisma.contactMessage.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || null,
        subject: body.subject,
        message: body.message,
      },
    });

    return { success: true };
  });
}

// GET /api/contact - Admin inbox.
// ContactMessage has no businessId, so this cannot be tenant-scoped; access is
// restricted to management roles and the gap is noted for a schema follow-up.
export async function GET() {
  return endpoint(async () => {
    await platformContext();
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return messages;
  });
}
