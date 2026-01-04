import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create Platform Admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@beautyai.com" },
    update: {},
    create: {
      email: "admin@beautyai.com",
      password: hashedPassword,
      firstName: "Platform",
      lastName: "Admin",
      role: "PLATFORM_ADMIN",
      // No businessId - platform admin manages all businesses
    },
  });

  console.log("✅ Platform Admin created:");
  console.log("   Email: admin@beautyai.com");
  console.log("   Password: admin123");
  console.log("   Role: PLATFORM_ADMIN");
  console.log("");
  console.log("🔐 Please change this password after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
