import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";
import { context, endpoint, fail } from "@/lib/operations/core";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

// `type` is a fixed allow-list so a caller cannot choose an arbitrary directory.
const ALLOWED_CATEGORIES = new Set([
  "general",
  "clients",
  "staff",
  "services",
  "products",
  "documents",
  "receipts",
]);

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// POST /api/upload - Upload a file for the caller's own business.
//
// Previously anonymous, with a caller-controlled directory and filename. Now:
//   - requires an authenticated user with a business
//   - restricts the subdirectory to a fixed allow-list
//   - stores files under a per-business prefix so tenants cannot collide
//   - derives the extension from the validated MIME type, not the filename
export async function POST(request: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);

    const formData = await request.formData();
    const file = formData.get("file");
    const category = (formData.get("type") as string) || "general";

    if (!(file instanceof File)) return fail(400, "No file provided");

    const safeCategory = ALLOWED_CATEGORIES.has(category) ? category : "general";

    if (!ALLOWED_TYPES.has(file.type)) return fail(400, "Invalid file type");
    if (file.size > 10 * 1024 * 1024) return fail(400, "File too large (max 10MB)");

    const extension = EXTENSION_BY_TYPE[file.type] ?? "bin";

    // Tenant-scoped directory; randomised filename so a caller cannot choose it.
    const uploadDir = join(process.cwd(), "public", "uploads", ctx.businessId, safeCategory);
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);

    return {
      success: true,
      url: `/uploads/${ctx.businessId}/${safeCategory}/${filename}`,
      filename,
      type: file.type,
      size: file.size,
    };
  });
}
