import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

if (process.env.ALLOW_E2E_SEED !== "true" || !/(_test|localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL || "")) {
  throw new Error("Refusing to seed: ALLOW_E2E_SEED=true and an explicitly local/test database are required");
}

const prisma = new PrismaClient();

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

async function main() {
  const password = await bcrypt.hash(requireDemoPassword(), 12);
  try {
  const business = await prisma.business.upsert({
    where: { id: "e2e-business-primary" },
    update: { name: "Governed E2E Salon" },
    create: { id: "e2e-business-primary", name: "Governed E2E Salon", type: "HAIR_SALON" },
  });
  const otherBusiness = await prisma.business.upsert({
    where: { id: "e2e-business-other" },
    update: { name: "Other E2E Salon" },
    create: { id: "e2e-business-other", name: "Other E2E Salon", type: "SPA" },
  });
  const owner = await prisma.user.upsert({
    where: { email: "owner@governed-e2e.test" },
    update: { password, businessId: business.id, isActive: true, role: "OWNER" },
    create: { id: "e2e-owner-primary", email: "owner@governed-e2e.test", password, firstName: "E2E", lastName: "Owner", role: "OWNER", businessId: business.id },
  });
  await prisma.user.upsert({
    where: { email: "owner@other-e2e.test" },
    update: { password, businessId: otherBusiness.id, isActive: true, role: "OWNER" },
    create: { id: "e2e-owner-other", email: "owner@other-e2e.test", password, firstName: "Other", lastName: "Owner", role: "OWNER", businessId: otherBusiness.id },
  });
  const location = await prisma.location.upsert({
    where: { id: "e2e-location-primary" },
    update: { businessId: business.id, isActive: true },
    create: { id: "e2e-location-primary", businessId: business.id, name: "E2E Main", address: "1 Test Way", city: "Test", state: "NY", zip: "10001" },
  });
  await prisma.staff.upsert({
    where: { userId: owner.id },
    update: { locationId: location.id, isActive: true },
    create: { id: "e2e-staff-primary", userId: owner.id, locationId: location.id, specialties: [], serviceIds: [] },
  });
  await prisma.client.upsert({
    where: { id: "e2e-client-primary" },
    update: { businessId: business.id },
    create: { id: "e2e-client-primary", businessId: business.id, firstName: "E2E", lastName: "Client", phone: "+12125550101", email: "client@governed-e2e.test", tags: [] },
  });
  await prisma.service.upsert({
    where: { businessId_name: { businessId: business.id, name: "Governed Cut" } },
    update: { duration: 45, price: 75, isActive: true },
    create: { id: "e2e-service-primary", businessId: business.id, name: "Governed Cut", duration: 45, price: 75 },
  });

  const appointments = await prisma.appointment.findMany({ where: { businessId: business.id }, select: { id: true } });
  const appointmentIds = appointments.map(({ id }) => id);
  if (appointmentIds.length) {
    await prisma.integrationDelivery.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    await prisma.appointmentService.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    await prisma.appointment.deleteMany({ where: { id: { in: appointmentIds } } });
  }
  await prisma.activity.deleteMany({ where: { clientId: "e2e-client-primary" } });
  await prisma.auditLog.deleteMany({ where: { businessId: business.id } });
  await prisma.mobileSession.deleteMany({ where: { userId: { in: [owner.id, "e2e-owner-other"] } } });
  await prisma.loginAttempt.deleteMany();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "E2E seed failed");
  process.exitCode = 1;
});
