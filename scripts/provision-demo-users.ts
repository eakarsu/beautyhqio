import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { getDemoAccounts } from "../src/lib/demo-accounts.server";

const prisma = new PrismaClient();

async function main() {
  const tenantId = String(process.env.TENANT_ID || "runtime-tenant").trim();
  const accounts = getDemoAccounts();

  const business = await prisma.business.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: String(process.env.BOOTSTRAP_TENANT_NAME || "Runtime Acceptance Salon"),
      type: "MULTI_SERVICE",
    },
  });

  const location = await prisma.location.upsert({
    where: { id: `${tenantId}-demo-location` },
    update: { businessId: business.id, isActive: true },
    create: {
      id: `${tenantId}-demo-location`,
      businessId: business.id,
      name: "Demo Location",
      address: "123 Demo Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
    },
  });

  // Older demo seeds omitted the tenant key on appointments. Repair them so
  // every role sees the same calendar and dashboard data after an upgrade.
  await prisma.appointment.updateMany({
    where: { businessId: null, location: { businessId: business.id } },
    data: { businessId: business.id },
  });

  for (const account of accounts) {
    const password = await bcrypt.hash(account.password, 12);
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        email: account.email,
        password,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        isActive: true,
        businessId: business.id,
      },
    });

    if (account.role === "STAFF") {
      await prisma.staff.upsert({
        where: { userId: user.id },
        update: { isActive: true },
        create: {
          userId: user.id,
          locationId: location.id,
          displayName: `${account.firstName} ${account.lastName[0]}.`,
          title: "Demo Stylist",
          specialties: [],
          serviceIds: [],
        },
      });
    }
  }

  console.log(`Provisioned ${accounts.length} demo role accounts: ${accounts.map(({ email }) => email).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
