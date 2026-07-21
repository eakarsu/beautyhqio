import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = String(process.env.ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD || "");
  const tenantId = String(process.env.TENANT_ID || "runtime-tenant").trim();
  if (!email || !email.includes("@")) throw new Error("ADMIN_EMAIL must be a valid email address.");
  if (password.length < 12 || password.length > 72) throw new Error("ADMIN_PASSWORD must contain 12-72 characters.");
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    console.log(`Administrator ${email} already exists; no changes made.`);
    return;
  }
  const business = await prisma.business.upsert({
    where: { id: tenantId },
    update: {},
    create: { id: tenantId, name: String(process.env.BOOTSTRAP_TENANT_NAME || "Runtime Acceptance Salon"), type: "MULTI_SERVICE" },
  });
  await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 12),
      firstName: "Runtime",
      lastName: "Administrator",
      role: "OWNER",
      isActive: true,
      businessId: business.id,
    },
  });
  console.log(`Created administrator ${email}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
