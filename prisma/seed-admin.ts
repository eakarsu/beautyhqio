import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

async function main() {
  // Create Platform Admin user
  const hashedPassword = await bcrypt.hash(requireDemoPassword(), 12);

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
  console.log('Demo login users provisioned from the local environment.');
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
